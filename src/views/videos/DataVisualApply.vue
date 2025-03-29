<template>
  <div class="template-apply-container">
    <a-page-header
      title="应用数据可视化模板"
      @back="() => router.push('/data-visuals')"
    />

    <a-spin :spinning="loading">
      <div class="template-content">
        <div class="template-info">
          <h2>{{ template.name }}</h2>
          <p class="description">{{ template.description }}</p>
          <div class="tags">
            <a-tag v-for="tag in getTagNames(template.tags)" :key="tag" color="blue">{{ tag }}</a-tag>
          </div>
        </div>

        <div class="config-sections">
          <div class="data-upload-section">
            <h3>数据配置</h3>
            <a-upload-dragger
              v-model:fileList="fileList"
              name="file"
              :multiple="false"
              :before-upload="beforeUpload"
              accept=".csv,.xlsx,.json"
              @change="handleUploadChange"
            >
              <p class="ant-upload-drag-icon">
                <inbox-outlined></inbox-outlined>
              </p>
              <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p class="ant-upload-hint">支持CSV、Excel或JSON格式数据文件</p>
            </a-upload-dragger>

            <!-- 数据预览 -->
            <div v-if="previewData.length > 0" class="data-preview">
              <h4>数据预览 (前5行)</h4>
              <a-table
                :columns="previewColumns"
                :dataSource="previewData"
                :pagination="false"
                size="small"
                bordered
              />
            </div>
          </div>

          <div class="media-config-section">
            <h3>媒体配置</h3>
            <div class="config-grid">
              <div class="config-item">
                <label>背景音乐</label>
                <div class="selection-area">
                  <a-button type="primary" @click="openMusicList">选择音乐</a-button>
                  <div v-if="selectedMusic" class="selected-resource">
                    <audio controls :src="selectedMusic.url" class="audio-preview"></audio>
                    <span>{{ selectedMusic.name }}</span>
                  </div>
                </div>
              </div>
          
              <div class="config-item">
                <label>背景图片</label>
                <div class="selection-area">
                  <a-button type="primary" @click="openBackgroundList">选择背景</a-button>
                  <div v-if="selectedBackground" class="selected-resource">
                    <img :src="selectedBackground.url" class="image-preview" />
                    <span>{{ selectedBackground.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 生成按钮 -->
          <div class="actions">
            <a-button @click="resetConfig">重置配置</a-button>
            <a-button
              type="primary"
              @click="handleGenerate"
              :loading="generating"
            >
              生成可视化视频
            </a-button>
          </div>
        </div>
      </div>
    </a-spin>

    <!-- 生成成功对话框 -->
    <a-modal
      v-model:visible="showSuccessModal"
      title="视频生成成功"
      centered
      :footer="null"
    >
      <div class="success-modal">
        <check-circle-outlined class="success-icon" />
        <h3>数据可视化视频已生成！</h3>
        <p>您可以在"我的视频"中查看生成结果</p>
        <div class="modal-actions">
          <a-button @click="showSuccessModal = false">继续编辑</a-button>
          <a-button type="primary" @click="goToMyVideos">查看我的视频</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  InboxOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'
import * as XLSX from 'xlsx'

const route = useRoute()
const router = useRouter()

// Add these missing reactive declarations
const loading = ref(false)
const generating = ref(false)
const showSuccessModal = ref(false)
const fileList = ref([])
const previewData = ref([])
const previewColumns = ref([])
const template = reactive({
  id: '',
  name: '',
  description: '',
  tags: []
})

// 移除visualConfig相关代码
const selectedMusic = ref(null)
const selectedBackground = ref(null)

// 添加跳转方法
// 修改openMusicList方法
const openMusicList = () => {
  router.push({
    path: '/musics',
    query: {
      selectMode: true,
      returnPath: route.path,
      templateId: route.params.id,
      // 携带当前已选择的背景图片
      background: selectedBackground.value ? JSON.stringify(selectedBackground.value) : undefined
    }
  })
}

// 修改openBackgroundList方法
const openBackgroundList = () => {
  router.push({
    path: '/backgrounds',
    query: {
      selectMode: true,
      returnPath: route.path,
      templateId: route.params.id,
      // 携带当前已选择的背景音乐
      music: selectedMusic.value ? JSON.stringify(selectedMusic.value) : undefined
    }
  })
}

// 修改onMounted中的检查逻辑
onMounted(() => {
  if (!route.params.id) {
    message.error('无效的模板ID')
    router.push('/data-visuals')
    return
  }
  
  // 检查是否有从其他页面传递的音乐选择
  if (route.query.music) {
    selectedMusic.value = JSON.parse(route.query.music)
  }
  // 检查是否有从其他页面传递的背景选择
  if (route.query.background) {
    selectedBackground.value = JSON.parse(route.query.background)
  }

  loadTemplateData()
})

const loadTemplateData = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 这里应该是API返回的数据
    const templateData = route.state?.template || {
      id: route.params.id,
      name: '商业趋势分析',
      description: '适合展示商业数据趋势变化的模板',
      tags: ['chart_1', 'size_2', 'scene_1']
    }
    
    Object.assign(template, templateData)
  } catch (error) {
    message.error('模板加载失败: ' + error.message)
    router.push('/data-visuals')
  } finally {
    loading.value = false
  }
}

