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

export const searchImages = async (params) => {
    try {
        const response = await request.get("/tool/image/search/", formatParams(params));
        return response;
    } catch (error) {
        console.error(`搜索图片出错:`, error);
        throw error;
    }
};

export const imageAddress = async (data) => {
    try {
        const response = await request.post("/tool/image/address/", data);
        return response;
    } catch (error) {
        console.error(`查找图片路径出错:`, error);
        throw error;
    }
};


export const saveImageToMaterial = async (data) => {
    try {
        const response = await request.post("/tool/image/add-to-asset/", data);
        return response;
    } catch (error) {
        console.error(`保存素材集失败:`, error);
        throw error;
    }
};
