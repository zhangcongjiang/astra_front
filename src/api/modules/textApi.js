/**
 * @file textApi.js
 * @description 负责与图文相关的后端API进行交互。
 */

import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

/**
 * 获取文本列表
 * @returns {Promise} API响应
 */
export const getTextList = async () => {
    try {
        const response = await request.get(`/text/list/`);
        return response;
    } catch (error) {
        console.error(`获取图文列表失败:`, error);
        throw error;
    }
}

/**
 * 获取文本详情
 * @param {string} id - 文本ID
 * @returns {Promise} API响应
 */
export const getTextDetail = async (id) => {
    try {
        const response = await request.get(`/text/detail/${id}/`);
        return response;
    } catch (error) {
        console.error(`获取图文${id}详情失败:`, error);
        throw error;
    }
}

/**
 * 删除文本
 * @param {Object} text_id - 删除参数（通常包含ID列表）
 * @returns {Promise} API响应
 */
export const deleteText = async (text_id) => {
    try {
        const response = await request.post('/text/delete/', {
            text_id: text_id
        });
        return response;
    } catch (error) {
        console.error('删除图文失败:', error);
        throw error;
    }
};


/**
 * 下载文本
 * @param {string} textId - 文本ID
 * @returns {Promise} API响应
 */
export const downloadText = async (textId, title) => {
    try {
        const response = request.download(`/text/download/${textId}/`,
            {}, filename = `${title}.docx`
        );
        return response;
    } catch (error) {
        console.error(`下载图文${textId}失败:`, error);
        throw error;
    }
};



/**
 * 上传Markdown文件
 * @param {File} file - 要上传的Markdown文件
 * @param {string} title - 文件标题
 * @param {Function} onProgress - 上传进度回调函数
 * @returns {Promise} API响应
 */
export const uploadMarkdown = (file, title, onProgress) => {
    // 校验文件类型和大小
    const allowedTypes = ['text/markdown', 'text/x-markdown', 'application/x-markdown'];
    const allowedExtensions = ['.md', '.markdown'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // 检查MIME类型或文件扩展名
    const isValidType = allowedTypes.includes(file.type) ||
        allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
        throw new Error(`不支持的文件类型: ${file.name}，仅支持 Markdown 文件 (.md)`);
    }

    if (file.size > maxSize) {
        throw new Error(`文件大小超过限制 (最大 ${maxSize / 1024 / 1024}MB): ${file.name}`);
    }

    // 准备FormData
    const formData = new FormData();
    formData.append('file', file); // 单个文件，使用 'file' 而不是 'files'

    // 添加标题
    if (title) {
        formData.append('title', title);
    }

    // 调用通用上传接口，传入进度回调
    return request.upload('/text/upload/', formData, {}, {
        onProgress: (progress) => {
            if (onProgress) {
                onProgress(progress);
            }
        }
    });
};


/**
 * 保存图文（创建或更新）
 * @param {string|null} text_id - 图文ID，创建时为空字符串或null，编辑时传入ID
 * @param {string} title - 图文标题
 * @param {string} content - Markdown内容
 * @returns {Promise} API响应
 */
export const saveText = async (text_id, title, content) => {
  try {
    const requestData = {
      text_id: text_id || '', // 创建时传空字符串，编辑时传实际ID
      title: title,
      content: content
    };
    
    const response = await request.post('/text/save/', requestData);
    return response;
  } catch (error) {
    console.error('保存文件失败:', error);
    throw error;
  }
};