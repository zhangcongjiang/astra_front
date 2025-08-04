import axiosInstance from "./axiosConfig";
import router from '@/router';

const handleError = (error) => {
  const status = error.response?.status;
  if (status === 403) {
    router.push('/exception/403');
  } else if (status === 404) {
    router.push('/exception/404');
  } else if (status >= 500) {
    router.push('/exception/500');
  }
  throw error;
};

export const request = async ({ method, url, params = {}, data = null, responseType = "json" }) => {
  try {
    // 统一使用 /api 作为 baseURL，不需要重复设置
    // axiosInstance 已经在 axiosConfig.js 中配置了 baseURL = '/api'
    // 注意：axiosInstance 的响应拦截器已经处理了响应，直接返回处理后的数据
    const response = await axiosInstance[method.toLowerCase()](url, method.toLowerCase() === "get" ? { params, responseType } : data);
    return response; // 不需要 .data，因为拦截器已经处理了
  } catch (error) {
    console.error(`请求出错1:`, error);
    handleError(error);
  }
};

request.get = async (url, params = {}) => {
  try {
    const response = await request({ method: "get", url, params });
    return response;
  } catch (error) {
    handleError(error);
  }
};

request.post = async (url, data) => {
  return request({ method: "post", url, data });
};

request.download = async (url, params = {}, fileName = "download.txt") => {
  try {
    // axiosInstance.defaults.responseType = "blob";
    const response = await request({ method: "get", url, params, responseType: "blob" });
    console.log(`下载请求成功:`, response);
    const new_url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement("a");
    link.href = new_url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return response;
  } catch (error) {
    console.error(`下载请求出错:`, error);
    throw error;
  }
};

request.upload = async (url, formData, headers = {}) => {
  try {
    console.log(`上传请求:`, url, formData, headers);
    headers["Content-Type"] = "multipart/form-data";
    const response = await axiosInstance.post(url, formData, {
      headers
    });
    console.log(`上传请求成功:`, response);
    return response; // 不需要 .data，因为拦截器已经处理了

  } catch (error) {
    console.error(`上传请求出错:`, error);
    throw error;
  }
};
