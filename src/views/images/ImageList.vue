<template>
  <div class="image-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-header">
        <a-radio-group v-model:value="searchType" size="small">
          <a-radio-button value="basic">基础查询</a-radio-button>
          <a-radio-button value="tag">标签查询</a-radio-button>
        </a-radio-group>
      </div>

      <!-- 基础查询表单 -->
      <div class="basic-search" v-if="searchType === 'basic'">
        <a-form layout="inline" :model="basicForm">
          <a-form-item label="用户">
            <UserSelect v-model:value="basicForm.uploader" placeholder="选择用户" style="width: 200px" />
          </a-form-item>
          <a-form-item label="创建时间">
            <a-range-picker v-model:value="basicForm.dateRange" :show-time="{ format: 'HH:mm' }"
              format="YYYY-MM-DD HH:mm" :placeholder="['开始时间', '结束时间']" @change="handleDateChange" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="resetBasicSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 标签查询 -->
      <div class="tag-search" v-if="searchType === 'tag'">
        <TagSearch :tags="tagCategories" :showActions="true" v-model:selectedTags="selectedTags"
          :category="TAG_CATEGORY" @search="handleSearch" @update:tags="fetchTagCategories" />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-area">
      <!-- 批量选择模式切换 - 放在最左边 -->
      <a-button 
        :type="batchMode ? 'primary' : 'default'" 
        @click="toggleBatchMode"
      >
        {{ batchMode ? '退出批量' : '批量选择' }}
      </a-button>
      
      <!-- 批量操作按钮组 - 在批量模式下显示 -->
      <div class="batch-actions" v-if="batchMode">
        <a-button type="default" @click="toggleSelectAll">
          {{ isAllSelected ? '取消全选' : '全选' }}
        </a-button>
        <a-button 
          type="danger" 
          @click="showBatchDeleteConfirm" 
          :disabled="selectedImages.length === 0"
        >
          <delete-outlined /> 批量删除{{ selectedImages.length > 0 ? ` (${selectedImages.length})` : '' }}
        </a-button>
        <a-button @click="clearSelection" v-if="selectedImages.length > 0">
          取消选择
        </a-button>
      </div>
      
      <!-- 上传按钮 - 放在右边 -->
      <div class="upload-section">
        <a-upload v-model:file-list="fileList" :multiple="true" :show-upload-list="false" :before-upload="beforeUpload"
          :customRequest="handleUpload">
          <a-button type="primary">
            <upload-outlined /> 上传图片
          </a-button>
        </a-upload>
      </div>
    </div>

    <!-- 图片列表 - 响应式5列布局 -->
    <div class="image-grid">
      <a-row :gutter="[16, 16]">
        <a-col v-for="(image, index) in currentPageImages" :key="image.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="4.8"
          class="image-col">
          <a-card hoverable class="image-card" :class="{ 'selected': selectedImages.includes(image.id) }" @click="handleCardClick(image, index)">
            <!-- 批量选择模式下的选择框 -->
            <div v-if="batchMode" class="selection-overlay" @click.stop="toggleImageSelection(image.id)">
              <a-checkbox :checked="selectedImages.includes(image.id)" />
            </div>
            
            <template #cover>
              <div class="cover-container" :style="{ height: imageHeight + 'px' }">
                <!-- 加载中状态 -->
                <div v-if="image.loading" class="loading-placeholder">
                  <a-spin size="large" />
                  <p>加载中...</p>
                </div>
                <!-- 加载失败状态 -->
                <div v-else-if="image.loadError" class="error-placeholder">
                  <ExclamationCircleOutlined style="font-size: 24px; color: #ff4d4f;" />
                  <p>加载失败</p>
                </div>
                <!-- 正常显示图片 -->
                <img v-else-if="image.url" :src="image.url" :alt="image.name" class="cover-image"
                  :style="{ height: imageHeight + 'px' }" />
              </div>
              <!-- 图片标签 -->
              <div class="image-tags">
                <a-tag v-for="tag in getTagNames(image.tags)" :key="tag.id" color="blue"
                  @click.stop="handleTagClick(tag.id)">
                  {{ tag.name }}
                </a-tag>
              </div>
            </template>
            
            <template #actions>
              <!-- 删除按钮 -->
              <span class="action-item" @click.stop="showDeleteConfirm(image.id)">
                <delete-outlined />
                <span class="action-text">删除</span>
              </span>
              <!-- 编辑标签按钮 -->
              <span class="action-item" @click.stop="showTagModal(image)">
                <tags-outlined />
                <span class="action-text">标签</span>
              </span>
              <!-- 加入素材集按钮 -->
              <span class="action-item" @click.stop="showAddToAssetModal(image)">
                <folder-add-outlined />
                <span class="action-text">加入素材集</span>
              </span>
            </template>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 分页控制 -->
    <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize" :total="pagination.total"
      @change="handlePaginationChange" />

    <!-- 图片预览模态框 -->
    <a-modal v-model:visible="previewVisible" :footer="null" width="auto"
      :bodyStyle="{ padding: 0, textAlign: 'center', maxWidth: '90vw' }" centered @cancel="closePreview"
      class="image-preview-modal">
      <div class="preview-container">
        <div class="preview-nav preview-prev" @click="showPrevImage">
          <left-circle-outlined style="font-size: 32px" />
        </div>

        <div class="preview-image-wrapper">
          <img :src="currentPreviewImage.url" class="preview-image" :style="previewImageStyle" />
          <div class="preview-meta">
            <div class="preview-title">{{ currentPreviewImage.name }}</div>
            <div class="preview-info">
              <span>上传者: {{ currentPreviewImage.uploader }}</span>
              <span>上传时间: {{ formatDate(currentPreviewImage.uploadTime) }}</span>
            </div>
            <div class="preview-tags">
              <a-tag v-for="tag in getTagNames(currentPreviewImage.tags)" :key="tag" color="blue">{{ tag.name }}</a-tag>
            </div>
          </div>
        </div>

        <div class="preview-nav preview-next" @click="showNextImage">
          <right-circle-outlined style="font-size: 32px" />
        </div>
      </div>
    </a-modal>

    <!-- 标签编辑模态框 -->
    <a-modal v-model:visible="tagModalVisible" title="编辑图片标签" @ok="handleTagSubmit" @cancel="closeTagModal"
      width="800px">
      <TagSearch :tags="tagCategories" :show-actions="false" :allow-image-tagging="true"
        :image-tags="tagForm.currentTags" @add-image-tag="addImageTag" @remove-image-tag="removeImageTag" />
    </a-modal>

    <!-- 加入素材集模态框 -->
    <a-modal
      v-model:visible="addToAssetVisible"
      title="加入素材集"
      @ok="handleAddToAsset"
      @cancel="handleCancelAddToAsset"
      :confirmLoading="loadingAssets"
    >
      <div v-if="selectedImage">
        <p>将图片 "{{ selectedImage.name }}" 加入到素材集：</p>
        <a-select
          v-model:value="selectedAssetId"
          placeholder="请选择素材集"
          style="width: 100%"
          :loading="loadingAssets"
        >
          <a-select-option
            v-for="asset in assetCollections"
            :key="asset.id"
            :value="asset.id"
          >
            {{ asset.set_name }}
          </a-select-option>
        </a-select>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted} from 'vue';
