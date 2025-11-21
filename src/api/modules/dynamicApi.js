/**
 * @file dynamicApi.js
 * @description 动态模块相关后端 API 封装。
 */

import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

/** 获取动态列表 */
export const getDynamicList = async (params = {}) => {
  try {
    const response = await request.get("/text/dynamic/list/", formatParams(params));
    return response;
  } catch (error) {
    console.error("获取动态列表失败:", error);
    throw error;
  }
};

/** 获取动态详情 */
export const getDynamicDetail = async (id) => {
  try {
    const response = await request.get(`/text/dynamic/detail/${id}/`);
    return response;
  } catch (error) {
    console.error(`获取动态${id}详情失败:`, error);
    throw error;
  }
};

/** 创建动态 */
export const createDynamic = async (data) => {
  try {
    const response = await request.post("/text/dynamic/create/", data);
    return response;
  } catch (error) {
    console.error("创建动态失败:", error);
    throw error;
  }
};

/** 删除动态（单条） */
export const deleteDynamic = async (dynamic_id) => {
  try {
    const response = await request.post("/text/dynamic/delete/", { dynamic_id });
    return response;
  } catch (error) {
    console.error("删除动态失败:", error);
    throw error;
  }
};

/** 批量删除动态 */
export const batchDeleteDynamics = async (dynamic_ids = []) => {
  try {
    const response = await request.post("/text/dynamic/batch-delete/", { dynamic_ids });
    return response;
  } catch (error) {
    console.error("批量删除动态失败:", error);
    throw error;
  }
};

/** 上传动态文件（如 Markdown/JSON） */
export const uploadDynamic = async (file, title, onProgress) => {
  if (!file) throw new Error("请选择要上传的文件");
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);
  const headers = {};
  return request.upload("/text/dynamic/upload/", formData, headers, { onProgress });
};