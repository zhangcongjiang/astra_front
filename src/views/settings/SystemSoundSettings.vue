<template>
  <div class="system-sound-settings">
    <h2>系统音频设置</h2>
    
    <el-form :model="form" label-width="180px" ref="formRef">
      <!-- TTS服务器地址设置 -->
      <el-form-item label="TTS服务器地址">
        <el-input 
          v-model="form.ttsServerUrl" 
          placeholder="请输入TTS服务器地址，例如：http://localhost:9966"
          clearable
        />
        <div class="url-hint">
          <el-text type="info" size="small">
            💡 请输入完整的TTS服务器地址，包含协议和端口号
          </el-text>
        </div>
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存设置</el-button>
        <el-button @click="handleReset" :disabled="submitLoading">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSystemSettings, updateSystemSettings } from '@/api/modules/accountApi'

const form = ref({
  ttsServerUrl: ''
})

const formRef = ref(null)
const submitLoading = ref(false)

// 获取系统设置
const fetchSystemSettings = async () => {
  try {
    const response = await getSystemSettings({ key: 'sound' })
    if (response && response.code === 0) {
      const settings = response.data.value || {}
      form.value = {
        ttsServerUrl: settings.ttsServerUrl || ''
      }
    }
  } catch (error) {
    console.error('获取系统设置失败:', error)
    ElMessage.error('获取系统设置失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!form.value.ttsServerUrl.trim()) {
    ElMessage.warning('请输入TTS服务器地址')
    return
  }
  
  // 简单的URL格式验证
  const urlPattern = /^https?:\/\/.+/
  if (!urlPattern.test(form.value.ttsServerUrl.trim())) {
    ElMessage.warning('请输入有效的服务器地址（需包含http://或https://）')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确认要保存TTS服务器地址设置吗？',
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    submitLoading.value = true
    
    const settingsData = {
      key: 'sound',
      value: [
        ['ttsServerUrl', form.value.ttsServerUrl.trim()]
      ]
    }
    
    const response = await updateSystemSettings(settingsData)
    if (response && response.code === 0) {
      ElMessage.success('TTS服务器地址设置保存成功')
    } else {
      ElMessage.error(response?.message || '保存失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存设置失败:', error)
      ElMessage.error('保存失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const handleReset = () => {
  fetchSystemSettings()
  ElMessage.info('已重置为服务器设置')
}

// 组件挂载时获取设置
onMounted(() => {
  fetchSystemSettings()
})
</script>

<style scoped>
.system-sound-settings {
  padding: 20px;
}

.url-hint {
  margin-top: 8px;
  padding: 12px;
  background-color: #f0f9ff;
  border: 1px solid #e1f5fe;
  border-radius: 4px;
  line-height: 1.6;
}
</style>