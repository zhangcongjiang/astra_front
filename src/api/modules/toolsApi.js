import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

export const uploadTool = async (data) => {
    try {
        const response = await request.upload("/tool/upload/", data);
        return response;
    } catch (error) {
        console.error(`上传工具出错:`, error);
        throw error;
    }
};

export const getTools = async (params) => {
    try {
        const response = await request.get("/tool/category/", formatParams(params));
        return response;
    } catch (error) {
        console.error(`查询工具出错:`, error);
        throw error;
    }
};