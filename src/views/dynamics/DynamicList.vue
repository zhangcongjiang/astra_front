<template>
  <div class="graphic-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="标题">
          <a-input v-model:value="searchForm.title" placeholder="输入动态标题" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="用户">
          <UserSelect v-model="searchForm.creator" placeholder="选择用户" width="140px" />
        </a-form-item>
        <a-form-item label="创作时间">
          <a-range-picker v-model:value="searchForm.dateRange" :show-time="{ format: 'HH:mm' }" format="YYYY-MM-DD HH:mm"
            :placeholder="['开始时间', '结束时间']" @change="handleDateChange" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 工具栏：新建、导入、批量删除（位于搜索与内容区之间） -->
    <div class="toolbar-area">
      <a-space>
        <a-button type="primary" @click="openCreateModal">
          <PlusOutlined /> 新建动态
        </a-button>
        <a-button danger :disabled="selectedIds.length === 0" @click="handleBatchDelete">
          批量删除
        </a-button>
      </a-space>
    </div>

    <!-- 动态卡片列表 -->
    <div class="dynamic-grid">
      <a-spin :spinning="loading" tip="加载中...">
        <a-row :gutter="[16, 16]">
          <a-col v-for="item in dynamicList" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
            <a-card hoverable class="dynamic-card">
              <template #title>
                <div class="card-title">
                  <a-checkbox :checked="selectedIds.includes(item.id)" @change="(e) => toggleSelection(item.id, e.target.checked)">
                    选择
                  </a-checkbox>
                  <span class="title-text" :title="item.title">{{ item.title || '未命名动态' }}</span>
                </div>
              </template>
              <div class="card-content" @click="goDetail(item)">
                <!-- 图片轮播（上半部分） -->
                <div class="cover-carousel">
                  <a-carousel v-if="Array.isArray(item.images) && item.images.length > 0" dots autoplay>
                    <div v-for="(img, idx) in item.images" :key="idx" class="carousel-item">
                      <img :src="getImageUrl(img)" class="cover-image" @error="onImageError($event)" />
                    </div>
                  </a-carousel>
                  <div v-else class="cover-placeholder">
                    <span>暂无图片</span>
                  </div>
                </div>

                <!-- 文本信息（最多显示5行） -->
                <div class="text-info">
                  <div class="content-preview" v-html="renderDigest(item.content)"></div>
                  <div class="meta-row">
                    <div class="meta-item">创建者：{{ item.creator || item.username || '未知' }}</div>
                    <div class="meta-item">来源：{{ item.origin || '未知来源' }}</div>
                  </div>
                </div>

                <!-- 操作按钮（底部） -->
                <div class="card-actions" @click.stop>
                  <a-space>
                    <a-button type="primary" @click="openPublish(item)">发布</a-button>
                    <a-button @click="goDetail(item)">详情</a-button>
                    <a-button danger @click="handleDelete(item)">删除</a-button>
                  </a-space>
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>

      <!-- 分页 -->
      <div class="pagination">
        <a-pagination
          :current="pagination.current"
          :pageSize="pagination.pageSize"
          :total="pagination.total"
          :showSizeChanger="true"
          :showQuickJumper="true"
          @change="handlePaginationChange"
          @showSizeChange="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- 新建动态弹窗 -->
    <a-modal v-model:open="createModalVisible" title="新建动态" :confirm-loading="createLoading" @ok="submitCreate" @cancel="closeCreateModal">
      <a-form layout="vertical">
        <a-form-item label="标题">
          <a-input v-model:value="createForm.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item label="正文">
          <a-textarea v-model:value="createForm.content" :rows="6" placeholder="请输入正文内容（支持 Markdown）" />
        </a-form-item>
        <a-form-item label="图片（仅支持本地选择）">
          <a-upload :beforeUpload="() => false" :showUploadList="false" multiple accept="image/png,image/jpeg,image/jpg,image/gif" @change="handleCreateFileChange">
            <a-button type="dashed">选择本地图片</a-button>
          </a-upload>
          <div class="upload-preview" v-if="createImages.length > 0" style="margin-top: 12px;">
            <a-carousel dots autoplay>
              <div v-for="(img, idx) in createImages" :key="idx" class="carousel-item">
                <img :src="img.previewUrl || img.url" class="cover-image" />
              </div>
            </a-carousel>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>


    <!-- 发布弹窗 -->
    <a-modal v-model:open="publishModalVisible" title="发布动态" :footer="null" width="820px">
      <div class="publish-editor-grid">
        <div class="editor-left" style="width: 100%;">
          <a-form layout="vertical">
            <a-form-item label="标题">
              <a-input v-model:value="publishTitle" placeholder="编辑标题" />
            </a-form-item>
            <a-form-item label="内容">
              <a-textarea v-model:value="publishContent" :rows="6" placeholder="编辑内容（支持 Markdown / 纯文本）" />
            </a-form-item>
          </a-form>
          <div class="images-toolbar">
            <a-checkbox v-model:checked="publishSelectAll" @change="toggleSelectAll">全选</a-checkbox>
            <a-button size="small" type="link" @click="resetPublishEdit">重置为原文</a-button>
          </div>
          <div class="publish-images-grid compact">
            <!-- 仅保留图片列表，缩略图尺寸更小 -->
            <div class="img-card" v-for="(img, idx) in publishImages" :key="idx" :class="{selected: img.selected}" @click="togglePublishImage(idx)">
              <img :src="img.url" @error="onImageError($event)" />
              <div class="img-name" :title="img.name">{{ img.name || '图片' }}</div>
              <a-checkbox class="img-check" :checked="img.selected" />
            </div>
          </div>
        </div>
        <!-- 移除右侧预览区域 -->
        
      </div>
      <div class="publish-platforms">
        <div class="platform" v-for="p in dynamicPlatforms" :key="p.name" :class="{active: selectedPlatforms.includes(p.name)}" @click="togglePlatform(p.name)">
          <img v-if="p.faviconUrl" :src="p.faviconUrl" alt=""/>
          <span>{{ p.platformName }}</span>
        </div>
      </div>
      <div class="publish-actions">
        <a-switch v-model:checked="isAutoPublish" checked-children="自动" un-checked-children="手动" />
        <a-button type="primary" style="margin-left: 12px" @click="confirmPublish">开始发布</a-button>
        <a-button style="margin-left: 8px" @click="cancelPublish">取消</a-button>
      </div>
    </a-modal>
    
   </div>
 </template>

 <script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import UserSelect from '@/components/UserSelect.vue';
