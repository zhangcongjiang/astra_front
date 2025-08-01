<template>
  <div class="graphic-list-container">
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="图文标题">
          <a-input v-model:value="searchForm.name" placeholder="输入图文标题" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="选择状态" style="width: 120px">
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option value="published">已发布</a-select-option>
            <a-select-option value="unpublished">未发布</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="来源">
        <a-select v-model:value="searchForm.origin" placeholder="选择来源" style="width: 120px" allowClear>
        <a-select-option :value="undefined">全部</a-select-option>
        <a-select-option v-for="origin in originOptions" :key="origin" :value="origin">
        {{ origin }}
        </a-select-option>
        </a-select>
        </a-form-item>
        <a-form-item label="所属账号">
          <a-select v-model:value="searchForm.account" placeholder="选择账号" style="width: 120px" allowClear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option v-for="account in uniqueAccounts" :key="account" :value="account">
              {{ account }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker v-model:value="searchForm.dateRange" format="YYYY-MM-DD" :placeholder="['开始时间', '结束时间']" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="button-group" style="margin-left: auto;">
      <a-button type="primary" @click="handleCreate" :icon="h(PlusOutlined)">
        创建图文
      </a-button>
      <a-button type="primary" @click="handleImport">本地导入</a-button>
      <a-button type="primary" @click="handleUrlImport">URL导入</a-button>
    </div>

    <div class="table-container">
      <a-table 
        :columns="columns" 
        :dataSource="currentPageData" 
        :pagination="false" 
        :loading="loading"
        rowKey="id"
        :customRow="handleRowClick">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <div class="title-content">
              <span class="title-text">{{ record.title }}</span>
            </div>
          </template>
          <template v-if="column.key === 'content'">
            <div class="text-content">
              <div class="content-preview">
                <div v-for="(paragraph, index) in record.content.split('\n')" :key="index">
                  <p>{{ paragraph }}</p>
                </div>
              </div>
            </div>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'published' ? 'green' : 'orange'">
              {{ record.status === 'published' ? '已发布' : '未发布' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-buttons">
              <a-button type="link" @click="handleDownload(record)">下载</a-button>
              <a-button type="link" :disabled="record.status === 'published'" @click="handlePublish(record)">
                发布
              </a-button>
              <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
            </div>
          </template>
        </template>
      </a-table>
    </div>
    
    <div class="pagination">
      <Pagination 
        v-model:current="pagination.current" 
        v-model:pageSize="pagination.pageSize" 
        :total="pagination.total"
        @change="handlePaginationChange" />
    </div>
    
    <!-- 导入图文对话框 -->
    <!-- 本地导入图文对话框 -->
    <a-modal
      v-model:open="importModalVisible"
      title="本地导入图文"
      :width="600"
      @ok="confirmImport"
      @cancel="cancelImport"
      okText="确认导入"
      cancelText="取消">
      
      <a-form :model="importForm" layout="vertical">
        <a-form-item label="图文标题" required>
          <a-input 
            v-model:value="importForm.title" 
            placeholder="请输入图文标题"
            :maxlength="30"
            show-count />
        </a-form-item>
        
        <a-form-item label="选择文件" required>
          <div class="upload-area">
            <div 
              class="upload-dragger"
              @drop="handleFileDrop"
              @dragover.prevent
              @dragenter.prevent>
              
              <div class="upload-content">
                <div v-if="!importForm.file" class="upload-hint">
                  <!-- 将 a-icon 替换为正确的图标 -->
                  <div style="font-size: 48px; color: #999; margin-bottom: 16px;">📁</div>
                  <p>将 Markdown 文件拖拽到这里</p>
                  <p style="color: #999;">或者</p>
                  <a-button type="primary" @click="() => $refs.fileInput.click()">
                    选择文件
                  </a-button>
                  <p style="color: #999; margin-top: 8px; font-size: 12px;">
                    支持 .md, .markdown 格式
                  </p>
                </div>
                
                <div v-else class="file-selected">
                  <!-- 将 a-icon 替换为正确的图标 -->
                  <div style="font-size: 24px; color: #1890ff; margin-right: 8px;">📄</div>
                  <span>{{ importForm.file.name }}</span>
                  <a-button 
                    type="link" 
                    size="small" 
                    @click="importForm.file = null"
                    style="margin-left: 8px;">
                    重新选择
                  </a-button>
                </div>
              </div>
              
              <input 
                ref="fileInput"
                type="file" 
                accept=".md,.markdown"
                style="display: none;"
                @change="handleFileSelect" />
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- URL导入图文对话框 -->
    <a-modal
      v-model:open="urlImportModalVisible"
      title="URL导入图文"
      :width="600"
      @ok="confirmUrlImport"
      @cancel="cancelUrlImport"
      okText="确认导入"
      cancelText="取消">
      
      <a-form :model="urlImportForm" layout="vertical">
        <a-form-item label="平台来源" required>
          <a-radio-group v-model:value="urlImportForm.origin">
            <a-radio value="今日头条">今日头条</a-radio>
            <a-radio value="微信公众号">微信公众号</a-radio>
            <a-radio value="虎扑">虎扑</a-radio>
            <a-radio value="汽车之家">汽车之家</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="网络地址" required>
          <a-input 
            v-model:value="urlImportForm.url" 
            placeholder="请输入对应平台的内容链接" />
        </a-form-item>
      </a-form>
    </a-modal>
    
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination.vue';
// 导入图文相关的API
import { 
  getTextList, 
  deleteText, 
  downloadText, 
  uploadMarkdown,
  importFromUrl  // 新增URL导入API
} from '@/api/modules/textApi';

const router = useRouter();

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
});
// 在 script setup 中定义来源选项
const originOptions = [
'用户创建',
'本地导入', 
'今日头条',
'微信公众号',
'虎扑',
'汽车之家'
];

// 搜索表单
const searchForm = reactive({
  name: '',
  dateRange: [],
  status: undefined,
  account: undefined,
  origin: undefined  // 新增来源筛选
});

// 图文数据
const textList = ref([]);
const loading = ref(false);

// 获取图文列表数据
const fetchData = async () => {
  try {
    loading.value = true;
    const response = await getTextList();
    
    console.log('API响应数据:', response); // 添加调试日志
    
    // 处理不同的响应数据结构
    let dataList = [];
    
    if (response) {
      // 情况1: 直接返回数组
      if (Array.isArray(response)) {
        dataList = response;
      }
      // 情况2: response.data 是数组
      else if (response.data && Array.isArray(response.data)) {
        dataList = response.data;
      }
      // 情况3: response.data.results 是数组（分页数据）
      else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        dataList = response.data.results;
        pagination.total = response.data.total || response.data.count || dataList.length;
      }
      // 情况4: response.results 是数组
      else if (response.results && Array.isArray(response.results)) {
        dataList = response.results;
        pagination.total = response.total || response.count || dataList.length;
      }
      // 情况5: 其他可能的数据结构
      else {
        console.warn('未知的数据结构:', response);
        dataList = [];
      }
    }
    
    // 转换数据格式
    textList.value = dataList.map(item => ({
      id: item.id,
      title: item.title || '无标题',
      content: item.content || '',
      status: item.status || 'unpublished',
      createTime: item.create_time || item.createTime || new Date().toISOString(),
      account: item.account || '默认账号',
      origin: item.origin || '未知来源'  // 新增来源字段
    }));
    
    // 如果没有设置总数，使用数组长度
    if (!pagination.total) {
      pagination.total = textList.value.length;
    }
    
  } catch (error) {
    console.error('获取图文列表失败:', error);
    message.error('获取图文列表失败');
    textList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 过滤数据
const filteredData = computed(() => {
  let result = [...textList.value];

  if (searchForm.name) {
    result = result.filter(item =>
      item.title.toLowerCase().includes(searchForm.name.toLowerCase())
    );
  }

  if (searchForm.status !== undefined) {
    result = result.filter(item => item.status === searchForm.status);
  }

  if (searchForm.origin !== undefined) {
    result = result.filter(item => item.origin === searchForm.origin);
  }

  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const [start, end] = searchForm.dateRange;
    result = result.filter(item => {
      const createTime = dayjs(item.createTime);
      return createTime.isAfter(start) && createTime.isBefore(end);
    });
  }

  if (searchForm.account !== undefined) {
    result = result.filter(item => item.account === searchForm.account);
  }

  return result;
});

// 当前页数据
const currentPageData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredData.value.slice(start, end);
});

