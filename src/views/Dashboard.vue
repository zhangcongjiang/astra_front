<template>
  <div class="dashboard-container">
    <!-- 顶部欢迎区域 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="welcome-layout">
          <!-- 左侧头像 -->
          <div class="welcome-avatar">
            <div class="avatar-circle">
              <span class="wave-emoji">👋</span>
            </div>
          </div>
          
          <!-- 右侧文字内容 -->
          <div class="welcome-text">
            <h1>欢迎回来，{{ userInfo.username }}</h1>
            <p>{{ getCurrentTimeGreeting() }}，开始您的创作之旅</p>
            <div class="welcome-decoration">
              <div class="decoration-line"></div>
              <div class="decoration-dot"></div>
              <div class="decoration-line"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 数据概览卡片 -->
      <div class="overview-section">
        <h2><BarChartOutlined /> 数据概览</h2>
        <div class="stats-grid">
          <a-card 
            v-for="stat in stats" 
            :key="stat.id" 
            class="stat-card"
            :hoverable="true"
            @click="navigateToModule(stat.path)"
          >
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <component :is="stat.icon" :style="{ fontSize: '24px', color: 'white' }" />
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </a-card>
        </div>
      </div>

      <!-- 快捷操作区域 -->
      <div class="quick-actions-section">
        <h2><ThunderboltOutlined /> 快捷操作</h2>
        <div class="actions-grid">
          <a-card 
            v-for="action in quickActions" 
            :key="action.id" 
            class="action-card"
            :hoverable="true"
            @click="handleQuickAction(action.path)"
          >
            <div class="action-content">
              <div class="action-icon" :style="{ color: action.color }">
                <component :is="action.icon" :style="{ fontSize: '32px' }" />
              </div>
              <div class="action-text">
                <div class="action-title">{{ action.name }}</div>
                <div class="action-desc">{{ action.description }}</div>
              </div>
            </div>
          </a-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser } from '@/api/modules/accountApi'

import {
  BarChartOutlined,
  ThunderboltOutlined,
  PictureOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  ToolOutlined,
  FolderOutlined,
  EditOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

// 用户信息
const userInfo = ref({
  username: '',
  img_count: 0,
  sound_count: 0,
  article_count: 0,
  video_asset_count: 0,
  asset_count: 0,
  video_draft_count: 0
})

// 数据统计
const stats = ref([
  { 
    id: 1, 
    label: '图片素材', 
    value: '0', 
    icon: PictureOutlined, 
    color: '#faad14',
    path: '/images'
  },
  { 
    id: 2, 
    label: '音频素材', 
    value: '0', 
    icon: SoundOutlined, 
    color: '#722ed1',
    path: '/musics'
  },
  { 
    id: 3, 
    label: '我的图文', 
    value: '0', 
    icon: FileTextOutlined, 
    color: '#13c2c2',
    path: '/texts'
  },
  { 
    id: 4, 
    label: '视频素材', 
    value: '0', 
    icon: VideoCameraOutlined, 
    color: '#eb2f96',
    path: '/videos'
  },
  { 
    id: 5, 
    label: '素材集', 
    value: '0', 
    icon: FolderOutlined, 
    color: '#1890ff',
    path: '/assets'
  },
  { 
    id: 6, 
    label: '视频草稿', 
    value: '0', 
    icon: EditOutlined, 
    color: '#52c41a',
    path: '/drafts'
  }
])

// 快捷操作
const quickActions = ref([
  {
    id: 1,
    name: '图文创作',
    description: '创建图文内容',
    icon: FileTextOutlined,
    color: '#722ed1',
    path: '/texts'
  },
  {
    id: 2,
    name: '图片上传',
    description: '上传图片素材',
    icon: PictureOutlined,
    color: '#1890ff',
    path: '/images'
  },
  {
    id: 3,
    name: '音频上传',
    description: '上传音频文件',
    icon: SoundOutlined,
    color: '#52c41a',
    path: '/musics'
  },
  {
    id: 4,
    name: '视频上传',
    description: '上传视频素材',
    icon: VideoCameraOutlined,
    color: '#faad14',
    path: '/videos'
  },
  {
    id: 5,
    name: '新建素材集',
    description: '创建素材集合',
    icon: FolderOutlined,
    color: '#eb2f96',
    path: '/assets'
  },
  {
    id: 6,
    name: '视频制作',
    description: '制作视频模板',
    icon: EditOutlined,
    color: '#13c2c2',
    path: '/templates'
  },
  {
    id: 7,
    name: '任务管理',
    description: '管理我的任务',
    icon: ToolOutlined,
    color: '#f5222d',
    path: '/my-tasks'
  }
])

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getCurrentUser()
    if (response.code === 0) {
      userInfo.value = response.data
      
      // 先将所有统计数据重置为0
      stats.value.forEach(stat => {
        stat.value = '0'
      })
      
      // 目标数据
      const targetValues = [
        response.data.img_count,
        response.data.sound_count,
        response.data.article_count,
        response.data.video_asset_count,
        response.data.asset_count,
        response.data.video_draft_count
      ]
      
      // 启动动画
      animateNumbers(targetValues)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 数字动画函数
const animateNumbers = (targetValues) => {
  const duration = 2000 // 2秒
  const startTime = Date.now()
  const startValues = new Array(targetValues.length).fill(0)
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数让动画更自然
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    
    // 更新每个统计数据
    targetValues.forEach((target, index) => {
      const current = Math.floor(startValues[index] + (target - startValues[index]) * easeOutQuart)
      stats.value[index].value = current.toString()
    })
    
    // 如果动画未完成，继续下一帧
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // 确保最终值准确
      targetValues.forEach((target, index) => {
        stats.value[index].value = target.toString()
      })
    }
  }
  
  // 开始动画
  requestAnimationFrame(animate)
}

