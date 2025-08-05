<template>
  <div class="image-search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <a-button 
        type="text" 
        @click="goBack" 
        class="back-btn"
        :icon="h(ArrowLeftOutlined)"
      >
        返回
      </a-button>
      <h2>图片搜索</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="输入关键字搜索图片"
        enter-button="搜索"
        size="large"
        class="search-input"
        :loading="searching"
        @search="handleSearch"
      />
    </div>

    <!-- 搜索结果 -->
    <div v-if="hasSearched">
      <div class="results-header" v-if="searchResults.length > 0">
        找到 {{ totalCount }} 张图片
      </div>
      
      <div v-if="searchResults.length === 0 && !searching" class="no-results">
        <a-empty description="未找到相关图片" />
      </div>

      <!-- 修改图片网格布局 -->
      <a-row :gutter="[16, 16]" class="image-grid" v-if="searchResults.length > 0">
        <a-col 
          v-for="(image, index) in searchResults" 
          :key="image.id || index"
          :xs="12" 
          :sm="12" 
          :md="6" 
          :lg="6" 
          :xl="6"
          class="image-col"
        >
          <a-card 
            :bodyStyle="{ padding: '8px' }"
            class="image-card"
            hoverable
          >
            <!-- 图片封面 -->
            <div 
              class="cover-container" 
              :style="{ height: '200px' }"
              @click="openPreview(image, index)"
            >
             
              <!-- 加载状态 -->
              <div v-if="image.loading && !image.loaded" class="loading-placeholder">
                <a-spin size="large" />
                <div style="margin-top: 8px; font-size: 12px;">加载中...</div>
              </div>
              
              <!-- 图片显示 -->
              <img 
                v-else-if="image.loaded && !image.loadError"
                :src="image.base64 || image.url" 
                :alt="image.keyword"
                class="search-image"
                @error="handleImageError(image)"
              />
              
              <!-- 加载失败显示 -->
              <div v-else class="error-placeholder">
                <ExclamationCircleOutlined style="font-size: 24px; color: #ccc;" />
                <div style="margin-top: 8px; font-size: 12px;">加载失败</div>
                <a-button 
                  v-if="image.retryCount < 3"
                  size="small" 
                  type="link" 
                  @click.stop="handleImageError(image)"
                  style="margin-top: 4px;"
                >
                  重试 ({{image.retryCount}}/3)
                </a-button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
              <a-button 
                type="primary" 
                size="small"
                :loading="image.saving"
                @click="saveToMaterial(image)"
              >
                <template #icon>
                  <DownloadOutlined />
                </template>
                保存素材
              </a-button>
              
              <a-button 
                size="small"
                :loading="image.adding"
                @click="addToAsset(image)"
              >
                <template #icon>
                  <PlusOutlined />
                </template>
                加入素材集
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 手动加载更多按钮 -->
      <div v-if="searchResults.length > 0 && !noMoreData && !loadingMore" class="load-more-section">
        <a-button 
          type="primary" 
          size="large" 
          @click="loadMoreImages"
          class="load-more-btn"
        >
          加载更多图片
        </a-button>
      </div>

      <!-- 加载更多指示器 -->
      <div v-if="loadingMore" class="loading-more">
        <a-spin size="large" />
        <div style="margin-top: 8px;">加载更多...</div>
      </div>

      <!-- 没有更多数据提示 -->
      <div v-if="noMoreData && searchResults.length > 0" class="no-more-data">
        <a-divider>已加载全部图片</a-divider>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      width="auto"
      :bodyStyle="{ padding: 0, textAlign: 'center', maxWidth: '90vw' }"
      centered
      class="image-preview-modal"
      @cancel="closePreview"
    >
      <div class="preview-container">
        <!-- 导航按钮 -->
        <div class="preview-nav prev-btn" @click="showPrevImage" v-if="searchResults.length > 1">
          <LeftCircleOutlined />
        </div>
        <div class="preview-nav next-btn" @click="showNextImage" v-if="searchResults.length > 1">
          <RightCircleOutlined />
        </div>
        
        <!-- 图片显示区域 -->
        <div class="preview-image-wrapper">
          <img
            v-if="currentPreviewImage && (currentPreviewImage.url || currentPreviewImage.base64)"
            :src="currentPreviewImage.url || currentPreviewImage.base64"
            :alt="currentPreviewImage.title || '图片预览'"
            class="preview-image"
            :style="previewImageStyle"
          />
          <div v-else class="preview-loading">
            <a-spin size="large" />
            <p>图片加载中...</p>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="preview-actions">
          <a-button 
            v-if="currentPreviewImage"
            type="primary" 
            size="large"
            :loading="currentPreviewImage.saving"
            @click="saveToMaterial(currentPreviewImage)"
          >
            <DownloadOutlined /> 保存到素材库
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 素材集选择弹窗 -->
    <a-modal
      v-model:open="assetModalVisible"
      title="选择素材集"
      @ok="confirmAddToAsset"
      @cancel="handleCancelAddToAsset"
      :confirmLoading="addingToAsset"
    >
      <a-select
        v-model:value="selectedAssetId"
        placeholder="请选择素材集"
        style="width: 100%"
        :loading="loadingAssets"
      >
        <a-select-option 
          v-for="asset in assetOptions" 
          :key="asset.id" 
          :value="asset.id"
        >
          {{ asset.set_name }}
        </a-select-option>
      </a-select>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  PlusOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'

