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
    const response = await request.get(`/news/${id}/`);
    return response;
  } catch (error) {
    console.error(`获取新闻详情出错:`, error);
    throw error;
  }
};

// 将新闻加入素材集
export const addNewsToAsset = async (newsId, assetId) => {
  try {
    const response = await request.post(`/news/${newsId}/add-to-asset/`, {
      asset_id: assetId
    });
    return response;
  } catch (error) {
    console.error(`加入素材集出错:`, error);
    throw error;
  }
};

// 获取新闻热度排行
export const getNewsHotRanking = async (params) => {
  try {
    const response = await request.get("/news/hot-ranking/", formatParams(params));
    return response;
  } catch (error) {
    console.error(`获取热度排行出错:`, error);
    throw error;
  }
};