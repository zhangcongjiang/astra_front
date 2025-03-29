<template>
  <div class="system-video-settings">
    <h2>系统视频设置</h2>
    
    <el-form :model="form" label-width="180px" ref="formRef">
      <el-form-item label="视频存放地址">
        <el-input v-model="form.videoStoragePath" placeholder="请输入视频存放地址"></el-input>
      </el-form-item>
      
      <el-form-item label="显卡加速">
        <el-switch v-model="form.gpuAcceleration" active-text="启用" inactive-text="禁用" />
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">保存设置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'

const form = ref({
  videoStoragePath: '',
  gpuAcceleration: false
})

const formRef = ref(null)

const handleSubmit = () => {
  ElMessageBox.confirm(
    '确认要修改系统视频设置吗？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('保存视频设置:', form.value)
    // 这里添加保存逻辑
  }).catch(() => {
    // 取消操作
  })
}
</script>

<style scoped>
.system-video-settings {
  padding: 20px;
}
</style>