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
      <a-button type="primary" @click="handleCreate" :icon="h(PlusOutlined)">
        创建图文
      </a-button>
      <a-button type="primary" @click="handleImport">本地导入</a-button>
      <a-button type="primary" @click="handleUrlImport">URL导入</a-button>
    </div>

    <div class="table-container">
      <a-table 
        :columns="columns" 
        :dataSource="currentPageData" 
        :pagination="false" 
        :loading="loading"
        rowKey="id"
        :customRow="handleRowClick">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="title-content">
              <img
                v-if="record.coverId && getTextCoverUrl(record)"
                :src="getTextCoverUrl(record)"
                class="cover-thumb"
                alt="封面"
                @click.stop="showRowImagePreview(record)"
              />
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
              <a-button type="link" :disabled="record.status === 'published'" @click="handlePublish(record)">
                发布
              </a-button>
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

    <!-- 新增：发布弹窗 -->
    <a-modal v-model:open="publishModalVisible" title="发布图文" width="800px" :footer="null" @cancel="closePublishModal">
      <div class="publish-modal-content">
        <!-- 平台选择部分 -->
        <div class="platform-section">
          <div class="platform-header" style="margin-bottom:8px; display:flex; align-items:center; gap:12px;">
            <h3 style="margin:0;">选择发布平台</h3>
            <div class="auto-publish" style="display:flex; align-items:center; gap:8px;">
              <span>直接发布</span>
              <a-switch v-model:checked="isAutoPublish" size="small" />
            </div>
          </div>
          <div class="platform-grid">
            <div v-for="p in dynamicPlatforms" :key="p.name" class="platform-item"
                 :class="{ active: selectedPlatforms.includes(p.name) }"
                 @click="togglePlatform(p.name)">
              <div class="platform-icon">
                <img v-if="p.faviconUrl" :src="p.faviconUrl" alt="" style="width:24px;height:24px;" />
              </div>
              <div class="platform-name">{{ p.platformName || p.name }}</div>
              <div class="platform-check" v-if="selectedPlatforms.includes(p.name)">
                <CheckCircleFilled style="color: #52c41a; font-size: 16px;" />
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="modal-actions">
          <a-button @click="closePublishModal">取消</a-button>
          <a-button type="primary" :disabled="selectedPlatforms.length === 0" @click="confirmPublish">
            发布到选中平台 ({{ selectedPlatforms.length }})
          </a-button>
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
import { ref, reactive, computed, onMounted, h, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination.vue';
import UserSelect from '@/components/UserSelect.vue';
import { 
  getTextList, 
  deleteText, 
  downloadText, 
  uploadMarkdown,
  importFromUrl
} from '@/api/modules/textApi';
import { getImageDetail } from '@/api/modules/imageApi.js';
import { CheckCircleFilled } from '@ant-design/icons-vue';
// 恢复：引入扩展消息方法
import {
  checkServiceStatus as extCheckServiceStatus,
  openOptions as extOpenOptions,
  funcPublish as extFuncPublish,
  funcGetPermission as extFuncGetPermission,
  getPlatformInfos as extGetPlatformInfos,
  getAccountInfos as extGetAccountInfos,
} from '@/utils/extensionMessaging.js';
// 新增：Markdown 渲染与 HTML 净化
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

// 初始化 MarkdownIt 实例与摘要生成方法
const md = new MarkdownIt({ linkify: true, breaks: true });
const makeDigest = (markdown) => {
  const safeHtml = DOMPurify.sanitize(md.render(markdown || ''));
  const text = safeHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 160);
};

