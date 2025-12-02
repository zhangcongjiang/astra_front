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
            <div class="cover-row">
              <!-- 左侧：竖版封面（预览/占位 + 按钮居中） -->
              <div class="cover-col">
                <div v-if="verticalCoverDetail" class="cover-section">
                  <div class="cover-preview">
                    <n-image
                      :src="getVerticalCoverUrl()"
                      :preview-src="getVerticalCoverUrl()"
                      object-fit="contain"
                      :style="{ width: '100%', height: '100%' }"
                      :img-props="{ class: 'cover-image', style: 'width: 100%; height: 100%; object-fit: contain; cursor: zoom-in' }"
                    />
                  </div>
                </div>
                <div v-else class="cover-section">
                  <div class="cover-preview">
                    <div class="no-cover">
                      <n-text depth="3">暂无竖版封面</n-text>
                    </div>
                  </div>
                </div>
                <div class="cover-actions-center">
                  <input ref="verticalCoverFileInput" type="file" accept="image/*" @change="onVerticalCoverFileChange" style="display:none" />
                  <n-button size="small" type="primary" @click="triggerVerticalCoverUpload" :loading="verticalCoverUploading" class="action-btn">
                    <template #icon>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 20h14v-2H5v2zm7-9l5 5h-3v4h-4v-4H7l5-5zm0-9l-5 5h3v4h4V7h3l-5-5z"/>
                      </svg>
                    </template>
                    {{ verticalCoverDetail ? '替换竖版封面' : '上传竖版封面' }}
                  </n-button>
                </div>
              </div>
              
              <!-- 右侧：横版封面（预览/占位 + 按钮居中） -->
              <div class="cover-col">
                <div v-if="coverDetail" class="cover-section">
                  <div class="cover-preview">
                    <n-image
                      :src="getCoverUrl()"
                      :preview-src="getCoverUrl()"
                      object-fit="contain"
                      :style="{ width: '100%', height: '100%' }"
                      :img-props="{ class: 'cover-image', style: 'width: 100%; height: 100%; object-fit: contain; cursor: zoom-in' }"
                    />
                  </div>
                </div>
                <div v-else class="cover-section">
                  <div class="cover-preview">
                    <div class="no-cover">
                      <n-text depth="3">暂无横版封面</n-text>
                    </div>
                  </div>
                </div>
                <div class="cover-actions-center">
                  <input ref="coverFileInput" type="file" accept="image/*" @change="onCoverFileChange" style="display:none" />
                  <n-button size="small" type="primary" @click="triggerCoverUpload" :loading="coverUploading" class="action-btn">
                    <template #icon>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 20h14v-2H5v2zm7-9l5 5h-3v4h-4v-4H7l5-5zm0-9l-5 5h3v4h4V7h3l-5-5z"/>
                      </svg>
                    </template>
                    {{ coverDetail ? '替换横版封面' : '上传横版封面' }}
                  </n-button>
                </div>
              </div>
            </div>
            
            <!-- 移除底部统一操作栏 cover-actions-bottom -->
            
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
          v-if="previewKind === 'horizontal' && coverDetail" 
          :src="getCoverUrl()" 
          alt="横版封面预览" 
          class="preview-image"
        />
        <img 
          v-else-if="previewKind === 'vertical' && verticalCoverDetail" 
          :src="getVerticalCoverUrl()" 
          alt="竖版封面预览" 
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
  useMessage, 
  NImage
} from 'naive-ui';
import { getVideoDetail, regenerateVideo, updateVideo, uploadVideoCover, uploadVideoVerticalCover } from '@/api/modules/videoApi.js';
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
const verticalCoverDetail = ref(null);
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

