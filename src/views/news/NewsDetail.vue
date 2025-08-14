<template>
  <div class="news-detail-container">
    <a-card class="detail-card">
      <!-- 页面头部 -->
      <template #title>
        <div class="page-header">
          <a-button @click="goBack" type="text" class="back-btn">
            <template #icon><ArrowLeftOutlined /></template>
            返回列表
          </a-button>
          <span class="page-title">新闻详情</span>
          <a-button @click="refresh" type="primary" ghost class="refresh-btn">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
      </div>

      <div v-else-if="newsInfo" class="news-content">
        <!-- 基本信息 -->
        <div class="basic-info">
          <h1 class="news-title">{{ newsInfo.title }}</h1>
          
          <div class="meta-info">
            <a-space size="large">
              <span>
                <strong>来源平台：</strong>
                <a-tag :color="getSourceColor(newsInfo.source)">{{ getSourceText(newsInfo.source) }}</a-tag>
              </span>
              <span>
                <strong>新闻类型：</strong>
                <a-tag :color="getCategoryColor(newsInfo.category)">{{ getCategoryText(newsInfo.category) }}</a-tag>
              </span>
              <span>
                <strong>热度值：</strong>
                <span class="hot-score">{{ newsInfo.hot_score }}</span>
              </span>
              <span>
                <strong>当前排名：</strong>
                <a-tag color="red" v-if="newsInfo.current_rank <= 3">第{{ newsInfo.current_rank }}名</a-tag>
                <a-tag color="orange" v-else-if="newsInfo.current_rank <= 10">第{{ newsInfo.current_rank }}名</a-tag>
                <a-tag v-else>第{{ newsInfo.current_rank }}名</a-tag>
              </span>
              <span>
                <strong>最高排名：</strong>
                <a-tag color="red" v-if="newsInfo.max_rank <= 3">第{{ newsInfo.max_rank }}名</a-tag>
                <a-tag color="orange" v-else-if="newsInfo.max_rank <= 10">第{{ newsInfo.max_rank }}名</a-tag>
                <a-tag v-else>第{{ newsInfo.max_rank }}名</a-tag>
              </span>
            </a-space>
          </div>
          
          <div class="time-info">
            <a-space size="large">
              <span><strong>上榜时间：</strong>{{ formatDateTime(newsInfo.rank_time) }}</span>
              <span><strong>更新时间：</strong>{{ formatDateTime(newsInfo.updated_at) }}</span>
            </a-space>
          </div>
        </div>

        <!-- 新闻内容 -->
        <a-divider />
        <div class="news-body">
          <h3>新闻内容</h3>
          <div class="content-text" v-html="newsInfo.content"></div>
        </div>

        <!-- 相关链接 -->
        <a-divider />
        <div class="related-links" v-if="newsInfo.source_url">
          <h3>相关链接</h3>
          <a :href="newsInfo.source_url" target="_blank" class="source-link">
            <LinkOutlined /> 查看原文
          </a>
        </div>

        <!-- 热度趋势 -->
        <a-divider />
        <div class="hot-trend" v-if="newsInfo.hot_history && newsInfo.hot_history.length > 0">
          <h3>热度趋势</h3>
          <div class="trend-chart">
            <!-- 这里可以集成图表组件显示热度趋势 -->
            <a-table 
              :columns="trendColumns" 
              :data-source="newsInfo.hot_history" 
              :pagination="false"
              size="small"
            />
          </div>
        </div>

        <!-- 操作按钮 -->
        <a-divider />
        <div class="action-buttons">
          <a-space>
            <a-button type="primary" @click="addToAsset">
              <template #icon><PlusOutlined /></template>
              加入素材集
            </a-button>
            <a-button @click="shareNews">
              <template #icon><ShareAltOutlined /></template>
              分享
            </a-button>
          </a-space>
        </div>
      </div>

      <div v-else class="error-container">
        <a-result status="404" title="新闻不存在" sub-title="抱歉，您访问的新闻不存在或已被删除。">
          <template #extra>
            <a-button type="primary" @click="goBack">返回列表</a-button>
          </template>
        </a-result>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  ArrowLeftOutlined, 
  ReloadOutlined, 
  LinkOutlined, 
  PlusOutlined, 
  ShareAltOutlined 
} from '@ant-design/icons-vue'
import { getNewsDetail, addNewsToAsset } from '@/api/modules/newsApi'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const newsInfo = ref(null)

// 获取新闻ID
const newsId = route.params.id

// 热度趋势表格列
const trendColumns = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    customRender: ({ text }) => formatDateTime(text)
  },
  {
    title: '热度值',
    dataIndex: 'hot_score',
    key: 'hot_score'
  },
  {
    title: '排名',
    dataIndex: 'rank',
    key: 'rank',
    customRender: ({ text }) => `第${text}名`
  }
]

// 获取新闻详情
const fetchNewsDetail = async () => {
  try {
    loading.value = true
    const response = await getNewsDetail(newsId)
    newsInfo.value = response.data
  } catch (error) {
    message.error('获取新闻详情失败')
    newsInfo.value = null
  } finally {
    loading.value = false
  }
}

// 返回列表
const goBack = () => {
  router.push('/news')
}

// 刷新
const refresh = () => {
  fetchNewsDetail()
}

// 加入素材集
const addToAsset = async () => {
  try {
    await addNewsToAsset(newsId, 1) // 暂时使用默认素材集ID
    message.success('已加入素材集')
  } catch (error) {
    message.error('加入素材集失败')
  }
}

// 分享新闻
const shareNews = () => {
  // 复制链接到剪贴板
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    message.success('链接已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}

// 辅助函数
const getSourceColor = (source) => {
  const colors = {
    weibo: 'red',
    zhihu: 'blue',
    toutiao: 'orange',
    baidu: 'green'
  }
  return colors[source] || 'default'
}

const getSourceText = (source) => {
  const texts = {
    weibo: '微博',
    zhihu: '知乎',
    toutiao: '今日头条',
    baidu: '百度'
  }
  return texts[source] || source
}

const getCategoryColor = (category) => {
  const colors = {
    tech: 'blue',
    entertainment: 'pink',
    sports: 'green',
    finance: 'gold',
    society: 'purple'
  }
  return colors[category] || 'default'
}

const getCategoryText = (category) => {
  const texts = {
    tech: '科技',
    entertainment: '娱乐',
    sports: '体育',
    finance: '财经',
    society: '社会'
  }
  return texts[category] || category
}

const formatDateTime = (dateTime) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchNewsDetail()
})
</script>

<style scoped>
.news-detail-container {
  padding: 20px;
}

.detail-card {
  border-radius: 8px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.news-content {
  max-width: 1000px;
}

.basic-info {
  margin-bottom: 24px;
}

.news-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  line-height: 1.4;
}

.meta-info {
  margin-bottom: 12px;
}

.time-info {
  color: #666;
  font-size: 14px;
}

.hot-score {
  font-weight: bold;
  color: #ff4d4f;
  font-size: 16px;
}

.news-body {
  margin-bottom: 24px;
}

.content-text {
  line-height: 1.8;
  font-size: 16px;
  color: #333;
  margin-top: 12px;
}

.related-links {
  margin-bottom: 24px;
}

.source-link {
  color: #1890ff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.source-link:hover {
  text-decoration: underline;
}

.hot-trend {
  margin-bottom: 24px;
}

.trend-chart {
  margin-top: 12px;
}

.action-buttons {
  text-align: center;
}

.error-container {
  text-align: center;
  padding: 40px 0;
}
</style>