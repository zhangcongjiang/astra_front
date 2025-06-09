<template>
  <div class="music-list-container">
    <!-- 调试信息 -->
    <div v-if="false" style="color: red;">
      isSelectMode: {{ isSelectMode }},
      route.query: {{ route.query }}
    </div>
    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-header">
        <a-radio-group v-model:value="searchType" size="small">
          <a-radio-button value="basic">基础查询</a-radio-button>
          <a-radio-button value="tag">标签查询</a-radio-button>
        </a-radio-group>
      </div>

      <!-- 基础查询表单 -->
      <div class="basic-search" v-if="searchType === 'basic'">
        <a-form layout="inline" :model="basicForm">
          <a-form-item label="音乐名称">
            <a-input v-model:value="basicForm.name" placeholder="输入音乐名称" @pressEnter="handleSearch" />
          </a-form-item>
          <a-form-item label="歌手">
            <a-input v-model:value="basicForm.artist" placeholder="输入歌手名称" @pressEnter="handleSearch" />
          </a-form-item>
          <a-form-item label="上传时间">
            <a-range-picker v-model:value="basicForm.dateRange" :show-time="{ format: 'HH:mm' }"
              format="YYYY-MM-DD HH:mm" :placeholder="['开始时间', '结束时间']" @change="handleDateChange" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="resetBasicSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 标签查询 -->
      <div class="tag-search" v-if="searchType === 'tag'">
        <TagSearch :tags="tagCategories" :showActions="true" v-model:selectedTags="selectedTags"
          @search="handleSearch" />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-area">
      <a-space>
        <a-button type="primary" @click="showUploadModal" style="float: right;">
          <template #icon>
            <upload-outlined />
          </template>
          上传音乐
        </a-button>
      </a-space>
    </div>

    <!-- 上传音乐模态框 -->
    <a-modal v-model:visible="uploadModalVisible" title="上传音乐" width="800px" :maskClosable="false" @ok="handleUploadSubmit" @cancel="closeUploadModal">
      <a-form :model="uploadForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" ref="uploadFormRef">
        <a-form-item label="音乐名称" name="name" :rules="[{ required: true, message: '请输入音乐名称' }]">
          <a-input v-model:value="uploadForm.name" placeholder="请输入音乐名称" />
        </a-form-item>
        <a-form-item label="歌手" name="artist" :rules="[{ required: true, message: '请输入歌手名称' }]">
          <a-input v-model:value="uploadForm.artist" placeholder="请输入歌手名称" />
        </a-form-item>
        <a-form-item label="分类" name="category" :rules="[{ required: true, message: '请选择分类' }]">
  <a-select v-model:value="uploadForm.category" placeholder="请选择分类">
    <a-select-option value="BGM">背景音乐</a-select-option>
    <a-select-option value="EFFECT">音效</a-select-option>
    <a-select-option value="MUSIC">音乐</a-select-option>
  </a-select>
