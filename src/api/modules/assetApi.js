import request from "../config/request";
import formatParams from "@/utils/formatParams";

// 获取素材集列表
export const getAssetCollectionList = async (params) => {
  try {
    const response = await request.get("/asset-collection/", formatParams(params));
    return response;
  } catch (error) {
    console.error(`获取素材集列表出错:`, error);
    throw error;
  }
};

// 获取素材集详情
export const getAssetCollectionDetail = async (id) => {
  try {
    const response = await request.get(`/asset-collection/${id}/`);
    return response;
  } catch (error) {
    console.error(`获取素材集详情出错:`, error);
    throw error;
  }
};

// 获取素材集中的素材列表
export const getAssetCollectionItems = async (id, params) => {
  try {
    const response = await request.get(`/asset-collection/${id}/items/`, formatParams(params));
    return response;
  } catch (error) {
    console.error(`获取素材集内容出错:`, error);
    throw error;
  }
};

// 创建素材集
export const createAssetCollection = async (data) => {
  try {
    const response = await request.post('/asset-collection/', data);
    return response;
  } catch (error) {
    console.error('创建素材集失败:', error);
    throw error;
  }
};

// 更新素材集
export const updateAssetCollection = async (id, data) => {
  try {
    const response = await request.put(`/asset-collection/${id}/`, data);
    return response;
  } catch (error) {
    console.error('更新素材集失败:', error);
    throw error;
  }
};

// 删除素材集
export const deleteAssetCollection = async (id) => {
  try {
    const response = await request.delete(`/asset-collection/${id}/`);
    return response;
  } catch (error) {
    console.error('删除素材集失败:', error);
    throw error;
  }
};

// 添加素材到素材集
export const addAssetsToCollection = async (collectionId, assets) => {
  try {
    const response = await request.post(`/asset-collection/${collectionId}/add-assets/`, {
      assets: assets
    });
    return response;
  } catch (error) {
    console.error('添加素材到素材集失败:', error);
    throw error;
  }
};

// 从素材集中移除素材
export const removeAssetsFromCollection = async (collectionId, assetIds) => {
  try {
    const response = await request.post(`/asset-collection/${collectionId}/remove-assets/`, {
      asset_ids: assetIds
    });
    return response;
  } catch (error) {
    console.error('从素材集移除素材失败:', error);
    throw error;
  }
};

// 更新素材集中素材的顺序
export const updateAssetOrder = async (collectionId, orderData) => {
  try {
    const response = await request.post(`/asset-collection/${collectionId}/update-order/`, {
      order_data: orderData
    });
    return response;
  } catch (error) {
    console.error('更新素材顺序失败:', error);
    throw error;
  }
};