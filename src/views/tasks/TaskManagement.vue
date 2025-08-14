<template>
    <a-layout>
        <a-layout-content class="content-container">
            <!-- 搜索区域 -->
            <div class="search-area">
                <a-form layout="inline" :model="searchForm">
                    <a-form-item label="任务名称">
                        <a-input v-model:value="searchForm.taskName" placeholder="输入任务名称" @pressEnter="handleSearch" />
                    </a-form-item>
                    <a-form-item label="任务类型">
                        <a-select v-model:value="searchForm.taskType" placeholder="选择任务类型" style="width: 120px" allowClear>
                            <a-select-option value="">全部</a-select-option>
                            <a-select-option value="interval">周期性任务</a-select-option>
                            <a-select-option value="manual">手动任务</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="启用状态">
                        <a-select v-model:value="searchForm.status" placeholder="选择状态" style="width: 120px" allowClear>
                            <a-select-option value="">全部</a-select-option>
                            <a-select-option value="true">启用</a-select-option>
                            <a-select-option value="false">禁用</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="用户">
                        <UserSelect 
                            v-model:value="searchForm.creator"
                            placeholder="选择用户" 
                            style="width: 120px" 
                            allowClear
                        />
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
            <a-modal v-model:open="addTaskModalVisible" title="新增任务" @ok="handleAddTask" @cancel="resetAddTaskForm" :confirmLoading="submitLoading">
                <a-form :model="addTaskForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }" :rules="formRules" ref="formRef">
                    <a-form-item label="任务名称" name="task_name">
                        <a-input v-model:value="addTaskForm.task_name" placeholder="请输入任务名称" />
                    </a-form-item>
                    <a-form-item label="任务类型" name="task_type">
                        <a-select v-model:value="addTaskForm.task_type" placeholder="请选择任务类型">
                            <a-select-option value="interval">周期性任务</a-select-option>
                            <a-select-option value="manual">手动任务</a-select-option>
                        </a-select>
                    </a-form-item>
                    
                    <!-- 移除定时任务的执行时间表单项 -->
                    
                    <!-- 周期性任务：显示初次执行时间和运行周期 -->
                    <a-form-item v-if="addTaskForm.task_type === 'interval'" label="初次执行时间" name="execution_time">
                        <a-date-picker v-model:value="addTaskForm.execution_time" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
                    </a-form-item>
                    <a-form-item v-if="addTaskForm.task_type === 'interval'" label="运行周期" name="run_cycle">
                        <a-space>
                            <a-input-number v-model:value="addTaskForm.intervalDay" :min="0" placeholder="天" />天
                            <a-input-number v-model:value="addTaskForm.intervalHour" :min="0" :max="23" placeholder="小时" />时
                            <a-input-number v-model:value="addTaskForm.intervalMinute" :min="0" :max="59" placeholder="分钟" />分
                        </a-space>
                    </a-form-item>
                    
                    <!-- 手动任务：显示是否携带参数 -->
                    <a-form-item v-if="addTaskForm.task_type === 'manual'" label="是否携带参数" name="has_params">
                        <a-radio-group v-model:value="addTaskForm.has_params">
                            <a-radio :value="true">是</a-radio>
                            <a-radio :value="false">否</a-radio>
                        </a-radio-group>
                    </a-form-item>
                    
                    <!-- 移除这个参数输入框 -->
                    <!-- <a-form-item v-if="addTaskForm.task_type === 'manual' && addTaskForm.has_params" label="任务参数" name="task_params">
                        <a-textarea v-model:value="addTaskForm.task_params" placeholder="请输入任务参数，多个参数用换行分隔" :rows="3" />
                    </a-form-item> -->
                    
                    <a-form-item label="任务描述">
                        <a-textarea v-model:value="addTaskForm.description" placeholder="请输入任务描述" :rows="3" />
                    </a-form-item>
                    <a-form-item label="任务脚本" name="script_file">
                        <a-upload 
                            v-model:file-list="addTaskForm.scriptFileList" 
                            :before-upload="beforeUpload" 
                            @remove="handleRemoveFile" 
                            accept=".py,.js,.sh,.bat"
                            drag
                            :multiple="false"
                            :max-count="1"
                            class="full-width-upload"
                        >
                            <div class="upload-drag-area">
                                <p class="ant-upload-drag-icon">
                                    <upload-outlined style="font-size: 48px; color: #1890ff;"></upload-outlined>
                                </p>
                                <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
                                <p class="ant-upload-hint">
                                    目前仅支持python3脚本，文件大小不超过10MB
                                </p>
                            </div>
                        </a-upload>
                    </a-form-item>
                </a-form>
            </a-modal>

            <!-- 执行任务参数输入模态框 -->
            <a-modal 
                v-model:open="executeModalVisible" 
                title="执行任务参数" 
                @ok="confirmExecuteTask" 
                @cancel="cancelExecuteTask" 
                :confirmLoading="executeLoading"
            >
                <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                    <a-form-item label="任务名称">
                        <a-input :value="currentExecuteTask?.name" disabled />
                    </a-form-item>
                    <a-form-item label="执行参数" required>
                        <a-textarea 
                            v-model:value="executionArgs" 
                            placeholder="请输入执行参数，多个参数用空格或换行分隔" 
                            :rows="4" 
                        />
                    </a-form-item>
                </a-form>
            </a-modal>

            <!-- 任务列表 -->
            <a-table :columns="columns" :data-source="taskData" :loading="loading" :pagination="false"
                :scroll="{ x: 1000 }" row-key="name">
                <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'index'">
                        {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
                    </template>
                    <template v-if="column.key === 'job_type'">
                        <a-tag :color="getTaskTypeColor(record.job_type)">
                            {{ getTaskTypeText(record.job_type) }}
                        </a-tag>
                    </template>
                    <template v-if="column.key === 'status'">
                        <a-switch :checked="record.is_active" checked-children="启用" un-checked-children="禁用"
                            @change="toggleStatus(record)" :loading="record.statusLoading" />
                    </template>
                    <template v-if="column.key === 'created_at'">
                        {{ formatDateTime(record.created_at) }}
                    </template>
                  
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="showDetail(record)">详情</a-button>
                            <a-button type="link" size="small" @click="editTask(record)">编辑</a-button>
                            <a-button type="link" size="small" @click="handleExecuteTask(record)" :loading="record.executeLoading">
                                执行
                            </a-button>
                            <a-button type="link" size="small" danger @click="handleDelete(record)" :loading="record.deleteLoading">删除</a-button>
                        </a-space>
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
import { message, Modal } from 'ant-design-vue';
import Pagination from '@/components/Pagination.vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';
// 导入UserSelect组件
import UserSelect from '@/components/UserSelect.vue';
import { 
    createTask, 
    getTaskList, 
    deleteTask, 
    updateTaskStatus, 
    excuteTask, 
    enableTask, 
    disableTask,
    getTaskDetail  // 添加这个导入
} from '@/api/modules/taskApi';
import dayjs from 'dayjs';
// 加载状态
const loading = ref(false);
const submitLoading = ref(false);
const router = useRouter();
const formRef = ref();
// 在数据定义部分添加执行相关的状态
// 执行任务相关状态
const executeModalVisible = ref(false);
const executeLoading = ref(false);
const currentExecuteTask = ref(null);
const executionArgs = ref('');
// 搜索表单
const searchForm = reactive({
    taskName: '',
    taskType: '',     // 新增：任务类型
    status: '',       // 新增：启用状态
    creator: undefined // 新增：创建用户
});

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
});

