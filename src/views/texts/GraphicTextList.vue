<template>
  <div class="graphic-text-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="图文标题">
          <a-input v-model:value="searchForm.title" placeholder="输入图文标题" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 操作按钮 -->
    <div class="action-area">
      <a-button type="primary" @click="showAddModal">
        <plus-outlined /> 新增图文
      </a-button>
      <a-button @click="showImportModal" style="margin-left: 10px">
        <import-outlined /> 导入Markdown
      </a-button>
    </div>

    <!-- 图文列表表格 -->
    <div class="table-container">
      <a-table 
        :columns="columns" 
        :dataSource="currentPageData" 
        :pagination="false"
        rowKey="id"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cover'">
            <a-image
              :width="80"
              :src="record.cover"
              :preview="{
                src: record.cover,
              }"
            />
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" @click="publishItem(record)">发布</a-button>
            <a-button type="link" @click="editItem(record)">编辑</a-button>
            <a-button type="link" danger @click="deleteItem(record.id)">删除</a-button>
          </template>
        </template>
      </a-table>

      <!-- 分页控制 -->
      <div class="pagination">
        <a-pagination
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="pagination.total"
          show-size-changer
          @change="handlePaginationChange"
        />
      </div>
    </div>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      @cancel="closeModal"
      width="90%"
      :bodyStyle="{ height: '70vh', overflow: 'auto' }"
    >
      <a-form :model="formState" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="图文标题" required>
              <a-input v-model:value="formState.title" />
            </a-form-item>
            <a-form-item label="封面图片">
              <a-upload
                v-model:file-list="coverFileList"
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
            <a-form-item label="Markdown内容" required>
              <a-textarea
                v-model:value="formState.markdown"
                :rows="10"
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
      title="导入Markdown"
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
          <inbox-outlined></inbox-outlined>
        </p>
        <p class="ant-upload-text">点击或拖拽Markdown文件到此处</p>
        <p class="ant-upload-hint">支持单个.md或.markdown文件</p>
      </a-upload-dragger>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { PlusOutlined, ImportOutlined, InboxOutlined } from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';
import { marked } from 'marked';  // Changed from default import to named import
import DOMPurify from 'dompurify';

// 搜索表单
const searchForm = reactive({
  title: '',
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 表格列配置
const columns = [
  {
    title: '序号',
    dataIndex: 'index',
    width: '80px',
    align: 'center',
    customRender: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
  },
  {
    title: '封面',
    dataIndex: 'cover',
    key: 'cover',
    width: '100px',
  },
  {
    title: '图文标题',
    dataIndex: 'title',
    key: 'title',
    width: '200px',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '180px',
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '100px',
    customRender: ({ text }) => text === 'published' ? '已发布' : '未发布',
  },
  {
    title: '操作',
    key: 'action',
    width: '200px',
    align: 'center',
  },
];

// 模拟数据
const mockData = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `图文标题 ${i + 1}`,
  cover: `https://picsum.photos/200/150?random=${i}`,
  markdown: `# 图文标题 ${i + 1}\n\n这是第 ${i + 1} 个图文内容，使用Markdown格式编写。\n\n## 二级标题\n\n- 列表项1\n- 列表项2\n\n**加粗文本** *斜体文本*`,
  createTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format(),
  status: Math.random() > 0.5 ? 'published' : 'draft',
}));

// 当前页数据
const currentPageData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredData.value.slice(start, end);
});

// 过滤后的数据
const filteredData = computed(() => {
  let result = [...mockData];
  
  if (searchForm.title) {
    result = result.filter(item => 
      item.title.toLowerCase().includes(searchForm.title.toLowerCase())
    );
  }
  
  pagination.total = result.length;
  return result;
});

// 搜索
const handleSearch = () => {
  pagination.current = 1;
};

// 重置搜索
const resetSearch = () => {
  searchForm.title = '';
  handleSearch();
};

// 分页变化处理
const handlePaginationChange = (page, pageSize) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
};

// 新增/编辑相关
const modalVisible = ref(false);
const modalTitle = ref('新增图文');
const formState = reactive({
  id: null,
  title: '',
  cover: '',
  markdown: '',
  status: 'draft',
});
const coverFileList = ref([]);

// 封面图片上传处理
const beforeUpload = file => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件!');
  }
  return isImage;
};

const handleCoverChange = info => {
  if (info.file.status === 'done') {
    // 这里应该是上传API调用成功后设置封面URL
    formState.cover = URL.createObjectURL(info.file.originFileObj);
  }
};

// Markdown预览
const compiledMarkdown = computed(() => {
  return DOMPurify.sanitize(marked.parse(formState.markdown));  // Added .parse()
});

// 显示新增模态框
const showAddModal = () => {
  modalTitle.value = '新增图文';
  formState.id = null;
  formState.title = '';
  formState.cover = '';
  formState.markdown = '';
  formState.status = 'draft';
  coverFileList.value = [];
  modalVisible.value = true;
};

// 编辑项目
const editItem = record => {
  modalTitle.value = '编辑图文';
  formState.id = record.id;
  formState.title = record.title;
  formState.cover = record.cover;
  formState.markdown = record.markdown;
  formState.status = record.status;
  coverFileList.value = record.cover ? [{
    uid: '-1',
    name: 'cover',
    status: 'done',
    url: record.cover,
  }] : [];
  modalVisible.value = true;
};

// 发布项目
const publishItem = record => {
  Modal.confirm({
    title: '确认发布',
    content: `确定要发布图文"${record.title}"吗？`,
    onOk() {
      // 这里应该是API调用
      message.success('发布成功');
    },
  });
};

// 关闭模态框
const closeModal = () => {
  modalVisible.value = false;
};

// 提交表单
const handleSubmit = () => {
  if (!formState.title || !formState.markdown) {
    message.error('请填写完整信息');
    return;
  }

  // 这里应该是API调用
  message.success(`${modalTitle.value}成功`);
  closeModal();
};

// 删除项目
const deleteItem = id => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条图文吗？',
    onOk() {
      // 这里应该是API调用
      message.success('删除成功');
    },
  });
};

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
  const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.markdown');
  if (!isMarkdown) {
    message.error('只能上传Markdown文件!');
  }
  return isMarkdown;
};

const handleImport = () => {
  if (importFileList.value.length === 0) {
    message.error('请选择要导入的Markdown文件');
    return;
  }

  const file = importFileList.value[0].originFileObj;
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    formState.markdown = content;
    formState.title = file.name.replace(/\.(md|markdown)$/, '');
    closeImportModal();
    modalVisible.value = true;
    modalTitle.value = '导入图文';
  };
  reader.readAsText(file);
};

// 初始化
pagination.total = mockData.length;
</script>

<style scoped>
.graphic-text-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-area {
  margin-bottom: 20px;
  text-align: right;
}

.table-container {
  flex: 1;
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.markdown-preview {
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  height: 100%;
  overflow: auto;
}
</style>