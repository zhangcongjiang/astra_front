<template>
    <div class="data-visual-container">
        <!-- 搜索区域 - 保持相同结构 -->
        <div class="search-area">
            <div class="search-header">
                <a-radio-group v-model:value="searchType" size="small">
                    <a-radio-button value="basic">基础查询</a-radio-button>
                    <a-radio-button value="tag">标签查询</a-radio-button>
                </a-radio-group>
            </div>

            <!-- 基础查询表单 - 修改为数据可视化相关字段 -->
            <div class="basic-search" v-if="searchType === 'basic'">
                <a-form layout="inline" :model="basicForm">
                    <a-form-item label="模板名称">
                        <a-input v-model:value="basicForm.name" placeholder="输入可视化模板名称" @pressEnter="handleSearch" />
                    </a-form-item>
                    <a-form-item label="数据类型">
                        <a-select v-model:value="basicForm.dataType" placeholder="选择数据类型" style="width: 150px">
                            <a-select-option value="numeric">数值型</a-select-option>
                            <a-select-option value="time-series">时间序列</a-select-option>
                            <a-select-option value="geographic">地理数据</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button @click="resetBasicSearch">重置</a-button>
                    </a-form-item>
                </a-form>
            </div>

            <!-- 标签查询 - 使用数据可视化相关标签 -->
            <div class="tag-search" v-if="searchType === 'tag'">
                <TagSearch :tags="tagCategories" :showActions="true" v-model:selectedTags="selectedTags"
                    @search="handleSearch" />
            </div>
        </div>

        <!-- 数据可视化模板列表 - 保持相同卡片结构 -->
        <div class="template-grid">
            <a-row :gutter="[16, 16]">
                <a-col v-for="(template, index) in currentPageTemplates" :key="template.id" :xs="24" :sm="12" :md="8"
                    :lg="6">
                    <a-card hoverable class="template-card">
                        <template #cover>
                            <!-- 替换为数据可视化预览图 -->
                            <img class="template-image" :src="template.previewImage" alt="可视化模板预览" />
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

        <!-- 分页控制 - 保持完全相同 -->
        <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
            :total="pagination.total" :showSizeChanger="true" :pageSizeOptions="['10', '20', '50', '100']"
            @change="handlePaginationChange" @showSizeChange="handlePaginationChange" />
    </div>
</template>

<script setup>
// 保持相同的导入结构
// Update the imports to include onMounted
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import TagSearch from '@/components/TagSearch.vue';
import Pagination from '@/components/Pagination.vue';

const router = useRouter();

// 搜索类型 - 保持相同
const searchType = ref('basic');

// 基础查询表单 - 修改为数据可视化相关字段
const basicForm = reactive({
    name: '',
    dataType: null
});

// 标签数据 - 替换为数据可视化相关标签
const tagCategories = ref([
    {
        id: 1,
        name: '图表类型',
        tags: [
            { id: 'chart_1', name: '折线图' },
            { id: 'chart_2', name: '柱状图' },
            { id: 'chart_3', name: '饼图' },
            { id: 'chart_4', name: '散点图' }
        ]
    },
    {
        id: 2,
        name: '数据规模',
        tags: [
            { id: 'size_1', name: '小数据集' },
            { id: 'size_2', name: '中数据集' },
            { id: 'size_3', name: '大数据集' }
        ]
    },
    {
        id: 3,
        name: '应用场景',
        tags: [
            { id: 'scene_1', name: '商业分析' },
            { id: 'scene_2', name: '科研数据' },
            { id: 'scene_3', name: '金融趋势' }
        ]
    }
]);

// 选中的标签 - 保持相同
const selectedTags = ref([]);

// 数据可视化模板数据 - 替换为数据可视化相关数据
// 修改模板数据中的图片路径为占位图
// 确保模板数据正确初始化
const templates = ref([
    {
        id: 1,
        name: '销售趋势分析',
        description: '适合展示销售数据趋势变化的模板',
        previewImage: new URL('@/assets/images/data-visual/chart-1.svg', import.meta.url).href,
        tags: ['chart_1', 'size_2', 'scene_1']
    },
    {
        id: 2,
        name: '市场份额分布',
        description: '饼图展示市场份额分布的模板',
        previewImage: new URL('@/assets/images/data-visual/chart-2.svg', import.meta.url).href,
        tags: ['chart_3', 'size_1', 'scene_1']
    },
    // 更多数据可视化模板...
    ...generateMockTemplates(10)
]);

