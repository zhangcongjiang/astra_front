<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>{{ categoryName }}工具</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><plus-outlined /></template>
        添加工具
      </a-button>
    </div>

    <div class="tool-grid">
      <div v-for="item in filteredTools" :key="item.id" class="tool-item" :title="item.description">
        <div class="tool-content">
          <div class="tool-logo-wrapper">
            <img v-if="item.logo" :src="item.logo" class="tool-logo" />
            <div v-else class="default-logo">
              <picture-outlined style="font-size: 18px; color: #ccc" />
            </div>
          </div>
          <div class="tool-name">{{ item.name }}</div>
        </div>
      </div>
    </div>

    <a-modal v-model:visible="modalVisible" :title="modalTitle" @ok="handleSubmit" :confirm-loading="submitting">
      <a-form :model="toolForm" :label-col="{ span: 4 }">
        <a-form-item label="工具名称" required>
          <a-input v-model:value="toolForm.name" />
        </a-form-item>
        <a-form-item label="Logo">
          <a-upload v-model:file-list="fileList" list-type="picture-card" :max-count="1" :before-upload="beforeUpload"
            @change="handleUploadChange">
            <div v-if="!toolForm.logo">
              <plus-outlined />
              <div style="margin-top: 8px">上传Logo</div>
            </div>
          </a-upload>
        </a-form-item>
        <a-form-item label="网站URL" required>
          <a-input v-model:value="toolForm.url" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="toolForm.description" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'; // Add watch to the imports
import { PlusOutlined } from '@ant-design/icons-vue';
import { PictureOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const props = defineProps({
  category: {
    type: String,
    required: true,
    default: 'text',  // 添加默认值
    validator: value => ['text', 'image', 'audio', 'video'].includes(value)
  }
});

const categoryName = computed(() => {
  const names = {
    text: '文本',
    image: '图像',
    audio: '音频',
    video: '视频'
  };
  return names[props.category] || '';
});

const tools = ref([]);
const loading = ref(false);
const searchText = ref('');
const modalVisible = ref(false);
const submitting = ref(false);
const modalTitle = ref('添加工具');
const toolForm = ref({
  id: null,
  name: '',
  logo: '',
  url: '',
  description: '',
  category: props.category
});

const filteredTools = computed(() => {
  return tools.value.filter(tool =>
    tool.category === props.category &&
    (!searchText.value ||
      tool.name.includes(searchText.value) ||
      tool.description.includes(searchText.value))
  );
});

const loadTools = async () => {
  try {
    loading.value = true;
    
    // 使用import语法加载图片
    const logoPath = new URL('@/assets/logo/logo.png', import.meta.url).href;

    // 模拟从数据库获取数据
    const mockTools = [
      // 文本工具 (10条)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `文本工具 ${i + 1}`,
        logo: logoPath,
        url: `https://text-tool-${i + 1}.com`,
        description: `这是一个强大的文本处理工具 ${i + 1}`,
        category: 'text'
      })),
      // 图像工具 (10条)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        name: `图像工具 ${i + 1}`,
        logo: logoPath,
        url: `https://image-tool-${i + 1}.com`,
        description: `这是一个专业的图像处理工具 ${i + 1}`,
        category: 'image'
      })),
      // 音频工具 (10条)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 21,
        name: `音频工具 ${i + 1}`,
        logo: logoPath,
        url: `https://audio-tool-${i + 1}.com`,
        description: `这是一个高效的音频处理工具 ${i + 1}`,
        category: 'audio'
      })),
      // 视频工具 (10条)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 31,
        name: `视频工具 ${i + 1}`,
        logo: logoPath,
        url: `https://video-tool-${i + 1}.com`,
        description: `这是一个全面的视频处理工具 ${i + 1}`,
        category: 'video'
      }))
    ];

    // 根据当前category过滤工具
    tools.value = mockTools.filter(tool => tool.category === props.category);
  } catch (error) {
    console.error('加载工具失败:', error);
    message.error('加载工具失败');
  } finally {
    loading.value = false;
  }
};

const showAddModal = () => {
  toolForm.value = {
    id: null,
    name: '',
    logo: '',
    url: '',
    description: '',
    category: props.category
  };
  modalTitle.value = '添加工具';
  modalVisible.value = true;
};

const editTool = (tool) => {
  toolForm.value = { ...tool };
  modalTitle.value = '编辑工具';
  modalVisible.value = true;
};

const handleSubmit = async () => {
  try {
    submitting.value = true;
    // 这里替换为实际API调用
    // if (toolForm.value.id) {
    //   await api.updateTool(toolForm.value);
    // } else {
    //   await api.addTool(toolForm.value);
    // }
    message.success('操作成功');
    modalVisible.value = false;
    loadTools();
  } catch (error) {
    message.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const deleteTool = async (tool) => {
  try {
    // 这里替换为实际API调用
    // await api.deleteTool(tool.id);
    message.success('删除成功');
    loadTools();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSearch = () => {
  // 搜索逻辑已在filteredTools计算属性中实现
};

onMounted(() => {
  console.log('当前工具类别:', props.category);
  loadTools();
});

// 添加watch监听category变化
watch(() => props.category, (newCategory) => {
  console.log('工具类别变化:', newCategory);
  loadTools();
});
</script>

<style scoped>
.tool-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 8px;
}

.tool-item {
  height: 60px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px;
  transition: all 0.2s;
}

.tool-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.tool-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.tool-logo-wrapper {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.tool-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.default-logo {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
}

.tool-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .tool-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>