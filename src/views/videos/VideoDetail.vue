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
            <div class="title-with-copy">
              <span>{{ videoDetail.title }}</span>
              <n-button size="small" type="primary" @click="openEditModal" class="action-btn">
                <template #icon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </template>
                编辑
              </n-button>
              <n-button 
                size="small" 
                type="primary" 
                @click="copyToClipboard(videoDetail.title, '标题')"
                class="action-btn"
              >
                <template #icon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </template>
                复制标题
              </n-button>
            </div>
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
          <n-descriptions-item label="视频大小">
            {{ formatBytes(videoDetail.size || videoDetail.file_size) }}
          </n-descriptions-item>
          <n-descriptions-item label="生成耗时">
            {{ formatCost(videoDetail.cost) }}
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
              <div class="cover-actions">
                <input ref="coverFileInput" type="file" accept="image/*" @change="onCoverFileChange" style="display:none" />
                <n-button size="small" type="primary" @click="triggerCoverUpload" :loading="coverUploading" class="action-btn">
                  <template #icon>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 20h14v-2H5v2zm7-9l5 5h-3v4h-4v-4H7l5-5zm0-9l-5 5h3v4h4V7h3l-5-5z"/>
                    </svg>
                  </template>
                  替换封面
                </n-button>
              </div>
            </div>
            <div v-else class="no-cover">
              <n-text depth="3">暂无封面</n-text>
              <div class="cover-actions">
                <input ref="coverFileInput" type="file" accept="image/*" @change="onCoverFileChange" style="display:none" />
                <n-button size="small" type="primary" @click="triggerCoverUpload" :loading="coverUploading" class="action-btn">
                  <template #icon>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 20h14v-2H5v2zm7-9l5 5h-3v4h-4v-4H7l5-5zm0-9l-5 5h3v4h4V7h3l-5-5z"/>
                    </svg>
                  </template>
                  上传封面
                </n-button>
              </div>
            </div>
          </n-tab-pane>
          
          <n-tab-pane name="content" tab="视频文案">
            <div v-if="videoDetail.content" class="content-section">
              <div class="content-header">
                <span class="content-title">视频文案</span>
                <div>
                   <n-button size="small" type="primary" @click="openEditModal" class="action-btn" style="margin-right: 8px;">
                     <template #icon>
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                       </svg>
                     </template>
                     编辑文案
                   </n-button>
                   <n-button 
                     size="small" 
                     type="primary" 
                     @click="copyToClipboard(videoDetail.content, '文案')"
                     class="action-btn"
                   >
                     <template #icon>
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                       </svg>
                     </template>
                     复制文案
                   </n-button>
                 </div>
              </div>
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
  <!-- 新增：编辑标题与文案的模态框 -->
  <n-modal v-model:show="editVisible" preset="card" :mask-closable="false" style="width: 600px;">
    <template #header>
      <span>编辑视频信息</span>
    </template>
    <n-form label-placement="left" label-width="80">
      <n-form-item label="标题">
        <n-input v-model:value="editForm.title" placeholder="请输入标题" maxlength="80" show-count />
      </n-form-item>
      <n-form-item label="文案">
        <n-input type="textarea" v-model:value="editForm.content" placeholder="请输入文案" rows="6" />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="modal-actions">
        <n-button @click="closeEditModal" :disabled="editLoading">取消</n-button>
        <n-button type="primary" @click="handleEditSubmit" :loading="editLoading">保存</n-button>
      </div>
    </template>
  </n-modal>
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
  NForm,
  NFormItem,
  NInput,
  useMessage 
} from 'naive-ui';
import { getVideoDetail, regenerateVideo, updateVideo, uploadVideoCover } from '@/api/modules/videoApi.js';
import { getImageDetail } from '@/api/modules/imageApi.js';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const message = useMessage();

// 复制到剪贴板功能
const copyToClipboard = async (text, type) => {
  if (!text) {
    message.warning(`${type}内容为空，无法复制`);
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    message.success(`${type}已复制到剪贴板`);
  } catch (err) {
    console.error('复制失败:', err);
    // 降级方案：使用传统的复制方法
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success(`${type}已复制到剪贴板`);
    } catch (fallbackErr) {
      console.error('降级复制也失败:', fallbackErr);
      message.error('复制失败，请手动复制');
    }
  }
};

