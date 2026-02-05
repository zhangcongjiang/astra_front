import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { getDynamicList, getDynamicDetail, publishDynamic } from '@/api/modules/dynamicApi.js'
import { getSystemSettings } from '@/api/modules/accountApi'
import { checkServiceStatus as extCheckServiceStatus, openOptions as extOpenOptions, funcPublish as extFuncPublish, funcGetPermission as extGetPermission, getPlatformInfos as extGetPlatformInfos } from '@/utils/extensionMessaging.js'

const staticBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089'

const convertToHttpUrl = (p) => {
  if (!p) return ''
  if (typeof p !== 'string') return ''
  if (p.startsWith('http')) return p
  if (p.startsWith('/media/')) return `${staticBaseUrl}${p}`
  const fileName = p.split(/[\\/]/).pop()
  if (fileName) return `${staticBaseUrl}/media/images/${fileName}`
  return p
}
const inferImageMime = (nameOrType) => {
  const t = String(nameOrType || '').toLowerCase()
  if (t.startsWith('image/')) return t
  if (t.endsWith('.png')) return 'image/png'
  if (t.endsWith('.jpg') || t.endsWith('.jpeg')) return 'image/jpeg'
  if (t.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

export const useAutoPublishDynamicStore = defineStore('autoPublishDynamic', {
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
      window.__autoPublishDynamicRunnerActive = true
    },
    async loadConfig() {
      try {
        const resp = await getSystemSettings({ key: 'auto_publish_dynamic' })
        const raw = (resp?.data?.data) ?? (resp?.data) ?? resp
        const data = raw?.value ?? raw ?? {}
        const arr = data?.dynamic_auto_platforms || []
        if (Array.isArray(arr) && arr.length) {
          this.selectedPlatforms = arr
          localStorage.setItem('autoPublishDynamicPlatforms', JSON.stringify(arr))
        } else {
          const local = localStorage.getItem('autoPublishDynamicPlatforms')
          this.selectedPlatforms = local ? JSON.parse(local) : []
        }
        const seconds = Number((data?.dynamic_auto_interval_seconds ?? data?.dynamic_auto_interval ?? localStorage.getItem('autoPublishDynamicInterval')) || 0)
        if (seconds > 0) {
          this.intervalSec = seconds
          localStorage.setItem('autoPublishDynamicInterval', String(seconds))
        } else {
          const localInterval = Number(localStorage.getItem('autoPublishDynamicInterval') || 600)
          this.intervalSec = localInterval
        }
        const first = data?.dynamic_auto_first_run_time
        if (first) this.firstRunTime = dayjs(first)
        const enabled = data?.dynamic_auto_enabled
        if (typeof enabled === 'boolean') {
          this.enabled = enabled
        } else {
          const localEnabled = localStorage.getItem('autoPublishDynamicEnabled')
          this.enabled = localEnabled === 'true'
        }
      } catch {
        const local = localStorage.getItem('autoPublishDynamicPlatforms')
        this.selectedPlatforms = local ? JSON.parse(local) : []
        const localInterval = Number(localStorage.getItem('autoPublishDynamicInterval') || 600)
        this.intervalSec = localInterval
        const localEnabled = localStorage.getItem('autoPublishDynamicEnabled')
        this.enabled = localEnabled === 'true'
      }
    },
    async loadPlatforms() {
      try {
        let list = await extGetPlatformInfos('DYNAMIC')
        let platforms = Array.isArray(list) ? list : Object.values(list || {})
        if (!platforms.length) {
          const all = await extGetPlatformInfos()
          const arr = Array.isArray(all) ? all : Object.values(all || {})
          platforms = arr.filter((p) => (p.type === 'DYNAMIC' || !p.type))
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
        const resp = await getDynamicList({ page: 1, pageSize: 1, publish: false, ordering: 'create_time', order: 'asc' })
        const results = (resp?.data?.results) || (resp?.results) || []
        const item = results.length ? results[0] : null
        if (!item) {
          this.nextRunTimeLabel = dayjs().add(this.intervalSec, 'second').format('YYYY-MM-DD HH:mm:ss')
          return
        }
        const set = new Set(this.selectedPlatforms)
        const targetPlatforms = (this.platforms || []).filter(p => set.has(p.name))
        if (targetPlatforms.length) {
          const syncPlatforms = targetPlatforms.map(p => ({ name: p.name, platformName: p.platformName, injectUrl: p.injectUrl, faviconUrl: p.faviconUrl, accountKey: p.accountKey, extraConfig: {} }))
          const images = (item.images || []).map((img) => {
            if (typeof img === 'string') {
              return { name: '', url: convertToHttpUrl(img), type: 'image/jpeg', size: 0 }
            } else {
              const name = img.name || img.img_name || ''
              const url = convertToHttpUrl(img.url || img.path || (img.img_name ? `/media/images/${img.img_name}` : ''))
              const type = inferImageMime(img.type || name)
              const size = img.size || 0
              return { name, url, type, size }
            }
          })
          const syncData = {
            platforms: syncPlatforms,
            isAutoPublish: true,
            data: {
              title: item.title || '未命名动态',
              content: (item.content || '').toString(),
              images,
              videos: []
            }
          }
          const id = item.id ?? item.dynamic_id ?? item.dynamicId ?? item.text_id
          if (id) await publishDynamic(id)
          const serviceResp = await extCheckServiceStatus()
          if (serviceResp) {
            const trustResp = await extGetPermission(5000)
            if (!trustResp || trustResp.status !== 'ok' || !trustResp.trusted) {
              await extOpenOptions()
            }
            await extFuncPublish({
              ...syncData,
              autoClose: true,
              autoCloseDelaySec: 60,
              syncCloseTabs: true
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
