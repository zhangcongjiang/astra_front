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

      <div v-else-if="newsData" class="news-content">
        <!-- 基本信息 -->
        <div class="basic-info">
          <h1 class="news-title">{{ newsData.news.title }}</h1>
          
          <div class="meta-info">
            <a-space size="large">
              <span>
                <strong>来源平台：</strong>
                <a-tag :color="getSourceColor(newsData.news.platform)">{{ newsData.news.platform }}</a-tag>
              </span>
              <span>
                <strong>新闻类型：</strong>
                <a-tag :color="getCategoryColor(newsData.news.category)">{{ newsData.news.category }}</a-tag>
              </span>
              <span>
                <strong>热度值：</strong>
                <span class="hot-score">{{ formatNumber(newsData.news.hots) }}</span>
              </span>
              <span>
                <strong>最高排行：</strong>
                <a-tag color="red" v-if="newsData.news.rank <= 3">第{{ newsData.news.rank }}名</a-tag>
                <a-tag color="orange" v-else-if="newsData.news.rank <= 10">第{{ newsData.news.rank }}名</a-tag>
                <a-button 
                  type="primary" 
                  :icon="h(LineChartOutlined)" 
                  @click="showTrendChart"
                  style="margin-left: 8px;"
                >
                  排名趋势
                </a-button>
              </span>
              
            </a-space>
          </div>
          
          <div class="time-info">
            <a-space size="large">
              <span><strong>发布时间：</strong>{{ formatDateTime(newsData.news.date) }}</span>
            </a-space>
          </div>
        </div>

        <!-- 图片轮播 - 移动到发布时间之后 -->
        <div v-if="newsData.media && newsData.media.length > 0" class="image-carousel">
          <a-carousel autoplay>
            <div v-for="(media, index) in newsData.media" :key="index" class="carousel-item">
              <img :src="media.media" :alt="newsData.news.title" class="carousel-image" />
            </div>
          </a-carousel>
        </div>

        <!-- 新闻内容 -->
        <a-divider />
        <div class="news-body" v-if="newsData.details">
          <h3>新闻内容</h3>
          <div class="content-text">{{ newsData.details.msg }}</div>
        </div>

        <!-- 相关链接 -->
        <a-divider />
        <div class="related-links" v-if="newsData.news.href">
          <h3>相关链接</h3>
          <a :href="newsData.news.href" target="_blank" class="source-link">
            <LinkOutlined /> 查看原文
          </a>
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

    <!-- 排名趋势模态框 -->
    <a-modal 
      v-model:open="showTrendModal" 
      title="排名与热度趋势" 
      width="80%" 
      :footer="null"
      @cancel="closeTrendModal"
    >
      <div v-if="trendLoading" style="text-align: center; padding: 50px;">
        <a-spin size="large" />
        <p style="margin-top: 16px;">正在加载趋势数据...</p>
      </div>
      <div v-else-if="trendData && trendData.length > 0" ref="modalChartContainer" style="width: 100%; height: 400px;"></div>
      <div v-else style="text-align: center; padding: 50px; color: #999;">
        <p>暂无趋势数据</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  ArrowLeftOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  ShareAltOutlined, 
  LinkOutlined,
  LineChartOutlined
} from '@ant-design/icons-vue'
import { getNewsDetail, addNewsToAsset, getNewsTrend } from '@/api/modules/newsApi'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const newsData = ref(null)
const trendData = ref(null)
const trendLoading = ref(false)
const showTrendModal = ref(false)
const modalChartContainer = ref(null)
let modalChartInstance = null

const newsId = route.params.news_id || route.params.id



