<template>
  <div class="graphic-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="basicForm">
        <a-form-item label="标题">
          <a-input v-model:value="basicForm.title" placeholder="输入标题" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="视频类型">
          <a-select v-model:value="basicForm.videoType" placeholder="选择类型" style="width: 120px" allowClear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option value="JianYing">剪映视频</a-select-option>
            <a-select-option value="Regular">普通视频</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="生成状态">
          <a-select v-model:value="basicForm.result" placeholder="选择状态" style="width: 120px" allowClear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option value="Process">生成中</a-select-option>
            <a-select-option value="Success">成功</a-select-option>
            <a-select-option value="Fail">失败</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="用户">
          <UserSelect 
            v-model="basicForm.creator" 
            placeholder="选择用户" 
            width="120px"
          />
        </a-form-item>
        <a-form-item label="创作时间">
          <a-range-picker v-model:value="basicForm.dateRange" :show-time="{ format: 'HH:mm' }" format="YYYY-MM-DD HH:mm"
            :placeholder="['开始时间', '结束时间']" @change="handleDateChange" />
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetBasicSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 视频卡片列表 -->
    <div class="video-grid">
      <a-spin :spinning="loading" tip="加载中...">
        <a-row :gutter="[16, 16]">
          <a-col v-for="video in videoList" :key="video.id" :xs="24" :sm="12" :md="8" :lg="6">
            <a-card hoverable class="video-card">
              <div class="card-content">
                <!-- 视频封面或播放器 -->
                <div class="video-cover">
                  <!-- 普通视频且生成成功时显示视频播放器 -->
                  <div v-if="video.video_type === 'Regular' && video.result === 'Success' && video.video_path" class="video-player">
                    <video 
                      :key="video.id" 
                      :src="getVideoUrl(video)" 
                      controls 
                      preload="metadata" 
                      @error="handleVideoError"
                      @fullscreenchange="handleFullscreenChange"
                      @loadstart="handleVideoLoadStart"
                      @loadedmetadata="handleVideoLoadedMetadata"
                      @canplay="handleVideoCanPlay"
                      @click="handleVideoClick"
                      @play="handleVideoPlay"
                      @pause="handleVideoPause"
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                  <!-- 其他情况显示占位图 -->
                  <div v-else class="cover-placeholder">
                    <video-camera-outlined style="font-size: 48px; color: #ccc;" />
                  </div>
                  
                  <!-- 状态提示信息 -->
                  <div class="status-tip" :class="{ 'pointer-events-none': video.video_type === 'Regular' && video.result === 'Success' }">
                    <!-- 生成中状态 -->
                     <div v-if="video.result === 'Processing'" class="tip-text processing">
                       视频正在急速生成中...
                     </div>
                    
                    <!-- 生成失败状态 -->
                    <div v-else-if="video.result === 'Fail'" class="tip-text failed">
                      视频生成失败，请重试
                    </div>
                    
                    <!-- 剪映视频成功状态 -->
                     <div v-else-if="video.video_type === 'JianYing' && video.result === 'Success'" class="tip-text jianying">
                       剪映视频请打开剪映播放
                     </div>
                  </div>
                </div>
                
                <!-- 视频信息 -->
                <div class="video-info">
                  <div class="video-title">{{ video.title }}</div>
                  
                  <!-- 用户和创建时间一行 -->
                  <div class="meta-row">
                    <div class="meta-item">
                      <span class="label">用户:</span>
                      <span class="value">{{ video.username || '未知用户' }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="label">创建时间:</span>
                      <span class="value">{{ formatTime(video.create_time) }}</span>
                    </div>
                  </div>
                  
                  <!-- 视频类型和生成状态一行 -->
                  <div class="meta-row">
                    <div class="meta-item">
                      <span class="label">类型:</span>
                      <span class="value">{{ getVideoTypeText(video.video_type) }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="label">状态:</span>
                      <div class="status-container">
                        <a-tag v-if="video.result !== 'Process'" :color="getStatusColor(video.result)">
                          {{ getStatusInfo(video.result).text }}
                        </a-tag>
                        <div v-else class="progress-container">
                          <a-progress :percent="Math.round((video.process || 0) * 100)" size="small" :show-info="false" />
                          <span class="progress-text">{{ Math.round((video.process || 0) * 100) }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <template #actions>
                <a-button 
                  v-if="video.video_type === 'Regular' && video.result === 'Success' && video.video_path" 
                  
                  type="primary"
                  size="small" 
                  @click="showPublishModal(video)"
                >
                  发布
                </a-button>
                <a-button type="default"  size="small" @click="showDetail(video)">详情</a-button>
                
                <a-button type="danger" size="small" @click="handleDelete(video)">删除</a-button>
              </template>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </div>

    <!-- 分页组件 -->
    <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize" :total="pagination.total"
      @change="handlePageChange" />
      
    <!-- 发布弹窗 -->
    <a-modal 
      v-model:open="publishModalVisible" 
      title="发布视频" 
      width="800px"
      :footer="null"
      @cancel="closePublishModal"
    >
      <div class="publish-modal-content">
        <!-- 视频信息部分 -->
        <div class="video-info-section">
          <h3>视频信息</h3>
          <div class="video-info-content">
            <div class="cover-section">
              <div class="cover-preview">
                 <img 
                   v-if="editableVideo.coverPath && editableVideo.coverPath.startsWith('data:')" 
                   :src="editableVideo.coverPath" 
                   class="cover-image"
                   alt="封面"
                 />
                 <img 
                    v-else-if="coverDetail && getCoverUrl()" 
                    :src="getCoverUrl()" 
                    class="cover-image"
                    alt="封面"
                    @click="showImagePreview"
                    style="cursor: pointer;"
                  />
                 <div v-else class="cover-placeholder">
                   <video-camera-outlined style="font-size: 32px; color: #ccc;" />
                   <span>暂无封面</span>
                 </div>
               </div>
               <div class="cover-actions">
                 <input 
                   ref="coverInput" 
                   type="file" 
                   accept="image/*" 
                   style="display: none" 
                   @change="handleCoverChange"
                 />
                 <a-button size="small" @click="$refs.coverInput.click()">
                   {{ editableVideo.coverPath ? '替换封面' : '上传封面' }}
                 </a-button>
               </div>
            </div>
            <div class="video-details">
              <div class="detail-item">
                <span class="detail-label">标题：</span>
                <a-input 
                  v-model:value="editableVideo.title" 
                  placeholder="请输入视频标题"
                  class="detail-input"
                />
              </div>
              <div class="detail-item">
                 <span class="detail-label">内容：</span>
                 <a-textarea 
                   v-model:value="editableVideo.content" 
                   placeholder="请输入视频内容描述"
                   :rows="3"
                   class="detail-input"
                 />
               </div>
               <div class="detail-item">
                 <span class="detail-label">标签：</span>
                 <a-input 
                   v-model:value="editableVideo.tags" 
                   placeholder="请输入标签，多个标签用逗号分隔"
                   class="detail-input"
                 />
               </div>
            </div>
          </div>
        </div>
        
        <!-- 平台选择部分 -->
        <div class="platform-section">
          <h3>选择发布平台</h3>
          <div class="platform-grid">
            <div 
              v-for="platform in platforms" 
              :key="platform.key"
              class="platform-item"
              :class="{ active: selectedPlatforms.includes(platform.key) }"
              @click="togglePlatform(platform.key)"
            >
              <div class="platform-icon">
                <component :is="platform.icon" :style="{ fontSize: '24px', color: platform.color }" />
              </div>
              <div class="platform-name">{{ platform.name }}</div>
              <div class="platform-check" v-if="selectedPlatforms.includes(platform.key)">
                <check-circle-filled style="color: #52c41a; font-size: 16px;" />
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="modal-actions">
          <a-button @click="closePublishModal">取消</a-button>
          <a-button 
            type="primary" 
            :disabled="selectedPlatforms.length === 0"
            @click="handlePublish"
          >
            发布到选中平台 ({{ selectedPlatforms.length }})
          </a-button>
        </div>
      </div>
    </a-modal>
    
    <!-- 图片预览模态框 -->
    <a-modal 
      v-model:open="imagePreviewVisible" 
      title="封面预览" 
      width="90%"
      style="max-width: 1200px;"
      :footer="null"
      centered
    >
      <div class="image-preview-container">
        <img 
          v-if="coverDetail && getCoverUrl()" 
          :src="getCoverUrl()" 
          alt="封面预览" 
          class="preview-image"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { h } from 'vue';
import { NDataTable, NCard, NButton, NProgress, NTag, useDialog, useMessage } from 'naive-ui';
import { 
  VideoCameraOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  WechatOutlined,
  HeartOutlined,
  FileTextOutlined,
  WeiboOutlined,
  CheckCircleFilled
} from '@ant-design/icons-vue';
import Pagination from '@/components/Pagination.vue';
import { getVideoList,deleteVideo } from '@/api/modules/videoApi.js';
import { getImageDetail } from '@/api/modules/imageApi.js';
import { publishToDouyin, getDouyinPublishStatus } from '@/api/modules/douyinApi';
import { publishToRednote, getRednotePublishStatus } from '@/api/modules/rednoteApi';
import { VideoDouyin } from '@/utils/douyinAutomation';
import { VideoRednote } from '@/utils/rednoteAutomation';
import { VideoBaijiahao } from '@/utils/baijiahaoAutomation';
import { VideoBilibili } from '@/utils/bilibiliAutomation';
import { VideoToutiaohao } from '@/utils/toutiaoAutomation';
import { VideoWeibo } from '@/utils/weiboAutomation';
import { VideoWeiXinChannel } from '@/utils/weixinChannelAutomation';
import { convertToDouyinFormat, convertToRednoteFormat, convertToBaijiahaoFormat, convertToBilibiliFormat, convertToToutiaoFormat, convertToWeiboFormat, convertToWeixinChannelFormat, validatePublishData } from '@/utils/dataConverter';
import dayjs from 'dayjs';
import UserSelect from '@/components/UserSelect.vue'


// 加载状态
const loading = ref(false);

// 视频数据
const videoList = ref([]);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 查询参数
const basicForm = reactive({
  title: '',
  dateRange: [],
  startTime: null,
  endTime: null,
  creator: undefined,
  videoType: undefined,
  result: undefined
});

// 发布弹窗相关
const publishModalVisible = ref(false);
const selectedVideo = ref(null);
const selectedPlatforms = ref([]);
const coverDetail = ref(null);
const imagePreviewVisible = ref(false);
const editableVideo = ref({
  title: '',
  content: '',
  coverPath: '',
  tags: ''
});

// 平台列表
const platforms = ref([
  {
    key: 'toutiao',
    name: '头条号',
    icon: GlobalOutlined,
    color: '#ff6600'
  },
  {
    key: 'douyin',
    name: '抖音',
    icon: PlayCircleOutlined,
    color: '#000000'
  },
  {
    key: 'wechat',
    name: '微信视频号',
    icon: WechatOutlined,
    color: '#07c160'
  },
  {
    key: 'xiaohongshu',
    name: '小红书',
    icon: HeartOutlined,
    color: '#ff2442'
  },
  {
    key: 'baijiahao',
    name: '百家号',
    icon: FileTextOutlined,
    color: '#3385ff'
  },
  {
    key: 'bilibili',
    name: 'B站',
    icon: PlayCircleOutlined,
    color: '#00a1d6'
  },
  {
    key: 'weibo',
    name: '微博',
    icon: WeiboOutlined,
    color: '#e6162d'
  }
]);


const loadVideoList = async () => {
  try {
    loading.value = true;

    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      title: basicForm.title || undefined,
      start_time: basicForm.startTime ? dayjs(basicForm.startTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
      end_time: basicForm.endTime ? dayjs(basicForm.endTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
      creator: basicForm.creator || undefined,
      video_type: basicForm.videoType || undefined,
      result: basicForm.result || undefined
    };

    const response = await getVideoList(params);

    if (response.code === 0) {
      videoList.value = response.data.results || [];
      pagination.total = response.data.count || 0;
      
      // 调试：打印视频数据
      console.log('获取到的视频列表:', videoList.value);
      videoList.value.forEach((video, index) => {
        console.log(`视频${index + 1}:`, {
          id: video.id,
          video_type: video.video_type,
          result: video.result,
          video_path: video.video_path,
          渲染条件: video.video_type === 'Regular' && video.result === 'Success' && video.video_path
        });
      });
    } else {
      console.error('获取视频列表失败:', response.message);
    }
  } catch (error) {
    console.error('加载视频列表出错:', error);
  } finally {
    loading.value = false;
  }
};

// 处理查询
const handleSearch = () => {
  pagination.current = 1;
  loadVideoList();
};

// 处理分页变化
const handlePageChange = ({ current, pageSize: newPageSize }) => {
  pagination.current = current;
  pagination.pageSize = newPageSize;
  loadVideoList();
};

// 重置搜索
const resetBasicSearch = () => {
  basicForm.title = '';
  basicForm.dateRange = [];
  basicForm.startTime = null;
  basicForm.endTime = null;
  basicForm.creator = undefined;
  basicForm.videoType = undefined;
  basicForm.result = undefined;
  handleSearch();
};

// 处理日期范围变化
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    basicForm.startTime = dates[0];
    basicForm.endTime = dates[1];
  } else {
    basicForm.startTime = null;
    basicForm.endTime = null;
  }
};


// 下载视频
const downloadVideo = (row) => {
  console.log('下载视频:', row);
  // 这里可以实现下载逻辑
};

// 预览视频
const previewVideo = (row) => {
  console.log('预览视频:', row);
  // 这里可以实现预览逻辑
};

// 获取状态显示信息
const getStatusInfo = (result) => {
  switch (result) {
    case 'Process':
      return { text: '生成中', type: 'warning' };
    case 'Success':
      return { text: '成功', type: 'success' };
    case 'Fail':
      return { text: '失败', type: 'error' };
    default:
      return { text: '未知', type: 'default' };
  }
};

// 获取视频类型文本
const getVideoTypeText = (videoType) => {
  switch (videoType) {
    case 'JianYing':
      return '剪映视频';
    case 'Regular':
      return '普通视频';
    default:
      return '未知类型';
  }
};

// 获取状态颜色
const getStatusColor = (result) => {
  switch (result) {
    case 'Success':
      return 'success';
    case 'Fail':
      return 'error';
    case 'Process':
      return 'processing';
    default:
      return 'default';
  }
};

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

// 获取视频URL
const getVideoUrl = (video) => {
  console.log('getVideoUrl调用:', video);
  if (!video?.video_path) {
    console.log('视频路径为空');
    return '';
  }
  console.log('返回视频URL:', video.video_path);
  // video_path已经是完整路径，直接返回
  return video.video_path;
};

// 处理视频加载错误
const handleVideoError = (event) => {
  console.error('视频加载失败:', event);
  message.error('视频加载失败');
};

// 调试用的视频事件处理函数
const handleVideoLoadStart = (event) => {
  console.log('视频开始加载:', event.target.src);
};

const handleVideoCanPlay = (event) => {
  console.log('视频可以播放:', event.target.src);
};

const handleVideoLoadedMetadata = (event) => {
  console.log('视频元数据加载完成:', event.target.src);
  // 只在首次加载时重置播放位置
  if (event.target.currentTime > 0) {
    console.log('检测到缓存的播放位置，重置为0');
    event.target.currentTime = 0;
  }
};

const handleVideoClick = (event) => {
  console.log('视频被点击:', event.target);
  console.log('视频元素状态:', {
    src: event.target.src,
    readyState: event.target.readyState,
    networkState: event.target.networkState,
    paused: event.target.paused,
    controls: event.target.controls,
    currentTime: event.target.currentTime,
    duration: event.target.duration
  });
};

const handleVideoPlay = (event) => {
  console.log('视频开始播放:', event.target.currentTime);
};

const handleVideoPause = (event) => {
  console.log('视频暂停:', event.target.currentTime);
};

// 显示发布弹窗
const showPublishModal = async (video) => {
  selectedVideo.value = video;
  selectedPlatforms.value = [];
  coverDetail.value = null;
  
  // 初始化可编辑的视频信息
  editableVideo.value = {
    title: video.title || '',
    content: video.content || '',
    coverPath: video.cover_path || '',
    tags: video.tags || ''
  };
  
  // 如果视频有封面ID，加载封面详情
  if (video.cover) {
    await loadCoverDetail(video.cover);
  }
  
  publishModalVisible.value = true;
};

const closePublishModal = () => {
  publishModalVisible.value = false;
  selectedVideo.value = null;
  selectedPlatforms.value = [];
  coverDetail.value = null;
};

// 显示图片预览
const showImagePreview = () => {
  imagePreviewVisible.value = true;
};

const togglePlatform = (platformKey) => {
  const index = selectedPlatforms.value.indexOf(platformKey);
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1);
  } else {
    selectedPlatforms.value.push(platformKey);
  }
};

