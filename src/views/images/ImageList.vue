<template>
  <div class="image-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-header">
        <a-radio-group v-model:value="searchType" size="small">
          <a-radio-button value="basic">基础查询</a-radio-button>
          <a-radio-button value="tag">标签查询</a-radio-button>
        </a-radio-group>
      </div>

      <!-- 基础查询表单 -->
      <div class="basic-search" v-if="searchType === 'basic'">
        <a-form layout="inline" :model="basicForm">
          <a-form-item label="图片名称">
            <a-input 
              v-model:value="basicForm.name" 
              placeholder="输入图片名称" 
              @pressEnter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="上传者">
            <a-input 
              v-model:value="basicForm.uploader" 
              placeholder="输入上传者名称" 
              @pressEnter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="创建时间">
            <a-range-picker
              v-model:value="basicForm.dateRange"
              :show-time="{ format: 'HH:mm' }"
              format="YYYY-MM-DD HH:mm"
              :placeholder="['开始时间', '结束时间']"
              @change="handleDateChange"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="resetBasicSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 标签查询 -->
      <div class="tag-search" v-if="searchType === 'tag'">
        <div class="tag-categories">
          <div class="tag-category" v-for="category in tagCategories" :key="category.id">
            <div class="category-title">{{ category.name }}：</div>
            <div class="tags">
              <a-tag 
                v-for="tag in category.tags" 
                :key="tag.id"
                :color="selectedTags.includes(tag.id) ? 'blue' : 'default'"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
              </a-tag>
            </div>
          </div>
        </div>
        <div class="tag-search-actions">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="clearTags">清空</a-button>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-area">
      <a-upload
        v-model:file-list="fileList"
        name="file"
        :multiple="true"
        action="/api/upload"
        @change="handleUploadChange"
      >
        <a-button type="primary">
          <upload-outlined /> 上传图片
        </a-button>
      </a-upload>
    </div>

    <!-- 图片列表 - 响应式5列布局 -->
    <div class="image-grid">
    <a-row :gutter="[16, 16]">
      <a-col 
        v-for="image in currentPageImages" 
        :key="image.id"
        :xs="24" :sm="12" :md="8" :lg="6" :xl="4.8"
        class="image-col"
      >
        <a-card hoverable class="image-card">
          <template #cover>
            <img 
              :src="image.url" 
              class="image-preview"
              :style="{ height: `${imageHeight}px` }"
            />
          </template>
          <a-card-meta :title="image.name">
            <template #description>
              <div class="image-meta">
                <div>上传者: {{ image.uploader }}</div>
                <div>上传时间: {{ formatDate(image.uploadTime) }}</div>
                <div class="image-tags">
                  <a-tag v-for="tag in image.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                </div>
              </div>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>
    </a-row>
  </div>

    <!-- 使用独立的分页组件 -->
    <Pagination
      v-model:current="pagination.current"
      v-model:pageSize="pagination.pageSize"
      :total="pagination.total"
      @change="handlePaginationChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import Pagination from '@/components/Pagination.vue';

// 搜索类型
const searchType = ref('basic');

// 基础查询表单
const basicForm = reactive({
  name: '',
  uploader: '',
  dateRange: [],
  startTime: null,
  endTime: null
});

// 标签数据
const tagCategories = ref([
  {
    id: 1,
    name: '类型',
    tags: [
      { id: 'type_1', name: '风景' },
      { id: 'type_2', name: '人物' },
      { id: 'type_3', name: '动物' },
      { id: 'type_4', name: '建筑' }
    ]
  },
  {
    id: 2,
    name: '颜色',
    tags: [
      { id: 'color_1', name: '红色' },
      { id: 'color_2', name: '蓝色' },
      { id: 'color_3', name: '绿色' },
      { id: 'color_4', name: '黑白' }
    ]
  }
]);

// 选中的标签
const selectedTags = ref([]);

// 图片数据
const imageData = ref(generateMockImages(50));

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 图片高度响应式设置
const imageHeight = ref(200);

// 窗口大小变化处理
const handleResize = () => {
  const width = window.innerWidth;
  if (width < 576) {       // 超小屏幕 (手机)
    imageHeight.value = 120;
  } else if (width < 768) { // 小屏幕 (平板竖屏)
    imageHeight.value = 150;
  } else if (width < 992) { // 中等屏幕 (平板横屏)
    imageHeight.value = 180;
  } else if (width < 1200) { // 大屏幕 (小桌面)
    imageHeight.value = 200;
  } else {                 // 超大屏幕 (大桌面)
    imageHeight.value = 220;
  }
};