import { Modal, message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  UploadOutlined, 
  LeftCircleOutlined, 
  RightCircleOutlined, 
  DeleteOutlined, 
  TagsOutlined, 
  ExclamationCircleOutlined,
  FolderAddOutlined 
} from '@ant-design/icons-vue';

// API 导入
import { getImageList, getImageContent, getImageDetail, deleteImages, uploadImages, bindTags } from '@/api/modules/imageApi';
import { getTagsByCategory } from '@/api/modules/tagApi';
import { getAssetCollectionList, addItemToAsset } from '@/api/modules/assetApi';

// 组件导入
import Pagination from '@/components/Pagination.vue';
import TagSearch from '@/components/TagSearch.vue';
import UserSelect from '@/components/UserSelect.vue';

// 添加响应式数据
const addToAssetVisible = ref(false);
const selectedImage = ref(null);
const assetCollections = ref([]);
const selectedAssetId = ref(null);
const loadingAssets = ref(false);

// 批量选择相关状态
const batchMode = ref(false);
const selectedImages = ref([]);

// 批量选择计算属性
const isAllSelected = computed(() => {
  return currentPageImages.value.length > 0 && 
         selectedImages.value.length === currentPageImages.value.length &&
         currentPageImages.value.every(image => selectedImages.value.includes(image.id));
});


