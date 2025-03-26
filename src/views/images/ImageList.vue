<template>
  <div class="image-list-container">
    <!-- 查询区域 -->
    <div class="search-area">
      <div class="base-search">
        <el-input v-model="searchQuery.keyword" placeholder="请输入图片名称或描述" clearable style="width: 300px"
          @clear="handleSearch" @keyup.enter="handleSearch">
          <template #append>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>
      </div>

      <div class="tag-search">
        <el-select v-model="searchQuery.tags" multiple filterable placeholder="请选择标签" style="width: 300px"
          @change="handleSearch">
          <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-area">
      <el-button type="primary" :icon="Upload" @click="handleUpload">
        上传图片
      </el-button>
    </div>

    <!-- 图片展示区域 -->
    <div class="image-grid">
      <div v-for="(image, index) in currentPageImages" :key="index" class="image-item" @click="handleImageClick(image)">
        <el-image :src="image.url" fit="cover" class="image-content" :preview-src-list="previewImages"
          :initial-index="index" hide-on-click-modal />
        <div class="image-info">
          <span class="image-name">{{ image.name }}</span>
          <div class="image-tags">
            <el-tag v-for="tag in image.tags" :key="tag" size="small" type="info">
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页区域 -->
    <div class="pagination-area">
      <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传图片" width="30%">
      <el-upload drag action="/api/upload" multiple :before-upload="beforeUpload" :on-success="handleUploadSuccess"
        :on-error="handleUploadError">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持jpg/png格式，单张图片不超过5MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Upload, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 搜索相关
const searchQuery = ref({
  keyword: '',
  tags: []
})

const availableTags = ref(['风景', '人物', '动物', '建筑', '美食', '旅行'])

// 图片数据
const imageList = ref([
  { id: 1, name: '风景1.jpg', url: 'https://example.com/image1.jpg', tags: ['风景', '自然'] },
  { id: 2, name: '人物1.jpg', url: 'https://example.com/image2.jpg', tags: ['人物', '肖像'] },
  // 更多图片数据...
])

// 分页相关
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 上传相关
const uploadDialogVisible = ref(false)

// 计算属性
const currentPageImages = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredImages.value.slice(start, end)
})

const filteredImages = computed(() => {
  return imageList.value.filter(image => {
    const keywordMatch = image.name.toLowerCase().includes(searchQuery.value.keyword.toLowerCase())
    const tagMatch = searchQuery.value.tags.length === 0 ||
      searchQuery.value.tags.some(tag => image.tags.includes(tag))
    return keywordMatch && tagMatch
  })
})

const previewImages = computed(() => {
  return currentPageImages.value.map(img => img.url)
})

// 初始化
onMounted(() => {
  pagination.value.total = imageList.value.length
})

// 方法
const handleSearch = () => {
  pagination.value.currentPage = 1
  pagination.value.total = filteredImages.value.length
}

const handleSizeChange = (val) => {
  pagination.value.pageSize = val
}

const handleCurrentChange = (val) => {
  pagination.value.currentPage = val
}

const handleUpload = () => {
  uploadDialogVisible.value = true
}

const beforeUpload = (file) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传JPG/PNG格式的图片!')
  }
  if (!isLt5M) {
    ElMessage.error('单张图片大小不能超过5MB!')
  }

  return isImage && isLt5M
}

const handleUploadSuccess = (response, file) => {
  ElMessage.success('上传成功')
  // 这里添加新图片到imageList
  imageList.value.unshift({
    id: Date.now(),
    name: file.name,
    url: URL.createObjectURL(file.raw),
    tags: []
  })
  uploadDialogVisible.value = false
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

const handleImageClick = (image) => {
  console.log('点击图片:', image)
}

const submitUpload = () => {
  // 这里可以添加提交逻辑
  uploadDialogVisible.value = false
}
</script>

<style scoped>
.image-list-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.search-area {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.action-area {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.image-item {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.image-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.image-content {
  width: 100%;
  height: 180px;
  display: block;
}

.image-info {
  padding: 10px;
}

.image-name {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.pagination-area {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>