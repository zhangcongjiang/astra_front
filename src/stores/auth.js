import { defineStore } from 'pinia'
import { authAPI } from '@/api/modules/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    isAdmin: (state) => state.user?.is_superuser || false,
    username: (state) => state.user?.username || '',
    userInfo: (state) => state.user
  },

  actions: {
    // 登录
  async login(credentials) {
    try {
      this.loading = true
      this.error = null
      
      console.log('开始登录，凭据:', credentials)
      
      // 先获取 CSRF Token
      try {
        await authAPI.getCSRFToken()
        console.log('CSRF Token 获取成功')
      } catch (error) {
        console.warn('CSRF Token 获取失败，继续尝试登录:', error.message)
      }
      
      // 进行登录
      const response = await authAPI.login(credentials)
        
        console.log('登录响应:', response)
        
        if (response.code === 0) {
          this.user = response.data
          this.isAuthenticated = true
          console.log('登录成功，用户信息:', this.user)
          
          // 登录成功后立即获取最新的用户信息以确保认证状态
          try {
            await this.fetchUserInfo()
            console.log('用户信息更新成功')
          } catch (error) {
            console.warn('获取用户信息失败，但登录成功:', error)
          }
          
          return { success: true, data: response.data }
        } else {
          this.error = response.message || '登录失败'
          console.error('登录失败:', this.error)
          return { success: false, error: this.error }
        }
      } catch (error) {
        console.error('登录异常:', error)
        
        // 处理不同类型的错误
        let errorMessage = '登录失败'
        
        if (error.response && error.response.data) {
          // 后端返回的错误
          const errorData = error.response.data
          if (typeof errorData === 'string') {
            errorMessage = errorData
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
            errorMessage = errorData.non_field_errors[0]
          }
        } else if (error.message) {
          errorMessage = error.message
        }
        
        this.error = errorMessage
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // 获取用户信息
    async fetchUserInfo() {
      try {
        const response = await authAPI.getUserInfo()
        if (response.code === 0) {
          this.user = response.data
          this.isAuthenticated = true
          return response
        } else {
          throw new Error(response.message || '获取用户信息失败')
        }
      } catch (error) {
        this.user = null
        this.isAuthenticated = false
        throw error
      }
    },

    // 登出
    async logout() {
      try {
        await authAPI.logout()
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        this.user = null
        this.isAuthenticated = false
      }
    },

    // 检查认证状态
    async checkAuth() {
      try {
        await this.fetchUserInfo()
        return true
      } catch (error) {
        this.user = null
        this.isAuthenticated = false
        return false
      }
    }
  }
})