<template>
  <div class="graphic-text-container">
    <a-row class="editor-row">
      <!-- 编辑区域 -->
      <a-col 
        :span="editorSpan" 
        v-show="editorSpan > 0"
        class="editor-column"
      >
        <div class="editor-area">
          <!-- 标题区域 -->
          <div class="title-section">
            <a-input
              v-model:value="title"
              placeholder="请输入标题"
              :maxlength="30"
              show-count
              class="title-input"
            />
            <div class="save-status" v-if="route.params.id">
              <span v-if="hasUnsavedChanges" class="unsaved">• 未保存</span>
              <span v-else class="saved">• 已保存</span>
            </div>
          </div>
          
          <div class="image-insert">
            <a-upload
              :show-upload-list="false"
              :before-upload="beforeUpload"
            >
              <a-button type="primary">插入图片</a-button>
            </a-upload>
          </div>
          
          <a-textarea
            v-model:value="content"
            placeholder="请输入内容（支持Markdown语法）"
            :auto-size="{ minRows: 20, maxRows: 20 }"
            class="markdown-editor"
          />
          
          <div class="editor-actions">
            <a-button 
              type="primary" 
              @click="saveDraft" 
              :loading="saving"
              :disabled="!title.trim() || !content.trim()"
            >
              {{ route.params.id ? '保存' : '创建' }}
            </a-button>
            <a-button 
              style="margin-left:8px"
              @click="openPublish"
              :disabled="!title.trim() || !content.trim()"
            >
              发布
            </a-button>
          </div>
        </div>
      </a-col>

      <!-- 可拖拽的分割线 -->
      <div 
        v-show="editorSpan > 0 && previewSpan > 0"
        class="resizer"
        :style="{ left: resizerPosition }"
        @mousedown="startResize"
        @dblclick="resetLayout"
      >
        <div class="resizer-track">
          <div class="resizer-line" :class="{ 'resizer-active': isResizing }"></div>
          <div class="resizer-handle" :class="{ 'resizer-handle-active': isResizing }">
            <div class="resizer-grip">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <a-col 
        :span="previewSpan" 
        v-show="previewSpan > 0"
        class="preview-column"
      >
        <div class="preview-area">
          <!-- 快捷操作按钮 -->
          <div class="preview-controls">
            <a-button-group size="small">
              <!-- 编辑按钮 - 在预览模式下显示 -->
              <a-button 
                v-if="!isEditMode"
                @click="toggleEditMode"
                type="primary"
                title="编辑"
              >
                <EditOutlined />
                编辑
              </a-button>
              <!-- 返回预览按钮 - 在编辑模式下显示 -->
              <a-button 
                v-if="isEditMode"
                @click="toggleEditMode"
                type="default"
                title="返回预览"
              >
                <EyeOutlined />
                预览
              </a-button>
              <!-- 原有的显示编辑器按钮 - 仅在编辑模式且编辑器隐藏时显示 -->
              <a-button 
                v-if="isEditMode && editorSpan === 0"
                @click="showEditor"
                type="text"
                title="显示编辑器"
              >
                <EditOutlined />
              </a-button>
              <!-- 隐藏编辑器按钮 - 仅在编辑模式且预览区域不是全屏时显示 -->
              <a-button 
                v-if="isEditMode && previewSpan < 24"
                @click="hideEditor"
                type="text"
                title="隐藏编辑器"
              >
                <EyeOutlined />
              </a-button>
            </a-button-group>
          </div>
          
          <div v-if="loading" class="loading-container">
            <a-spin size="large" />
          </div>
          <div v-else>
            <h1 v-if="title">{{ title }}</h1>
            <div v-html="compiledMarkdown" class="markdown-preview"></div>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- 编辑器隐藏时的快捷显示按钮 - 仅在编辑模式下显示 -->
    <div v-if="isEditMode && editorSpan === 0" class="show-editor-btn">
      <a-button 
        @click="showEditor"
        type="primary"
        shape="circle"
        size="large"
        title="显示编辑器"
      >
        <EditOutlined />
      </a-button>
    </div>
    <a-modal v-model:open="publishModalVisible" title="发布图文" :footer="null" width="960px">
      <div style="margin-bottom:12px;">
        <a-form layout="vertical">
          <a-form-item label="标题">
            <a-input v-model:value="publishTitle" />
          </a-form-item>
          <a-form-item label="内容">
            <a-textarea v-model:value="publishContent" :rows="6" />
          </a-form-item>
        </a-form>
        <div style="display:flex; align-items:center; justify-content: space-between; margin-bottom:8px;">
          <a-checkbox v-model:checked="publishSelectAll" @change="toggleSelectAll">全选图片</a-checkbox>
          <a-switch v-model:checked="isAutoPublish" checked-children="自动" un-checked-children="手动" />
        </div>
        <div class="publish-images-grid compact">
          <div class="img-card" v-for="(img, idx) in publishImages" :key="idx" :class="{selected: img.selected}" @click="togglePublishImage(idx)">
            <img :src="img.url" />
            <div class="img-name" :title="img.name">{{ img.name || '图片' }}</div>
            <a-checkbox class="img-check" :checked="img.selected" />
          </div>
        </div>
      </div>
      <div class="publish-platforms">
        <div class="platform" v-for="p in dynamicPlatforms" :key="p.name" :class="{active: selectedPlatforms.includes(p.name)}" @click="togglePlatform(p.name)">
          <img v-if="p.faviconUrl" :src="p.faviconUrl" alt=""/>
          <span>{{ p.platformName || p.name }}</span>
        </div>
      </div>
      <div class="publish-actions">
        <a-button type="primary" @click="confirmPublish">开始发布</a-button>
        <a-button style="margin-left: 8px" @click="publishModalVisible = false">取消</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { EditOutlined, EyeOutlined } from '@ant-design/icons-vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { getTextDetail, saveText } from '@/api/modules/textApi';
