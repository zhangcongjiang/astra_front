<template>
  <div class="news-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      
      <div class="search-form-wrapper">
        <a-form layout="inline" :model="searchForm" class="search-form">
          <a-form-item label="标题关键词">
            <a-input 
              v-model:value="searchForm.title" 
              placeholder="请输入标题关键词" 
              style="width: 200px"
              allowClear
            />
          </a-form-item>
          
          <a-form-item label="来源平台">
            <!-- 确保这里绑定的是 platform -->
            <a-select 
              v-model:value="searchForm.platform"
              placeholder="请选择来源平台" 
              style="width: 150px"
              allowClear
            >
              <a-select-option value="微博">微博</a-select-option>
              <a-select-option value="百度">百度</a-select-option>
              <a-select-option value="今日头条">今日头条</a-select-option>
              <a-select-option value="虎扑">虎扑</a-select-option>
              <a-select-option value="虎扑足球">虎扑足球</a-select-option>
              <a-select-option value="NBA官网">NBA官网</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="新闻类型">
            <a-select 
              v-model:value="searchForm.category" 
              placeholder="请选择新闻类型" 
              style="width: 150px"
              allowClear
            >
              <a-select-option value="娱乐">娱乐</a-select-option>
              <a-select-option value="体育">体育</a-select-option>
              <a-select-option value="nba">NBA</a-select-option>
              <a-select-option value="cba">CBA</a-select-option>
              <a-select-option value="足球">足球</a-select-option>
              <a-select-option value="科技">科技</a-select-option>
              <a-select-option value="财经">财经</a-select-option>
              <a-select-option value="社会">社会</a-select-option>
              <a-select-option value="国际">国际</a-select-option>
              <a-select-option value="商业">商业</a-select-option>
              <a-select-option value="旅游">旅游</a-select-option>
              <a-select-option value="汽车">汽车</a-select-option>
              <a-select-option value="农业">农业</a-select-option>
              <a-select-option value="台海">台海</a-select-option>
              <a-select-option value="其他">其他</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="时间范围">
            <a-select 
              v-model:value="searchForm.timeRange" 
              placeholder="请选择时间范围" 
              style="width: 150px"
              allowClear
            >
              <a-select-option value="1d">最近一天</a-select-option>
              <a-select-option value="3d">最近三天</a-select-option>
              <a-select-option value="1w">最近一周</a-select-option>
              <a-select-option value="1m">最近一个月</a-select-option>
              <a-select-option value="1y">最近一年</a-select-option>
              <a-select-option value="3y">最近三年</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="排序方式">
            <a-select 
              v-model:value="searchForm.sortBy" 
              placeholder="请选择排序方式" 
              style="width: 120px"
            >
              <a-select-option value="hot">热度最高</a-select-option>
              <a-select-option value="time">时间最近</a-select-option>
              <a-select-option value="rank">最高排名</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item>
            <a-space>
              <a-button type="primary" @click="handleSearch" :loading="loading">
                查询
              </a-button>
              <a-button @click="resetSearch">
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <!-- 新闻列表 -->
    <div class="list-section">
      <a-card >
        <a-table 
          :columns="columns" 
          :data-source="newsList" 
          :loading="loading"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <a @click="showDetail(record)" class="news-title">{{ record.title }}</a>
            </template>
            
            <template v-if="column.key === 'platform'">
              <a-tag :color="getSourceColor(record.platform)">{{ getSourceText(record.platform) }}</a-tag>
            </template>
            
            <template v-if="column.key === 'category'">
              <a-tag :color="getCategoryColor(record.category)">{{ getCategoryText(record.category) }}</a-tag>
            </template>
            
            <template v-if="column.key === 'hots'">
              <span class="hot-score">{{ record.hots }}</span>
            </template>
            
            <template v-if="column.key === 'date'">
              <span>{{ formatDateTime(record.date) }}</span>
            </template>
            
            <template v-if="column.key === 'rank'">
              <a-tag color="red" v-if="record.rank <= 3">第{{ record.rank }}名</a-tag>
              <a-tag color="orange" v-else-if="record.rank <= 10">第{{ record.rank }}名</a-tag>
              <a-tag v-else>第{{ record.rank }}名</a-tag>
            </template>
            
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="showDetail(record)">详情</a-button>
                <a-button type="link" size="small" @click="addToMaterialSet(record)">加入素材集</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
        
        <!-- 分页组件 -->
        <div class="pagination-wrapper">
          <Pagination 
            v-model:current="pagination.current"
            v-model:pageSize="pagination.pageSize"
            :total="pagination.total"
            @change="handlePageChange"
          />
        </div>
      </a-card>
    </div>
    
    <!-- 素材集选择模态框 -->
    <a-modal
      v-model:open="assetModalVisible"
      title="选择素材集"
      @ok="handleAddToAsset"
      @cancel="resetAssetModal"
      :confirm-loading="addingToAsset"
      :ok-button-props="{ disabled: !selectedAssetId }"
    >
      <div class="asset-selection">
        <a-spin :spinning="loadingAssets">
          <div v-if="assetList.length === 0 && !loadingAssets" class="no-assets">
            <a-empty description="暂无素材集">
              <a-button type="primary" @click="goToAssetPage">创建素材集</a-button>
            </a-empty>
          </div>
          <a-radio-group v-else v-model:value="selectedAssetId" class="asset-radio-group">
            <div v-for="asset in assetList" :key="asset.id" class="asset-item">
              <a-radio :value="asset.id">
                <div class="asset-info">
                  <div class="asset-name">{{ asset.set_name }}</div>
                  <div class="asset-desc" v-if="asset.description">{{ asset.description }}</div>
                  <div class="asset-meta">
                    <span>创建时间：{{ formatDate(asset.create_time) }}</span>
                    <span style="margin-left: 16px;">素材数量：{{ asset.asset_count }}</span>
                  </div>
                </div>
              </a-radio>
            </div>
          </a-radio-group>
        </a-spin>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { getNewsList, addNewsToAsset, getNewsDetail } from '@/api/modules/newsApi'