// 处理文件上传
const beforeUpload = (file) => {
  const isAcceptType = ['csv', 'xlsx', 'json'].includes(file.name.split('.').pop().toLowerCase())
  if (!isAcceptType) {
    message.error('只支持CSV、Excel或JSON格式文件')
    return false
  }
  return true
}

const handleUploadChange = (info) => {
  if (info.file.status === 'done') {
    parseDataFile(info.file.originFileObj)
  }
}

// 解析数据文件
const parseDataFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      let data = null
      const fileType = file.name.split('.').pop().toLowerCase()
      
      if (fileType === 'csv') {
        data = parseCSV(e.target.result)
      } else if (fileType === 'xlsx') {
        data = parseExcel(e.target.result)
      } else if (fileType === 'json') {
        data = JSON.parse(e.target.result)
      }
      
      if (data && Array.isArray(data) && data.length > 0) {
        previewData.value = data.slice(0, 5)
        previewColumns.value = Object.keys(data[0]).map(key => ({
          title: key,
          dataIndex: key,
          key: key
        }))
        message.success('数据解析成功')
      } else {
        message.error('无法解析数据文件')
      }
    } catch (error) {
      message.error('数据解析错误: ' + error.message)
    }
  }
  
  reader.readAsBinaryString(file)
}

// 解析CSV数据
const parseCSV = (csvString) => {
  const lines = csvString.split('\n')
  const headers = lines[0].split(',')
  const result = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const obj = {}
    headers.forEach((header, j) => {
      obj[header.trim()] = values[j]?.trim() || ''
    })
    result.push(obj)
  }
  
  return result
}

// 解析Excel数据
const parseExcel = (excelData) => {
  const workbook = XLSX.read(excelData, { type: 'binary' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(firstSheet)
}

// 生成视频
const handleGenerate = () => {
  if (previewData.value.length === 0) {
    message.error('请先上传数据文件')
    return
  }

  Modal.confirm({
    title: '确认生成视频',
    content: '确定使用当前配置生成数据可视化视频吗？',
    onOk: submitVideoTask
  })
}

const submitVideoTask = () => {
  generating.value = true
  
  // 模拟API请求
  setTimeout(() => {
    generating.value = false
    showSuccessModal.value = true
  }, 1500)
}

// 重置配置
// 修改resetConfig方法
const resetConfig = () => {
  fileList.value = []
  previewData.value = []
  previewColumns.value = []
  selectedMusic.value = null
  selectedBackground.value = null
}


// 添加标签分类数据
const tagCategories = ref([
  {
    id: 1,
    name: '图表类型',
    tags: [
      { id: 'chart_1', name: '折线图' },
      { id: 'chart_2', name: '柱状图' },
      { id: 'chart_3', name: '饼图' },
      { id: 'chart_4', name: '散点图' }
    ]
  },
  {
    id: 2,
    name: '数据规模',
    tags: [
      { id: 'size_1', name: '小数据集' },
      { id: 'size_2', name: '中数据集' },
      { id: 'size_3', name: '大数据集' }
    ]
  },
  {
    id: 3,
    name: '应用场景',
    tags: [
      { id: 'scene_1', name: '商业分析' },
      { id: 'scene_2', name: '科研数据' },
      { id: 'scene_3', name: '金融趋势' }
    ]
  }
])

// 根据标签ID获取标签名称
const getTagNames = (tagIds) => {
  const names = []
  if (!tagIds) return names
  
  for (const category of tagCategories.value) {
    for (const tag of category.tags) {
      if (tagIds.includes(tag.id)) {
        names.push(tag.name)
      }
    }
  }
  return names
}

const goToMyVideos = () => {
  router.push('/my-videos')
  showSuccessModal.value = false
}
</script>

<style scoped>
.template-apply-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.template-info {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.template-info h2 {
  font-size: 24px;
  margin-bottom: 12px;
  color: #1d2129;
}

.description {
  color: #86909c;
  margin-bottom: 16px;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.data-upload-section,
.media-config-section {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.data-upload-section h3,
.media-config-section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #1d2129;
}

.data-preview {
  margin-top: 24px;
}

.data-preview h4 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #4e5969;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.config-item {
  background: #f7f8fa;
  padding: 16px;
  border-radius: 6px;
}

.config-item label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #1d2129;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
}

.success-modal {
  text-align: center;
  padding: 24px;
}

.success-icon {
  font-size: 48px;
  color: #52c41a;
  margin-bottom: 16px;
}

.success-modal h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: #1d2129;
}

.success-modal p {
  color: #86909c;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 保留原有样式 */
.selection-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selected-resource {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-top: 10px;
}

.image-preview {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.audio-preview {
  width: 100%;
  max-width: 200px;
}
</style>