import { funcPublish, getPlatformInfos, checkServiceStatus, funcGetPermission, openOptions } from '@/utils/extensionMessaging';

const md = new MarkdownIt();
const title = ref('');
const content = ref('');
const saving = ref(false);
const loading = ref(false);
const hasUnsavedChanges = ref(false);
const originalTitle = ref('');
const originalContent = ref('');
const route = useRoute();
const router = useRouter();

// 布局控制
const isEditMode = ref(false); // 新增：编辑模式状态
const editorSpan = ref(0); // 默认隐藏编辑器
const previewSpan = ref(24); // 默认全屏预览
const isResizing = ref(false);
const startX = ref(0);
const startEditorSpan = ref(12);

// 计算分割线位置
const resizerPosition = computed(() => {
  const percentage = (editorSpan.value / 24) * 100;
  return `calc(${percentage}% - 6px)`;
});

// 拖拽调整大小
const startResize = (e) => {
  isResizing.value = true;
  startX.value = e.clientX;
  startEditorSpan.value = editorSpan.value;
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  document.body.classList.add('resizing');
};

const handleResize = (e) => {
  if (!isResizing.value) return;
  
  const containerWidth = document.querySelector('.editor-row').offsetWidth;
  const deltaX = e.clientX - startX.value;
  const deltaSpan = Math.round((deltaX / containerWidth) * 24);
  
  let newEditorSpan = startEditorSpan.value + deltaSpan;
  
  // 限制最小和最大值
  newEditorSpan = Math.max(3, Math.min(21, newEditorSpan));
  
  editorSpan.value = newEditorSpan;
  previewSpan.value = 24 - newEditorSpan;
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  document.body.classList.remove('resizing');
};

// 双击重置布局
const resetLayout = () => {
  editorSpan.value = 12;
  previewSpan.value = 12;
};

// 显示/隐藏编辑器
const showEditor = () => {
  isEditMode.value = true;
  editorSpan.value = 12;
  previewSpan.value = 12;
};

const hideEditor = () => {
  isEditMode.value = false;
  editorSpan.value = 0;
  previewSpan.value = 24;
};

// 切换编辑模式
const toggleEditMode = () => {
  if (isEditMode.value) {
    hideEditor();
  } else {
    showEditor();
  }
};

