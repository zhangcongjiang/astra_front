<template>
    <div class="video-draft-container">
      <!-- 搜索区域 -->
      <div class="search-area">
        <a-form layout="inline" :model="searchForm">
          <a-form-item label="视频名称">
            <a-input 
              v-model:value="searchForm.videoName" 
              placeholder="输入视频名称" 
              @pressEnter="handleSearch" 
            />
          </a-form-item>
          <a-form-item label="模板名称">
            <a-input 
              v-model:value="searchForm.templateName" 
              placeholder="输入模板名称" 
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
            
            <template v-if="column.key === 'videoName'">
              <span class="video-name">{{ record.videoName }}</span>
            </template>
            
            <template v-if="column.key === 'templateName'">
              <a-tag color="blue">{{ record.templateName }}</a-tag>
            </template>
            
            <template v-if="column.key === 'contentData'">
              <div class="content-summary">
                <div>文本段落: {{ record.contentData.textCount }}个</div>
                <div>图片素材: {{ record.contentData.imageCount }}个</div>
                <div>视频素材: {{ record.contentData.videoCount }}个</div>
              </div>
            </template>
            
            <template v-if="column.key === 'createTime'">
              {{ record.createTime }}
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
  
  const router = useRouter()
  
  // 搜索表单
  const searchForm = reactive({
    videoName: '',
    templateName: '',
    dateRange: [],
    startTime: null,
    endTime: null
  })
  
  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      align: 'center'
    },
    {
      title: '视频名称',
      key: 'videoName',
      dataIndex: 'videoName',
      width: 200
    },
    {
      title: '视频模板名称',
      key: 'templateName',
      dataIndex: 'templateName',
      width: 150
    },
    {
      title: '内容数据',
      key: 'contentData',
      width: 200
    },
    {
      title: '创建时间',
      key: 'createTime',
      dataIndex: 'createTime',
      width: 180
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      align: 'center'
    }
  ]
  
  // 模拟数据
  const mockData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    videoName: `我的视频草稿 ${i + 1}`,
    templateName: `模板${Math.floor(i / 5) + 1}`,
    contentData: {
      textCount: Math.floor(Math.random() * 10) + 1,
      imageCount: Math.floor(Math.random() * 5) + 1,
      videoCount: Math.floor(Math.random() * 3) + 1
    },
    createTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm'),
    status: 'draft'
  }))
  
  const data = ref([])
  const loading = ref(false)
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
  })
  
  // 过滤后的数据
  const filteredData = computed(() => {
    let result = [...data.value]
  
    // 视频名称过滤
    if (searchForm.videoName) {
      result = result.filter(item =>
        item.videoName.toLowerCase().includes(searchForm.videoName.toLowerCase())
      )
    }
  
    // 模板名称过滤
    if (searchForm.templateName) {
      result = result.filter(item =>
        item.templateName.toLowerCase().includes(searchForm.templateName.toLowerCase())
      )
    }
  
    // 时间范围过滤
    if (searchForm.startTime && searchForm.endTime) {
      result = result.filter(item => {
        const createTime = dayjs(item.createTime)
        return createTime.isAfter(searchForm.startTime) && createTime.isBefore(searchForm.endTime)
      })
    }
  
    pagination.total = result.length
    return result
  })
  
  // 当前页数据
  const currentPageData = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredData.value.slice(start, end)
  })
  
  // 搜索
  const handleSearch = () => {
    pagination.current = 1
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
    searchForm.videoName = ''
    searchForm.templateName = ''
    searchForm.dateRange = []
    searchForm.startTime = null
    searchForm.endTime = null
    handleSearch()
  }
  
  // 分页变化处理
  const handlePaginationChange = ({ current, pageSize }) => {
    pagination.current = current
    pagination.pageSize = pageSize
  }
  
  // 重新编辑
  const handleEdit = (record) => {
    // 跳转到视频编辑页面
    router.push(`/videos/edit/${record.id}`)
    message.info(`正在编辑视频草稿: ${record.videoName}`)
  }
  
  // 删除草稿
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除视频草稿 "${record.videoName}" 吗？删除后无法恢复。`,
      onOk() {
        // 这里应该是API调用
        const index = data.value.findIndex(item => item.id === record.id)
        if (index > -1) {
          data.value.splice(index, 1)
          message.success('删除成功')
          
          // 如果当前页没有数据了，回到上一页
          if (currentPageData.value.length === 0 && pagination.current > 1) {
            pagination.current--
          }
        }
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
  
  .video-name {
    font-weight: 500;
    color: #1890ff;
    cursor: pointer;
  }
  
  .video-name:hover {
    text-decoration: underline;
  }
  
  .content-summary {
    font-size: 12px;
    color: #666;
    line-height: 1.4;
  }
  
  .content-summary div {
    margin-bottom: 2px;
  }
  
  .content-summary div:last-child {
    margin-bottom: 0;
  }
  
  :deep(.ant-table-tbody > tr > td) {
    vertical-align: top;
  }
  
  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 600;
  }
  </style>