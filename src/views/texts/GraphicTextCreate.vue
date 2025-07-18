<template>
  <div class="graphic-text-container">
    <a-row>
      <!-- 编辑区域 -->
      <a-col :span="12">
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

      <!-- 预览区域 -->
      <a-col :span="12">
        <div class="preview-area">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
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
    
    console.log('获取到的图文详情:', textData);
    
    title.value = textData.title || '';
    content.value = textData.content || '';
    
    // 保存原始数据用于变更检测
    originalTitle.value = title.value;
    originalContent.value = content.value;
    hasUnsavedChanges.value = false;
    
  } catch (error) {
    console.error('获取图文详情失败:', error);
    message.error('获取图文详情失败');
  } finally {
    loading.value = false;
  }
};

// 初始化时检查是否有ID参数
onMounted(() => {
  if (route.params.id) {
    fetchGraphicText(route.params.id);
  } else {
    // 清空表单（新建模式）
    title.value = '';
    content.value = '';
    originalTitle.value = '';
    originalContent.value = '';
    hasUnsavedChanges.value = false;
  }
});

// 监听内容变化
watch([title, content], () => {
  if (route.params.id) {
    hasUnsavedChanges.value = 
      title.value !== originalTitle.value || 
      content.value !== originalContent.value;
  }
});

// 实时渲染Markdown
const compiledMarkdown = computed(() => {
  return DOMPurify.sanitize(md.render(content.value));
});

// 保存草稿
const saveDraft = async () => {
  if (saving.value) return;
  
  saving.value = true;
  
  try {
    // 验证标题
    if (!title.value.trim()) {
      message.error('请输入标题');
      return;
    }
    
    // 验证内容
    if (!content.value.trim()) {
      message.error('请输入内容');
      return;
    }
    
    // 调用统一的保存接口
    const response = await saveText(
      route.params.id || '', // 创建时传空字符串，编辑时传实际ID
      title.value.trim(),
      content.value.trim()
    );
    
    // 处理响应
    let responseData;
    if (response.data) {
      responseData = response.data;
    } else {
      responseData = response;
    }
    
    if (route.params.id) {
      // 编辑模式
      message.success('更新成功');
    } else {
      // 创建模式
      message.success('创建成功');
    }
    
    // 保存成功后跳转到图文列表页面
    router.push({ name: 'texts' });
    
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败: ' + (error.message || '未知错误'));
  } finally {
    saving.value = false;
  }
};

// 插入图片
const beforeUpload = (file) => {
  return new Promise((resolve) => {
    const fullPath = URL.createObjectURL(file);
    const markdownImg = `\n![${file.name}](${fullPath})\n`;
    const cursorPos = content.value.length;
    content.value = 
      content.value.slice(0, cursorPos) +
      markdownImg +
      content.value.slice(cursorPos);
    resolve(false); // 阻止自动上传
  });
};
</script>

<style scoped>
.graphic-text-container {
  padding: 24px;
}

.editor-area {
  padding: 0 16px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.title-input {
  flex: 1;
}

.save-status {
  font-size: 12px;
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

.preview-area {
  padding-left: 16px;
  border-left: 1px solid #f0f0f0;
  height: calc(100vh - 120px);
  overflow-y: auto;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.markdown-preview {
  margin-top: 16px;
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