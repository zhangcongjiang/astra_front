<template>
  <div class="graphic-list-container">
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="图文标题">
          <a-input v-model:value="searchForm.name" placeholder="输入图文标题" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="选择状态" style="width: 120px">
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option value="published">已发布</a-select-option>
            <a-select-option value="unpublished">未发布</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="来源">
          <a-select v-model:value="searchForm.origin" placeholder="选择来源" style="width: 120px" allowClear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option v-for="origin in originOptions" :key="origin" :value="origin">
              {{ origin }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="用户">
          <UserSelect 
            v-model="searchForm.account" 
            placeholder="选择账号" 
            width="120px"
          />
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker v-model:value="searchForm.dateRange" format="YYYY-MM-DD" :placeholder="['开始时间', '结束时间']" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="button-group" style="margin-left: auto;">
      <a-button type="primary" @click="handleCreate">
        <template #icon><PlusOutlined /></template>
        创建图文
      </a-button>
      <a-button type="primary" @click="handleImport">本地导入</a-button>
      <a-button type="primary" @click="handleUrlImport">URL导入</a-button>
      <!-- 新增：本页全选与批量删除 -->
      <a-button 
        @click="toggleSelectAllCurrentPage" 
        :disabled="currentPageData.length === 0"
      >
        {{ isAllCurrentPageSelected ? '取消全选' : '全选' }}
      </a-button>
      <a-button 
        type="primary" 
        danger 
        @click="handleBatchDelete" 
        :disabled="selectedIds.length === 0"
      >
        批量删除 ({{ selectedIds.length }})
      </a-button>
      <div style="display:inline-flex; align-items:center; gap:8px; margin-left: 12px;">
        <a-popover v-model:open="autoPopoverVisible" placement="leftTop" :overlayStyle="{ maxWidth: 'calc(100vw - 32px)' }" trigger="click">
          <template #content>
            <div style="width: 560px; max-width: calc(100vw - 32px); max-height: 70vh; overflow: auto;">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                <a-switch v-model:checked="autoToutiaoEnabled" :loading="autoToutiaoLoading" @change="toggleAutoToutiao" />
                <span>自动发布（{{ autoPublishIntervalLabel }}）</span>
                <span v-if="autoToutiaoNextRunTime" style="color:#999;">下次执行: {{ autoToutiaoNextRunTime }}</span>
              </div>
              <div style="margin-bottom:8px;">执行周期</div>
              <a-space>
                <a-input-number v-model:value="autoPublishIntervalDays" :min="0" placeholder="天" />
                <a-input-number v-model:value="autoPublishIntervalHours" :min="0" :max="23" placeholder="小时" />
                <a-input-number v-model:value="autoPublishIntervalMinutes" :min="0" :max="59" placeholder="分钟" />
              </a-space>
              <div style="margin-top:12px;">
                <span style="margin-right:8px;">初次执行时间</span>
                <a-date-picker v-model:value="autoFirstTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 220px" />
              </div>
              <div style="margin-top:16px;">同步平台（已配置：{{ selectedAutoPlatformNames }}）</div>
              <div class="platform-grid" style="margin-top:8px;">
                <div
                  v-for="p in dynamicPlatforms"
                  :key="p.name"
                  class="platform-item"
                  :class="{ active: selectedAutoPlatforms.includes(p.name) }"
                  @click="() => {
                    const i = selectedAutoPlatforms.indexOf(p.name);
                    if (i > -1) selectedAutoPlatforms.splice(i, 1); else selectedAutoPlatforms.push(p.name);
                  }"
                >
                  <div class="platform-icon">
                    <img v-if="p.faviconUrl" :src="p.faviconUrl" alt="" style="width:20px;height:20px;" />
                  </div>
                  <div class="platform-name">{{ p.platformName || p.name }}</div>
                  <div class="platform-check" v-if="selectedAutoPlatforms.includes(p.name)">
                    <CheckCircleFilled style="color: #52c41a; font-size: 16px;" />
                  </div>
                </div>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                <a-button type="primary" :loading="autoConfigLoading" @click="saveAutoPublishConfig">保存设置</a-button>
                <a-button @click="autoPopoverVisible=false">关闭</a-button>
              </div>
            </div>
          </template>
          <a-button size="small" @click="openAutoPublishPopover">自动发布</a-button>
        </a-popover>
      </div>
    </div>

    <div class="table-container">
      <a-table 
        :columns="columns" 
        :dataSource="currentPageData" 
        :pagination="false" 
        :loading="loading"
        rowKey="id"
        :rowSelection="rowSelection"
        :customRow="handleRowClick">
        <template #bodyCell="{ column, record }">
          <!-- 新增：封面列渲染 -->
          <template v-if="column.key === 'cover'">
            <div class="cover-cell">
              <img
                v-if="record.coverId && getTextCoverUrl(record)"
                :src="getTextCoverUrl(record)"
                class="cover-thumb"
                alt="封面"
                @click.stop="showRowImagePreview(record)"
              />
              <div v-else class="cover-thumb cover-empty">无封面</div>
            </div>
          </template>
          
          <!-- 修改：标题列仅显示标题文本，不再包含封面缩略图 -->
          <template v-if="column.key === 'title'">
            <div class="title-content">
              <span class="title-text">{{ record.title }}</span>
            </div>
          </template>
          <template v-if="column.key === 'content'">
            <div class="text-content">
              <div class="content-preview">
                <div v-for="(paragraph, index) in record.content.split('\n')" :key="index">
                  <p>{{ paragraph }}</p>
                </div>
              </div>
            </div>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'published' ? 'green' : 'orange'">
              {{ record.status === 'published' ? '已发布' : '未发布' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-buttons">
              <a-button type="link" @click="handleDownload(record)">下载</a-button>
              <a-button type="link" @click="handlePublish(record)">
                发布
              </a-button>
              <!-- 新增：替换封面入口 -->
              <a-button type="link" @click.stop="openCoverReplace(record)">替换封面</a-button>
              <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 图片预览模态框 -->
    <a-modal v-model:open="imagePreviewVisible" title="封面预览" width="90%" style="max-width: 1200px;" :footer="null">
      <img v-if="previewImageUrl" :src="previewImageUrl" alt="封面预览" class="preview-image" />
    </a-modal>
    
    <!-- 新增：封面替换选择弹窗 -->
    <a-modal
      v-model:open="coverReplaceModalVisible"
      title="选择封面图片"
      width="800px"
      :footer="null"
      @cancel="cancelCoverReplace"
    >
      <a-spin :spinning="coverReplaceLoading">
        <div v-if="coverReplaceImages.length > 0" class="cover-select-grid">
          <div
            v-for="img in coverReplaceImages"
            :key="img.resource_id || img.id"
            class="cover-select-item"
          >
            <img :src="img.url" :alt="img.name" style="width: 140px; height: 100px; object-fit: cover; border-radius: 4px;" />
            <div style="margin-top: 8px;">{{ img.name }}</div>
            <div class="cover-select-actions">
              <a-button size="small" type="primary" @click="confirmCoverReplace(img)">设为封面</a-button>
              <a-button size="small" @click="previewImageUrl = img.url; imagePreviewVisible = true;">预览</a-button>
            </div>
          </div>
        </div>
        <div v-else style="text-align: center; color: #999; padding: 24px;">暂无图片，请先向该文章关联图片</div>
      </a-spin>
    </a-modal>
    
    <!-- 新增：发布弹窗 -->
    <a-modal v-model:open="publishModalVisible" title="发布图文" width="960px" :footer="null" @cancel="closePublishModal">
      <div class="publish-modal-content">
        <!-- 图文信息：封面与标题 -->
        <div class="text-info-section">
          <div class="text-info-box">
            <div class="modal-cover" :class="{ clickable: selectedText && selectedText.coverId }" @click="handlePreviewSelectedCover">
              <img
                v-if="selectedText && selectedText.coverId && getTextCoverUrl(selectedText)"
                :src="getTextCoverUrl(selectedText)"
                alt="封面"
              />
              <div v-else class="modal-cover-placeholder">暂无封面</div>
            </div>
            <div class="modal-title">
              {{ (selectedText && selectedText.title) || '未命名图文' }}
            </div>
          </div>
        </div>
        <!-- 平台选择部分 -->
        <div class="platform-section">
          <div class="platform-header" style="margin-bottom:8px; display:flex; align-items:center; gap:12px;">
            <h3 style="margin:0;">选择发布平台</h3>
          </div>
          <div class="platform-grid">
            <div v-for="p in dynamicPlatforms" :key="p.name" class="platform-item"
                 :class="{ active: selectedPlatforms.includes(p.name) }"
                 @click="togglePlatform(p.name)">
              <div class="platform-icon">
                <img v-if="p.faviconUrl" :src="p.faviconUrl" alt="" style="width:20px;height:20px;" />
              </div>
              <div class="platform-name">{{ p.platformName || p.name }}</div>
              <div class="platform-check" v-if="selectedPlatforms.includes(p.name)">
                <CheckCircleFilled style="color: #52c41a; font-size: 16px;" />
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作区域（参考动态发布样式） -->
        <div class="publish-actions">
          <a-switch v-model:checked="isAutoPublish" checked-children="自动" un-checked-children="手动" />
          <a-button type="primary" style="margin-left: 12px" :disabled="selectedPlatforms.length === 0" @click="confirmPublish">开始发布</a-button>
          <a-button style="margin-left: 8px" @click="closePublishModal">取消</a-button>
        </div>
      </div>
    </a-modal>

    <div class="pagination">
      <Pagination 
        v-model:current="pagination.current" 
        v-model:pageSize="pagination.pageSize" 
        :total="pagination.total"
        @change="handlePaginationChange" />
    </div>
    
    <!-- 导入图文对话框 -->
    <!-- 本地导入图文对话框 -->
    <a-modal
      v-model:open="importModalVisible"
      title="本地导入图文"
      :width="600"
      @ok="confirmImport"
      @cancel="cancelImport"
      okText="确认导入"
      cancelText="取消">
      
      <a-form :model="importForm" layout="vertical">
        <a-form-item label="图文标题" required>
          <a-input 
            v-model:value="importForm.title" 
            placeholder="请输入图文标题"
            :maxlength="30"
            show-count />
        </a-form-item>
        
        <a-form-item label="选择文件" required>
          <div class="upload-area">
            <div 
              class="upload-dragger"
              @drop="handleFileDrop"
              @dragover.prevent
              @dragenter.prevent>
              
              <div class="upload-content">
                <div v-if="!importForm.file" class="upload-hint">
                  <!-- 将 a-icon 替换为正确的图标 -->
                  <div style="font-size: 48px; color: #999; margin-bottom: 16px;">📁</div>
                  <p>将 Markdown 文件拖拽到这里</p>
                  <p style="color: #999;">或者</p>
                  <a-button type="primary" @click="() => $refs.fileInput.click()">
                    选择文件
                  </a-button>
                  <p style="color: #999; margin-top: 8px; font-size: 12px;">
                    支持 .md, .markdown 格式
                  </p>
                </div>
                
                <div v-else class="file-selected">
                  <!-- 将 a-icon 替换为正确的图标 -->
                  <div style="font-size: 24px; color: #1890ff; margin-right: 8px;">📄</div>
                  <span>{{ importForm.file.name }}</span>
                  <a-button 
                    type="link" 
                    size="small" 
                    @click="importForm.file = null"
                    style="margin-left: 8px;">
                    重新选择
                  </a-button>
                </div>
              </div>
              
              <input 
                ref="fileInput"
                type="file" 
                accept=".md,.markdown"
                style="display: none;"
                @change="handleFileSelect" />
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- URL导入图文对话框 -->
    <a-modal
      v-model:open="urlImportModalVisible"
      title="URL导入图文"
      :width="600"
      @ok="confirmUrlImport"
      @cancel="cancelUrlImport"
      okText="确认导入"
      cancelText="取消">
      
      <a-form :model="urlImportForm" layout="vertical">
        <a-form-item label="平台来源" required>
          <a-radio-group v-model:value="urlImportForm.origin">
            <a-radio value="今日头条">今日头条</a-radio>
            <a-radio value="微信公众号">微信公众号</a-radio>
            <a-radio value="虎扑">虎扑</a-radio>
            <a-radio value="汽车之家">汽车之家</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="网络地址" required>
          <a-input 
            v-model:value="urlImportForm.url" 
            placeholder="请输入对应平台的内容链接" />
        </a-form-item>
      </a-form>
    </a-modal>
    
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination.vue';
import UserSelect from '@/components/UserSelect.vue';
import { 
  getTextList, 
  getTextDetail,
  deleteText, 
  downloadText, 
  uploadMarkdown,
  importFromUrl,
  replaceTextCover,
  batchDeleteTexts,
  publishText
} from '@/api/modules/textApi';
import { getImageDetail } from '@/api/modules/imageApi.js';
import { getAssetCollectionDetail } from '@/api/modules/assetApi.js';
import { CheckCircleFilled } from '@ant-design/icons-vue';
import {
  checkServiceStatus as extCheckServiceStatus,
  openOptions as extOpenOptions,
  funcPublish as extFuncPublish,
  funcGetPermission as extFuncGetPermission,
  getPlatformInfos as extGetPlatformInfos,
} from '@/utils/extensionMessaging.js';
import { getSystemSettings, updateSystemSettings } from '@/api/modules/accountApi';
// 新增：Markdown 渲染与 HTML 净化
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { useAutoPublishArticleStore } from '@/stores/autoPublishArticle'

// 初始化 MarkdownIt 实例与摘要生成方法
const md = new MarkdownIt({ linkify: true, breaks: true });
const staticBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089';
const makeDigest = (markdown) => {
  const safeHtml = DOMPurify.sanitize(md.render(markdown || ''));
  const text = safeHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 160);
};
// 将 /media/... 路径转换为可访问的 HTTP URL
const convertToHttpUrl = (p) => {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  if (p.startsWith('/media/')) return `${staticBaseUrl}${p}`;
  const fileName = p.split(/[\\/]/).pop();
  if (fileName) return `${staticBaseUrl}/media/images/${fileName}`;
  return p;
};
// 从 Markdown 中提取本地图片，生成 FileData 数组
const extractLocalImages = (markdown) => {
  const files = [];
  if (!markdown) return files;
  const added = new Set();
  const addByPath = (path) => {
    if (!path) return;
    // 仅处理 /media/images/ 开头的路径
    const match = path.match(/\/media\/images\/([^?#)\"\s]+)/);
    if (!match) return;
    const name = decodeURIComponent(match[1]);
    if (added.has(name)) return;
    added.add(name);
    files.push({
      name,
      url: convertToHttpUrl(`/media/images/${name}`),
      type: inferMimeFromName(name),
      size: 0,
    });
  };
  // ![alt](/media/images/file.png)
  const mdImgRe = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = mdImgRe.exec(markdown)) !== null) {
    addByPath(m[1]);
  }
  // <img src="/media/images/file.png">
  const htmlImgRe = /src=\"([^\"]+)\"/g;
  while ((m = htmlImgRe.exec(markdown)) !== null) {
    addByPath(m[1]);
  }
  return files;
};

const router = useRouter();
const autoPublishArticleStore = useAutoPublishArticleStore()

// 本地导入弹窗与表单状态
const importModalVisible = ref(false);
const importType = ref('file');
const importForm = reactive({
  title: '',
  file: null,
  url: ''
});
const urlPreview = reactive({
  loading: false,
  title: '',
  content: ''
});

// 点击“本地导入”打开导入弹窗
const handleImport = () => {
  importModalVisible.value = true;
  // 重置表单状态
  importType.value = 'file';
  importForm.title = '';
  importForm.file = null;
  importForm.url = '';
  urlPreview.loading = false;
  urlPreview.title = '';
  urlPreview.content = '';
};

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
});
// 在 script setup 中定义来源选项
const originOptions = [
'用户创建',
'本地导入', 
'今日头条',
'微信公众号',
'虎扑',
'汽车之家'
];

