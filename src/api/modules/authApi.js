import instance from '../config/axiosConfig'

export const authAPI = {
  // 获取 CSRF Token
  getCSRFToken() {
    // 尝试通过 /csrf/ 端点获取 CSRF Token
    return instance.get('/csrf/').catch(() => {
      // 如果 /csrf/ 不可用，尝试通过 /account/user-info/ 获取
      return instance.get('/account/user-info/').catch(() => {
        console.warn('无法获取 CSRF Token')
        return null
      })
    })
  },

  // 用户登录
  login(credentials) {
    console.log('登录请求数据:', credentials)
    
    // 验证输入数据
    if (!credentials.username || !credentials.password) {
      return Promise.reject(new Error('用户名和密码不能为空'))
    }
    
    // 确保数据格式正确
    const loginData = {
      username: credentials.username.trim(),
      password: credentials.password
    }
    
    console.log('处理后的登录数据:', loginData)
    
    return instance.post('/account/login/', loginData)
  },

  // 获取用户信息
  getUserInfo() {
    return instance.get('/account/user-info/')
  },

  // 用户登出
  logout() {
    return instance.post('/account/logout/')
  },

  // 获取用户列表（需要权限）
  getUserList() {
    return instance.get('/account/users/')
  }
}