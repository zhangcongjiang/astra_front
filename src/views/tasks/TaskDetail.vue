<template>
  <a-page-header
    title="任务详情"
    @back="() => $router.go(-1)"
  >
    <template #extra>
      <a-button type="primary" @click="refresh" :loading="loading">刷新</a-button>
    </template>
  </a-page-header>

  <a-spin :spinning="loading">
    <a-card title="基本信息" style="margin-bottom: 16px">
      <a-descriptions bordered>
        <a-descriptions-item label="任务名称">{{ taskInfo.name }}</a-descriptions-item>
        <a-descriptions-item label="任务类型">
          <a-tag color="blue">{{ getTaskTypeText(taskInfo.job_type) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="任务状态">
          <a-tag :color="taskInfo.is_active ? 'green' : 'red'">
            {{ taskInfo.is_active ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建者">{{ taskInfo.creator_name }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatTime(taskInfo.created_at) }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ formatTime(taskInfo.updated_at) }}</a-descriptions-item>
        <a-descriptions-item label="是否需要参数">
          <a-tag :color="taskInfo.need_args ? 'orange' : 'green'">
            {{ taskInfo.need_args ? '是' : '否' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item v-if="taskInfo.job_type === 'interval'" label="初次执行时间">{{ formatTime(taskInfo.execution_time) }}</a-descriptions-item>
        <a-descriptions-item v-if="taskInfo.job_type === 'interval'" label="执行周期">{{ formatInterval(taskInfo.interval) }}</a-descriptions-item>
        <a-descriptions-item v-if="taskInfo.job_type === 'interval'" label="下次执行时间">{{ formatTime(taskInfo.next_run_time) }}</a-descriptions-item>
        <a-descriptions-item v-if="taskInfo.job_type === 'interval'" label="上次执行时间">{{ formatTime(taskInfo.last_run_time) }}</a-descriptions-item>
        <a-descriptions-item v-if="taskInfo.job_type === 'interval'" label="上次执行状态">
          <a-tag :color="taskInfo.last_run_status === '成功' ? 'green' : 'red'">
            {{ taskInfo.last_run_status || '无' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="任务描述" :span="3">{{ taskInfo.description || '无' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="执行历史" v-if="executionRecords.length > 0">
      <a-timeline>
        <a-timeline-item v-for="record in executionRecords" :key="record.id" :color="getTimelineColor(record.result)">
          <template #dot>
            <a-icon :type="getTimelineIcon(record.result)" />
          </template>
          <a-card :bordered="false">
            <div class="record-header">
              <span class="record-time">{{ formatTime(record.executeTime) }}</span>
              <a-tag :color="getResultColor(record.result)">{{ record.result }}</a-tag>
              <span class="record-duration">耗时: {{ record.duration }}秒</span>
              <span class="record-status">状态: {{ record.status }}</span>
            </div>
            <div v-if="record.result === '失败' && record.errorStack" class="error-detail">
              <a-collapse>
                <a-collapse-panel key="1" header="查看错误详情">
                  <pre>{{ record.errorStack }}</pre>
                </a-collapse-panel>
              </a-collapse>
            </div>
          </a-card>
        </a-timeline-item>
      </a-timeline>
    </a-card>
    
    <a-card v-else-if="!loading" title="执行历史">
      <a-empty description="暂无执行记录" />
    </a-card>
  </a-spin>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { getTaskDetail } from '@/api/modules/taskApi';

const route = useRoute();
const taskId = route.params.id;

const taskInfo = ref({
  id: '',
  name: '',
  description: '',
  job_type: '',
  is_active: false,
  creator_name: '',
  created_at: '',
  updated_at: '',
  need_args: false,
  execution_time: '',
  interval: '',
  next_run_time: '',
  last_run_time: '',
  last_run_status: ''
});

const executionRecords = ref([]);
const loading = ref(false);

const fetchTaskInfo = async () => {
  try {
    loading.value = true;
    const response = await getTaskDetail(taskId);
    
    if (response.code === 0) {
      const data = response.data;
      taskInfo.value = {
        id: data.id,
        name: data.name,
        description: data.description,
        job_type: data.job_type,
        is_active: data.is_active,
        creator_name: data.creator_name,
        created_at: data.created_at,
        updated_at: data.updated_at,
        need_args: data.need_args,
        execution_time: data.execution_time,
        interval: data.interval,
        next_run_time: data.next_run_time,
        last_run_time: data.last_run_time,
        last_run_status: data.last_run_status
      };
      
      // 处理执行历史记录
      if (data.latest_run_result && Array.isArray(data.latest_run_result)) {
        executionRecords.value = data.latest_run_result.map(record => ({
          id: record.id,
          executeTime: record.run_time,
          result: record.is_success ? '成功' : '失败',
          duration: record.duration,
          status: record.status,
          exception: record.exception,
          traceback: record.traceback,
          errorStack: record.traceback || record.exception || ''
        }));
      }
    } else {
      message.error(response.message || '获取任务详情失败');
    }
  } catch (error) {
    console.error('获取任务详情失败:', error);
    message.error('获取任务详情失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 格式化任务类型显示
const getTaskTypeText = (taskType) => {
  const typeMap = {
    'interval': '周期性任务',
    'manual': '手动任务'
  };
  return typeMap[taskType] || taskType;
};

// 格式化时间显示
const formatTime = (timeStr) => {
  if (!timeStr) return '无';
  return new Date(timeStr).toLocaleString('zh-CN');
};

// 格式化间隔时间显示
const formatInterval = (interval) => {
  if (!interval) return '无';
  // interval格式为 "HH:MM:SS"，如 "00:10:00" 表示10分钟
  const parts = interval.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseInt(parts[2]);
  
  let result = [];
  if (hours > 0) result.push(`${hours}小时`);
  if (minutes > 0) result.push(`${minutes}分钟`);
  if (seconds > 0) result.push(`${seconds}秒`);
  
  return result.length > 0 ? result.join('') : '无';
};

const refresh = () => {
  fetchTaskInfo();
};

const getTimelineColor = (result) => {
  return result === '成功' ? 'green' : 'red';
};

const getTimelineIcon = (result) => {
  return result === '成功' ? 'check-circle' : 'close-circle';
};

const getResultColor = (result) => {
  return result === '成功' ? 'green' : 'red';
};

onMounted(() => {
  fetchTaskInfo();
});
</script>

<style scoped>
.record-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.record-time {
  margin-right: 16px;
  font-weight: bold;
}

.record-duration {
  margin-left: 16px;
  color: #888;
}

.error-detail {
  margin-top: 8px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>