<template>
  <div class="graphic-text-container">
    <a-row>
      <!-- 编辑区域 -->
      <a-col :span="12">
        <div class="editor-area">
          <a-input
            v-model:value="title"
            placeholder="请输入标题"
            class="title-input"
          />
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
            <a-button type="primary" @click="saveDraft">保存</a-button>
          </div>
        </div>
      </a-col>

      <!-- 预览区域 -->
      <a-col :span="12">
        <div class="preview-area">
          <h1 v-if="title">{{ title }}</h1>
          <div v-html="compiledMarkdown" class="markdown-preview"></div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt();
const title = ref('');
const content = ref('');

// 实时渲染Markdown
const compiledMarkdown = computed(() => {
  return DOMPurify.sanitize(md.render(content.value));
});

// 保存草稿
const saveDraft = () => {
  message.success('草稿保存成功');
};


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

.title-input {
  margin-bottom: 16px;
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

.markdown-preview {
  margin-top: 16px;
}
</style>