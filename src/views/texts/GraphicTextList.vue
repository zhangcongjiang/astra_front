<template>
  <div class="graphic-list-container">

    <!-- 搜索区域 -->
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
        <a-form-item label="创建时间">
          <a-range-picker v-model:value="searchForm.dateRange" format="YYYY-MM-DD" :placeholder="['开始时间', '结束时间']" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 导入按钮 -->
    <div class="import-button-container">
      <a-button type="primary" @click="handleImport">导入图文</a-button>
    </div>

    <!-- 文案列表表格 -->
    <div class="table-container">
      <a-table :columns="columns" :dataSource="currentPageData" :pagination="false" rowKey="id" bordered>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'content'">
            <div class="text-content" :title="record.content">
              {{ record.content.length > 100 ? record.content.substring(0, 100) + '...' : record.content }}
            </div>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" @click="handleView(record)">查看</a-button>
            <a-button type="link" @click="handleDownload(record)">下载</a-button>
            <a-button type="link" :disabled="record.status === 'published'" @click="handlePublish(record)">
              发布
            </a-button>
            <a-button type="link" danger @click="handleDelete(record.id)">删除</a-button>
          </template>
        </template>
      </a-table>

      <div class="pagination">
        <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
          :total="pagination.total" @change="handlePaginationChange" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination.vue';
const router = useRouter();

// Add pagination definition here
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 搜索表单
const searchForm = reactive({
  name: '',
  dateRange: [],
  status: undefined // 新增状态筛选
});

// 修改表格列配置
const columns = [
  {
    title: '序号',
    dataIndex: 'index',
    width: '80px',
    align: 'center',
    customRender: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
  },
  {
    title: '图文标题',
    dataIndex: 'title',
    key: 'title',
    width: '300px',
    ellipsis: true,
    customRender: ({ text, record }) => ({
      children: h('a-button', {
        type: 'link',
        onClick: () => handleView(record)
      }, text)
    })
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '100px',
    customRender: ({ text }) => text === 'published' ? '已发布' : '未发布',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '180px',
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '操作',
    key: 'action',
    width: '200px',
    align: 'center',
  },
];

// 修改过滤逻辑
const filteredData = computed(() => {
  let result = [...mockData];

  // 名称筛选
  if (searchForm.name) {
    result = result.filter(item =>
      item.title.toLowerCase().includes(searchForm.name.toLowerCase())
    );
  }

  // 状态筛选
  if (searchForm.status !== undefined) {
    result = result.filter(item => item.status === searchForm.status);
  }

  // 日期筛选
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const [start, end] = searchForm.dateRange;
    result = result.filter(item => {
      const createTime = dayjs(item.createTime);
      return createTime.isAfter(start) && createTime.isBefore(end);
    });
  }

  pagination.total = result.length;
  return result;
});

// 模拟数据
const mockData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `图文标题 ${i + 1}`,
  content: `这是第 ${i + 1} 个图文的内容，这里包含了图文的主要描述和关键信息。内容可以很长，用于详细描述图文的内容和特点。`,
  status: i % 2 === 0 ? 'published' : 'unpublished',
  createTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format(),
}));

// 当前页数据
const currentPageData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredData.value.slice(start, end);
});

// 搜索
const handleSearch = () => {
  pagination.current = 1;
};

// 重置搜索
const resetSearch = () => {
  searchForm.name = '';
  searchForm.dateRange = [];
  handleSearch();
};

// 分页变化处理
const handlePaginationChange = (page, pageSize) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
};

// 查看详情
const handleView = (record) => {
  router.push({ name: 'GraphicTextDetail', params: { id: record.id } });
};

// 发布图文
const handlePublish = async (record) => {
  try {
    // 这里应该是API调用
    record.status = 'published';
    message.success('发布成功');
  } catch (error) {
    message.error('发布失败');
  }
};

// 删除图文
const handleDelete = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条图文吗？',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      // 这里应该是API调用
      message.success('删除成功');
    },
  });
};

// 初始化
pagination.total = mockData.length;
</script>

<style scoped>
.graphic-list-container {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-area .ant-form {
  flex: 1;
  margin-right: 16px;
}

.import-button-container {
  margin: 16px 0;
  text-align: right;
}

.search-area {
  margin-bottom: 0;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-container {
  margin-top: 16px;
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

.text-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

// Add new methods
const handleDownload = (record) => {
  const content = `标题: ${record.title}\n\n内容: ${record.content}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${record.title}.txt`;
  link.click();
  URL.revokeObjectURL(url);
  message.success('下载成功');
};

const handleImport = () => {
  Modal.confirm({
    title: '导入图文',
    content: h('div', { style: 'text-align: center;' }, [
      h('div', { 
        style: 'border: 2px dashed #d9d9d9; padding: 20px; border-radius: 4px;',
        onDrop: (e) => handleFileDrop(e),
        onDragOver: (e) => e.preventDefault()
      }, '将Markdown或Word文档拖拽到这里，或点击选择文件'),
      h('input', { 
        type: 'file',
        id: 'fileInput',
        style: 'display: none;',
        accept: '.md,.doc,.docx',
        onChange: (e) => handleFileSelect(e)
      })
    ]),
    okText: '确定',
    cancelText: '取消',
    onOk() {
      return new Promise((resolve) => {
        const input = document.getElementById('fileInput');
        input.click();
        resolve();
      });
    }
  });
};

// 添加文件选择处理函数
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    uploadFile(file);
  }
};

// 添加文件拖拽处理函数
const handleFileDrop = (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) {
    uploadFile(file);
  }
};

// 添加文件上传函数
const uploadFile = async (file) => {
  try {
    message.loading({ content: '正在导入...', key: 'import', duration: 0 });
    // 这里实现文件上传逻辑
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.success({ content: '导入成功', key: 'import' });
    fetchData();
  } catch (error) {
    message.error({ content: '导入失败', key: 'import' });
  }
};

// 添加fetchData方法
const fetchData = () => {
  // 这里实现获取图文列表数据的逻辑
  pagination.total = mockData.length;
};