</a-form-item>

        <a-form-item label="音乐文件" name="audioFile" :rules="[{ required: true, message: '请上传音乐文件' }]">
          <a-upload
            :before-upload="() => false"
            :show-upload-list="false"
            @change="handleFileChange"
            accept=".mp3,.wav"
          >
            <a-button>选择音乐文件</a-button>
          </a-upload>
          <div v-if="uploadForm.audioFile" class="file-info">
            已选择: {{ uploadForm.audioFile.name }}
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 音乐列表 -->
    <div class="music-table">
      <a-table :columns="columns" :dataSource="currentPageMusics" :pagination="false" :rowKey="record => record.id"
        size="middle">
        <template #index="{ index }">
          {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
        </template>

        <template #name="{ record }">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>{{ record.name }}</span>
          </div>
        </template>

        <template #duration="{ record }">
          {{ formatDuration(record.duration) }}
        </template>

        <template #uploadTime="{ record }">
          {{ formatDate(record.uploadTime) }}
        </template>

        <template #tags="{ record }">
          <div class="music-tags">
            <a-tag v-for="tag in getTagNames(record.tags)" :key="tag" color="blue">{{ tag }}</a-tag>
          </div>
        </template>

        <template #action="{ record }">
          <div style="display: flex; gap: 4px;">
            <!-- 选择按钮（仅在选择模式显示） -->
            <a-button v-if="isSelectMode" type="primary" size="small" @click.stop="handleSelect(record)">
              选择
            </a-button>
            <a-button type="link" size="small" @click="previewMusic(record)">
              播放
            </a-button>
            <a-button type="link" size="small" @click="showEditModal(record)">
              编辑
            </a-button>
            <a-popconfirm title="确认要删除这首音乐吗？" ok-text="确认" cancel-text="取消" @confirm="() => deleteMusic(record.id)">
              <a-button type="link" size="small" danger>
                删除
              </a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </div>

    <!-- 分页控制 -->
    <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize" :total="pagination.total"
      @change="handlePaginationChange" />

    <!-- 音乐编辑模态框 -->
    <a-modal v-model:visible="editModalVisible" :title="currentMusic ? '编辑音乐信息' : '添加音乐'" width="800px"
      :maskClosable="false" @ok="handleEditSubmit" @cancel="closeEditModal">
      <a-form :model="musicForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" ref="musicFormRef">
        <a-form-item label="音乐名称" name="name" :rules="[{ required: true, message: '请输入音乐名称' }]">
          <a-input v-model:value="musicForm.name" placeholder="请输入音乐名称" />
        </a-form-item>
        <a-form-item label="歌手" name="artist" :rules="[{ required: true, message: '请输入歌手名称' }]">
          <a-input v-model:value="musicForm.artist" placeholder="请输入歌手名称" />
        </a-form-item>
        <a-form-item label="音乐文件" v-if="!currentMusic">
          <a-upload :beforeUpload="() => false" :showUploadList="false" @change="handleFileChange">
            <a-button>选择音乐文件</a-button>
          </a-upload>
          <div v-if="musicForm.audioFile" class="file-info">
            已选择: {{ musicForm.audioFile.name }}
          </div>
        </a-form-item>
        <a-form-item label="时长" v-if="currentMusic">
          {{ formatDuration(musicForm.duration) }}
        </a-form-item>
        <a-form-item label="上传时间" v-if="currentMusic">
          {{ formatDate(musicForm.uploadTime) }}
        </a-form-item>
        <a-form-item label="音乐标签">
          <TagSearch :tags="tagCategories" :show-actions="false" :allow-image-tagging="true"
            :image-tags="musicForm.tags" @add-image-tag="addMusicTag" @remove-image-tag="removeMusicTag" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import TagSearch from '@/components/TagSearch.vue'
import Pagination from '@/components/Pagination.vue'
import { useRoute, useRouter } from 'vue-router'
import {  
    uploadSound } from '@/api/modules/voiceApi';

// Initialize router and route
const router = useRouter()
const route = useRoute()

// Search type should be defined before any computed properties that use it
const searchType = ref('basic')

// Ensure these are properly initialized
const isSelectMode = computed(() => route.query?.selectMode === 'true')
const returnPath = computed(() => route.query?.returnPath || '')
const templateId = computed(() => route.query?.templateId || '')

// 基础查询表单
const basicForm = reactive({
  name: '',
  artist: '',
  dateRange: [],
  startTime: null,
  endTime: null
});

// 标签数据
const tagCategories = ref([
  {
    id: 1,
    name: '风格',
    tags: [
      { id: 'genre_1', name: '流行' },
      { id: 'genre_2', name: '摇滚' },
      { id: 'genre_3', name: '电子' },
      { id: 'genre_4', name: '古典' },
      { id: 'genre_5', name: '爵士' },
      { id: 'genre_6', name: '民谣' }
    ]
  },
  {
    id: 2,
    name: '情绪',
    tags: [
      { id: 'mood_1', name: '欢快' },
      { id: 'mood_2', name: '悲伤' },
      { id: 'mood_3', name: '放松' },
      { id: 'mood_4', name: '激动' }
    ]
  }
]);

// 选中的标签
const selectedTags = ref([]);

// 音乐数据
const musicData = ref([
  {
    id: 1,
    name: '示例音乐1',
    artist: '示例歌手',
    duration: 213,
    uploadTime: dayjs().format('YYYY-MM-DD HH:mm'),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    tags: ['genre_1', 'mood_1']
  },
  {
    id: 2,
    name: '示例音乐2',
    artist: '示例歌手',
    duration: 184,
    uploadTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    tags: ['genre_2', 'mood_3']
  },
  // 更多示例音乐...
  ...generateMockMusics(18)
]);

// 播放状态
const currentPlaying = ref({ id: null });
const isPlaying = ref(false);

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
    title: '音乐名称',
    dataIndex: 'name',
    key: 'name',
    slots: { customRender: 'name' }
  },
  {
    title: '时长',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    align: 'center',
    slots: { customRender: 'duration' }
  },
  {
    title: '歌手',
    dataIndex: 'artist',
    key: 'artist',
    width: 150
  },
  {
    title: '上传时间',
    dataIndex: 'uploadTime',
    key: 'uploadTime',
    width: 180,
    align: 'center',
    slots: { customRender: 'uploadTime' }
  },
  {
    title: '标签',
    key: 'tags',
    slots: { customRender: 'tags' }
  },
  {
    title: '操作',
    key: 'action',
    width: 220,  // 从150调整为220
    align: 'center',
    slots: { customRender: 'action' }
  }
];

