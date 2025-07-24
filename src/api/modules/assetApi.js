import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

// 获取素材集列表
export const getAssetCollectionList = async (params) => {
  try {
    const response = await request.get("/asset/list/", formatParams(params));
    return response;
  } catch (error) {
    console.error(`获取素材集列表出错:`, error);
    throw error;
  }
};

// 获取素材集详情
export const getAssetCollectionDetail = async (id) => {
  try {
    const response = await request.get(`/asset/detail/${id}/`);
    return response;
  } catch (error) {
    console.error(`获取素材集详情出错:`, error);
    throw error;
  }
};


// 创建素材集
export const createAssetCollection = async (data) => {
  try {
    const response = await request.post('/asset/create/', data);
    return response;
  } catch (error) {
    console.error('创建素材集失败:', error);
    throw error;
  }
};

// 更新素材集
export const updateAssetCollection = async (id, set_name) => {
  try {
    const response = await request.post(`/asset/update/`, {
      asset_id: id,
      set_name: set_name
    });
    return response;
  } catch (error) {
    console.error('更新素材集失败:', error);
    throw error;
  }
};

// 删除素材集
export const deleteAssetCollection = async (id) => {
  try {
    const response = await request.post('/asset/delete/', {
      asset_id: id
    });
    return response;
  } catch (error) {
    console.error('删除素材集失败:', error);
    throw error;
  }
};

// 删除素材集内的素材
export const deleteAssetInfo = async (id) => {
  try {
    const response = await request.post('/asset/asset-info/delete/', {
      asset_info_id: id
    });
    return response;
  } catch (error) {
    console.error('删除素材集失败:', error);
    throw error;
  }
};

// 创建文本素材
export const createTextAsset = async (data) => {
  try {
    const response = await request.post('/asset/text/create/', data);
    return response;
  } catch (error) {
    console.error('创建文本素材失败:', error);
    throw error;
  }
};

export const addItemToAsset = async (data) => {
  try {
    const response = await request.post('/asset/asset-info/create/', data);
    return response;
  } catch (error) {
    console.error('添加素材到素材集失败:', error);
    throw error;
  }
};

// 更新文本素材
export const updateTextAsset = async (data) => {
  try {
    const response = await request.post('/asset/text/update/', data);
    return response;
  } catch (error) {
    console.error('更新文本素材失败:', error);
    throw error;
  }
};


//  获取素材元素的详情，包括图片，音频，视频
// GET /api/asset/resource/detail/?resource_type=image&resource_id=xxx
// GET /api/asset/resource/detail/?resource_type=video&resource_id=xxx
// GET /api/asset/resource/detail/?resource_type=audio&resource_id=xxx
export const getAssetItemDetail = async (type, id, options = {})  => {
  // type: image, audio, video
  // options.skipGlobalErrorHandler: 是否跳过全局错误处理
  const { skipGlobalErrorHandler = false } = options;
  
  try {
    let response;
    
    // 验证资源类型
    if (!['image', 'audio', 'video'].includes(type)) {
      throw new Error('素材类型错误');
    }
    
    const params = {
      resource_type: type,
      resource_id: id
    };
    
    if (skipGlobalErrorHandler) {
      // 直接使用axios实例，跳过全局错误处理
      const axiosInstance = (await import('../config/axiosConfig.js')).default;
      response = await axiosInstance.get('/asset/resource/detail/', { params });
      return response.data;
    } else {
      // 使用原有的request方法
      response = await request.get('/asset/resource/detail/', { params });
      return response;
    }
  } catch (error) {
    console.error('获取素材元素详情失败:', error);
    throw error;
  }
}