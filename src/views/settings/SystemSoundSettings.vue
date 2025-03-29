<template>
  <div class="system-sound-settings">
    <h2>系统音频设置</h2>
    
    <el-form :model="form" label-width="180px" ref="formRef">
      <el-form-item label="ChatTTS服务地址">
        <el-input v-model="form.chatTTSUrl" placeholder="请输入ChatTTS服务地址"></el-input>
      </el-form-item>
      
      <el-form-item label="音频种子文件地址">
        <el-input v-model="form.audioSeedPath" placeholder="请输入音频种子文件地址"></el-input>
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
  chatTTSUrl: '',
  audioSeedPath: ''
})

const formRef = ref(null)

const handleSubmit = () => {
  ElMessageBox.confirm(
    '确认要修改系统音频设置吗？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里添加保存逻辑
    console.log('保存设置:', form.value)
  }).catch(() => {
    // 取消操作
  })
}
</script>

<style scoped>
.system-sound-settings {
  padding: 20px;
}
</style>