// 格式化日期函数
const formatDate = (date) => {
  if (!date) return '未知';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

// 搜索类型
const searchType = ref('basic');

// 基础查询表单
const basicForm = reactive({
  name: '',
  uploader: '',
  dateRange: [],
  startTime: null,
  endTime: null
});


// 选中的标签
const selectedTags = ref([]);

// 上传文件列表
const fileList = ref([]);

// 标签编辑模态框
const tagModalVisible = ref(false);
const tagForm = reactive({
  imageId: null,
  currentTags: []
});

// 图片数据
const imageData = ref([]);

// 加载状态
const loading = ref(false);
const TAG_CATEGORY = 'IMAGE';
// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
});

// 当前页面显示的图片
const currentPageImages = computed(() => {
  return imageData.value;
});

// 添加预览相关状态
const previewVisible = ref(false);
const currentPreviewIndex = ref(0);
const currentPreviewImage = ref({});

// 预览图片样式
const previewImageStyle = computed(() => {
  const maxWidth = window.innerWidth * 0.9; // 最大宽度为视窗宽度的90%
  const maxHeight = window.innerHeight * 0.8; // 最大高度为视窗高度的80%
  return {
    maxWidth: `${maxWidth}px`,
    maxHeight: `${maxHeight}px`,
    width: 'auto',
    height: 'auto',
    objectFit: 'contain', // 确保图片完整显示
  };
});

// 修改获取图片列表的方法 - 实现懒加载
const fetchImageList = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      creator: basicForm.uploader, // 这里传递的是用户ID
      start_datetime: basicForm.startTime ? dayjs(basicForm.startTime).format('YYYY-MM-DDTHH:mm:ss') : null,
      end_datetime: basicForm.endTime ? dayjs(basicForm.endTime).format('YYYY-MM-DDTHH:mm:ss') : null,
    };
    if (selectedTags.value.length > 0) {
      selectedTags.value.forEach(tagId => {
        params[`tag_ids[]`] = tagId;
      });
    }
    
    const response = await getImageList(params);
    console.log("**img response**:", response);
    
    if (response && response.code === 0 && response.data && Array.isArray(response.data.results)) {
      // 先清空现有数据
      imageData.value = [];
      pagination.value.total = response.data.count || 0;
      
      // 为每个图片创建占位符，然后逐个加载
      const placeholders = response.data.results.map(item => ({
        id: item.id,
        name: item.img_name,
        url: null, // 初始为空，懒加载
        uploader: item.username || item.creator || '未知', // 优先使用username字段
        uploadTime: item.create_time,
        tags: item.tags || [],
        loading: true // 添加加载状态
      }));
      
      imageData.value = placeholders;
      
      // 逐个加载图片内容
      loadImagesSequentially(response.data.results);
    } else {
      message.warning('获取的图片列表为空');
      imageData.value = [];
      pagination.value.total = 0;
    }
  } catch (error) {
    console.error('获取图片列表失败:', error);
    message.error('获取图片列表失败');
  } finally {
    loading.value = false;
  }
};

