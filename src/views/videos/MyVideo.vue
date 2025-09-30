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
          <UserSelect v-model="basicForm.creator" placeholder="选择用户" width="120px" />
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
                  <div v-if="video.video_type === 'Regular' && video.result === 'Success' && video.video_path"
                    class="video-player">
                    <video :key="video.id" :src="getVideoUrl(video)" controls preload="metadata"
                      @error="handleVideoError" @fullscreenchange="handleFullscreenChange"
                      @loadstart="handleVideoLoadStart" @loadedmetadata="handleVideoLoadedMetadata"
                      @canplay="handleVideoCanPlay" @click="handleVideoClick" @play="handleVideoPlay"
                      @pause="handleVideoPause">
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                  <!-- 其他情况显示占位图 -->
                  <div v-else class="cover-placeholder">
                    <video-camera-outlined style="font-size: 48px; color: #ccc;" />
                  </div>

                  <!-- 状态提示信息 -->
                  <div class="status-tip"
                    :class="{ 'pointer-events-none': video.video_type === 'Regular' && video.result === 'Success' }">
                    <!-- 生成中状态 -->
                    <div v-if="video.result === 'Processing'" class="tip-text processing">
                      视频正在急速生成中...
                    </div>

                    <!-- 生成失败状态 -->
                    <div v-else-if="video.result === 'Fail'" class="tip-text failed">
                      视频生成失败，请重试
                    </div>

                    <!-- 剪映视频成功状态 -->
                    <div v-else-if="video.video_type === 'JianYing' && video.result === 'Success'"
                      class="tip-text jianying">
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
                          <a-progress :percent="Math.round((video.process || 0) * 100)" size="small"
                            :show-info="false" />
                          <span class="progress-text">{{ Math.round((video.process || 0) * 100) }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <template #actions>
                <a-button v-if="video.video_type === 'Regular' && video.result === 'Success' && video.video_path"
                  type="primary" size="small" @click="showPublishModal(video)">
                  发布
                </a-button>
                <a-button type="default" size="small" @click="showDetail(video)">详情</a-button>

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
    <a-modal v-model:open="publishModalVisible" title="发布视频" width="800px" :footer="null" @cancel="closePublishModal">
      <div class="publish-modal-content">
        <!-- 视频信息部分 -->
        <div class="video-info-section">
          <h3>视频信息</h3>
          <div class="video-info-content">
            <div class="cover-section">
              <div class="cover-preview">
                <img v-if="editableVideo.coverPath && editableVideo.coverPath.startsWith('data:')"
                  :src="editableVideo.coverPath" class="cover-image" alt="封面" />
                <img v-else-if="coverDetail && getCoverUrl()" :src="getCoverUrl()" class="cover-image" alt="封面"
                  @click="showImagePreview" style="cursor: pointer;" />
                <div v-else class="cover-placeholder">
                  <video-camera-outlined style="font-size: 32px; color: #ccc;" />
                  <span>暂无封面</span>
                </div>
              </div>
              <div class="cover-actions">
                <input ref="coverInput" type="file" accept="image/*" style="display: none"
                  @change="handleCoverChange" />
                <a-button size="small" @click="$refs.coverInput.click()">
                  {{ editableVideo.coverPath ? '替换封面' : '上传封面' }}
                </a-button>
              </div>
            </div>
            <div class="video-details">
              <div class="detail-item">
                <span class="detail-label">标题：</span>
                <a-input v-model:value="editableVideo.title" placeholder="请输入视频标题" class="detail-input" />
              </div>
              <div class="detail-item">
                <span class="detail-label">内容：</span>
                <a-textarea v-model:value="editableVideo.content" placeholder="请输入视频内容描述" :rows="3"
                  class="detail-input" />
              </div>
              <div class="detail-item">
                <span class="detail-label">标签：</span>
                <a-input v-model:value="editableVideo.tags" placeholder="请输入标签，多个标签用逗号分隔" class="detail-input" />
              </div>
            </div>
          </div>
        </div>

        <!-- 平台选择部分 -->
        <div class="platform-section">
          <div class="platform-header" style="margin-bottom:8px; display:flex; align-items:center; gap:12px;">
            <h3 style="margin:0;">选择发布平台</h3>
            <div class="auto-publish" style="display:flex; align-items:center; gap:8px;">
              <span>直接发布</span>
              <a-switch v-model:checked="isAutoPublish" size="small" />
            </div>
          </div>
          <div class="platform-grid">
            <div v-for="p in dynamicPlatforms" :key="p.name" class="platform-item"
              :class="{ active: selectedPlatforms.includes(p.name) }" @click="togglePlatform(p.name)">
              <div class="platform-icon">
                <img v-if="p.faviconUrl" :src="p.faviconUrl" alt="" style="width:24px;height:24px;" />
                <component v-else :is="guessPlatformIcon(p)"
                  :style="{ fontSize: '24px', color: guessPlatformColor(p) }" />
              </div>
              <div class="platform-name">{{ p.platformName || p.name }}</div>
              <div class="platform-check" v-if="selectedPlatforms.includes(p.name)">
                <check-circle-filled style="color: #52c41a; font-size: 16px;" />
              </div>
              <!-- 删除账号状态与打开发布页按钮 -->
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="modal-actions">
          <a-button @click="closePublishModal">取消</a-button>
          <a-button type="primary" :disabled="selectedPlatforms.length === 0" @click="handlePublish">
            发布到选中平台 ({{ selectedPlatforms.length }})
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 图片预览模态框 -->
    <a-modal v-model:open="imagePreviewVisible" title="封面预览" width="90%" style="max-width: 1200px;" :footer="null"
      centered>
      <div class="image-preview-container">
        <img v-if="coverDetail && getCoverUrl()" :src="getCoverUrl()" alt="封面预览" class="preview-image" />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';
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
import { getVideoList, deleteVideo } from '@/api/modules/videoApi.js';
import { getImageDetail } from '@/api/modules/imageApi.js';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import UserSelect from '@/components/UserSelect.vue'

import {
  checkServiceStatus as extCheckServiceStatus,
  openOptions as extOpenOptions,
  funcPublish as extFuncPublish,
  funcGetPermission as extFuncGetPermission,
  getPlatformInfos as extGetPlatformInfos,
  getAccountInfos as extGetAccountInfos,

} from '@/utils/extensionMessaging.js';

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
const isAutoPublish = ref(false);


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
  if (!video?.video_path) {
    console.log('视频路径为空');
    return '';
  }

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


const handlePublish = async () => {
  if (!selectedVideo.value) {
    ElMessage.warning('未选择视频');
    return;
  }
  if (!selectedPlatforms.value.length) {
    ElMessage.warning('请选择至少一个平台');
    return;
  }
  try {
    const serviceResp = await checkServiceStatus();
    if (!serviceResp) {
      ElMessage.error('扩展服务未运行，请先启动扩展');
      return;
    }

    let trustResp = await requestDomainTrust(5000);
    if (!trustResp || trustResp.status !== 'ok' || !trustResp.trusted) {
      console.log('当前域名未授权，打开扩展设置页以授权');
      await openOptions();
      ElMessage.info('请在扩展设置页授权当前域名后，系统将自动继续');
    }

    const selectedSet = new Set(selectedPlatforms.value);
    const targetPlatforms = (dynamicPlatforms.value || []).filter(p => selectedSet.has(p.name));
    console.log('选中的平台:', selectedPlatforms.value, '\n匹配到的平台:', targetPlatforms.map(p => ({ name: p.name })));
    if (!targetPlatforms.length) {
      ElMessage.error('未匹配到选中的平台，请先在列表中选择平台后重试');
      return;
    }

    await new Promise(r => setTimeout(r, 1000));

    const syncPlatforms = targetPlatforms.map(p => ({ name: p.name, platformName: p.platformName, injectUrl: p.injectUrl, faviconUrl: p.faviconUrl, accountKey: p.accountKey, extraConfig: {} }));

    // 生成 HTTP 可访问的 URL，供页面和扩展 fetch
    const convertToHttpUrl = (p) => {
      if (!p) return '';
      if (p.startsWith('http')) return p;
      // /media/... 相对路径 -> 本地服务 http://127.0.0.1:8089/media/...
      if (p.startsWith('/media/')) return `http://127.0.0.1:8089${p}`;
      // 绝对 Windows 路径 -> 取文件名，拼到 /media/videos/
      const fileName = p.split(/[\\/]/).pop();
      if (fileName) return `http://127.0.0.1:8089/media/videos/${fileName}`;
      return p;
    };
    const httpVideoUrl = convertToHttpUrl(selectedVideo.value?.video_path || selectedVideo.value?.videoUrl || '');
    const absVideoUrl = (() => {
      const p = selectedVideo.value?.video_path || selectedVideo.value?.videoUrl || '';
      if (!p) return '';
      if (p.startsWith('http') || /^[A-Za-z]:/.test(p) || p.startsWith('/F:')) return p;
      if (p.startsWith('/media/')) return `F:\\pycharm_workspace\\astra${p.replace(/\//g, '\\')}`;
      const fileName = p.split(/[\\/]/).pop();
      if (fileName && !p.includes('\\') && !p.includes('/')) return `F:\\pycharm_workspace\\astra\\media\\videos\\${fileName}`;
      return p;
    })();
    console.log('发布使用的 HTTP 视频URL:', httpVideoUrl);
    const fileName = (() => {
      const p = selectedVideo.value?.video_path || selectedVideo.value?.videoUrl || '';
      const n = p.split(/[\\/]/).pop();
      if (n) return n;
      const t = editableVideo.value?.title || selectedVideo.value?.title;
      if (t) return t.endsWith('.mp4') ? t : `${t}.mp4`;
      return 'video.mp4';
    })();
    const syncData = {
      platforms: syncPlatforms,
      isAutoPublish: isAutoPublish.value,
      data: {
        title: editableVideo.value?.title || selectedVideo.value?.title || '未命名视频',
        content: editableVideo.value?.content || '',
        video: {
          name: fileName,
          url: httpVideoUrl,
          originUrl: absVideoUrl,
          type: 'video/mp4',
          size: 2015548,
        },
        tags: (editableVideo.value?.tags || '').split(' ').map(t => t.trim()).filter(Boolean)
      }
    };

    console.log('发送扩展发布请求 syncData:', JSON.stringify(syncData, null, 2));
    await extFuncPublish(syncData);
    ElMessage.success(`发布请求已发送到扩展（${syncPlatforms.length}个平台），请在新标签页查看扩展自动填充`);
    publishModalVisible.value = false;
  } catch (e) {
    console.error('发布异常:', e);
    ElMessage.error(e?.message || '发布异常');
  }
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
  if (!coverId) return;
  try {
    const response = await getImageDetail(coverId);
    console.log('封面详情响应:', response);
    if (response && response.data) {
      coverDetail.value = response.data;
    } else if (response) {
      // 如果response存在但没有data字段，直接使用response
      coverDetail.value = response;
    }
  } catch (error) {
    console.error('获取封面详情失败:', error);
    // API调用失败时，使用coverId作为img_name创建基本的封面信息
    if (coverId) {
      coverDetail.value = {
        img_name: `${coverId}.png`,
        id: coverId
      };
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




// 检查扩展服务状态
const checkServiceStatus = async (timeout = 5000) => {
  try {
    const resp = await extCheckServiceStatus(timeout);
    console.log('扩展服务状态响应(视图层):', resp);
    return resp;
  } catch (error) {
    console.error('Service check failed:', error);
    return null;
  }
};

// 请求域名授权
const requestDomainTrust = async (timeout = 30000) => {
  try {
    return await extFuncGetPermission(timeout);
  } catch (error) {
    console.error('Domain trust request failed:', error);
    return { status: 'error', trusted: false };
  }
};


// 打开扩展选项页面
const openOptions = async (timeout = 5000) => {
  try {
    const resp = await extOpenOptions(timeout);
    console.log('扩展设置页调用结果:', resp);
    return resp;
  } catch (error) {
    console.error('Failed to open extension options:', error);
    return null;
  }
};



const dynamicPlatforms = ref([]);
// 本地自定义平台列表（可按需修改 injectUrl/homeUrl/icon 等）
const localPlatforms = [
  {
    type: 'VIDEO',
    name: 'VIDEO_BILIBILI',
    homeUrl: 'https://member.bilibili.com/',
    faviconUrl: 'https://static.hdslb.com/images/favicon.ico',
    iconifyIcon: 'simple-icons:bilibili',
    platformName: 'B站',
    injectUrl: 'https://member.bilibili.com/platform/upload/video/frame',
    tags: ['CN'],
    accountKey: 'bilibili',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_DOUYIN',
    homeUrl: 'https://creator.douyin.com/',
    faviconUrl: 'https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico',
    platformName: '抖音',
    injectUrl: 'https://creator.douyin.com/creator-micro/content/upload',
    tags: ['CN'],
    accountKey: 'douyin',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_YOUTUBE',
    homeUrl: 'https://studio.youtube.com/',
    faviconUrl: 'https://www.youtube.com/favicon.ico',
    platformName: '油管',
    injectUrl: 'https://studio.youtube.com/',
    tags: ['International'],
    accountKey: 'youtube',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_REDNOTE',
    homeUrl: 'https://creator.xiaohongshu.com',
    faviconUrl: 'https://creator.xiaohongshu.com/favicon.ico',
    iconifyIcon: 'simple-icons:xiaohongshu',
    platformName: '小红书',
    injectUrl: 'https://creator.xiaohongshu.com/publish/publish?from=tab_switch&target=video',
    tags: ['CN'],
    accountKey: 'rednote',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_TIKTOK',
    homeUrl: 'https://www.tiktok.com/tiktokstudio',
    faviconUrl: 'https://pic1.zhimg.com/80/v2-9ad49e8e52b473e4c366b69bc9653a45_1440w.png',
    platformName: 'TIK-TOK',
    injectUrl: 'https://www.tiktok.com/tiktokstudio/upload',
    tags: ['International'],
    accountKey: 'tiktok',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_WEIXINCHANNEL',
    homeUrl: 'https://channels.weixin.qq.com/platform',
    faviconUrl: 'https://res.wx.qq.com/t/wx_fed/finder/helper/finder-helper-web/res/favicon-v2.ico',
    platformName: '微信视频号',
    injectUrl: 'https://channels.weixin.qq.com/platform/post/create',
    tags: ['CN'],
    accountKey: 'weixinchannel',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_KUAISHOU',
    homeUrl: 'https://cp.kuaishou.com/',
    faviconUrl: 'https://www.kuaishou.com/favicon.ico',
    platformName: '快手',
    injectUrl: 'https://cp.kuaishou.com/article/publish/video',
    tags: ['CN'],
    accountKey: 'kuaishou',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_BAIJIAHAO',
    homeUrl: 'https://baijiahao.baidu.com/',
    faviconUrl: 'https://pic.rmb.bdstatic.com/10e1e2b43c35577e1315f0f6aad6ba24.vnd.microsoft.icon',
    platformName: '百家号',
    injectUrl: 'https://baijiahao.baidu.com/builder/rc/edit?type=videoV2',
    tags: ['CN'],
    accountKey: 'baijiahao',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_WEIBO',
    homeUrl: 'https://weibo.com/',
    faviconUrl: 'https://weibo.com/favicon.ico',
    platformName: '微博',
    injectUrl: 'https://weibo.com/upload/channel',
    tags: ['CN'],
    accountKey: 'weibo',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_OKJIKE',
    homeUrl: 'https://web.okjike.com',
    faviconUrl: 'https://web.okjike.com/favicon.ico',
    platformName: 'OKJIKE',
    injectUrl: 'https://web.okjike.com',
    tags: ['CN'],
    accountKey: 'okjike',
  },
   {
    type: 'VIDEO',
    name: 'VIDEO_BLUESKY',
    homeUrl: 'https://bsky.app/',
    faviconUrl: 'https://web-cdn.bsky.app/static/favicon-32x32.png',
    platformName: 'BLUESKY',
    injectUrl: 'https://bsky.app/',
    tags: ['International'],
    accountKey: 'bluesky',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_ZHIHU',
    homeUrl: 'https://www.zhihu.com/',
    faviconUrl: 'https://www.zhihu.com/favicon.ico',
    platformName: '知乎',
    injectUrl: 'https://www.zhihu.com/zvideo/upload-video',
    tags: ['CN'],
    accountKey: 'zhihu',
  },
   {
    type: 'VIDEO',
    name: 'VIDEO_EASTMONEY',
    homeUrl: 'https://www.eastmoney.com/',
    faviconUrl: 'https://mycaifuhao.eastmoney.com/public/publish/favicon.ico',
    platformName: 'EASTMONEY',
    injectUrl: 'https://mp.eastmoney.com/collect/pc_writer/index.html#/publish/video',
    tags: ['CN'],
    accountKey: 'eastmoney',
  },
  {
    type: 'VIDEO',
    name: 'VIDEO_XIAOHEIHE',
    homeUrl: 'https://www.xiaoheihe.cn/',
    faviconUrl: 'https://www.xiaoheihe.cn/favicon.ico',
    platformName: '小黑盒',
    injectUrl: 'https://www.xiaoheihe.cn/creator/editor/draft/video',
    tags: ['CN'],
    accountKey: 'xiaoheihe',
  },
 {
    type: 'VIDEO',
    name: 'VIDEO_TOUTIAOHAO',
    homeUrl: 'https://www.toutiao.com/',
    faviconUrl: 'https://sf1-cdn-tos.toutiaostatic.com/obj/ttfe/pgcfe/sz/mp_logo.png',
    platformName: '今日头条',
    injectUrl: 'https://mp.toutiao.com/profile_v4/xigua/upload-video',
    tags: ['CN'],
    accountKey: 'toutiaohao',
  },
];

// 初始化平台列表到 UI
dynamicPlatforms.value = localPlatforms;

const guessPlatformIcon = (p) => {
  const key = (p?.name || p?.platformName || '').toLowerCase();
  if (key.includes('douyin') || key.includes('抖音')) return PlayCircleOutlined;
  if (key.includes('bilibili') || key.includes('哔哩')) return PlayCircleOutlined;
  if (key.includes('weibo')) return WeiboOutlined;
  if (key.includes('wechat') || key.includes('微信')) return WechatOutlined;
  if (key.includes('toutiao') || key.includes('头条')) return GlobalOutlined;
  return PlayCircleOutlined;
};

const guessPlatformColor = (p) => {
  const key = (p?.name || p?.platformName || '').toLowerCase();
  if (key.includes('douyin') || key.includes('抖音')) return '#000000';
  if (key.includes('bilibili') || key.includes('哔哩')) return '#00a1d6';
  if (key.includes('weibo')) return '#e6162d';
  if (key.includes('wechat') || key.includes('微信')) return '#07c160';
  if (key.includes('toutiao') || key.includes('头条')) return '#ff6600';
  return '#666';
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
  object-fit: cover;
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