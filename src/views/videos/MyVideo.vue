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

    <!-- 顶部工具栏：添加视频 + 本页全选 + 批量删除 -->
    <div class="toolbar-area">
      <a-button type="primary" @click="openCreateModal">添加视频</a-button>
      <a-button style="margin-left:8px" @click="toggleSelectAllCurrentPage" :disabled="videoList.length === 0">
        {{ isAllCurrentPageSelected ? '取消全选' : '全选' }}
      </a-button>
      <a-button danger style="margin-left:8px" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
        批量删除
      </a-button>
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
                  <div class="select-checkbox">
                    <a-checkbox :checked="selectedIds.includes(video.id)" @update:checked="(val) => toggleSelectOne(video.id, val)" />
                  </div>
                  <!-- 成功且已上传时显示视频播放器（支持 Regular 与 JianYing） -->
                  <div v-if="video.result === 'Success' && video.video_path && (video.video_type === 'Regular' || video.video_type === 'JianYing')"
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
                    :class="{ 'pointer-events-none': video.result === 'Success' && !!video.video_path }">
                    <!-- 生成中状态 -->
                    <div v-if="video.result === 'Processing'" class="tip-text processing">
                      视频正在急速生成中...
                    </div>
                
                    <!-- 生成失败状态 -->
                    <div v-else-if="video.result === 'Fail'" class="tip-text failed">
                      视频生成失败，请重试
                    </div>
                
                    <!-- 剪映视频成功但未上传：提示去剪映播放 -->
                    <div v-else-if="video.video_type === 'JianYing' && video.result === 'Success' && !video.video_path"
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

                  <!-- 视频大小和生成耗时一行 -->
                  <div class="meta-row">
                    <div class="meta-item">
                      <span class="label">大小:</span>
                       <span class="value">{{ formatBytes(video.size) }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="label">耗时:</span>
                       <span class="value">{{ formatCost(video.cost) }}</span>
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
                <a-button size="small" @click="triggerUpload(video)">
                  {{ video.video_path ? '替换' : '上传' }}
                </a-button>

                <a-button danger size="small" @click="handleDelete(video)">删除</a-button>
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
    <a-modal v-model:open="publishModalVisible" title="发布视频" width="960px" :footer="null" @cancel="closePublishModal">
      <div class="publish-modal-content">
        <!-- 视频信息部分 -->
        <div class="video-info-section">
          <h3>视频信息</h3>
          <div class="video-info-content">
            <div class="cover-section">
              <div class="cover-preview">
                <img v-if="verticalCoverDetail && getVerticalCoverUrl()"
                  :src="getVerticalCoverUrl()" class="cover-image" alt="竖版封面"
                  @click="showImagePreview" style="cursor: pointer;" />
                <div v-else class="cover-placeholder">
                  <video-camera-outlined style="font-size: 32px; color: #ccc;" />
                  <span>暂无竖版封面</span>
                </div>
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
                <a-select
                  v-model:value="editableVideo.tagList"
                  mode="tags"
                  :tokenSeparators="[' ']"
                  placeholder="请输入标签，多个标签之间用空格分隔（最多5个）"
                  style="width: 100%"
                  @change="handleTagChange"
                />
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
                <img v-if="p.faviconUrl" :src="p.faviconUrl" alt="" style="width:20px;height:20px;" />
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
          <a-button type="primary" :disabled="selectedPlatforms.length === 0 || !hasTags" @click="handlePublish">
            开始发布 ({{ selectedPlatforms.length }})
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

    <!-- 新增：创建视频弹窗 -->
    <a-modal v-model:open="createModalVisible" title="新增视频" :footer="null" width="600px" centered>
      <a-form layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="createForm.title" placeholder="请输入视频标题" />
        </a-form-item>
        <a-form-item label="内容">
          <a-textarea v-model:value="createForm.content" placeholder="可选：请输入视频文案内容" :rows="3" />
        </a-form-item>
        <a-form-item label="视频文件">
          <input ref="createVideoInput" type="file" accept="video/*" style="display:none" @change="handleCreateVideoFileChange" />
          <a-button size="small" @click="triggerCreateVideoSelect">{{ createForm.videoFile ? '更改视频文件' : '选择视频文件' }}</a-button>
          <span v-if="createForm.videoFile" style="margin-left:8px;color:#666;">{{ createForm.videoFile.name }}</span>
        </a-form-item>
        <a-form-item label="横版封面图片">
          <input ref="createCoverInput" type="file" accept="image/*" style="display:none" @change="handleCreateCoverChange" />
          <a-button size="small" @click="triggerCreateCoverSelect">{{ createForm.coverFile ? '更改封面' : '选择封面' }}</a-button>
          <span v-if="createForm.coverFile" style="margin-left:8px;color:#666;">{{ createForm.coverFile.name }}</span>
        </a-form-item>
        <!-- 新增：竖版封面上传 -->
        <a-form-item label="竖版封面上传">
          <input ref="createVerticalCoverInput" type="file" accept="image/*" style="display:none" @change="handleCreateVerticalCoverChange" />
          <a-button size="small" @click="triggerCreateVerticalCoverSelect">{{ createForm.verticalCoverFile ? '更改竖版封面' : '选择竖版封面' }}</a-button>
          <span v-if="createForm.verticalCoverFile" style="margin-left:8px;color:#666;">{{ createForm.verticalCoverFile.name }}</span>
        </a-form-item>
      </a-form>
      <div style="display:flex; justify-content:flex-end; gap:12px;">
        <a-button @click="closeCreateModal">取消</a-button>
        <a-button type="primary" @click="submitCreateVideo">提交</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
 
import {
  VideoCameraOutlined,
  CheckCircleFilled
} from '@ant-design/icons-vue';
import Pagination from '@/components/Pagination.vue';
import { getVideoList, deleteVideo, uploadVideoFile, createVideo, batchDeleteVideos } from '@/api/modules/videoApi.js';
import { getImageDetail } from '@/api/modules/imageApi.js';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import UserSelect from '@/components/UserSelect.vue'
import { useDialog, useMessage } from 'naive-ui';

import {
  checkServiceStatus as extCheckServiceStatus,
  openOptions as extOpenOptions,
  funcPublish as extFuncPublish,
  funcGetPermission as extFuncGetPermission,
  getPlatformInfos as extGetPlatformInfos,
 

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
// 声明：竖版封面详情与定时发布时间
const verticalCoverDetail = ref(null);
const scheduledPublishAt = ref(null);
const imagePreviewVisible = ref(false);
const editableVideo = ref({
  title: '',
  content: '',
  coverPath: '',
  tagList: []
});
const isAutoPublish = ref(false);
// 标签工具与必填校验
const MAX_TAGS = 5;
const toTagList = (val) =>
  (Array.isArray(val) ? val : String(val || '').split(' '))
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, MAX_TAGS);
const hasTags = computed(() => (editableVideo.value?.tagList || []).filter(t => t && t.trim()).length > 0);
const handleTagChange = (value) => {
  const list = (value || []).map(t => String(t).trim()).filter(Boolean);
  if (list.length > MAX_TAGS) {
    editableVideo.value.tagList = list.slice(0, MAX_TAGS);
    ElMessage.warning(`最多只能添加${MAX_TAGS}个标签`);
  } else {
    editableVideo.value.tagList = list;
  }
};

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
  selectedIds.value = [];
  loadVideoList();
};