// 编辑模态框相关状态
const editModalVisible = ref(false);
const currentMusic = ref(null);
const musicForm = reactive({
  id: null,
  name: '',
  artist: '',
  duration: 0,
  uploadTime: '',
  audioFile: null,
  audioUrl: '',
  tags: []
});
const musicFormRef = ref(null);

// 生成模拟音乐数据
function generateMockMusics(count) {
  const mockMusics = [];
  const genres = ['genre_1', 'genre_2', 'genre_3', 'genre_4', 'genre_5', 'genre_6'];
  const moods = ['mood_1', 'mood_2', 'mood_3', 'mood_4'];
  const artists = ['周杰伦', '林俊杰', '邓紫棋', '王菲', '张学友', '陈奕迅', 'Taylor Swift', 'Ed Sheeran'];
  const audioUrls = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  ];

  for (let i = 1; i <= count; i++) {
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const randomArtist = artists[Math.floor(Math.random() * artists.length)];
    const randomAudioUrl = audioUrls[Math.floor(Math.random() * audioUrls.length)];

    mockMusics.push({
      id: i + 2, // 从3开始，避免与示例音乐ID冲突
      name: `音乐${i}`,
      artist: randomArtist,
      duration: Math.floor(Math.random() * 300) + 60, // 60-360秒
      uploadTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm'),
      audioUrl: randomAudioUrl,
      tags: [randomGenre, randomMood]
    });
  }

  return mockMusics;
}

// 根据标签ID获取标签名称
const getTagNames = (tagIds) => {
  const names = [];
  tagIds.forEach(tagId => {
    const foundTag = findTagById(tagId);
    if (foundTag) names.push(foundTag.name);
  });
  return names;
};

// 根据标签ID查找标签
const findTagById = (tagId) => {
  for (const category of tagCategories.value) {
    const foundTag = category.tags.find(t => t.id === tagId);
    if (foundTag) return foundTag;
  }
  return null;
};

// 格式化时长
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

// 当前页显示的音乐
const currentPageMusics = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredMusics.value.slice(start, end);
});

// 过滤后的音乐
const filteredMusics = computed(() => {
  const filtered = musicData.value.filter(music => {
    // 基础查询过滤
    if (searchType.value === 'basic') {
      const nameMatch = music.name.toLowerCase().includes(basicForm.name.toLowerCase());
      const artistMatch = music.artist.toLowerCase().includes(basicForm.artist.toLowerCase());
      let dateMatch = true;

      if (basicForm.startTime && basicForm.endTime) {
        const musicDate = dayjs(music.uploadTime);
        dateMatch = musicDate.isAfter(basicForm.startTime) &&
          musicDate.isBefore(basicForm.endTime);
      }

      return nameMatch && artistMatch && dateMatch;
    }

    // 标签查询过滤
    if (searchType.value === 'tag' && selectedTags.value.length > 0) {
      return selectedTags.value.some(tagId => music.tags.includes(tagId));
    }

    return true;
  });

  pagination.total = filtered.length;
  return filtered;
});

