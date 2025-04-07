<template>
    <a-layout>
        <a-layout-content class="content-container">
            <!-- 搜索区域 -->
            <div class="search-area">
                <a-form layout="inline" :model="searchForm">
                    <a-form-item label="任务名称">
                        <a-input v-model:value="searchForm.taskName" placeholder="输入任务名称" @pressEnter="handleSearch" />
                    </a-form-item>
                    <a-form-item>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button @click="resetSearch">重置</a-button>
                    </a-form-item>
                </a-form>
            </div>

            <!-- 新增任务按钮 -->
            <div class="add-task-wrapper">
                <a-button type="primary" @click="showAddTaskModal">新增任务</a-button>
            </div>

            <!-- 新增任务模态框 -->
            <!-- 修改 Modal 组件 -->
            <a-modal v-model:open="addTaskModalVisible" title="新增任务" @ok="handleAddTask" @cancel="resetAddTaskForm">
                <a-form :model="addTaskForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                    <a-form-item label="任务名称">
                        <a-input v-model:value="addTaskForm.name" placeholder="请输入任务名称" />
                    </a-form-item>
                    <a-form-item label="初次执行时间">
                        <a-date-picker v-model:value="addTaskForm.firstRunTime" show-time format="YYYY-MM-DD HH:mm:ss" />
                    </a-form-item>
                    <!-- 修改运行周期配置 -->
                    <a-form-item label="运行周期">
                      <a-space>
                        <a-input-number v-model:value="addTaskForm.intervalDay" :min="0" placeholder="天" />天
                        <a-input-number v-model:value="addTaskForm.intervalHour" :min="0" :max="23" placeholder="小时" />时
                        <a-input-number v-model:value="addTaskForm.intervalMinute" :min="0" :max="59" placeholder="分钟" />分
                      </a-space>
                    </a-form-item>
                    <a-form-item label="任务脚本">
                        <a-upload v-model:file-list="addTaskForm.scriptFile" :before-upload="beforeUpload">
                            <a-button>
                                <upload-outlined></upload-outlined>
                                点击上传
                            </a-button>
                        </a-upload>
                    </a-form-item>
                </a-form>
            </a-modal>

            <!-- 任务列表 -->
            <!-- 修改 Table 组件 -->
            <a-table :dataSource="currentPageTasks" :columns="columns" :pagination="false" :loading="loading" rowKey="id">
                <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'index'">
                      {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
                    </template>
                    <template v-if="column.key === 'lastResult'">
                      <a-tag :color="getLastResultColor(record.lastResult)">
                        {{ record.lastResult || '无' }}
                      </a-tag>
                    </template>
                    <template v-if="column.key === 'status'">
                      <a-switch :checked="record.status === '运行中'" checked-children="运行" un-checked-children="暂停"
                        @change="toggleStatus(record)" />
                    </template>
                    <template v-if="column.key === 'action'">
                      <a-button type="link" size="small" @click="showDetail(record)">详情</a-button>
                      <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
                    </template>
                  </template>
            </a-table>

            <!-- 分页 -->
            <div class="pagination-wrapper">
                <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
                    :total="pagination.total" @change="fetchTasks" />
            </div>
        </a-layout-content>
    </a-layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import Pagination from '@/components/Pagination.vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';

// 加载状态
const loading = ref(false);
const router = useRouter();

// 搜索表单
const searchForm = reactive({
    taskName: ''
});

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
});

// 表格列定义
// 修改 columns 定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center'
  },
  {
    title: '任务名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '上次执行结果',
    key: 'lastResult',
    width: 200
  },
  {
    title: '下次启动时间',
    dataIndex: 'nextRunTime',
    key: 'nextRunTime'
  },
  {
    title: '任务周期',
    dataIndex: 'interval',
    key: 'interval',
    customRender: ({ text }) => {
      const [day, hour, minute] = text.split(' ');
      return `${day} ${hour} ${minute}`;
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 120
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center'
  }
];

// 任务数据
const taskData = ref([
    {
        id: 1,
        name: '数据备份',
        nextRunTime: '2023-10-15 10:00:00',
        interval: '0天 0小时 5分钟', // 修改为新的格式
        lastResult: '成功',
        status: '运行中'
    },
    // 更多示例数据...
]);

// 当前页显示的任务
const currentPageTasks = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredTasks.value.slice(start, end);
});

// 过滤后的任务
const filteredTasks = computed(() => {
    const filtered = taskData.value.filter(task => {
        return task.name.toLowerCase().includes(searchForm.taskName.toLowerCase());
    });

    pagination.total = filtered.length;
    return filtered;
});

// 切换任务状态
const toggleStatus = (record) => {
    record.status = record.status === '运行中' ? '暂停' : '运行中';
    // 这里可以添加实际的API调用来更新状态
};

// 查看任务详情
// 修改 showDetail 方法
const showDetail = (record) => {
  router.push(`/tasks/${record.id}`);
};

// 删除任务
const handleDelete = (record) => {
    console.log('删除任务', record);
};

// 处理搜索
const handleSearch = () => {
    pagination.current = 1;
};

// 重置搜索
const resetSearch = () => {
    searchForm.taskName = '';
    handleSearch();
};

// 新增任务相关状态
const addTaskModalVisible = ref(false);
const addTaskForm = reactive({
    name: '',
    firstRunTime: null,
    intervalDay: 0,
    intervalHour: 0,
    intervalMinute: 0,
    scriptFile: []
});

// 显示新增任务模态框
const showAddTaskModal = () => {
    addTaskModalVisible.value = true;
};

// 处理新增任务
const handleAddTask = () => {
    // 这里添加实际的新增任务逻辑
    console.log('新增任务', addTaskForm);
    addTaskModalVisible.value = false;
};

// 重置新增任务表单
const resetAddTaskForm = () => {
    addTaskForm.name = '';
    addTaskForm.firstRunTime = null;
    addTaskForm.interval = '';
    addTaskForm.scriptFile = [];
};

// 文件上传前的处理
const beforeUpload = (file) => {
    // 这里可以添加文件验证逻辑
    return false; // 返回false阻止自动上传
};

// 获取任务列表
const fetchTasks = async () => {
    try {
        loading.value = true;
        // 这里替换为实际的API调用
        // const response = await api.getTasks({
        //   page: pagination.value.current,
        //   pageSize: pagination.value.pageSize,
        //   keyword: searchKeyword.value
        // });
        // taskData.value = response.data;
        // pagination.value.total = response.total;

        // 模拟数据
        pagination.total = taskData.value.length;
    } catch (error) {
        message.error('获取任务列表失败');
        console.error(error);
    } finally {
        loading.value = false;
    }
};

// 初始化
onMounted(() => {
    fetchTasks();
});

// 获取上次执行结果颜色的方法
const getLastResultColor = (result) => {
  const resultMap = {
    '成功': 'green',
    '失败': 'red'
  };
  return resultMap[result] || 'default';
};
</script>

<style scoped>
.content-container {
    padding: 24px;
}

.search-area {
    margin-bottom: 24px;
    padding: 16px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
    margin-top: 24px;
    padding: 16px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.add-task-wrapper {
    margin-bottom: 24px;
    text-align: right;
}
</style>
