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

export const getImageContent = (id, config = {}) => {
  return request({
    method: 'get',
    url: `/image/${id}/content/`,
    responseType: 'blob', // 确保返回的是 Blob
    ...config
  });
};