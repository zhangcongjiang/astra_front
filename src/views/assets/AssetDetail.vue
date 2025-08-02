<template>
  <div class="asset-detail-container">
    <!-- 添加全局loading效果 -->
    <div v-if="pageLoading" class="page-loading">
      <a-spin size="large" tip="加载中...">
        <div class="loading-content"></div>
      </a-spin>
    </div>
    
    <!-- 原有内容，只在非loading状态下显示 -->
    <div v-else>
      <div class="header">
      <a-button @click="goBack" style="margin-right: 16px">
        <ArrowLeftOutlined /> 返回
      </a-button>
      <div class="asset-info">
        <h2>{{ assetDetail.name }}</h2>
        <p class="description">{{ assetDetail.description }}</p>
        <div class="meta-info">
          <span>用户: {{ assetDetail.creator }}</span>
          <span>创建时间: {{ formatTime(assetDetail.createTime) }}</span>
          <span>素材数量: {{ totalItemsCount }}</span>
        </div>
      </div>
    </div>

    <div class="content">
      <!-- 分类展示区域 -->
      <div class="categorized-content">
        <!-- 图片分类 -->
        <div class="category-section">
          <div class="category-header">
            <h3><FileImageOutlined /> 图片素材 ({{ imageItems.length }})</h3>
            <a-button type="primary" size="small" @click="handleAddAudioItems">
              <PlusOutlined /> 新增
            </a-button>
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
                  class="item-card image-card"
                  @click="openPreview(item, index)"
                >
                  <template #cover>
                    <div class="item-cover">
                      <img 
                        :src="item.url" 
                        :alt="item.name"
                        class="cover-image"
                      />
                      <div class="delete-overlay" @click.stop>
                        <a-popconfirm
                          title="确定要删除这个素材吗？"
                          @confirm="deleteAssetItem(item.id,'image')"
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
            <a-button type="primary" size="small" @click="handleAddAudioItems">
              <PlusOutlined /> 新增
            </a-button>
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
                      <div class="video-cover" @click="playVideo(item)">
                        <video :src="item.url" class="cover-video" ref="videoRef" />
                        <div class="play-overlay">
                          <PlayCircleOutlined :style="{ fontSize: '32px', color: '#fff' }" />
                        </div>
                      </div>
                      <div class="delete-overlay">
                        <a-popconfirm
                          title="确定要删除这个素材吗？"
                          @confirm="deleteAssetItem(item.id,'video')"
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
            <a-button type="primary" size="small" @click="handleAddAudioItems">
              <PlusOutlined /> 新增
            </a-button>
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
                      <div class="audio-cover" @click="playAudio(item)">
                        <SoundOutlined :style="{ fontSize: '48px', color: isPlaying(item.id) ? '#52c41a' : '#1890ff' }" />
                        <div v-if="isPlaying(item.id)" class="audio-playing-indicator">
                          <div class="wave-animation"></div>
                        </div>
                      </div>
                      <div class="delete-overlay">
                        <a-popconfirm
                          title="确定要删除这个素材吗？"
                          @confirm="deleteAssetItem(item.id,'audio')"
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

        <!-- 文本文案分类 -->
        <div class="category-section">
          <div class="category-header">
            <h3><FileTextOutlined /> 文本素材 ({{ textItems.length }})</h3>
            <a-button type="primary" size="small" @click="showTextModal">
              <PlusOutlined /> 新增
            </a-button>
          </div>
          <div class="text-items-container">
            <div v-if="textItems.length > 0">
              <div v-for="item in textItems" :key="item.id" class="text-item-card">
                <div class="text-item-header">
                  <h4>{{ item.name }}</h4>
                  <div class="text-item-actions">
                    <div class="text-status" v-if="item.saving">
                      <LoadingOutlined /> 保存中...
                    </div>
                    <div class="text-status success" v-else-if="item.saved">
                      <CheckOutlined /> 已保存
                    </div>
                    <a-popconfirm
                      title="确定要删除这个文本素材吗？"
                      @confirm="deleteAssetItem(item.id,'text')"
                    >
                      <a-button type="link" size="small" danger>
                        <DeleteOutlined /> 删除
                      </a-button>
                    </a-popconfirm>
                  </div>
                </div>
                <div class="text-content">
                  <a-textarea
                    v-model:value="item.text"
                    :auto-size="{ minRows: 3, maxRows: 8 }"
                    placeholder="请输入文本内容"
                    @change="handleTextChange(item)"
                    class="text-input"
                  />
                </div>
                <div class="text-item-meta">
                  <span>创建时间: {{ formatTime(item.createTime) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-text">
              <a-empty description="暂无文本素材" size="small" />
            </div>
          </div>
        </div>


      </div>
    </div>
    </div> <!-- 添加这个结束标签来闭合第11行的 <div v-else> -->
    
    <!-- 文本文案编辑模态框 -->
    <a-modal
      v-model:open="textModalVisible"
      :title="textModalTitle"
      width="800px"
      @ok="handleTextSubmit"
      @cancel="closeTextModal"
      :confirm-loading="textSubmitLoading"
    >
      <a-form :model="textFormState" layout="vertical">
        <a-form-item >
          <div class="paragraph-container">
            <div v-for="(paragraph, index) in textFormState.text" :key="index" class="paragraph-item">
              <a-textarea
                v-model:value="textFormState.text[index]"
                :placeholder="`请输入第${index + 1}段内容`"
                :rows="3"
                style="margin-bottom: 8px;"
              />
              <a-button 
            type="text" 
            danger 
            size="small" 
            @click="removeParagraph(index)"
            style="margin-left: 8px;"
            v-if="textFormState.text.length > 1"
          >
            <DeleteOutlined /> 删除素材
          </a-button>
            </div>
            <a-button type="dashed" @click="addParagraph" style="width: 100%; margin-top: 8px;">
          <PlusOutlined /> 添加素材
        </a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 使用全屏覆盖的方式替代模态框 -->
    <div v-if="previewVisible" class="fullscreen-preview" @click="closePreview">
      <div class="preview-content" @click.stop>
        <!-- 右上角操作按钮 -->
        <div class="preview-top-actions">
          <a-popconfirm
            title="确定要删除这张图片吗？"
            @confirm="deleteCurrentImage"
            ok-text="确定"
            cancel-text="取消"
          >
            <a-button type="text" danger class="preview-action-btn">
              <DeleteOutlined />
            </a-button>
          </a-popconfirm>
          <a-button type="text" @click="closePreview" class="preview-action-btn">
            <CloseOutlined />
          </a-button>
        </div>

        <!-- 左侧切换按钮 -->
        <div class="preview-nav-btn preview-nav-left" v-if="imageItems.length > 1">
          <a-button 
            type="text" 
            @click="showPrevImage" 
            :disabled="currentPreviewIndex === 0"
            class="nav-btn"
          >
            <LeftOutlined :style="{ fontSize: '24px' }" />
          </a-button>
        </div>

        <!-- 图片 -->
        <img 
          :src="currentPreviewImage.url" 
          :alt="currentPreviewImage.name"
          class="preview-image"
        />

        <!-- 右侧切换按钮 -->
        <div class="preview-nav-btn preview-nav-right" v-if="imageItems.length > 1">
          <a-button 
            type="text" 
            @click="showNextImage" 
            :disabled="currentPreviewIndex === imageItems.length - 1"
            class="nav-btn"
          >
            <RightOutlined :style="{ fontSize: '24px' }" />
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import { 
  ArrowLeftOutlined,
  PlusOutlined, 
  PlayCircleOutlined,
  SoundOutlined,
  DeleteOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  LoadingOutlined,
  CheckOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { 
  getAssetCollectionDetail,
  createTextAsset,
  updateTextAsset,
  deleteAssetInfo
} from '@/api/modules/assetApi'

const router = useRouter()
const route = useRoute()

// 响应式数据
const assetDetail = ref({
  name: '',
  description: '',
  creator: '',
  createTime: ''
})
const pageLoading = ref(true)
const assetItems = ref([])
const textItems = ref([])
const searchKeyword = ref('')
// 添加缺失的 imageItems 定义
const imageItems = ref([])
const videoItems = ref([])
const audioItems = ref([])
const playingAudioId = ref(null)

// 播放状态管理
const currentPlayingAudio = ref(null)
const currentPlayingVideo = ref(null)
const playingItems = ref(new Set())

// 图片预览相关状态
const previewVisible = ref(false)
const currentPreviewImage = ref({})
const currentPreviewIndex = ref(0)



// 文本文案相关状态
const textModalVisible = ref(false)
const textModalTitle = ref('编辑文本素材')
const textFormState = ref({
  id: '',
  name: '',
  text: []
})
const textSubmitLoading = ref(false)
const textSaveTimers = new Map() // 存储每个文本项的保存定时器
const SAVE_DELAY = 1000 // 1秒延迟保存

// 计算属性

const filteredTextItems = computed(() => {
  let items = textItems.value
  
  if (searchKeyword.value) {
    items = items.filter(item => 
      item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.text.some(paragraph => 
        paragraph.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
    )
  }
  
  return items
})

const totalItemsCount = computed(() => {
  return imageItems.value.length + videoItems.value.length + audioItems.value.length + textItems.value.length
})

// 图片预览相关方法
const openPreview = (image, index) => {
  currentPreviewImage.value = image
  currentPreviewIndex.value = index
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
  currentPreviewImage.value = {}
  currentPreviewIndex.value = 0
}

const showPrevImage = () => {
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--
    currentPreviewImage.value = imageItems.value[currentPreviewIndex.value]
  }
}

const showNextImage = () => {
  if (currentPreviewIndex.value < imageItems.value.length - 1) {
    currentPreviewIndex.value++
    currentPreviewImage.value = imageItems.value[currentPreviewIndex.value]
  }
}

const deleteCurrentImage = async () => {
  try {
    const imageId = currentPreviewImage.value.id
    await deleteAssetItem(imageId,'image')
    
    // 更新预览状态
    if (imageItems.value.length === 0) {
      closePreview()
    } else {
      // 调整当前预览索引
      if (currentPreviewIndex.value >= imageItems.value.length) {
        currentPreviewIndex.value = imageItems.value.length - 1
      }
      currentPreviewImage.value = imageItems.value[currentPreviewIndex.value]
    }
  } catch (error) {
    message.error('删除失败')
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (!previewVisible.value) return
  
  switch (event.key) {
    case 'ArrowLeft':
      showPrevImage()
      break
    case 'ArrowRight':
      showNextImage()
      break
    case 'Escape':
      closePreview()
      break
  }
}

// 播放视频
const playVideo = (item) => {
  // 停止当前播放的视频
  if (currentPlayingVideo.value) {
    currentPlayingVideo.value.pause()
    currentPlayingVideo.value.currentTime = 0
  }
  
  // 创建视频播放模态框
  const modal = Modal.info({
    title: item.name,
    width: '80vw',
    content: h('div', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }
    }, [
      h('video', {
        src: item.url,
        controls: true,
        autoplay: true,
        style: {
          maxWidth: '100%',
          maxHeight: '70vh'
        },
        onLoadeddata: (e) => {
          currentPlayingVideo.value = e.target
        }
      })
    ]),
    onOk: () => {
      if (currentPlayingVideo.value) {
        currentPlayingVideo.value.pause()
        currentPlayingVideo.value = null
      }
    }
  })
}

// 播放音频
const playAudio = (item) => {
  // 如果当前音频正在播放，则停止
  if (playingItems.value.has(item.id)) {
    if (currentPlayingAudio.value) {
      currentPlayingAudio.value.pause()
      currentPlayingAudio.value = null
    }
    playingItems.value.delete(item.id)
    return
  }
  
  // 停止其他音频
  if (currentPlayingAudio.value) {
    currentPlayingAudio.value.pause()
    playingItems.value.clear()
  }
  
  // 创建新的音频实例
  const audio = new Audio(item.url)
  currentPlayingAudio.value = audio
  playingItems.value.add(item.id)
  
  audio.addEventListener('ended', () => {
    playingItems.value.delete(item.id)
    currentPlayingAudio.value = null
  })
  
  audio.addEventListener('error', () => {
    message.error('音频播放失败')
    playingItems.value.delete(item.id)
    currentPlayingAudio.value = null
  })
  
  audio.play().catch(() => {
    message.error('音频播放失败')
    playingItems.value.delete(item.id)
    currentPlayingAudio.value = null
  })
}

// 检查是否正在播放
const isPlaying = (itemId) => {
  return playingItems.value.has(itemId)
}

// 文本文案相关方法
const showTextModal = () => {
  textModalTitle.value = '新增文本素材'
  textFormState.value.id = null
  textFormState.value.name = ''
  textFormState.value.text = ['']
  textModalVisible.value = true
}

const editTextItem = (record) => {
  textModalTitle.value = '编辑文本素材'
  textFormState.value = {
    id: record.id,
    name: record.name,
    text: [...record.text]
  }
  textModalVisible.value = true
}

const addParagraph = () => {
  textFormState.value.text.push('')
}

const removeParagraph = (index) => {
  textFormState.value.text.splice(index, 1)
}

const handleTextSubmit = async () => {
  const formData = textFormState.value
  
  const paragraphs = formData.text
    .map(p => p.trim())
    .filter(p => p !== '')

  if (paragraphs.length === 0) {
    message.error('请至少添加一个素材')
    return
  }

  textSubmitLoading.value = true
  
  try {
    // 构造批量创建的数据
    const createData = {
      set_id: route.params.id,
      texts: paragraphs.map(text => ({ text })),
      creator: '当前用户' // 可以从用户信息中获取
    }
    
    const response = await createTextAsset(createData)
    
    if (response.code === 0) {
      message.success(`成功创建${response.data.created_count}个文本素材`)
      closeTextModal()
      // 重新加载素材详情
      await loadAssetDetail()
    } else {
      message.error(response.message || '创建文本素材失败')
    }
  } catch (error) {
    console.error('创建文本素材失败:', error)
    message.error('创建文本素材失败')
  } finally {
    textSubmitLoading.value = false
  }
}

const closeTextModal = () => {
  textModalVisible.value = false
  textFormState.value = {
    id: '',
    name: '文案内容',
    text: []
  }
}


// 处理文本变化
const handleTextChange = (item) => {
  // 清除之前的定时器
  if (textSaveTimers.has(item.id)) {
    clearTimeout(textSaveTimers.get(item.id))
  }
  
  // 设置保存状态
  item.saving = false
  item.saved = false
  
  // 设置新的定时器
  const timer = setTimeout(async () => {
    await saveTextItem(item)
  }, SAVE_DELAY)
  
  textSaveTimers.set(item.id, timer)
}

// 保存文本项
const saveTextItem = async (item) => {
  if (!item.text || !item.text.trim()) {
    message.warning('文本内容不能为空')
    return
  }

  item.saving = true
  item.saved = false
  
  try {
    await updateTextAsset({
      asset_info_id: item.id,
      text: item.text.trim()
    })
    
    item.saved = true
    
    // 2秒后隐藏保存成功状态
    setTimeout(() => {
      item.saved = false
    }, 2000)
  } catch (error) {
    console.error('保存文本失败:', error)
    message.error('保存文本失败')
  } finally {
    item.saving = false
  }
}

const handleAddImageItems = () => {
  message.info('图片素材新增功能暂未开放')
}

const handleAddVideoItems = () => {
  message.info('视频素材新增功能暂未开放')
}

const handleAddAudioItems = () => {
  message.info('音频素材新增功能暂未开放')
}
// 加载素材详情
const loadAssetDetail = async () => {
  try {
    pageLoading.value = true
    console.log('开始加载素材详情，ID:', route.params.id)
    const response = await getAssetCollectionDetail(route.params.id)
    
    console.log('API响应:', response)
    
    if (response.code === 0) {
      const data = response.data
      
      // 更灵活的数据赋值，兼容不同的字段名
      if (data.asset_detail || data) {
        const detail = data.asset_detail || data
        assetDetail.value = {
          name: detail.name || detail.set_name || '',
          description: detail.description || '',
          creator: detail.username || '',
          createTime: detail.createTime || detail.create_time || detail.created_at || ''
        }
        console.log('更新后的 assetDetail:', assetDetail.value)
      } else {
        console.warn('API返回的数据结构异常:', data)
        // 尝试直接从 data 中获取
        assetDetail.value = {
          name: data.name || data.set_name || '',
          description: data.description || '',
          creator: data.creator || data.creator_name || '',
          createTime: data.createTime || data.create_time || data.created_at || ''
        }
      }
      
      imageItems.value = data.images
        .filter(item => item.asset_type === 'image')
        .map(item => ({
          id: item.id,
          resource_id: item.resource_id,
          name: item.resource_detail.name,
          type: 'image',
          url: item.resource_detail.url,
          width: item.resource_detail.width,
          height: item.resource_detail.height,
          format: item.resource_detail.format,
          createTime: item.resource_detail.create_time,
          index: item.index
        }))
      
      // 处理文本数据，添加保存状态
      textItems.value = (data.texts || []).map(item => ({
        id: item.id,
        resource_id: item.resource_id,
        name: `文本素材_${item.index}`,
        text: item.resource_detail.text,
        createTime: item.resource_detail.create_time,
        index: item.index,
        // 添加保存状态
        saving: false,
        saved: false
      }))
      
      videoItems.value = data.videos.map(item => ({
        id: item.id,
        resource_id: item.resource_id,
        name: item.resource_detail.name || `视频素材_${item.index}`,
        type: 'video',
        url: item.resource_detail.url,
        createTime: item.resource_detail.create_time,
        index: item.index
      }))
      
      audioItems.value = data.sounds.map(item => ({
        id: item.id,
        resource_id: item.resource_id,
        name: item.resource_detail.name || `音频素材_${item.index}`,
        type: 'audio',
        url: item.resource_detail.url,
        createTime: item.resource_detail.create_time,
        index: item.index
      }))
      
    } else {
      console.error('API返回错误:', response)
      message.error(response.message || '获取素材集详情失败')
    }
  } catch (error) {
    console.error('加载素材集详情失败:', error)
    console.error('错误详情:', error.response)
    message.error('加载素材集详情失败')
  } finally {
    pageLoading.value = false
  }
}

// 其他方法
const goBack = () => {
  router.back()
}

// 统一的删除方法
const deleteAssetItem = async (itemId, assetType) => {
  try {
    // 调用 API 删除素材
    const response = await deleteAssetInfo(itemId)
    
    if (response.code === 0) {
      // 根据素材类型从对应数组中移除
      switch (assetType) {
        case 'image':
          imageItems.value = imageItems.value.filter(item => item.id !== itemId)
          break
        case 'video':
          videoItems.value = videoItems.value.filter(item => item.id !== itemId)
          break
        case 'audio':
          audioItems.value = audioItems.value.filter(item => item.id !== itemId)
          break
        case 'text':
          textItems.value = textItems.value.filter(item => item.id !== itemId)
          break
      }
      message.success('删除成功')
    } else {
      message.error(response.message || '删除失败')
    }
  } catch (error) {
    console.error('删除素材失败:', error)
    message.error('删除失败')
  }
}

// 工具函数
const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}



// 生命周期
onMounted(() => {
  loadAssetDetail()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 清理所有文本保存定时器
  textSaveTimers.forEach(timer => {
    clearTimeout(timer)
  })
  textSaveTimers.clear()
  
  document.removeEventListener('keydown', handleKeydown)
  if (currentPlayingAudio.value) {
    currentPlayingAudio.value.pause()
  }
  if (currentPlayingVideo.value) {
    currentPlayingVideo.value.pause()
  }
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
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
}

.item-card .ant-card-body {
  padding: 12px;
}

.item-card .ant-card-meta-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 图片卡片样式优化 */
.image-card {
  height: 200px;
  overflow: hidden;
}

.image-card .ant-card-body {
  display: none; /* 隐藏卡片底部，只显示图片 */
}

.image-only-card {
  height: 180px; /* 固定高度，因为没有底部文字区域 */
}

.image-only-card .item-cover {
  height: 100%;
  border-radius: 6px;
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
  object-fit: cover; /* 保持图片比例，填满容器 */
  transition: transform 0.3s ease;
}

.item-card:hover .cover-image {
  transform: scale(1.05);
}

/* 视频封面样式 */
.video-cover {
  position: relative;
  height: 120px;
  cursor: pointer;
  overflow: hidden;
}

.cover-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  padding: 8px;
  transition: all 0.3s ease;
}

.video-cover:hover .play-overlay {
  background: rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

/* 音频封面样式 */
.audio-cover {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.audio-cover:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  transform: scale(1.02);
}

/* 音频播放指示器 */
.audio-playing-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.wave-animation {
  width: 20px;
  height: 20px;
  background: #52c41a;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
  }
}

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
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: rgba(255, 77, 79, 0.8);
  color: white;
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

/* 文本文案相关样式 */
.text-items-container {
  margin-top: 16px;
}

.text-item-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafafa;
}

