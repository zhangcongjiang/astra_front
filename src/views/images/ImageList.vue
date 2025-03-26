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
                <div class="tag-categories">
                    <div class="tag-category" v-for="category in tagCategories" :key="category.id">
                        <div class="category-title">{{ category.name }}：</div>
                        <div class="tags">
                            <a-tag v-for="tag in category.tags" :key="tag.id"
                                :color="selectedTags.includes(tag.id) ? 'blue' : 'default'" @click="toggleTag(tag.id)">
                                {{ tag.name }}
                            </a-tag>
                        </div>
                    </div>
                </div>
                <div class="tag-search-actions">
                    <a-button type="primary" @click="handleSearch">查询</a-button>
                    <a-button @click="clearTags">清空</a-button>
                </div>
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
                                        <a-tag v-for="tag in image.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                                    </div>
                                </div>
                            </template>
                        </a-card-meta>
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
                            <a-tag v-for="tag in currentPreviewImage.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                        </div>
                    </div>
                </div>

                <div class="preview-nav preview-next" @click="showNextImage">
                    <right-circle-outlined style="font-size: 32px" />
                </div>
            </div>
        </a-modal>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { UploadOutlined, LeftCircleOutlined, RightCircleOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination.vue';

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

// 计算预览图片样式
const previewImageStyle = computed(() => {
    // 获取当前列表图片的尺寸
    const listWidth = document.querySelector('.image-preview')?.clientWidth || 200;
    const listHeight = imageHeight.value || 200;

    // 至少放大一倍
    const minWidth = listWidth * 2;
    const minHeight = listHeight * 2;

    // 最大不超过视口的90%
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.8;

    // 计算保持宽高比的尺寸
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
    const types = ['风景', '人物', '动物', '建筑'];
    const colors = ['红色', '蓝色', '绿色', '黑白'];
    const uploaders = ['用户A', '用户B', '用户C', '用户D'];

    for (let i = 1; i <= count; i++) {
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        mockImages.push({
            id: i,
            name: `${randomType}${i}.jpg`,
            url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/200`,
            uploader: uploaders[Math.floor(Math.random() * uploaders.length)],
            uploadTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD'),
            tags: [randomType, randomColor]
        });
    }

    return mockImages;
}

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
            return selectedTags.value.some(tag =>
                image.tags.some(imageTag => imageTag.includes(tag.split('_')[1]))
            );
        }

        return true;
    });

    // 更新分页总数
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
    if (width < 576) {       // 超小屏幕
        imageHeight.value = 120;
    } else if (width < 768) { // 小屏幕
        imageHeight.value = 150;
    } else if (width < 992) { // 中等屏幕
        imageHeight.value = 180;
    } else if (width < 1200) { // 大屏幕
        imageHeight.value = 200;
    } else {                 // 超大屏幕
        imageHeight.value = 220;
    }
};

// 切换标签
const toggleTag = (tagId) => {
    const index = selectedTags.value.indexOf(tagId);
    if (index > -1) {
        selectedTags.value.splice(index, 1);
    } else {
        selectedTags.value.push(tagId);
    }
};

// 清空标签
const clearTags = () => {
    selectedTags.value = [];
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
        // 上传成功处理
        message.success(`${info.file.name} 上传成功`);
        // 添加到图片列表
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
        // 循环到最后一个
        currentPreviewIndex.value = filteredImages.value.length - 1;
    }
    currentPreviewImage.value = filteredImages.value[currentPreviewIndex.value];
};

const showNextImage = () => {
    if (currentPreviewIndex.value < filteredImages.value.length - 1) {
        currentPreviewIndex.value++;
    } else {
        // 循环到第一个
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

// 初始化
onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    // 初始化分页总数
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

.tag-category {
    display: flex;
    margin-bottom: 12px;
}

.category-title {
    width: 80px;
    font-weight: bold;
    flex-shrink: 0;
}

.tags {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tag-search-actions {
    margin-top: 16px;
    text-align: right;
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