// API 导入
// 修改API导入部分（大约在第218行）
import { searchImages, saveImageToMaterial, imageAddress } from '@/api/modules/toolsApi'
import { getAssetCollectionList, addItemToAsset } from '@/api/modules/assetApi'

const router = useRouter()

// 搜索相关
// 在变量定义部分添加 allUrls（大约在第230行附近）
const searchKeyword = ref('')
const searching = ref(false)
const hasSearched = ref(false)
const searchResults = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const loadingMore = ref(false)
const noMoreData = ref(false)
const allUrls = ref([]) // 添加这行

// 预览相关
const previewVisible = ref(false)
const currentPreviewIndex = ref(0)
const currentPreviewImage = ref({})

// 素材集相关（第260行附近已经定义）
const assetModalVisible = ref(false)
const selectedAssetId = ref(null)
const addingToAsset = ref(false)
const currentImage = ref(null)
const assetOptions = ref([])
const loadingAssets = ref(false)

// 响应式图片高度
const imageHeight = ref(200)

// 预览图片样式
const previewImageStyle = computed(() => {
  const maxWidth = window.innerWidth * 0.9
  const maxHeight = window.innerHeight * 0.8
  return {
    maxWidth: `${maxWidth}px`,
    maxHeight: `${maxHeight}px`,
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  }
})

// 响应式处理
const handleResize = () => {
  const width = window.innerWidth
  if (width < 576) {
    imageHeight.value = 120
  } else if (width < 768) {
    imageHeight.value = 150
  } else if (width < 992) {
    imageHeight.value = 180
  } else if (width < 1200) {
    imageHeight.value = 200
  } else {
    imageHeight.value = 220
  }
}

// 键盘事件处理
const handleKeyDown = (e) => {
  if (!previewVisible.value) return

  if (e.key === 'ArrowLeft') {
    showPrevImage()
  } else if (e.key === 'ArrowRight') {
    showNextImage()
  } else if (e.key === 'Escape') {
    closePreview()
  }
}