.text-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.text-item-header h4 {
  margin: 0;
  color: #262626;
}

.text-item-actions {
  display: flex;
  align-items: center;
}

.text-content {
  margin-bottom: 12px;
}

.paragraph-item {
  margin-bottom: 8px;
}

.paragraph-item p {
  margin: 0;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
  line-height: 1.6;
}

.empty-text {
  text-align: center;
  padding: 20px;
}

.text-item-meta {
  font-size: 12px;
  color: #8c8c8c;
}

.text-input {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s;
}

.text-input:hover {
  border-color: #40a9ff;
}

.text-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.text-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.text-status.success {
  color: #52c41a;
}

.paragraph-container {
  max-height: 400px;
  overflow-y: auto;
}

.paragraph-container .paragraph-item {
  position: relative;
  padding-bottom: 24px;
}

.paragraph-container .remove-btn {
  position: absolute;
  right: 0;
  bottom: 0;
}

/* 全屏预览样式 */
.fullscreen-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.preview-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.preview-image {
  max-width: 80vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

/* 右上角操作按钮 */
.preview-top-actions {
  position: absolute;
  top: -50px;
  right: 0;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

.preview-action-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.preview-action-btn:hover {
  background: rgba(0, 0, 0, 0.9) !important;
  color: white !important;
  transform: scale(1.1);
}

/* 导航按钮 */
.preview-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
}

.preview-nav-left {
  left: -80px;
}

.preview-nav-right {
  right: -80px;
}

.nav-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.nav-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.9) !important;
  color: white !important;
  transform: scale(1.1);
}

.nav-btn:disabled {
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

/* 页面loading样式 */
.page-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  background: #f5f5f5;
}

.loading-content {
  width: 200px;
  height: 100px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

/* 响应式设计 */
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
  
  .text-item-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .text-item-actions {
    align-self: flex-end;
  }
  
  .preview-image {
    max-width: 95%;
    max-height: 95%;
  }
  
  .preview-nav-btn {
    display: none; /* 移动端隐藏导航按钮，只使用触摸滑动 */
  }
  
  .preview-top-actions {
    top: -40px;
    right: 0;
  }
  
  .preview-action-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .preview-image {
    max-width: 98%;
    max-height: 98%;
  }
}
</style>