// 搜索表单
const searchForm = reactive({
  name: '',
  dateRange: [],
  status: undefined,
  account: undefined,
  origin: undefined  // 新增来源筛选
});

// 封面详情缓存与预览状态
const coverDetails = reactive({}); // 以 record.id 为键存储封面详情
const imagePreviewVisible = ref(false);
const previewImageUrl = ref('');

// 图文数据
const textList = ref([]);
const loading = ref(false);
// 新增：发布相关状态
const publishModalVisible = ref(false);
const selectedText = ref(null);
const selectedPlatforms = ref([]);
const dynamicPlatforms = ref([]);
const isAutoPublish = ref(false);
const autoToutiaoEnabled = ref(false);
const autoToutiaoLoading = ref(false);
const autoToutiaoNextRunTime = ref('');
const autoPublishConfigVisible = ref(false);
const autoPopoverVisible = ref(false);
const selectedAutoPlatforms = ref([]);
const autoConfigLoading = ref(false);
const autoPublishIntervalDays = ref(0);
const autoPublishIntervalHours = ref(0);
const autoPublishIntervalMinutes = ref(10);
const autoFirstTime = ref(null);
const autoPublishIntervalLabel = computed(() => {
  const d = Number(autoPublishIntervalDays.value) || 0;
  const h = Number(autoPublishIntervalHours.value) || 0;
  const m = Number(autoPublishIntervalMinutes.value) || 0;
  const parts = [];
  if (d) parts.push(`${d}天`);
  if (h) parts.push(`${h}小时`);
  if (m || parts.length === 0) parts.push(`${m}分钟`);
  return parts.join('');
});
const calculateInterval = () => {
  const days = Number(autoPublishIntervalDays.value) || 0;
  const hours = Number(autoPublishIntervalHours.value) || 0;
  const minutes = Number(autoPublishIntervalMinutes.value) || 0;
  return days * 86400 + hours * 3600 + minutes * 60;
};
const selectedAutoPlatformNames = computed(() => {
  const set = new Set(selectedAutoPlatforms.value);
  const names = (dynamicPlatforms.value || []).filter(p => set.has(p.name)).map(p => p.platformName || p.name);
  return names.length ? names.join('、') : '未配置';
});
const openAutoPublishPopover = async () => {
  autoPopoverVisible.value = true;
  await loadAutoPublishConfig();
};