// 获取图文详情
const fetchGraphicText = async (id) => {
  try {
    loading.value = true;
    const response = await getTextDetail(id);
    
    // 根据后端返回的数据结构进行适配
    let textData;
    if (response.data) {
      textData = response.data;
    } else if (response.results) {
      textData = response.results;
    } else {
      textData = response;
    }
    
    if (textData) {
      title.value = textData.title || '';
      content.value = textData.content || '';
      
      // 保存原始数据用于检测变更
      originalTitle.value = title.value;
      originalContent.value = content.value;
      
      hasUnsavedChanges.value = false;
    }
  } catch (error) {
    console.error('获取图文详情失败:', error);
    message.error('获取图文详情失败');
  } finally {
    loading.value = false;
  }
};

// 保存草稿
const saveDraft = async () => {
  if (!title.value.trim() || !content.value.trim()) {
    message.warning('请填写标题和内容');
    return;
  }

  try {
    saving.value = true;
    const textData = {
      title: title.value,
      content: content.value,
      text_id: route.params.id || ''
    };

    const response = await saveText(textData);
    
    if (response) {
      message.success('保存成功');
      
      // 更新原始数据
      originalTitle.value = title.value;
      originalContent.value = content.value;
      hasUnsavedChanges.value = false;
      
      // 保存成功后跳转到图文列表页面
      router.push({ name: 'texts' });
    }
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
};

// 图片上传前处理
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件!');
    return false;
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('图片大小不能超过10MB!');
    return false;
  }
  
  // 这里可以添加图片上传逻辑
  // 暂时插入占位符
  const imageMarkdown = `\n![${file.name}](/media/images/${file.name})\n`;
  content.value += imageMarkdown;
  
  return false; // 阻止自动上传
};

// Markdown编译
const compiledMarkdown = computed(() => {
  return DOMPurify.sanitize(md.render(content.value));
});

// 监听路由变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchGraphicText(newId);
  } else {
    // 清空表单
    title.value = '';
    content.value = '';
    originalTitle.value = '';
    originalContent.value = '';
    hasUnsavedChanges.value = false;
  }
}, { immediate: true });

// 监听标题和内容变化
watch([title, content], () => {
  if (route.params.id) {
    hasUnsavedChanges.value = 
      title.value !== originalTitle.value || 
      content.value !== originalContent.value;
  }
});

onMounted(() => {
  if (route.params.id) {
    fetchGraphicText(route.params.id);
  }
});

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});

const publishModalVisible = ref(false);
const dynamicPlatforms = ref([]);
const selectedPlatforms = ref([]);
const isAutoPublish = ref(false);
const publishTitle = ref('');
const publishContent = ref('');
const publishImages = ref([]);
const publishSelectAll = ref(true);
const staticBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089';

const convertToHttpUrl = (p) => {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  if (p.startsWith('/media/')) return `${staticBaseUrl}${p}`;
  const fileName = p.split(/[\\/]/).pop();
  if (fileName) return `${staticBaseUrl}/media/images/${fileName}`;
  return p;
};

const inferMimeFromName = (name) => {
  const ext = String(name || '').toLowerCase().split('.').pop();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
};

const extractLocalImages = (markdown) => {
  const files = [];
  if (!markdown) return files;
  const added = new Set();
  const addByPath = (path) => {
    if (!path) return;
    const match = path.match(/\/media\/images\/([^?#)\"\s]+)/);
    if (!match) return;
    const name = decodeURIComponent(match[1]);
    if (added.has(name)) return;
    added.add(name);
    files.push({
      name,
      url: convertToHttpUrl(`/media/images/${name}`),
      type: inferMimeFromName(name),
      size: 0,
      selected: true,
    });
  };
  const mdImgRe = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = mdImgRe.exec(markdown)) !== null) {
    addByPath(m[1]);
  }
  const htmlImgRe = /src=\"([^\"]+)\"/g;
  while ((m = htmlImgRe.exec(markdown)) !== null) {
    addByPath(m[1]);
  }
  return files;
};

const makeDigest = (markdown) => {
  const safeHtml = DOMPurify.sanitize(md.render(markdown || ''));
  const text = safeHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 160);
};