// 获取封面详情
const loadCoverDetail = async (coverId) => {
  if (!coverId) {
    console.warn('封面ID为空，跳过加载');
    return;
  }
  
  try {
    console.log('开始加载封面详情，ID:', coverId);
    const response = await getImageDetail(coverId);
    console.log('封面详情响应:', response);
    
    if (response && response.data) {
      coverDetail.value = response.data;
      console.log('封面详情加载成功:', response.data);
    } else if (response) {
      // 如果response存在但没有data字段，直接使用response
      coverDetail.value = response;
      console.log('封面详情加载成功（无data字段）:', response);
    } else {
      console.warn('封面详情响应为空');
      throw new Error('封面详情响应为空');
    }
  } catch (error) {
    console.error('获取封面详情失败:', {
      coverId,
      error: error.message,
      stack: error.stack
    });
    
    // 根据错误类型提供不同的降级处理
    if (error.message && error.message.includes('请求失败')) {
      console.log('API请求失败，使用默认封面信息');
    } else if (error.message && error.message.includes('网络')) {
      console.log('网络错误，使用默认封面信息');
    } else {
      console.log('未知错误，使用默认封面信息');
    }
    
    // API调用失败时，使用coverId作为img_name创建基本的封面信息
    if (coverId) {
      coverDetail.value = {
        img_name: `${coverId}.png`,
        id: coverId,
        fallback: true // 标记这是降级数据
      };
      console.log('已设置默认封面信息:', coverDetail.value);
    } else {
      coverDetail.value = null;
    }
  }
};

