<template>
  <div class="resource-selector-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h3>素材选择器</h3>
      <div class="multi-select-tip">
        <span class="tip-text">💡 按住 Ctrl/Cmd 键可多选同类型素材</span>
        <div v-if="selectedItems.length > 0" class="selected-info">
          <span class="selected-count">
            已选择 {{ selectedItems.length }} 个{{ selectedItems[0]?.type === 'image' ? '图片' : selectedItems[0]?.type === 'video' ? '视频' : selectedItems[0]?.type === 'audio' ? '音频' : '文本' }}素材
          </span>
          <a-button size="small" type="link" @click="clearSelection">清空选择</a-button>
        </div>
      </div>
    </div>

    <!-- 素材集选择器 -->
    <div class="asset-collection-selector">
      <a-form layout="vertical">
        <a-form-item label="选择素材集">
          <a-select
            v-model:value="selectedCollectionId"
            placeholder="请选择素材集"
            show-search
            :filter-option="filterCollectionOption"
            @change="onCollectionChange"
            :loading="collectionsLoading"
          >
            <a-select-option v-for="collection in assetCollections" :key="collection.id" :value="collection.id">
              {{ collection.set_name }} ({{ collection.asset_count || 0 }} 个素材)
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </div>

    <!-- 素材展示区域 -->
    <div class="asset-content">
      <a-spin :spinning="loading">
        <div v-if="selectedCollectionId" class="categorized-content">
          <!-- 图片分类 -->
          <div class="category-section" v-if="imageItems.length > 0">
            <div class="category-header">
              <h4><FileImageOutlined /> 图片素材 ({{ imageItems.length }})</h4>
            </div>
            <div class="items-grid">
              <a-row :gutter="[8, 8]">
                <a-col 
                  v-for="item in imageItems" 
                  :key="item.id"
                  :xs="24" :sm="12" :md="12" :lg="12" :xl="12"
                >
                  <a-card 
                    hoverable
                    class="item-card"
                    :class="{ 'selected': isSelected(item) }"
                    @click="(event) => toggleSelection(item, event)"
                    draggable="true"
                    @dragstart="handleDragStart(item)"
                    @dragend="handleDragEnd"
                  >
                    <template #cover>
                      <div class="item-cover">
                        <img 
                          :src="getResourceUrl(item)" 
                          :alt="item.name"
                          class="cover-image"
                        />
                        <div class="overlay">
                          <a-button type="primary" size="small" @click.stop="previewResource(item)">预览</a-button>
                        </div>
                      </div>
                    </template>
                    
                    <a-card-meta :title="item.name" />
                  </a-card>
                </a-col>
              </a-row>
            </div>
          </div>

          <!-- 视频分类 -->
          <div class="category-section" v-if="videoItems.length > 0">
            <div class="category-header">
              <h4><VideoCameraOutlined /> 视频素材 ({{ videoItems.length }})</h4>
            </div>
            <div class="items-grid">
              <a-row :gutter="[8, 8]">
                <a-col 
                  v-for="item in videoItems" 
                  :key="item.id"
                  :xs="24" :sm="12" :md="12" :lg="12" :xl="12"
                >
                  <a-card 
                    hoverable
                    class="item-card"
                    :class="{ 'selected': isSelected(item) }"
                    @click="(event) => toggleSelection(item, event)"
                    draggable="true"
                    @dragstart="handleDragStart(item)"
                    @dragend="handleDragEnd"
                  >
                    <template #cover>
                      <div class="item-cover">
                        <div class="video-cover">
                          <video :src="getResourceUrl(item)" class="cover-video" />
                          <div class="play-overlay">
                            <PlayCircleOutlined :style="{ fontSize: '24px', color: '#fff' }" />
                          </div>
                        </div>
                      </div>
                    </template>
                    
                    <a-card-meta :title="item.name" />
                  </a-card>
                </a-col>
              </a-row>
            </div>
          </div>

          <!-- 音频分类 -->
          <div class="category-section" v-if="audioItems.length > 0">
            <div class="category-header">
              <h4><SoundOutlined /> 音频素材 ({{ audioItems.length }})</h4>
            </div>
            <div class="items-grid">
              <a-row :gutter="[8, 8]">
                <a-col 
                  v-for="item in audioItems" 
                  :key="item.id"
                  :xs="24" :sm="12" :md="12" :lg="12" :xl="12"
                >
                  <a-card 
                    hoverable
                    class="item-card"
                    :class="{ 'selected': isSelected(item) }"
                    @click="(event) => toggleSelection(item, event)"
                    draggable="true"
                    @dragstart="handleDragStart(item)"
                    @dragend="handleDragEnd"
                  >
                    <template #cover>
                      <div class="item-cover">
                        <div class="audio-cover">
                          <SoundOutlined :style="{ fontSize: '36px', color: '#1890ff' }" />
                        </div>
                      </div>
                    </template>
                    
                    <a-card-meta :title="item.name" />
                  </a-card>
                </a-col>
              </a-row>
            </div>
          </div>

          <!-- 文本文案分类 -->
          <div class="category-section" v-if="textItems.length > 0">
            <div class="category-header">
              <h4><FileTextOutlined /> 文本文案 ({{ textItems.length }})</h4>
            </div>
            <div class="text-items-container">
              <div 
                v-for="item in textItems" 
                :key="item.id"
                class="text-item-card"
                :class="{ 'selected': isSelected(item) }"
                @click="(event) => toggleSelection(item, event)"
                draggable="true"
                @dragstart="handleDragStart(item)"
                @dragend="handleDragEnd"
              >
                <div class="text-item-header">
                  <h5>{{ item.name }}</h5>
                </div>
                <div class="text-content">
                  <div v-if="item.text && item.text.length > 0">
                    <div v-for="(paragraph, index) in item.text.slice(0, 2)" :key="index" class="paragraph-item">
                      <p>{{ paragraph.length > 50 ? paragraph.substring(0, 50) + '...' : paragraph }}</p>
                    </div>
                    <div v-if="item.text.length > 2" class="more-text">
                      ...还有 {{ item.text.length - 2 }} 段
                    </div>
                  </div>
                  <div v-else class="empty-text">
                    <a-empty description="暂无段落内容" size="small" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!hasAnyItems" class="empty-state">
            <a-empty description="该素材集暂无素材" />
          </div>
        </div>

        <!-- 未选择素材集的提示 -->
        <div v-else class="no-collection-selected">
          <a-empty description="请先选择一个素材集" />
        </div>
      </a-spin>
    </div>

    <!-- 预览模态框 -->
    <a-modal 
      :visible="previewVisible" 
      :title="previewItem?.name" 
      :footer="null" 
      @cancel="previewVisible = false"
      :z-index="1001"
    >
      <img v-if="previewItem?.type === 'image'" :src="getResourceUrl(previewItem)" style="width: 100%" />
      <video v-if="previewItem?.type === 'video'" :src="getResourceUrl(previewItem)" controls autoplay style="width: 100%"></video>
      <audio v-if="previewItem?.type === 'audio'" :src="getResourceUrl(previewItem)" controls autoplay></audio>
      <div v-if="previewItem?.type === 'text'" class="text-preview">
        <div v-for="(paragraph, index) in previewItem.text" :key="index" class="paragraph-preview">
          <p>{{ paragraph }}</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  SoundOutlined, 
  FileImageOutlined, 
  VideoCameraOutlined, 
  FileTextOutlined,
  PlayCircleOutlined 
} from '@ant-design/icons-vue';
// 导入素材集相关API
import { getAssetCollectionList, getAssetCollectionDetail } from '@/api/modules/assetApi';