const normalizePlatforms = (raw) => {
  let arr = Array.isArray(raw) ? raw : Object.values(raw || {});
  return (arr || []).map((p) => ({
    ...p,
    name: p?.name || p?.platformName || p?.key || p?.id,
  }));
};

const loadPlatformsForPublish = async () => {
  try {
    let list = await getPlatformInfos('ARTICLE');
    let platforms = normalizePlatforms(list);
    if (!platforms.length) {
      const all = await getPlatformInfos();
      platforms = normalizePlatforms(all).filter((p) => (p.type === 'ARTICLE' || !p.type));
    }
    dynamicPlatforms.value = platforms;
  } catch (_) {
    dynamicPlatforms.value = [];
  }
};

const initPublishForm = () => {
  publishTitle.value = title.value || '';
  publishContent.value = content.value || '';
  publishImages.value = extractLocalImages(content.value || '');
  publishSelectAll.value = publishImages.value.length > 0;
};

const togglePublishImage = (idx) => {
  const img = publishImages.value[idx];
  if (img) {
    img.selected = !img.selected;
    publishSelectAll.value = publishImages.value.length > 0 && publishImages.value.every(i => i.selected);
  }
};

const toggleSelectAll = (e) => {
  const checked = e?.target?.checked ?? publishSelectAll.value;
  publishSelectAll.value = checked;
  publishImages.value.forEach(i => { i.selected = checked; });
};

const togglePlatform = (key) => {
  const i = selectedPlatforms.value.indexOf(key);
  if (i > -1) selectedPlatforms.value.splice(i, 1); else selectedPlatforms.value.push(key);
};

const openPublish = async () => {
  publishModalVisible.value = true;
  initPublishForm();
  await loadPlatformsForPublish();
};

