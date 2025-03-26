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

    <!-- 图片列表 -->
    <div class="image-grid">
      <a-row :gutter="[16, 16]">
        <a-col :span="6" v-for="image in currentPageImages" :key="image.id">
          <a-card hoverable class="image-card">
            <template #cover>
              <img :src="image.url" class="image-preview" />
            </template>
            <a-card-meta :title="image.name">
              <template #description>
                <div class="image-meta">
                  <div>上传者: {{ image.uploader }}</div>
                  <div>上传时间: {{ image.uploadTime }}</div>
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

    <!-- 分页 -->
    <div class="pagination">
      <a-pagination
        v-model:current="pagination.current"
        v-model:pageSize="pagination.pageSize"
        :total="pagination.total"
        :pageSizeOptions="['10', '20', '50', '100']"
        show-size-changer
        show-quick-jumper
        @change="handlePageChange"
        @showSizeChange="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { UploadOutlined } from '@ant-design/icons-vue';

// 搜索类型
const searchType = ref('basic');

// 基础查询表单
const basicForm = reactive({
  name: '',
  uploader: ''
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
const imageData = ref([
  {
    id: 1,
    name: '风景1.jpg',
    url: 'https://example.com/image1.jpg',
    uploader: '用户A',
    uploadTime: '2023-05-10',
    tags: ['风景', '绿色']
  },
  // 更多图片数据...
]);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 当前页显示的图片
const currentPageImages = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredImages.value.slice(start, end);
});

// 过滤后的图片
const filteredImages = computed(() => {
  return imageData.value.filter(image => {
    // 基础查询过滤
    if (searchType.value === 'basic') {
      const nameMatch = image.name.includes(basicForm.name);
      const uploaderMatch = image.uploader.includes(basicForm.uploader);
      return nameMatch && uploaderMatch;
    }
    
    // 标签查询过滤
    if (searchType.value === 'tag' && selectedTags.value.length > 0) {
      return selectedTags.value.some(tag => 
        image.tags.some(imageTag => imageTag.includes(tag.split('_')[1]))
      );
    }
    
    return true;
  });
});

// 初始化分页总数
pagination.total = imageData.value.length;

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
  pagination.total = filteredImages.value.length;
};

// 重置基础查询
const resetBasicSearch = () => {
  basicForm.name = '';
  basicForm.uploader = '';
  handleSearch();
};

// 分页变化
const handlePageChange = (page, pageSize) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
};

// 每页数量变化
const handlePageSizeChange = (current, size) => {
  pagination.pageSize = size;
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
      uploadTime: new Date().toLocaleDateString(),
      tags: []
    });
    pagination.total = imageData.value.length;
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败`);
  }
};
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
}

.search-header {
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
}

.tags {
  flex: 1;
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

.image-card {
  border-radius: 8px;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.image-meta {
  font-size: 12px;
  color: #666;
}

.image-tags {
  margin-top: 8px;
}

.pagination {
  text-align: center;
  padding: 16px 0;
  background: #fff;
  border-radius: 4px;
}
</style>