// 新增：逐个加载图片内容的函数
const loadImagesSequentially = async (imageItems) => {
  for (let i = 0; i < imageItems.length; i++) {
    try {
      const item = imageItems[i];
      // 直接使用原始图片API，移除缩略图逻辑
      const image_content = await getImageContent(item.id, {
        responseType: 'blob'
      });
      
      const url = URL.createObjectURL(image_content);
      
      // 找到对应的图片并更新
      const index = imageData.value.findIndex(img => img.id === item.id);
      if (index !== -1) {
        imageData.value[index].url = url;
        imageData.value[index].loading = false;
      }
      
      // 可选：添加小延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Error loading image ${imageItems[i].id}:`, error);
      // 更新加载失败状态
      const index = imageData.value.findIndex(img => img.id === imageItems[i].id);
      if (index !== -1) {
        imageData.value[index].loading = false;
        imageData.value[index].loadError = true;
      }
    }
  }
};
const handleTagClick = (tagId) => {
  selectedTags.value = [tagId]; // 设置选中的标签
  handleSearch(); // 触发查询
};
// 修改获取标签名称的方法
const getTagNames = (tags) => {
  if (!tags || !Array.isArray(tags)) return [];

  // 返回包含标签名称和ID的对象数组
  return tags.map(tag => ({
    id: tag.id, // 标签ID
    name: tag.tag_name // 标签名称
  })).filter(tag => tag.name);
};

// 初始化
onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);
  fetchImageList(); // 初始化时加载数据
});

const imageHeight = ref(200); // 保持默认高度
const imageWidth = ref(300); // 新增宽度控制

const handleResize = () => {
  const width = window.innerWidth;
  if (width < 576) {
    imageHeight.value = 120;
    imageWidth.value = 180;
  } else if (width < 768) {
    imageHeight.value = 150;
    imageWidth.value = 225;
  } else if (width < 992) {
    imageHeight.value = 180;
    imageWidth.value = 270;
  } else if (width < 1200) {
    imageHeight.value = 200;
    imageWidth.value = 300;
  } else {
    imageHeight.value = 220;
    imageWidth.value = 330;
  }
};

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.value.current = current;
  pagination.value.pageSize = pageSize;
  fetchImageList(); // 分页变化时重新加载数据
};

// 搜索
const handleSearch = () => {
  pagination.value.current = 1;
  fetchImageList(); // 搜索时重新加载数据
};

// 日期范围变化处理
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    basicForm.startTime = dates[0];
    basicForm.endTime = dates[1];
  } else {
    basicForm.startTime = null;
    basicForm.endTime = null;
  }
};

// 重置基础查询
const resetBasicSearch = () => {
  basicForm.name = '';
  basicForm.uploader = '';
  basicForm.dateRange = []; // 清空日期范围选择器
  basicForm.startTime = null;
  basicForm.endTime = null;
  selectedTags.value = []; // 新增：清空已选标签
  handleSearch(); // 调用搜索方法更新列表
};

