<template>
  <div class="video-detail-container">
    <!-- 页面头部 -->
    <div class="detail-header">
      <n-button @click="goBack" type="default" size="medium">
        ← 返回
      </n-button>
      <h2>视频详情</h2>
    </div>

    <div v-if="loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <div v-else-if="videoDetail" class="detail-content">
      <!-- 视频详情卡片 -->
      <n-card title="视频详情" class="info-card">
        <!-- 基本信息 -->
        <n-descriptions :column="2" label-placement="left" class="basic-info">
          <n-descriptions-item label="视频标题">
            {{ videoDetail.title }}
          </n-descriptions-item>
          <n-descriptions-item label="创建者">
            {{ videoDetail.username || videoDetail.creator || '未知用户' }}
          </n-descriptions-item>
          <n-descriptions-item label="视频类型">
            <n-tag type="info">{{ getVideoTypeText(videoDetail.video_type) }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="生成状态">
            <n-tag :type="getStatusType(videoDetail.result)">{{ getStatusText(videoDetail.result) }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ formatTime(videoDetail.create_time) }}
          </n-descriptions-item>
        </n-descriptions>
        
        <!-- Tab切换 -->
        <n-tabs v-model:value="activeTab" type="line" class="detail-tabs">
          <n-tab-pane name="cover" tab="视频封面">
            <div v-if="coverDetail" class="cover-section">
              <div class="cover-preview">
                <img 
                  :src="getCoverUrl()" 
                  alt="视频封面" 
                  class="cover-image" 
                  @click="showImagePreview"
                  style="cursor: pointer;"
                />
              </div>
              <div class="cover-info">
                <p><strong>尺寸:</strong> {{ coverDetail.width }} × {{ coverDetail.height }}</p>
                <p><strong>格式:</strong> {{ coverDetail.spec?.format?.toUpperCase() }}</p>
                <p v-if="coverDetail.tags?.length"><strong>标签:</strong> 
                  <n-tag v-for="tag in coverDetail.tags" :key="tag.id" size="small" style="margin-right: 4px;">{{ tag.tag_name }}</n-tag>
                </p>
              </div>
            </div>
            <div v-else class="no-cover">
              <n-text depth="3">暂无封面</n-text>
            </div>
          </n-tab-pane>
          
          <n-tab-pane name="content" tab="视频文案">
            <div v-if="videoDetail.content" class="content-section">
              <div class="content-container">
                <pre>{{ videoDetail.content }}</pre>
              </div>
            </div>
            <div v-else class="no-content">
              <n-text depth="3">暂无文案</n-text>
            </div>
          </n-tab-pane>
          
          <n-tab-pane name="parameters" tab="生成参数">
            <div v-if="formattedParameters" class="parameters-section">
              <pre>{{ formattedParameters }}</pre>
            </div>
            <div v-else class="no-parameters">
              <n-text depth="3">暂无参数</n-text>
            </div>
          </n-tab-pane>
        </n-tabs>
        
        <div class="action-buttons">
          <n-button 
            type="warning" 
            @click="handleRegenerate"
            :loading="regenerating"
          >
            重新生成
          </n-button>
        </div>
      </n-card>
    </div>

    <div v-else class="error-container">
      <n-result status="404" title="视频不存在" description="未找到对应的视频信息">
        <template #footer>
          <n-button @click="goBack">返回列表</n-button>
        </template>
      </n-result>
    </div>
    
    <!-- 图片预览模态框 -->
    <n-modal v-model:show="imagePreviewVisible" preset="card" style="width: 90%; max-width: 1200px;">
      <template #header>
        <span>封面预览</span>
      </template>
      <div class="image-preview-container">
        <img 
          v-if="coverDetail" 
          :src="getCoverUrl()" 
          alt="封面预览" 
          class="preview-image"
        />
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  NCard, 
  NButton, 
  NDescriptions, 
  NDescriptionsItem, 
  NTag, 
  NText, 
  NSpin, 
  NResult,
  NTabs,
  NTabPane,
  NModal,
  useMessage 
} from 'naive-ui';
import { getVideoDetail, regenerateVideo } from '@/api/modules/videoApi.js';
import { getImageDetail } from '@/api/modules/imageApi.js';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const message = useMessage();