// 切换播放状态
const togglePlay = (music) => {
  const audioElement = document.querySelector(`audio[ref="audioPlayer_${music.id}"]`);

  if (!audioElement) return;

  // 如果点击的是当前正在播放的音乐
  if (currentPlaying.value.id === music.id) {
    if (isPlaying.value) {
      audioElement.pause();
      isPlaying.value = false;
    } else {
      audioElement.play();
      isPlaying.value = true;
    }
  }
  // 如果点击的是其他音乐
  else {
    // 停止当前播放的音乐
    if (currentPlaying.value.id) {
      const prevAudioElement = document.querySelector(`audio[ref="audioPlayer_${currentPlaying.value.id}"]`);
      if (prevAudioElement) {
        prevAudioElement.pause();
        prevAudioElement.currentTime = 0;
      }
    }

    // 播放新选择的音乐
    currentPlaying.value = music;
    audioElement.currentTime = 0;
    audioElement.play();
    isPlaying.value = true;
  }
};

// 音频结束处理
const handleAudioEnded = () => {
  isPlaying.value = false;
  currentPlaying.value = { id: null };
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
};

// 日期范围变化处理
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    basicForm.startTime = dates[0];
    basicForm.endTime = dates[1];
  } else {
    basicForm.startTime = null;
    basicForm.endTime = null;
  }
};

// 重置基础查询
const resetBasicSearch = () => {
  basicForm.name = '';
  basicForm.artist = '';
  basicForm.dateRange = [];
  basicForm.startTime = null;
  basicForm.endTime = null;
  handleSearch();
};

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.current = current;
  pagination.pageSize = pageSize;
};
// 在script setup中添加
const uploadModalVisible = ref(false);
const uploadForm = reactive({
  name: '',
  artist: '',
  category: 'SOUND',
  audioFile: null
});

const handleUploadSubmit = async () => {
  try {
    const formData = new FormData();
    formData.append('file', uploadForm.audioFile);
    formData.append('name', uploadForm.name);
    formData.append('category', uploadForm.category);
    formData.append('singer', uploadForm.artist);

    const { data } = await uploadSound(formData);
    message.success('上传成功');
    closeUploadModal();
    fetchMusics();
  } catch (error) {
    message.error(error.message || '上传失败');
  }
};
const uploadFormRef = ref(null);

const showUploadModal = () => {
  uploadModalVisible.value = true;
};

const closeUploadModal = () => {
  uploadModalVisible.value = false;
  uploadFormRef.value?.resetFields();
  uploadForm.audioFile = null;
};


// 处理文件选择
const handleFileChange = (info) => {
  const file = info.file
  const isAudio = file.type.includes('audio') || ['mp3', 'wav'].includes(file.name.split('.').pop().toLowerCase())
  if (!isAudio) {
    message.error('请上传音频文件 (MP3/WAV)')
    return
  }
  uploadForm.audioFile = file
}
const handleSelect = (music) => {
  if (isSelectMode.value) {
    router.push({
      path: returnPath.value,
      query: {
        ...route.query,  // 保留所有现有query参数
        music: JSON.stringify({
          id: music.id,
          name: music.name,
          url: music.audioUrl,
          duration: music.duration
        }),
        templateId: templateId.value
      }
    });
  }
};

