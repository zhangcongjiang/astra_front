<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>用户登录</h2>
        <p>欢迎使用Astra系统</p>
      </div>
      
      <a-form
        :model="form"
        :rules="rules"
        @finish="handleLogin"
        layout="vertical"
        class="login-form"
      >
        <a-form-item label="用户名" name="username">
          <a-input 
            v-model:value="form.username" 
            size="large"
            placeholder="请输入用户名"
            :prefix="h(UserOutlined)"
          />
        </a-form-item>
        
        <a-form-item label="密码" name="password">
          <a-input-password 
            v-model:value="form.password" 
            size="large"
            placeholder="请输入密码"
            :prefix="h(LockOutlined)"
          />
        </a-form-item>
        
        <a-form-item>
          <a-button 
            type="primary" 
            html-type="submit" 
            size="large"
            :loading="loading"
            block
          >
            {{ loading ? '登录中...' : '登录' }}
          </a-button>
        </a-form-item>
      </a-form>
      
      <div v-if="error" class="error-message">
        <a-alert :message="error" type="error" show-icon />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await authStore.login(form.value)
    
    if (result.success) {
      message.success('登录成功')
      
      // 登录成功后跳转到首页
      const redirect = router.currentRoute.value.query.redirect || '/dashboard'
      router.push(redirect)
    } else {
      error.value = result.error || '登录失败'
      console.error('登录失败:', result.error)
    }
  } catch (err) {
    error.value = err.message || '登录失败'
    console.error('登录异常:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.error-message {
  margin-top: 16px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #374151;
}

:deep(.ant-input-affix-wrapper) {
  border-radius: 8px;
}

:deep(.ant-btn) {
  border-radius: 8px;
  height: 44px;
  font-weight: 500;
}
</style>