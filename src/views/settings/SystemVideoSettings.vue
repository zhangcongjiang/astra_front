<template>
  <div class="system-video-settings">
    <h2>系统视频设置</h2>
    
    <el-form :model="form" label-width="180px" ref="formRef">
      <!-- 剪映草稿路径设置 -->
      <el-form-item label="剪映草稿路径">
        <el-input 
          v-model="form.jianYingDraftPath" 
          placeholder="请输入剪映草稿路径，例如：C:\Users\【用户名】\AppData\Local\JianyingPro\User Data\Projects\com.lveditor.draft"
          clearable
        />
        <div class="path-hint">
          <el-text type="info" size="small">
            💡 剪映草稿路径通常位于：<br/>
            <code>C:\Users\【用户名】\AppData\Local\JianyingPro\User Data\Projects\com.lveditor.draft</code>
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
  jianYingDraftPath: ''
})

const formRef = ref(null)
const submitLoading = ref(false)

// 获取系统设置
const fetchSystemSettings = async () => {
  try {
    const response = await getSystemSettings({ key: 'video' })
    if (response && response.code === 0) {
      const settings = response.data.value || {}
      form.value = {
        jianYingDraftPath: settings.jianYingDraftPath || ''
      }
    }
  } catch (error) {
    console.error('获取系统设置失败:', error)
    ElMessage.error('获取系统设置失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!form.value.jianYingDraftPath.trim()) {
    ElMessage.warning('请输入剪映草稿路径')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确认要保存剪映草稿路径设置吗？',
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    submitLoading.value = true
    
    const settingsData = {
      key: 'video',
      value: [
        ['jianYingDraftPath', form.value.jianYingDraftPath.trim()]
      ]
    }
    
    const response = await updateSystemSettings(settingsData)
    if (response && response.code === 0) {
      ElMessage.success('剪映草稿路径设置保存成功')
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
.system-video-settings {
  padding: 20px;
}

.path-hint {
  margin-top: 8px;
  padding: 12px;
  background-color: #f0f9ff;
  border: 1px solid #e1f5fe;
  border-radius: 4px;
  line-height: 1.6;
}

.path-hint code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #e74c3c;
}
</style>