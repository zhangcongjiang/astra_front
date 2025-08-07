// src/api/config/axiosConfig.js
import axios from 'axios';
import router from '@/router';

// 设置基础URL
// 开发环境使用相对路径，通过 Vite 代理访问后端
// 生产环境可以通过环境变量配置
const BASE_URL = '/api';

// 后端已禁用 CSRF 保护，不需要 CSRF Token 处理

// 创建axios实例
const instance = axios.create({
  baseURL: BASE_URL, // api的基准URL
  timeout: 160000, // 请求超时时间
  withCredentials: true, // 重要：允许携带cookie进行session认证
  headers: { // 默认请求头
    'Content-Type': 'application/json',
  }
});

// 获取 CSRF Token 的函数
function getCSRFToken() {
  // 从 cookie 中获取 CSRF Token
  const name = 'csrftoken'
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

// 请求拦截器
instance.interceptors.request.use(async config => {
  // 确保请求头正确设置
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  
  // 添加 CSRF Token
  const csrfToken = getCSRFToken()
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken
    config.headers['X-CSRF-Token'] = csrfToken  // 添加备用头
    console.log('添加 CSRF Token:', csrfToken)
  } else {
    console.warn('未找到 CSRF Token')
    
    // 对于需要CSRF保护的请求（POST, PUT, DELETE等），尝试先获取token
    if (['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
      try {
        // 尝试通过一个简单的GET请求获取CSRF token
        const response = await axios.get('/api/csrf/', { 
          baseURL: BASE_URL,
          withCredentials: true 
        })
        
        // 重新尝试获取token
        const newToken = getCSRFToken()
        if (newToken) {
          config.headers['X-CSRFToken'] = newToken
          config.headers['X-CSRF-Token'] = newToken
          console.log('重新获取 CSRF Token 成功:', newToken)
        }
      } catch (error) {
        console.warn('无法获取 CSRF Token:', error.message)
      }
    }
  }
  
  // 添加调试日志
  console.log('请求配置:', {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers
  })
  
  return config
}, error => {
  console.error('请求拦截器错误:', error)
  return Promise.reject(error)
});

// 响应拦截器
instance.interceptors.response.use(
  response => {
    const { data } = response
    console.log('响应数据:', data)
    
    // 根据后端返回的格式处理响应
    if (data.code === 0) {
      // 成功响应
      return data
    } else {
      // 业务错误
      console.error('业务错误:', data.message)
      throw new Error(data.message || '请求失败')
    }
  },
  error => {
    console.error('HTTP错误:', error)
    
    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response
      console.error('错误状态码:', status)
      console.error('错误数据:', data)
      
      let errorMessage = '请求失败'
      
      // 处理后端返回的错误格式
      if (data) {
        if (data.message) {
          errorMessage = data.message
        } else if (data.code !== undefined && data.code !== 0) {
          // 处理后端的业务错误格式
          errorMessage = data.message || '请求失败'
        } else if (typeof data === 'string') {
          errorMessage = data
        }
      } else {
        // 根据状态码设置默认错误消息
        switch (status) {
          case 401:
            errorMessage = '未授权，请重新登录'
            break
          case 403:
            errorMessage = '权限不足'
            break
          case 404:
            errorMessage = '请求的资源不存在'
            break
          case 500:
            errorMessage = '服务器内部错误'
            break
          default:
            errorMessage = `请求失败 (${status})`
        }
      }
      
      throw new Error(errorMessage)
    } else if (error.request) {
      // 网络错误
      console.error('网络错误:', error.request)
      throw new Error('网络连接失败，请检查网络')
    } else {
      // 其他错误
      console.error('其他错误:', error.message)
      throw new Error(error.message || '未知错误')
    }
  }
)

export default instance; // 导出axios实例