const props = defineProps({
  selectedValue: {
    type: [Object, Array],
    default: null,
  }
});

const emit = defineEmits(['select', 'drag-start', 'drag-end']);

const loading = ref(false);
const collectionsLoading = ref(false);
const selectedItems = ref([]);

// 素材集相关数据
const assetCollections = ref([]);
const selectedCollectionId = ref(null);
const assetItems = ref([]);
const textItems = ref([]);

// 预览模态框状态
const previewVisible = ref(false);
const previewItem = ref(null);

// 计算属性 - 按类型分类的素材
const imageItems = computed(() => {
  return assetItems.value.filter(item => item.type === 'image');
});

const videoItems = computed(() => {
  return assetItems.value.filter(item => item.type === 'video');
});

const audioItems = computed(() => {
  return assetItems.value.filter(item => item.type === 'audio');
});

const hasAnyItems = computed(() => {
  return imageItems.value.length > 0 || 
         videoItems.value.length > 0 || 
         audioItems.value.length > 0 || 
         textItems.value.length > 0;
});

// 获取素材集列表
const fetchAssetCollections = async () => {
  collectionsLoading.value = true;
  try {
    const response = await getAssetCollectionList({ pageSize: 100 });
    // 适配API响应格式：使用response.data.results
    if (response && response.code === 0 && response.data && response.data.results) {
      assetCollections.value = response.data.results;
    } else {
      message.error(response?.message || '获取素材集列表失败');
      assetCollections.value = [];
    }
  } catch (error) {
    console.error('获取素材集列表失败:', error);
    message.error('获取素材集列表失败');
    assetCollections.value = [];
  } finally {
    collectionsLoading.value = false;
  }
};

