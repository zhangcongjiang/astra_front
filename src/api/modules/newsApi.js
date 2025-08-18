import { request } from "@/api/config/request";
import formatParams from "@/utils/formatParams";

// 获取热点新闻列表
export const getNewsList = async (params) => {
  try {
    const response = await request.get("/news/", formatParams(params));
    return response;
  } catch (error) {
    console.error(`获取新闻列表出错:`, error);
    throw error;
  }
};

// 获取新闻详情
export const getNewsDetail = async (id) => {
  try {
    const response = await request.get(`/news/detail/?news_id=${id}`);
    return response;
  } catch (error) {
    console.error(`获取新闻详情出错:`, error);
    throw error;
  }
};

// 获取新闻详情
export const getNewsTrend = async (id) => {
  try {
    const response = await request.get(`/news/trend/?news_id=${id}`);
    return response;
  } catch (error) {
    console.error(`获取新闻热度趋势出错:`, error);
    throw error;
  }
};
// 将新闻加入素材集
export const addNewsToAsset = async (data) => {
  try {
    const response = await request.post(`/news/add-to-asset/`, data);
    return response;
  } catch (error) {
    console.error(`加入素材集出错:`, error);
    throw error;
  }
};

