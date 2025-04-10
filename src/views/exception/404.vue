<template>
  <div class="flex flex-col justify-center items-center page-container">
    <div class="text-center">
      <img src="~@/assets/images/exception/404.svg" alt="404" class="error-image" />
    </div>
    <div class="text-center mt-8">
      <h1 class="text-2xl font-semibold text-gray-700 mb-4">抱歉，你访问的页面不存在</h1>
      <p class="text-gray-500 mb-8">请检查您输入的网址是否正确，或点击下方按钮返回首页</p>
      <n-button 
        type="primary" 
        size="large"
        class="home-button"
        @click="goHome"
      >
        回到首页
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
function goHome() {
  router.push('/');
}
</script>

<style lang="less" scoped>
.page-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 50px 0;

  .error-image {
    width: 500px;
    max-width: 90%;
    margin: 0 auto;
  }



  .home-button {
    padding: 0 40px; // 从32px增加到40px
    height: 56px;    // 从48px增加到56px
    font-size: 18px; // 从16px增加到18px
    font-weight: 600;
    background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
    border: none;
    border-radius: 8px;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      background: linear-gradient(135deg, #337ecc 0%, #409eff 100%);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