import Pagination from '@/components/Pagination.vue'
import dayjs from 'dayjs'
import { getAssetCollectionList } from '@/api/modules/assetApi'

const router = useRouter()
const route = useRoute()  // 添加这一行
const loading = ref(false)


// 新闻列表
const newsList = ref([])

// 分页配置
const pagination = reactive({
  current: 1,
  total: 0,
  pageSize: 20
})

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    customRender: ({ index }) => {
      return (pagination.current - 1) * pagination.pageSize + index + 1
    }
  },
  {
    title: '热点内容',
    dataIndex: 'title',
    key: 'title',
    width: 300,
    ellipsis: true
  },
  {
    title: '来源平台',
    dataIndex: 'platform',  // 改为 platform
    key: 'platform',        // 改为 platform
    width: 100
  },
  {
    title: '类型',
    dataIndex: 'category',
    key: 'category',
    width: 80
  },
  {
    title: '热度值',
    dataIndex: 'hots',      // 改为 hots
    key: 'hots',            // 改为 hots
    width: 100,
    sorter: true
  },
  {
    title: '上榜时间',
    dataIndex: 'date',      // 改为 date
    key: 'date',            // 改为 date
    width: 150
  },
  {
    title: '最高排名',
    dataIndex: 'rank',      // 改为 rank
    key: 'rank',            // 改为 rank
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right'
  }
]


// 素材集相关状态
const assetModalVisible = ref(false)
const loadingAssets = ref(false)
const addingToAsset = ref(false)
const assetList = ref([])
const selectedAssetId = ref(null)
const currentNewsRecord = ref(null)

// 修改现有的addToMaterialSet方法
const addToMaterialSet = async (record) => {
  currentNewsRecord.value = record
  assetModalVisible.value = true
  await loadAssetList()
}

// 加载素材集列表
const loadAssetList = async () => {
  try {
    loadingAssets.value = true
    const response = await getAssetCollectionList({ page: 1, page_size: 100 })
    if (response.code === 0) {
      assetList.value = response.data.results || []
    } else {
      message.error('获取素材集列表失败')
      assetList.value = []
    }
  } catch (error) {
    message.error('获取素材集列表失败')
    assetList.value = []
  } finally {
    loadingAssets.value = false
  }
}

// 处理加入素材集
const handleAddToAsset = async () => {
  if (!selectedAssetId.value) {
    message.warning('请选择一个素材集')
    return
  }
  
  if (!currentNewsRecord.value || !currentNewsRecord.value.news_id) {
    message.error('新闻ID不存在，无法加入素材集')
    return
  }
  
  try {
    addingToAsset.value = true
    
    // 先获取新闻详情
    console.log('正在获取新闻详情，news_id:', currentNewsRecord.value.news_id)
    const newsDetailResponse = await getNewsDetail(currentNewsRecord.value.news_id)
    
    if (newsDetailResponse.code !== 0) {
      message.error('获取新闻详情失败，无法加入素材集')
      return
    }
    
    console.log('新闻详情获取成功:', newsDetailResponse.data)
    
    // 然后调用加入素材集接口
    const response = await addNewsToAsset({
      news_id: currentNewsRecord.value.news_id,
      asset_id: selectedAssetId.value
    })
    
    if (response.code === 0) {
      message.success('已成功加入素材集')
      resetAssetModal()
    } else {
      message.error(response.message || '加入素材集失败')
    }
  } catch (error) {
    console.error('加入素材集失败:', error)
    message.error('加入素材集失败')
  } finally {
    addingToAsset.value = false
  }
}

// 重置素材集模态框
const resetAssetModal = () => {
  assetModalVisible.value = false
  selectedAssetId.value = null
  assetList.value = []
  currentNewsRecord.value = null
}

// 跳转到素材集页面
const goToAssetPage = () => {
  router.push('/assets')
  resetAssetModal()
}

