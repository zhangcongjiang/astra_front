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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt();
const title = ref('');
const content = ref('');
const route = useRoute();

// 获取图文详情
const fetchGraphicText = async (id) => {
  try {
    // 这里替换为实际API调用
    const mockData = {
      title: `图文标题 ${id}`,
      content: `这是第 ${id} 个图文的内容示例\n\n## 二级标题\n\n- 列表项1\n- 列表项2\n\n![示例图片](https://picsum.photos/800/400?random=${id})`
    };
    title.value = mockData.title;
    content.value = mockData.content;
  } catch (error) {
    message.error('获取图文详情失败');
  }
};

// 初始化时检查是否有ID参数
onMounted(() => {
  if (route.params.id) {
    fetchGraphicText(route.params.id);
  } else {
    // 清空表单
    title.value = '';
    content.value = '';
  }
});

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