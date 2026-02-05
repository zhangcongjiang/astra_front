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

/** 创建动态（multipart/form-data，images为文件数组） */
export const createDynamic = async (data) => {
  try {
    const formData = new FormData();
    // 基本字段
    formData.append('title', (data?.title || '').toString());
    formData.append('content', (data?.content || '').toString());
    // 多文件，同名字段传递多个
    if (Array.isArray(data?.images)) {
      data.images.forEach((file) => {
        if (file) formData.append('images', file);
      });
    }
    // 仅当为 true 时传递，否则后端将使用默认 False
    if (data?.publish === true) {
      formData.append('publish', 'true');
    }

    const response = await request.upload("/text/dynamic/create/", formData);
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

export const publishDynamic = async (idOrObj) => {
  try {
    let dynamic_id = idOrObj;
    if (typeof idOrObj === 'object' && idOrObj) {
      dynamic_id = idOrObj.dynamic_id ?? idOrObj.id ?? idOrObj.dynamicId ?? idOrObj.text_id;
    }
    const payload = {
      dynamic_id,
      id: dynamic_id
    };
    const response = await request.post("/text/dynamic/publish/", payload);
    return response;
  } catch (error) {
    console.error("发布动态失败:", error);
    throw error;
  }
};