const normalizePlatforms = (raw) => {
  let arr = Array.isArray(raw) ? raw : Object.values(raw || {});
  return (arr || []).map((p) => ({
    ...p,
    name: p?.name || p?.platformName || p?.key || p?.id,
  }));
};

const loadPlatformsForPublish = async () => {
  try {
    let list = await extGetPlatformInfos('ARTICLE');
    let platforms = normalizePlatforms(list);
    if (!platforms.length) {
      const all = await extGetPlatformInfos();
      platforms = normalizePlatforms(all).filter((p) => (p.type === 'ARTICLE' || !p.type));
    }
    dynamicPlatforms.value = platforms;
  } catch (_) {
    dynamicPlatforms.value = [];
  }
};

onMounted(() => {
  loadPlatformsForPublish();
  loadAutoPublishConfig();
});
// 恢复：平台选择函数
const togglePlatform = (platformKey) => {
  const index = selectedPlatforms.value.indexOf(platformKey);
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1);
  } else {
    selectedPlatforms.value.push(platformKey);
  }
};


const openOptions = async (timeout = 5000) => {
  try {
    const resp = await extOpenOptions(timeout);
    return resp;
  } catch (error) {
    console.error('Failed to open extension options:', error);
    return null;
  }
};

const requestDomainTrust = async (timeout = 5000) => {
  try {
    const resp = await extFuncGetPermission(timeout);
    return resp;
  } catch (error) {
    console.error('Domain trust request failed:', error);
    return { status: 'error', trusted: false };
  }
};

