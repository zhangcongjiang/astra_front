<template>
  <div class="graphic-detail-container">
    <a-page-header
      title="图文详情"
      @back="() => $router.go(-1)"
    />
    
    <div class="toolbar">
      <a-button type="primary" @click="exportToWord">
        <template #icon><download-outlined /></template>
        导出Word
      </a-button>
    </div>
    
    <div class="detail-content" ref="docxContent">
      <h1 class="title">{{ detailData.title }}</h1>
      
      <div class="meta">
        <span class="create-time">
          {{ formatTime(detailData.createTime) }}
        </span>
        <a-tag :color="detailData.status === 'published' ? 'green' : 'orange'">
          {{ detailData.status === 'published' ? '已发布' : '未发布' }}
        </a-tag>
      </div>
      
      <div class="cover-image" v-if="detailData.cover">
        <a-image
          :src="detailData.cover"
          :preview="{ src: detailData.cover }"
        />
      </div>
      
      <div class="markdown-content" v-html="compiledMarkdown"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons-vue';
import { Document, Paragraph, TextRun, HeadingLevel, ImageRun, Packer } from 'docx';
import htmlDocx from 'html-docx-js';

const route = useRoute();
const docxContent = ref(null);
const detailData = ref({
  id: null,
  title: '',
  cover: '',
  content: '',
  status: '',
  createTime: ''
});

// 导出为Word文档
const exportToWord = async () => {
  try {
    // 方法1：使用docx.js生成标准Word文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: detailData.value.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `创建时间: ${formatTime(detailData.value.createTime)}`,
                size: 22
              })
            ]
          }),
          new Paragraph({
            text: detailData.value.content,
            spacing: { before: 200, after: 200 }
          })
        ]
      }]
    });

    // 方法2：使用html-docx-js从HTML生成Word
    // const htmlContent = docxContent.value.innerHTML;
    // const doc = htmlDocx.asBlob(htmlContent);
    
    Packer.toBlob(doc).then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${detailData.value.title}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
    
    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error(error);
  }
};

// 获取图文详情
const fetchDetail = async (id) => {
  try {
    // 这里替换为实际API调用
    // const res = await api.getTextDetail(id);
    // detailData.value = res;
    
    // 模拟数据
    detailData.value = {
      id: 1,
      title: '示例图文详情',
      cover: 'https://picsum.photos/800/400?random=1',
      content: '# 标题1\n\n这是图文详情内容\n\n![图片](https://picsum.photos/400/200?random=2)\n\n- 列表项1\n- 列表项2\n\n## 二级标题\n\n更多内容...',
      status: 'published',
      createTime: '2023-06-15T10:30:00'
    };
  } catch (error) {
    message.error('获取详情失败');
  }
};

// 格式化时间
const formatTime = time => dayjs(time).format('YYYY-MM-DD HH:mm');

// Markdown渲染
const compiledMarkdown = computed(() => {
  if (!detailData.value.content) return '';
  return DOMPurify.sanitize(marked(detailData.value.content));
});

onMounted(() => {
  fetchDetail(route.params.id);
});
</script>

<style scoped>
.graphic-detail-container {
  padding: 16px;
  background: #fff;
}

.toolbar {
  margin-bottom: 16px;
  padding: 0 24px;
}

/* 添加Word文档样式 */
.detail-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.5;
}

.title {
  font-size: 16pt;
  font-weight: bold;
  text-align: center;
  margin-bottom: 12pt;
}

.meta {
  text-align: center;
  margin-bottom: 12pt;
  font-size: 10pt;
  color: #666;
}

.cover-image {
  text-align: center;
  margin: 12pt 0;
}

.markdown-content {
  line-height: 1.5;
}

.markdown-content :deep(p) {
  margin: 0 0 12pt 0;
  text-indent: 24pt;
}

.markdown-content :deep(h1) {
  font-size: 16pt;
  font-weight: bold;
  margin: 24pt 0 12pt 0;
}

.markdown-content :deep(h2) {
  font-size: 14pt;
  font-weight: bold;
  margin: 18pt 0 10pt 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-left: 24pt;
  margin-bottom: 12pt;
}

.markdown-content :deep(li) {
  margin-bottom: 6pt;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 6pt 0;
}
</style>