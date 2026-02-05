import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import { getTextList, getTextDetail, publishText } from '@/api/modules/textApi'
import { getSystemSettings } from '@/api/modules/accountApi'
import { checkServiceStatus as extCheckServiceStatus, openOptions as extOpenOptions, funcPublish as extFuncPublish, funcGetPermission as extFuncGetPermission, getPlatformInfos as extGetPlatformInfos } from '@/utils/extensionMessaging.js'

const md = new MarkdownIt({ linkify: true, breaks: true })
const staticBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089'

const makeDigest = (markdown) => {
  const safeHtml = DOMPurify.sanitize(md.render(markdown || ''))
  const text = safeHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return text.slice(0, 160)
}
const convertToHttpUrl = (p) => {
  if (!p) return ''
  if (p.startsWith('http')) return p
  if (p.startsWith('/media/')) return `${staticBaseUrl}${p}`
  const fileName = p.split(/[\\/]/).pop()
  if (fileName) return `${staticBaseUrl}/media/images/${fileName}`
  return p
}
const inferMimeFromName = (name) => {
  const n = String(name || '').toLowerCase()
  if (n.endsWith('.png')) return 'image/png'
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg'
  if (n.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}
const extractLocalImages = (markdown) => {
  const files = []
  if (!markdown) return files
  const added = new Set()
  const addByPath = (path) => {
    if (!path) return
    const match = path.match(/\/media\/images\/([^?#)\"\s]+)/)
    if (!match) return
    const name = decodeURIComponent(match[1])
    if (added.has(name)) return
    added.add(name)
    files.push({
      name,
      url: convertToHttpUrl(`/media/images/${name}`),
      type: inferMimeFromName(name),
      size: 0,
    })
  }
  const mdImgRe = /!\[[^\]]*\]\(([^)]+)\)/g
  let m
  while ((m = mdImgRe.exec(markdown)) !== null) addByPath(m[1])
  const htmlImgRe = /src=\"([^\"]+)\"/g
  while ((m = htmlImgRe.exec(markdown)) !== null) addByPath(m[1])
  return files
}

export const useAutoPublishArticleStore = defineStore('autoPublishArticle', {
  state: () => ({
    enabled: false,
    intervalSec: 600,
    firstRunTime: null,
    nextRunTimeLabel: '',
    selectedPlatforms: [],
    platforms: [],
    autoInitialTimeoutId: null,
    autoIntervalId: null,
  }),
  actions: {
    async init() {
      await this.loadConfig()
      await this.loadPlatforms()
      if (this.enabled && this.selectedPlatforms.length && !this.autoIntervalId && !this.autoInitialTimeoutId) {
        await this.start()
      }
      window.__autoPublishArticleRunnerActive = true
    },
    async loadConfig() {
      try {
        const resp = await getSystemSettings({ key: 'auto_publish_article' })
        const raw = (resp?.data?.data) ?? (resp?.data) ?? resp
        const data = raw?.value ?? raw ?? {}
        const arr = data?.article_auto_platforms || []
        if (Array.isArray(arr) && arr.length) {
          this.selectedPlatforms = arr
          localStorage.setItem('autoPublishArticlePlatforms', JSON.stringify(arr))
        } else {
          const local = localStorage.getItem('autoPublishArticlePlatforms')
          this.selectedPlatforms = local ? JSON.parse(local) : []
        }
        const seconds = Number((data?.article_auto_interval_seconds ?? data?.article_auto_interval ?? localStorage.getItem('autoPublishArticleInterval')) || 0)
        if (seconds > 0) {
          this.intervalSec = seconds
          localStorage.setItem('autoPublishArticleInterval', String(seconds))
        } else {
          const localInterval = Number(localStorage.getItem('autoPublishArticleInterval') || 600)
          this.intervalSec = localInterval
        }
        const first = data?.article_auto_first_run_time
        if (first) this.firstRunTime = dayjs(first)
        const enabled = data?.article_auto_enabled
        if (typeof enabled === 'boolean') {
          this.enabled = enabled
        } else {
          const localEnabled = localStorage.getItem('autoPublishArticleEnabled')
          this.enabled = localEnabled === 'true'
        }
      } catch {
        const local = localStorage.getItem('autoPublishArticlePlatforms')
        this.selectedPlatforms = local ? JSON.parse(local) : []
        const localInterval = Number(localStorage.getItem('autoPublishArticleInterval') || 600)
        this.intervalSec = localInterval
        const localEnabled = localStorage.getItem('autoPublishArticleEnabled')
        this.enabled = localEnabled === 'true'
      }
    },
    async loadPlatforms() {
      try {
        let list = await extGetPlatformInfos('ARTICLE')
        let platforms = Array.isArray(list) ? list : Object.values(list || {})
        if (!platforms.length) {
          const all = await extGetPlatformInfos()
          const arr = Array.isArray(all) ? all : Object.values(all || {})
          platforms = arr.filter((p) => (p.type === 'ARTICLE' || !p.type))
        }
        this.platforms = platforms.map((p) => ({
          ...p,
          name: p?.name || p?.platformName || p?.key || p?.id,
        }))
      } catch {
        this.platforms = []
      }
    },
    async start() {
      const intervalSec = Math.max(60, Number(this.intervalSec || 0))
      const first = this.firstRunTime
      const now = dayjs()
      const delayMs = first && first.isAfter(now) ? first.diff(now) : 0
      if (delayMs > 0) {
        this.nextRunTimeLabel = first.format('YYYY-MM-DD HH:mm:ss')
        this.autoInitialTimeoutId = setTimeout(async () => {
          await this.autoPublishOnce()
          this.autoIntervalId = setInterval(this.autoPublishOnce, intervalSec * 1000)
        }, delayMs)
      } else {
        await this.autoPublishOnce()
        this.autoIntervalId = setInterval(this.autoPublishOnce, intervalSec * 1000)
      }
      this.enabled = true
    },
    stop() {
      if (this.autoInitialTimeoutId) {
        clearTimeout(this.autoInitialTimeoutId)
        this.autoInitialTimeoutId = null
      }
      if (this.autoIntervalId) {
        clearInterval(this.autoIntervalId)
        this.autoIntervalId = null
      }
      this.nextRunTimeLabel = ''
      this.enabled = false
    },
    async autoPublishOnce() {
      try {
        const resp = await getTextList({ page: 1, pageSize: 1, publish: false, ordering: 'create_time', order: 'asc' })
        const results = (resp?.data?.results) || (resp?.results) || []
        const item = results.length ? results[0] : null
        if (!item) {
          this.nextRunTimeLabel = dayjs().add(this.intervalSec, 'second').format('YYYY-MM-DD HH:mm:ss')
          return
        }
        const tid = item.id || item.text_id
        let markdown = item.content || ''
        if (!markdown || !markdown.trim()) {
          try {
            const dResp = await getTextDetail(tid)
            const d = dResp?.data || dResp
            markdown = d?.content || ''
          } catch {}
        }
        const rawHtml = md.render(markdown || '')
        const html = DOMPurify.sanitize(rawHtml.replace(/src=\"(\/media\/[^\"]+)\"/g, (m, p1) => `src=\"${convertToHttpUrl(p1)}\"`))
        const digest = makeDigest(markdown || '')
        const extractedImages = extractLocalImages(markdown || '')
        const set = new Set(this.selectedPlatforms)
        const targetPlatforms = (this.platforms || []).filter(p => set.has(p.name))
        if (targetPlatforms.length) {
          const syncPlatforms = targetPlatforms.map(p => ({ name: p.name, platformName: p.platformName, injectUrl: p.injectUrl, faviconUrl: p.faviconUrl, accountKey: p.accountKey, extraConfig: {} }))
          const syncData = {
            platforms: syncPlatforms,
            isAutoPublish: true,
            data: {
              title: item.title || '未命名图文',
              digest,
              htmlContent: html,
              markdownContent: markdown,
              images: extractedImages
            }
          }
          await publishText(tid)
          const serviceResp = await extCheckServiceStatus()
          if (serviceResp) {
            const trustResp = await extFuncGetPermission(5000)
            if (!trustResp || trustResp.status !== 'ok' || !trustResp.trusted) {
              await extOpenOptions()
            }
            await extFuncPublish({
              ...syncData,
              autoClose: true,
              autoCloseDelaySec: 60,
              syncCloseTabs: true,
              preferBackground: true,
              preferNoUI: true
            })
          }
        }
        this.nextRunTimeLabel = dayjs().add(this.intervalSec, 'second').format('YYYY-MM-DD HH:mm:ss')
      } catch {
        this.nextRunTimeLabel = dayjs().add(this.intervalSec, 'second').format('YYYY-MM-DD HH:mm:ss')
      }
    },
  }
})