// 滚动事件处理 - 实现无限滚动
const handleScroll = () => {
  if (loadingMore.value || noMoreData.value || !hasSearched.value) {
    return
  }
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  const distanceFromBottom = documentHeight - (scrollTop + windowHeight)
  
  // 当滚动到距离底部200px时开始加载更多
  if (distanceFromBottom <= 200) {
    loadMoreImages()
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 新增函数：处理图片URLs并调用imageAddress接口
// 修改processImageUrlsWithAddress函数，实现逐个加载
const processImageUrlsWithAddress = async (urls, keyword) => {
  const processedImages = []
  
  for (let i = 0; i < urls.length; i++) {
    const urlItem = urls[i]
    let imageUrl = ''
    
    // 提取URL
    if (typeof urlItem === 'string') {
      imageUrl = urlItem
    } else if (urlItem && typeof urlItem === 'object' && urlItem.url) {
      imageUrl = urlItem.url
    }
    
    if (!imageUrl) {
      console.warn('无效的图片URL:', urlItem)
      continue
    }
    
    // 清理URL
    imageUrl = imageUrl.replace(/[`'"\s]/g, '').trim()
    
    // 创建初始图片对象（显示加载状态）
    const imageObj = reactive({
      id: `img_${Date.now()}_${i}`,
      url: imageUrl,
      base64: null,
      originalUrl: imageUrl,
      keyword: keyword,
      loaded: false,
      loading: true,
      loadError: false,
      retryCount: 0
    })
    
    // 立即添加到结果中（显示加载状态）
    processedImages.push(imageObj)
    searchResults.value.push(imageObj)
    
    // 异步加载图片数据
    loadSingleImageData(imageObj, i)
    
    // 每加载一个图片后稍微延迟，避免并发过多
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return processedImages
}

// 新增函数：加载单个图片数据
// 修改loadSingleImageData函数，增加自动重试
const loadSingleImageData = async (imageObj, index) => {
  try {
    console.log('调用imageAddress接口，URL:', imageObj.originalUrl)
    
    const addressResponse = await imageAddress({ url: imageObj.originalUrl })
    
    console.log('imageAddress接口响应:', addressResponse)
    
    if (addressResponse?.code === 0 && addressResponse?.data) {
      const { url: realUrl, data: base64Data } = addressResponse.data
      
      // 更新图片对象
      imageObj.url = realUrl || imageObj.originalUrl
      imageObj.base64 = base64Data ? `data:image/jpeg;base64,${base64Data}` : null
      
      console.log('准备加载图片:', {
        id: imageObj.id,
        hasBase64: !!imageObj.base64,
        url: imageObj.url
      })
      
      // 自动加载图片，带重试机制
      await loadImageWithRetry(imageObj)
      
      console.log('图片数据加载完成:', imageObj.id, {
        loaded: imageObj.loaded,
        loading: imageObj.loading,
        loadError: imageObj.loadError
      })
    } else {
      console.warn('获取图片地址失败:', addressResponse)
      imageObj.loading = false
      imageObj.loadError = true
    }
  } catch (error) {
    console.error('调用imageAddress接口失败:', error)
    imageObj.loading = false
    imageObj.loadError = true
  }
}

// 新增：带重试机制的图片加载函数
// 修改loadImageWithRetry函数
const loadImageWithRetry = async (imageObj, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const img = new Image()
        
        img.onload = () => {
          // 确保状态正确更新
          imageObj.loaded = true
          imageObj.loading = false
          imageObj.loadError = false
          console.log(`图片加载成功 (尝试 ${attempt + 1}/${maxRetries}): ${imageObj.url}`)
          resolve()
        }
        
        img.onerror = () => {
          console.warn(`图片加载失败 (尝试 ${attempt + 1}/${maxRetries}): ${imageObj.url}`)
          reject(new Error('图片加载失败'))
        }
        
        // 设置超时
        setTimeout(() => {
          reject(new Error('图片加载超时'))
        }, 10000) // 10秒超时
        
        // 优先使用base64，如果没有则使用url
        const imgSrc = imageObj.base64 || imageObj.url
        console.log('开始加载图片:', imgSrc)
        img.src = imgSrc
      })
      
      // 加载成功，跳出重试循环
      return
    } catch (error) {
      console.error(`图片加载失败 (尝试 ${attempt + 1}/${maxRetries}):`, error)
      if (attempt === maxRetries - 1) {
        // 最后一次尝试失败
        imageObj.loaded = false
        imageObj.loading = false
        imageObj.loadError = true
        imageObj.retryCount = maxRetries
        console.error(`图片最终加载失败: ${imageObj.url}`)
      } else {
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }
}

// 修改handleImageError函数，使其更智能
const handleImageError = async (image) => {
  if (image.retryCount < 3) {
    image.retryCount++
    image.loading = true
    image.loadError = false
    console.log(`手动重试加载图片 (${image.retryCount}/3): ${image.url}`)
    
    await loadImageWithRetry(image, 1) // 手动重试时只尝试一次
  } else {
    console.error(`图片加载已达到最大重试次数: ${image.url}`)
  }
}

// 图片加载成功处理
const onImageLoad = (event) => {
  // 可以在这里添加图片加载成功的处理逻辑
  console.log('图片加载成功')
}

// 加载素材集列表
const loadAssets = async () => {
  try {
    // 这里应该调用实际的API来获取素材集列表
    // const response = await api.getAssets()
    // assets.value = response.data
    
    // 临时使用模拟数据
    assets.value = [
      { id: 1, name: '默认素材集', description: '系统默认素材集' },
      { id: 2, name: '我的收藏', description: '个人收藏的图片' }
    ]
  } catch (error) {
    console.error('加载素材集失败:', error)
    // 使用默认数据作为fallback
    assets.value = [
      { id: 1, name: '默认素材集', description: '系统默认素材集' }
    ]
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('scroll', handleScroll)
  loadAssets()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('scroll', handleScroll)
})

// 在loadAssets函数之前添加handleSearch函数
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }

  // 重置状态
  searchResults.value = []
  noMoreData.value = false
  currentPage.value = 1
  
  searching.value = true
  hasSearched.value = true

  try {
    const response = await searchImages({
      key: searchKeyword.value.trim()
    })
    
    console.log('API响应:', response)
    
    if (response?.code === 0 && response?.data) {
      const { count = 0, urls = [] } = response.data
      
      console.log('图片总数:', count, '图片URLs:', urls)
      
      if (!Array.isArray(urls) || urls.length === 0) {
        message.info('未找到相关图片')
        return
      }
      
      totalCount.value = count
      allUrls.value = urls
      
      // 首次加载12张图片（3行，每行4张）
      const firstBatch = urls.slice(0, 12)
      await processImageUrlsWithAddress(firstBatch, searchKeyword.value)
      
      // 检查是否还有更多数据
      if (firstBatch.length >= urls.length) {
        noMoreData.value = true
      }
    } else {
      console.error('API响应错误:', response)
      message.error(response?.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    message.error('搜索失败，请稍后重试')
  } finally {
    searching.value = false
  }
}

// 修改loadMoreImages函数
const loadMoreImages = async () => {
  console.log('loadMoreImages 被调用', {
    loadingMore: loadingMore.value,
    noMoreData: noMoreData.value,
    allUrlsLength: allUrls.value.length,
    searchResultsLength: searchResults.value.length
  })
  
  if (loadingMore.value || noMoreData.value || !allUrls.value.length) {
    console.log('loadMoreImages 被阻止:', {
      loadingMore: loadingMore.value,
      noMoreData: noMoreData.value,
      allUrlsLength: allUrls.value.length
    })
    return
  }
  
  loadingMore.value = true
  console.log('开始加载更多图片...')
  
  try {
    const startIndex = searchResults.value.length
    const endIndex = Math.min(startIndex + 12, allUrls.value.length)
    
    console.log('加载范围:', { startIndex, endIndex, totalUrls: allUrls.value.length })
    
    if (startIndex >= allUrls.value.length) {
      console.log('已到达最后，设置 noMoreData = true')
      noMoreData.value = true
      return
    }
    
    const nextBatch = allUrls.value.slice(startIndex, endIndex)
    console.log('准备加载的图片批次:', nextBatch.length)
    
    await processImageUrlsWithAddress(nextBatch, searchKeyword.value)
    
    console.log('图片批次加载完成，当前总数:', searchResults.value.length)
    
    // 检查是否还有更多数据
    if (endIndex >= allUrls.value.length) {
      console.log('所有图片已加载完成，设置 noMoreData = true')
      noMoreData.value = true
    }
  } catch (error) {
    console.error('加载更多图片失败:', error)
    message.error('加载更多图片失败')
  } finally {
    loadingMore.value = false
    console.log('loadMoreImages 完成，loadingMore 设置为 false')
  }
}

// 保留这些函数定义，但删除上面的重复变量声明

// 关闭图片预览
const openPreview = (image, index) => {
  if (!image || (!image.base64 && !image.url)) {
    message.warning('图片还在加载中，请稍后再试')
    return
  }
  
  currentPreviewIndex.value = index
  currentPreviewImage.value = image
  previewVisible.value = true
}

// 显示上一张图片
const showPrevImage = () => {
  if (searchResults.value.length <= 1) return
  
  currentPreviewIndex.value = currentPreviewIndex.value > 0 
    ? currentPreviewIndex.value - 1 
    : searchResults.value.length - 1
  
  currentPreviewImage.value = searchResults.value[currentPreviewIndex.value]
}

// 显示下一张图片
const showNextImage = () => {
  if (searchResults.value.length <= 1) return
  
  currentPreviewIndex.value = currentPreviewIndex.value < searchResults.value.length - 1 
    ? currentPreviewIndex.value + 1 
    : 0
  
  currentPreviewImage.value = searchResults.value[currentPreviewIndex.value]
}

// 关闭图片预览
const closePreview = () => {
  previewVisible.value = false
  currentPreviewImage.value = null
  currentPreviewIndex.value = -1
}

// 保存图片到素材库
const saveToMaterial = async (image) => {
  if (!image || (!image.base64 && !image.url)) {
    message.warning('图片数据无效')
    return
  }
  
  image.saving = true
  
  try {
    const imageData = {
      url: image.url,
      base64: image.base64,
      keyword: image.keyword,
      name: `搜索图片_${image.keyword}_${Date.now()}`
    }
    
    const response = await saveImageToMaterial(imageData)
    
    if (response?.code === 0) {
      message.success('保存成功')
    } else {
      message.error(response?.message || '保存失败')
    }
  } catch (error) {
    console.error('保存图片失败:', error)
    message.error('保存失败，请稍后重试')
  } finally {
    image.saving = false
  }
}

// 添加当前正在添加的图片变量
const currentAddingImage = ref(null)

// 确认添加到素材集
const confirmAddToAsset = async () => {
  if (!selectedAssetId.value) {
    message.warning('请选择素材集')
    return
  }
  
  addingToAsset.value = true
  
  try {
    // API调用逻辑
    message.success('已添加到素材集')
    assetModalVisible.value = false
    selectedAssetId.value = null
    currentImage.value = null
  } catch (error) {
    console.error('添加到素材集失败:', error)
    message.error('添加到素材集失败')
  } finally {
    addingToAsset.value = false
  }
}

// 取消添加到素材集
const handleCancelAddToAsset = () => {
  assetModalVisible.value = false
  selectedAssetId.value = null
  currentImage.value = null
}


// 添加到素材集的函数
const addToAsset = (image) => {
  currentAddingImage.value = image
  assetModalVisible.value = true
  // 加载素材集列表
  loadAssetOptions()
}

// 加载素材集选项
const loadAssetOptions = async () => {
  loadingAssets.value = true
  try {
    // 这里应该调用实际的API来获取素材集列表
    // const response = await api.getAssetList()
    // assetOptions.value = response.data
    
    // 临时使用模拟数据
    assetOptions.value = [
      { id: 1, name: '默认素材集' },
      { id: 2, name: '我的收藏' }
    ]
  } catch (error) {
    console.error('加载素材集列表失败:', error)
    message.error('加载素材集列表失败')
  } finally {
    loadingAssets.value = false
  }
}
</script>

<style scoped>
.image-search-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn {
  margin-right: 16px;
}

.search-container {
  margin-bottom: 32px;
}

.search-input {
  max-width: 600px;
}

.results-header {
  margin-bottom: 16px;
  color: #666;
  font-size: 14px;
}

.no-results {
  text-align: center;
  padding: 40px 0;
}

.image-grid {
  margin-bottom: 20px;
}

.image-col {
  margin-bottom: 16px;
}

.search-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  transition: all 0.3s ease;
}

.cover-container {
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: 200px;
  border-radius: 4px;
}

.cover-container {
  height: 200px; /* 固定高度 */
  position: relative;
  overflow: hidden;
}

.image-card {
  height: 100%;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.image-actions {
  padding: 8px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.loading-placeholder,
.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  background: #fafafa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cover-container {
    height: 150px;
  }
}

@media (max-width: 576px) {
  .cover-container {
    height: 120px;
  }
}

.cover-image {
  width: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-card:hover .cover-image {
  transform: scale(1.05);
}

.loading-placeholder,
.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.load-more-section {
  text-align: center;
  padding: 20px 0;
}

.load-more-btn {
  min-width: 120px;
}

.no-more-data {
  text-align: center;
  padding: 20px 0;
}

/* 图片预览模态框样式 */
.image-preview-modal :deep(.ant-modal-body) {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 90vw;
}

.image-preview-modal :deep(.ant-modal-content) {
  background-color: transparent;
  box-shadow: none;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-image-wrapper {
  position: relative;
  max-width: 90vw;
  margin: 0 auto;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  transition: all 0.3s ease;
  background-color: #fff;
  padding: 8px;
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
  z-index: 10;
}

.preview-nav:hover {
  color: rgba(255, 255, 255, 1);
  background: rgba(0, 0, 0, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

.preview-actions {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 20px;
  border-radius: 4px;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.preview-loading p {
  margin-top: 16px;
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-search-page {
    padding: 16px;
  }
  
  .search-header h2 {
    font-size: 18px;
  }
  
  .preview-nav {
    font-size: 24px;
    width: 40px;
    height: 40px;
  }
  
  .prev-btn {
    left: 10px;
  }
  
  .next-btn {
    right: 10px;
  }
  
  .preview-actions {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
