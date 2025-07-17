<template>
  <div class="graphic-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="basicForm">
        <a-form-item label="标题">
          <a-input v-model:value="basicForm.title" placeholder="输入标题" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="创作时间">
          <a-range-picker v-model:value="basicForm.dateRange" :show-time="{ format: 'HH:mm' }" format="YYYY-MM-DD HH:mm"
            :placeholder="['开始时间', '结束时间']" @change="handleDateChange" />
        </a-form-item>
        <a-form-item label="创建者">
          <a-select v-model:value="basicForm.creator" placeholder="选择创建者" style="width: 120px" allowClear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option v-for="creator in uniqueCreators" :key="creator" :value="creator">
              {{ creator }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="生成状态">
          <a-select v-model:value="basicForm.result" placeholder="选择状态" style="width: 120px" allowClear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option value="Process">生成中</a-select-option>
            <a-select-option value="Success">成功</a-select-option>
            <a-select-option value="Fail">失败</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetBasicSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 数据表格 -->
    <n-card>
      <n-data-table :columns="columns" :data="videoList" :pagination="false" :loading="loading" />
    </n-card>

    <!-- 分页组件 -->
    <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize" :total="pagination.total"
      @change="handlePageChange" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { h } from 'vue';
import { NDataTable, NCard, NButton, NProgress, NTag, useDialog, useMessage } from 'naive-ui';
import Pagination from '@/components/Pagination.vue';
import { getVideoList,deleteVideo } from '@/api/modules/videoApi.js';
import dayjs from 'dayjs';


// 加载状态
const loading = ref(false);

// 视频数据
const videoList = ref([]);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 查询参数
const basicForm = reactive({
  title: '',
  dateRange: [],
  startTime: null,
  endTime: null,
  creator: undefined,
  result: undefined
});

// 获取唯一创建者列表
const uniqueCreators = computed(() => {
  const creators = new Set(videoList.value.map(item => item.creator));
  return Array.from(creators);
});

// 加载视频列表数据
const loadVideoList = async () => {
  try {
    loading.value = true;

    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      title: basicForm.title || undefined,
      start_time: basicForm.startTime ? dayjs(basicForm.startTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
      end_time: basicForm.endTime ? dayjs(basicForm.endTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
      creator: basicForm.creator || undefined,
      result: basicForm.result || undefined
    };

    const response = await getVideoList(params);

    if (response.code === 0) {
      videoList.value = response.data.results || [];
      pagination.total = response.data.count || 0;
    } else {
      console.error('获取视频列表失败:', response.message);
    }
  } catch (error) {
    console.error('加载视频列表出错:', error);
  } finally {
    loading.value = false;
  }
};

// 处理查询
const handleSearch = () => {
  pagination.current = 1;
  loadVideoList();
};

// 处理分页变化
const handlePageChange = ({ current, pageSize: newPageSize }) => {
  pagination.current = current;
  pagination.pageSize = newPageSize;
  loadVideoList();
};

// 重置搜索
const resetBasicSearch = () => {
  basicForm.title = '';
  basicForm.dateRange = [];
  basicForm.startTime = null;
  basicForm.endTime = null;
  basicForm.creator = undefined;
  basicForm.result = undefined;
  handleSearch();
};

// 处理日期范围变化
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    basicForm.startTime = dates[0];
    basicForm.endTime = dates[1];
  } else {
    basicForm.startTime = null;
    basicForm.endTime = null;
  }
};


// 下载视频
const downloadVideo = (row) => {
  console.log('下载视频:', row);
  // 这里可以实现下载逻辑
};

// 预览视频
const previewVideo = (row) => {
  console.log('预览视频:', row);
  // 这里可以实现预览逻辑
};

// 获取状态显示信息
const getStatusInfo = (result) => {
  switch (result) {
    case 'Process':
      return { text: '生成中', type: 'warning' };
    case 'Success':
      return { text: '成功', type: 'success' };
    case 'Fail':
      return { text: '失败', type: 'error' };
    default:
      return { text: '未知', type: 'default' };
  }
};

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center',
    render: (row, index) => (pagination.current - 1) * pagination.pageSize + index + 1
  },
  {
    title: '标题',
    key: 'title',
    width: 200
  },
  {
    title: '创建者',
    key: 'creator',
    width: 100,
    align: 'center'
  },
  {
    title: '状态',
    key: 'status',
    width: 200,
    align: 'center',
    render: (row) => {
      const statusInfo = getStatusInfo(row.result);

      if (row.result === 'Process') {
        // 生成中显示进度条和百分比
        console.log("生成进度：", row.process);
        const percentage = Math.round((row.process || 0) * 100);
        return h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }
        }, [
          h(NProgress, {
            percentage: percentage,
            status: 'active',
            showIndicator: false,
            color: '#18a058',
            railColor: '#f0f0f0',
            style: 'width: 120px; flex-shrink: 0;'
          }),
          h('span', {
            style: {
              fontSize: '12px',
              color: '#666',
              minWidth: '35px',
              textAlign: 'left'
            }
          }, `${percentage}%`)
        ]);
      } else {
        // 成功或失败显示状态标签
        return h('div', {
          style: {
            display: 'flex',
            justifyContent: 'center'
          }
        }, [
          h(NTag, {
            type: statusInfo.type
          }, () => statusInfo.text)
        ]);
      }
    }
  },
  {
    title: '创建时间',
    key: 'create_time',
    width: 180,
    render: (row) => {
      return dayjs(row.create_time).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => [
      h(NButton, {
        type: 'primary',
        size: 'small',
        onClick: () => showDetail(row)
      }, () => '详情'),
      h(NButton, {
        type: 'error',
        size: 'small',
        style: { marginLeft: '8px' },
        onClick: () => handleDelete(row)
      }, () => '删除')
    ]
  }
];

// 组件挂载时加载数据
onMounted(() => {
  loadVideoList();
});

// 在script setup部分添加路由跳转函数
import { useRouter } from 'vue-router';

const router = useRouter();

// 查看详情
const showDetail = (row) => {
  router.push(`/my-videos/${row.id}`);
};

// 在 script setup 中添加
const dialog = useDialog();
const message = useMessage();

// 修改删除函数
const handleDelete = async (row) => {
  // 确认删除
  const confirmed = await new Promise((resolve) => {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除视频 "${row.title}" 吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false)
    });
  });
  
  if (!confirmed) return;
  
  try {
    // 调用删除API
    await deleteVideo(row.id);
    
    message.success('删除成功');
    // 重新加载列表
    loadVideoList();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};
</script>

<style scoped>
.graphic-list-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 搜索区域样式 */
.search-area {
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-area .ant-form-item {
  margin-bottom: 16px;
}

.search-area .ant-form-item-label>label {
  font-weight: 500;
}

.search-area .ant-input,
.search-area .ant-picker {
  width: 200px;
}

.search-area .ant-select {
  width: 150px;
}

.search-area .ant-btn {
  margin-left: 8px;
}

/* 表格样式优化 */
.n-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.n-data-table {
  border-radius: 8px;
}

.n-data-table :deep(.n-data-table-th) {
  background-color: #fafafa;
  font-weight: 500;
}

.n-data-table :deep(.n-data-table-td) {
  padding: 12px 16px;
}

/* 操作按钮样式 */
.n-button {
  margin-right: 8px;
}
</style>