const loading = ref(false);
const regenerating = ref(false);
const videoDetail = ref(null);
const coverDetail = ref(null);
const activeTab = ref('cover');
const imagePreviewVisible = ref(false);
const editVisible = ref(false);
const editLoading = ref(false);
const editForm = ref({ title: '', content: '' });

const openEditModal = () => {
  if (!videoDetail.value) return;
  editForm.value.title = videoDetail.value.title || '';
  editForm.value.content = videoDetail.value.content || '';
  editVisible.value = true;
};
const closeEditModal = () => { editVisible.value = false; };
const handleEditSubmit = async () => {
  if (!videoDetail.value?.id) {
    message.error('视频ID缺失');
    return;
  }
  if (!editForm.value.title || !editForm.value.title.trim()) {
    message.warning('标题不能为空');
    return;
  }
  editLoading.value = true;
  try {
    const resp = await updateVideo(videoDetail.value.id, editForm.value.title.trim(), editForm.value.content || '');
    if (resp?.code === 0) {
      message.success('更新成功');
      // 更新本地详情以反映变更
      videoDetail.value.title = editForm.value.title.trim();
      videoDetail.value.content = editForm.value.content || '';
      editVisible.value = false;
    } else {
      message.error(resp?.message || '更新失败');
    }
  } catch (e) {
    console.error('更新视频失败:', e);
    message.error('更新失败');
  } finally {
    editLoading.value = false;
  }
};

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
// 新增：格式化字节大小（B/KB/MB/GB）
const formatBytes = (bytes) => {
  if (bytes === undefined || bytes === null) return '未知';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes < k) return `${bytes} B`;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
// 新增：格式化耗时（小时/分钟/秒）
const formatCost = (seconds) => {
  if (seconds === undefined || seconds === null) return '未知';
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}小时${m}分${ss}秒`;
  if (m > 0) return `${m}分${ss}秒`;
  return `${ss}秒`;
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
const coverUploading = ref(false);
const coverFileInput = ref(null);
const triggerCoverUpload = () => {
  if (!videoDetail.value?.id) {
    message.error('视频ID缺失');
    return;
  }
  coverFileInput.value?.click();
};
const onCoverFileChange = async (e) => {
  const file = e.target?.files?.[0];
  if (!file) return;
  // 前端快速校验（后端也会校验）
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    message.warning('不支持的文件类型，请上传 JPG/PNG 图片');
    e.target.value = '';
    return;
  }
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    message.warning('文件大小不能超过5MB');
    e.target.value = '';
    return;
  }
  coverUploading.value = true;
  try {
    const resp = await uploadVideoCover(videoDetail.value.id, file);
    if (resp?.code === 0) {
      message.success('封面上传成功');
      e.target.value = '';
      // 重新拉取视频详情，确保拿到最新的 cover id
      await loadVideoDetail();
      // 如果有封面ID，刷新封面详情
      if (videoDetail.value?.cover) {
        await loadCoverDetail(videoDetail.value.cover);
      }
    } else {
      message.error(resp?.message || '封面上传失败');
    }
  } catch (err) {
    console.error('封面上传失败:', err);
    message.error('封面上传失败');
  } finally {
    coverUploading.value = false;
  }
};
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

/* 复制按钮样式 */
.title-with-copy {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-with-copy span {
  flex: 1;
  word-break: break-all;
}

.copy-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.copy-btn:hover {
  opacity: 1;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.content-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.action-btn {
  font-size: 12px;
}
.action-btn .n-button__icon {
  margin-right: 4px;
}
.title-with-copy {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-with-copy span {
  flex: 1;
  word-break: break-all;
}

.cover-actions { margin-top: 12px; display: flex; align-items: center; gap: 8px; }
.title-with-copy span {
  flex: 1;
  word-break: break-all;
}

</style>