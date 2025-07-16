<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-message-provider>
        <!-- 其他全局内容（如导航栏）可以放在这里 -->
        <router-view/>  <!-- 这是路由内容显示的位置 -->
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui'
</script>