const router = useRouter();

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
// 文章平台列表（根据用户提供配置）
const localPlatforms = [
  {
    type: 'ARTICLE',
    name: 'ARTICLE_BAIJIAHAO',
    homeUrl: 'https://baijiahao.baidu.com/',
    faviconUrl: 'https://pic.rmb.bdstatic.com/10e1e2b43c35577e1315f0f6aad6ba24.vnd.microsoft.icon',
    platformName: '百家号',
    injectUrl: 'https://baijiahao.baidu.com/builder/rc/edit?type=news',
    tags: ['CN'],
    accountKey: 'baijiahao',
  },
  {
    type: 'ARTICLE',
    name: 'ARTICLE_TOUTIAO',
    homeUrl: 'https://mp.toutiao.com/',
    faviconUrl: 'https://sf1-cdn-tos.toutiaostatic.com/obj/ttfe/pgcfe/sz/mp_logo.png',
    platformName: '今日头条',
    injectUrl: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    tags: ['CN'],
    accountKey: 'toutiao',
  },
  {
    type: 'ARTICLE',
    name: 'ARTICLE_WEIXIN',
    homeUrl: 'https://mp.weixin.qq.com/',
    faviconUrl: 'https://mp.weixin.qq.com/favicon.ico',
    platformName: '微信公众号',
    injectUrl: 'https://mp.weixin.qq.com/',
    tags: ['CN'],
    accountKey: 'weixin',
  },
  {
    type: 'ARTICLE',
    name: 'ARTICLE_BILIBILI',
    homeUrl: 'https://www.bilibili.com/',
    faviconUrl: 'https://www.bilibili.com/favicon.ico',
    platformName: 'B站专栏',
    injectUrl: 'https://member.bilibili.com/article-text/home?newEditor=-1',
    tags: ['CN'],
    accountKey: 'bilibili',
  },
  {
    type: 'ARTICLE',
    name: 'ARTICLE_WEIBO',
    homeUrl: 'https://weibo.com/',
    faviconUrl: 'https://weibo.com/favicon.ico',
    platformName: '微博',
    injectUrl: 'https://card.weibo.com/article/v3/editor',
    tags: ['CN'],
    accountKey: 'weibo',
  },
];

onMounted(() => {
  // 初始化平台到 UI
  dynamicPlatforms.value = localPlatforms;
});

// 新增：平台选择与扩展授权辅助函数
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
const currentPageData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return textList.value.slice(start, end);
});

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
  return `http://127.0.0.1:8089/media/images/${detail.img_name}`;
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
    // 预加载封面详情
    if (record.coverId && !coverDetails[record.id]) {
      await loadCoverDetailForText(record);
    }
    publishModalVisible.value = true;
  } catch (error) {
    console.error('打开发布弹窗失败:', error);
    message.error('打开发布弹窗失败');
  }
};

// 新增：执行发布
const confirmPublish = async () => {
  if (!selectedText.value) {
    message.warning('未选择图文');
    return;
  }
  if (!selectedPlatforms.value.length) {
    message.warning('请选择至少一个平台');
    return;
  }
  try {
    publishModalVisible.value = false;
    message.info('作品发布中');

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

    const markdown = selectedText.value.content || '';
    const html = DOMPurify.sanitize(md.render(markdown));
    const digest = makeDigest(markdown);
    const images = Array.isArray(selectedText.value.images) ? selectedText.value.images : [];

    const syncData = {
      platforms: syncPlatforms,
      isAutoPublish: isAutoPublish.value,
      data: {
        title: selectedText.value.title || '未命名图文',
        digest,
        cover,
        htmlContent: html,
        markdownContent: markdown,
        images
      }
    };

    console.log('发送扩展发布请求 syncData:', JSON.stringify(syncData, null, 2));
    await extFuncPublish(syncData);
    message.success(`发布请求已发送到扩展（${syncPlatforms.length}个平台），请在新标签页查看扩展自动填充`);
    fetchData();
  } catch (e) {
    console.error('发布异常:', e);
    message.error(e?.message || '发布异常');
  } finally {
    selectedText.value = null;
    selectedPlatforms.value = [];
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

/* 追加封面缩略图与预览样式 */
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

/* 保留并复用现有样式 */
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
.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
/* 其余样式保留 */
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
</style>
