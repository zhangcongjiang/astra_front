<template>
  <div class="asset-detail-container">
    <div class="header">
      <a-button @click="goBack" style="margin-right: 16px">
        <ArrowLeftOutlined /> 返回
      </a-button>
      <div class="asset-info">
        <h2>{{ assetDetail.name }}</h2>
        <p class="description">{{ assetDetail.description }}</p>
        <div class="meta-info">
          <span>创建者: {{ assetDetail.creator }}</span>
          <span>创建时间: {{ formatTime(assetDetail.createTime) }}</span>
          <span>素材数量: {{ assetItems.length }}</span>
        </div>
      </div>
      <div class="actions">
        <a-button @click="showAddModal = true">
          <PlusOutlined /> 添加素材
        </a-button>
        <a-button type="primary" @click="editAsset">
          <EditOutlined /> 编辑
        </a-button>
      </div>
    </div>

    <div class="content">
      <div class="toolbar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索素材"
          style="width: 300px"
          @search="handleSearch"
        />
      </div>

      <!-- 分类展示区域 -->
      <div class="categorized-content">
        <!-- 图片分类 -->
        <div class="category-section">
          <div class="category-header">
            <h3><FileImageOutlined /> 图片素材 ({{ imageItems.length }})</h3>
            <a-upload
              :show-upload-list="false"
              :before-upload="(file) => handleUpload(file, 'image')"
              accept="image/*"
              multiple
            >
              <a-button type="primary" size="small">
                <UploadOutlined /> 上传图片
              </a-button>
            </a-upload>
          </div>
          <div v-if="imageItems.length > 0" class="items-grid">
            <a-row :gutter="[16, 16]">
              <a-col 
                v-for="(item, index) in imageItems" 
                :key="item.id"
                :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
              >
                <a-card 
                  hoverable
                  class="item-card"
                >
                  <template #cover>
                    <div class="item-cover">
                      <img 
                        :src="item.url" 
                        :alt="item.name"
                        class="cover-image"
                      />
                      <!-- 悬浮删除按钮 -->
                      <div class="delete-overlay">
                        <a-popconfirm
                          title="确定要删除这个素材吗？"
                          @confirm="removeItem(item.id)"
                          ok-text="确定"
                          cancel-text="取消"
                        >
                          <a-button 
                            type="text" 
                            danger 
                            size="small"
                            class="delete-btn"
                          >
                            <DeleteOutlined />
                          </a-button>
                        </a-popconfirm>
                      </div>
                    </div>
                  </template>
                  
                  <a-card-meta 
                    :title="item.name"
                  />
                </a-card>
              </a-col>
            </a-row>
          </div>
          <div v-else class="empty-category">
            <a-empty description="暂无图片素材" />
          </div>
        </div>

        <!-- 视频分类 -->
        <div class="category-section">
          <div class="category-header">
            <h3><VideoCameraOutlined /> 视频素材 ({{ videoItems.length }})</h3>
            <a-upload
              :show-upload-list="false"
              :before-upload="(file) => handleUpload(file, 'video')"
              accept="video/*"
              multiple
            >
              <a-button type="primary" size="small">
                <UploadOutlined /> 上传视频
              </a-button>
            </a-upload>
          </div>
          <div v-if="videoItems.length > 0" class="items-grid">
            <a-row :gutter="[16, 16]">
              <a-col 
                v-for="(item, index) in videoItems" 
                :key="item.id"
                :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
              >
                <a-card 
                  hoverable
                  class="item-card"
                >
                  <template #cover>
                    <div class="item-cover">
                      <div class="video-cover">
                        <video :src="item.url" class="cover-video" />
                        <div class="play-overlay">
                          <PlayCircleOutlined :style="{ fontSize: '32px', color: '#fff' }" />
                        </div>
                      </div>
                      <!-- 悬浮删除按钮 -->
                      <div class="delete-overlay">
                        <a-popconfirm
                          title="确定要删除这个素材吗？"
                          @confirm="removeItem(item.id)"
                          ok-text="确定"
                          cancel-text="取消"
                        >
                          <a-button 
                            type="text" 
                            danger 
                            size="small"
                            class="delete-btn"
                          >
                            <DeleteOutlined />
                          </a-button>
                        </a-popconfirm>
                      </div>
                    </div>
                  </template>
                  
                  <a-card-meta 
                    :title="item.name"
                  />
                </a-card>
              </a-col>
            </a-row>
          </div>
          <div v-else class="empty-category">
            <a-empty description="暂无视频素材" />
          </div>
        </div>

        <!-- 音频分类 -->
        <div class="category-section">
          <div class="category-header">
            <h3><SoundOutlined /> 音频素材 ({{ audioItems.length }})</h3>
            <a-upload
              :show-upload-list="false"
              :before-upload="(file) => handleUpload(file, 'audio')"
              accept="audio/*"
              multiple
            >
              <a-button type="primary" size="small">
                <UploadOutlined /> 上传音频
              </a-button>
            </a-upload>
          </div>
          <div v-if="audioItems.length > 0" class="items-grid">
            <a-row :gutter="[16, 16]">
              <a-col 
                v-for="(item, index) in audioItems" 
                :key="item.id"
                :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
              >
                <a-card 
                  hoverable
                  class="item-card"
                >
                  <template #cover>
                    <div class="item-cover">
                      <div class="audio-cover">
                        <SoundOutlined :style="{ fontSize: '48px', color: '#1890ff' }" />
                      </div>
                      <!-- 悬浮删除按钮 -->
                      <div class="delete-overlay">
                        <a-popconfirm
                          title="确定要删除这个素材吗？"
                          @confirm="removeItem(item.id)"
                          ok-text="确定"
                          cancel-text="取消"
                        >
                          <a-button 
                            type="text" 
                            danger 
                            size="small"
                            class="delete-btn"
                          >
                            <DeleteOutlined />
                          </a-button>
                        </a-popconfirm>
                      </div>
                    </div>
                  </template>
                  
                  <a-card-meta 
                    :title="item.name"
                  />
                </a-card>
              </a-col>
            </a-row>
          </div>
          <div v-else class="empty-category">
            <a-empty description="暂无音频素材" />
          </div>
        </div>

        <!-- 全局空状态 -->
        <div v-if="filteredItems.length === 0 && searchKeyword" class="empty-state">
          <a-empty description="未找到匹配的素材" />
        </div>
      </div>
    </div>

    <!-- 添加素材模态框 -->
    <a-modal
      v-model:open="showAddModal"
      title="添加素材到素材集"
      width="800px"
      @ok="handleAddItems"
      @cancel="selectedItems = []"
    >
      <div class="add-items-content">
        <p>选择要添加到素材集的素材</p>
        <!-- TODO: 实现素材选择界面 -->
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  ArrowLeftOutlined,
  PlusOutlined, 
  EditOutlined, 
  PlayCircleOutlined,
  SoundOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileImageOutlined,
  VideoCameraOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

