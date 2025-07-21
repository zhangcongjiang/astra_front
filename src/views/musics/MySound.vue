<template>
  <div class="my-sound-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="视频名称">
          <a-input 
            v-model:value="searchForm.video_name" 
            placeholder="输入视频名称" 
            @pressEnter="handleSearch" 
          />
        </a-form-item>
        <a-form-item label="朗读者名称">
          <a-input 
            v-model:value="searchForm.speaker_name" 
            placeholder="输入朗读者名称" 
            @pressEnter="handleSearch" 
          />
        </a-form-item>
        <a-form-item label="创建人">
          <a-input 
            v-model:value="searchForm.creator" 
            placeholder="输入创建人" 
            @pressEnter="handleSearch" 
          />
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker 
            v-model:value="searchForm.dateRange" 
            :show-time="{ format: 'HH:mm' }"
            format="YYYY-MM-DD HH:mm" 
            :placeholder="['开始时间', '结束时间']" 
            @change="handleDateChange" 
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch" :loading="loading">查询</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 音频列表 -->
    <div class="sound-table">
      <a-table 
        :columns="columns" 
        :dataSource="soundData" 
        :pagination="false" 
        :loading="loading"
        rowKey="id" 
        size="middle"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>

          <template v-if="column.key === 'speaker_name'">
            <a-tag color="green">{{ record.speaker_name || '未知朗读者' }}</a-tag>
          </template>

          <template v-if="column.key === 'duration'">
            <span class="duration-text">{{ formatDuration(record.duration) }}</span>
          </template>

          <template v-if="column.key === 'txt'">
            <div class="text-content">
              <a-typography-paragraph 
                :ellipsis="{ rows: 3, expandable: true, symbol: '展开' }"
                :content="record.txt"
              />
            </div>
          </template>

          <template v-if="column.key === 'video_id'">
            <a-tag color="blue">{{ record.video_id || '无关联视频' }}</a-tag>
          </template>

          <template v-if="column.key === 'creator'">
            <span>{{ record.creator }}</span>
          </template>

          <template v-if="column.key === 'create_time'">
            <span>{{ formatTime(record.create_time) }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a-button 
                type="link" 
                size="small" 
                @click="playAudio(record)"
                :loading="playingId === record.id"
              >
                <template #icon>
                  <play-circle-outlined v-if="playingId !== record.id" />
                  <pause-circle-outlined v-else />
                </template>
                {{ playingId === record.id ? '暂停' : '播放' }}
              </a-button>
              <a-button 
                type="link" 
                size="small" 
                @click="downloadAudio(record)"
              >
                <template #icon><download-outlined /></template>
                下载
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 分页控制 -->
    <Pagination 
      v-model:current="pagination.current" 
      v-model:pageSize="pagination.pageSize" 
      :total="pagination.total"
      @change="handlePaginationChange" 
    />

    <!-- 音频播放器 -->
    <audio 
      ref="audioPlayer" 
      @ended="onAudioEnded"
      @error="onAudioError"
      style="display: none;"
    ></audio>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  DownloadOutlined 
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination.vue';
import { getTtsList, ttsPlay } from '@/api/modules/voiceApi';

// 搜索表单
const searchForm = reactive({
  video_name: '',
  speaker_name: '',
  creator: '',
  dateRange: [],
  start_date: '',
  end_date: ''
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
});

// 加载状态
const loading = ref(false);

// 音频播放相关
const audioPlayer = ref(null);
const playingId = ref(null);
const currentAudioUrl = ref('');

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center'
  },
  {
    title: '朗读者',
    key: 'speaker_name',
    width: 120,
    align: 'center'
  },
  {
    title: '时长',
    key: 'duration',
    width: 80,
    align: 'center'
  },
  {
    title: '文本内容',
    key: 'txt',
    width: 300
  },
  {
    title: '关联视频',
    key: 'video_id',
    width: 150,
    align: 'center'
  },
  {
    title: '创建人',
    key: 'creator',
    width: 100,
    align: 'center'
  },
  {
    title: '创建时间',
    key: 'create_time',
    width: 160,
    align: 'center'
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center',
    fixed: 'right'
  }
];

