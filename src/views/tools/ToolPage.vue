<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>{{ categoryName }}工具</h2>
      <div class="header-actions">
        <a-button 
          v-if="category === 'image'" 
          type="default" 
          @click="goToImageSearch"
          style="margin-right: 8px;"
        >
          <template #icon><search-outlined /></template>
          图片搜索
        </a-button>
        <a-button type="primary" @click="showAddModal">
          <template #icon><plus-outlined /></template>
          添加工具
        </a-button>
      </div>
    </div>

    <div class="tool-grid">
      <div 
        v-for="item in filteredTools" 
        :key="item.id" 
        class="tool-item" 
        :title="item.description"
        @click="openTool(item)"
      >
        <div class="tool-content">
          <div class="tool-logo-wrapper">
            <img v-if="item.logo_path" :src="item.logo_path" class="tool-logo" />
            <div v-else class="default-logo">
              <picture-outlined style="font-size: 18px; color: #ccc" />
            </div>
          </div>
          <div class="tool-name">{{ item.name }}</div>
        </div>
      </div>
    </div>

    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" :confirm-loading="submitting">
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { PictureOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
// 导入API
import { uploadTool, getTools } from '@/api/modules/toolsApi';

const router = useRouter();

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
    video: '视频',
    other: '其他'
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
    
    // 调用真实API获取工具列表
    const response = await getTools({ category: props.category });
    tools.value = response.data || [];
  } catch (error) {
    console.error('加载工具失败:', error);
    message.error('加载工具失败');
    // 如果API调用失败，可以保留模拟数据作为fallback
    tools.value = [];
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
  fileList.value = []; // 重置文件列表
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
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('name', toolForm.value.name);
    formData.append('url', toolForm.value.url);
    formData.append('description', toolForm.value.description);
    formData.append('category', toolForm.value.category);
    
    // 如果有logo文件，添加到FormData
    if (fileList.value.length > 0 && fileList.value[0].originFileObj) {
      formData.append('logo', fileList.value[0].originFileObj);
    }
    
    // 调用上传API
    await uploadTool(formData);
    
    message.success('添加工具成功');
    modalVisible.value = false;
    
    // 重置表单
    toolForm.value = {
      id: null,
      name: '',
      logo: '',
      url: '',
      description: '',
      category: props.category
    };
    fileList.value = [];
    
    // 重新加载工具列表
    loadTools();
  } catch (error) {
    console.error('添加工具失败:', error);
    message.error('添加工具失败');
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
// 在现有的ref变量后添加
const fileList = ref([]);
const uploadLoading = ref(false);

// 文件上传前的处理
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件!');
    return false;
  }
  const isLt20M = file.size / 1024 / 1024 < 20;
  if (!isLt20M) {
    message.error('图片大小不能超过 20MB!');
    return false;
  }
  return false; // 阻止自动上传
};

// 文件上传变化处理
const handleUploadChange = (info) => {
  fileList.value = info.fileList.slice(-1); // 只保留最后一个文件
  
  if (info.fileList.length > 0) {
    const file = info.fileList[0];
    if (file.status === 'done' || file.originFileObj) {
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        toolForm.value.logo = e.target.result;
      };
      reader.readAsDataURL(file.originFileObj || file);
    }
  } else {
    toolForm.value.logo = '';
  }
};

// 添加点击工具的处理函数
const openTool = (tool) => {
  if (tool.url) {
    window.open(tool.url, '_blank');
  } else {
    message.warning('该工具暂未配置链接');
  }
};
// 跳转到图片搜索页面
const goToImageSearch = () => {
  router.push('/image-search');
};
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* 从200px增加到280px */
  gap: 20px; /* 从16px增加到20px */
  padding: 8px;
}

.tool-item {
  height: 100px; /* 从60px增加到100px */
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px; /* 从8px增加到16px */
  transition: all 0.2s;
  cursor: pointer;
}

.tool-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 增强阴影效果 */
  transform: translateY(-2px);
}

.tool-content {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 16px; /* 从12px增加到16px */
}

.tool-logo-wrapper {
  width: 40%;
  height: 68px; /* 从44px增加到68px */
  flex-shrink: 0;
}

.tool-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px; /* 从4px增加到6px */
}

.default-logo {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 6px; /* 从4px增加到6px */
}

.tool-name {
  font-size: 16px; /* 从14px增加到16px */
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  width: 60%;
}

/* 响应式布局调整 */
@media (max-width: 768px) {
  .tool-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); /* 移动端也适当增加 */
  }
  
  .tool-item {
    height: 80px; /* 移动端稍小一些 */
    padding: 12px;
  }
  
  .tool-logo-wrapper {
    height: 56px;
  }
  
  .tool-name {
    font-size: 15px;
  }
}
</style>