// 预览当前选择的图文封面
const handlePreviewSelectedCover = async () => {
  const rec = selectedText.value;
  if (!rec) return;
  if (!getTextCoverUrl(rec) && rec.coverId) {
    await loadCoverDetailForText(rec);
  }
  const url = getTextCoverUrl(rec);
  if (url) {
    previewImageUrl.value = url;
    imagePreviewVisible.value = true;
  }
};

const autoInitialTimeoutId = ref(null);
const autoIntervalId = ref(null);

const pickEarliestUnpublishedText = async () => {
  const resp = await getTextList({ page: 1, pageSize: 1, publish: false, ordering: 'create_time', order: 'asc' });
  const results = (resp?.data?.results) || (resp?.results) || [];
  return results.length ? results[0] : null;
};

const autoPublishOnce = async () => {
  try {
    const item = await pickEarliestUnpublishedText();
    if (!item) {
      autoToutiaoNextRunTime.value = dayjs().add(calculateInterval(), 'second').format('YYYY-MM-DD HH:mm:ss');
      return;
    }
    const tid = item.id || item.text_id;
    let markdown = item.content || '';
    if (!markdown || !markdown.trim()) {
      try {
        const resp = await getTextDetail(tid);
        const d = resp?.data || resp;
        markdown = d?.content || '';
      } catch {}
    }
    const rawHtml = md.render(markdown || '');
    const html = DOMPurify.sanitize(rawHtml.replace(/src=\"(\/media\/[^\"]+)\"/g, (m, p1) => `src=\"${convertToHttpUrl(p1)}\"`));
    const digest = makeDigest(markdown || '');
    const cover = null; // 可按需启用封面
    const extractedImages = extractLocalImages(markdown || '');
    const set = new Set(selectedAutoPlatforms.value);
    const targetPlatforms = (dynamicPlatforms.value || []).filter(p => set.has(p.name));
    if (targetPlatforms.length) {
      const syncPlatforms = targetPlatforms.map(p => ({ name: p.name, platformName: p.platformName, injectUrl: p.injectUrl, faviconUrl: p.faviconUrl, accountKey: p.accountKey, extraConfig: {} }));
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
      };
      await publishText(tid);
      const serviceResp = await extCheckServiceStatus();
      if (!serviceResp) {
        message.error('扩展服务未运行，已仅标记发布');
      } else {
        const trustResp = await requestDomainTrust(5000);
        if (!trustResp || trustResp.status !== 'ok' || !trustResp.trusted) {
          await openOptions();
          message.info('请在扩展设置页授权当前域名后，自动发布继续');
        }
        await extFuncPublish({
          ...syncData,
          autoClose: true,
          autoCloseDelaySec: 60,
          syncCloseTabs: true,
          preferBackground: true,
          preferNoUI: true
        });
      }
    }
    autoToutiaoNextRunTime.value = dayjs().add(calculateInterval(), 'second').format('YYYY-MM-DD HH:mm:ss');
  } catch (err) {
    console.error('自动发布执行失败:', err);
    autoToutiaoNextRunTime.value = dayjs().add(calculateInterval(), 'second').format('YYYY-MM-DD HH:mm:ss');
  }
};

const startAutoPublishSchedule = async () => {
  const intervalSec = Math.max(60, calculateInterval());
  const first = autoFirstTime.value ? dayjs(autoFirstTime.value) : null;
  const now = dayjs();
  const delayMs = first && first.isAfter(now) ? first.diff(now) : 0;
  if (delayMs > 0) {
    autoToutiaoNextRunTime.value = first.format('YYYY-MM-DD HH:mm:ss');
    autoInitialTimeoutId.value = setTimeout(async () => {
      await autoPublishOnce();
      autoIntervalId.value = setInterval(autoPublishOnce, intervalSec * 1000);
    }, delayMs);
  } else {
    await autoPublishOnce();
    autoIntervalId.value = setInterval(autoPublishOnce, intervalSec * 1000);
  }
  autoToutiaoEnabled.value = true;
};

const stopAutoPublishSchedule = () => {
  if (autoInitialTimeoutId.value) {
    clearTimeout(autoInitialTimeoutId.value);
    autoInitialTimeoutId.value = null;
  }
  if (autoIntervalId.value) {
    clearInterval(autoIntervalId.value);
    autoIntervalId.value = null;
  }
  autoToutiaoNextRunTime.value = '';
  autoToutiaoEnabled.value = false;
};

const toggleAutoToutiao = async (val) => {
  try {
    autoToutiaoLoading.value = true;
    if (val) {
      if (!selectedAutoPlatforms.value.length) {
        message.warning('请先在“配置自动平台”中选择至少一个平台');
        autoToutiaoEnabled.value = false;
        autoToutiaoLoading.value = false;
        return;
      }
    }
    if (window.__autoPublishArticleRunnerActive) {
      if (val) {
        await autoPublishArticleStore.start()
      } else {
        autoPublishArticleStore.stop()
      }
    } else {
      if (val) {
        await startAutoPublishSchedule();
      } else {
        stopAutoPublishSchedule();
      }
    }
    try {
      await updateSystemSettings({
        key: 'auto_publish_article',
        value: { article_auto_enabled: !!val }
      });
      localStorage.setItem('autoPublishArticleEnabled', String(!!val));
    } catch {}
    message.success(val ? '已开启自动发布' : '已关闭自动发布');
  } catch (e) {
    message.error(e?.message || '自动发布切换失败');
  } finally {
    autoToutiaoLoading.value = false;
  }
};

const openAutoConfig = async () => {
  autoPublishConfigVisible.value = true;
  await loadAutoPublishConfig();
};

const loadAutoPublishConfig = async () => {
  try {
    autoConfigLoading.value = true;
    const resp = await getSystemSettings({ key: 'auto_publish_article' });
    const raw = (resp?.data?.data) ?? (resp?.data) ?? resp;
    const data = raw?.value ?? raw ?? {};
    const arr = data?.article_auto_platforms || [];
    if (Array.isArray(arr) && arr.length) {
      selectedAutoPlatforms.value = arr;
      localStorage.setItem('autoPublishArticlePlatforms', JSON.stringify(arr));
    } else {
      const local = localStorage.getItem('autoPublishArticlePlatforms');
      selectedAutoPlatforms.value = local ? JSON.parse(local) : [];
    }
    const seconds = Number((data?.article_auto_interval_seconds ?? data?.article_auto_interval ?? localStorage.getItem('autoPublishArticleInterval')) || 0);
    if (seconds > 0) {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      autoPublishIntervalDays.value = d;
      autoPublishIntervalHours.value = h;
      autoPublishIntervalMinutes.value = m;
      localStorage.setItem('autoPublishArticleInterval', String(seconds));
    } else {
      const localInterval = Number(localStorage.getItem('autoPublishArticleInterval') || 600);
      const d = Math.floor(localInterval / 86400);
      const h = Math.floor((localInterval % 86400) / 3600);
      const m = Math.floor((localInterval % 3600) / 60);
      autoPublishIntervalDays.value = d;
      autoPublishIntervalHours.value = h;
      autoPublishIntervalMinutes.value = m;
    }
    const first = data?.article_auto_first_run_time;
    if (first) {
      autoFirstTime.value = dayjs(first);
    }
    const enabled = data?.article_auto_enabled;
    if (typeof enabled === 'boolean') {
      autoToutiaoEnabled.value = enabled;
      if (enabled && selectedAutoPlatforms.value.length && !autoIntervalId.value && !autoInitialTimeoutId.value && !window.__autoPublishArticleRunnerActive) {
        await startAutoPublishSchedule();
      }
    } else {
      const localEnabled = localStorage.getItem('autoPublishArticleEnabled');
      if (localEnabled === 'true' && selectedAutoPlatforms.value.length && !autoIntervalId.value && !autoInitialTimeoutId.value && !window.__autoPublishArticleRunnerActive) {
        autoToutiaoEnabled.value = true;
        await startAutoPublishSchedule();
      }
    }
    if (window.__autoPublishArticleRunnerActive) {
      autoToutiaoNextRunTime.value = autoPublishArticleStore.nextRunTimeLabel || ''
    }
  } catch (e) {
    const local = localStorage.getItem('autoPublishArticlePlatforms');
    selectedAutoPlatforms.value = local ? JSON.parse(local) : [];
    const localInterval = Number(localStorage.getItem('autoPublishArticleInterval') || 600);
    const d = Math.floor(localInterval / 86400);
    const h = Math.floor((localInterval % 86400) / 3600);
    const m = Math.floor((localInterval % 3600) / 60);
    autoPublishIntervalDays.value = d;
    autoPublishIntervalHours.value = h;
    autoPublishIntervalMinutes.value = m;
  } finally {
    autoConfigLoading.value = false;
  }
};

const saveAutoPublishConfig = async () => {
  try {
    autoConfigLoading.value = true;
    const seconds = calculateInterval();
    const payload = {
      key: 'auto_publish_article',
      value: {
        article_auto_platforms: selectedAutoPlatforms.value,
        article_auto_interval_seconds: seconds,
        article_auto_first_run_time: (autoFirstTime.value ? dayjs(autoFirstTime.value).format('YYYY-MM-DD HH:mm:ss') : ''),
        article_auto_enabled: !!autoToutiaoEnabled.value
      }
    };
    await updateSystemSettings(payload);
    localStorage.setItem('autoPublishArticlePlatforms', JSON.stringify(selectedAutoPlatforms.value));
    localStorage.setItem('autoPublishArticleInterval', String(seconds));
    localStorage.setItem('autoPublishArticleEnabled', String(!!autoToutiaoEnabled.value));
    autoPublishConfigVisible.value = false;
    autoPopoverVisible.value = false;
    message.success('自动发布平台配置已保存');
  } catch (e) {
    localStorage.setItem('autoPublishArticlePlatforms', JSON.stringify(selectedAutoPlatforms.value));
    localStorage.setItem('autoPublishArticleInterval', String(calculateInterval()));
    localStorage.setItem('autoPublishArticleEnabled', String(!!autoToutiaoEnabled.value));
    autoPublishConfigVisible.value = false;
    autoPopoverVisible.value = false;
    message.success('已保存到本地配置');
  } finally {
    autoConfigLoading.value = false;
  }
};
// 获取图文列表数据
const fetchData = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize
    };
    // 添加搜索条件
    if (searchForm.name) params.title = searchForm.name;
    if (searchForm.account) params.creator = searchForm.account;
    if (searchForm.status !== undefined) params.publish = searchForm.status === 'published';
    if (searchForm.origin !== undefined) params.origin = searchForm.origin;
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const [start, end] = searchForm.dateRange;
      params.start_time = start.format('YYYY-MM-DDTHH:mm:ss');
      params.end_time = end.format('YYYY-MM-DDTHH:mm:ss');
    }

    const response = await getTextList(params);

    let dataList = [];
    if (response && response.data && response.data.results) {
      dataList = response.data.results;
      pagination.total = response.data.count || dataList.length;
    }

    // 转换数据格式，加入 coverId
    textList.value = dataList.map(item => ({
      id: item.id,
      title: item.title || '无标题',
      content: item.content || '',
      status: item.publish ? 'published' : 'unpublished',
      createTime: item.create_time || new Date().toISOString(),
      account: item.username,
      origin: item.origin || '未知来源',
      coverId: item.cover_id || null
    }));
  } catch (error) {
    console.error('获取图文列表失败:', error);
    message.error('获取图文列表失败');
    textList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};


