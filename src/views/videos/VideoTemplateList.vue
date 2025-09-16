<template>
    <div class="video-template-container">
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
                    <a-form-item label="模板名称">
                        <a-input v-model:value="basicForm.name" placeholder="输入模板名称" @pressEnter="handleSearch" />
                    </a-form-item>
                    <a-form-item label="模板类型">
                        <a-select v-model:value="basicForm.templateType" placeholder="选择模板类型" style="width: 120px" allowClear>
                            <a-select-option value="">全部</a-select-option>
                            <a-select-option value="JianYing">剪映视频</a-select-option>
                            <a-select-option value="Regular">普通视频</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="方向">
                        <a-select v-model:value="basicForm.orientation" placeholder="全部方向" style="width: 120px">
                            <a-select-option value="">全部</a-select-option>
                            <a-select-option value="horizontal">横向</a-select-option>
                            <a-select-option value="vertical">竖向</a-select-option>
                        </a-select>
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

        <!-- 视频模板列表 -->
        <div class="template-grid">
            <a-spin :spinning="loading" tip="加载中...">
                <a-row :gutter="[16, 16]">
                    <a-col v-for="(template, index) in currentPageTemplates" :key="template.id" 
                           :xs="24" :sm="12" :md="8" :lg="6">
                    <a-card hoverable class="template-card">
                        <div class="card-content">
                            
                            <!-- 左侧封面 -->
                            <div class="cover-wrapper">
                                <div class="video-container" :class="template.orientation">
                                    <video 
                                        :src="getVideoUrl(template)" 
                                        class="cover-video" 
                                        :class="template.orientation"
                                        preload="metadata"
                                        muted
                                        @click="playVideo($event)"
                                        @loadedmetadata="onVideoLoaded($event)"
                                    >
                                        您的浏览器不支持视频播放
                                    </video>
                                    <div class="play-overlay" @click="playVideo($event)">
                                        <div class="play-button">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 右侧内容 -->
                            <div class="right-content">
                                <!-- 上部信息 -->
                                <div class="info-wrapper">
                                    <h3>{{ template.name }}</h3>
                                    <div class="template-type-info">
                                        <span class="type-label">类型：</span>
                                        <span class="type-value">{{ getTemplateTypeText(template.template_type) }}</span>
                                    </div>
                                    <div class="template-size-info">
                                        <span class="size-label">尺寸：</span>
                                        <span class="size-value">{{ template.orientation === 'horizontal' ? '横版视频（16:9）' : '竖版视频（9:16）' }}</span>
                                    </div>
                                    <p class="description" :title="template.description">
                                        {{ template.description }}
                                    </p>
                                </div>
                                
                                <!-- 下部标签 -->
                                <div class="tag-section">
                                    <a-tag v-for="tag in getTagNames(template.tags)" :key="tag" color="orange">
                                        {{ tag }}
                                    </a-tag>
                                </div>
                            </div>
                        </div>

                        <template #actions>
                            <a-button type="primary" @click="applyTemplate(template)">应用模板</a-button>
                        </template>
                        </a-card>
                    </a-col>
                </a-row>
            </a-spin>
        </div>

        <!-- 分页控制 -->
        <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
            :total="pagination.total" :showSizeChanger="true" :pageSizeOptions="['10', '20', '50', '100']"
            @change="handlePaginationChange" @showSizeChange="handlePaginationChange" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import TagSearch from '@/components/TagSearch.vue';
import Pagination from '@/components/Pagination.vue';
import { getVideoTemplates } from '@/api/modules/videoApi.js';

const router = useRouter();

// 加载状态
const loading = ref(false);

// 搜索类型
const searchType = ref('basic');

// 基础查询表单
const basicForm = reactive({
    name: '',
    templateType: '',
    orientation: '',
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
            { id: 'type_1', name: '宣传片' },
            { id: 'type_2', name: '教程' },
            { id: 'type_3', name: '产品展示' },
            { id: 'type_4', name: '活动记录' }
        ]
    },
    {
        id: 2,
        name: '风格',
        tags: [
            { id: 'style_1', name: '简约' },
            { id: 'style_2', name: '科技感' },
            { id: 'style_3', name: '复古' },
            { id: 'style_4', name: '卡通' }
        ]
    }
]);

// 选中的标签
const selectedTags = ref([]);

// 视频模板数据
const templates = ref([]);

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0
});

// 当前页显示的模板（服务器端分页，直接返回templates）
const currentPageTemplates = computed(() => {
    return templates.value;
});

