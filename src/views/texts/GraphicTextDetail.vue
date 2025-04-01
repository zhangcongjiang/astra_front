<template>
  <div class="article-container">
    <!-- 文章头部 -->
    <div class="article-header">
      <h1 class="article-title">{{ article.title }}</h1>
      <div class="article-meta">
        <span class="create-time">{{ formatTime(article.createTime) }}</span>
        <a-button type="link" @click="handleBack">返回列表</a-button>
      </div>
    </div>

    <!-- 文章内容 -->
    <div class="article-content">
      <div v-html="formatContent(article.content)"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();
const article = ref({
  title: '',
  content: '',
  createTime: ''
});

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

// 格式化内容
const formatContent = (content) => {
  // 将换行符转换为<br>
  return content.replace(/\n/g, '<br>');
};

// 获取文章详情
// 修改模拟数据
const fetchArticleDetail = async (id) => {
  try {
    // 这里应该是API调用
    // 模拟数据
    article.value = {
      title: `图文标题 ${id}`,
      content: `这是第 ${id} 个图文的内容，这里包含了图文的主要描述和关键信息。\n\n内容可以很长，用于详细描述图文的内容和特点。\n\n![示例图片](https://picsum.photos/800/400?random=${id})`,
      createTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format(),
      images: [
        `https://picsum.photos/800/400?random=${id}1`,
        `https://picsum.photos/800/400?random=${id}2`
      ]
    };
  } catch (error) {
    message.error('获取文章详情失败');
  }
};

// 返回列表
const handleBack = () => {
  router.push({ name: 'texts' });
};

onMounted(() => {
  fetchArticleDetail(route.params.id);
});
</script>

<style scoped>
.article-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.article-header {
  margin-bottom: 40px;
  text-align: center;
}

.article-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
}

.article-meta {
  color: #999;
  font-size: 14px;
  margin-bottom: 10px;
}

.create-time {
  margin-right: 20px;
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.article-content >>> img {
  max-width: 100%;
  height: auto;
  margin: 20px 0;
  border-radius: 4px;
}

.article-content >>> p {
  margin: 20px 0;
}

.content-image {
  max-width: 100%;
  height: auto;
  margin: 20px 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-gallery {
  margin: 20px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.gallery-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.gallery-image:hover {
  transform: scale(1.02);
}
</style>