// 上传处理
const handleUploadChange = (info) => {
  if (info.file.status === 'done') {
    // 已经在customRequest中处理
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败`);
  }
};

// 图片预览功能 - 简化版本，直接使用已加载的原始图片
const openPreview = async (image, index) => {
  // 直接使用已经加载的原始图片URL
  currentPreviewImage.value = {
    ...image,
    url: image.url // 直接使用列表中已加载的原始图片
  };
  currentPreviewIndex.value = index;
  previewVisible.value = true;
};

const closePreview = () => {
  // 释放高清图片的Blob URL
  if (currentPreviewImage.value.url && currentPreviewImage.value.url.startsWith('blob:')) {
    URL.revokeObjectURL(currentPreviewImage.value.url);
  }
  previewVisible.value = false;
};

const showPrevImage = () => {
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--;
  } else {
    currentPreviewIndex.value = imageData.value.length - 1;
  }
  // 直接使用已加载的图片，无需重新加载
  const image = imageData.value[currentPreviewIndex.value];
  currentPreviewImage.value = {
    ...image,
    url: image.url
  };
};

const showNextImage = () => {
  if (currentPreviewIndex.value < imageData.value.length - 1) {
    currentPreviewIndex.value++;
  } else {
    currentPreviewIndex.value = 0;
  }
  // 直接使用已加载的图片，无需重新加载
  const image = imageData.value[currentPreviewIndex.value];
  currentPreviewImage.value = {
    ...image,
    url: image.url
  };
};



// 键盘事件处理
const handleKeyDown = (e) => {
  if (!previewVisible.value) return;

  if (e.key === 'ArrowLeft') {
    showPrevImage();
  } else if (e.key === 'ArrowRight') {
    showNextImage();
  } else if (e.key === 'Escape') {
    closePreview();
  }
};
// 上传前校验
const beforeUpload = (file) => {
  const isImage = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(file.type);
  if (!isImage) {
    message.error('只能上传图片文件!');
    return false;
  }
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    message.error('图片大小不能超过50MB!');
    return false;
  }
  return true;
};

// 自定义上传处理
const handleUpload = async ({ file, onProgress, onSuccess, onError }) => {
  try {
    const response = await uploadImages(
      [file],
      'normal',
      (progress) => onProgress({ percent: progress })
    );

    // 上传成功后添加到图片列表
    const newImage = {
      id: response.data.id || Date.now(),
      name: file.name,
      url: URL.createObjectURL(file),
      uploader: '当前用户',
      uploadTime: new Date().toISOString(),
      tags: []
    };
    imageData.value.unshift(newImage);

    onSuccess(response, file);
    message.success(`${file.name} 上传成功`);
  } catch (error) {
    onError(error);
    message.error(`${file.name} 上传失败: ${error.message}`);
  }
};

// 处理多文件上传
const handleMultiUpload = async (files) => {
  try {
    loading.value = true;
    const validFiles = files.filter(file => beforeUpload(file));

    if (validFiles.length === 0) {
      return;
    }

    const response = await uploadImages(validFiles, 'normal', (progress) => {
      console.log(`总进度: ${progress}%`);
    });

    // 处理上传成功的图片
    const newImages = await Promise.all(
      validFiles.map(async (file, index) => {
        return {
          id: response.data[index].id || Date.now() + index,
          name: file.name,
          url: URL.createObjectURL(file),
          uploader: '当前用户',
          uploadTime: new Date().toISOString(),
          tags: []
        };
      })
    );

    imageData.value.unshift(...newImages);
    message.success(`成功上传 ${newImages.length} 张图片`);
  } catch (error) {
    message.error(`上传失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};
// 删除图片功能
// 修改删除确认对话框
const showDeleteConfirm = (imageId) => {
  Modal.confirm({
    title: '确认删除图片',
    content: '您确定要删除这张图片吗？删除后无法恢复',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      handleDeleteImage(imageId);
    }
  });
};