// 获取封面详情（横版）
const loadCoverDetail = async (coverId) => {
  if (!coverId) return;
  try {
    const response = await getImageDetail(coverId);
    if (response && response.data) {
      coverDetail.value = response.data;
    } else if (response) {
      coverDetail.value = response;
    }
  } catch (error) {
    console.error('获取横版封面详情失败:', error);
    if (coverId) {
      coverDetail.value = { img_name: `${coverId}.png`, id: coverId };
    } else {
      coverDetail.value = null;
    }
  }
};
// 获取封面详情（竖版）
const loadVerticalCoverDetail = async (coverId) => {
  if (!coverId) return;
  try {
    const response = await getImageDetail(coverId);
    if (response && response.data) {
      verticalCoverDetail.value = response.data;
    } else if (response) {
      verticalCoverDetail.value = response;
    }
  } catch (error) {
    console.error('获取竖版封面详情失败:', error);
    if (coverId) {
      verticalCoverDetail.value = { img_name: `${coverId}.png`, id: coverId };
    } else {
      verticalCoverDetail.value = null;
    }
  }
};
// 获取封面URL（横版）
const getCoverUrl = () => {
  if (!coverDetail?.value?.img_name) return '';
  return `http://127.0.0.1:8089/media/images/${coverDetail.value.img_name}`;
};
// 获取封面URL（竖版）
const getVerticalCoverUrl = () => {
  if (!verticalCoverDetail?.value?.img_name) return '';
  return `http://127.0.0.1:8089/media/images/${verticalCoverDetail.value.img_name}`;
};
// 显示图片预览（区分横/竖）
const showImagePreview = (kind = 'horizontal') => {
  previewKind.value = kind;
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
      if (videoDetail.value.cover) {
        loadCoverDetail(videoDetail.value.cover).catch(() => {});
      }
      if (videoDetail.value.vertical_cover) {
        loadVerticalCoverDetail(videoDetail.value.vertical_cover).catch(() => {});
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
const verticalCoverUploading = ref(false);
const verticalCoverFileInput = ref(null);

const triggerCoverUpload = () => {
  if (!videoDetail.value?.id) {
    message.error('视频ID缺失');
    return;
  }
  coverFileInput.value?.click();
};
const triggerVerticalCoverUpload = () => {
  if (!videoDetail.value?.id) {
    message.error('视频ID缺失');
    return;
  }
  verticalCoverFileInput.value?.click();
};

const onCoverFileChange = async (e) => {
  const file = e.target?.files?.[0];
  if (!file) return;
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
      message.success('横版封面上传成功');
      e.target.value = '';
      await loadVideoDetail();
      if (videoDetail.value?.cover) {
        await loadCoverDetail(videoDetail.value.cover);
      }
    } else {
      message.error(resp?.message || '横版封面上传失败');
    }
  } catch (err) {
    console.error('横版封面上传失败:', err);
    message.error('横版封面上传失败');
  } finally {
    coverUploading.value = false;
  }
};

const onVerticalCoverFileChange = async (e) => {
  const file = e.target?.files?.[0];
  if (!file) return;
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
  verticalCoverUploading.value = true;
  try {
    const resp = await uploadVideoVerticalCover(videoDetail.value.id, file);
    if (resp?.code === 0) {
      message.success('竖版封面上传成功');
      e.target.value = '';
      await loadVideoDetail();
      if (videoDetail.value?.vertical_cover) {
        await loadVerticalCoverDetail(videoDetail.value.vertical_cover);
      }
    } else {
      message.error(resp?.message || '竖版封面上传失败');
    }
  } catch (err) {
    console.error('竖版封面上传失败:', err);
    message.error('竖版封面上传失败');
  } finally {
    verticalCoverUploading.value = false;
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

.cover-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.cover-col { display: flex; flex-direction: column; align-items: center; }
.cover-actions-bottom { margin-top: 16px; display: flex; align-items: center; gap: 8px; }
/* 覆盖封面展示样式，统一高度并居中 */
.cover-preview {
  height: 360px; /* 统一预览高度 */
  width: 300px;  /* 限制预览宽度，确保按钮可居中对齐 */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* 防止图片超出预览框 */
  /* 移除边框与背景以避免“背景框”视觉效果 */
  border: none;
  background: transparent;
}

.cover-image {
  max-height: 100%;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: none; /* 移除阴影，保持干净视觉 */
}

/* 每列按钮居中并与预览区域宽度对齐 */
.cover-actions-center {
  margin-top: 12px;
  width: 300px; /* 与预览区域保持一致宽度，保证按钮居中位置与封面一致 */
  display: flex;
  justify-content: center;
}

/* 预览模态框：完整展示原图（可滚动查看） */
.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: auto; /* 原图过大时可滚动查看完整内容 */
  max-height: 80vh; /* 限制最大高度，避免模态框溢出屏幕 */
}

.preview-image {
  max-width: none; /* 使用原图宽度 */
  max-height: none; /* 使用原图高度 */
  width: auto;
  height: auto;
  object-fit: contain; /* 保证不裁剪 */
  border-radius: 0;
}
</style>