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