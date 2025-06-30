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
            <a-row :gutter="[16, 16]">
                <a-col v-for="(template, index) in currentPageTemplates" :key="template.id" 
                       :xs="24" :sm="12" :md="8" :lg="6">
                    <a-card hoverable class="template-card">
                        <div class="card-content">
                            <!-- 视频类型标签 - 移到卡片右上角 -->
                            <div class="video-type">
                                <a-tag :color="template.orientation === 'horizontal' ? 'blue' : 'green'">
                                    {{ template.orientation === 'horizontal' ? '16 : 9' : '9 : 16' }}
                                </a-tag>
                            </div>
                            
                            <!-- 左侧封面 -->
                            <div class="cover-wrapper">
                                <img :src="getCoverUrl(template)" class="cover-image" :class="template.orientation" alt="视频封面">
                            </div>
                            
                            <!-- 右侧内容 -->
                            <div class="right-content">
                                <!-- 上部信息 -->
                                <div class="info-wrapper">
                                    <h3>{{ template.name }}</h3>
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
        </div>

        <!-- 分页控制 -->
        <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
            :total="pagination.total" :showSizeChanger="true" :pageSizeOptions="['10', '20', '50', '100']"
            @change="handlePaginationChange" @showSizeChange="handlePaginationChange" />
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import TagSearch from '@/components/TagSearch.vue';
import Pagination from '@/components/Pagination.vue';

const router = useRouter();

// 搜索类型
const searchType = ref('basic');

// 基础查询表单
const basicForm = reactive({
    name: '',
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
const templates = ref([
    {
        id: 1,
        name: '产品宣传模板',
        description: '适用于产品推广的高质量宣传视频模板',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        createTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
        params: {
            title: "产品名称",
            subtitle: "产品标语",
            images: ["image1.jpg", "image2.jpg"],
            duration: 30,
            style: "modern"
        },
        tags: ['type_1', 'style_2'],
        orientation: 'horizontal',
        cover: 'https://via.placeholder.com/300x169?text=横向封面'
    },
    {
        id: 2,
        name: '教程视频模板',
        description: '适合制作步骤教学视频的模板',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        createTime: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm'),
        params: {
            steps: ["第一步", "第二步", "第三步"],
            narrator: true,
            backgroundMusic: "tutorial_music.mp3"
        },
        tags: ['type_2', 'style_1'],
        orientation: 'vertical',
        cover: 'https://via.placeholder.com/169x300?text=竖向封面'
    },
    // ...其他模板数据...
]);

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
});

// 当前页显示的模板
const currentPageTemplates = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredTemplates.value.slice(start, end);
});

// 过滤后的模板
const filteredTemplates = computed(() => {
    let filtered = templates.value;
    
    // 基础查询过滤
    if (searchType.value === 'basic') {
        const nameMatch = template => 
            template.name.toLowerCase().includes(basicForm.name.toLowerCase());
        
        const orientationMatch = template => 
            !basicForm.orientation || template.orientation === basicForm.orientation;
        
        const dateMatch = template => {
            if (!basicForm.startTime || !basicForm.endTime) return true;
            const templateDate = dayjs(template.createTime);
            return templateDate.isAfter(basicForm.startTime) && 
                   templateDate.isBefore(basicForm.endTime);
        };
        
        filtered = filtered.filter(t => nameMatch(t) && orientationMatch(t) && dateMatch(t));
    }
    
    // 标签查询过滤
    if (searchType.value === 'tag' && selectedTags.value.length > 0) {
        filtered = filtered.filter(t => 
            selectedTags.value.some(tagId => t.tags.includes(tagId))
        );
    }
    
    pagination.total = filtered.length;
    return filtered;
});

// 应用模板
const applyTemplate = (template) => {
    console.log('apply template', template);
    router.push({
        path: `/templates/apply/${template.id}`,
        state: { 
            template: JSON.parse(JSON.stringify(template))
        }
    });
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
};

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