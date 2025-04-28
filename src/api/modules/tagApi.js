import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

export const getTagsByCategory = async (params) => {
  try {
    const response = await request.get("/tag/category/", formatParams(params));
    return response;
  } catch (error) {
    console.error(`获取标签列表出错:`, error);
    throw error;
  }
};


export const addTag = async (data) => {
  try {
    const response = await request.post('/tag/add/', data);
    return response;
  } catch (error) {
    console.error('新增标签失败:', error);
    throw error;
  }
};