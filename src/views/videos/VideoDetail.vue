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
      <!-- 基本信息卡片 -->
      <n-card title="基本信息" class="info-card">
        <n-descriptions :column="2" label-placement="left">
          <n-descriptions-item label="标题">
            <n-text strong>{{ videoDetail.title }}</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="创建者">
            <n-tag type="info">{{ videoDetail.creator }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="生成状态">
            <n-tag :type="getStatusType(videoDetail.result)">
              {{ getStatusText(videoDetail.result) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ formatTime(videoDetail.create_time) }}
          </n-descriptions-item>
        </n-descriptions>
        
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

      <!-- 数据详情 - 只显示 parameters -->
      <n-card title="参数详情" class="data-card">
        <pre style="background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto;">{{ formatParametersData }}</pre>
      </n-card>
    </div>

    <div v-else class="error-container">
      <n-result status="404" title="视频不存在" description="未找到对应的视频信息">
        <template #footer>
          <n-button @click="goBack">返回列表</n-button>
        </template>
      </n-result>
    </div>
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
  useMessage 
} from 'naive-ui';
import { getVideoDetail, regenerateVideo } from '@/api/modules/videoApi.js';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const message = useMessage();

const loading = ref(false);
const regenerating = ref(false);
const videoDetail = ref(null);

// 格式化 parameters 数据
const formatParametersData = computed(() => {
  if (!videoDetail.value?.parameters) {
    return '{}';
  }
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

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
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
    if (response.code === 0) {
      videoDetail.value = response.data;
    } else {
      message.error('获取视频详情失败');
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
</style>