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
          <a-form-item label="音频类型">
            <a-select v-model:value="basicForm.category" placeholder="选择音频类型" style="width: 120px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="BGM">BGM</a-select-option>
              <a-select-option value="SOUND">音乐</a-select-option>
              <a-select-option value="EFFECT">特效音</a-select-option>
            </a-select>
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
    <a-modal v-model:visible="uploadModalVisible" title="上传音乐" width="800px" :maskClosable="false"
      @ok="handleUploadSubmit" @cancel="closeUploadModal">
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
            <a-select-option value="SOUND">音乐</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="音乐文件" name="audioFile" :rules="[{ required: true, message: '请上传音乐文件' }]">
          <a-upload :before-upload="() => false" :show-upload-list="false" @change="handleFileChange"
            accept=".mp3,.wav">
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
          <div style="text-align: center;">
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
          <div style="text-align: center;">
            <div class="music-tags" style="display: flex; justify-content: center; align-items: center;">
              <a-tag v-for="tag in getTagNames(record.tags)" :key="tag.id" color="blue" closable
                @close="removeMusicTag(record, tag.id)">
                {{ tag.name }}
              </a-tag>
              <a-tooltip title="编辑标签">
                <tags-outlined @click.stop="showTagEditor(record)"
                  style="cursor: pointer; color: #1890ff; margin-left: 8px;" />
              </a-tooltip>
            </div>
          </div>
        </template>

        <template #action="{ record }">
          <div style="text-align: center;gap: 4px;">

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
import { request } from '@/api/config/request';
import { ref, reactive, computed, onMounted } from 'vue'
import { EditOutlined, DeleteOutlined, UploadOutlined, TagsOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import TagSearch from '@/components/TagSearch.vue'
import Pagination from '@/components/Pagination.vue'
import { useRoute, useRouter } from 'vue-router'
import {
  uploadSound,
  getSoundList,
  soundPlay
} from '@/api/modules/voiceApi';

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
  category: '', // 新增音频类型筛选
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
const musicData = ref([]);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 获取音乐列表
const fetchMusicList = async (params = {}) => {
  try {
    // 基础参数
    const baseParams = {
      page: pagination.current,
      page_size: pagination.pageSize
    };

    // 根据搜索类型添加不同参数
    if (searchType.value === 'basic') {
      if (basicForm.name) baseParams.name = basicForm.name;
      if (basicForm.artist) baseParams.singer = basicForm.artist;
      if (basicForm.category) baseParams.category = basicForm.category;
      if (basicForm.startTime) baseParams.start_time = dayjs(basicForm.startTime).format('YYYY-MM-DD HH:mm:ss');
      if (basicForm.endTime) baseParams.end_time = dayjs(basicForm.endTime).format('YYYY-MM-DD HH:mm:ss');
    } else if (searchType.value === 'tag' && selectedTags.value.length > 0) {
      baseParams.tags = selectedTags.value.join(',');
    }

    // 合并传入的参数
    const finalParams = { ...baseParams, ...params };

    const res = await getSoundList(finalParams);

    if (res.code === 0) {
      musicData.value = res.data.results.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        artist: item.singer || '',
        duration: item.spec?.duration || 0,
        uploadTime: item.create_time,
        audioUrl: item.sound_path,
        tags: item.tags || []
      }));

      pagination.total = res.data.count;
    } else {
      message.error(res.message || '获取音乐列表失败');
    }
  } catch (error) {
    message.error('获取音乐列表失败');
    console.error(error);
  }
};

// 分页变化处理
const handlePaginationChange = (page, pageSize) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchMusicList();
};

// 初始化获取数据
onMounted(() => {
  fetchMusicList();
});

// 格式化日期
const formatDate = (dateStr) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
};
const audioPlayer = ref(null);

const previewMusic = async (music) => {
  try {
    const response = await soundPlay(music.id);
    if (response && response.data && response.data.file_path) {
      const filePath = response.data.file_path;
      // 根据 file_path 去后端获取音频文件
      console.log('准备播放的文件路径:', filePath);
      const audioResponse = await request({
        method: 'get',
        url: `/${filePath}`,
        responseType: 'arraybuffer' // 获取二进制数据
      });

      // 音频播放逻辑
      const blob = new Blob([audioResponse], { type: `audio/${response.data.format}` });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } else {
      console.error('获取试听文件路径失败:', response);
      message.error('获取试听文件路径失败');
    }
  } catch (error) {
    console.error('试听出错:', error);
    message.error('试听出错: ' + (error.response?.data?.message || error.message));
  } 

};
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
    width: 300,
    align: 'center',
    slots: { customRender: 'name' }
  },
  {
    title: '歌手',
    dataIndex: 'artist',
    key: 'artist',
    width: 150,
    align: 'center',
  },
  {
    title: '时长',
    dataIndex: 'duration',
    key: 'duration',
    width: 150,
    align: 'center',
    slots: { customRender: 'duration' }
  },
  {
    title: '音频类型',
    dataIndex: 'category',
    key: 'category',
    width: 120,
    align: 'center',
    customRender: ({ record }) => categoryMap[record.category],
    filters: [
      { text: 'BGM', value: 'BGM' },
      { text: '音乐', value: 'SOUND' },
      { text: '特效音', value: 'EFFECT' }
    ],
    onFilter: (value, record) => record.category === value
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
    align: 'center',
    slots: {
      customRender: 'tags',
      header: () => h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        '标签',
        h(TagsOutlined, {
          style: { color: '#1890ff', cursor: 'pointer' },
          onClick: () => showTagEditor()
        })
      ])
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 220,  // 从150调整为220
    align: 'center',
    slots: { customRender: 'action' }
  }
];


const categoryMap = {
  'BGM': 'BGM',
  'SOUND': '音乐',
  'EFFECT': '特效音'
};

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

// 根据标签ID获取标签名称
const getTagNames = (tagIds) => {
  const names = [];
  tagIds.forEach(tagId => {
    const foundTag = findTagById(tagId);
    if (foundTag) names.push(foundTag.name);
  });
  return names;
};
const showTagEditor = (record) => {
  currentMusic.value = record;
  editModalVisible.value = true;
};

// 根据标签ID查找标签
const findTagById = (tagId) => {
  for (const category of tagCategories.value) {
    const foundTag = category.tags.find(t => t.id === tagId);
    if (foundTag) return foundTag;
  }
  return null;
};

// 格式化时长（精确到秒）
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  // 重置页码为1
  pagination.current = 1;

  // 调用获取音乐列表
  fetchMusicList();
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
  basicForm.category = '';
  basicForm.dateRange = [];
  basicForm.startTime = null;
  basicForm.endTime = null;

  // 重置页码为1
  pagination.current = 1;

  // 调用获取音乐列表
  fetchMusicList();
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

</script>

<style scoped>
.ant-select {
  width: 200px;
}


.music-list-container {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.search-area {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
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
  margin-top: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  align-items: center;
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