// 表格列定义
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
        key: 'name',
        width: 200
    },
    {
        title: '任务类型',
        dataIndex: 'job_type',
        key: 'job_type',
        width: 100
    },
    {
        title: '任务描述',
        dataIndex: 'description',
        key: 'description',
        align: 'center',
        ellipsis: true
        
    },
    {
        title: '状态',
        key: 'status',
        width: 100,
        align: 'center'
    },
    {
        title: '用户',
        dataIndex: 'creator_name',
        key: 'creator_name',
        width: 120
    },
    {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180
    },
    {
        title: '操作',
        key: 'action',
        width: 240,
        align: 'center',
        fixed: 'right'
    }
];

// 任务数据
const taskData = ref([]);

// 当前页显示的任务
const currentPageTasks = computed(() => {
    return taskData.value;
});

// 新增任务相关状态
const addTaskModalVisible = ref(false);
// 新增任务表单数据

const addTaskForm = reactive({
    task_name: '',
    task_type: '',
    execution_time: null,        // 定时任务的执行时间    // 周期性任务的初次执行时间
    intervalDay: 0,
    intervalHour: 0,
    intervalMinute: 0,
    has_params: false,           // 手动任务是否携带参数
    // 移除 task_params 字段
    description: '',
    scriptFileList: [],
    script_file: null
});

