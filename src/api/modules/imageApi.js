import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

export const getImageList = async (params) => {
  try {
    const response = await request.get("/image/", formatParams(params));
    return response;
  } catch (error) {
    console.error(`获取图片列表出错:`, error);
    throw error;
  }
};

export const getImageDetail = async (id) => {
  try {
    const response = await request.get(`/image/${id}/`);
    return response;
  } catch (error) {
    console.error(`获取图片详情出错:`, error);
    throw error;
  }
};


export const getImageContent = (id, config = {}) => {
  return request({
    method: 'get',
    url: `/image/${id}/detail/`,
    responseType: 'blob', // 确保返回的是 Blob
    ...config
  });
};

// 图片上传方法
export const uploadImages = (files, category = 'normal', onProgress) => {
  // 校验文件类型和大小
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  const maxSize = 50 * 1024 * 1024; // 5MB
  
  files.forEach(file => {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`不支持的文件类型: ${file.type}`);
    }
    if (file.size > maxSize) {
      throw new Error(`文件大小超过限制 (最大 ${maxSize / 1024 / 1024}MB)`);
    }
  });

  // 准备FormData
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('category', category);

  // 调用通用上传接口，传入进度回调
  return request.upload('/image/upload/', formData, {}, {
    onProgress: (progress) => {
      if (onProgress) {
        onProgress(progress);
      }
    }
  });
};

export const deleteImages = async (imageIds) => {
  try {
    const response = await request.post('/image/delete/', {
      image_ids: imageIds
    });
    return response;
  } catch (error) {
    console.error('删除图片失败:', error);
    throw error;
  }
};

export const bindTags = async (data) => {
  try {
    const response = await request.post('/image/bind-tags/', data);
    return response;
  } catch (error) {
    console.error('绑定标签失败:', error);
    throw error;
  }
};

export const deleteTags = async (data) => {
  try {
    const response = await request.post('/image/delete-tags/', data);
    return response;
  } catch (error) {
    console.error('删除标签失败:', error);
    throw error;
  }
};