const confirmPublish = async () => {
  publishModalVisible.value = false;
  try {
    if (!selectedPlatforms.value.length) { message.warning('请选择至少一个平台'); return; }
    const serviceResp = await checkServiceStatus();
    if (!serviceResp) { message.error('扩展服务未运行，请先启动扩展'); return; }
    const trustResp = await funcGetPermission(5000);
    if (!trustResp || trustResp.status !== 'ok' || !trustResp.trusted) {
      await openOptions();
      message.info('请在扩展设置页授权当前域名后，系统将自动继续');
    }
    const selectedSet = new Set(selectedPlatforms.value);
    const targetPlatforms = (dynamicPlatforms.value || []).filter(p => selectedSet.has(p.name));
    if (!targetPlatforms.length) { message.error('未匹配到选中的平台'); return; }
    const syncPlatforms = targetPlatforms.map(p => ({ name: p.name, platformName: p.platformName, injectUrl: p.injectUrl, faviconUrl: p.faviconUrl, accountKey: p.accountKey, extraConfig: {} }));
    const markdown = publishContent.value || content.value || '';
    const rawHtml = md.render(markdown);
    const html = DOMPurify.sanitize(
      rawHtml.replace(/src=\"(\/media\/[^\"]+)\"/g, (m, p1) => `src=\"${convertToHttpUrl(p1)}\"`)
    );
    const digest = makeDigest(markdown);
    const images = publishImages.value
      .filter(i => i.selected)
      .map(({ name, url, type, size }) => ({ name, url, type, size }));
    const syncData = {
      platforms: syncPlatforms,
      isAutoPublish: isAutoPublish.value,
      data: {
        title: publishTitle.value || title.value || '未命名图文',
        digest,
        cover: null,
        htmlContent: html,
        markdownContent: markdown,
        images,
      }
    };
    await funcPublish({
      ...syncData,
      autoClose: false,
      autoCloseDelaySec: 0,
      syncCloseTabs: false
    });
    message.success(`发布请求已发送到扩展（${syncPlatforms.length}个平台）`);
  } catch (e) {
    console.error('发布失败:', e);
    message.error(e?.message || '发布失败');
  } finally {
    selectedPlatforms.value = [];
    publishImages.value = [];
  }
};
</script>

<style scoped>
.graphic-text-container {
  padding: 20px;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.editor-row {
  height: calc(100vh - 40px);
  position: relative;
}

.editor-column,
.preview-column {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
}

.editor-area {
  padding-right: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.title-input {
  flex: 1;
}

.save-status {
  white-space: nowrap;
}

.unsaved {
  color: #ff4d4f;
}

.saved {
  color: #52c41a;
}

.image-insert {
  margin-bottom: 16px;
  text-align: right;
}

.markdown-editor {
  flex: 1;
  margin-bottom: 16px;
}

.editor-actions {
  text-align: right;
}

/* 优化后的可拖拽分割线样式 */
.resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 12px;
  cursor: col-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.resizer-track {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resizer-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    #e8e8e8 10%, 
    #e8e8e8 90%, 
    transparent 100%);
  border-radius: 1px;
  transition: all 0.2s ease;
}

.resizer-line.resizer-active {
  background: linear-gradient(to bottom, 
    transparent 0%, 
    #1890ff 10%, 
    #1890ff 90%, 
    transparent 100%);
  width: 3px;
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.3);
}

.resizer-handle {
  width: 12px;
  height: 60px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}

.resizer:hover .resizer-handle {
  opacity: 1;
  transform: scale(1.05);
}

.resizer-handle.resizer-handle-active {
  opacity: 1;
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  transform: scale(1.1);
}

.resizer-grip {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 1px;
  width: 6px;
  height: 12px;
}

.resizer-grip span {
  width: 2px;
  height: 2px;
  background-color: #999;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.resizer:hover .resizer-grip span,
.resizer-handle-active .resizer-grip span {
  background-color: #1890ff;
}

.preview-area {
  padding-left: 16px;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.preview-controls {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 5;
}

.show-editor-btn {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.markdown-preview {
  margin-top: 16px;
  padding-top: 40px;
}

.markdown-preview h1 {
  font-size: 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 8px;
}

.markdown-preview h2 {
  font-size: 20px;
  margin: 20px 0 12px 0;
}

.markdown-preview h3 {
  font-size: 16px;
  margin: 16px 0 8px 0;
}

.markdown-preview p {
  margin-bottom: 12px;
  line-height: 1.6;
}

.markdown-preview ul, .markdown-preview ol {
  margin-bottom: 12px;
  padding-left: 20px;
}

.markdown-preview li {
  margin-bottom: 4px;
}

.markdown-preview blockquote {
  border-left: 4px solid #e8e8e8;
  padding-left: 16px;
  margin: 16px 0;
  color: #666;
}

.markdown-preview code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-preview pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-preview img {
  max-width: 100%;
  height: auto;
  margin: 12px 0;
  border-radius: 6px;
}

.markdown-preview table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.markdown-preview th, .markdown-preview td {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: left;
}

.markdown-preview th {
  background-color: #f5f5f5;
  font-weight: bold;
}
</style>

<style>
/* 全局样式，用于拖拽时的光标 */
body.resizing {
  cursor: col-resize !important;
  user-select: none !important;
}

body.resizing * {
  cursor: col-resize !important;
}
</style>

<style scoped>
.publish-platforms { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; margin-top: 12px; }
.publish-platforms .platform { display:flex; align-items:center; gap:10px; padding:12px 8px; border:1px solid #e5e7eb; border-radius:8px; cursor:pointer; background:#fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all .2s; }
.publish-platforms .platform:hover { border-color:#1890ff; box-shadow: 0 2px 8px rgba(24,144,255,.15); }
.publish-platforms .platform.active { border-color:#1890ff; background:#f0f7ff; }
.publish-platforms .platform img { width:20px; height:20px; border-radius:4px; object-fit: contain; }
.publish-platforms .platform span { flex:1; font-size:12px; color:#333; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
.publish-actions { margin-top: 16px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.publish-images-grid.compact { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
.publish-images-grid.compact .img-card { position: relative; border: 1px solid #f0f0f0; border-radius: 6px; padding: 6px; cursor: pointer; }
.publish-images-grid.compact .img-card.selected { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.15); }
.publish-images-grid.compact .img-card img { width: 100%; height: 70px; object-fit: cover; border-radius: 4px; }
.publish-images-grid.compact .img-card .img-name { margin-top: 4px; font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.publish-images-grid.compact .img-card .img-check { position: absolute; top: 6px; right: 6px; }
</style>