// 表单验证规则
const formRules = {
    task_name: [
        { required: true, message: '请输入任务名称', trigger: 'blur' }
    ],
    task_type: [
        { required: true, message: '请选择任务类型', trigger: 'change' }
    ],
    execution_time: [
        { required: true, message: '请选择初次执行时间', trigger: 'change' }
    ]
};

// 显示新增任务模态框
const showAddTaskModal = () => {
    addTaskModalVisible.value = true;
};

// 处理新增任务
const handleAddTask = async () => {
    try {
        // 表单验证
        await formRef.value.validate();
        
        submitLoading.value = true;
        
        // 构建任务数据
        const taskData = {
            task_name: addTaskForm.task_name,
            task_type: addTaskForm.task_type,
            description: addTaskForm.description,
            script_file: addTaskForm.script_file
        };
        
        // 根据任务类型添加不同的字段
        if (addTaskForm.task_type === 'interval') {
            // 周期性任务 - 修改为使用 interval 字段
            taskData.execution_time = dayjs(addTaskForm.execution_time).format('YYYY-MM-DD HH:mm:ss');
            // 将时间间隔转换为秒数，符合 DurationField 的要求
            const totalSeconds = (addTaskForm.intervalDay * 24 * 60 * 60) + 
                               (addTaskForm.intervalHour * 60 * 60) + 
                               (addTaskForm.intervalMinute * 60);
            taskData.interval = totalSeconds; // 改为 interval 字段，传递秒数
        } else if (addTaskForm.task_type === 'manual') {
            // 手动任务 - 只传递是否需要参数的标识
            taskData.has_params = addTaskForm.has_params;
            // 移除参数值的传递，参数将在执行时输入
        }
        
        // 确保脚本文件存在
        if (!taskData.script_file) {
            message.error('请上传任务脚本文件');
            return;
        }
        
        // 调用API创建任务
        await createTask(taskData);
        
        message.success('任务创建成功');
        addTaskModalVisible.value = false;
        resetAddTaskForm();
        
        // 刷新任务列表
        await fetchTasks();
        
    } catch (error) {
        console.error('创建任务失败:', error);
        if (error.name !== 'ValidateError') {
            message.error('创建任务失败: ' + (error.message || '未知错误'));
        }
    } finally {
        submitLoading.value = false;
    }
};

// 获取任务类型颜色
const getTaskTypeColor = (taskType) => {
    const colorMap = {
        'interval': 'green', 
        'manual': 'orange'
    };
    return colorMap[taskType] || 'default';
};

// 获取任务类型文本
const getTaskTypeText = (taskType) => {
    const textMap = {
        'interval': '周期性任务',
        'manual': '手动任务'
    };
    return textMap[taskType] || taskType;
};

