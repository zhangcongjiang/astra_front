<template>
  <div class="video-text-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="视频名称">
          <a-input v-model:value="searchForm.name" placeholder="输入视频名称" @pressEnter="handleSearch" />
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

    <!-- 操作按钮 -->
    <div class="action-area">
      <a-button type="primary" @click="showAddModal">
        <plus-outlined /> 新增文案
      </a-button>
    </div>

    <!-- 文案列表表格 -->
    <div class="table-container">
      <a-table 
        :columns="columns" 
        :dataSource="currentPageData" 
        :pagination="false"
        rowKey="id"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'text'">
            <div class="text-content">
              <div v-for="(paragraph, index) in record.text" :key="index" class="paragraph-item">
                <p>{{ paragraph }}</p>
              </div>
            </div>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" @click="editItem(record)">编辑</a-button>
            <a-button type="link" danger @click="deleteItem(record.id)">删除</a-button>
            <a-button type="link" @click="applyTemplate(record)">应用模板</a-button>
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
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
      width="800px"
    >
      <a-form :model="formState" layout="vertical">
        <a-form-item label="视频名称" required>
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="文案内容" required>
          <div class="paragraph-container">
            <div v-for="(paragraph, index) in formState.text" :key="index" class="paragraph-item">
              <a-textarea
                v-model:value="formState.text[index]"
                :rows="3"
                :placeholder="`请输入第 ${index + 1} 段文案`"
              />
              <a-button
                v-if="index > 0"
                type="link"
                danger
                class="remove-btn"
                @click="removeParagraph(index)"
              >
                删除该段
              </a-button>
            </div>
            <a-button type="dashed" @click="addParagraph">
              <plus-outlined />
              添加新段落
            </a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
import { ref, reactive, computed } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';

// 搜索表单
const searchForm = reactive({
  name: '',
  dateRange: [],
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
    title: '视频名称',
    dataIndex: 'name',
    key: 'name',
    width: '200px',
  },
  {
    title: '文案内容',
    dataIndex: 'text',
    key: 'text',
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
    width: '150px',
    align: 'center',
  },
];

// 当前页数据
const currentPageData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredData.value.slice(start, end);
});

// 过滤后的数据
const filteredData = computed(() => {
  let result = [...mockData];
  
  // 名称筛选
  if (searchForm.name) {
    result = result.filter(item => 
      item.name.toLowerCase().includes(searchForm.name.toLowerCase())
    );
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

// 新增/编辑相关
const modalVisible = ref(false);
const modalTitle = ref('新增文案');
const formState = reactive({
  id: null,
  name: '',
  text: [''], // 默认包含一个空段落
});

// 添加段落
const addParagraph = () => {
  formState.text.push('');
};

// 删除段落
const removeParagraph = (index) => {
  formState.text.splice(index, 1);
};

// 显示新增模态框
const showAddModal = () => {
  modalTitle.value = '新增文案';
  formState.id = null;
  formState.name = '';
  formState.text = ['']; // 初始化时包含一个空段落
  modalVisible.value = true;
};

// 编辑项目
const editItem = (record) => {
  modalTitle.value = '编辑文案';
  formState.id = record.id;
  formState.name = record.name;
  formState.text = [...record.text]; // 复制文案数组
  modalVisible.value = true;
};

// 提交表单
const handleSubmit = () => {
  if (!formState.name || formState.text.some(p => !p.trim())) {
    message.error('请填写完整信息');
    return;
  }

  // 过滤空段落
  const paragraphs = formState.text
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // 这里应该是API调用
  const newItem = {
    id: formState.id || Date.now(),
    name: formState.name,
    text: paragraphs,
    createTime: new Date().toISOString()
  };

  // 更新数据
  if (formState.id) {
    // 编辑
    const index = mockData.findIndex(item => item.id === formState.id);
    mockData.splice(index, 1, newItem);
  } else {
    // 新增
    mockData.unshift(newItem);
  }

  message.success(`${modalTitle.value}成功`);
  closeModal();
};

// 模拟数据调整
const mockData = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `视频文案 ${i + 1}`,
  text: [
    `这是第 ${i + 1} 个视频的第一段文案。`,
    `这是第二段文案，用于详细描述视频的内容。`,
    `这是第三段文案，包含视频的关键信息。`
  ],
  createTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format(),
}));

// 删除项目
const deleteItem = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条文案吗？',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      // 这里应该是API调用
      message.success('删除成功');
    },
  });
};

// 应用模板
const applyTemplate = (record) => {
  router.push({
    path: '/templates',
    state: {
      sourceRecord: record // 传递当前文案数据
    }
  });
};

// 初始化
pagination.total = mockData.length;
</script>

<style scoped>
.video-text-container {
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

.text-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paragraph-item {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.paragraph-item p {
  margin: 0;
}

.paragraph-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.paragraph-item {
  position: relative;
  padding-bottom: 24px;
}

.remove-btn {
  position: absolute;
  right: 0;
  bottom: 0;
}
</style>