// 当前页数据
const currentPageData = computed(() => textList.value);

// 监听当前页数据，预取封面详情
watch(currentPageData, (rows) => {
  rows.forEach((record) => {
    if (record.coverId && !coverDetails[record.id]) {
      loadCoverDetailForText(record);
    }
  });
}, { immediate: true });

// 加载某条图文的封面详情
const loadCoverDetailForText = async (record) => {
  const coverId = record.coverId;
  if (!coverId) return;
  try {
    const response = await getImageDetail(coverId);
    coverDetails[record.id] = response?.data || response;
  } catch (error) {
    console.error('获取封面详情失败:', error);
    if (coverId) {
      coverDetails[record.id] = { img_name: `${coverId}.png`, id: coverId };
    }
  }
};

// 生成封面图片 URL
const getTextCoverUrl = (record) => {
  const detail = coverDetails[record.id];
  if (!detail?.img_name) return '';
  return `${staticBaseUrl}/media/images/${detail.img_name}`;
};

// 新增：封面替换弹窗状态与方法
const coverReplaceModalVisible = ref(false);
const coverReplaceLoading = ref(false);
const coverReplaceImages = ref([]);
const coverReplaceRecord = ref(null);

// 打开封面替换弹窗，加载资产内图片
const openCoverReplace = async (record) => {
  coverReplaceRecord.value = record;
  coverReplaceModalVisible.value = true;
  coverReplaceLoading.value = true;
  try {
    const resp = await getAssetCollectionDetail(record.id);
    const rawImages = (resp?.data?.images || resp?.images || []);
    coverReplaceImages.value = rawImages
      .filter(item => item.asset_type === 'image')
      .map(item => ({
        id: item.id,
        resource_id: item.resource_id,
        name: item?.resource_detail?.name || item.resource_id,
        url: item?.resource_detail?.url,
        width: item?.resource_detail?.width,
        height: item?.resource_detail?.height,
        format: item?.resource_detail?.format
      }));
  } catch (error) {
    console.error('加载资产图片失败:', error);
    message.error('加载资产图片失败');
    coverReplaceImages.value = [];
  } finally {
    coverReplaceLoading.value = false;
  }
};

