<template>
  <div class="graphic-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="图文标题">
          <a-input v-model:value="searchForm.title" placeholder="输入标题查询" allow-clear />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="全部状态" style="width: 120px" allow-clear>
            <a-select-option value="published">已发布</a-select-option>
            <a-select-option value="draft">未发布</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button @click="resetSearch" style="margin-left: 8px">
            <template #icon><redo-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 操作按钮 -->
    <div class="action-area">
      <a-button type="primary" @click="showAddModal">
        <template #icon><plus-outlined /></template>
        新增图文
      </a-button>
      <a-button @click="showImportModal" style="margin-left: 12px">
        <template #icon><import-outlined /></template>
        导入Markdown
      </a-button>
    </div>

    <!-- 卡片展示区域 -->
    <div class="card-container">
      <a-empty v-if="dataList.length === 0" description="暂无数据" />
      <a-row v-else :gutter="[16, 16]">
        <a-col 
          v-for="item in currentPageData" 
          :key="item.id" 
          :xs="24" 
          :sm="12" 
          :md="8" 
          :lg="6"
        >
          <!-- 卡片展示区域 -->
          <a-card hoverable class="graphic-card">
            <template #cover>
              <router-link :to="`/texts/detail/${item.id}`">
                <a-image
                  :src="item.cover || defaultCover"
                  :preview="false"
                  height="160px"
                  :fallback="defaultCover"
                />
              </router-link>
            </template>
            <a-card-meta :title="item.title">
              <template #description>
                <div class="meta-info">
                  <span class="create-time">
                    {{ formatTime(item.createTime) }}
                  </span>
                </div>
              </template>
            </a-card-meta>
            <template #actions>
              <a-tooltip title="发布" v-if="item.status !== 'published'">
                <a-button type="text" size="small" @click="publishItem(item)">
                  <send-outlined />
                </a-button>
              </a-tooltip>
              <a-tooltip title="编辑">
                <a-button type="text" size="small" @click="editItem(item)">
                  <edit-outlined />
                </a-button>
              </a-tooltip>
              <a-tooltip title="删除">
                <a-button type="text" size="small" danger @click="deleteItem(item)">
                  <delete-outlined />
                </a-button>
              </a-tooltip>
            </template>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.total > 0">
      <a-pagination
        v-model:current="pagination.current"
        v-model:pageSize="pagination.pageSize"
        :total="pagination.total"
        show-size-changer
        show-quick-jumper
        :show-total="total => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      width="80%"
      :confirm-loading="confirmLoading"
      @ok="handleSubmit"
      @cancel="closeModal"
    >
      <a-form :model="formState" layout="vertical">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="图文标题" name="title" required>
              <a-input v-model:value="formState.title" />
            </a-form-item>
            <a-form-item label="封面图片">
              <a-upload
                v-model:file-list="fileList"
                list-type="picture-card"
                :max-count="1"
                :before-upload="beforeUpload"
                @change="handleCoverChange"
              >
                <div v-if="!formState.cover">
                  <plus-outlined />
                  <div style="margin-top: 8px">上传封面</div>
                </div>
                <img
                  v-else
                  :src="formState.cover"
                  alt="封面"
                  style="width: 100%; height: 100%; object-fit: cover"
                />
              </a-upload>
            </a-form-item>
            <a-form-item label="Markdown内容" name="content" required>
              <a-textarea
                v-model:value="formState.content"
                :rows="15"
                placeholder="输入Markdown格式内容"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="预览">
              <div class="markdown-preview" v-html="compiledMarkdown"></div>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 导入Markdown模态框 -->
    <a-modal
      v-model:visible="importModalVisible"
      title="导入Markdown文件"
      @ok="handleImport"
      @cancel="closeImportModal"
    >
      <a-upload-dragger
        v-model:file-list="importFileList"
        name="file"
        :max-count="1"
        :before-upload="beforeImportUpload"
        accept=".md,.markdown"
      >
        <p class="ant-upload-drag-icon">
          <inbox-outlined />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p class="ant-upload-hint">仅支持Markdown文件(.md/.markdown)</p>
      </a-upload-dragger>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { 
  SearchOutlined, RedoOutlined, PlusOutlined, 
  ImportOutlined, EditOutlined, DeleteOutlined,
  SendOutlined, InboxOutlined 
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 默认封面图
const defaultCover = 'https://via.placeholder.com/300x200?text=封面图片';

// 搜索表单
const searchForm = reactive({
  title: '',
  status: ''
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0
});

// 模拟数据
const dataList = ref([
  {
    id: 1,
    title: '示例图文1',
    cover: 'https://picsum.photos/300/200?random=1',
    content: '# 标题1\n\n这是第一个示例图文内容\n\n- 列表项1\n- 列表项2',
    status: 'published',
    createTime: '2023-06-15T10:30:00'
  },
  // 更多模拟数据...
]);

// 当前页数据
const currentPageData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredData.value.slice(start, end);
});