// 唯一账号列表
const uniqueAccounts = computed(() => {
  const accounts = new Set(textList.value.map(item => item.account));
  return Array.from(accounts);
});

// 表格列配置
const columns = [
  {
    title: '序号',
    dataIndex: 'index',
    width: '50px',
    align: 'center',
    customRender: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
  },
  {
    title: '图文标题',
    dataIndex: 'title',
    key: 'title',
    width: '300px',
    ellipsis: true,
  },
  {
    title: '来源',
    dataIndex: 'origin',
    key: 'origin',
    width: '120px',
    align: 'center',
    ellipsis: true
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: '100px',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '120px',
    align: 'center',
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '所属账号',
    dataIndex: 'account',
    key: 'account',
    align: 'center',
    width: '120px',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'action',
    width: '200px',
    align: 'center',
  },
];

// 行点击处理
const handleRowClick = (record) => {
  return {
    onClick: (event) => {
      // 检查点击的元素是否在操作列内
      const target = event.target;
      const actionColumn = target.closest('.action-buttons');
      
      // 如果点击的是操作列，则不执行跳转
      if (actionColumn) {
        return;
      }
      
      // 否则跳转到编辑页面
      router.push({
        name: 'GraphicTextCreate',
        params: { id: record.id }
      });
    }
  };
};