// 取消封面替换
const cancelCoverReplace = () => {
  coverReplaceModalVisible.value = false;
  coverReplaceImages.value = [];
  coverReplaceRecord.value = null;
};

// 确认替换封面
const confirmCoverReplace = async (img) => {
  if (!coverReplaceRecord.value || !img) return;
  try {
    coverReplaceLoading.value = true;
    const resp = await replaceTextCover(coverReplaceRecord.value.id, img.resource_id);
    if (resp?.code === 0) {
      message.success('封面替换成功');
      // 更新行数据的封面ID并刷新封面详情
      coverReplaceRecord.value.coverId = img.resource_id;
      await loadCoverDetailForText(coverReplaceRecord.value);
      coverReplaceModalVisible.value = false;
    } else {
      message.error(resp?.message || resp?.msg || '封面替换失败');
    }
  } catch (error) {
    console.error('封面替换失败:', error);
    message.error('封面替换失败');
  } finally {
    coverReplaceLoading.value = false;
  }
};

// 新增：封面发布信息
const inferMimeFromName = (name) => {
  const ext = (name || '').split('.').pop()?.toLowerCase();
  if (!ext) return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  return `image/${ext}`;
};

const getTextCoverPublishInfo = (record) => {
  const detail = coverDetails[record.id];
  const url = getTextCoverUrl(record);
  if (!detail || !url) return null;
  const name = detail.img_name || 'cover.png';
  const fmt = (detail?.spec?.format || '').toLowerCase();
  const type = fmt
    ? (fmt === 'jpg' || fmt === 'jpeg' ? 'image/jpeg'
      : fmt === 'png' ? 'image/png'
      : fmt === 'gif' ? 'image/gif'
      : fmt === 'webp' ? 'image/webp'
      : `image/${fmt}`)
    : inferMimeFromName(name);
  const size = detail?.spec?.size || 0;
  return { name, url, type, size };
};
// 显示当前行的图片预览
const showRowImagePreview = async (record) => {
  if (!getTextCoverUrl(record) && record.coverId) {
    await loadCoverDetailForText(record);
  }
  const url = getTextCoverUrl(record);
  if (url) {
    previewImageUrl.value = url;
    imagePreviewVisible.value = true;
  }
};

// 唯一账号列表
// 移除 uniqueAccounts 计算属性，因为现在使用 UserSelect 组件
// const uniqueAccounts = computed(() => {
//   const accounts = new Set(textList.value.map(item => item.account));
//   return Array.from(accounts);
// });

// 表格列配置
const columns = [
  {
    title: '序号',
    dataIndex: 'index',
    width: '50px',
    align: 'center',
    customRender: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
  },
  // 新增：封面列，位于序号与标题之间
  {
    title: '封面',
    dataIndex: 'cover',
    key: 'cover',
    width: '90px',
    align: 'center',
  },
  {
    title: '图文标题',
    dataIndex: 'title',
    key: 'title',
    width: '300px',
    ellipsis: true,
  },
  {
    title: '来源',
    dataIndex: 'origin',
    key: 'origin',
    width: '120px',
    align: 'center',
    ellipsis: true
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: '100px',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '120px',
    align: 'center',
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '用户',
    dataIndex: 'account',
    key: 'account',
    align: 'center',
    width: '120px',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'action',
    width: '280px',
    align: 'center',
  },
];

// 行点击处理
const handleRowClick = (record) => {
  return {
    onClick: (event) => {
      // 检查点击的元素是否在操作列内
      const target = event.target;
      const actionColumn = target.closest('.action-buttons');
      
      // 如果点击的是操作列，则不执行跳转
      if (actionColumn) {
        return;
      }
      
      // 否则跳转到编辑页面
      router.push({
        name: 'GraphicTextCreate',
        params: { id: record.id }
      });
    }
  };
};

// 删除图文
const handleDelete = (record) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条图文吗？',
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteText(record.id);
        // 移除选中状态中的该ID（若存在）
        const idx = selectedIds.value.indexOf(record.id);
        if (idx > -1) selectedIds.value.splice(idx, 1);
        message.success('删除成功');
        fetchData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
};

// 下载图文
const handleDownload = async (record) => {
  try {
    message.loading({ content: '正在下载...', key: 'download', duration: 0 });
    await downloadText(record.id, record.title);
    message.success({ content: '下载成功', key: 'download' });
  } catch (error) {
    console.error('下载失败:', error);
    message.error({ content: '下载失败', key: 'download' });
  }
};

// 发布图文
const handlePublish = async (record) => {
  try {
    selectedText.value = record;
    selectedPlatforms.value = [];
    // 已移除：初始化标签逻辑，不再需要 tags
    // 若列表项不含 content（Markdown），则拉取详情
    if (!record.content || record.content.trim() === '') {
      const resp = await getTextDetail(record.id);
      const detail = resp?.data || resp?.results || resp;
      if (detail && typeof detail.content === 'string') {
        selectedText.value = { ...record, content: detail.content };
      }
    }
    // 预加载封面详情
    if (record.coverId && !coverDetails[record.id]) {
      await loadCoverDetailForText(record);
    }
    await loadPlatformsForPublish();
    publishModalVisible.value = true;
  } catch (error) {
    console.error('打开发布弹窗失败:', error);
    message.error('打开发布弹窗失败');
  }
};