const loading = ref(false);
const regenerating = ref(false);
const videoDetail = ref(null);
const coverDetail = ref(null);
const activeTab = ref('cover');
const imagePreviewVisible = ref(false);

// 格式化 parameters 数据
const formattedParameters = computed(() => {
  if (!videoDetail.value?.parameters) return null;
  return JSON.stringify(videoDetail.value.parameters, null, 2);
});

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    'Success': 'success',
    'Fail': 'error',
    'Process': 'warning'
  };
  return statusMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'Success': '生成成功',
    'Fail': '生成失败',
    'Process': '生成中'
  };
  return statusMap[status] || status;
};

// 获取视频类型文本
const getVideoTypeText = (type) => {
  const typeMap = {
    'JianYing': '剪映视频',
    'Regular': '普通视频'
  };
  return typeMap[type] || type || '未知类型';
};

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

// 获取封面详情
const loadCoverDetail = async (coverId) => {
  if (!coverId) return;
  try {
    const response = await getImageDetail(coverId);
    console.log('封面详情响应:', response);
    if (response && response.data) {
      coverDetail.value = response.data;
    } else if (response) {
      // 如果response存在但没有data字段，直接使用response
      coverDetail.value = response;
    }
  } catch (error) {
    console.error('获取封面详情失败:', error);
    // API调用失败时，使用coverId作为img_name创建基本的封面信息
    if (coverId) {
      coverDetail.value = {
        img_name: `${coverId}.png`,
        id: coverId
      };
    } else {
      coverDetail.value = null;
    }
  }
};

// 获取封面URL
const getCoverUrl = () => {
  if (!coverDetail.value?.img_name) return '';
  return `http://127.0.0.1:8089/media/images/${coverDetail.value.img_name}`;
};

// 显示图片预览
const showImagePreview = () => {
  imagePreviewVisible.value = true;
};

// 返回上一页
const goBack = () => {
  router.go(-1);
};

// 重新生成视频
const handleRegenerate = async () => {
  try {
    regenerating.value = true;
    const response = await regenerateVideo(videoDetail.value.id);
    if (response.code === 0) {
      message.success('重新生成请求已提交');
      // 刷新详情数据
      await loadVideoDetail();
    } else {
      message.error('重新生成失败');
    }
  } catch (error) {
    message.error('重新生成失败');
    console.error('重新生成失败:', error);
  } finally {
    regenerating.value = false;
  }
};

// 加载视频详情
const loadVideoDetail = async () => {
  try {
    loading.value = true;
    const response = await getVideoDetail(route.params.id);
    if (response && response.code === 0) {
      videoDetail.value = response.data;
      // 如果有封面ID，尝试获取封面详情（不阻塞主流程）
      if (videoDetail.value.cover) {
        loadCoverDetail(videoDetail.value.cover).catch(() => {
          // 封面加载失败不影响主流程
          console.warn('封面加载失败，但不影响页面显示');
        });
      }
    } else {
      message.error(response?.message || '获取视频详情失败');
    }
  } catch (error) {
    message.error('获取视频详情失败');
    console.error('获取视频详情失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadVideoDetail();
});
</script>

<style scoped>
.video-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-header h2 {
  margin: 0;
  color: #333;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.action-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.data-card {
  margin-bottom: 20px;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.basic-info {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-tabs {
  margin-top: 20px;
}

.cover-section {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.cover-preview {
  flex-shrink: 0;
}

.cover-image {
  max-width: 300px;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

.cover-info {
  flex: 1;
  padding: 10px 0;
}

.cover-info p {
  margin: 8px 0;
  color: #666;
}

.content-section,
.parameters-section {
  padding: 10px 0;
}

.content-container {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  max-height: 400px;
  overflow-y: auto;
}

.content-container pre,
.parameters-section pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  line-height: 1.5;
}

.parameters-section pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  max-height: 400px;
  overflow-y: auto;
}

.no-cover,
.no-content,
.no-parameters {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}
</style>