// 重置新增任务表单
const resetAddTaskForm = () => {
    addTaskForm.task_name = '';
    addTaskForm.task_type = '';
    addTaskForm.execution_time = null;
    addTaskForm.intervalDay = 0;
    addTaskForm.intervalHour = 0;
    addTaskForm.intervalMinute = 0;
    addTaskForm.has_params = false;
    addTaskForm.description = '';
    addTaskForm.scriptFileList = [];
    addTaskForm.script_file = null;
    
    // 重置表单验证状态
    if (formRef.value) {
        formRef.value.resetFields();
    }
};

// 获取执行状态颜色
const getStatusColor = (status) => {
    const colorMap = {
        '未执行': 'default',
        '执行中': 'processing',
        '执行成功': 'success',
        '执行失败': 'error'
    };
    return colorMap[status] || 'default';
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

// 切换任务状态
const toggleStatus = async (record) => {
    try {
        record.statusLoading = true;
        
        const newStatus = !record.is_active;
        
        // 使用新的启用/禁用接口
        if (newStatus) {
            await enableTask(record.id);
        } else {
            await disableTask(record.id);
        }
        
        record.is_active = newStatus;
        message.success(newStatus ? '任务启用成功' : '任务禁用成功');
        
    } catch (error) {
        message.error('状态更新失败: ' + (error.message || '未知错误'));
        console.error('状态更新失败:', error);
    } finally {
        record.statusLoading = false;
    }
};


// 添加执行任务相关的方法
// 处理执行任务
const handleExecuteTask = (record) => {
    // 检查任务是否需要参数
    if (record.need_args) {
        // 需要参数，显示参数输入模态框
        currentExecuteTask.value = record;
        executionArgs.value = '';
        executeModalVisible.value = true;
    } else {
        // 不需要参数，直接执行
        executeTask(record, '');
    }
};

// 确认执行任务（带参数）
const confirmExecuteTask = () => {
    if (currentExecuteTask.value) {
        executeTask(currentExecuteTask.value, executionArgs.value);
    }
};

// 取消执行任务
const cancelExecuteTask = () => {
    executeModalVisible.value = false;
    currentExecuteTask.value = null;
    executionArgs.value = '';
};

// 执行任务的核心方法
const executeTask = async (record, args = '') => {
    try {
        // 设置按钮加载状态
        record.executeLoading = true;
        executeLoading.value = true;
        
        const executeData = {
            task_id: record.id,
            execution_args: args
        };
        
        const response = await excuteTask(executeData);
        
        // 关闭模态框
        if (executeModalVisible.value) {
            executeModalVisible.value = false;
            currentExecuteTask.value = null;
            executionArgs.value = '';
        }
        
        // 显示执行结果
        if (response.data.status === 'success') {
            message.success(`任务执行成功！\n输出：${response.data.output || '无输出'}`);
        } else {
            message.error(`任务执行失败！\n错误：${response.data.error || '未知错误'}`);
        }
        
        // 刷新任务列表
        await fetchTasks();
        
    } catch (error) {
        message.error('执行任务失败: ' + (error.message || '未知错误'));
        console.error('执行任务失败:', error);
        
        // 关闭模态框
        if (executeModalVisible.value) {
            executeModalVisible.value = false;
            currentExecuteTask.value = null;
            executionArgs.value = '';
        }
    } finally {
        record.executeLoading = false;
        executeLoading.value = false;
    }
};

// 查看任务详情
const showDetail = (record) => {
    router.push(`/tasks/${record.id}`);
};

// 删除任务
const handleDelete = async (record) => {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除任务 "${record.name}" 吗？此操作不可撤销。`,
        okText: '确定',
        cancelText: '取消',
        okType: 'danger',
        onOk: async () => {
            try {
                record.deleteLoading = true;
                
                await deleteTask(record.id);
                message.success('任务删除成功');
                
                // 刷新任务列表
                await fetchTasks();
                
            } catch (error) {
                message.error('删除任务失败: ' + (error.message || '未知错误'));
                console.error('删除任务失败:', error);
            } finally {
                record.deleteLoading = false;
            }
        },
        onCancel: () => {
            // 取消时重置加载状态
            record.deleteLoading = false;
        }
    });
};

// 处理搜索
const handleSearch = async () => {
    try {
        pagination.current = 1;
        await fetchTasks();
    } catch (error) {
        console.error('搜索失败:', error);
        message.error('搜索失败，请重试');
    }
};

// 重置搜索
const resetSearch = () => {
    searchForm.taskName = '';
    searchForm.taskType = '';
    searchForm.status = '';
    searchForm.creator = undefined;
    handleSearch();
};

// 获取任务列表
const fetchTasks = async () => {
    try {
        loading.value = true;
        
        // 添加防护性检查
        if (!searchForm) {
            console.warn('searchForm is not available');
            return;
        }
        
        const params = {
            page: pagination.current,
            pageSize: pagination.pageSize,
            task_name: searchForm.taskName || undefined,
            job_type: searchForm.taskType || undefined,
            is_active: searchForm.status || undefined,
            creator: searchForm.creator || undefined
        };
        
        // 清理undefined值
        Object.keys(params).forEach(key => {
            if (params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });
        
        const response = await getTaskList(params);
        
        // 确保响应数据存在
        if (response && response.data) {
            taskData.value = response.data.results || [];
            pagination.total = response.data.count || 0;
        } else {
            taskData.value = [];
            pagination.total = 0;
        }
        
    } catch (error) {
        message.error('获取任务列表失败: ' + (error.message || '未知错误'));
        console.error('获取任务列表失败:', error);
        // 确保在错误情况下也有默认值
        taskData.value = [];
        pagination.total = 0;
    } finally {
        loading.value = false;
    }
};

// 获取上次执行结果颜色的方法
const getLastResultColor = (result) => {
    const resultMap = {
        '成功': 'green',
        '失败': 'red',
        'success': 'green',
        'failed': 'red'
    };
    return resultMap[result] || 'default';
};


// 文件上传前的处理
const beforeUpload = (file) => {
    // 验证文件类型
    const allowedTypes = ['.py', '.js', '.sh', '.bat'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
        message.error('目前只支持Python脚本！');
        return false;
    }
    
    // 验证文件大小（10MB）
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
        message.error('文件大小不能超过 10MB！');
        return false;
    }
    
    // 将文件保存到表单数据中
    addTaskForm.script_file = file;
    
    // 返回 false 阻止自动上传
    return false;
};

// 处理文件移除
const handleRemoveFile = (file) => {
    addTaskForm.script_file = null;
    return true;
};

// 初始化
onMounted(() => {
    fetchTasks();
});
</script>

<style scoped>
/* 确保上传组件与其他表单项宽度一致 */
.full-width-upload {
    width: 100%;
}

.full-width-upload .ant-upload.ant-upload-drag {
    width: 100%;
}

.upload-drag-area {
    padding: 20px;
    text-align: center;
    background: #fafafa;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.3s;
    width: 100%;
    box-sizing: border-box;
}

.upload-drag-area:hover {
    border-color: #1890ff;
}

.ant-upload-text {
    margin: 0 0 4px;
    color: rgba(0, 0, 0, 0.85);
    font-size: 16px;
}

.ant-upload-hint {
    margin: 0;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
}

.ant-upload-drag-icon {
    margin-bottom: 16px;
}

/* 拖拽时的样式 */
.ant-upload.ant-upload-drag.ant-upload-drag-hover {
    border-color: #1890ff;
}

.ant-upload.ant-upload-drag.ant-upload-drag-hover .upload-drag-area {
    border-color: #1890ff;
    background: #f0f8ff;
}

/* 确保表单项标签对齐 */
.ant-form-item {
    margin-bottom: 24px;
}

.ant-form-item-label {
    text-align: left;
}

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

.upload-tip {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
}
</style>