// 获取素材集中的素材
const fetchCollectionItems = async (collectionId) => {
  if (!collectionId) return;
  
  loading.value = true;
  try {
    const response = await getAssetCollectionDetail(collectionId, { pageSize: 1000 });
    // 适配API响应格式：使用response.data
    if (response && response.code === 0 && response.data) {
      const data = response.data;
      
      // 处理图片素材
      const images = (data.images || []).map(item => ({
        id: item.id,
        type: 'image',
        name: item.resource_detail?.name || '未知图片',
        resource_id: item.resource_id,
        index: item.index,
        width: item.resource_detail?.width,
        height: item.resource_detail?.height,
        format: item.resource_detail?.format,
        create_time: item.resource_detail?.create_time,
        // 用于URL构建的字段
        img_name: item.resource_detail?.name,
        img_path: `/media/image/` // 根据实际路径调整
      }));
      
      // 处理视频素材
      const videos = (data.videos || []).map(item => ({
        id: item.id,
        type: 'video',
        name: item.resource_detail?.name || '未知视频',
        resource_id: item.resource_id,
        index: item.index,
        duration: item.resource_detail?.duration,
        size: item.resource_detail?.size,
        format: item.resource_detail?.format,
        create_time: item.resource_detail?.create_time,
        // 用于URL构建的字段
        video_name: item.resource_detail?.name,
        video_path: `/media/video/` // 根据实际路径调整
      }));
      
      // 处理音频素材
      const sounds = (data.sounds || []).map(item => ({
        id: item.id,
        type: 'audio',
        name: item.resource_detail?.name || '未知音频',
        resource_id: item.resource_id,
        index: item.index,
        singer: item.resource_detail?.singer,
        duration: item.resource_detail?.duration,
        size: item.resource_detail?.size,
        format: item.resource_detail?.format,
        create_time: item.resource_detail?.create_time,
        // 用于URL构建的字段
        sound_name: item.resource_detail?.name,
        sound_path: `/media/sound/` // 根据实际路径调整
      }));
      
      // 处理文本素材
      const texts = (data.texts || []).map(item => ({
        id: item.id,
        type: 'text',
        name: `文本素材 ${item.index}`,
        resource_id: item.resource_id,
        index: item.index,
        text: item.resource_detail?.text ? [item.resource_detail.text] : [''],
        creator: item.resource_detail?.creator,
        create_time: item.resource_detail?.create_time
      }));
      
      // 合并所有素材
      assetItems.value = [...images, ...videos, ...sounds];
      textItems.value = texts;
    } else {
      message.error(response?.message || '获取素材列表失败');
      assetItems.value = [];
      textItems.value = [];
    }
  } catch (error) {
    console.error('获取素材列表失败:', error);
    message.error('获取素材列表失败');
    assetItems.value = [];
    textItems.value = [];
  } finally {
    loading.value = false;
  }
};

// 素材集选择变化
const onCollectionChange = (collectionId) => {
  selectedCollectionId.value = collectionId;
  selectedItems.value = []; // 清空已选择的素材
  fetchCollectionItems(collectionId);
};

