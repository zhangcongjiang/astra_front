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
              <a-button 
                v-if="editorSpan === 0"
                @click="showEditor"
                type="text"
                title="显示编辑器"
              >
                <EditOutlined />
              </a-button>
              <a-button 
                v-if="previewSpan < 24"
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

    <!-- 编辑器隐藏时的快捷显示按钮 -->
    <div v-if="editorSpan === 0" class="show-editor-btn">
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
const editorSpan = ref(12);
const previewSpan = ref(12);
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
  editorSpan.value = 12;
  previewSpan.value = 12;
};

const hideEditor = () => {
  editorSpan.value = 0;
  previewSpan.value = 24;
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