import { getDynamicList, getDynamicDetail, deleteDynamic, batchDeleteDynamics, createDynamic } from '@/api/modules/dynamicApi.js';
import { funcPublish as extFuncPublish, getPlatformInfos, checkServiceStatus, funcGetPermission, openOptions } from '@/utils/extensionMessaging.js';
// import { uploadImages } from '@/api/modules/imageApi.js';
const router = useRouter();

// 搜索表单
const searchForm = reactive({
  title: '',
  creator: undefined,
  dateRange: [],
});

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 列表数据与状态
const dynamicList = ref([]);
const loading = ref(false);

// 选择与批量操作
const selectedIds = ref([]);
const toggleSelection = (id, checked) => {
  const idx = selectedIds.value.indexOf(id);
  if (checked && idx === -1) selectedIds.value.push(id);
  if (!checked && idx > -1) selectedIds.value.splice(idx, 1);
};

// 获取列表
const fetchData = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.current, pageSize: pagination.pageSize };
    if (searchForm.title) params.title = searchForm.title;
    if (searchForm.creator) params.creator = searchForm.creator;
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const [start, end] = searchForm.dateRange;
      params.start_time = dayjs(start).format('YYYY-MM-DDTHH:mm:ss');
      params.end_time = dayjs(end).format('YYYY-MM-DDTHH:mm:ss');
    }

    const resp = await getDynamicList(params);
    const list = resp?.data?.results || resp?.results || [];
    pagination.total = resp?.data?.count ?? list.length;

    // 统一映射字段
    dynamicList.value = list.map(it => ({
      id: it.id,
      title: it.title || '未命名动态',
      content: it.content || it.text || '',
      creator: it.username || it.creator || '',
      origin: it.origin || '未知来源',
      images: Array.isArray(it.images) ? it.images : [],
    }));
  } catch (e) {
    console.error('获取动态列表失败:', e);
    message.error('获取动态列表失败');
    dynamicList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

// 搜索与重置
const handleSearch = () => { pagination.current = 1; fetchData(); };
const resetSearch = () => { searchForm.title = ''; searchForm.creator = undefined; searchForm.dateRange = []; handleSearch(); };
const handleDateChange = () => {};

// 分页处理
const handlePaginationChange = (page) => { pagination.current = page; fetchData(); };
const handlePageSizeChange = (current, size) => { pagination.pageSize = size; pagination.current = 1; fetchData(); };

// 图片URL与渲染
const staticBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089';
const getImageUrl = (img) => {
  if (!img) return '';
  // 支持字符串或对象两种图片数据结构
  if (typeof img === 'string') {
    const url = img;
    return url.startsWith('http') ? url : (url ? `${staticBaseUrl}${url}` : '');
  }
  const url = img.url || img.path || (img.img_name ? `${staticBaseUrl}/media/images/${img.img_name}` : '');
  return url.startsWith('http') ? url : (url ? `${staticBaseUrl}${url}` : '');
};
const onImageError = (ev) => { ev.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">图片加载失败</text></svg>'; };

// 文本预览（最多5行）
const renderDigest = (text) => {
  const t = (text || '').toString();
  const plain = t.replace(/[#>`*_\-\[\]]/g, '').replace(/\n+/g, ' ');
  return plain;
};

// 详情
const goDetail = (item) => {
  router.push({ name: 'dynamic-detail', params: { id: item.id } });
};

// 删除单条
const handleDelete = (item) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除「${item.title}」吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const resp = await deleteDynamic(item.id);
        if (resp?.code === 0 || resp?.success) {
          message.success('删除成功');
          fetchData();
        } else {
          message.error(resp?.message || '删除失败');
        }
      } catch (e) {
        console.error('删除失败:', e);
        message.error('删除失败');
      }
    }
  });
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return;
  Modal.confirm({
    title: '批量删除确认',
    content: `确定删除选中的 ${selectedIds.value.length} 条动态吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const resp = await batchDeleteDynamics(selectedIds.value);
        if (resp?.code === 0 || resp?.success) {
          message.success('批量删除成功');
          selectedIds.value = [];
          fetchData();
        } else {
          message.error(resp?.message || '批量删除失败');
        }
      } catch (e) {
        console.error('批量删除失败:', e);
        message.error('批量删除失败');
      }
    }
  });
};

// 新建动态
const createModalVisible = ref(false);
const createLoading = ref(false);
const createForm = reactive({ title: '', content: '' });
const createImages = ref([]);

// 弹窗开关
const openCreateModal = () => { createModalVisible.value = true; };
const closeCreateModal = () => { createModalVisible.value = false; createImages.value = []; selectedImageKeys.value = new Set(); };

// 处理上传组件文件选择变更（仅本地选择，不立即上传）
const getFileKey = (file) => `${file.name}_${file.size}_${file.lastModified || 0}`;
const selectedImageKeys = ref(new Set());
const handleCreateFileChange = async (info) => {
  const incoming = (info?.fileList || [])
    .map(f => f.originFileObj)
    .filter(Boolean)
    .filter(f => beforeCreateUpload(f));

  // 仅添加新增文件，避免因多次触发 change 导致重复追加
  const newFiles = [];
  for (const f of incoming) {
    const key = getFileKey(f);
    if (!selectedImageKeys.value.has(key)) {
      selectedImageKeys.value.add(key);
      newFiles.push(f);
    }
  }
  if (newFiles.length === 0) return;
  uploadCreateImages(newFiles);
};

const beforeCreateUpload = (file) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  const isValidType = allowed.includes(file.type);
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isValidType) { message.warning(`不支持的文件类型: ${file.type}`); return false; }
  if (!isLt50M) { message.warning('图片大小不能超过50MB'); return false; }
  return true;
};

const uploadCreateImages = async (files) => {
  try {
    const images = files.map((file) => ({
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));
    createImages.value.push(...images);
    message.success(`已选择 ${images.length} 张图片`);
  } catch (error) {
    console.error('处理本地图片失败:', error);
    message.error(`处理本地图片失败: ${error.message || '未知错误'}`);
  }
};
const submitCreate = async () => {
  if (!createForm.title?.trim()) { message.warning('请填写标题'); return; }
  const contentText = (createForm.content || '').trim();
  if (!contentText) { message.warning('内容不能为空'); return; }
  if (createImages.value.length === 0) { message.warning('请至少选择一张图片'); return; }

  createLoading.value = true;
  try {
    const imageFiles = createImages.value
      .map(img => img?.file)
      .filter(Boolean);

    if (imageFiles.length === 0) {
      message.error('请选择至少一张有效图片文件');
      return;
    }

    const payload = {
      title: createForm.title.trim(),
      content: contentText,
      images: imageFiles,
      publish: false,
    };

    const resp = await createDynamic(payload);
    if (resp?.code === 0 || resp?.success) {
      message.success('创建成功');
      closeCreateModal();
      fetchData();
    } else {
      message.error(resp?.message || '创建失败');
    }
  } catch (e) {
    console.error('创建失败:', e);
    message.error('创建失败');
  } finally {
    createLoading.value = false;
  }
};



// 发布相关（列表页）
const publishModalVisible = ref(false);
const dynamicPlatforms = ref([]);
const selectedPlatforms = ref([]);
const isAutoPublish = ref(false);
const selectedPublishItem = ref(null);
// 发布编辑与预览
const publishTitle = ref('');
const publishContent = ref('');
const publishImages = ref([]); // { name, url, type, selected }
const publishSelectAll = ref(true);

const initPublishFormFromItem = (item) => {
  publishTitle.value = item?.title || '';
  publishContent.value = (item?.content || '').toString();
  publishImages.value = (item?.images || []).map(img => {
    const t = img?.type ? String(img.type) : '';
    const mime = t.startsWith('image/') ? t : (t ? `image/${t.toLowerCase()}` : 'image/jpeg');
    return {
      name: (img && typeof img === 'object') ? (img.name || img.img_name || '') : '',
      url: getImageUrl(img),
      type: mime,
      selected: true,
      size: (img && typeof img === 'object') ? (img.size || 0) : 0,
    };
  });
  publishSelectAll.value = true;
};

const togglePublishImage = (idx) => {
  const img = publishImages.value[idx];
  if (img) {
    img.selected = !img.selected;
    publishSelectAll.value = publishImages.value.length > 0 && publishImages.value.every(i => i.selected);
  }
};

const toggleSelectAll = (e) => {
  const checked = e?.target?.checked ?? publishSelectAll.value;
  publishSelectAll.value = checked;
  publishImages.value.forEach(i => { i.selected = checked; });
};

const resetPublishEdit = () => { if (selectedPublishItem.value) initPublishFormFromItem(selectedPublishItem.value); };

const togglePlatform = (key) => {
  const i = selectedPlatforms.value.indexOf(key);
  if (i > -1) selectedPlatforms.value.splice(i, 1); else selectedPlatforms.value.push(key);
};

const openPublish = async (item) => {
  publishModalVisible.value = true;
  try {
    const resp = await getDynamicDetail(item?.id);
    const detail = resp?.data?.data || resp?.data || {};
    const normalized = {
      id: detail.id || item.id,
      title: detail.title || item.title || '',
      content: detail.content || item.content || '',
      images: Array.isArray(detail.images) ? detail.images : (Array.isArray(item.images) ? item.images : []),
      creator: detail.username || detail.creator || item.creator || '',
      origin: detail.origin || item.origin || '',
    };
    selectedPublishItem.value = normalized;
    initPublishFormFromItem(normalized);
  } catch (e) {
    console.warn('获取动态详情失败，使用列表数据填充', e);
    selectedPublishItem.value = item;
    initPublishFormFromItem(item);
  }
  try {
    const normalizePlatforms = (raw) => {
      let arr = Array.isArray(raw) ? raw : Object.values(raw || {});
      arr = (arr || []).map((p) => ({
        ...p,
        name: p?.name || p?.platformName || p?.key || p?.id,
      }));
      return arr;
    };
    dynamicPlatforms.value = normalizePlatforms(await getPlatformInfos('DYNAMIC'));
    if (!dynamicPlatforms.value.length) {
      dynamicPlatforms.value = normalizePlatforms(await getPlatformInfos());
    }
    const allowedKeywords = [
      'bilibili', '哔哩', 'b站',
      'douyin', '抖音',
      'xiaohongshu', '小红书', 'rednote',
      'toutiao', '今日头条', '头条',
      'baijiahao', '百家号',
      'weixinchannel', '微信视频号', '视频号'
    ];
    const filtered = (dynamicPlatforms.value || []).filter((p) => {
      const en = `${(p.name || '').toLowerCase()} ${(p.platformName || '').toLowerCase()}`;
      const zh = `${p.platformName || ''}`;
      return allowedKeywords.some((k) => en.includes(k) || zh.includes(k));
    });
    if (filtered.length > 0) {
      dynamicPlatforms.value = filtered;
    } else {
      message.info('未匹配到指定平台关键字，已显示全部平台');
    }
  } catch (e) {
    console.error('获取平台信息失败:', e);
    message.error('获取平台信息失败');
  }
};

const confirmPublish = async () => {
  try {
    if (!selectedPublishItem.value) { message.warning('未选择动态'); return; }
    if (!selectedPlatforms.value.length) { message.warning('请选择至少一个平台'); return; }
    if (!selectedPublishItem.value) { message.warning('未选择动态'); return; }
    if (!selectedPlatforms.value.length) { message.warning('请选择至少一个平台'); return; }
    const serviceResp = await checkServiceStatus();
    if (!serviceResp) { message.error('扩展服务未运行，请先启动扩展'); return; }
    const trustResp = await funcGetPermission(5000);
    if (!trustResp || trustResp.status !== 'ok' || !trustResp.trusted) {
      await openOptions();
      message.info('请在扩展设置页授权当前域名后，系统将自动继续');
    }
    const selectedSet = new Set(selectedPlatforms.value);
    const targetPlatforms = (dynamicPlatforms.value || []).filter(p => selectedSet.has(p.name));
    if (!targetPlatforms.length) { message.error('未匹配到选中的平台'); return; }
    const syncPlatforms = targetPlatforms.map(p => ({ name: p.name, platformName: p.platformName, injectUrl: p.injectUrl, faviconUrl: p.faviconUrl, accountKey: p.accountKey, extraConfig: {} }));
    const item = selectedPublishItem.value;
    // 构建 images，补充 size 字段；如果缺失尝试通过 HEAD 获取 content-length，失败则回退为 0
    const images = await Promise.all(
      publishImages.value
        .filter(i => i.selected)
        .map(async (it) => {
          const base = { name: it.name, url: it.url, type: it.type, size: it.size ?? 0 };
          if (!base.size && it?.url) {
            try {
              const headResp = await fetch(it.url, { method: 'HEAD' });
              const len = headResp.headers.get('content-length');
              if (len) base.size = Number(len);
            } catch (_) {
              // 忽略跨域或网络错误，保留默认值
            }
          }
          return base;
        })
    );
    const syncData = {
      platforms: syncPlatforms,
      isAutoPublish: isAutoPublish.value,
      data: {
        title: (publishTitle.value || item.title),
        content: (publishContent.value || '').toString() || (item.content || '').toString(),
        images,
        videos: []
      }
    };
    // 点击开始发布后立即关闭弹窗（通过校验后）
    publishModalVisible.value = false;
    await extFuncPublish(syncData);
    selectedPublishItem.value = null;
    selectedPlatforms.value = [];
    publishImages.value = [];
    publishTitle.value = '';
    publishContent.value = '';
    message.success(`发布请求已发送到扩展（${syncPlatforms.length}个平台）`);
    selectedPublishItem.value = null;
    selectedPlatforms.value = [];
    publishImages.value = [];
    publishTitle.value = '';
    publishContent.value = '';
  } catch (e) {
    console.error('发布失败:', e);
    message.error(e?.message || '发布失败');
  }
};
const cancelPublish = () => { publishModalVisible.value = false; selectedPublishItem.value = null; selectedPlatforms.value = []; };

 </script>
 
 <style scoped>
.graphic-list-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.search-area {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.toolbar-area {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 8px 0 12px;
}

.dynamic-grid {
  padding: 16px;
  background: transparent;
}

.dynamic-card {
  height: 100%;
  transition: all 0.3s ease;
}
.dynamic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-text {
  font-weight: 600;
  color: #333;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
}

.cover-carousel {
  width: 100%;
  height: 160px;
  border-radius: 6px;
  overflow: hidden;
  background: #fafafa;
}
.carousel-item {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}
.cover-placeholder {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  color: #999;
  border-radius: 6px;
}

.text-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.content-preview {
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #666;
  font-size: 12px;
}
.meta-item { white-space: nowrap; }

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.pagination { margin-top: 16px; text-align: right; }
.create-upload-area {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  text-align: center;
  cursor: pointer;
}
.create-upload-area.drag-over {
  border-color: #1890ff;
  background: #f0f7ff;
}
.upload-placeholder .sub {
  color: #999;
  font-size: 12px;
}
.upload-preview .carousel-item {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.publish-platforms { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 12px; }
.publish-platforms .platform { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid #e5e7eb; border-radius:8px; cursor:pointer; background:#fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all .2s; }
.publish-platforms .platform:hover { border-color:#1890ff; box-shadow: 0 2px 8px rgba(24,144,255,.15); }
.publish-platforms .platform.active { border-color:#1890ff; background:#f0f7ff; }
.publish-platforms .platform img { width:24px; height:24px; border-radius:4px; object-fit: contain; }
.publish-platforms .platform span { flex:1; font-size:14px; color:#333; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
.publish-actions { margin-top: 16px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
</style>

<style scoped>
/* 紧凑图片列表样式 */
.publish-editor-grid {
  display: flex;
  gap: 12px;
}
.editor-left {
  flex: 1;
}
.publish-images-grid.compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}
.publish-images-grid.compact .img-card {
  position: relative;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
}
.publish-images-grid.compact .img-card.selected {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.15);
}
.publish-images-grid.compact .img-card img {
  width: 100%;
  height: 70px; /* 缩小高度 */
  object-fit: cover;
  border-radius: 4px;
}
.publish-images-grid.compact .img-card .img-name {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.publish-images-grid.compact .img-card .img-check {
  position: absolute;
  top: 6px;
  right: 6px;
}
</style>