// 新增删除处理方法
const handleDeleteImage = async (imageId) => {
  try {
    await deleteImages([imageId]);
    const index = imageData.value.findIndex(img => img.id === imageId);
    if (index !== -1) {
      // 释放图片的Blob URL
      if (imageData.value[index].url && imageData.value[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(imageData.value[index].url);
      }
      imageData.value.splice(index, 1);
      message.success('图片删除成功');
    }
  } catch (error) {
    console.error('删除图片失败:', error);
    message.error('图片删除失败');
  }
};

// 标签编辑功能
// 修改标签编辑方法
const showTagModal = (image) => {
  tagForm.imageId = image.id;
  tagForm.currentTags = image.tags.map(tag => tag.id); // 确保传递的是标签 ID 数组
  tagModalVisible.value = true;
};


const closeTagModal = () => {
  tagModalVisible.value = false;
};

const addImageTag = (tagId) => {
  if (!tagForm.currentTags.includes(tagId)) {
    tagForm.currentTags.push(tagId);
  }
};

const removeImageTag = (tagId) => {
  const index = tagForm.currentTags.indexOf(tagId);
  if (index > -1) {
    tagForm.currentTags.splice(index, 1);
  }
};

const handleTagSubmit = async () => {
  try {
    const imageIndex = imageData.value.findIndex(img => img.id === tagForm.imageId);
    if (imageIndex !== -1) {
      // 调用绑定标签接口
      const response = await bindTags({
        image_id: tagForm.imageId,
        tag_ids: tagForm.currentTags
      });

      if (response.code === 0) {
        // 重新获取图片详情以更新标签数据
        const updatedImage = await getImageDetail(tagForm.imageId);
        if (updatedImage) {
          // 更新本地图片标签数据
          imageData.value[imageIndex].tags = updatedImage.tags || [];
        }
        message.success('标签更新成功');
        closeTagModal();
      } else {
        message.error(response.message || '标签更新失败');
      }
    }
  } catch (error) {
    console.error('标签更新失败:', error);
    message.error('标签更新失败');
  }
};


// 显示加入素材集模态框
const showAddToAssetModal = async (image) => {
  selectedImage.value = image;
  addToAssetVisible.value = true;
  await fetchAssetCollections();
};

// 获取素材集列表
const fetchAssetCollections = async () => {
  try {
    loadingAssets.value = true;
    const response = await getAssetCollectionList({});
    console.log('API返回数据:', response);
    
    // 修改条件判断：直接检查 results 数组
    if (response?.results && Array.isArray(response.results)) {
      assetCollections.value = response.results;
      console.log('设置的素材集数据:', assetCollections.value);
    } else {
      console.log('数据格式不正确:', response);
    }
  } catch (error) {
    console.error('获取素材集列表失败:', error);
    message.error('获取素材集列表失败');
  } finally {
    loadingAssets.value = false;
  }
};

// 处理加入素材集
const handleAddToAsset = async () => {
  if (!selectedAssetId.value || !selectedImage.value) {
    message.warning('请选择素材集');
    return;
  }

  try {
    loadingAssets.value = true;
    const response = await addItemToAsset({
      set_id: selectedAssetId.value,
      resource_id: selectedImage.value.id,
      asset_type: 'image'
    });

    if (response?.code === 0) {
      message.success('成功加入素材集');
      handleCancelAddToAsset();
    } else {
      message.error(response?.message || '加入素材集失败');
    }
  } catch (error) {
    console.error('加入素材集失败:', error);
    message.error('加入素材集失败');
  } finally {
    loadingAssets.value = false;
  }
};

// 取消加入素材集
const handleCancelAddToAsset = () => {
  addToAssetVisible.value = false;
  selectedImage.value = null;
  selectedAssetId.value = null;
};

// 批量选择功能
const toggleBatchMode = () => {
  batchMode.value = !batchMode.value;
  if (!batchMode.value) {
    clearSelection();
  }
};

// 处理卡片点击事件
const handleCardClick = (image, index) => {
  if (batchMode.value) {
    toggleImageSelection(image.id);
  } else {
    openPreview(image, index);
  }
};

const toggleImageSelection = (imageId) => {
  const index = selectedImages.value.indexOf(imageId);
  if (index > -1) {
    selectedImages.value.splice(index, 1);
  } else {
    selectedImages.value.push(imageId);
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedImages.value = [];
  } else {
    selectedImages.value = currentPageImages.value.map(image => image.id);
  }
};

const clearSelection = () => {
  selectedImages.value = [];
};

// 批量删除功能
const showBatchDeleteConfirm = () => {
  if (selectedImages.value.length === 0) {
    message.warning('请先选择要删除的图片');
    return;
  }
  
  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedImages.value.length} 张图片吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: handleBatchDelete,
  });
};

const handleBatchDelete = async () => {
  try {
    await deleteImages(selectedImages.value);
    
    // 从本地数据中移除已删除的图片
    selectedImages.value.forEach(imageId => {
      const index = imageData.value.findIndex(img => img.id === imageId);
      if (index !== -1) {
        // 释放图片的Blob URL
        if (imageData.value[index].url && imageData.value[index].url.startsWith('blob:')) {
          URL.revokeObjectURL(imageData.value[index].url);
        }
        imageData.value.splice(index, 1);
      }
    });
    
    message.success(`成功删除 ${selectedImages.value.length} 张图片`);
    clearSelection();
    
    // 如果当前页没有数据了，跳转到上一页
    if (currentPageImages.value.length === 0 && pagination.value.current > 1) {
      pagination.value.current--;
      fetchImageList();
    }
  } catch (error) {
    console.error('批量删除图片失败:', error);
    message.error('批量删除图片失败');
  }
};

// 修改标签数据获取方式
const tagCategories = ref([]);

// 在onMounted中添加获取标签分类的逻辑
onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);
  fetchImageList();
  fetchTagCategories(); // 新增方法调用
});