// 应用模板
const applyTemplate = (template) => {
    console.log('apply template', template);
    // 使用 history state 传递模板数据，避免URL过长，同时也能传递复杂对象
    router.push({
        name: 'VideoTemplateApply',
        params: { id: template.id },
        state: { template: JSON.stringify(template) } // 序列化template对象
    });
};

// 获取模板列表数据
const fetchTemplates = async () => {
    try {
        loading.value = true;
        
        // 构建查询参数
        const params = {
            page: pagination.current,
            pageSize: pagination.pageSize
        };
        
        // 基础查询参数
        if (searchType.value === 'basic') {
            if (basicForm.name) {
                params.name = basicForm.name;
            }
            if (basicForm.templateType) {
                params.template_type = basicForm.templateType;
            }
            if (basicForm.orientation) {
                params.orientation = basicForm.orientation;
            }
        }
        
        // 标签查询参数
        if (searchType.value === 'tag' && selectedTags.value.length > 0) {
            params.tag_id = selectedTags.value.join(',');
        }
        
        const response = await getVideoTemplates(params);
        
        if (response.code === 0) {
            // 字段映射转换
            const mappedTemplates = (response.data.results || []).map(template => ({
                id: template.template_id,
                name: template.name,
                description: template.desc,
                orientation: template.orientation?.toLowerCase() || 'horizontal',
                template_type: template.template_type,
                tags: template.tags || [],
                cover: template.demo, // 使用demo字段作为封面
                videoUrl: template.demo,
                params: template.parameters || {},
                createTime: template.created_at || new Date().toISOString()
            }));
            
            templates.value = mappedTemplates;
            pagination.total = response.data.count || 0;
        } else {
            message.error(response.message || '获取模板列表失败');
        }
    } catch (error) {
        console.error('获取模板列表失败:', error);
        message.error('获取模板列表失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

// 搜索
const handleSearch = () => {
    pagination.current = 1;
    fetchTemplates();
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
    basicForm.templateType = '';
    basicForm.orientation = '';
    basicForm.dateRange = [];
    basicForm.startTime = null;
    basicForm.endTime = null;
    handleSearch();
};

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
    pagination.current = current;
    pagination.pageSize = pageSize;
    fetchTemplates();
};

// 组件挂载时获取数据
onMounted(() => {
    fetchTemplates();
});

// 监听搜索类型变化
watch(searchType, () => {
    pagination.current = 1;
    fetchTemplates();
});

// 监听选中标签变化
watch(selectedTags, () => {
    if (searchType.value === 'tag') {
        pagination.current = 1;
        fetchTemplates();
    }
}, { deep: true });

// 根据标签ID获取标签名称
const getTagNames = (tagIds) => {
    const names = [];
    tagIds.forEach(tagId => {
        const foundTag = findTagById(tagId);
        if (foundTag) names.push(foundTag.name);
    });
    return names;
};

// 获取模板类型文本
const getTemplateTypeText = (templateType) => {
    switch (templateType) {
        case 'JianYing':
            return '剪映视频';
        case 'Regular':
            return '普通视频';
        default:
            return '未知类型';
    }
};

// 根据标签ID查找标签
const findTagById = (tagId) => {
    for (const category of tagCategories.value) {
        const foundTag = category.tags.find(t => t.id === tagId);
        if (foundTag) return foundTag;
    }
    return null;
};

// 添加描述截断方法
const truncateDescription = (desc) => {
    if (!desc) return '';
    return desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
};
// 直接使用静态路径
const coverUrl = computed(() => {
  return template.value.coverImage 
    ? template.value.coverImage 
    : template.value.orientation === 'horizontal'
      ? '/src/assets/images/default-horizontal.jpg'
      : '/src/assets/images/default-vertical.jpg';
});
const getCoverUrl = (template) => {
  return template.coverImage || getDefaultCover(template.orientation);
};
const getDefaultCover = (orientation) => {
  return orientation === 'horizontal'
    ? '/src/assets/images/default-horizontal.jpg'
    : '/src/assets/images/default-vertical.jpg';
};

// 获取视频URL
const getVideoUrl = (template) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089';
  const staticBaseUrl = baseUrl.replace('/api', '');
  
  if (template.demo) {
    // 如果demo是完整URL，直接返回
    if (template.demo.startsWith('http')) {
      return template.demo;
    }
    // 如果是相对路径，拼接完整URL
    return `${staticBaseUrl}${template.demo}`;
  }
  
  return template.videoUrl || template.cover || '';
};

// 视频播放处理
const playVideo = (event) => {
  const video = event.target.tagName === 'VIDEO' ? event.target : event.target.closest('.video-container').querySelector('video');
  const overlay = event.target.closest('.video-container').querySelector('.play-overlay');
  
  if (video.paused) {
    video.play();
    overlay.style.display = 'none';
  } else {
    video.pause();
    overlay.style.display = 'flex';
  }
};

// 视频元数据加载完成
const onVideoLoaded = (event) => {
  const video = event.target;
  // 设置视频封面帧（第一帧）
  video.currentTime = 0.1;
};
</script>

<style scoped>
/* 在现有样式中添加 */
.video-type {
    margin: 4px 0 8px 0;
}

.video-type .ant-tag {
    font-size: 12px;
    font-weight: 500;
}

.template-type-info {
    margin: 8px 0;
    font-size: 12px;
    color: #666;
}

.template-size-info {
    margin: 8px 0;
    font-size: 12px;
    color: #666;
}

.type-label, .size-label {
    font-weight: 500;
    margin-right: 4px;
}

.type-value {
    color: #1890ff;
    font-weight: 500;
}

.size-value {
    color: #52c41a;
    font-weight: 500;
}

.video-template-container {
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
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.basic-search .ant-form-item {
    margin-bottom: 16px;
}

.tag-search {
    margin-top: 16px;
}

.template-grid {
    flex: 1;
    margin-bottom: 20px;
}

.template-card {
    height: 100%;
    position: relative; /* 为绝对定位提供参考 */
}

.template-card .ant-card-body {
    position: relative; /* 确保卡片内容区域作为定位参考 */
}

.video-type {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 100; /* 提高层级确保在最上层 */
    margin: 8px; /* 使用margin而不是top/right偏移 */
}

.video-type .ant-tag {
    font-size: 12px;
    font-weight: 500;
    margin: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* 添加阴影增强视觉效果 */
}

.template-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.template-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.cover-container {
    position: relative;
    margin-bottom: 12px;
}

.video-preview {
    position: relative;
    width: 100%;
    background: #000;
    overflow: hidden;
}

.video-preview.horizontal {
    padding-top: 56.25%; /* 16:9 */
}

.video-preview.vertical {
    padding-top: 177.78%; /* 9:16 */
}

.video-preview video {
    position: absolute;
    top: 0;
    left: 0;
    .image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    object-fit: cover;
}

.orientation-tag {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
}

.template-tags-cover {
    position: absolute;
    bottom: 8px;
    left: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.template-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.template-name {
    font-weight: 500;
    margin-bottom: 8px;
}

.template-description {
    color: #666;
    font-size: 14px;
    flex: 1;
}


.cover-image {
  border-radius: 8px;
  display: block;
  margin: 0 auto;
}

.cover-image.horizontal {
  aspect-ratio: 16/9;
  width: 100%;
  object-fit: cover;
  object-position: center;
  margin: auto;
  display: block;
}

.cover-image.vertical {
  aspect-ratio: 9/16;
  height: 100%;
}

/* 视频容器样式 */
.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-video {
  border-radius: 8px;
  object-fit: cover;
  object-position: center;
  background: transparent;
}

.cover-video.horizontal {
  aspect-ratio: 16/9;
  width: 100%;
  height: auto;
  max-height: 100%;
}

.cover-video.vertical {
  aspect-ratio: 9/16;
  height: 100%;
  width: auto;
  max-width: 100%;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.play-overlay:hover {
  background: rgba(0, 0, 0, 0.5);
}

.play-button {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.play-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.play-button svg {
  margin-left: 2px; /* 视觉居中调整 */
}

.template-card {
  height: 100%;
}

.card-content {
    display: flex;
    gap: 12px;
}

.cover-wrapper {
    position: relative;
    width: 40%;;
    height: 200px; 
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.cover-image {
    border-radius: 8px;
    object-fit: cover;
    object-position: center;
}

.cover-image.horizontal {
    aspect-ratio: 16/9;
    width: 100%;
    height: auto;
}

.cover-image.vertical {
    aspect-ratio: 9/16;
    height: 100%;
    width: auto;
}

.template-card {
  height: 100%;
}

.card-content {
    display: flex;
    gap: 12px;
}

.right-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.info-wrapper {
    flex: 1;
}

.info-wrapper h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #333;
}

.description {
    margin: 0;
    color: #666;
    font-size: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tag-section {
    padding-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-start;
}

/* 保留原有的封面图片样式 */
</style>