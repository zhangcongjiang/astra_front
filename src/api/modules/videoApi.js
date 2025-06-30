/**
 * @file videoApi.js
 * @description 负责与视频生成相关的后端API进行交互。
 */

// 假设这是您项目中的请求工具实例
// 它应该已经封装好了baseURL, headers, 错误处理等
import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

/**
 * 上传文件到服务器。
 * @param {FormData} data - 包含文件的表单数据。
 * @returns {Promise<object>} - 返回包含文件URL的对象，例如 { url: '...' }。
 */
export const uploadFile = async (data) => {
    try {
        // 调用封装好的上传方法，注意路径和参数匹配您的后端接口
        const response = await request.upload("/tool/upload/", data);
        return response;
    } catch (error) {
        console.error(`文件上传失败:`, error);
        // 将错误向上抛出，以便UI层可以捕获并显示消息
        throw error;
    }
};

/**
 * 提交视频生成任务。
 * @param {object} params - 包含所有配置参数的JSON对象。
 * @returns {Promise<object>} - 返回任务创建成功后的信息。
 */
export const createVideoTask = async (params) => {
    try {
        // 使用POST方法提交JSON数据
        const response = await request.post("/video/create-task/", params);
        return response;
    } catch (error) {
        console.error(`创建视频任务失败:`, error);
        throw error;
    }
};

