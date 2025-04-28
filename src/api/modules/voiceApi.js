import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

export const addSpeaker = async (data) => {
    try {
        const response = await request.upload("/voice/speakers/add/", data);
        return response;
    } catch (error) {
        console.error(`新增朗读者出错:`, error);
        throw error;
    }
};
export const updateSpeaker = async (data) => {
    try {
        const response = await request.post("/voice/speakers/update/", data);
        return response;
    } catch (error) {
        console.error(`更新出错:`, error);
        throw error;
    }
};
export const getSpeakerList = async (params) => {
    try {
        const response = await request.get("/voice/speakers/", formatParams(params));
        return response;
    } catch (error) {
        console.error(`获取音色列表出错:`, error);
        throw error;
    }
};
export const getSpeakerSample = async (id, config = {}) => {
    try {
        return request({
            method: 'get',
            url: `/voice/speakers/sample/${id}/`,
            responseType: 'arraybuffer', 
            ...config
          });
    } catch (error) {
      console.error(`获取试听文件出错:`, error);
      throw error;
    }
  };

