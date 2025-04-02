<template>
  <div class="graphic-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="basicForm">
        <a-form-item label="标题">
          <a-input v-model:value="basicForm.title" placeholder="输入标题" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="创作时间">
          <a-range-picker 
            v-model:value="basicForm.dateRange" 
            :show-time="{ format: 'HH:mm' }" 
            format="YYYY-MM-DD HH:mm"
            :placeholder="['开始时间', '结束时间']" 
            @change="handleDateChange"
          />
        </a-form-item>
        <a-form-item label="所属账号">
          <a-select
            v-model:value="basicForm.account"
            placeholder="选择账号"
            style="width: 120px"
            allowClear
          >
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option v-for="account in uniqueAccounts" :key="account" :value="account">
              {{ account }}
            </a-select-option>
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
      <n-data-table :columns="columns" :data="filteredData" :pagination="false" :loading="loading" />
    </n-card>

    <!-- 分页组件 -->
    <Pagination v-model:current="currentPage" v-model:pageSize="pageSize" :total="filteredData.length"
      @change="handlePageChange" />
  </div>
</template>


<script setup>
import { ref, computed, reactive } from 'vue'; // Add reactive to the imports
import { h } from 'vue';
import { NDataTable, NCard, NButton, NProgress, NForm, NFormItem, NInput, NDatePicker } from 'naive-ui';
import Pagination from '@/components/Pagination.vue';

// 查询参数
// 修改搜索表单
const basicForm = reactive({
  title: '',
  dateRange: [],
  startTime: null,
  endTime: null,
  account: undefined
});

// 在视频数据中添加account字段
const videoList = ref([
  {
    id: 1,
    title: '视频1',
    createTime: '2023-10-01',
    audioProgress: 80,
    videoProgress: 60,
    account: '账号1',
    params: {
      // 视频参数
    }
  },
  // 更多视频数据...
]);

// 添加唯一账号列表计算属性
const uniqueAccounts = computed(() => {
  const accounts = new Set(videoList.value.map(item => item.account));
  return Array.from(accounts);
});

// 修改过滤逻辑
const filteredData = computed(() => {
  return videoList.value.filter(item => {
    const matchesTitle = item.title.includes(basicForm.title);
    let matchesDate = true;
    let matchesAccount = true;

    if (basicForm.startTime && basicForm.endTime) {
      const itemDate = new Date(item.createTime);
      matchesDate = itemDate >= new Date(basicForm.startTime) &&
        itemDate <= new Date(basicForm.endTime);
    }

    if (basicForm.account !== undefined) {
      matchesAccount = item.account === basicForm.account;
    }

    return matchesTitle && matchesDate && matchesAccount;
  });
});

// 修改重置方法
const resetBasicSearch = () => {
  basicForm.title = '';
  basicForm.dateRange = [];
  basicForm.startTime = null;
  basicForm.endTime = null;
  basicForm.account = undefined;
  handleSearch();
};

// 修改模板中的搜索区域

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


// 处理查询
const handleSearch = () => {
  currentPage.value = 1; // 查询后回到第一页
};

// 处理重置
const handleReset = () => {
  queryParams.value = {
    title: '',
    dateRange: null
  };
  currentPage.value = 1;
};

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

// 计算分页后的数据
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return videoList.value.slice(start, end);
});

// 处理分页变化
const handlePageChange = ({ current, pageSize }) => {
  currentPage.value = current;
  pageSize.value = pageSize;
};


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
    key: 'title'
  },
  {
    title: '封面',
    key: 'cover',
    width: 120,
    align: 'center',
    render: (row) => h('img', {
      src: row.cover,
      style: 'width: 100px; height: 60px; object-fit: cover; border-radius: 4px;'
    })
  },
  {
    title: '生成进度',
    key: 'progress',
    render: (row) => h('div', [
      h('div', { style: 'margin-bottom: 8px;' }, [
        h('span', { style: 'margin-right: 8px;' }, '音频:'),
        h(NProgress, {
          percentage: row.audioProgress,
          status: row.audioProgress === 100 ? 'success' : 'default',
          style: 'width: 80%; display: inline-block;'
        })
      ]),
      h('div', [
        h('span', { style: 'margin-right: 8px;' }, '视频:'),
        h(NProgress, {
          percentage: row.videoProgress,
          status: row.videoProgress === 100 ? 'success' : 'default',
          style: 'width: 80%; display: inline-block;'
        })
      ])
    ])
  },
  {
    title: '创作时间',
    key: 'createTime'
  },
  {
    title: '所属账号',
    key: 'account',
    width: 120,
    align: 'center'
  },
  {
    title: '操作',
    key: 'actions',
    render: (row) => [
      h(NButton, {
        type: 'primary',
        size: 'small',
        onClick: () => showDetail(row)
      }, '详情'),
      h(NButton, {
        type: row.videoProgress === 100 ? 'primary' : 'default',
        size: 'small',
        disabled: row.videoProgress !== 100,
        onClick: () => downloadVideo(row)
      }, '下载'),
      h(NButton, {
        type: row.videoProgress === 100 ? 'primary' : 'default',
        size: 'small',
        disabled: row.videoProgress !== 100,
        onClick: () => playVideo(row)
      }, '播放'),
      h(NButton, {
        type: row.videoProgress === 100 ? 'primary' : 'default',
        size: 'small',
        disabled: row.videoProgress === 100,
        onClick: () => regenerateVideo(row)
      }, '重新生成'),
      h(NButton, {
        type: 'danger',
        size: 'small',
        disabled: row.videoProgress !== 100,
        onClick: () => deleteVideo(row)
      }, '删除')
    ]
  }
];
// 在示例数据中添加account字段
const videoData = ref([
  {
    id: 1,
    cover: 'https://example.com/cover1.jpg',
    title: '视频1',
    createTime: '2023-10-01',
    audioProgress: 80,
    videoProgress: 60,
    account: '账号1',
    params: {
      // 视频参数
    }
  },
  // 更多视频数据...
]);
// 分页配置
// 分页相关
const pagination = reactive({
  current: 1,
  pageSize: 10
});


// 显示详情
const showDetail = (row) => {
  console.log(JSON.stringify(row.params, null, 2));
};

// 下载视频
const downloadVideo = (row) => {
  // 下载逻辑
};

// 重新生成视频
const regenerateVideo = (row) => {
  // 重新生成逻辑
};

// 播放视频
const playVideo = (row) => {
  // 播放逻辑
  console.log('播放视频:', row.id);
};

// 删除视频
const deleteVideo = (row) => {
  // 删除逻辑
  const index = videoList.value.findIndex(video => video.id === row.id);
  if (index !== -1) {
    videoList.value.splice(index, 1);
    console.log('删除视频成功:', row.id);
  }
};
</script>

// 修改搜索区域样式
<style scoped>
/* 添加容器样式 */
.graphic-list-container {
  padding: 20px;  /* 上下左右各20px间距 */
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 搜索区域样式保持不变 */
.search-area {
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 表格容器样式 */
.table-container {
  margin-top: 16px;
  flex: 1;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-area .ant-form-item {
  margin-bottom: 16px;
}

.search-area .ant-form-item-label > label {
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

.n-data-table :deep(img) {
  border-radius: 4px;
  transition: transform 0.2s;
}

.n-data-table :deep(img:hover) {
  transform: scale(1.05);
}

/* 操作按钮样式 */
.n-button {
  margin-right: 8px;
}

/* 进度条样式 */
.n-progress {
  margin-bottom: 8px;
}
</style>