// 获取音频时长
const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();

    reader.onload = function (e) {
      audioContext.decodeAudioData(e.target.result, function (buffer) {
        resolve(Math.round(buffer.duration));
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

// 显示编辑模态框
const showEditModal = (music) => {
  currentMusic.value = music;
  musicForm.id = music.id;
  musicForm.name = music.name;
  musicForm.artist = music.artist;
  musicForm.duration = music.duration;
  musicForm.uploadTime = music.uploadTime;
  musicForm.audioUrl = music.audioUrl;
  musicForm.tags = [...music.tags];
  editModalVisible.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
  editModalVisible.value = false;
  currentMusic.value = null;
  musicForm.audioFile = null;
  musicFormRef.value?.resetFields();
};

// 添加音乐标签
const addMusicTag = (tagId) => {
  if (!musicForm.tags.includes(tagId)) {
    musicForm.tags.push(tagId);
  }
};

// 移除音乐标签
const removeMusicTag = (tagId) => {
  const index = musicForm.tags.indexOf(tagId);
  if (index > -1) {
    musicForm.tags.splice(index, 1);
  }
};

// 提交编辑
const handleEditSubmit = async () => {
  try {
    await musicFormRef.value.validate();

    if (currentMusic.value) {
      // 更新音乐信息
      const index = musicData.value.findIndex(m => m.id === musicForm.id);
      if (index !== -1) {
        musicData.value[index] = {
          ...musicData.value[index],
          name: musicForm.name,
          artist: musicForm.artist,
          // 保持原有duration、uploadTime和audioUrl不变
          tags: [...musicForm.tags]
        };
      }
    } else {
      // 添加新音乐
      musicData.value.unshift({
        id: Date.now(),
        name: musicForm.name,
        artist: musicForm.artist,
        duration: musicForm.duration,
        uploadTime: dayjs().format('YYYY-MM-DD HH:mm'),
        audioUrl: musicForm.audioUrl,
        tags: [...musicForm.tags]
      });
    }

    message.success('保存成功');
    closeEditModal();
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 删除音乐
const deleteMusic = (musicId) => {
  const index = musicData.value.findIndex(m => m.id === musicId);
  if (index !== -1) {
    // 如果正在播放的是要删除的音乐，先停止播放
    if (currentPlaying.value.id === musicId) {
      const audioElement = document.querySelector(`audio[ref="audioPlayer_${musicId}"]`);
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      currentPlaying.value = { id: null };
      isPlaying.value = false;
    }

    musicData.value.splice(index, 1);
    message.success('删除成功');
  } else {
    message.error('删除失败');
  }
};

// 初始化
onMounted(() => {
  pagination.total = musicData.value.length;
});

// 组件卸载时停止所有音频
onUnmounted(() => {
  if (currentPlaying.value.id) {
    const audioElement = document.querySelector(`audio[ref="audioPlayer_${currentPlaying.value.id}"]`);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }
});
</script>

<style scoped>
.ant-select {
  width: 200px;
}


.music-list-container {
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

.search-header {
  margin-bottom: 16px;
}

.basic-search .ant-form-item {
  margin-bottom: 16px;
}

.tag-search {
  margin-top: 16px;
}

.music-table {
  flex: 1;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.music-name-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.music-name-text {
  flex: 1;
}

.play-icon-wrapper {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.play-icon {
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: flex-end;
}

.play-bar {
  width: 3px;
  background-color: #1890ff;
  margin-right: 2px;
  transition: all 0.3s ease;
}

.play-bar1 {
  height: 8px;
}

.play-bar2 {
  height: 12px;
}

.play-bar3 {
  height: 16px;
}

.play-icon.playing .play-bar1 {
  animation: equalize 0.8s infinite alternate;
  animation-delay: -0.4s;
}

.play-icon.playing .play-bar2 {
  animation: equalize 0.8s infinite alternate;
  animation-delay: -0.2s;
}

.play-icon.playing .play-bar3 {
  animation: equalize 0.8s infinite alternate;
  animation-delay: -0.6s;
}

@keyframes equalize {
  0% {
    height: 8px;
  }

  50% {
    height: 4px;
  }

  100% {
    height: 16px;
  }
}

.music-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.file-info {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

:deep(.tag-search-in-modal) {
  box-shadow: none;
  padding: 0;
}

:deep(.tag-search-in-modal .tags-container) {
  max-height: 120px;
}

.action-area {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.ant-btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
}

.ant-btn-primary:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}
</style>
