<template>
  <div>
    <!-- 搜索区域 -->
    <div class="search-area">
      <!-- 基础查询表单 -->
      <a-form layout="inline" :model="basicForm">
        <a-form-item label="标题">
          <a-input v-model:value="basicForm.title" placeholder="输入标题" @pressEnter="handleSearch" />
        </a-form-item>
        <a-form-item label="创作时间">
          <a-range-picker v-model:value="basicForm.dateRange" :show-time="{ format: 'HH:mm' }"
            format="YYYY-MM-DD HH:mm" :placeholder="['开始时间', '结束时间']" @change="handleDateChange" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="resetBasicSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 数据表格 -->
    <n-card>
      <n-data-table
        :columns="columns"
        :data="filteredData"
        :pagination="false"
        :loading="loading"
      />
    </n-card>
    
    <!-- 分页组件 -->
    <Pagination
      v-model:current="currentPage"
      v-model:pageSize="pageSize"
      :total="filteredData.length"
      @change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'; // Add reactive to the imports
import { h } from 'vue';
import { NDataTable, NCard, NButton, NProgress, NForm, NFormItem, NInput, NDatePicker } from 'naive-ui';
import Pagination from '@/components/Pagination.vue';

// 查询参数
const basicForm = reactive({
  title: '',
  dateRange: [],
  startTime: null,
  endTime: null
});

// 过滤后的数据
const filteredData = computed(() => {
  return videoList.value.filter(item => {
    const matchesTitle = item.title.includes(basicForm.title);
    let matchesDate = true;

    if (basicForm.startTime && basicForm.endTime) {
      const itemDate = new Date(item.createTime);
      matchesDate = itemDate >= new Date(basicForm.startTime) &&
                   itemDate <= new Date(basicForm.endTime);
    }

    return matchesTitle && matchesDate;
  });
});

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

// 重置查询
const resetBasicSearch = () => {
  basicForm.title = '';
  basicForm.dateRange = [];
  basicForm.startTime = null;
  basicForm.endTime = null;
  handleSearch();
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

// 视频列表数据
const videoList = ref([
  {
    id: 1,
    title: '视频1',
    createTime: '2023-10-01',
    audioProgress: 80,
    videoProgress: 60,
    params: {
      // 视频参数
    }
  },
  // 更多视频数据...
]);

// 表格列配置
const columns = [
  {
    title: '序号',
    key: 'index',
    render: (row, index) => index + 1
  },
  {
    title: '标题',
    key: 'title'
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

// 分页配置
const pagination = {
  pageSize: 10
};

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

<style scoped>
.search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.basic-search .ant-form-item {
  margin-bottom: 16px;
}
</style>