// 方法
const getCurrentTimeGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

const handleQuickAction = (path) => {
  router.push(path)
}

const navigateToModule = (path) => {
  router.push(path)
}

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #ffffff;
  padding: 0;
}

.welcome-banner {
  background: #ffffff;
  position: relative;
  overflow: hidden;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.welcome-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
  box-sizing: border-box;
}

.welcome-layout {
  display: flex;
  align-items: center;
  gap: 24px;
  animation: fadeInUp 0.8s ease-out;
}

.welcome-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  animation: pulse 2s infinite;
}

.wave-emoji {
  font-size: 32px;
  animation: wave 1s ease-in-out infinite;
}

.welcome-text {
  flex: 1;
  text-align: left;
}

.welcome-text h1 {
  color: #1f2937;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.welcome-text p {
  color: #6b7280;
  font-size: 18px;
  margin: 0 0 16px 0;
  font-weight: 400;
}

.welcome-decoration {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.decoration-line {
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  border-radius: 1px;
}

.decoration-dot {
  width: 6px;
  height: 6px;
  background: #667eea;
  border-radius: 50%;
  animation: glow 2s ease-in-out infinite alternate;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 40px 24px;
}

.overview-section,
.quick-actions-section {
  margin-bottom: 24px;
}

.overview-section h2,
.quick-actions-section h2 {
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.action-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.action-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-icon {
  flex-shrink: 0;
}

.action-text {
  flex: 1;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 14px;
  color: #6b7280;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes wave {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

@keyframes glow {
  from {
    box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
  }
  to {
    box-shadow: 0 0 15px rgba(102, 126, 234, 0.6);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-banner {
    padding: 16px 0;
  }
  
  .welcome-layout {
    gap: 16px;
  }
  
  .avatar-circle {
    width: 60px;
    height: 60px;
  }
  
  .wave-emoji {
    font-size: 24px;
  }
  
  .welcome-text h1 {
    font-size: 24px;
  }
  
  .welcome-text p {
    font-size: 16px;
  }
  
  .main-content {
    padding: 16px 16px 24px 16px;
  }
}

@media (max-width: 480px) {
  .welcome-layout {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .welcome-text {
    text-align: center;
  }
}
</style>