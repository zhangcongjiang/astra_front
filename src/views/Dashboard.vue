<template>
  <div class="dashboard-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <h1>欢迎回来！</h1>
      <p>这里是您的创作控制中心，快速开始您的工作</p>
    </div>

    <!-- 快捷操作区域 -->
    <div class="quick-actions">
      <h2>快捷操作</h2>
      <div class="action-grid">
        <el-card 
          v-for="action in quickActions" 
          :key="action.id" 
          shadow="hover" 
          class="action-card"
          @click="handleQuickAction(action.path)"
        >
          <div class="action-content">
            <el-icon :size="32" :color="action.color">
              <component :is="action.icon" />
            </el-icon>
            <span>{{ action.name }}</span>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 数据统计区域 -->
    <div class="stats-section">
      <h2>数据概览</h2>
      <div class="stats-grid">
        <el-card 
          v-for="stat in stats" 
          :key="stat.id" 
          shadow="hover" 
          class="stat-card"
        >
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.bgColor }">
              <el-icon :size="24" color="white">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activity">
      <h2>最近活动</h2>
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in activities"
          :key="index"
          :timestamp="activity.time"
          :color="activity.color"
          placement="top"
        >
          <el-card>
            <div class="activity-content">
              <el-icon :size="20" :color="activity.color">
                <component :is="activity.icon" />
              </el-icon>
              <span>{{ activity.content }}</span>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Picture,
  Headset,
  VideoCamera,
  MagicStick,
  DataLine,
  User,
  Setting,
  Clock,
  DocumentAdd,
  Collection,
  VideoPlay
} from '@element-plus/icons-vue'

const router = useRouter()

// 快捷操作
const quickActions = ref([
  { id: 1, name: '新建图片', icon: Picture, color: '#67C23A', path: '/images' },
  { id: 2, name: '添加音乐', icon: Headset, color: '#409EFF', path: '/musics' },
  { id: 3, name: '创建视频', icon: VideoCamera, color: '#E6A23C', path: '/templates' },
  { id: 4, name: '特效制作', icon: MagicStick, color: '#F56C6C', path: '/effects' },
  { id: 5, name: '数据可视化', icon: DataLine, color: '#909399', path: '/data-visuals' },
  { id: 6, name: '个人中心', icon: User, color: '#9C27B0', path: '/my-videos' }
])

// 统计数据
const stats = ref([
  { id: 1, label: '图片数量', value: '128', icon: Collection, bgColor: '#67C23A' },
  { id: 2, label: '音频数量', value: '56', icon: Headset, bgColor: '#409EFF' },
  { id: 3, label: '视频模板', value: '24', icon: VideoPlay, bgColor: '#E6A23C' },
  { id: 4, label: '我的作品', value: '18', icon: DocumentAdd, bgColor: '#F56C6C' }
])

// 最近活动
const activities = ref([
  { 
    time: '2023-11-15 14:30', 
    content: '创建了新的视频作品《秋日回忆》', 
    icon: VideoCamera, 
    color: '#409EFF' 
  },
  { 
    time: '2023-11-14 10:15', 
    content: '上传了5张背景图片', 
    icon: Picture, 
    color: '#67C23A' 
  },
  { 
    time: '2023-11-13 16:45', 
    content: '修改了系统音频设置', 
    icon: Setting, 
    color: '#909399' 
  },
  { 
    time: '2023-11-12 09:20', 
    content: '添加了3首背景音乐', 
    icon: Headset, 
    color: '#409EFF' 
  }
])

const handleQuickAction = (path) => {
  router.push(path)
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 30px;
}

.welcome-section h1 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 8px;
}

.welcome-section p {
  font-size: 16px;
  color: #7f8c8d;
}

.quick-actions,
.stats-section,
.recent-activity {
  margin-bottom: 30px;
}

h2 {
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.action-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.action-content span {
  margin-top: 10px;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 15px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.activity-content {
  display: flex;
  align-items: center;
}

.activity-content span {
  margin-left: 10px;
}
</style>