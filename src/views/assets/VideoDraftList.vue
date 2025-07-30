<template>
    <div class="video-draft-container">
      <!-- 搜索区域 -->
      <div class="search-area">
        <a-form layout="inline" :model="searchForm">
          <a-form-item label="视频标题">
            <a-input 
              v-model:value="searchForm.title" 
              placeholder="输入标题关键词" 
              @pressEnter="handleSearch" 
            />
          </a-form-item>
          <a-form-item label="视频模板">
            <a-select 
              v-model:value="searchForm.template_id" 
              placeholder="请选择视频模板" 
              style="width: 200px;"
              allowClear 
              :loading="loadingTemplates"
            >
              <a-select-option value="">全部</a-select-option>
              <a-select-option v-for="template in videoTemplates" :key="template.template_id" :value="template.template_id">
                {{ template.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="创建者">
            <a-input 
              v-model:value="searchForm.creator" 
              placeholder="输入创建者" 
              @pressEnter="handleSearch" 
            />
          </a-form-item>
          <a-form-item label="创建时间">
            <a-range-picker 
              v-model:value="searchForm.dateRange" 
              :show-time="{ format: 'HH:mm' }"
              format="YYYY-MM-DD HH:mm" 
              :placeholder="['开始时间', '结束时间']" 
              @change="handleDateChange" 
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="resetSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </div>
  
      <!-- 表格 -->
      <div class="table-container">
        <a-table 
          :columns="columns" 
          :data-source="currentPageData" 
          :loading="loading"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
            </template>
            
            <template v-if="column.key === 'title'">
              <span class="video-title">{{ record.title }}</span>
            </template>
            
            <template v-if="column.key === 'templateName'">
              <a-tag color="blue">{{ record.templateName }}</a-tag>
            </template>
            
            <template v-if="column.key === 'creator'">
              <span class="creator">{{ record.creator }}</span>
            </template>
            
            <template v-if="column.key === 'createTime'">
              {{ record.createTime }}
            </template>
            
            <template v-if="column.key === 'updateTime'">
              {{ record.updateTime }}
            </template>
            
            <template v-if="column.key === 'actions'">
              <a-space>
                <a-button 
                  type="primary" 
                  size="small" 
                  @click="handleEdit(record)"
                >
                  重新编辑
                </a-button>
                <a-button 
                  type="primary" 
                  danger 
                  size="small" 
                  @click="handleDelete(record)"
                >
                  删除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
  
      <!-- 分页 -->
      <Pagination 
        v-model:current="pagination.current" 
        v-model:pageSize="pagination.pageSize"
        :total="pagination.total" 
        @change="handlePaginationChange" 
      />
    </div>
  </template>
  
  <script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import Pagination from '@/components/Pagination.vue'
import { getVideoDraftList, deleteVideoDraft, getVideoTemplates } from '@/api/modules/videoApi'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  title: '',  // 基于名称的模糊查询
  creator: '',
  template_id: null,  // 视频模板ID
  dateRange: [],
  startTime: null,
  endTime: null
})

// 新增：视频模板列表
const videoTemplates = ref([])
const loadingTemplates = ref(false)

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center'
  },
  {
    title: '视频标题',
    key: 'title',
    dataIndex: 'title',
    width: 250
  },
  {
    title: '模板名称',
    key: 'templateName',
    dataIndex: 'templateName',
    width: 150
  },
  {
    title: '创建者',
    key: 'creator',
    dataIndex: 'creator',
    width: 120
  },
  {
    title: '创建时间',
    key: 'createTime',
    dataIndex: 'createTime',
    width: 180
  },
  {
    title: '更新时间',
    key: 'updateTime',
    dataIndex: 'updateTime',
    width: 180
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    align: 'center'
  }
]

