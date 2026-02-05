import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

export const getMediaAccountList = async (params = {}) => {
  try {
    const response = await request.get("/account/media-accounts/", formatParams(params));
    return response;
  } catch (error) {
    console.error("获取自媒体账号列表失败:", error);
    throw error;
  }
};

export const createMediaAccount = async (data) => {
  try {
    const response = await request.post("/account/media-accounts/", data);
    return response;
  } catch (error) {
    console.error("新增自媒体账号失败:", error);
    throw error;
  }
};

export const updateMediaAccount = async (id, data) => {
  try {
    const response = await request({ method: "patch", url: `/account/media-accounts/${id}/`, data });
    return response;
  } catch (error) {
    console.error("更新自媒体账号失败:", error);
    throw error;
  }
};

export const checkMediaAccountStatus = async (id, params = {}) => {
  try {
    const response = await request.get(`/account/media-accounts/${id}/status/`, formatParams(params));
    return response;
  } catch (error) {
    console.error("获取账号在线状态失败:", error);
    throw error;
  }
};