// 删除图文
const handleDelete = (record) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条图文吗？',
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteText(record.id);
        message.success('删除成功');
        fetchData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
};

// 下载图文
const handleDownload = async (record) => {
  try {
    message.loading({ content: '正在下载...', key: 'download', duration: 0 });
    await downloadText(record.id, record.title);
    message.success({ content: '下载成功', key: 'download' });
  } catch (error) {
    console.error('下载失败:', error);
    message.error({ content: '下载失败', key: 'download' });
  }
};

// 发布图文
const handlePublish = async (record) => {
  try {
    // 这里需要根据后端API添加发布接口
    record.status = 'published';
    message.success('发布成功');
    fetchData();
  } catch (error) {
    message.error('发布失败');
  }
};

// 导入图文
// 添加导入相关的响应式数据
const importForm = reactive({
  title: '',
  file: null,
  url: ''  // 新增URL字段
});
const importModalVisible = ref(false);
const importType = ref('file');  // 新增导入类型：'file' 或 'url'
const urlPreview = reactive({  // 新增URL预览数据
  loading: false,
  title: '',
  content: ''
});

// 导入图文 - 修改为显示自定义对话框
const handleImport = () => {
  importForm.title = '';
  importForm.file = null;
  importForm.url = '';  // 重置URL
  importType.value = 'file';  // 默认选择文件导入
  urlPreview.loading = false;  // 重置预览状态
  urlPreview.title = '';
  urlPreview.content = '';
  importModalVisible.value = true;
};

// URL导入表单数据
const urlImportForm = reactive({
  url: '',
  origin: 'toutiao'  // 默认选择今日头条
});
const urlImportModalVisible = ref(false);

// URL导入方法
const handleUrlImport = () => {
  urlImportModalVisible.value = true;
};

// 确认URL导入
const confirmUrlImport = async () => {
  if (!urlImportForm.origin) {
    message.error('请选择平台来源');
    return;
  }
  
  if (!urlImportForm.url.trim()) {
    message.error('请输入网络地址');
    return;
  }
  
  try {
    message.loading({ content: '正在从网络导入...', key: 'urlImport', duration: 0 });
    
    const res = await importFromUrl(urlImportForm.url.trim(), urlImportForm.origin);
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    
    message.success({ content: '导入成功', key: 'urlImport' });
    urlImportModalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('URL导入失败:', error);
    message.error({ content: error.message || 'URL导入失败', key: 'urlImport' });
  }
};

// 取消URL导入
const cancelUrlImport = () => {
  urlImportModalVisible.value = false;
  urlImportForm.url = '';
  urlImportForm.origin = 'toutiao';  // 重置为默认值
};

// 新增：导入类型切换处理
const handleImportTypeChange = (activeKey) => {
  importType.value = activeKey;
  // 切换时清空相关数据
  if (activeKey === 'file') {
    importForm.url = '';
    urlPreview.loading = false;
    urlPreview.title = '';
    urlPreview.content = '';
  } else {
    importForm.file = null;
  }
};

