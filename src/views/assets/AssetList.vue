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
          :span="6"
        >
          <a-card 
            hoverable
            class="asset-card"
            @click="viewAssetDetail(asset.id)"
          >
            <template #cover>
              <div class="cover-container">
                <!-- 右上角素材数量标签 -->
                <div class="asset-count-badge">{{ asset.itemCount || 0 }}</div>
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
              <span class="action-item" @click.stop="editAsset(asset)">
                <EditOutlined />
                <span class="action-text">编辑</span>
              </span>
              <span class="action-item" @click.stop="deleteAsset(asset.id)">
                <DeleteOutlined />
                <span class="action-text">删除</span>
              </span>
            </template>
            
            <a-card-meta>
              <template #title>
                <div class="card-title-row">
                  <span class="asset-name">{{ asset.name }}</span>
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
import { ref, reactive, onMounted, nextTick } from 'vue'
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
// 添加API导入
import {
  getAssetCollectionList,
  createAssetCollection,
  updateAssetCollection,
  deleteAssetCollection
} from '@/api/modules/assetApi'

const router = useRouter()

// 响应式数据
const assetList = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
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
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    
    if (searchKeyword.value.trim()) {
      params.search = searchKeyword.value.trim()
    }
    
    const response = await getAssetCollectionList(params)
    
    // 检查不同的响应结构可能性
    let data
    if (response.data) {
      data = response.data
    } else if (response.results) {
      data = response
    } else {
      data = response
    }
    
    console.log('处理后的数据:', data)
    
    if (data && data.results) {
      // 映射后端数据到前端格式
      const mappedData = data.results.map(item => ({
        id: item.id,
        name: item.set_name,
        itemCount: item.asset_count,
        creator: item.creator,
        createTime: item.create_time,
        cover: item.cover_img // 修改为 cover，与模板中的字段名一致
      }))
      
      assetList.value = mappedData
      total.value = data.count
      
      // 强制触发更新
      nextTick(() => {
        console.log('DOM 更新完成')
      })
    }
  } catch (error) {
    console.error('加载素材集列表失败:', error)
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
    await deleteAssetCollection(id)
    message.success('删除成功')
    loadAssetList()
  } catch (error) {
    console.error('删除失败:', error)
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
      // 编辑模式 - 使用你提供的API格式
      await updateAssetCollection(editingAsset.value.id, assetForm.name.trim())
      message.success('编辑成功')
    } else {
      // 创建模式
      const data = {
        set_name: assetForm.name.trim(),
        description: assetForm.description.trim()
      }
      await createAssetCollection(data)
      message.success('创建成功')
    }
    
    resetForm()
    loadAssetList()
  } catch (error) {
    console.error('操作失败:', error)
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
  position: relative; /* 添加相对定位 */
}

/* 右上角素材数量标签样式 */
.asset-count-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #1890ff;
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  z-index: 10;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-title-row {
  display: flex;
  justify-content: flex-start; /* 改为左对齐 */
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
}

.asset-name {
  font-weight: 500;
  font-size: 16px;
  color: #262626;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* 移除原来的 asset-count 样式，因为已经移到右上角 */
.cover-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为 contain，保持图片完整显示 */
  object-position: center; /* 图片居中显示 */
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

.action-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-item:hover {
  background-color: #f5f5f5;
}

.action-text {
  font-size: 12px;
  color: #666;
}

.action-item:hover .action-text {
  color: #1890ff;
}
</style>