// 获取封面URL
const getCoverUrl = () => {
  if (!coverDetail.value?.img_name) return '';
  return `http://127.0.0.1:8089/media/images/${coverDetail.value.img_name}`;
};

const getVideoCoverUrl = (video) => {
  if (!video?.cover_path) {
    return '';
  }
  return video.cover_path;
};

// 处理封面文件变化
const handleCoverChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件');
      return;
    }
    
    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过5MB');
      return;
    }
    
    // 创建预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      editableVideo.value.coverPath = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // 这里可以添加上传到服务器的逻辑
    // uploadCoverToServer(file);
  }
};

const handleFullscreenChange = (event) => {
  console.log('全屏状态变化:', event);
};

const handlePublish = async () => {
  if (!selectedVideo.value || selectedPlatforms.value.length === 0) {
    message.warning('请选择要发布的平台');
    return;
  }
  
  let loadingMessage = null;
  
  try {
    // 检查是否包含抖音平台
    const hasDouyin = selectedPlatforms.value.some(platform => platform === 'douyin');
    // 检查是否包含小红书平台
    const hasRednote = selectedPlatforms.value.some(platform => platform === 'xiaohongshu');
    
    if (hasDouyin) {
      // 转换数据格式
      const douyinData = convertToDouyinFormat(selectedVideo.value, editableVideo.value);
      
      // 验证数据完整性
      const validation = validatePublishData(douyinData, 'douyin');
      
      if (!validation.isValid) {
        message.error(`发布数据验证失败: ${validation.errors.join(', ')}`);
        return;
      }
      
      // 显示警告信息
      if (validation.warnings.length > 0) {
        message.warning(`注意: ${validation.warnings.join(', ')}`);
      }
      
      loadingMessage = message.loading('正在发布到抖音平台...', 0);
      
      try {
        const douyinResult = await publishToDouyin(douyinData);
        
        if (douyinResult && douyinResult.success) {
          message.success('抖音发布成功!');
        } else {
          const errorMsg = douyinResult?.message || '发布失败，请检查网络连接或稍后重试';
          message.error(`抖音发布失败: ${errorMsg}`);
        }
      } catch (douyinError) {
        console.error('抖音发布API调用失败:', douyinError);
        
        // 根据错误类型提供不同的提示
        let errorMessage = '抖音发布失败';
        if (douyinError.message) {
          if (douyinError.message.includes('网络')) {
            errorMessage = '网络连接失败，请检查网络后重试';
          } else if (douyinError.message.includes('权限')) {
            errorMessage = '发布权限不足，请检查账号授权';
          } else if (douyinError.message.includes('格式')) {
            errorMessage = '视频格式不支持，请检查视频文件';
          } else {
            errorMessage = `抖音发布失败: ${douyinError.message}`;
          }
        }
        
        message.error(errorMessage);
      }
    }
    
    if (hasRednote) {
      // 转换数据格式
      const rednoteData = convertToRednoteFormat(selectedVideo.value, editableVideo.value);
      
      // 验证数据完整性
      const validation = validatePublishData(rednoteData, 'xiaohongshu');
      
      if (!validation.isValid) {
        message.error(`小红书发布数据验证失败: ${validation.errors.join(', ')}`);
        return;
      }
      
      // 显示警告信息
      if (validation.warnings.length > 0) {
        message.warning(`小红书注意: ${validation.warnings.join(', ')}`);
      }
      
      loadingMessage = message.loading('正在发布到小红书平台...', 0);
      
      try {
        const rednoteResult = await publishToRednote(rednoteData);
        
        if (rednoteResult && rednoteResult.success) {
          message.success('小红书发布成功!');
        } else {
          const errorMsg = rednoteResult?.message || '发布失败，请检查网络连接或稍后重试';
          message.error(`小红书发布失败: ${errorMsg}`);
        }
      } catch (rednoteError) {
        console.error('小红书发布API调用失败:', rednoteError);
        
        // 根据错误类型提供不同的提示
        let errorMessage = '小红书发布失败';
        if (rednoteError.message) {
          if (rednoteError.message.includes('网络')) {
            errorMessage = '网络连接失败，请检查网络后重试';
          } else if (rednoteError.message.includes('权限')) {
            errorMessage = '发布权限不足，请检查账号授权';
          } else if (rednoteError.message.includes('格式')) {
            errorMessage = '视频格式不支持，请检查视频文件';
          } else {
            errorMessage = `小红书发布失败: ${rednoteError.message}`;
          }
        }
        
        message.error(errorMessage);
      }
    }
    
    // 检查是否包含百家号平台
    const hasBaijiahao = selectedPlatforms.value.some(platform => platform === 'baijiahao');
    
    if (hasBaijiahao) {
      // 转换数据格式
      const baijiahaoData = convertToBaijiahaoFormat(selectedVideo.value, editableVideo.value);
      
      // 验证数据完整性
      const validation = validatePublishData(baijiahaoData, 'baijiahao');
      
      if (!validation.isValid) {
        message.error(`百家号发布数据验证失败: ${validation.errors.join(', ')}`);
        return;
      }
      
      // 显示警告信息
      if (validation.warnings.length > 0) {
        message.warning(`百家号注意: ${validation.warnings.join(', ')}`);
      }
      
      loadingMessage = message.loading('正在发布到百家号平台...', 0);
      
      try {
        const baijiahaoResult = await VideoBaijiahao({
          data: baijiahaoData,
          platform: 'baijiahao'
        });
        
        if (baijiahaoResult && baijiahaoResult.success) {
          message.success('百家号发布成功!');
        } else {
          const errorMsg = baijiahaoResult?.message || '发布失败，请检查网络连接或稍后重试';
          message.error(`百家号发布失败: ${errorMsg}`);
        }
      } catch (baijiahaoError) {
        console.error('百家号发布API调用失败:', baijiahaoError);
        
        // 根据错误类型提供不同的提示
        let errorMessage = '百家号发布失败';
        if (baijiahaoError.message) {
          if (baijiahaoError.message.includes('网络')) {
            errorMessage = '网络连接失败，请检查网络后重试';
          } else if (baijiahaoError.message.includes('权限')) {
            errorMessage = '发布权限不足，请检查账号授权';
          } else if (baijiahaoError.message.includes('格式')) {
            errorMessage = '视频格式不支持，请检查视频文件';
          } else {
            errorMessage = `百家号发布失败: ${baijiahaoError.message}`;
          }
        }
        
        message.error(errorMessage);
      }
    }
     
     // 检查是否包含B站平台
     const hasBilibili = selectedPlatforms.value.some(platform => platform === 'bilibili');
     
     if (hasBilibili) {
       // 转换数据格式
       const bilibiliData = convertToBilibiliFormat(selectedVideo.value, editableVideo.value);
       
       // 验证数据完整性
       const validation = validatePublishData(bilibiliData, 'bilibili');
       
       if (!validation.isValid) {
         message.error(`B站发布数据验证失败: ${validation.errors.join(', ')}`);
         return;
       }
       
       // 显示警告信息
       if (validation.warnings.length > 0) {
         message.warning(`B站注意: ${validation.warnings.join(', ')}`);
       }
       
       loadingMessage = message.loading('正在发布到B站平台...', 0);
       
       try {
         const bilibiliResult = await VideoBilibili({
           data: bilibiliData,
           platform: 'bilibili'
         });
         
         if (bilibiliResult && bilibiliResult.success) {
           message.success('B站发布成功!');
         } else {
           const errorMsg = bilibiliResult?.message || '发布失败，请检查网络连接或稍后重试';
           message.error(`B站发布失败: ${errorMsg}`);
         }
       } catch (bilibiliError) {
         console.error('B站发布API调用失败:', bilibiliError);
         
         // 根据错误类型提供不同的提示
         let errorMessage = 'B站发布失败';
         if (bilibiliError.message) {
           if (bilibiliError.message.includes('网络')) {
             errorMessage = '网络连接失败，请检查网络后重试';
           } else if (bilibiliError.message.includes('权限')) {
             errorMessage = '发布权限不足，请检查账号授权';
           } else if (bilibiliError.message.includes('格式')) {
             errorMessage = '视频格式不支持，请检查视频文件';
           } else {
             errorMessage = `B站发布失败: ${bilibiliError.message}`;
           }
         }
         
         message.error(errorMessage);
       }
     }
      
      // 检查是否包含头条号平台
      const hasToutiao = selectedPlatforms.value.some(platform => platform === 'toutiao');
      
      if (hasToutiao) {
        // 转换数据格式
        const toutiaoData = convertToToutiaoFormat(selectedVideo.value, editableVideo.value);
        
        // 验证数据完整性
        const validation = validatePublishData(toutiaoData, 'toutiao');
        
        if (!validation.isValid) {
          message.error(`头条号发布数据验证失败: ${validation.errors.join(', ')}`);
          return;
        }
        
        // 显示警告信息
        if (validation.warnings.length > 0) {
          message.warning(`头条号注意: ${validation.warnings.join(', ')}`);
        }
        
        loadingMessage = message.loading('正在发布到头条号平台...', 0);
        
        try {
          const toutiaoResult = await VideoToutiaohao({
            data: toutiaoData,
            platform: 'toutiao'
          });
          
          if (toutiaoResult && toutiaoResult.success) {
            message.success('头条号发布成功!');
          } else {
            const errorMsg = toutiaoResult?.message || '发布失败，请检查网络连接或稍后重试';
            message.error(`头条号发布失败: ${errorMsg}`);
          }
        } catch (toutiaoError) {
          console.error('头条号发布API调用失败:', toutiaoError);
          
          // 根据错误类型提供不同的提示
          let errorMessage = '头条号发布失败';
          if (toutiaoError.message) {
            if (toutiaoError.message.includes('网络')) {
              errorMessage = '网络连接失败，请检查网络后重试';
            } else if (toutiaoError.message.includes('权限')) {
              errorMessage = '发布权限不足，请检查账号授权';
            } else if (toutiaoError.message.includes('格式')) {
              errorMessage = '视频格式不支持，请检查视频文件';
            } else {
              errorMessage = `头条号发布失败: ${toutiaoError.message}`;
            }
          }
          
          message.error(errorMessage);
        }
      }
      
      // 检查是否包含微博平台
      const hasWeibo = selectedPlatforms.value.some(platform => platform === 'weibo');
      
      if (hasWeibo) {
        // 转换数据格式
        const weiboData = convertToWeiboFormat(selectedVideo.value, editableVideo.value);
        
        // 验证数据完整性
        const validation = validatePublishData(weiboData, 'weibo');
        
        if (!validation.isValid) {
          message.error(`微博发布数据验证失败: ${validation.errors.join(', ')}`);
          return;
        }
        
        // 显示警告信息
        if (validation.warnings.length > 0) {
          message.warning(`微博注意: ${validation.warnings.join(', ')}`);
        }
        
        loadingMessage = message.loading('正在发布到微博平台...', 0);
        
        try {
          const weiboResult = await VideoWeibo({
            data: weiboData,
            platform: 'weibo'
          });
          
          if (weiboResult && weiboResult.success) {
            message.success('微博发布成功!');
          } else {
            const errorMsg = weiboResult?.message || '发布失败，请检查网络连接或稍后重试';
            message.error(`微博发布失败: ${errorMsg}`);
          }
        } catch (weiboError) {
          console.error('微博发布API调用失败:', weiboError);
          
          // 根据错误类型提供不同的提示
          let errorMessage = '微博发布失败';
          if (weiboError.message) {
            if (weiboError.message.includes('网络')) {
              errorMessage = '网络连接失败，请检查网络后重试';
            } else if (weiboError.message.includes('权限')) {
              errorMessage = '发布权限不足，请检查账号授权';
            } else if (weiboError.message.includes('格式')) {
              errorMessage = '视频格式不支持，请检查视频文件';
            } else {
              errorMessage = `微博发布失败: ${weiboError.message}`;
            }
          }
          
          message.error(errorMessage);
        }
      }
      
      // 检查是否包含微信视频号平台
      const hasWeixinChannel = selectedPlatforms.value.some(platform => platform === 'wechat');
      
      if (hasWeixinChannel) {
        // 转换数据格式
        const weixinChannelData = convertToWeixinChannelFormat(selectedVideo.value, editableVideo.value);
        
        // 验证数据完整性
        const validation = validatePublishData(weixinChannelData, 'wechat');
        
        if (!validation.isValid) {
          message.error(`微信视频号发布数据验证失败: ${validation.errors.join(', ')}`);
          return;
        }
        
        // 显示警告信息
        if (validation.warnings.length > 0) {
          message.warning(`微信视频号注意: ${validation.warnings.join(', ')}`);
        }
        
        loadingMessage = message.loading('正在发布到微信视频号平台...', 0);
        
        try {
          const weixinChannelResult = await VideoWeiXinChannel({
            data: weixinChannelData,
            platform: 'wechat'
          });
          
          if (weixinChannelResult && weixinChannelResult.success) {
            message.success('微信视频号发布成功!');
          } else {
            const errorMsg = weixinChannelResult?.message || '发布失败，请检查网络连接或稍后重试';
            message.error(`微信视频号发布失败: ${errorMsg}`);
          }
        } catch (weixinChannelError) {
          console.error('微信视频号发布API调用失败:', weixinChannelError);
          
          // 根据错误类型提供不同的提示
          let errorMessage = '微信视频号发布失败';
          if (weixinChannelError.message) {
            if (weixinChannelError.message.includes('网络')) {
              errorMessage = '网络连接失败，请检查网络后重试';
            } else if (weixinChannelError.message.includes('权限')) {
              errorMessage = '发布权限不足，请检查账号授权';
            } else if (weixinChannelError.message.includes('格式')) {
              errorMessage = '视频格式不支持，请检查视频文件';
            } else {
              errorMessage = `微信视频号发布失败: ${weixinChannelError.message}`;
            }
          }
          
          message.error(errorMessage);
        }
      }
      
      // 处理其他平台
      const otherPlatforms = selectedPlatforms.value.filter(platform => platform !== 'douyin' && platform !== 'xiaohongshu' && platform !== 'baijiahao' && platform !== 'bilibili' && platform !== 'toutiao' && platform !== 'weibo' && platform !== 'wechat');
    if (otherPlatforms.length > 0) {
      console.log('发布到其他平台:', {
        video: selectedVideo.value,
        platforms: otherPlatforms
      });
      
      // 模拟其他平台发布
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success(`视频已成功发布到 ${otherPlatforms.length} 个其他平台`);
    }
    
    // 发布完成后关闭弹窗
    setTimeout(() => {
      closePublishModal();
    }, 1500);
    
  } catch (error) {
    console.error('发布过程中出现未预期的错误:', error);
    
    // 提供用户友好的错误信息
    let userMessage = '发布失败，请稍后重试';
    if (error.message) {
      if (error.message.includes('数据格式转换失败')) {
        userMessage = '视频数据格式有误，请检查视频信息';
      } else if (error.message.includes('网络')) {
        userMessage = '网络连接异常，请检查网络后重试';
      }
    }
    
    message.error(userMessage);
  } finally {
    // 清理加载状态
    if (loadingMessage && typeof loadingMessage === 'function') {
      loadingMessage();
    }
  }
};

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center',
    render: (row, index) => (pagination.current - 1) * pagination.pageSize + index + 1
  },
  {
    title: '标题',
    key: 'title',
    width: 200
  },
  {
    title: '用户',  
    key: 'username', 
    width: 100,
    align: 'center',
    render: (row) => row.username || '未知用户'  // 显示username字段
  },
  {
    title: '视频类型',
    key: 'video_type',
    width: 100,
    align: 'center',
    render: (row) => getVideoTypeText(row.video_type)
  },
  {
    title: '状态',
    key: 'status',
    width: 200,
    align: 'center',
    render: (row) => {
      const statusInfo = getStatusInfo(row.result);

      if (row.result === 'Process') {
        // 生成中显示进度条和百分比
        console.log("生成进度：", row.process);
        const percentage = Math.round((row.process || 0) * 100);
        return h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }
        }, [
          h(NProgress, {
            percentage: percentage,
            status: 'active',
            showIndicator: false,
            color: '#18a058',
            railColor: '#f0f0f0',
            style: 'width: 120px; flex-shrink: 0;'
          }),
          h('span', {
            style: {
              fontSize: '12px',
              color: '#666',
              minWidth: '35px',
              textAlign: 'left'
            }
          }, `${percentage}%`)
        ]);
      } else {
        // 成功或失败显示状态标签
        return h('div', {
          style: {
            display: 'flex',
            justifyContent: 'center'
          }
        }, [
          h(NTag, {
            type: statusInfo.type
          }, () => statusInfo.text)
        ]);
      }
    }
  },
  {
    title: '创建时间',
    key: 'create_time',
    width: 180,
    render: (row) => {
      return dayjs(row.create_time).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => [
      h(NButton, {
        type: 'primary',
        size: 'small',
        onClick: () => showDetail(row)
      }, () => '详情'),
      h(NButton, {
        type: 'error',
        size: 'small',
        style: { marginLeft: '8px' },
        onClick: () => handleDelete(row)
      }, () => '删除')
    ]
  }
];