// 音频数据
const soundData = ref([]);

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return dayjs(timeStr).format('YYYY-MM-DD HH:mm');
};

// 获取TTS音频列表
const fetchTtsList = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      ...searchForm
    };
    
    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await getTtsList(params);
    
    // 修改这里：使用 code === 0 而不是 code === 200
    if (response.code === 0) {
      soundData.value = response.data.results || response.data;
      pagination.total = response.data.count || response.data.length;
    } else {
      message.error(response.message || '获取音频列表失败');
    }
  } catch (error) {
    console.error('获取音频列表失败:', error);
    message.error('获取音频列表失败');
  } finally {
    loading.value = false;
  }
};

// 播放音频
const playAudio = async (record) => {
  try {
    // 如果正在播放同一个音频，则暂停
    if (playingId.value === record.id) {
      audioPlayer.value.pause();
      playingId.value = null;
      return;
    }

    // 停止当前播放的音频
    if (playingId.value) {
      audioPlayer.value.pause();
    }

    playingId.value = record.id;
    
    // 获取音频播放信息
    const response = await ttsPlay(record.id);
    
    // 修改这里：使用 code === 0 而不是 code === 200
    if (response.code === 0) {
      const audioInfo = response.data;
      const audioUrl = `${window.location.origin}/${audioInfo.file_path}`;
      
      // 设置音频源并播放
      audioPlayer.value.src = audioUrl;
      currentAudioUrl.value = audioUrl;
      
      await nextTick();
      await audioPlayer.value.play();
      
      message.success('开始播放音频');
    } else {
      message.error(response.message || '获取音频失败');
      playingId.value = null;
    }
  } catch (error) {
    console.error('播放音频失败:', error);
    message.error('播放音频失败');
    playingId.value = null;
  }
};

// 下载音频
const downloadAudio = async (record) => {
  try {
    const response = await ttsPlay(record.id);
    
    // 修改这里：使用 code === 0 而不是 code === 200
    if (response.code === 0) {
      const audioInfo = response.data;
      const audioUrl = `${window.location.origin}/${audioInfo.file_path}`;
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `tts_${record.id}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('开始下载音频');
    } else {
      message.error(response.message || '获取音频失败');
    }
  } catch (error) {
    console.error('下载音频失败:', error);
    message.error('下载音频失败');
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchTtsList();
};

// 日期范围变化处理
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.start_date = dayjs(dates[0]).format('YYYY-MM-DD');
    searchForm.end_date = dayjs(dates[1]).format('YYYY-MM-DD');
  } else {
    searchForm.start_date = '';
    searchForm.end_date = '';
  }
};

// 重置搜索
const resetSearch = () => {
  searchForm.video_name = '';
  searchForm.speaker_name = '';
  searchForm.creator = '';
  searchForm.dateRange = [];
  searchForm.start_date = '';
  searchForm.end_date = '';
  handleSearch();
};

// 处理分页变化
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.current = current;
  pagination.pageSize = pageSize;
  fetchTtsList();
};

// 音频播放结束
const onAudioEnded = () => {
  playingId.value = null;
};

// 音频播放错误
const onAudioError = () => {
  message.error('音频播放出错');
  playingId.value = null;
};

// 组件挂载时获取数据
onMounted(() => {
  fetchTtsList();
});
</script>

<style scoped>
.my-sound-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-area .ant-form-item {
  margin-bottom: 16px;
}

.sound-table {
  flex: 1;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.duration-text {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.text-content {
  max-width: 300px;
}

:deep(.ant-typography) {
  margin-bottom: 0;
}

:deep(.ant-table-tbody > tr > td) {
  vertical-align: top;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}
</style>