// 获取新闻详情
// 获取新闻详情
const fetchNewsDetail = async () => {
  try {
    loading.value = true
    const response = await getNewsDetail(newsId)
    if (response.code === 0) {
      newsData.value = response.data
    } else {
      message.error(response.message || '获取新闻详情失败')
      newsData.value = null
    }
  } catch (error) {
    message.error('获取新闻详情失败')
    newsData.value = null
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
    // 使用news_id而不是id
    await addNewsToAsset(newsData.value.news.news_id, 1) // 暂时使用默认素材集ID
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
const getSourceColor = (platform) => {
  const colors = {
    '微博': 'red',
    '百度': 'blue',
    '今日头条': 'orange',
    '虎扑': 'green',
    '虎扑足球': 'green'
  }
  return colors[platform] || 'default'
}

const getCategoryColor = (category) => {
  const colors = {
    '科技': 'blue',
    '娱乐': 'pink',
    '体育': 'green',
    '财经': 'gold',
    '社会': 'purple',
    '国际': 'cyan',
    '农业': 'lime',
    '台海': 'orange',
    '其他': 'default',
    '商业': 'gold',
    '旅游': 'volcano',
    '汽车': 'geekblue',
    'NBA': 'green',
    'CBA': 'green',
    '足球': 'green'
  }
  return colors[category] || 'default'
}

const formatDateTime = (dateTime) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
}

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchNewsDetail()
})

// 显示趋势模态框并获取数据
const showTrendChart = async () => {
  showTrendModal.value = true
  
  // 如果还没有趋势数据，则获取
  if (!trendData.value) {
    await fetchTrendData()
  }
}

// 获取热度趋势数据
const fetchTrendData = async () => {
  try {
    trendLoading.value = true
    const response = await getNewsTrend(newsId)
    console.log('趋势数据响应:', response) // 添加调试日志
    
    if (response.code === 0) {
      // 验证数据格式
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('趋势数据:', response.data) // 添加调试日志
        trendData.value = response.data
        
        // 确保 DOM 更新后再初始化图表
        await nextTick()
        setTimeout(() => {
          initModalChart()
        }, 100) // 延迟100ms确保DOM完全渲染
      } else {
        console.warn('趋势数据格式不正确:', response.data)
        message.warning('趋势数据格式不正确')
      }
    } else {
      console.error('获取趋势数据失败:', response.message)
      message.error(response.message || '获取热度趋势失败')
    }
  } catch (error) {
    console.error('获取热度趋势失败:', error)
    message.error('获取热度趋势失败')
  } finally {
    trendLoading.value = false
  }
}

// 关闭趋势模态框
const closeTrendModal = () => {
  showTrendModal.value = false
  if (modalChartInstance) {
    modalChartInstance.dispose()
    modalChartInstance = null
  }
}

// 初始化模态框图表
const initModalChart = () => {
  console.log('开始初始化图表，数据:', trendData.value) // 添加调试日志
  
  if (!trendData.value || !Array.isArray(trendData.value) || trendData.value.length === 0) {
    console.warn('图表数据为空或格式不正确')
    return
  }
  
  nextTick(() => {
    const modalContainer = modalChartContainer.value
    console.log('图表容器:', modalContainer) // 添加调试日志
    
    if (!modalContainer) {
      console.error('图表容器未找到')
      return
    }
    
    // 销毁已存在的实例
    if (modalChartInstance) {
      modalChartInstance.dispose()
    }
    
    try {
      modalChartInstance = echarts.init(modalContainer)
      console.log('ECharts 实例创建成功:', modalChartInstance)
      
      // 验证数据字段
      const sampleData = trendData.value[0]
      if (!sampleData.date || (!sampleData.rank && sampleData.rank !== 0) || (!sampleData.hots && sampleData.hots !== 0)) {
        console.error('数据字段不完整:', sampleData)
        message.error('趋势数据字段不完整')
        return
      }
      
      const dates = trendData.value.map(item => dayjs(item.date).format('MM-DD HH:mm'))
      const ranks = trendData.value.map(item => item.rank || 0)
      const hots = trendData.value.map(item => item.hots || 0)
      
      console.log('处理后的数据:', { dates, ranks, hots })
      
      const option = {
        title: {
          text: '排名与热度变化趋势',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = `时间: ${params[0].name}<br/>`
            params.forEach(param => {
              if (param.seriesName === '排名') {
                const rankValue = param.value
                if (rankValue === 0) {
                  result += `排名: 未上榜<br/>`
                } else {
                  result += `排名: 第${rankValue}名<br/>`
                }
              } else if (param.seriesName === '热度') {
                result += `热度: ${param.value.toLocaleString()}<br/>`
              }
            })
            return result
          }
        },
        legend: {
          data: ['排名', '热度'],
          top: 30
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '排名',
            position: 'left',
            inverse: true,
            min: 0,
            max: 51,
            minInterval: 1,
            axisLabel: {
              formatter: function(value) {
                if (Number.isInteger(value)) {
                  if (value === 0) {
                    return '未上榜'
                  } else if (value >= 1 && value <= 50) {
                    return `第${value}名`
                  }
                }
                return ''
              }
            },
            axisTick: {
              interval: function(index, value) {
                return Number.isInteger(value)
              }
            }
          },
          {
            type: 'value',
            name: '热度',
            position: 'right',
            axisLabel: {
              formatter: function(value) {
                if (value >= 10000000) {
                  return (value / 10000000).toFixed(1) + '千万'
                } else if (value >= 10000) {
                  return (value / 10000).toFixed(1) + '万'
                }
                return value.toString()
              }
            },
            splitLine: {
              show: false
            }
          }
        ],
        series: [
          {
            name: '排名',
            type: 'line',
            yAxisIndex: 0,
            smooth: true,
            lineStyle: {
              color: '#1890ff',
              width: 3
            },
            itemStyle: {
              color: '#1890ff'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0, color: 'rgba(24, 144, 255, 0.3)'
                }, {
                  offset: 1, color: 'rgba(24, 144, 255, 0.1)'
                }]
              }
            },
            data: ranks
          },
          {
            name: '热度',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            lineStyle: {
              color: '#52c41a',
              width: 2
            },
            itemStyle: {
              color: '#52c41a'
            },
            data: hots
          }
        ]
      }
      
      modalChartInstance.setOption(option)
      console.log('图表配置设置成功')
      
      // 监听窗口大小变化
      const resizeHandler = () => {
        if (modalChartInstance) {
          modalChartInstance.resize()
        }
      }
      window.addEventListener('resize', resizeHandler)
      
    } catch (error) {
      console.error('图表初始化失败:', error)
      message.error('图表初始化失败')
    }
  })
}

