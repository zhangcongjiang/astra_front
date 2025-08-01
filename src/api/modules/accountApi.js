import { request } from "../config/request";
import formatParams from "@/utils/formatParams";

// 获取素材集详情
export const getSystemSettings = async (params) => {
    try {
        const response = await request.get(`/account/settings/`, formatParams(params));
        return response;
    } catch (error) {
        console.error(`获取系统设置信息出错:`, error);
        throw error;
    }
};

// 创建素材集
export const updateSystemSettings = async (data) => {
    try {
        const response = await request.post('/account/settings/update/', data);
        return response;
    } catch (error) {
        console.error('系统配置更新失败:', error);
        throw error;
    }
};