// 响应式数据
const assetDetail = ref({})
const assetItems = ref([])
const searchKeyword = ref('')
const showAddModal = ref(false)
const selectedItems = ref([])

// 计算属性 - 按类型分类的素材
const filteredItems = computed(() => {
  let items = assetItems.value
  
  if (searchKeyword.value) {
    items = items.filter(item => 
      item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  return items
})

const imageItems = computed(() => {
  return filteredItems.value.filter(item => item.type === 'image')
})

const videoItems = computed(() => {
  return filteredItems.value.filter(item => item.type === 'video')
})

const audioItems = computed(() => {
  return filteredItems.value.filter(item => item.type === 'audio')
})

// 方法
const loadAssetDetail = async () => {
  try {
    const assetId = route.params.id
    // TODO: 调用API获取素材集详情
    
    // 模拟数据
    assetDetail.value = {
      id: assetId,
      name: '旅游素材集',
      description: '包含各种旅游相关的图片和视频素材',
      creator: '张三',
      createTime: '2024-01-15 10:30:00'
    }
    
    assetItems.value = [
      {
        id: 1,
        name: '海滩风景.jpg',
        type: 'image',
        url: 'https://via.placeholder.com/400x300',
        size: 2621440 // 2.5MB
      },
      {
        id: 2,
        name: '旅游宣传片.mp4',
        type: 'video',
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        size: 15728640 // 15MB
      },
      {
        id: 3,
        name: '背景音乐.mp3',
        type: 'audio',
        url: 'https://sample-music.com/sample.mp3',
        size: 4194304 // 4MB
      },
      {
        id: 4,
        name: '山景图片.jpg',
        type: 'image',
        url: 'https://via.placeholder.com/400x300',
        size: 1048576 // 1MB
      },
      {
        id: 5,
        name: '城市夜景.mp4',
        type: 'video',
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        size: 20971520 // 20MB
      }
    ]
  } catch (error) {
    message.error('加载素材集详情失败')
  }
}

const goBack = () => {
  router.back()
}

const editAsset = () => {
  // TODO: 实现编辑功能
  message.info('编辑功能待实现')
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中实现
}

// 上传功能
const handleUpload = async (file, type) => {
  try {
    // 文件类型验证
    const validTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
      audio: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg']
    }
    
    if (!validTypes[type].includes(file.type)) {
      message.error(`请选择正确的${type === 'image' ? '图片' : type === 'video' ? '视频' : '音频'}格式文件`)
      return false
    }
    
    // 文件大小验证（可根据需要调整）
    const maxSize = {
      image: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 20 * 1024 * 1024 // 20MB
    }
    
    if (file.size > maxSize[type]) {
      const sizeLimit = maxSize[type] / (1024 * 1024)
      message.error(`文件大小不能超过 ${sizeLimit}MB`)
      return false
    }
    
    // TODO: 实现文件上传到服务器的逻辑
    // 这里模拟上传过程
    message.loading('正在上传...', 0)
    
    // 模拟上传延迟
    setTimeout(() => {
      message.destroy()
      
      // 创建新的素材项
      const newItem = {
        id: Date.now(),
        name: file.name,
        type: type,
        url: URL.createObjectURL(file), // 临时URL，实际应该是服务器返回的URL
        size: file.size
      }
      
      // 添加到素材列表
      assetItems.value.push(newItem)
      message.success(`${file.name} 上传成功`)
    }, 2000)
    
  } catch (error) {
    message.error('上传失败，请重试')
  }
  
  return false // 阻止默认上传行为
}

const removeItem = async (itemId) => {
  try {
    // TODO: 调用API从素材集中移除素材
    assetItems.value = assetItems.value.filter(item => item.id !== itemId)
    message.success('移除成功')
  } catch (error) {
    message.error('移除失败')
  }
}

const handleAddItems = () => {
  // TODO: 实现添加素材功能
  message.success('添加素材功能待实现')
  showAddModal.value = false
}

// 工具函数
const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '未知大小'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// 生命周期
onMounted(() => {
  loadAssetDetail()
})
</script>

<style scoped>
.asset-detail-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.asset-info {
  flex: 1;
  margin-left: 16px;
}

.asset-info h2 {
  margin: 0 0 8px 0;
  color: #262626;
}

.description {
  color: #666;
  margin: 0 0 12px 0;
}

.meta-info {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #8c8c8c;
}

.actions {
  display: flex;
  gap: 12px;
}

.content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.categorized-content {
  max-height: 70vh;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 32px;
}

.category-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-header h3 {
  margin: 0;
  color: #262626;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.items-grid {
  margin-bottom: 16px;
}

.item-card {
  height: 100%;
  transition: all 0.3s;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.item-cover {
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  position: relative;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-cover {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
}

/* 删除按钮悬浮样式 */
.delete-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.item-card:hover .delete-overlay {
  opacity: 1;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #ff4d4f;
  color: white;
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-category {
  text-align: center;
  padding: 24px 0;
  color: #999;
}

.add-items-content {
  text-align: center;
  padding: 24px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
  }
  
  .meta-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .category-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>