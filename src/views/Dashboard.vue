<template>
  <!-- 数据统计 -->
  <div class="data-section">
    <n-grid :x-gap="16" :y-gap="16" cols="1 s:1 m:2 l:2 xl:2 2xl:2" responsive="screen">
      <!-- 视频统计 -->
      <n-gi>
        <n-card :bordered="false" class="data-card">
          <div class="card-header">
            <h3>视频创作统计</h3>
          </div>
          <div class="data-grid">
            <div class="data-item">
              <div class="data-box">
                <p class="label">今日</p>
                <p class="value">{{ statistics.todayVideos }}</p>
              </div>
            </div>
            <div class="data-item">
              <div class="data-box">
                <p class="label">本周</p>
                <p class="value">{{ statistics.weekVideos }}</p>
              </div>
            </div>
            <div class="data-item">
              <div class="data-box">
                <p class="label">本月</p>
                <p class="value">{{ statistics.monthVideos }}</p>
              </div>
            </div>
          </div>
        </n-card>
      </n-gi>

      <!-- 图片统计 -->
      <n-gi>
        <n-card :bordered="false" class="data-card">
          <div class="card-header">
            <h3>图片收集统计</h3>
          </div>
          <div class="data-grid">
            <div class="data-item">
              <div class="data-box">
                <p class="label">今日</p>
                <p class="value">{{ statistics.todayImages }}</p>
              </div>
            </div>
            <div class="data-item">
              <div class="data-box">
                <p class="label">本周</p>
                <p class="value">{{ statistics.weekImages }}</p>
              </div>
            </div>
            <div class="data-item">
              <div class="data-box">
                <p class="label">本月</p>
                <p class="value">{{ statistics.monthImages }}</p>
              </div>
            </div>
          </div>
        </n-card>
      </n-gi>

      <!-- 新增音频统计 -->
      <n-gi>
        <n-card :bordered="false" class="data-card">
          <div class="card-header">
            <h3>音频收集统计</h3>
          </div>
          <div class="data-grid">
            <div class="data-item">
              <div class="data-box">
                <p class="label">今日</p>
                <p class="value">{{ statistics.todayAudios }}</p>
              </div>
            </div>
            <div class="data-item">
              <div class="data-box">
                <p class="label">本周</p>
                <p class="value">{{ statistics.weekAudios }}</p>
              </div>
            </div>
            <div class="data-item">
              <div class="data-box">
                <p class="label">本月</p>
                <p class="value">{{ statistics.monthAudios }}</p>
              </div>
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>
  </div>

  <!-- 趋势图表 -->
  <div class="chart-section">
    <n-card :bordered="false">
      <LineChart :data="chartData" />
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Video, Photo } from '@vicons/tabler';
import LineChart from '@/components/LineChart.vue';

// 数据定义
const statistics = ref({
  todayVideos: 12,
  weekVideos: 85,
  monthVideos: 346,
  todayImages: 56,
  weekImages: 280,
  monthImages: 1200,
  todayAudios: 18, // 新增音频数据
  weekAudios: 120,
  monthAudios: 480
});

const maxTotal = computed(() => Math.max(
  statistics.value.todayVideos + statistics.value.todayImages,
  (statistics.value.weekVideos + statistics.value.weekImages) / 7,
  (statistics.value.monthVideos + statistics.value.monthImages) / 30
));

// 图表数据
const chartData = ref({
  labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  datasets: [
    {
      label: '视频创作量',
      data: [15, 20, 18, 25, 30, 22, 28],
      borderColor: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.1)',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: '#1890ff',
      tension: 0.4
    },
    {
      label: '图片收集量',
      data: [50, 60, 55, 70, 80, 65, 75],
      borderColor: '#36cfc9',
      backgroundColor: 'rgba(54, 207, 201, 0.1)',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: '#36cfc9',
      tension: 0.4
    },
    {
      label: '音频收集量',
      data: [10, 15, 12, 18, 20, 16, 22], // 新增音频数据
      borderColor: '#722ed1',
      backgroundColor: 'rgba(114, 46, 209, 0.1)',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: '#722ed1',
      tension: 0.4
    }
  ]
});

// 样式优化
const progressColors = [
  { color: '#36cfc9', percentage: 20 },
  { color: '#1890ff', percentage: 50 },
  { color: '#722ed1', percentage: 80 },
  { color: '#f5222d', percentage: 100 }
];
</script>

<style lang="less" scoped>
.dashboard-container {
  max-width: 1200px; // 限制最大宽度
  margin: 0 auto; // 居中显示
  padding: 32px; // 增加左右边距
}

.data-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;

  .card-header {
    padding-left: 24px; // 增加标题左边距
    h3 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
    }
  }

  .data-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    .data-item {
      &:nth-child(1) .data-box {
        background: linear-gradient(135deg, #e6f7ff, #bae7ff);
      }

      &:nth-child(2) .data-box {
        background: linear-gradient(135deg, #f6ffed, #d9f7be);
      }

      &:nth-child(3) .data-box {
        background: linear-gradient(135deg, #fff7e6, #ffe7ba);
      }

      .data-box {
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .label {
          font-size: 18px;
          color: #666;
          margin-bottom: 12px;
        }

        .value {
          font-size: 32px;
          font-weight: 700;
          color: #1890ff;
        }
      }
    }
  }
}

.chart-section {
  margin-top: 32px; // 增加顶部间距
  padding: 20px; // 增加内边距
}

// 新增音频统计卡片样式
.data-card:nth-child(3) {
  .data-grid {
    .data-item {
      &:nth-child(1) .data-box {
        background: linear-gradient(135deg, #f0f5ff, #d6e4ff);
      }
      &:nth-child(2) .data-box {
        background: linear-gradient(135deg, #f9f0ff, #efdbff);
      }
      &:nth-child(3) .data-box {
        background: linear-gradient(135deg, #fff0f6, #ffd6e7);
      }
    }
  }
}
</style>