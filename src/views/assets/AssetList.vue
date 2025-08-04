<template>
  <div class="asset-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="素材集名称">
          <a-input 
            v-model:value="searchForm.keyword" 
            placeholder="输入素材集名称" 
            @pressEnter="handleSearch" 
          />
        </a-form-item>
        <a-form-item label="用户">
          <UserSelect
            v-model:value="searchForm.creator"
            placeholder="选择用户"
            style="width: 200px;"
            allowClear
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
        <a-form-item style="margin-left: auto;">
          <a-button type="primary" @click="showCreateModal = true">
            <PlusOutlined /> 创建素材集
          </a-button>
        </a-form-item>
      </a-form>
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
                  <span class="creator">{{ asset.username || asset.creator }}</span>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, FolderOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { getAssetCollectionList, createAssetCollection, updateAssetCollection, deleteAssetCollection } from '@/api/modules/assetApi'
import Pagination from '@/components/Pagination.vue'
import UserSelect from '@/components/UserSelect.vue'
import dayjs from 'dayjs'

const router = useRouter()

// 响应式数据
const assetList = ref([])
const searchForm = ref({
  keyword: '',
  creator: null
})
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const showCreateModal = ref(false)
const editingAsset = ref(null)
const assetForm = ref({
  name: '',
  description: ''
})

// 加载素材集列表
const loadAssetList = async () => {
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      keyword: searchForm.value.keyword || undefined,
      creator: searchForm.value.creator || undefined
    }
    
    const response = await getAssetCollectionList(params)
    
    // 适配实际的后端数据结构
    if (response && response.code === 0 && response.data) {
      const items = response.data.results || []
      const totalCount = response.data.count || 0
      
      assetList.value = items.map(item => ({
        id: item.id,
        name: item.set_name,
        itemCount: item.asset_count,
        creator: item.creator,
        username: item.username, // 优先显示 username
        createTime: item.create_time,
        cover: item.cover_img,
        description: item.description
      }))
      total.value = totalCount
    } else {
      console.log('数据格式不正确或请求失败:', response)
      assetList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取素材集列表失败:', error)
    message.error('获取素材集列表失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadAssetList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    keyword: '',
    creator: null
  }
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

const deleteAsset = (id) => {
  // 找到要删除的素材集信息
  const asset = assetList.value.find(item => item.id === id)
  const assetName = asset ? asset.name : '该素材集'
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除素材集 "${assetName}" 吗？删除后将无法恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteAssetCollection(id)
        message.success('删除成功')
        loadAssetList()
      } catch (error) {
        console.error('删除失败:', error)
        message.error('删除失败')
      }
    },
    onCancel() {
      // 用户取消删除，不需要做任何操作
    },
  })
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