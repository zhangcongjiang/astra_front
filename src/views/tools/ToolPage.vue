<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>{{ categoryName }}工具</h2>
      <a-button type="primary" @click="showAddModal">
        <template #icon><plus-outlined /></template>
        添加工具
      </a-button>
    </div>

    <a-input-search
      v-model:value="searchText"
      placeholder="搜索工具..."
      style="width: 300px; margin-bottom: 20px"
      @search="handleSearch"
    />

    <a-list
      :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
      :data-source="filteredTools"
      :loading="loading"
    >
      <template #renderItem="{ item }">
        <a-list-item>
          <a-card hoverable>
            <template #cover>
              <img 
                v-if="item.logo" 
                :src="item.logo.startsWith('blob:') ? item.logo : `/uploads/${item.logo}`" 
                class="tool-logo" 
              />
              <div v-else class="default-logo">
                <picture-outlined style="font-size: 48px; color: #ccc" />
              </div>
            </template>
            <a-card-meta :title="item.name">
              <template #description>
                <a :href="item.url" target="_blank">{{ item.url }}</a>
              </template>
            </a-card-meta>
            <template #actions>
              <a-button type="link" @click="editTool(item)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这个工具吗？"
                @confirm="deleteTool(item)"
              >
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </a-card>
        </a-list-item>
      </template>
    </a-list>

    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      :confirm-loading="submitting"
    >
      <a-form :model="toolForm" :label-col="{ span: 4 }">
        <a-form-item label="工具名称" required>
          <a-input v-model:value="toolForm.name" />
        </a-form-item>
        <a-form-item label="Logo">
          <a-upload
            v-model:file-list="fileList"
            list-type="picture-card"
            :max-count="1"
            :before-upload="beforeUpload"
            @change="handleUploadChange"
          >
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
import { ref, computed, onMounted } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { PictureOutlined } from '@ant-design/icons-vue'; // Use PictureOutlined instead of ImageOutlined
import defaultLogo from '@/assets/default-tool-logo.png';
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
    // 模拟数据 - 根据当前category过滤
    const allTools = [
      // 文本工具
      {
        id: 1,
        name: 'JSON格式化工具',
        logo: '',
        url: 'https://jsonformatter.org',
        description: '在线JSON格式化验证工具',
        category: 'text'
      },
      // 图像工具
      {
        id: 2,
        name: 'TinyPNG压缩',
        logo: '',
        url: 'https://tinypng.com',
        description: '智能PNG和JPEG图片压缩',
        category: 'image'
      },
      // 音频工具
      {
        id: 3,
        name: '在线音频剪辑',
        logo: '',
        url: 'https://mp3cut.net',
        description: '免费在线音频剪辑工具',
        category: 'audio'
      },
      // 视频工具
      {
        id: 4,
        name: 'Clipchamp编辑器',
        logo: '',
        url: 'https://clipchamp.com',
        description: '在线视频编辑制作工具',
        category: 'video'
      }
    ];
    
    tools.value = allTools.filter(tool => tool.category === props.category);
  } catch (error) {
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
  loadTools();
});
</script>

<style scoped>
.tool-page {
  padding: 20px;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.default-logo {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.tool-logo {
  height: 160px;
  width: 100%;
  object-fit: contain;
  background: #f5f5f5;
}
</style>