// 处理分页变化
const handlePageChange = ({ current, pageSize: newPageSize }) => {
  pagination.current = current;
  pagination.pageSize = newPageSize;
  selectedIds.value = [];
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


// 新增：创建视频弹窗与逻辑
const createModalVisible = ref(false);
const createForm = reactive({
  title: '',
  content: '',
  videoFile: null,
  coverFile: null,
  verticalCoverFile: null,
});
const createVideoInput = ref(null);
const createCoverInput = ref(null);
const createVerticalCoverInput = ref(null);

const openCreateModal = () => {
  createModalVisible.value = true;
};
const closeCreateModal = () => {
  createModalVisible.value = false;
  createForm.title = '';
  createForm.content = '';
  createForm.videoFile = null;
  createForm.coverFile = null;
  createForm.verticalCoverFile = null;
};
const triggerCreateVideoSelect = () => {
  if (createVideoInput.value) createVideoInput.value.click();
};
const triggerCreateCoverSelect = () => {
  if (createCoverInput.value) createCoverInput.value.click();
};
const triggerCreateVerticalCoverSelect = () => {
  if (createVerticalCoverInput.value) createVerticalCoverInput.value.click();
};
const handleCreateVideoFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('video/')) {
    ElMessage.error('请选择视频文件');
    return;
  }
  createForm.videoFile = file;
};
const handleCreateCoverChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('封面大小不能超过5MB');
    return;
  }
  createForm.coverFile = file;
};
const handleCreateVerticalCoverChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('封面大小不能超过5MB');
    return;
  }
  createForm.verticalCoverFile = file;
};
const submitCreateVideo = async () => {
  if (!createForm.title || !createForm.title.trim()) {
    ElMessage.warning('请填写视频标题');
    return;
  }
  try {
    const fd = new FormData();
    fd.append('title', createForm.title.trim());
    if (createForm.content && createForm.content.trim()) fd.append('content', createForm.content.trim());
    if (createForm.videoFile) fd.append('video_file', createForm.videoFile);
    if (createForm.coverFile) fd.append('cover', createForm.coverFile);
    if (createForm.verticalCoverFile) fd.append('vertical_cover', createForm.verticalCoverFile);

    ElMessage.info('正在创建视频...');
    await createVideo(fd);
    ElMessage.success('视频创建成功');
    closeCreateModal();
    loadVideoList();
  } catch (err) {
    console.error('创建视频失败:', err);
    ElMessage.error(err?.message || '创建视频失败');
  }
};
const closePublishModal = () => {
  publishModalVisible.value = false;
  selectedVideo.value = null;
  selectedPlatforms.value = [];
  editableVideo.value.tagList = [];
  coverDetail.value = null;
};

