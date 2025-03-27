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
                <a-col v-for="(template, index) in currentPageTemplates" :key="template.id" :xs="24" :sm="12" :md="8"
                    :lg="6">
                    <a-card hoverable class="template-card">
                        <template #cover>
                            <video class="template-video" :src="template.videoUrl" controls></video>
                        </template>
                        <a-card-meta :title="template.name">
                            <template #description>
                                <div class="template-description">{{ template.description }}</div>
                                <div class="template-tags">
                                    <a-tag v-for="tag in getTagNames(template.tags)" :key="tag" color="blue">{{ tag
                                    }}</a-tag>
                                </div>
                            </template>
                        </a-card-meta>
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
        tags: ['type_1', 'style_2']
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
        tags: ['type_2', 'style_1']
    },
    // 更多模板...
    ...generateMockTemplates(10)
]);

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
});

// 生成模拟模板数据
function generateMockTemplates(count) {
    const mockTemplates = [];
    const types = ['type_1', 'type_2', 'type_3', 'type_4'];
    const styles = ['style_1', 'style_2', 'style_3', 'style_4'];
    const descriptions = [
        '专业级视频模板，适用于各种场景',
        '简洁大方的设计风格',
        '动态效果丰富的视频模板',
        '适合社交媒体分享的短视频模板'
    ];

    for (let i = 1; i <= count; i++) {
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];

        mockTemplates.push({
            id: i + 2,
            name: `视频模板${i}`,
            description: randomDesc,
            videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            createTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm'),
            params: {
                title: `模板${i}参数`,
                duration: Math.floor(Math.random() * 60) + 15,
                style: randomStyle.replace('style_', '')
            },
            tags: [randomType, randomStyle]
        });
    }

    return mockTemplates;
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

// 当前页显示的模板
const currentPageTemplates = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredTemplates.value.slice(start, end);
});

// 过滤后的模板
const filteredTemplates = computed(() => {
    const filtered = templates.value.filter(template => {
        // 基础查询过滤
        if (searchType.value === 'basic') {
            const nameMatch = template.name.toLowerCase().includes(basicForm.name.toLowerCase());
            let dateMatch = true;

            if (basicForm.startTime && basicForm.endTime) {
                const templateDate = dayjs(template.createTime);
                dateMatch = templateDate.isAfter(basicForm.startTime) &&
                    templateDate.isBefore(basicForm.endTime);
            }

            return nameMatch && dateMatch;
        }

        // 标签查询过滤
        if (searchType.value === 'tag' && selectedTags.value.length > 0) {
            return selectedTags.value.some(tagId => template.tags.includes(tagId));
        }

        return true;
    });

    pagination.total = filtered.length;
    return filtered;
});

// 应用模板
const applyTemplate = (template) => {
  router.push({
    path: `/templates/apply/${template.id}`,
    state: { 
      template: JSON.parse(JSON.stringify(template)) // 深拷贝避免引用问题
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
</script>

<style scoped>
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
    display: flex;
    flex-direction: column;
}

.template-video {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
}

.template-description {
    margin: 8px 0;
    color: #666;
    font-size: 14px;
}

.template-tags {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .template-card {
        margin-bottom: 16px;
    }
}
</style>