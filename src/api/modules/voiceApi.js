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
export const getSpeakerSample = async (params, config = {}) => {
    try {
        return request({
            method: 'post',
            url: `/voice/speakers/sample/`,
            data: formatParams(params),
            responseType: 'json',
            ...config
        });
    } catch (error) {
        console.error(`获取试听文件出错:`, error);
        throw error;
    }
};

export const syncSpeakerAudio = async () => {
    try {
        const response = await request.post("/voice/speakers/sync/");
        return response;
    } catch (error) {
        console.error(`同步音频出错:`, error);
        throw error;
    }
};

export const getAllLanguages = async () => {
    try {
        const response = await request.get("/voice/languages/");
        return response;
    } catch (error) {
        console.error(`获取所有语言出错:`, error);
        throw error;
    }
};

export const getLanguagesBySpeaker = async (speakerId) => {
    try {
        const response = await request.get(`/voice/languages/by-speaker/?speaker_id=${speakerId}`);
        return response;
    } catch (error) {
        console.error(`获取朗读者语言出错:`, error);
        throw error;
    }
};

export const getAllEmotions = async () => {
    try {
        const response = await request.get("/voice/emotions/");
        return response;
    } catch (error) {
        console.error(`获取所有情感出错:`, error);
        throw error;
    }
};

export const getEmotionsBySpeaker = async (speakerId) => {
    try {
        const response = await request.get(`/voice/emotions/by-speaker/?speaker_id=${speakerId}`);
        return response;
    } catch (error) {
        console.error(`获取朗读者情感出错:`, error);
        throw error;
    }
};

export const uploadSound = async (data) => {
    try {
        const response = await request.upload(`/voice/upload/`, data);
        return response;
    } catch (error) {
        console.error(`上传音频文件出错:`, error);
        throw error;
    }
};

export const getSoundList = async (params) => {
    try {
        const response = await request.get(`/voice/`, formatParams(params));
        return response;
    } catch (error) {
        console.error(`获取音频列表出错:`, error);
        throw error;
    }
}

export const soundPlay = async (soundId) => {
    try {
        const response = await request.get(`/voice/sound/play/?sound_id=${soundId}`,)
        return response;
    } catch (error) {
        console.error(`音频播放失败:`, error);
        throw error;
    }
}

export const deleteSounds = async (sound_ids) => {
    try {
        const response = await request.post('/voice/delete/', {
            sound_ids: sound_ids
        });
        return response;
    } catch (error) {
        console.error('删除音频失败:', error);
        throw error;
    }
};

export const bindTags = async (data) => {
  try {
    const response = await request.post('/voice/bind-tags/', data);
    return response;
  } catch (error) {
    console.error('绑定标签失败:', error);
    throw error;
  }
};