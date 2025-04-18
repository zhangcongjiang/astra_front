// src/utils/axiosConfig.js
import axios from 'axios';

// 设置基础URL
// 使用相对路径，这样请求会通过vite代理转发
const BASE_URL = '/api/api/';

axios.defaults.withCredentials = true;


// 创建axios实例
const instance = axios.create({
  baseURL: BASE_URL, // api的基准URL
  timeout: 10000, // 请求超时时间
  withCredentials: true,
  headers: { // 默认请求头
    'Content-Type': 'application/json',
    // Authorization: Token 654321
    // 如果有需要，可以在这里添加认证信息，如：Authorization: `Bearer ${token}`
    'Authorization': 'Token 76801daaa6067b5f3a2179b3d6251e659feb512e',
  }
});

// 请求拦截器
instance.interceptors.request.use(config => {
  // 在发送请求之前做些什么，例如添加Token
  // config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  //   csrftoken=BLzyqj8tNVrBm3iWHV1A0ehoqKgMFX2r; sessionid=iebi9o6m3qtn9qu3rpbemo0wes8wjh3i
  // 加入cookie信息
  //     'Authorization': 'Token 654321'
  config.headers.Authorization = 'Token 76801daaa6067b5f3a2179b3d6251e659feb512e'

  return config;
}, error => {
  // 对请求错误做些什么
  logger.error('请求拦截器出错:', error);
  return Promise.reject(error);
});

// 响应拦截器
instance.interceptors.response.use(response => {
  // 去除CORS限制
  // console.log(response.data);
  return response;
}, error => {
  // 对响应错误做点什么，例如错误提示
  console.error('请求出错:', error);
  return Promise.reject(error);
});

export default instance; // 导出axios实例