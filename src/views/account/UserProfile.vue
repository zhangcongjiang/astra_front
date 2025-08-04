<template>
  <div class="user-profile-container">
    <a-card title="个人信息" class="profile-card">
      <template #extra>
        <a-button type="primary" @click="handleEdit" v-if="!isEditing">编辑</a-button>
        <a-space v-else>
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
        </a-space>
      </template>

      <a-spin :spinning="loading" tip="加载中...">
        <div class="profile-content">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <a-avatar :size="80" class="user-avatar">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <div class="avatar-info">
              <h3 class="username">{{ userInfo.username }}</h3>
              <p class="user-role">
                <a-tag :color="userInfo.is_superuser ? 'red' : 'blue'">
                  {{ userInfo.is_superuser ? '超级管理员' : '普通用户' }}
                </a-tag>
              </p>
            </div>
          </div>

          <!-- 基本信息 -->
          <a-divider orientation="left">基本信息</a-divider>
          <a-row :gutter="[24, 16]">
            <a-col :span="12">
              <div class="info-item">
                <label class="info-label">用户名</label>
                <div class="info-value">
                  <a-input 
                    v-if="isEditing" 
                    v-model:value="editForm.username" 
                    placeholder="请输入用户名"
                  />
                  <span v-else>{{ userInfo.username }}</span>
                </div>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="info-item">
                <label class="info-label">邮箱</label>
                <div class="info-value">
                  <a-input 
                    v-if="isEditing" 
                    v-model:value="editForm.email" 
                    placeholder="请输入邮箱"
                    type="email"
                  />
                  <span v-else>{{ userInfo.email || '未设置' }}</span>
                </div>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="info-item">
                <label class="info-label">用户ID</label>
                <div class="info-value">
                  <span>{{ userInfo.id }}</span>
                </div>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="info-item">
                <label class="info-label">用户类型</label>
                <div class="info-value">
                  <span>{{ userInfo.is_superuser ? '超级管理员' : '普通用户' }}</span>
                </div>
              </div>
            </a-col>
          </a-row>

          <!-- 时间信息 -->
          <a-divider orientation="left">时间信息</a-divider>
          <a-row :gutter="[24, 16]">
            <a-col :span="12">
              <div class="info-item">
                <label class="info-label">注册时间</label>
                <div class="info-value">
                  <span>{{ formatTime(userInfo.date_joined) }}</span>
                </div>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="info-item">
                <label class="info-label">最后登录</label>
                <div class="info-value">
                  <span>{{ formatTime(userInfo.last_login) }}</span>
                </div>
              </div>
            </a-col>
          </a-row>

          <!-- 密码修改 -->
          <a-divider orientation="left">安全设置</a-divider>
          <div class="security-section">
            <a-button type="default" @click="showPasswordModal = true">
              <LockOutlined />
              修改密码
            </a-button>
          </div>
        </div>
      </a-spin>
    </a-card>

    <!-- 修改密码模态框 -->
    <a-modal
      v-model:open="showPasswordModal"
      title="修改密码"
      @ok="handlePasswordChange"
      @cancel="resetPasswordForm"
      :confirmLoading="passwordChanging"
    >
      <a-form :model="passwordForm" layout="vertical">
        <a-form-item label="当前密码" required>
          <a-input-password 
            v-model:value="passwordForm.currentPassword" 
            placeholder="请输入当前密码"
          />
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password 
            v-model:value="passwordForm.newPassword" 
            placeholder="请输入新密码"
          />
        </a-form-item>
        <a-form-item label="确认新密码" required>
          <a-input-password 
            v-model:value="passwordForm.confirmPassword" 
            placeholder="请再次输入新密码"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { authAPI } from '@/api/modules/authApi'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const showPasswordModal = ref(false)
const passwordChanging = ref(false)

const userInfo = ref({
  id: '',
  username: '',
  email: '',
  is_superuser: false,
  date_joined: '',
  last_login: ''
})

const editForm = reactive({
  username: '',
  email: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    loading.value = true
    const response = await authAPI.getUserInfo()
    
    if (response.code === 0) {
      userInfo.value = response.data
      // 同步到编辑表单
      editForm.username = response.data.username
      editForm.email = response.data.email || ''
    } else {
      message.error(response.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    message.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '未知'
  return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss')
}

// 编辑模式
const handleEdit = () => {
  isEditing.value = true
  editForm.username = userInfo.value.username
  editForm.email = userInfo.value.email || ''
}

// 取消编辑
const handleCancel = () => {
  isEditing.value = false
  editForm.username = userInfo.value.username
  editForm.email = userInfo.value.email || ''
}

// 保存用户信息
const handleSave = async () => {
  if (!editForm.username.trim()) {
    message.error('用户名不能为空')
    return
  }

  try {
    saving.value = true
    // 这里需要调用更新用户信息的API
    // 由于你只提供了获取用户信息的API，这里先模拟保存成功
    // 实际项目中需要添加更新用户信息的API
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新本地数据
    userInfo.value.username = editForm.username
    userInfo.value.email = editForm.email
    
    // 更新auth store中的用户信息
    authStore.user = { ...userInfo.value }
    
    isEditing.value = false
    message.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 修改密码
const handlePasswordChange = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    message.error('请填写完整的密码信息')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error('两次输入的新密码不一致')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    message.error('新密码长度不能少于6位')
    return
  }

  try {
    passwordChanging.value = true
    // 这里需要调用修改密码的API
    // 由于你只提供了获取用户信息的API，这里先模拟修改成功
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showPasswordModal.value = false
    resetPasswordForm()
    message.success('密码修改成功')
  } catch (error) {
    console.error('密码修改失败:', error)
    message.error('密码修改失败')
  } finally {
    passwordChanging.value = false
  }
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 生命周期
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.user-profile-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-card {
  min-height: 80vh;
}

.profile-content {
  padding: 20px 0;
}

.avatar-section {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
}

.user-avatar {
  margin-right: 24px;
  background: #1890ff;
}

.avatar-info {
  flex: 1;
}

.username {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 500;
  color: #262626;
}

.user-role {
  margin: 0;
  color: #8c8c8c;
}

.info-item {
  margin-bottom: 16px;
}

.info-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #262626;
}

.info-value {
  color: #595959;
}

.info-value span {
  display: inline-block;
  min-height: 32px;
  line-height: 32px;
}

.security-section {
  padding: 16px 0;
}

.ant-divider {
  margin: 24px 0 16px 0;
}

.ant-divider-inner-text {
  font-weight: 500;
  color: #262626;
}
</style>