// 组件卸载时销毁图表实例
onBeforeUnmount(() => {
  if (modalChartInstance) {
    modalChartInstance.dispose()
    modalChartInstance = null
  }
})
</script>

<style scoped>
.news-detail-container {
  padding: 20px;
  display: flex;
  justify-content: center; /* 内容居中显示 */
}

.detail-card {
  border-radius: 8px;
  width: 100%;
  max-width: 1200px; /* 限制最大宽度 */
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
  max-width: 100%;
  margin: 0 auto; /* 内容居中 */
}

.image-carousel {
  margin: 24px 0; /* 调整图片位置的间距 */
  border-radius: 8px;
  overflow: hidden;
}

.carousel-item {
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
}

.carousel-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* 改为 contain 以保持图片完整性 */
  border-radius: 8px;
  display: block; /* 添加 block 显示 */
  margin: 0 auto; /* 添加自动边距实现居中 */
}

.basic-info {
  margin-bottom: 24px;
  text-align: center; /* 基本信息居中 */
}

.news-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  line-height: 1.4;
}

.meta-info {
  margin-bottom: 12px;
  display: flex;
  justify-content: center; /* 元信息居中 */
}

.time-info {
  color: #666;
  font-size: 14px;
  display: flex;
  justify-content: center; /* 时间信息居中 */
}

.hot-score {
  font-weight: bold;
  color: #ff4d4f;
  font-size: 16px;
}

.news-body {
  margin-bottom: 24px;
  text-align: left; /* 新闻内容左对齐 */
}

.news-body h3 {
  text-align: center; /* 标题居中 */
  margin-bottom: 16px;
}

.content-text {
  line-height: 1.8;
  font-size: 16px;
  color: #333;
  margin-top: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 4px solid #1890ff;
}

.related-links {
  margin-bottom: 24px;
  text-align: center; /* 相关链接居中 */
}

.related-links h3 {
  margin-bottom: 16px;
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

.rank-trend {
  margin-bottom: 24px;
}

.rank-trend h3 {
  text-align: center;
  margin-bottom: 16px;
}

.trend-chart {
  margin-top: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 16px;
}

.action-buttons {
  text-align: center;
}

.error-container {
  text-align: center;
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .news-detail-container {
    padding: 10px;
  }
  
  .meta-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .carousel-item {
    height: 250px;
  }
  
  .news-title {
    font-size: 20px;
  }
}
</style>