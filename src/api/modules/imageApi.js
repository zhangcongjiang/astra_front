import { request } from "../config/request";
import formatParams from '@/utils/formatParams'

export const getImageList = async (params) => {
  try {
    const response = await request.get("/image/", formatParams(params));
    return response;
  } catch (error) {
    console.error(`获取图片列表出错:`, error);
    throw error;
  }
};

export const getImageSummary = (id, config = {}) => {
  return request({
    method: 'get',
    url: `/image/${id}/summary/`,
    responseType: 'blob', // 确保返回的是 Blob
    ...config
  });
};

export const getImageDetail = (id, config = {}) => {
  return request({
    method: 'get',
    url: `/image/${id}/detail/`,
    responseType: 'blob', // 确保返回的是 Blob
    ...config
  });
};