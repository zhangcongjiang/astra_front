<template>
  <a-page-header
    title="任务详情"
    @back="() => $router.go(-1)"
  >
    <template #extra>
      <a-button type="primary" @click="refresh">刷新</a-button>
    </template>
  </a-page-header>

  <a-card title="基本信息" style="margin-bottom: 16px">
    <a-descriptions bordered>
      <a-descriptions-item label="任务名称">{{ taskInfo.name }}</a-descriptions-item>
      <a-descriptions-item label="任务状态">
        <a-tag :color="taskInfo.status === '运行中' ? 'green' : 'orange'">
          {{ taskInfo.status }}
        </a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="下次执行时间">{{ taskInfo.nextRunTime || '无' }}</a-descriptions-item>
      <a-descriptions-item label="执行周期">{{ taskInfo.interval }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ taskInfo.createdAt }}</a-descriptions-item>
    </a-descriptions>
  </a-card>

  <a-card title="执行历史">
    <a-timeline>
      <a-timeline-item v-for="(record, index) in executionRecords" :key="index" :color="getTimelineColor(record.result)">
        <template #dot>
          <a-icon :type="getTimelineIcon(record.result)" />
        </template>
        <a-card :bordered="false">
          <div class="record-header">
            <span class="record-time">{{ record.executeTime }}</span>
            <a-tag :color="getResultColor(record.result)">{{ record.result }}</a-tag>
            <span class="record-duration">耗时: {{ record.duration }}秒</span>
          </div>
          <div v-if="record.result === '失败'" class="error-detail">
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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';

const route = useRoute();
const taskId = route.params.id;

const taskInfo = ref({
  id: taskId,
  name: '数据备份任务',
  status: '运行中',
  nextRunTime: '2023-10-20 10:00:00',
  interval: '每天 1次',
  createdAt: '2023-10-01 14:30:00'
});

const executionRecords = ref([]);

const fetchTaskInfo = async () => {
  try {
    // 模拟API请求
    taskInfo.value = {
      id: taskId,
      name: '数据备份任务',
      status: '运行中',
      nextRunTime: '2023-10-20 10:00:00',
      interval: '每天 1次',
      createdAt: '2023-10-01 14:30:00'
    };
  } catch (error) {
    message.error('获取任务信息失败');
  }
};

const fetchExecutionRecords = async () => {
  try {
    // 模拟API请求，获取最近7天记录
    executionRecords.value = [
      {
        executeTime: '2023-10-19 10:00:05',
        result: '成功',
        duration: 12,
        errorStack: ''
      },
      {
        executeTime: '2023-10-18 10:00:03',
        result: '成功',
        duration: 15,
        errorStack: ''
      },
      {
        executeTime: '2023-10-17 10:00:01',
        result: '失败',
        duration: 3,
        errorStack: 'Error: Connection timeout\n    at connect (server.js:45:15)\n    at processTask (server.js:78:9)'
      },
      // 更多记录...
    ];
  } catch (error) {
    message.error('获取执行记录失败');
  }
};

const refresh = () => {
  fetchTaskInfo();
  fetchExecutionRecords();
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
  fetchExecutionRecords();
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