// 新增：URL输入失焦处理
const handleUrlBlur = async () => {
  if (!importForm.url.trim()) {
    urlPreview.loading = false;
    urlPreview.title = '';
    urlPreview.content = '';
    return;
  }
  
  try {
    urlPreview.loading = true;
    const response = await previewUrl(importForm.url.trim());
    
    if (response && response.data) {
      urlPreview.title = response.data.title || '';
      urlPreview.content = response.data.content || '';
      
      // 如果标题为空，使用预览的标题
      if (!importForm.title && urlPreview.title) {
        importForm.title = urlPreview.title;
      }
    }
  } catch (error) {
    console.error('获取URL预览失败:', error);
    message.warning('无法获取URL内容预览，但仍可尝试导入');
    urlPreview.title = '';
    urlPreview.content = '';
  } finally {
    urlPreview.loading = false;
  }
};

// 修改确认导入方法
const confirmImport = async () => {
  if (!importForm.title.trim()) {
    message.error('请输入图文标题');
    return;
  }
  
  if (importType.value === 'file') {
    // 文件导入逻辑
    if (!importForm.file) {
      message.error('请选择要导入的文件');
      return;
    }
    
    try {
      message.loading({ content: '正在导入...', key: 'import', duration: 0 });
      
      await uploadMarkdown(importForm.file, importForm.title.trim(), (progress) => {
        console.log('上传进度:', progress);
      });
      
      message.success({ content: '导入成功', key: 'import' });
      importModalVisible.value = false;
      fetchData();
    } catch (error) {
      console.error('导入失败:', error);
      message.error({ content: error.message || '导入失败', key: 'import' });
    }
  } else {
    // URL导入逻辑
    if (!importForm.url.trim()) {
      message.error('请输入要导入的网络地址');
      return;
    }
    
    try {
      message.loading({ content: '正在从网络导入...', key: 'import', duration: 0 });
      
      await importFromUrl(importForm.url.trim(), importForm.title.trim());
      
      message.success({ content: '导入成功', key: 'import' });
      importModalVisible.value = false;
      fetchData();
    } catch (error) {
      console.error('URL导入失败:', error);
      message.error({ content: error.message || 'URL导入失败', key: 'import' });
    }
  }
};

// 修改取消导入方法
const cancelImport = () => {
  importModalVisible.value = false;
  importForm.title = '';
  importForm.file = null;
  importForm.url = '';  // 重置URL
  importType.value = 'file';
  urlPreview.loading = false;
  urlPreview.title = '';
  urlPreview.content = '';
};

// 移除原来的 uploadFile 函数，因为已经被 confirmImport 替代
// 创建图文
const handleCreate = () => {
  router.push({ name: 'GraphicTextCreate' });
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

// 重置搜索
const resetSearch = () => {
  searchForm.name = '';
  searchForm.dateRange = [];
  searchForm.status = undefined;
  searchForm.account = undefined;
  searchForm.origin = undefined;  // 重置来源筛选
  handleSearch();
};

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.current = current;
  pagination.pageSize = pageSize;
  fetchData();
};

// 初始化数据
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.graphic-list-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-container {
  margin-top: 16px;
  flex: 1;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title-content {
  display: flex;
  align-items: center;
}

.title-text {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.text-content {
  max-height: 120px;
  overflow: hidden;
  position: relative;
}

.content-preview {
  max-height: 100px;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.search-area .ant-form {
  flex: 1;
  margin-right: 16px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

:deep(.ant-table-row) {
  transition: all 0.3s ease;
  cursor: pointer;
}

:deep(.ant-table-row:hover) {
  background-color: #fafafa;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.ant-table-cell) {
  padding: 16px !important;
}

.upload-area {
  width: 100%;
}

.upload-dragger {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  text-align: center;
  padding: 40px 20px;
  transition: border-color 0.3s;
  cursor: pointer;
}

.upload-dragger:hover {
  border-color: #1890ff;
}

.upload-dragger.dragover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-hint p {
  margin: 4px 0;
  color: #666;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #91d5ff;
}

.file-selected span {
  color: #1890ff;
  font-weight: 500;
}

.url-preview {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  background-color: #fafafa;
}

.preview-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #262626;
}

.preview-content {
  color: #595959;
  line-height: 1.5;
  white-space: pre-wrap;
}

.ant-tabs-content {
  padding-top: 16px;
}
</style>
