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
            <a-form-item label="图片名称">
              <a-input v-model:value="basicForm.name" placeholder="输入图片名称" @pressEnter="handleSearch" />
            </a-form-item>
            <a-form-item label="上传者">
              <a-input v-model:value="basicForm.uploader" placeholder="输入上传者名称" @pressEnter="handleSearch" />
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
            @search="handleSearch" />
        </div>
      </div>
  
      <!-- 操作按钮 -->
      <div class="action-area">
        <a-upload v-model:file-list="fileList" name="file" :multiple="true" action="/api/upload"
          @change="handleUploadChange">
          <a-button type="primary">
            <upload-outlined /> 上传图片
          </a-button>
        </a-upload>
      </div>
  
      <!-- 图片列表 - 响应式5列布局 -->
      <div class="image-grid">
        <a-row :gutter="[16, 16]">
          <a-col v-for="(image, index) in currentPageImages" :key="image.id" :xs="24" :sm="12" :md="8" :lg="6"
            :xl="4.8" class="image-col">
            <a-card hoverable class="image-card"
              @click="openPreview(image, index + (pagination.current - 1) * pagination.pageSize)">
              <template #cover>
                <img :src="image.url" class="image-preview" :style="{ height: `${imageHeight}px` }" />
              </template>
              <a-card-meta :title="image.name">
                <template #description>
                  <div class="image-meta">
                    <div>上传者: {{ image.uploader }}</div>
                    <div>上传时间: {{ formatDate(image.uploadTime) }}</div>
                    <div class="image-tags">
                      <a-tag v-for="tag in getTagNames(image.tags)" :key="tag" color="blue">{{ tag }}</a-tag>
                    </div>
                  </div>
                </template>
              </a-card-meta>
              <template #actions>
                <!-- 删除按钮 -->
                <a-tooltip title="删除图片">
                  <delete-outlined @click.stop="showDeleteConfirm(image.id)" />
                </a-tooltip>
                <!-- 编辑标签按钮 -->
                <a-tooltip title="编辑标签">
                  <tags-outlined @click.stop="showTagModal(image)" />
                </a-tooltip>
              </template>
            </a-card>
          </a-col>
        </a-row>
      </div>
  
      <!-- 分页控制 -->
      <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
        :total="pagination.total" @change="handlePaginationChange" />
  
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
                <a-tag v-for="tag in getTagNames(currentPreviewImage.tags)" :key="tag" color="blue">{{ tag }}</a-tag>
              </div>
            </div>
          </div>
  
          <div class="preview-nav preview-next" @click="showNextImage">
            <right-circle-outlined style="font-size: 32px" />
          </div>
        </div>
      </a-modal>
  
      <!-- 标签编辑模态框 -->
      <a-modal v-model:visible="tagModalVisible" title="编辑图片标签" @ok="handleTagSubmit" @cancel="closeTagModal" width="800px">
        <TagSearch 
          :tags="tagCategories" 
          :show-actions="false"
          :allow-image-tagging="true"
          :image-tags="tagForm.currentTags"
          @add-image-tag="addImageTag"
          @remove-image-tag="removeImageTag"
        />
      </a-modal>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
  import { UploadOutlined, LeftCircleOutlined, RightCircleOutlined, DeleteOutlined, TagsOutlined } from '@ant-design/icons-vue';
  import dayjs from 'dayjs';
  import { Modal, message } from 'ant-design-vue';
  import Pagination from '@/components/Pagination.vue';
  import TagSearch from '@/components/TagSearch.vue';
  
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
  
  // 标签数据
  const tagCategories = ref([
    {
      id: 1,
      name: '类型',
      tags: [
        { id: 'type_1', name: '风景' },
        { id: 'type_2', name: '人物' },
        { id: 'type_3', name: '动物' },
        { id: 'type_4', name: '建筑' }
      ]
    },
    {
      id: 2,
      name: '颜色',
      tags: [
        { id: 'color_1', name: '红色' },
        { id: 'color_2', name: '蓝色' },
        { id: 'color_3', name: '绿色' },
        { id: 'color_4', name: '黑白' }
      ]
    }
  ]);
  
  // 选中的标签
  const selectedTags = ref([]);
  
  // 图片数据
  const imageData = ref(generateMockImages(50));
  
  // 分页配置
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // 图片高度响应式设置
  const imageHeight = ref(200);
  
  // 图片预览相关状态
  const previewVisible = ref(false);
  const currentPreviewIndex = ref(0);
  const currentPreviewImage = ref({});
  
  // 标签编辑相关状态
  const tagModalVisible = ref(false);
  const tagForm = reactive({
    imageId: null,
    currentTags: []
  });
  
  // 计算预览图片样式
  const previewImageStyle = computed(() => {
    const listWidth = document.querySelector('.image-preview')?.clientWidth || 200;
    const listHeight = imageHeight.value || 200;
  
    const minWidth = listWidth * 2;
    const minHeight = listHeight * 2;
  
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.8;
  
    let width = minWidth;
    let height = minHeight;
  
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }
  
    if (height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }
  
    return {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: '100%',
      maxHeight: '100%'
    };
  });
  
  // 生成模拟图片数据
  function generateMockImages(count) {
    const mockImages = [];
    const types = ['type_1', 'type_2', 'type_3', 'type_4'];
    const colors = ['color_1', 'color_2', 'color_3', 'color_4'];
    const uploaders = ['用户A', '用户B', '用户C', '用户D'];
  
    for (let i = 1; i <= count; i++) {
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
      mockImages.push({
        id: i,
        name: `图片${i}.jpg`,
        url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/200`,
        uploader: uploaders[Math.floor(Math.random() * uploaders.length)],
        uploadTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD'),
        tags: [randomType, randomColor]
      });
    }
  
    return mockImages;
  }
  
  // 根据标签ID获取标签名称
  const getTagNames = (tagIds) => {
    const names = [];
    tagIds.forEach(tagId => {
      const foundTag = findTagById(tagId);
      if (foundTag) names.push(foundTag.name);
    });
    return names;
  };
  
  // 根据标签ID查找标签
  const findTagById = (tagId) => {
    for (const category of tagCategories.value) {
      const foundTag = category.tags.find(t => t.id === tagId);
      if (foundTag) return foundTag;
    }
    return null;
  };
  
  // 当前页显示的图片
  const currentPageImages = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredImages.value.slice(start, end);
  });
  
  // 过滤后的图片
  const filteredImages = computed(() => {
    const filtered = imageData.value.filter(image => {
      // 基础查询过滤
      if (searchType.value === 'basic') {
        const nameMatch = image.name.toLowerCase().includes(basicForm.name.toLowerCase());
        const uploaderMatch = image.uploader.toLowerCase().includes(basicForm.uploader.toLowerCase());
        let dateMatch = true;
  
        if (basicForm.startTime && basicForm.endTime) {
          const imageDate = dayjs(image.uploadTime);
          dateMatch = imageDate.isAfter(basicForm.startTime) &&
            imageDate.isBefore(basicForm.endTime);
        }
  
        return nameMatch && uploaderMatch && dateMatch;
      }
  
      // 标签查询过滤
      if (searchType.value === 'tag' && selectedTags.value.length > 0) {
        return selectedTags.value.some(tagId => image.tags.includes(tagId));
      }
  
      return true;
    });
  
    pagination.total = filtered.length;
    return filtered;
  });
  
  // 格式化日期
  const formatDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
  };
  
  // 窗口大小变化处理
  const handleResize = () => {
    const width = window.innerWidth;
    if (width < 576) {
      imageHeight.value = 120;
    } else if (width < 768) {
      imageHeight.value = 150;
    } else if (width < 992) {
      imageHeight.value = 180;
    } else if (width < 1200) {
      imageHeight.value = 200;
    } else {
      imageHeight.value = 220;
    }
  };
  
  // 搜索
  const handleSearch = () => {
    pagination.current = 1;
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
    basicForm.dateRange = [];
    basicForm.startTime = null;
    basicForm.endTime = null;
    handleSearch();
  };
  
  // 分页变化处理
  const handlePaginationChange = ({ current, pageSize }) => {
    pagination.current = current;
    pagination.pageSize = pageSize;
  };
  
  // 上传处理
  const handleUploadChange = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`);
      imageData.value.unshift({
        id: Date.now(),
        name: info.file.name,
        url: URL.createObjectURL(info.file.originFileObj),
        uploader: '当前用户',
        uploadTime: new Date().toISOString(),
        tags: []
      });
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };
  
  // 图片预览功能
  const openPreview = (image, index) => {
    currentPreviewIndex.value = index;
    currentPreviewImage.value = image;
    previewVisible.value = true;
  };
  
  const closePreview = () => {
    previewVisible.value = false;
  };
  
  const showPrevImage = () => {
    if (currentPreviewIndex.value > 0) {
      currentPreviewIndex.value--;
    } else {
      currentPreviewIndex.value = filteredImages.value.length - 1;
    }
    currentPreviewImage.value = filteredImages.value[currentPreviewIndex.value];
  };
  
  const showNextImage = () => {
    if (currentPreviewIndex.value < filteredImages.value.length - 1) {
      currentPreviewIndex.value++;
    } else {
      currentPreviewIndex.value = 0;
    }
    currentPreviewImage.value = filteredImages.value[currentPreviewIndex.value];
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
  
  // 删除图片功能
  const showDeleteConfirm = (imageId) => {
    Modal.confirm({
      title: '确认删除图片',
      content: '您确定要删除这张图片吗？删除后无法恢复',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        deleteImage(imageId);
      }
    });
  };
  
  const deleteImage = (imageId) => {
    const index = imageData.value.findIndex(img => img.id === imageId);
    if (index !== -1) {
      imageData.value.splice(index, 1);
      message.success('图片删除成功');
      if (previewVisible.value && currentPreviewImage.value.id === imageId) {
        closePreview();
      }
    } else {
      message.error('图片删除失败');
    }
  };
  
  // 标签编辑功能
  const showTagModal = (image) => {
    tagForm.imageId = image.id;
    tagForm.currentTags = [...image.tags];
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
  
  const handleTagSubmit = () => {
    const imageIndex = imageData.value.findIndex(img => img.id === tagForm.imageId);
    if (imageIndex !== -1) {
      imageData.value[imageIndex].tags = [...tagForm.currentTags];
      message.success('标签更新成功');
      closeTagModal();
    }
  };
  
  // 初始化
  onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    pagination.total = imageData.value.length;
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);
  });
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
  
  .action-area {
    margin-bottom: 20px;
    text-align: right;
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
    transition: height 0.3s;
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
  
  @media (max-width: 576px) {
    .image-card {
      margin-bottom: 16px;
    }
  }
  </style>