import { request } from "@/api/config/request";
import formatParams from "@/utils/formatParams";

// 创建任务（支持文件上传）
export const createTask = async (taskData) => {
    try {
        const formData = new FormData();
        
        // 添加基本任务信息 - 使用后端要求的字段名
        formData.append('name', taskData.task_name);
        formData.append('job_type', taskData.task_type);
        formData.append('description', taskData.description || '');
        
        // 根据任务类型添加不同的字段
        if (taskData.execution_time) {
            formData.append('execution_time', taskData.execution_time);
        }
        if (taskData.first_run_time) {
            formData.append('first_run_time', taskData.first_run_time);
        }
        // 修改：使用 interval 替代 run_cycle
        if (taskData.interval !== undefined) {
            formData.append('interval', taskData.interval);
        }
        
        // 手动任务的参数
        if (taskData.has_params !== undefined) {
            formData.append('need_args', taskData.has_params);
        }
        if (taskData.task_params) {
            formData.append('task_params', taskData.task_params);
        }
        
        // 如果有文件，添加到 FormData
        if (taskData.script_file) {
            formData.append('script_file', taskData.script_file);
        }
        
        // 使用 upload 方法发送请求
        const response = await request.upload("/task/", formData);
        return response;
    } catch (error) {
        console.error(`创建任务失败:`, error);
        throw error;
    }
};


// 获取任务列表
export const getTaskList = async (params) => {
    try {
        const response = await request.get("/task/", formatParams(params));
        return response;
    } catch (error) {
        console.error(`获取任务列表失败:`, error);
        throw error;
    }
};

// 删除任务
export const deleteTask = async (taskId) => {
    try {
        const response = await request.post(`/task/${taskId}/delete_task/`);
        return response;
    } catch (error) {
        console.error(`删除任务失败:`, error);
        throw error;
    }
};

// 更新任务状态
export const updateTaskStatus = async (taskId, status) => {
    try {
        const response = await request.post(`/task/${taskId}/update_task/`, { status });
        return response;
    } catch (error) {
        console.error(`更新任务状态失败:`, error);
        throw error;
    }
};

export const excuteTask = async (data) => {
    try {
        const response = await request.post(`/task/execute_manual/`,data);
        return response;
    } catch (error) {
        console.error(`执行任务出错:`, error);
        throw error;
    }
};