// 新增：执行发布
const confirmPublish = async () => {
  // 点击发布后立即关闭弹窗
  publishModalVisible.value = false;

  if (!selectedText.value) {
    message.warning('未选择图文');
    return;
  }
  if (!selectedPlatforms.value.length) {
    message.warning('请选择至少一个平台');
    return;
  }
  // 已移除：标签必填校验
  try {
    message.info('作品发布中');
    await publishText(selectedText.value.id);

    const serviceResp = await extCheckServiceStatus();
    if (!serviceResp) {
      message.error('扩展服务未运行，请先启动扩展');
      return;
    }

    const trustResp = await requestDomainTrust(5000);
    if (!trustResp || trustResp.status !== 'ok' || !trustResp.trusted) {
      await openOptions();
      message.info('请在扩展设置页授权当前域名后，系统将自动继续');
    }

    const selectedSet = new Set(selectedPlatforms.value);
    const targetPlatforms = (dynamicPlatforms.value || []).filter(p => selectedSet.has(p.name));
    if (!targetPlatforms.length) {
      message.error('未匹配到选中的平台');
      return;
    }

    await new Promise(r => setTimeout(r, 1000));

    const syncPlatforms = targetPlatforms.map(p => ({ name: p.name, platformName: p.platformName, injectUrl: p.injectUrl, faviconUrl: p.faviconUrl, accountKey: p.accountKey, extraConfig: {} }));
    const cover = getTextCoverPublishInfo(selectedText.value);

    // 兜底：确保有 Markdown 内容
    let markdown = selectedText.value.content || '';
    if (!markdown || markdown.trim() === '') {
      try {
        const resp = await getTextDetail(selectedText.value.id);
        const detail = resp?.data || resp?.results || resp;
        if (detail && typeof detail.content === 'string') {
          markdown = detail.content;
        }
      } catch (e) {
        console.warn('兜底拉取详情失败：', e);
      }
    }
    const rawHtml = md.render(markdown);
    const sanitizedHtml = DOMPurify.sanitize(
      rawHtml.replace(/src=\"(\/media\/[^\"]+)\"/g, (m, p1) => `src=\"${convertToHttpUrl(p1)}\"`)
    );
    const inlineLocalImages = async (htmlStr) => {
      const map = new Map();
      const re = /<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi;
      let m;
      const urls = new Set();
      while ((m = re.exec(htmlStr)) !== null) {
        const u = m[1];
        if (u.includes('/media/')) urls.add(u);
      }
      const toAbs = (u) => {
        if (u.startsWith('http')) return u;
        if (u.startsWith('/')) return `${window.location.origin}${u}`;
        return u;
      };
      for (const u of urls) {
        try {
          const resp = await fetch(toAbs(u), { credentials: 'include' });
          const blob = await resp.blob();
          const dataUrl = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });
          map.set(u, dataUrl);
        } catch {}
      }
      if (map.size === 0) return htmlStr;
      let out = htmlStr;
      for (const [k, v] of map.entries()) {
        out = out.split(k).join(v);
      }
      return out;
    };
    const html = await inlineLocalImages(sanitizedHtml);
    const digest = makeDigest(markdown);
    const baseImages = Array.isArray(selectedText.value.images) ? selectedText.value.images : [];
    const extractedImages = extractLocalImages(markdown);
    const imageMap = new Map();
    const pushImage = (img) => { if (!img) return; const key = img.name || img.url; if (!imageMap.has(key)) imageMap.set(key, img); };
    baseImages.forEach(pushImage);
    extractedImages.forEach(pushImage);
    const images = Array.from(imageMap.values());

    const syncData = {
      platforms: syncPlatforms,
      isAutoPublish: isAutoPublish.value,
      data: {
        title: selectedText.value.title || '未命名图文',
        digest,
        // cover,
        htmlContent: html,
        markdownContent: markdown,
        images
        // 已移除：tags 字段
      }
    };

    await extFuncPublish({
      ...syncData,
      autoClose: true,
      autoCloseDelaySec: 5,
      syncCloseTabs: true,
      preferBackground: true,
      preferNoUI: true
    });
    message.success(`发布请求已发送到扩展（${syncPlatforms.length}个平台），请在新标签页查看扩展自动填充`);
    fetchData();
  } catch (e) {
    console.error('发布异常:', e);
    message.error(e?.message || '发布异常');
  } finally {
    selectedText.value = null;
    selectedPlatforms.value = [];
    // 已移除：publishTagList 重置
  }
};

// 新增：关闭发布弹窗
const closePublishModal = () => {
  publishModalVisible.value = false;
  selectedText.value = null;
  selectedPlatforms.value = [];
};
// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    // 检查文件类型
    const allowedTypes = ['.md', '.markdown'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
      message.error('请选择 .md 或 .markdown 格式的文件');
      event.target.value = ''; // 清空input
      return;
    }
    
    importForm.file = file;
    
    // 如果标题为空，使用文件名作为默认标题
    if (!importForm.title.trim()) {
      const nameWithoutExt = file.name.replace(/\.(md|markdown)$/i, '');
      importForm.title = nameWithoutExt;
    }
  }
};

// 处理文件拖拽
const handleFileDrop = (event) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  
  if (files.length > 0) {
    const file = files[0];
    
    // 检查文件类型
    const allowedTypes = ['.md', '.markdown'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
      message.error('请选择 .md 或 .markdown 格式的文件');
      return;
    }
    
    importForm.file = file;
    
    // 如果标题为空，使用文件名作为默认标题
    if (!importForm.title.trim()) {
      const nameWithoutExt = file.name.replace(/\.(md|markdown)$/i, '');
      importForm.title = nameWithoutExt;
    }
  }
};

// URL导入表单数据
const urlImportForm = reactive({
  url: '',
  origin: 'toutiao'  // 默认选择今日头条
});
const urlImportModalVisible = ref(false);

// URL导入方法
const handleUrlImport = () => {
  urlImportModalVisible.value = true;
};

// 确认URL导入
const confirmUrlImport = async () => {
  if (!urlImportForm.origin) {
    message.error('请选择平台来源');
    return;
  }
  
  if (!urlImportForm.url.trim()) {
    message.error('请输入网络地址');
    return;
  }
  
  try {
    message.loading({ content: '正在从网络导入...', key: 'urlImport', duration: 0 });
    
    const res = await importFromUrl(urlImportForm.url.trim(), urlImportForm.origin);
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    
    message.success({ content: '导入成功', key: 'urlImport' });
    urlImportModalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('URL导入失败:', error);
    message.error({ content: error.message || 'URL导入失败', key: 'urlImport' });
  }
};

// 取消URL导入
const cancelUrlImport = () => {
  urlImportModalVisible.value = false;
  urlImportForm.url = '';
  urlImportForm.origin = 'toutiao';  // 重置为默认值
};



