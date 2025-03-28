<template>
  <div class="my-sound-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="朗读者">
          <a-input v-model:value="searchForm.reader" placeholder="输入朗读者" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="关联视频">
          <a-input v-model:value="searchForm.video" placeholder="输入关联视频" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="文本内容">
          <a-input v-model:value="searchForm.text" placeholder="输入文本内容" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 音频列表 -->
    <div class="sound-table">
      <a-table :columns="columns" :dataSource="currentPageSounds" :pagination="false" rowKey="id" size="middle">
        <template #index="{ index }">
          {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
        </template>

        <template #duration="{ record }">
          {{ formatDuration(record.duration) }}
        </template>

        <template #text="{ record }">
          <a-textarea
            v-model:value="record.text"
            :autoSize="{ minRows: 2, maxRows: 4 }"
            @blur="handleTextUpdate(record)"
          />
        </template>

        <template #video="{ record }">
          <a-tag color="blue">{{ record.video }}</a-tag>
        </template>

        <template #action="{ record }">
          <a-button type="link" size="small" @click="toggleAudioPlay(record)">
            <play-circle-outlined /> 播放
          </a-button>
          <a-button type="link" size="small" @click="regenerateAudio(record)">
            <reload-outlined /> 重新生成
          </a-button>
        </template>
      </a-table>
    </div>

    <!-- 分页控制 -->
    <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize" :total="pagination.total"
      @change="handlePaginationChange" />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination.vue';

// 搜索表单
const searchForm = reactive({
  reader: '',
  video: '',
  text: ''
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center',
    slots: { customRender: 'index' }
  },
  {
    title: '朗读者',
    dataIndex: 'reader',
    key: 'reader',
    width: 150
  },
  {
    title: '声音时长',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    align: 'center',
    slots: { customRender: 'duration' }
  },
  {
    title: '文本信息',
    key: 'text',
    slots: { customRender: 'text' }
  },
  {
    title: '关联视频',
    key: 'video',
    slots: { customRender: 'video' }
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    align: 'center',
    slots: { customRender: 'action' }
  }
];

// 音频数据
const soundData = ref([
  // 示例数据
  {
    id: 1,
    reader: '张三',
    duration: 120,
    text: '这是一个示例文本',
    video: '示例视频1.mp4',
    audioUrl: 'https://example.com/audio1.mp3'
  },
  // 更多示例数据...
]);

// 当前页显示的音频
const currentPageSounds = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredSounds.value.slice(start, end);
});

// 过滤后的音频
const filteredSounds = computed(() => {
  const filtered = soundData.value.filter(sound => {
    const readerMatch = sound.reader.toLowerCase().includes(searchForm.reader.toLowerCase());
    const videoMatch = sound.video.toLowerCase().includes(searchForm.video.toLowerCase());
    const textMatch = sound.text.toLowerCase().includes(searchForm.text.toLowerCase());
    return readerMatch && videoMatch && textMatch;
  });

  pagination.total = filtered.length;
  return filtered;
});

// 格式化时长
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
};

// 重置搜索
const resetSearch = () => {
  searchForm.reader = '';
  searchForm.video = '';
  searchForm.text = '';
  handleSearch();
};

// 处理分页变化
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.current = current;
  pagination.pageSize = pageSize;
};

// 处理文本更新
const handleTextUpdate = (record) => {
  // 实现文本更新保存逻辑
  message.success('文本更新成功');
};

// 切换音频播放
const toggleAudioPlay = (record) => {
  // 实现音频播放/暂停逻辑
};

// 重新生成音频
const regenereateAudio = (record) => {
  // 实现重新生成音频逻辑
};
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

.sound-table {
  flex: 1;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}
</style>