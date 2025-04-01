<template>
    <div class="transition-list-container">
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
                    <a-form-item label="视频名称">
                        <a-input v-model:value="basicForm.name" placeholder="输入视频名称" @pressEnter="handleSearch" />
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

        <div class="actions">
            <div style="display: flex; justify-content: flex-end">
                <a-button type="primary" @click="handleAdd">添加转场视频</a-button>
            </div>
        </div>

        <!-- 移除表格展示 -->
        <!-- 转场视频列表 -->
        <div class="card-list">
            <a-row :gutter="[16, 16]">
                <a-col v-for="item in currentPageData" :key="item.id" :xs="24" :sm="6" :md="4.8" :lg="4.8" :xl="4.8">
                    <a-card class="transition-card">
                        <div class="card-header">
                            <a-button type="text" danger class="delete-btn" @click="handleDelete(item)">
                                <template #icon><delete-outlined /></template>
                            </a-button>
                        </div>
                        <div class="card-content">
                            <video :src="item.url" controls class="transition-video" />
                            <div class="card-info">
                                <h4 class="title">{{ item.name }}</h4>
                                <div class="meta">
                                    <span class="duration">时长：{{ item.duration }}</span>
                                </div>
                            </div>
                        </div>
                    </a-card>
                </a-col>
            </a-row>
        </div>

        <!-- 分页 -->
        <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
            :total="pagination.total" @change="handlePaginationChange" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import TagSearch from '@/components/TagSearch.vue'
import Pagination from '@/components/Pagination.vue'  // 新增导入
import { DeleteOutlined } from '@ant-design/icons-vue'

const router = useRouter()

// 搜索类型
const searchType = ref('basic')

// 基础查询表单
const basicForm = reactive({
    name: '',
    dateRange: [],
    startTime: null,
    endTime: null
})

// 标签数据
const tagCategories = ref([
    {
        id: 1,
        name: '类型',
        tags: [
            { id: 'type_1', name: '淡入淡出' },
            { id: 'type_2', name: '滑动' },
            { id: 'type_3', name: '缩放' },
            { id: 'type_4', name: '旋转' }
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
])

// 选中的标签
const selectedTags = ref([])

// 表格列定义
const columns = [
    {
        title: '名称',
        dataIndex: 'name',
        key: 'name'
    },
    {
        title: '预览',
        key: 'preview'
    },
    {
        title: '时长',
        dataIndex: 'duration',
        key: 'duration'
    },
    {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime'
    },
    {
        title: '操作',
        key: 'actions',
        width: 150
    }
]

// 模拟数据
const mockData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `转场效果 ${i + 1}`,
    url: `https://www.example.com/transitions/${i + 1}.mp4`,
    duration: '0:05',
    createTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm'),
    tags: ['type_1', 'style_2']
}))

const data = ref([])
const loading = ref(false)
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
})

// 当前页数据
const currentPageData = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredData.value.slice(start, end)
})

// 过滤后的数据
const filteredData = computed(() => {
    let result = [...data.value]

    // 基础查询过滤
    if (searchType.value === 'basic') {
        if (basicForm.name) {
            result = result.filter(item =>
                item.name.toLowerCase().includes(basicForm.name.toLowerCase())
            )
        }

        if (basicForm.startTime && basicForm.endTime) {
            result = result.filter(item => {
                const createTime = dayjs(item.createTime)
                return createTime.isAfter(basicForm.startTime) && createTime.isBefore(basicForm.endTime)
            })
        }
    }

    // 标签查询过滤
    if (searchType.value === 'tag' && selectedTags.value.length > 0) {
        result = result.filter(item =>
            selectedTags.value.some(tagId => item.tags.includes(tagId))
        )
    }

    pagination.total = result.length
    return result
})

// 搜索
const handleSearch = () => {
    pagination.current = 1
}

// 日期范围变化处理
const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
        basicForm.startTime = dates[0]
        basicForm.endTime = dates[1]
    } else {
        basicForm.startTime = null
        basicForm.endTime = null
    }
}

// 重置基础查询
const resetBasicSearch = () => {
    basicForm.name = ''
    basicForm.dateRange = []
    basicForm.startTime = null
    basicForm.endTime = null
    handleSearch()
}

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
    pagination.current = current
    pagination.pageSize = pageSize
}

// 添加转场视频
const handleAdd = () => {
    router.push('/transitions/add')
}

// 编辑转场视频
const handleEdit = (record) => {
    router.push(`/transitions/edit/${record.id}`)
}

// 删除转场视频
const handleDelete = (record) => {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除转场视频 "${record.name}" 吗？`,
        onOk() {
            // 这里应该是API调用
            message.success('删除成功')
            fetchData()
        }
    })
}

// 获取数据
const fetchData = () => {
    loading.value = true
    // 模拟API请求
    setTimeout(() => {
        data.value = mockData
        pagination.total = mockData.length
        loading.value = false
    }, 500)
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.transition-list-container {
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

.actions {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-end;
}

.card-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.transition-card {
    height: auto;
}

.card-content {
    display: flex;
    flex-direction: column;
}

.transition-video {
    width: 100%;
    height: 180px;
    /* 增加视频高度 */
    object-fit: cover;
    border-radius: 4px;
}

.card-header {
    position: absolute;
    bottom: 8px;
    right: 8px;
    z-index: 1;
}

.delete-btn {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.delete-btn:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
}

.card-content {
    margin-top: 8px;
}
</style>