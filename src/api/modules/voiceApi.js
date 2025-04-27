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

