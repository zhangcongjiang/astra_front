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
        <a-button @click="openImportModal">
          导入动态
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
              <div class="card-content">
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
                <div class="card-actions">
                  <a-space>
                    <a-button type="primary" @click="handlePublish(item)">发布</a-button>
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
        <a-form-item label="图片">
          <div class="create-upload-area" :class="{ 'drag-over': isCreateDragOver }"
               @dragover.prevent="handleCreateDragOver" @dragenter.prevent="handleCreateDragEnter" @dragleave.prevent="handleCreateDragLeave" @drop.prevent="handleCreateDrop"
               @paste="handleCreatePaste">
            <div class="upload-placeholder" v-if="createImages.length === 0">
              <p>点击、拖拽或粘贴图片到此处</p>
              <p class="sub">支持 jpg、png、gif，单张不超过 50MB</p>
            </div>
            <div class="upload-preview" v-else>
              <a-carousel dots autoplay>
                <div v-for="(img, idx) in createImages" :key="idx" class="carousel-item">
                  <img :src="img.previewUrl || img.url" class="cover-image" />
                </div>
              </a-carousel>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入动态弹窗 -->
    <a-modal v-model:open="importModalVisible" title="导入动态" :confirm-loading="importLoading" @ok="submitImport" @cancel="closeImportModal">
      <div>
        <input type="file" @change="handleFileSelect" accept=".md,.markdown,.json" />
        <div v-if="selectedFile" class="file-info">已选择：{{ selectedFile.name }}</div>
        <a-input v-model:value="importTitle" placeholder="可选：为导入文件设置标题（默认使用文件名）" style="margin-top: 12px" />
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
import { getDynamicList, deleteDynamic, batchDeleteDynamics, createDynamic, uploadDynamic } from '@/api/modules/dynamicApi.js';
import { uploadImages } from '@/api/modules/imageApi.js';
import { funcPublish as extFuncPublish } from '@/utils/extensionMessaging.js';

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
      images: Array.isArray(it.images) ? it.images : [], // 预期为数组
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
  const url = img.url || img.path || (img.img_name ? `${staticBaseUrl}/media/images/${img.img_name}` : '');
  return url.startsWith('http') ? url : (url ? `${staticBaseUrl}${url}` : '');
};
const onImageError = (ev) => { ev.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">图片加载失败</text></svg>'; };

// 文本预览（最多5行）
const renderDigest = (text) => {
  const t = (text || '').toString();
  // 简易处理 Markdown 文本为纯文本预览
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
const isCreateDragOver = ref(false);

// 修复：新增/关闭弹窗的方法，确保点击“新建动态”有响应
const openCreateModal = () => {
  createModalVisible.value = true;
};
const closeCreateModal = () => {
  createModalVisible.value = false;
};
const beforeCreateUpload = (file) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  const isValidType = allowed.includes(file.type);
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isValidType) { message.warning(`不支持的文件类型: ${file.type}`); return false; }
  if (!isLt50M) { message.warning('图片大小不能超过50MB'); return false; }
  return true;
};

const handleCreateDragOver = (e) => { isCreateDragOver.value = true; };
const handleCreateDragEnter = (e) => { isCreateDragOver.value = true; };
const handleCreateDragLeave = (e) => { isCreateDragOver.value = false; };
const handleCreateDrop = async (e) => {
  isCreateDragOver.value = false;
  const files = Array.from(e.dataTransfer?.files || []).filter(f => beforeCreateUpload(f));
  if (files.length === 0) return;
  await uploadCreateImages(files);
};

const handleCreatePaste = async (e) => {
  const items = Array.from(e.clipboardData?.items || []);
  const imageFiles = items
    .filter(i => i.type && i.type.startsWith('image/'))
    .map(i => i.getAsFile())
    .filter(Boolean)
    .filter(f => beforeCreateUpload(f));
  if (imageFiles.length === 0) return;
  await uploadCreateImages(imageFiles);
};

const uploadCreateImages = async (files) => {
  try {
    createLoading.value = true;
    const response = await uploadImages(files, 'normal', (progress) => { /* 可选进度处理 */ });
    // 将返回的文件信息映射到 createImages
    // 兼容后端返回单文件或数组结构
    const data = response?.data;
    const uploaded = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : [data]);
    const images = uploaded.filter(Boolean).map((item, idx) => {
      const name = item?.name || files[idx]?.name;
      const fileName = item?.img_name || item?.filename || name;
      const url = item?.url || (fileName ? `${staticBaseUrl}/media/images/${encodeURIComponent(fileName)}` : undefined);
      return {
        name: fileName || name,
        url,
        previewUrl: URL.createObjectURL(files[idx]),
      };
    });
    createImages.value.push(...images);
    message.success(`已添加 ${images.length} 张图片`);
  } catch (error) {
    console.error('图片上传失败:', error);
    message.error(`图片上传失败: ${error.message || '未知错误'}`);
  } finally {
    createLoading.value = false;
  }
};

const submitCreate = async () => {
  if (!createForm.title?.trim()) { message.warning('请填写标题'); return; }
  createLoading.value = true;
  try {
    const payload = { title: createForm.title, content: createForm.content };
    // 如果后端支持 images 字段，一并提交
    if (createImages.value.length > 0) {
      payload.images = createImages.value.map(img => ({ url: img.url, name: img.name }));
    }
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

// 导入动态
const importModalVisible = ref(false);
const importLoading = ref(false);
const selectedFile = ref(null);
const importTitle = ref('');
const openImportModal = () => { importModalVisible.value = true; selectedFile.value = null; importTitle.value = ''; };
const closeImportModal = () => { importModalVisible.value = false; selectedFile.value = null; importTitle.value = ''; };
const handleFileSelect = (e) => { selectedFile.value = e.target.files?.[0] || null; if (selectedFile.value && !importTitle.value) { importTitle.value = selectedFile.value.name.replace(/\.(md|markdown|json)$/i, ''); } };
const submitImport = async () => {
  if (!selectedFile.value) { message.warning('请先选择文件'); return; }
  importLoading.value = true;
  try {
    await uploadDynamic(selectedFile.value, importTitle.value, null);
    message.success('导入成功');
    closeImportModal();
    fetchData();
  } catch (e) {
    console.error('导入失败:', e);
    message.error('导入失败');
  } finally {
    importLoading.value = false;
  }
};

// 发布
const handlePublish = async (item) => {
  try {
    const syncData = {
      platforms: [], // 可在详情页选择平台，这里直接触发扩展以便快速演示
      isAutoPublish: false,
      data: {
        title: item.title,
        textContent: (item.content || '').toString(),
        images: (item.images || []).map(img => ({ name: img.name || img.img_name || '', url: getImageUrl(img) })),
      }
    };
    await extFuncPublish(syncData);
    message.success('发布请求已发送到扩展');
  } catch (e) {
    console.error('发布失败:', e);
    message.error(e?.message || '发布失败');
  }
};
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
</style>