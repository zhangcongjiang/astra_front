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
        const response = await request.post("/video/templates/", params);
        return response;
    } catch (error) {
        console.error(`创建视频任务失败:`, error);
        throw error;
    }
};


/**
 * 从服务器获取资源列表。
 * @param {object} params - 查询参数，例如 { type: 'image' }。
 * @returns {Promise<Array>} - 返回资源对象数组。
 */
export const getServerResources = async (url, params) => {
    if (!url) {
        const error = new Error(`无效的资源url: ${url}`);
        console.error(error);
        throw error;
    }

    try {
        const response = await request.get(`/${url}/`, formatParams(params));
        
        // 在返回前，统一处理数据，确保每个项目都有一个'name'字段
        if (response.code === 0 && response.data && Array.isArray(response.data.results)) {
            response.data.results = response.data.results.map(item => {
                // 根据不同资源类型的字段，创建一个统一的'name'属性
                if (params.type === 'image' && item.img_name) {
                    item.name = item.img_name;
                } else if (params.type === 'video' && item.video_name) {
                    item.name = item.video_name;
                } else if (params.type === 'audio' && item.audio_name) {
                    item.name = item.audio_name;
                } else if (!item.name) {
                    // 如果没有特定名称字段，可以提供一个默认值或使用ID
                    item.name = item.id;
                }
                return item;
            });
        }

        return response;
    } catch (error) {
        console.error(`获取 ${params.type} 列表出错:`, error);
        throw error;
    }
};

/**
 * 从远程URL获取数据，支持完整的http url和相对路径。
 * @param {string} url - 要获取数据的URL。
 * @returns {Promise<object>} - 返回从URL获取的数据。
 */
export const fetchRemoteData = async (url) => {
    try {
        let response;
        // 检查URL是否是完整的HTTP/HTTPS链接
        if (url.startsWith('http://') || url.startsWith('https://')) {
            response = await request.get(url, {}, { baseURL: '' }); // 使用空的baseURL覆盖默认值
        } else {
            // 对于相对路径，使用封装的request实例
            response = await request.get(`${url}`);
        }
        return response;
    } catch (error) {
        console.error(`从URL ${url} 获取数据失败:`, error);
        throw error;
    }
};

/**
 * 获取视频模板列表。
 * @param {object} params - 查询参数，例如 { page: 1, page_size: 10, name: '', orientation: '', tag_id: '' }。
 * @returns {Promise<object>} - 返回模板列表数据。
 */
export const getVideoTemplates = async (params = {}) => {
    try {
        const response = await request.get("/video/templates/", formatParams(params));
        return response;
    } catch (error) {
        console.error(`获取视频模板列表失败:`, error);
        throw error;
    }
};

export const getVideoList = async(params ={}) =>{
        try {
        const response = await request.get("/video/", formatParams(params));
        return response;
    } catch (error) {
        console.error(`获取视频列表失败:`, error);
        throw error;
    }
}


export const getVideoDetail = async(video_id) =>{
    try {
    const response = await request.get(`/video/detail/${video_id}/`);
    return response;
} catch (error) {
    console.error(`获取视频${video_id}详情失败:`, error);
    throw error;
}
}

// 重新生成视频
export const regenerateVideo = async (video_id) => {
  try {
    const response = await request.post(`/video/regenerate/${video_id}/`);
    return response;
  } catch (error) {
    console.error(`重新生成视频${video_id}失败:`, error);
    throw error;
  }
};

export const deleteVideo = async (video_id) => {
  try {
    const response = await request.post('/video/delete/', {
      video_id: video_id
    });
    return response;
  } catch (error) {
    console.error('删除视频失败:', error);
    throw error;
  }
};