// 当前页显示的图片
const currentPageImages = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredImages.value.slice(start, end);
});

// 过滤后的图片
const filteredImages = computed(() => {
  const filtered = imageData.value.filter(image => {
    // 基础查询过滤
    if (searchType.value === 'basic') {
      const nameMatch = image.name.toLowerCase().includes(basicForm.name.toLowerCase());
      const uploaderMatch = image.uploader.toLowerCase().includes(basicForm.uploader.toLowerCase());
      let dateMatch = true;
      
      if (basicForm.startTime && basicForm.endTime) {
        const imageDate = dayjs(image.uploadTime);
        dateMatch = imageDate.isAfter(basicForm.startTime) && 
                   imageDate.isBefore(basicForm.endTime);
      }
      
      return nameMatch && uploaderMatch && dateMatch;
    }
    
    // 标签查询过滤
    if (searchType.value === 'tag' && selectedTags.value.length > 0) {
      return selectedTags.value.some(tag => 
        image.tags.some(imageTag => imageTag.includes(tag.split('_')[1]))
      );
    }
    
    return true;
  });

  // 更新分页总数
  pagination.total = filtered.length;
  return filtered;
});

// 生成模拟图片数据
function generateMockImages(count) {
  const mockImages = [];
  const types = ['风景', '人物', '动物', '建筑'];
  const colors = ['红色', '蓝色', '绿色', '黑白'];
  const uploaders = ['用户A', '用户B', '用户C', '用户D'];
  
  for (let i = 1; i <= count; i++) {
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    mockImages.push({
      id: i,
      name: `${randomType}${i}.jpg`,
      url: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/200`,
      uploader: uploaders[Math.floor(Math.random() * uploaders.length)],
      uploadTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD'),
      tags: [randomType, randomColor]
    });
  }
  
  return mockImages;
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};



// 切换标签
const toggleTag = (tagId) => {
  const index = selectedTags.value.indexOf(tagId);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tagId);
  }
};

// 清空标签
const clearTags = () => {
  selectedTags.value = [];
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
};

// 日期范围变化处理
const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    basicForm.startTime = dates[0];
    basicForm.endTime = dates[1];
  } else {
    basicForm.startTime = null;
    basicForm.endTime = null;
  }
};

// 重置基础查询
const resetBasicSearch = () => {
  basicForm.name = '';
  basicForm.uploader = '';
  basicForm.dateRange = [];
  basicForm.startTime = null;
  basicForm.endTime = null;
  handleSearch();
};

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.current = current;
  pagination.pageSize = pageSize;
};

// 上传处理
const handleUploadChange = (info) => {
  if (info.file.status === 'done') {
    // 上传成功处理
    message.success(`${info.file.name} 上传成功`);
    // 添加到图片列表
    imageData.value.unshift({
      id: Date.now(),
      name: info.file.name,
      url: URL.createObjectURL(info.file.originFileObj),
      uploader: '当前用户',
      uploadTime: new Date().toISOString(),
      tags: []
    });
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败`);
  }
};

// 初始化
onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
  // 初始化分页总数
  pagination.total = imageData.value.length;
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.image-list-container {
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

.search-header {
  margin-bottom: 16px;
}

.basic-search .ant-form-item {
  margin-bottom: 16px;
}

.tag-search {
  margin-top: 16px;
}

.tag-category {
  display: flex;
  margin-bottom: 12px;
}

.category-title {
  width: 80px;
  font-weight: bold;
  flex-shrink: 0;
}

.tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-search-actions {
  margin-top: 16px;
  text-align: right;
}

.action-area {
  margin-bottom: 20px;
  text-align: right;
}

.image-grid {
  flex: 1;
  margin-bottom: 20px;
}

.image-col {
  /* 基础宽度 */
  width: 20%;
  /* 响应式调整 */
  @media (max-width: 1200px) {
    width: 25%; /* 4列 */
  }
  @media (max-width: 992px) {
    width: 33.333%; /* 3列 */
  }
  @media (max-width: 768px) {
    width: 50%; /* 2列 */
  }
  @media (max-width: 576px) {
    width: 100%; /* 1列 */
  }
}

.image-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  border-radius: 8px;
  overflow: hidden;
}

.image-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.image-preview {
  width: 100%;
  object-fit: cover;
  transition: height 0.3s;
}

.image-meta {
  font-size: 12px;
  color: #666;
}

.image-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .basic-search .ant-form-item {
    width: 100%;
    margin-right: 0;
  }
  
  .category-title {
    width: 60px;
  }
}

@media (max-width: 576px) {
  .image-card {
    margin-bottom: 16px;
  }
}
</style>