const fetchTagCategories = async () => {
  try {
    const response = await getTagsByCategory({ category: 'IMAGE' });
    if (response?.code === 0 && Array.isArray(response.data)) {
      // 将嵌套结构扁平化
      const flattenTags = (categories) => {
        return categories.reduce((acc, category) => {
          acc.push({
            id: category.id,
            name: category.tag_name,
            children: category.children ? flattenTags(category.children) : []
          });
          return acc;
        }, []);
      };

      tagCategories.value = flattenTags(response.data);
      console.log("**tagCategories**:", tagCategories.value);
    }
  } catch (error) {
    console.error('获取标签分类失败:', error);
    message.error('获取标签分类失败');
  }
};


</script>

<style scoped>
.image-list-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-header {
  margin-bottom: 16px;
}

.basic-search .ant-form-item {
  margin-bottom: 16px;
}

.tag-search {
  margin-top: 16px;
}



.image-grid {
  flex: 1;
  margin-bottom: 20px;
}

.image-col {
  width: 20%;
}

@media (max-width: 1200px) {
  .image-col {
    width: 25%;
  }
}

@media (max-width: 992px) {
  .image-col {
    width: 33.333%;
  }
}

@media (max-width: 768px) {
  .image-col {
    width: 50%;
  }
}

@media (max-width: 576px) {
  .image-col {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .image-card {
    margin-bottom: 16px;
  }
}

.image-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.image-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.image-preview {
  width: 100%;
  object-fit: cover;
}

.image-meta {
  font-size: 12px;
  color: #666;
}

.image-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 图片预览模态框样式 */
.image-preview-modal :deep(.ant-modal-body) {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 90vw;
}

.image-preview-modal :deep(.ant-modal-content) {
  background-color: transparent;
  box-shadow: none;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image-wrapper {
  position: relative;
  max-width: 90vw;
  margin: 0 auto;
  text-align: center;
}

.preview-image {
  object-fit: contain;
  display: block;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  transition: all 0.3s ease;
  background-color: #fff;
  padding: 8px;
}

.preview-meta {
  margin-top: 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 4px;
}

.preview-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.preview-info {
  margin-bottom: 8px;
  color: #666;
}

.preview-info span {
  margin-right: 16px;
}

.preview-tags {
  margin-top: 8px;
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.3s;
}

.preview-nav:hover {
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
}

.preview-prev {
  left: 20px;
}

.preview-next {
  right: 20px;
}

/* 标签编辑模态框样式 */
.tag-edit-modal :deep(.ant-modal-body) {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.tag-edit-modal :deep(.tag-search-container) {
  box-shadow: none;
  padding: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-nav {
    width: 30px;
    height: 30px;
  }

  .preview-prev {
    left: 10px;
  }

  .preview-next {
    right: 10px;
  }

  .preview-meta {
    padding: 8px;
  }

  .preview-title {
    font-size: 16px;
  }

  .preview-info span {
    display: block;
    margin-right: 0;
    margin-bottom: 4px;
  }
}

.loading-placeholder,
.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f5f5f5;
  color: #666;
}

.loading-placeholder p,
.error-placeholder p {
  margin-top: 8px;
  font-size: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  transition: color 0.3s;
}

.action-item:hover {
  color: #1890ff;
}

.action-text {
  font-size: 12px;
  margin-top: 4px;
}

/* 批量选择样式 */
.action-area {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.upload-section {
  margin-left: auto;
}

.image-card {
  position: relative;
  transition: all 0.3s ease;
}

.image-card.selected {
  border: 2px solid #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.selection-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
}

.selection-overlay:hover {
  background: rgba(255, 255, 255, 1);
}

@media (max-width: 768px) {
  .action-area {
    flex-direction: column;
    align-items: stretch;
  }
  
  .batch-actions {
    margin-left: 0;
    margin-top: 8px;
    justify-content: center;
  }
  
  .upload-section {
    margin-left: 0;
    margin-top: 8px;
    text-align: center;
  }
}

.cover-container {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #f5f5f5;
}

.cover-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}
</style>
