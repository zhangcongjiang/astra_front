<template>
  <div class="asset-list-container">
    <div class="header">
      <h2>素材集管理</h2>
      <a-button type="primary" @click="showCreateModal = true">
        <PlusOutlined /> 创建素材集
      </a-button>
    </div>
    
    <div class="search-section">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索素材集名称"
        style="width: 300px"
        @search="handleSearch"
      />
    </div>

    <div class="asset-grid">
      <a-row :gutter="[16, 16]">
        <a-col 
          v-for="asset in assetList" 
          :key="asset.id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        >
          <a-card 
            hoverable
            class="asset-card"
            @click="viewAssetDetail(asset.id)"
          >
            <template #cover>
              <div class="cover-container">
                <img 
                  v-if="asset.cover" 
                  :src="asset.cover" 
                  :alt="asset.name"
                  class="cover-image"
                />
                <div v-else class="default-cover">
                  <FolderOutlined :style="{ fontSize: '48px', color: '#ccc' }" />
                </div>
              </div>
            </template>
            
            <template #actions>
              <EditOutlined @click.stop="editAsset(asset)" />
              <DeleteOutlined @click.stop="deleteAsset(asset.id)" />
            </template>
            
            <a-card-meta>
              <template #title>
                <div class="card-title-row">
                  <span class="asset-name">{{ asset.name }}</span>
                  <span class="asset-count">{{ asset.itemCount || 0 }} 个素材</span>
                </div>
              </template>
              <template #description>
                <div class="card-info-row">
                  <span class="creator">{{ asset.creator }}</span>
                  <span class="create-time">{{ formatTime(asset.createTime) }}</span>
                </div>
              </template>
            </a-card-meta>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 使用自定义分页组件 -->
    <Pagination
      v-model:current="currentPage"
      v-model:pageSize="pageSize"
      :total="total"
      :pageSizeOptions="[10, 20, 50, 100]"
      @change="handlePageChange"
    />

    <!-- 创建/编辑素材集模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      :title="editingAsset ? '编辑素材集' : '创建素材集'"
      @ok="handleCreateAsset"
      @cancel="resetForm"
    >
      <a-form :model="assetForm" layout="vertical">
        <a-form-item label="素材集名称" required>
          <a-input v-model:value="assetForm.name" placeholder="请输入素材集名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="assetForm.description" placeholder="请输入描述" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  FolderOutlined 
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import Pagination from '@/components/Pagination.vue'

const router = useRouter()

// 响应式数据
const assetList = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const showCreateModal = ref(false)
const editingAsset = ref(null)

const assetForm = reactive({
  name: '',
  description: ''
})

// 方法
const loadAssetList = async () => {
  try {
    // TODO: 调用API获取素材集列表
    // const response = await getAssetList({
    //   page: currentPage.value,
    //   pageSize: pageSize.value,
    //   keyword: searchKeyword.value
    // })
    
    // 模拟数据
    assetList.value = [
      {
        id: 1,
        name: '旅游素材集',
        description: '包含各种旅游相关的图片和视频',
        cover: 'https://via.placeholder.com/200x150',
        itemCount: 25,
        creator: '张三',
        createTime: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        name: '美食素材集',
        description: '美食相关的高质量素材',
        cover: 'https://via.placeholder.com/200x150',
        itemCount: 18,
        creator: '李四',
        createTime: '2024-01-14 15:20:00'
      },
      {
        id: 3,
        name: '风景素材集',
        description: '自然风景高清素材',
        cover: 'https://via.placeholder.com/200x150',
        itemCount: 32,
        creator: '王五',
        createTime: '2024-01-13 09:15:00'
      },
      {
        id: 4,
        name: '人物素材集',
        description: '人物摄影素材',
        cover: 'https://via.placeholder.com/200x150',
        itemCount: 15,
        creator: '赵六',
        createTime: '2024-01-12 14:30:00'
      }
    ]
    total.value = 50
  } catch (error) {
    message.error('加载素材集列表失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadAssetList()
}

const handlePageChange = (pagination) => {
  currentPage.value = pagination.current
  pageSize.value = pagination.pageSize
  loadAssetList()
}

const viewAssetDetail = (id) => {
  router.push(`/assets/${id}`)
}

const editAsset = (asset) => {
  editingAsset.value = asset
  assetForm.name = asset.name
  assetForm.description = asset.description
  showCreateModal.value = true
}

const deleteAsset = async (id) => {
  try {
    // TODO: 调用删除API
    // await deleteAsset(id)
    message.success('删除成功')
    loadAssetList()
  } catch (error) {
    message.error('删除失败')
  }
}

const handleCreateAsset = async () => {
  if (!assetForm.name.trim()) {
    message.error('请输入素材集名称')
    return
  }
  
  try {
    if (editingAsset.value) {
      // TODO: 调用编辑API
      // await updateAsset(editingAsset.value.id, assetForm)
      message.success('编辑成功')
    } else {
      // TODO: 调用创建API
      // await createAsset(assetForm)
      message.success('创建成功')
    }
    
    resetForm()
    loadAssetList()
  } catch (error) {
    message.error(editingAsset.value ? '编辑失败' : '创建失败')
  }
}

const resetForm = () => {
  showCreateModal.value = false
  editingAsset.value = null
  assetForm.name = ''
  assetForm.description = ''
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 生命周期
onMounted(() => {
  loadAssetList()
})
</script>

<style scoped>
.asset-list-container {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.search-section {
  margin-bottom: 24px;
}

.asset-grid {
  margin-bottom: 24px;
}

.asset-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%; /* 确保卡片占满列宽 */
  max-width: 100%; /* 防止超出容器 */
}

.asset-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 如果需要在大屏幕上限制最大宽度 */
@media (min-width: 1200px) {
  .asset-card {
    max-width: 320px;
  }
}

.cover-container {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
}

.asset-name {
  font-weight: 500;
  font-size: 16px;
  color: #262626;
  flex: 1;
  margin-right: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0; /* 确保flex子元素可以收缩 */
}

.asset-count {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: normal;
  flex-shrink: 0;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 12px;
  white-space: nowrap;
  min-width: fit-content;
}

.card-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #8c8c8c;
  gap: 12px; /* 使用gap替代margin */
}

.creator {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0; /* 确保flex子元素可以收缩 */
}

.create-time {
  flex-shrink: 0;
  white-space: nowrap;
  min-width: fit-content;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>