// 素材集搜索过滤
const filterCollectionOption = (input, option) => {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 初始化选择状态
const initializeSelection = () => {
  if (Array.isArray(props.selectedValue)) {
    selectedItems.value = props.selectedValue.filter(item => item && item.id);
  } else if (props.selectedValue && props.selectedValue.id) {
    selectedItems.value = [props.selectedValue];
  } else {
    selectedItems.value = [];
  }
};

// 组件挂载时初始化
onMounted(() => {
  fetchAssetCollections();
  initializeSelection();
});

// 监听selectedValue变化
watch(() => props.selectedValue, () => {
  initializeSelection();
}, { deep: true });

const getResourceUrl = (item) => {
  if (!item) return '';

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089';
  const staticBaseUrl = baseUrl.replace('/api', '');
  
  // 处理文本类型
  if (item.type === 'text') {
    return ''; // 文本不需要URL
  }
  
  const type = item.type;
  
  // 根据新的数据结构构建URL
  if (type === 'image') {
    const fileName = item.img_name || item.name;
    if (fileName) {
      return `${staticBaseUrl}/media/images/${fileName}`;
    }
  } else if (type === 'video') {
    const fileName = item.video_name || item.name;
    if (fileName) {
      return `${staticBaseUrl}/media/video/${fileName}`;
    }
  } else if (type === 'audio') {
    const fileName = item.sound_name || item.name;
    if (fileName) {
      return `${staticBaseUrl}/media/sound/${fileName}`;
    }
  }
  
  return 'https://via.placeholder.com/150';
};

const isSelected = (item) => {
  return selectedItems.value.some(selected => selected.id === item.id);
};

// 检查是否可以多选（同类型素材）
const canMultiSelect = (item) => {
  if (selectedItems.value.length === 0) return true;
  
  // 检查是否为同类型素材
  const firstSelectedType = selectedItems.value[0].type;
  return item.type === firstSelectedType;
};

const toggleSelection = (item, event) => {
  // 检测是否按住了 Ctrl 或 Command 键
  const isCtrlOrCmd = event?.ctrlKey || event?.metaKey;
  
  const index = selectedItems.value.findIndex(selected => selected.id === item.id);
  
  if (isCtrlOrCmd) {
    // 按住 Ctrl/Cmd 键的多选逻辑
    if (index > -1) {
      // 取消选择
      selectedItems.value.splice(index, 1);
    } else {
      // 检查是否可以多选（同类型）
      if (canMultiSelect(item)) {
        selectedItems.value.push(item);
      } else {
        message.warning('不能同时选择不同类型的素材');
        return;
      }
    }
  } else {
    // 不按住 Ctrl/Cmd 键，单选逻辑
    if (index > -1) {
      // 如果已选中，则取消选择
      selectedItems.value = [];
    } else {
      // 选择当前项，清空其他选择
      selectedItems.value = [item];
    }
  }
  
  // 发出选择事件
  emit('select', selectedItems.value.length === 1 ? selectedItems.value[0] : selectedItems.value);
};

const previewResource = (item) => {
  if (!item || !item.id) return;
  previewItem.value = item;
  previewVisible.value = true;
};

// 拖拽相关方法
const handleDragStart = (item) => {
  // 如果拖拽的素材没有被选中，则只拖拽当前素材
  if (!isSelected(item)) {
    emit('drag-start', item);
  } else {
    // 如果拖拽的素材已被选中，则拖拽所有选中的素材
    if (selectedItems.value.length > 1) {
      emit('drag-start', selectedItems.value);
    } else {
      emit('drag-start', item);
    }
  }
};

const handleDragEnd = () => {
  // 通过父组件传递拖拽结束事件
  emit('drag-end');
};

// 清空选择
const clearSelection = () => {
  selectedItems.value = [];
  emit('select', []);
};
</script>

<style scoped>
.resource-selector-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 420px;
  max-width: 450px;
  max-height: calc(100vh - 100px);
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #262626;
}

.multi-select-tip {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tip-text {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.selected-count {
  font-size: 12px;
  color: #1890ff;
  font-weight: 500;
}

.selected-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.asset-collection-selector {
  margin-bottom: 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 0;
  flex-shrink: 0;
}

.asset-content {
  background: white;
  border-radius: 0;
  padding: 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.categorized-content {
  padding: 16px;
  box-sizing: border-box;
}

/* 自定义滚动条样式 */
.asset-content::-webkit-scrollbar {
  width: 6px;
}

.asset-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.asset-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.asset-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.no-collection-selected {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
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
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  height: 100%;
}

.item-card:hover {
  border-color: #d9d9d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.item-card.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  position: relative;
}

.item-card.selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
}

.item-cover {
  position: relative;
  height: 120px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: #000;
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
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-cover {
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.item-card:hover .overlay {
  opacity: 1;
}

/* 拖拽相关样式 */
.item-card[draggable="true"] {
  cursor: grab;
}

.item-card[draggable="true"]:active {
  cursor: grabbing;
}

.text-item-card[draggable="true"] {
  cursor: grab;
}

.text-item-card[draggable="true"]:active {
  cursor: grabbing;
}

/* 文本文案样式 */
.text-items-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.text-item-card {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.text-item-card:hover {
  border-color: #40a9ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.text-item-card.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  background: #f6ffed;
  position: relative;
}

.text-item-card.selected::after {
  content: '✓';
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
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
  font-size: 16px;
}

.text-content {
  color: #666;
  line-height: 1.6;
}

.paragraph-item {
  margin-bottom: 8px;
}

.paragraph-item p {
  margin: 0;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
}

.more-text {
  color: #8c8c8c;
  font-style: italic;
  text-align: center;
  padding: 8px;
}

.empty-text {
  text-align: center;
  padding: 20px;
}

.empty-category {
  text-align: center;
  padding: 40px 20px;
  color: #8c8c8c;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8c8c8c;
}

/* 预览样式 */
.text-preview {
  max-height: 400px;
  overflow-y: auto;
}

.paragraph-preview {
  margin-bottom: 12px;
}

.paragraph-preview p {
  margin: 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  line-height: 1.6;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .categorized-content {
    max-height: 60vh;
  }
  
  .item-cover {
    height: 100px;
  }
  
  .category-header h3 {
    font-size: 16px;
  }
}
</style>