// 组件挂载时加载数据
onMounted(() => {
  loadVideoList();
});

// 在script setup部分添加路由跳转函数
import { useRouter } from 'vue-router';

const router = useRouter();

// 查看详情
const showDetail = (row) => {
  router.push(`/my-videos/${row.id}`);
};

// 在 script setup 中添加
const dialog = useDialog();
const message = useMessage();

// 修改删除函数
const handleDelete = async (row) => {
  // 确认删除
  const confirmed = await new Promise((resolve) => {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除视频 "${row.title}" 吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false)
    });
  });
  
  if (!confirmed) return;
  
  try {
    // 调用删除API
    await deleteVideo(row.id);
    
    message.success('删除成功');
    // 重新加载列表
    loadVideoList();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};
</script>

<style scoped>
.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}
.graphic-list-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 搜索区域样式 */
.search-area {
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-area .ant-form-item {
  margin-bottom: 16px;
}

.search-area .ant-form-item-label>label {
  font-weight: 500;
}

.search-area .ant-input,
.search-area .ant-picker {
  width: 200px;
}

.search-area .ant-select {
  width: 150px;
}

.search-area .ant-btn {
  margin-left: 8px;
}

/* 表格样式优化 */
.n-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.n-data-table {
  border-radius: 8px;
}

.n-data-table :deep(.n-data-table-th) {
  background-color: #fafafa;
  font-weight: 500;
}

.n-data-table :deep(.n-data-table-td) {
  padding: 12px 16px;
}

/* 操作按钮样式 */
.n-button {
  margin-right: 8px;
}

/* 视频卡片网格样式 */
.video-grid {
  margin-bottom: 20px;
}

.video-card {
  height: 100%;
  transition: all 0.3s ease;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 视频封面样式 */
.video-cover {
  position: relative;
  width: 100%;
  height: 160px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.video-player video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  background-color: #000;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}



/* 状态提示信息样式 */
.status-tip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.tip-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  padding: 8px 16px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.tip-text.processing {
  background: rgba(24, 144, 255, 0.8);
}

.tip-text.failed {
  background: rgba(255, 77, 79, 0.8);
}

.tip-text.jianying {
  background: rgba(0, 0, 0, 0.7);
}

.pointer-events-none {
  pointer-events: none;
}

/* 视频信息样式 */
.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.video-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  line-height: 1.5;
}

.meta-item {
  flex: 1;
  display: flex;
  align-items: baseline;
}

.meta-item:first-child {
  margin-right: 12px;
}

.label {
  color: #8c8c8c;
  font-size: 12px;
  margin-right: 4px;
  white-space: nowrap;
  line-height: 1.5;
}

.value {
  color: #595959;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 状态容器样式 */
.status-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-container .ant-tag {
  margin: 0;
  font-size: 12px;
}

.status-container .ant-progress {
  flex: 1;
  max-width: 100px;
}

.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.progress-container .ant-progress {
  flex: 1;
  margin: 0;
}

.progress-text {
  font-size: 12px;
  color: #666;
  min-width: 35px;
  text-align: right;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .video-cover {
    height: 120px;
  }
  
  .video-title {
    font-size: 14px;
  }
  
  .meta-row {
    font-size: 12px;
  }
}

/* 发布弹窗样式 */
.publish-modal-content {
  padding: 16px 0;
}

.video-info-section {
  margin-bottom: 24px;
}

.video-info-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.video-info-content {
  display: flex;
  gap: 16px;
}

.cover-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 200px;
}

.cover-preview {
  width: 200px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #e8e8e8;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #fafafa;
  gap: 8px;
}

.cover-placeholder span {
  font-size: 12px;
  color: #999;
}

.cover-actions {
  display: flex;
  justify-content: center;
}

.video-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-label {
  font-weight: 500;
  color: #666;
  min-width: 60px;
  flex-shrink: 0;
  line-height: 32px;
}

.detail-value {
  color: #333;
  word-break: break-all;
}

.detail-input {
  flex: 1;
}

.cover-thumbnail {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.platform-section {
  margin-bottom: 24px;
}

.platform-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.platform-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
}

.platform-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.platform-item.active {
  border-color: #52c41a;
  background: #f6ffed;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);
}

.platform-icon {
  margin-bottom: 8px;
}

.platform-name {
  font-size: 12px;
  color: #333;
  text-align: center;
  font-weight: 500;
}

.platform-check {
  position: absolute;
  top: 4px;
  right: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

@media (max-width: 768px) {
  .video-info-content {
    flex-direction: column;
  }
  
  .cover-section {
    width: 100%;
  }
  
  .cover-preview {
    width: 100%;
    height: 160px;
  }
  
  .platform-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
  
  .platform-item {
    padding: 12px 8px;
  }
}
</style>