const data = ref([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 过滤后的数据（仅用于前端搜索过滤）
const filteredData = computed(() => {
  let result = [...data.value]

  // 标题过滤（前端过滤）
  if (searchForm.title) {
    result = result.filter(item =>
      item.title && item.title.toLowerCase().includes(searchForm.title.toLowerCase())
    )
  }

  // 创建者过滤（前端过滤）
  if (searchForm.creator) {
    result = result.filter(item =>
      item.creator && item.creator.toLowerCase().includes(searchForm.creator.toLowerCase())
    )
  }

  // 时间范围过滤（前端过滤）
  if (searchForm.startTime && searchForm.endTime) {
    result = result.filter(item => {
      const createTime = dayjs(item.createTime)
      return createTime.isAfter(searchForm.startTime) && createTime.isBefore(searchForm.endTime)
    })
  }

  return result
})

// 当前页数据（直接使用后端返回的数据）
const currentPageData = computed(() => {
  // 如果有前端搜索条件，使用过滤后的数据
  if (searchForm.title || searchForm.creator || (searchForm.startTime && searchForm.endTime)) {
    return filteredData.value
  }
  // 否则直接使用后端返回的数据
  return data.value
})

// 处理后端数据格式转换
const transformDraftData = (backendData) => {
  return backendData.map(item => {
    const title = item.title || `未命名草稿 ${item.id.slice(0, 8)}`
    
    return {
      id: item.id, // 保留ID用于操作，但不在表格中显示
      title: title,
      templateName: item.template_name || '未知模板',
      creator: item.creator || '未知',
      createTime: dayjs(item.create_time).format('YYYY-MM-DD HH:mm'),
      updateTime: dayjs(item.update_time).format('YYYY-MM-DD HH:mm'),
      originalData: item // 保存原始数据以备后用
    }
  })
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

// 日期范围变化处理
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.startTime = dates[0]
    searchForm.endTime = dates[1]
  } else {
    searchForm.startTime = null
    searchForm.endTime = null
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.title = ''
  searchForm.creator = ''
  searchForm.template_id = null
  searchForm.dateRange = []
  searchForm.startTime = null
  searchForm.endTime = null
  handleSearch()
}

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.current = current
  pagination.pageSize = pageSize
  // 分页改变时重新获取数据
  fetchData()
}

// 重新编辑
const handleEdit = (record) => {
  // 跳转到视频模板应用页面，传递模板ID和草稿ID
  const templateId = record.originalData.template_id
  if (!templateId) {
    message.error('草稿缺少模板信息，无法编辑')
    return
  }
  
  // 跳转到模板应用页面，通过URL传递模板ID，通过查询参数传递草稿ID
  router.push({
    path: `/templates/apply/${templateId}`,
    query: {
      draftId: record.id
    }
  })
  message.info(`正在编辑草稿: ${record.title}`)
}

// 删除草稿
const handleDelete = (record) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除草稿 "${record.title}" 吗？删除后无法恢复。`,
    async onOk() {
      try {
        loading.value = true
        const response = await deleteVideoDraft(record.id)
        
        if (response.code === 0) {
          message.success('删除成功')
          // 重新获取数据
          await fetchData()
          
          // 如果当前页没有数据了，回到上一页
          if (currentPageData.value.length === 0 && pagination.current > 1) {
            pagination.current--
          }
        } else {
          message.error(response.message || '删除失败')
        }
      } catch (error) {
        console.error('删除草稿失败:', error)
        message.error('删除失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}

// 获取数据
const fetchData = async () => {
  try {
    loading.value = true
    
    // 构建查询参数
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize
    }
    
    // 添加标题模糊查询
    if (searchForm.title) {
      params.title = searchForm.title
    }
    
    // 添加模板ID查询
    if (searchForm.template_id) {
      params.template_id = searchForm.template_id
    }
    
    // 添加创建者搜索
    if (searchForm.creator) {
      params.creator = searchForm.creator
    }
    
    const response = await getVideoDraftList(params)
    
    if (response.code === 0) {
      // 转换后端数据格式
      data.value = transformDraftData(response.data.results || [])
      pagination.total = response.data.count || 0
    } else {
      message.error(response.message || '获取草稿列表失败')
      data.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取草稿列表失败:', error)
    message.error('获取草稿列表失败，请稍后重试')
    data.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 获取视频模板列表
const fetchVideoTemplates = async () => {
  try {
    loadingTemplates.value = true
    const response = await getVideoTemplates()
    if (response.code === 0 && response.data && response.data.results) {
      videoTemplates.value = response.data.results || []
    } else {
      console.error('获取视频模板失败:', response.message)
    }
  } catch (error) {
    console.error('获取视频模板失败:', error)
  } finally {
    loadingTemplates.value = false
  }
}

onMounted(() => {
  fetchVideoTemplates()  // 新增
  fetchData()
})
</script>
  
  <style scoped>
  .video-draft-container {
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
  
  .search-area .ant-form-item {
    margin-bottom: 16px;
  }
  
  .table-container {
    flex: 1;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .video-title {
    font-weight: 500;
    color: #1890ff;
    cursor: pointer;
  }
  
  .video-title:hover {
    text-decoration: underline;
  }
  
  .creator {
    font-weight: 500;
    color: #1890ff;
  }
  
  :deep(.ant-table-tbody > tr > td) {
    vertical-align: top;
  }
  
  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 600;
  }
  </style>