// 确保分页初始化
// Move onMounted to the root level of setup
onMounted(() => {
    pagination.total = templates.value.length;
});

// 确保分页计算正确
const currentPageTemplates = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredTemplates.value.slice(start, end);
});

// 分页配置 - 保持完全相同
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
});

// 生成模拟模板数据 - 修改为数据可视化相关数据
function generateMockTemplates(count) {
    const mockTemplates = [];
    const chartTypes = ['chart_1', 'chart_2', 'chart_3', 'chart_4'];
    const dataSizes = ['size_1', 'size_2', 'size_3'];
    const scenes = ['scene_1', 'scene_2', 'scene_3'];
    const descriptions = [
        '专业级数据可视化模板',
        '简洁直观的数据展示方案',
        '动态交互式数据可视化',
        '适合报告展示的数据图表'
    ];

    for (let i = 1; i <= count; i++) {
        const randomChart = chartTypes[Math.floor(Math.random() * chartTypes.length)];
        const randomSize = dataSizes[Math.floor(Math.random() * dataSizes.length)];
        const randomScene = scenes[Math.floor(Math.random() * scenes.length)];
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
        const chartIndex = Math.floor(Math.random() * 5) + 1;

        mockTemplates.push({
            id: i + 2,
            name: `数据模板${i}`,
            description: randomDesc,
            previewImage: new URL(`@/assets/images/data-visual/chart-${chartIndex}.svg`, import.meta.url).href,
            tags: [randomChart, randomSize, randomScene]
        });
    }

    return mockTemplates;
}

// 以下所有方法保持与VideoTemplateList.vue完全相同
// 包括getTagNames, findTagById, currentPageTemplates, filteredTemplates等
// 只修改过滤逻辑中的字段匹配部分

// 过滤后的模板 - 修改字段匹配逻辑
const filteredTemplates = computed(() => {
    const filtered = templates.value.filter(template => {
        if (searchType.value === 'basic') {
            const nameMatch = template.name.toLowerCase().includes(basicForm.name.toLowerCase());
            let typeMatch = true;

            if (basicForm.dataType) {
                // 根据数据类型过滤逻辑
                typeMatch = template.tags.some(tag => {
                    const foundTag = findTagById(tag);
                    return foundTag && foundTag.name.includes(basicForm.dataType);
                });
            }

            return nameMatch && typeMatch;
        }

        if (searchType.value === 'tag' && selectedTags.value.length > 0) {
            return template.tags && Array.isArray(template.tags) && 
                   selectedTags.value.some(tagId => template.tags.includes(tagId));
        }

        return true;
    });

    pagination.total = filtered.length;
    return filtered;
});

// 应用模板 - 修改路由路径
const applyTemplate = (template) => {
    router.push({
        path: `/data-visuals/apply/${template.id}`,
        state: { 
            template: JSON.parse(JSON.stringify(template))
        }
    });
};

// 其余所有方法保持完全相同...
// handleSearch, resetBasicSearch, handlePaginationChange等

// 添加查找标签名称的函数
function findTagById(tagId) {
    for (const category of tagCategories.value) {
        const foundTag = category.tags.find(tag => tag.id === tagId);
        if (foundTag) return foundTag;
    }
    return null;
}

// 添加将标签ID数组转换为名称数组的函数
function getTagNames(tagIds) {
    return tagIds.map(tagId => {
        const tag = findTagById(tagId);
        return tag ? tag.name : tagId;
    });
}
</script>

<style scoped>
/* 保持完全相同的样式结构，只修改类名前缀 */
.data-visual-container {
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

/* 保持所有其他样式与VideoTemplateList.vue相同 */
.template-image {
    width: 100%;
    height: 180px;
    object-fit: cover;
}

/* ...其余样式保持不变... */
</style>