// 修改确认导入方法
const confirmImport = async () => {
  if (!importForm.title.trim()) {
    message.error('请输入图文标题');
    return;
  }
  
  if (importType.value === 'file') {
    // 文件导入逻辑
    if (!importForm.file) {
      message.error('请选择要导入的文件');
      return;
    }
    
    try {
      message.loading({ content: '正在导入...', key: 'import', duration: 0 });
      
      await uploadMarkdown(importForm.file, importForm.title.trim(), (progress) => {
        console.log('上传进度:', progress);
      });
      
      message.success({ content: '导入成功', key: 'import' });
      importModalVisible.value = false;
      fetchData();
    } catch (error) {
      console.error('导入失败:', error);
      message.error({ content: error.message || '导入失败', key: 'import' });
    }
  } else {
    // URL导入逻辑
    if (!importForm.url.trim()) {
      message.error('请输入要导入的网络地址');
      return;
    }
    
    try {
      message.loading({ content: '正在从网络导入...', key: 'import', duration: 0 });
      
      await importFromUrl(importForm.url.trim(), importForm.title.trim());
      
      message.success({ content: '导入成功', key: 'import' });
      importModalVisible.value = false;
      fetchData();
    } catch (error) {
      console.error('URL导入失败:', error);
      message.error({ content: error.message || 'URL导入失败', key: 'import' });
    }
  }
};

// 修改取消导入方法
const cancelImport = () => {
  importModalVisible.value = false;
  importForm.title = '';
  importForm.file = null;
  importForm.url = '';  // 重置URL
  importType.value = 'file';
  urlPreview.loading = false;
  urlPreview.title = '';
  urlPreview.content = '';
};

// 移除原来的 uploadFile 函数，因为已经被 confirmImport 替代
// 创建图文
const handleCreate = () => {
  router.push({ name: 'GraphicTextCreate' });
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

// 重置搜索
const resetSearch = () => {
  searchForm.name = '';
  searchForm.dateRange = [];
  searchForm.status = undefined;
  searchForm.account = undefined;
  searchForm.origin = undefined;  // 重置来源筛选
  handleSearch();
};

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.current = current;
  pagination.pageSize = pageSize;
  fetchData();
};

// 初始化数据
onMounted(() => {
  fetchData();
});
// 新增：批量选择与批量删除状态与方法
const selectedIds = ref([]);
const currentPageIds = computed(() => (currentPageData.value || []).map(r => r.id));
const isAllCurrentPageSelected = computed(() => (
  currentPageIds.value.length > 0 && currentPageIds.value.every(id => selectedIds.value.includes(id))
));
const toggleSelectAllCurrentPage = () => {
  if (isAllCurrentPageSelected.value) {
    // 取消当前页全选：移除当前页的所有ID
    const set = new Set(selectedIds.value);
    currentPageIds.value.forEach(id => set.delete(id));
    selectedIds.value = Array.from(set);
  } else {
    // 本页全选：合并当前页所有ID
    const set = new Set(selectedIds.value);
    currentPageIds.value.forEach(id => set.add(id));
    selectedIds.value = Array.from(set);
  }
};
const rowSelection = computed(() => ({
  selectedRowKeys: selectedIds.value,
  onChange: (keys) => { selectedIds.value = keys; }
}));
const handleBatchDelete = () => {
  if (!selectedIds.value.length) {
    message.warning('请先选择要删除的图文');
    return;
  }
  Modal.confirm({
    title: '批量删除确认',
    content: `确认删除选中的 ${selectedIds.value.length} 条图文吗？`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      try {
        const resp = await batchDeleteTexts(selectedIds.value);
        const deleted = resp?.data?.deleted ?? resp?.deleted ?? 0;
        const requested = resp?.data?.requested ?? resp?.requested ?? selectedIds.value.length;
        if (resp?.code === 0 || deleted >= 0) {
          message.success(`批量删除成功，已删除 ${deleted} / 请求 ${requested}`);
          selectedIds.value = [];
          fetchData();
        } else {
          message.error(resp?.message || resp?.msg || '批量删除失败');
        }
      } catch (error) {
        console.error('批量删除失败:', error);
        message.error('批量删除失败');
      }
    }
  });
};
</script>

<style scoped>
.graphic-list-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-container {
  margin-top: 16px;
  flex: 1;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title-content {
  display: flex;
  align-items: center;
}

.title-text {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.text-content {
  max-height: 120px;
  overflow: hidden;
  position: relative;
}

.content-preview {
  max-height: 100px;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.search-area .ant-form {
  flex: 1;
  margin-right: 16px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

:deep(.ant-table-row) {
  transition: all 0.3s ease;
  cursor: pointer;
}

:deep(.ant-table-row:hover) {
  background-color: #fafafa;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.ant-table-cell) {
  padding: 16px !important;
}

.upload-area {
  width: 100%;
}

.upload-dragger {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  text-align: center;
  padding: 40px 20px;
  transition: border-color 0.3s;
  cursor: pointer;
}

.upload-dragger:hover {
  border-color: #1890ff;
}

.upload-dragger.dragover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-hint p {
  margin: 4px 0;
  color: #666;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #91d5ff;
}

.file-selected span {
  color: #1890ff;
  font-weight: 500;
}

.url-preview {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  background-color: #fafafa;
}

.preview-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #262626;
}

.preview-content {
  color: #595959;
  line-height: 1.5;
  white-space: pre-wrap;
}

.ant-tabs-content {
  padding-top: 16px;
}

/* 保障平台卡片为横向网格排列 */
.platform-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.platform-grid .platform-item { display:flex; flex-direction: column; align-items:center; gap:6px; padding:8px 6px; border:1px solid #e5e7eb; border-radius:6px; cursor:pointer; background:#fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all .2s; }
.platform-grid .platform-item:hover { border-color:#1890ff; box-shadow: 0 2px 8px rgba(24,144,255,.15); }
.platform-grid .platform-item.active { border-color:#1890ff; background:#f0f7ff; }
.platform-grid .platform-icon img { width:16px; height:16px; border-radius:4px; object-fit: contain; }
.platform-grid .platform-name { font-size:12px; color:#333; text-align:center; margin-top:4px; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 新增：封面选择弹窗的网格样式 */
.cover-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.cover-select-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
}
.cover-select-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.cover-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.preview-image {
  width: 100%;
  max-height: calc(90vh - 120px);
  object-fit: contain;
}

/* 发布弹窗：图文信息与按钮布局优化 */
.text-info-section { margin-bottom: 12px; }
.text-info-box { display: flex; align-items: center; gap: 12px; }
.modal-cover { width: 60px; height: 60px; border-radius: 6px; overflow: hidden; background: #fafafa; border: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.modal-cover img { width: 100%; height: 100%; object-fit: cover; }
.modal-cover-placeholder { font-size: 12px; color: #999; }
.modal-title { font-size: 16px; font-weight: 600; color: #333; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.publish-actions { margin-top: 16px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
</style>