// 过滤后的数据
const filteredData = computed(() => {
  let result = [...dataList.value];
  
  if (searchForm.title) {
    result = result.filter(item => 
      item.title.includes(searchForm.title)
    );
  }
  
  if (searchForm.status) {
    result = result.filter(item => 
      item.status === searchForm.status
    );
  }
  
  pagination.total = result.length;
  return result;
});

// 格式化时间
const formatTime = time => dayjs(time).format('YYYY-MM-DD HH:mm');

// 获取预览文本
const getPreviewText = content => {
  if (!content) return '';
  const plainText = content.replace(/#+\s*/g, '').replace(/\*/g, '');
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
};

// 搜索处理
const handleSearch = () => {
  pagination.current = 1;
};

// 重置搜索
const resetSearch = () => {
  searchForm.title = '';
  searchForm.status = '';
  handleSearch();
};

// 分页变化
const handlePageChange = (page, pageSize) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
};

// 发布图文
const publishItem = item => {
  Modal.confirm({
    title: '确认发布',
    content: `确定要发布图文 "${item.title}" 吗?`,
    onOk: () => {
      item.status = 'published';
      message.success('发布成功');
    }
  });
};

// 编辑图文
const editItem = item => {
  formState.value = { ...item };
  modalTitle.value = '编辑图文';
  modalVisible.value = true;
};

// 删除图文
const deleteItem = item => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除图文 "${item.title}" 吗?`,
    okText: '删除',
    okType: 'danger',
    onOk: () => {
      dataList.value = dataList.value.filter(i => i.id !== item.id);
      message.success('删除成功');
    }
  });
};

// 新增/编辑模态框相关
const modalVisible = ref(false);
const modalTitle = ref('新增图文');
const confirmLoading = ref(false);
const formState = ref({
  id: null,
  title: '',
  cover: '',
  content: '',
  status: 'draft'
});
const fileList = ref([]);

const showAddModal = () => {
  formState.value = {
    id: null,
    title: '',
    cover: '',
    content: '',
    status: 'draft'
  };
  modalTitle.value = '新增图文';
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
};

const handleSubmit = () => {
  confirmLoading.value = true;
  try {
    if (formState.value.id) {
      // 更新逻辑
      const index = dataList.value.findIndex(item => item.id === formState.value.id);
      dataList.value[index] = { ...formState.value };
      message.success('更新成功');
    } else {
      // 新增逻辑
      const newItem = {
        ...formState.value,
        id: Date.now(),
        createTime: new Date().toISOString()
      };
      dataList.value.unshift(newItem);
      message.success('新增成功');
    }
    modalVisible.value = false;
  } finally {
    confirmLoading.value = false;
  }
};

// 封面图片上传
const beforeUpload = file => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件!');
  }
  return isImage;
};

const handleCoverChange = info => {
  if (info.file.status === 'done') {
    formState.value.cover = URL.createObjectURL(info.file.originFileObj);
  }
};

// Markdown预览
const compiledMarkdown = computed(() => {
  if (!formState.value.content) return '';
  return DOMPurify.sanitize(marked(formState.value.content));
});

// 导入Markdown相关
const importModalVisible = ref(false);
const importFileList = ref([]);

const showImportModal = () => {
  importModalVisible.value = true;
};

const closeImportModal = () => {
  importModalVisible.value = false;
  importFileList.value = [];
};

const beforeImportUpload = file => {
  const isMarkdown = file.type === 'text/markdown' || 
                    file.name.endsWith('.md') || 
                    file.name.endsWith('.markdown');
  if (!isMarkdown) {
    message.error('只能上传Markdown文件!');
  }
  return isMarkdown;
};

const handleImport = () => {
  if (importFileList.value.length === 0) {
    message.warning('请先选择文件');
    return;
  }
  
  const file = importFileList.value[0];
  const reader = new FileReader();
  
  reader.onload = e => {
    const content = e.target.result;
    formState.value.content = content;
    
    // 尝试从内容中提取标题
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      formState.value.title = titleMatch[1];
    }
    
    importModalVisible.value = false;
    modalTitle.value = '导入图文';
    modalVisible.value = true;
  };
  
  reader.readAsText(file.originFileObj);
};
</script>

<style scoped>
.graphic-container {
  padding: 16px;
  background: #fff;
}

.search-area {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.action-area {
  margin-bottom: 16px;
}

.card-container {
  min-height: 400px;
}

.graphic-card {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.graphic-card :deep(.ant-card-body) {
  padding: 16px;
}

.graphic-card :deep(.ant-card-meta-title) {
  margin-bottom: 8px;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.create-time {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}

.content-preview {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination {
  margin-top: 24px;
  text-align: center;
}

.markdown-preview {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  height: 100%;
  overflow-y: auto;
}
</style>