// 新增：推断图片 MIME 类型
const inferMimeFromName = (name) => {
  const ext = (name || '').split('.').pop()?.toLowerCase();
  if (!ext) return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  return `image/${ext}`;
};

// 新增：路径转换工具（与平台脚本一致）
const convertToAbsolutePath = (relativePath) => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http') || relativePath.startsWith('F:') || relativePath.startsWith('/F:')) {
    return relativePath;
  }
  if (relativePath.startsWith('/media/')) {
    return `F:\\pycharm_workspace\\astra${relativePath.replace(/\//g, '\\')}`;
  }
  if (!relativePath.includes('/') && !relativePath.includes('\\')) {
    return `F:\\pycharm_workspace\\astra\\media\\videos\\${relativePath}`;
  }
  return relativePath;
};

const convertToHttpUrl = (p) => {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  if (p.startsWith('/media/')) return `http://127.0.0.1:8089${p}`;
  const fileName = p.split(/[\\\/]/).pop();
  if (fileName) return `http://127.0.0.1:8089/media/videos/${fileName}`;
  return p;
};

// 新增：打开发布弹窗
const showPublishModal = async (video) => {
  selectedVideo.value = video || null;
  editableVideo.value.title = video?.title || '';
  editableVideo.value.content = video?.content || '';
  editableVideo.value.tagList = Array.isArray(video?.tags) ? video.tags : [];
  editableVideo.value.coverPath = '';

  // 重置选择状态
  selectedPlatforms.value = [];
  imagePreviewVisible.value = false;

  // 加载封面详情
  try {
    const coverId = video?.cover || video?.coverId || null;
    if (coverId) {
      await loadCoverDetail(coverId);
    } else if (video?.cover_path) {
      const name = (video.cover_path || '').split(/[\\\/]/).pop() || '';
      const imgName = name.replace('videos', 'images');
      coverDetail.value = imgName ? { img_name: imgName } : null;
    } else {
      coverDetail.value = null;
    }
    const vCoverId = video?.vertical_cover || video?.verticalCover || null;
    if (vCoverId) {
      await loadVerticalCoverDetail(vCoverId);
    } else {
      verticalCoverDetail.value = null;
    }
  } catch (e) {
    console.warn('初始化封面失败:', e);
    coverDetail.value = null;
    verticalCoverDetail.value = null;
  }

  await loadPlatformsForPublish();

  publishModalVisible.value = true;
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

// 构造封面发布信息
const getCoverPublishInfo = () => {
  // 简化为仅依赖后端返回的封面详情（cover 为图片 ID，经 loadCoverDetail 获取）
  if (!coverDetail.value || !getCoverUrl()) return null;
  const name = coverDetail.value.img_name || 'cover.png';
  const url = getCoverUrl();
  const fmt = (coverDetail.value.spec?.format || '').toLowerCase();
  const type = fmt
    ? (fmt === 'jpg' || fmt === 'jpeg' ? 'image/jpeg'
      : fmt === 'png' ? 'image/png'
      : fmt === 'gif' ? 'image/gif'
      : fmt === 'webp' ? 'image/webp'
      : `image/${fmt}`)
    : inferMimeFromName(name);
  const size = coverDetail.value.spec?.size || 0;
  return { 'name':name, "url":url, "type":type, "size":size };
};

// 新增：获取竖版封面详情
const loadVerticalCoverDetail = async (coverId) => {
  if (!coverId) return;
  try {
    const response = await getImageDetail(coverId);
    if (response && response.data) {
      verticalCoverDetail.value = response.data;
    } else if (response) {
      verticalCoverDetail.value = response;
    }
  } catch (error) {
    console.error('获取竖版封面详情失败:', error);
    if (coverId) {
      verticalCoverDetail.value = {
        img_name: `${coverId}.png`,
        id: coverId
      };
    } else {
      verticalCoverDetail.value = null;
    }
  }
};

// 新增：获取竖版封面URL
const getVerticalCoverUrl = () => {
  if (!verticalCoverDetail.value?.img_name) return '';
  return `http://127.0.0.1:8089/media/images/${verticalCoverDetail.value.img_name}`;
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

// 批量选择/删除逻辑
const selectedIds = ref([]);
const currentPageIds = computed(() => (videoList.value || []).map(v => v.id));
const isAllCurrentPageSelected = computed(() => currentPageIds.value.length > 0 && currentPageIds.value.every(id => selectedIds.value.includes(id)));
const toggleSelectAllCurrentPage = () => {
  if (isAllCurrentPageSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !currentPageIds.value.includes(id));
  } else {
    const set = new Set(selectedIds.value);
    currentPageIds.value.forEach(id => set.add(id));
    selectedIds.value = Array.from(set);
  }
};
const toggleSelectOne = (id, checked) => {
  const idx = selectedIds.value.indexOf(id);
  if (checked) {
    if (idx === -1) selectedIds.value.push(id);
  } else {
    if (idx > -1) selectedIds.value.splice(idx, 1);
  }
};

const handleBatchDelete = async () => {
  const ids = [...selectedIds.value];
  if (ids.length === 0) {
    message.warning('请先选择视频');
    return;
  }
  const confirmed = await new Promise((resolve) => {
    dialog.warning({
      title: '批量删除确认',
      content: `确定要删除选中的 ${ids.length} 个视频吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
    });
  });
  if (!confirmed) return;
  // 确认后立即显示全局加载
  loading.value = true;
  try {
    const resp = await batchDeleteVideos(ids);
    if (resp && resp.code === 0) {
      const data = resp.data || {};
      const deletedCount = (data.deleted || []).length;
      const notFoundCount = (data.not_found || []).length;
      const failedCount = (data.failed || []).length;
      message.success(`删除完成：成功 ${deletedCount}，未找到 ${notFoundCount}，失败 ${failedCount}`);
    } else {
      message.error(resp?.message || '批量删除失败');
    }
  } catch (e) {
    console.error('批量删除异常:', e);
    message.error(e?.message || '批量删除异常');
  } finally {
    selectedIds.value = [];
    // 刷新列表并在其中关闭 loading
    await loadVideoList();
  }
};

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

// 新增：触发上传/替换主视频文件
const triggerUpload = (video) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*';
  input.style.display = 'none';
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      ElMessage.info(video.video_path ? '正在替换视频...' : '正在上传视频...');
      await uploadVideoFile(video.id, file);
      ElMessage.success(video.video_path ? '视频替换成功' : '视频上传成功');
      loadVideoList();
    } catch (err) {
      console.error('上传/替换视频失败:', err);
      ElMessage.error(err?.message || '上传/替换视频失败');
    } finally {
      input.remove();
    }
  };
  document.body.appendChild(input);
  input.click();
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

// 新增：发布到选中平台
const handlePublish = async () => {
  publishModalVisible.value = false;
  try {
    if (!selectedVideo.value) {
      message.warning('未选择视频');
      return;
    }
    if (selectedPlatforms.value.length === 0) {
      message.warning('请至少选择一个平台');
      return;
    }
    // 移除标签校验
    const platformMap = new Map((dynamicPlatforms.value || []).map(p => [p.name, p]));
    const targetPlatforms = selectedPlatforms.value.map(name => platformMap.get(name)).filter(Boolean);
    if (targetPlatforms.length === 0) {
      message.error('未匹配到选中的平台');
      return;
    }

    // 生成封面发布信息
    let cover = null;
    if (editableVideo.value.coverPath && editableVideo.value.coverPath.startsWith('data:')) {
      cover = {
        name: editableVideo.value.coverFileName || 'cover.png',
        url: editableVideo.value.coverPath,
        type: editableVideo.value.coverFileType || 'image/png',
        size: editableVideo.value.coverFileSize || 0,
      };
    } else {
      cover = getCoverPublishInfo();
    }
    // 新增：竖版封版信息（仅后端已有的竖版封版）
    const verticalCover = getVerticalCoverPublishInfo();

    const video = selectedVideo.value;
    const videoFileName = (video.video_path || '').split(/[\\\/]/).pop() || 'video.mp4';
    const httpVideoUrl = convertToHttpUrl(video.video_path || video.videoUrl || '');
    const absVideoUrl = convertToAbsolutePath(video.video_path || video.videoUrl || '');

    const scheduledTs = scheduledPublishAt.value ? scheduledPublishAt.value.valueOf() : undefined;

    const syncData = {
      platforms: targetPlatforms.map(p => ({
        name: p.name,
        platformName: p.platformName,
        injectUrl: p.injectUrl,
        faviconUrl: p.faviconUrl,
        accountKey: p.accountKey,
        extraConfig: {}
      })),
      isAutoPublish: isAutoPublish.value,
      data: {
        title: (editableVideo.value.title || video.title || '未命名视频').trim(),
        content: (editableVideo.value.content || video.content || '').trim(),
        cover: verticalCover,
        verticalCover: cover,
        scheduledPublishTime: scheduledTs,
        videoUrl: httpVideoUrl,
        video: {
          name: videoFileName,
          url: httpVideoUrl,
          type: 'video/mp4',
          size: video.file_size || video.size || 0,
          originUrl: absVideoUrl
        },
        tags: (editableVideo.value.tagList || []).map(t => String(t).trim()).filter(Boolean).slice(0, MAX_TAGS)
      }
    };

    console.log('发送扩展发布请求 syncData:', JSON.stringify(syncData, null, 2));
    await extFuncPublish(syncData);
    message.success(`发布请求已发送到扩展（${targetPlatforms.length}个平台），请在新标签页查看扩展自动填充`);
  } catch (e) {
    console.error('发布异常:', e);
    message.error(e?.message || '发布异常');
  } finally {
    selectedVideo.value = null;
    selectedPlatforms.value = [];
  }
};



const dynamicPlatforms = ref([]);

// 初始化平台列表到 UI
dynamicPlatforms.value = [];

const normalizePlatforms = (raw) => {
  let arr = Array.isArray(raw) ? raw : Object.values(raw || {});
  return (arr || []).map((p) => ({
    ...p,
    name: p?.name || p?.platformName || p?.key || p?.id,
  }));
};

const loadPlatformsForPublish = async () => {
  try {
    let list = await extGetPlatformInfos('VIDEO');
    let platforms = normalizePlatforms(list);
    if (!platforms.length) {
      const all = await extGetPlatformInfos();
      platforms = normalizePlatforms(all).filter((p) => (p.type === 'VIDEO' || !p.type));
    }
    dynamicPlatforms.value = platforms;
  } catch (_) {
    dynamicPlatforms.value = [];
  }
};

 


// 工具函数与状态文本渲染
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

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

const formatBytes = (bytes) => {
  if (bytes == null || isNaN(bytes)) return '未知';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024; // KB
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

const formatCost = (seconds) => {
  if (seconds == null || isNaN(seconds)) return '未知';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h}小时`);
  if (m) parts.push(`${m}分`);
  if (sec || parts.length === 0) parts.push(`${sec}秒`);
  return parts.join('');
};

const getVideoUrl = (video) => {
  if (!video?.video_path) {
    console.log('视频路径为空');
    return '';
  }
  return video.video_path;
};

// 视频事件处理函数
const handleVideoError = (event) => {
  console.error('视频加载失败:', event);
  message.error('视频加载失败');
};
const handleVideoLoadStart = (event) => {
  console.log('视频开始加载:', event?.target?.src);
};
const handleVideoCanPlay = (event) => {
  console.log('视频可以播放:', event?.target?.src);
};
const handleVideoLoadedMetadata = (event) => {
  console.log('视频元数据加载完成:', event?.target?.src);
  if (event?.target?.currentTime > 0) {
    event.target.currentTime = 0;
  }
};
const handleVideoClick = (event) => {
  console.log('视频被点击:', event?.target);
};
const handleVideoPlay = (event) => {
  console.log('视频开始播放:', event?.target?.currentTime);
};
const handleVideoPause = (event) => {
  console.log('视频暂停:', event?.target?.currentTime);
};

const getVerticalCoverPublishInfo = () => {
  if (!verticalCoverDetail.value || !getVerticalCoverUrl()) return null;
  const name = verticalCoverDetail.value.img_name || 'vertical_cover.png';
  const url = getVerticalCoverUrl();
  const fmt = (verticalCoverDetail.value.spec?.format || '').toLowerCase();
  const size = verticalCoverDetail.value.spec?.size || 0;
  return {
    name,
    url,
    type: fmt ? `image/${fmt}` : 'image/png',
    size
  };
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
  padding: 16px;
}

/* 顶部右侧工具栏样式 */
.toolbar-area {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 12px 0 8px;
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
  object-position: center;
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
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.platform-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
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
.select-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 2px 6px;
}
</style>