// 格式化日期
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}
// 获取新闻列表
const fetchNewsList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      title: searchForm.title || undefined,
      platform: searchForm.platform,
      category: searchForm.category,
      time_range: searchForm.timeRange,  // 使用 timeRange 而不是处理 dateRange
      sort_by: searchForm.sortBy
    }
    
    const response = await getNewsList(params)
    newsList.value = response.data.results || []
    pagination.total = response.data.count || 0
  } catch (error) {
    message.error('获取新闻列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
// 从URL查询参数初始化搜索表单
const searchForm = reactive({
  title: route.query.title || '',
  platform: route.query.platform || undefined,
  category: route.query.category || undefined,
  timeRange: route.query.timeRange || '1d',
  sortBy: route.query.sortBy || 'hot'
})

// 监听搜索表单变化，更新URL
watch(searchForm, (newForm) => {
  const query = {}
  Object.keys(newForm).forEach(key => {
    if (newForm[key] && newForm[key] !== '') {
      query[key] = newForm[key]
    }
  })
  
  // 更新URL但不触发导航
  router.replace({ 
    path: '/news', 
    query: {
      ...query,
      page: pagination.current
    }
  })
}, { deep: true })

// 修改搜索方法
const handleSearch = () => {
  pagination.current = 1
  fetchNewsList()
}

// 修改跳转到详情页面的方法
const goToDetail = (record) => {
  // 保存当前筛选条件到URL
  const currentQuery = { ...route.query }
  router.push({
    path: `/news/${record.news_id}`,
    query: { from: '/news', ...currentQuery }
  })
}

// 组件挂载时从URL恢复状态
onMounted(() => {
  // 如果URL中有页码参数，恢复分页状态
  if (route.query.page) {
    pagination.current = parseInt(route.query.page)
  }
  fetchNewsList()
})

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    title: '',
    platform: undefined,
    category: undefined,
    timeRange: '1d',  // 重置为默认的最近一天
    sortBy: 'hot'  // 重置为默认的热度最高
  })
  handleSearch()
}

// 分页变化
const handlePageChange = ({ current, pageSize }) => {
  pagination.current = current
  pagination.pageSize = pageSize
  fetchNewsList()
}

// 查看详情
const showDetail = (record) => {
  router.push(`/news/${record.news_id}`)
}

// 加入素材集
const addToAsset = async (record) => {
  try {
    // 这里可以弹出素材集选择框，暂时使用默认素材集
    await addNewsToAsset(record.news_id, 1)
    message.success('已加入素材集')
  } catch (error) {
    message.error('加入素材集失败')
  }
}

// 辅助函数
// 获取来源平台文本
const getSourceText = (source) => {
  const sourceMap = {
    '虎扑': '虎扑',
    '虎扑足球': '虎扑足球',
    '微博': '微博',
    '百度': '百度',
    '今日头条': '今日头条',
    'NBA官网': 'NBA官网'
  }
  return sourceMap[source] || source
}

// 获取来源平台颜色
const getSourceColor = (source) => {
  const colorMap = {
    '虎扑': 'orange',
    '虎扑足球': 'green',
    '微博': 'red',
    '百度': 'blue',
    '今日头条': 'gold',
    'NBA官网': 'purple'
  }
  return colorMap[source] || 'default'
}
const getCategoryColor = (category) => {
  const colors = {
    tech: 'blue',
    entertainment: 'pink',
    sports: 'green',
    finance: 'gold',
    society: 'purple'
  }
  return colors[category] || 'default'
}

const getCategoryText = (category) => {
  const texts = {
    军事: '军事',
    娱乐: '娱乐',
    体育: '体育',
    农业: '财经',
    台海: '台海',
    其他: '其他',
    商业: '商业',
    旅游: '旅游',
    汽车: '汽车',
    社会: '社会',
    科技: '科技',
    国际: '国际',
    NBA: 'NBA',
    CBA: 'CBA',
    足球: '足球',
  }
  return texts[category] || category
}

const formatDateTime = (dateTime) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchNewsList()
})
</script>

<style scoped>
.news-list-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 素材集选择相关样式 */
.asset-selection {
  max-height: 400px;
  overflow-y: auto;
}

.asset-radio-group {
  width: 100%;
}

.asset-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.asset-item:hover {
  border-color: #1890ff;
  background-color: #f6ffed;
}

.asset-info {
  margin-left: 8px;
}

.asset-name {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.asset-desc {
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 4px;
}

.asset-meta {
  color: #bfbfbf;
  font-size: 11px;
}

.asset-meta span {
  margin-right: 8px;
}

.no-assets {
  text-align: center;
  padding: 20px;
}

.search-form-wrapper {
  margin-top: 16px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: end;
}

.search-form .ant-form-item {
  margin-bottom: 16px;
}

.search-form .ant-form-item-label {
  font-weight: 500;
}

.list-section {
  flex: 1;
}

.list-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.news-title {
  color: #1890ff;
  cursor: pointer;
}

.news-title:hover {
  text-decoration: underline;
}

.hot-score {
  font-weight: bold;
  color: #ff4d4f;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-form .ant-form-item {
    width: 100%;
  }
  
  .search-form .ant-input,
  .search-form .ant-select {
    width: 100% !important;
  }
}
</style>


