<template>
  <div class="template-apply-container">
    <a-page-header
      title="应用视频模板"
      @back="() => router.push('/templates')"
    />

    <a-spin :spinning="loading">
      <div class="template-info">
        <h2>{{ template.name }}</h2>
        <p class="description">{{ template.description }}</p>
        <div class="tags">
          <a-tag v-for="tag in getTagNames(template.tags)" :key="tag" color="blue">{{ tag }}</a-tag>
        </div>
      </div>

      <div class="params-section">
        <div class="params-display">
          <div class="params-header">
            <h3>模板默认参数</h3>
            <div class="header-placeholder"></div>
          </div>
          <div class="json-display">
            <pre>{{ formattedDefaultParams }}</pre>
          </div>
        </div>

        <div class="params-editor">
          <div class="params-header">
            <h3>自定义参数配置</h3>
            <div class="editor-toolbar">
              <a-button @click="formatJson" size="small">
                <template #icon><HighlightOutlined /></template>
                格式化
              </a-button>
              <a-button @click="resetParams" size="small">
                <template #icon><ReloadOutlined /></template>
                重置
              </a-button>
              <a-button 
                type="primary" 
                @click="handleApply"
                :loading="applying"
                size="small"
                class="apply-btn"
              >
                <template #icon><RocketOutlined /></template>
                生成视频
              </a-button>
            </div>
          </div>

          <div class="json-editor">
            <textarea
              ref="editor"
              v-model="jsonString"
              @input="validateJson"
              placeholder="在此编辑您的自定义参数..."
            ></textarea>
            <div v-if="jsonError" class="error-tip">
              <ExclamationCircleOutlined />
              {{ jsonError }}
            </div>
          </div>
        </div>
      </div>
    </a-spin>

    <a-modal
      v-model:visible="showSuccessModal"
      title="视频生成任务已提交"
      :footer="null"
      centered
    >
      <div class="success-modal">
        <CheckCircleOutlined class="success-icon" />
        <h3>任务创建成功！</h3>
        <p>请前往 <a @click="goToMyVideos">我的视频</a> 查看进度</p>
        <div class="actions">
          <a-button type="primary" @click="goToMyVideos">立即查看</a-button>
          <a-button @click="showSuccessModal = false">关闭</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  HighlightOutlined,
  ReloadOutlined,
  RocketOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

// 模板数据
const template = reactive({
  id: null,
  name: '加载中...',
  description: '',
  tags: [],
  params: {},
  videoUrl: ''
})

// 加载状态
const loading = ref(true)

// JSON编辑状态
const jsonString = ref('')
const jsonError = ref('')
const applying = ref(false)
const showSuccessModal = ref(false)
const editor = ref(null)

// 标签分类数据（与列表页保持一致）
const tagCategories = ref([
  {
    id: 1,
    name: '类型',
    tags: [
      { id: 'type_1', name: '宣传片' },
      { id: 'type_2', name: '教程' },
      { id: 'type_3', name: '产品展示' },
      { id: 'type_4', name: '活动记录' }
    ]
  },
  {
    id: 2,
    name: '风格',
    tags: [
      { id: 'style_1', name: '简约' },
      { id: 'style_2', name: '科技感' },
      { id: 'style_3', name: '复古' },
      { id: 'style_4', name: '卡通' }
    ]
  }
])

// 计算格式化后的默认参数
const formattedDefaultParams = computed(() => {
  return JSON.stringify(template.params, null, 2)
})

// 根据标签ID获取标签名称
const getTagNames = (tagIds) => {
  const names = []
  if (!tagIds) return names
  
  // 在标签分类中查找标签名称
  for (const category of tagCategories.value) {
    for (const tag of category.tags) {
      if (tagIds.includes(tag.id)) {
        names.push(tag.name)
      }
    }
  }
  return names
}

// 初始化加载数据
onMounted(() => {
  if (!route.params.templateId) {
    message.error('无效的模板ID')
    router.push('/templates')
    return
  }

  loadTemplateData()
})

const loadTemplateData = async () => {
  try {
    loading.value = true
    
    // 尝试从多个来源获取模板数据
    let templateData = route.state?.template 
                    || JSON.parse(sessionStorage.getItem(`template-${route.params.templateId}`))
    
    // 获取来源文案数据
    const sourceRecord = route.state?.sourceRecord;
    if (sourceRecord) {
      // 这里可以根据需要将文案数据填充到模板参数中
      templateData.params.text = sourceRecord.text;
      templateData.params.title = sourceRecord.name;
    }

    // 如果都没有，可以尝试从API获取（示例）
    if (!templateData) {
      // 这里可以替换为实际的API请求
      // const response = await api.getTemplate(route.params.id)
      // templateData = response.data
      
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockTemplates = [
        {
          id: 1,
          name: '产品宣传模板',
          description: '适用于产品推广的高质量宣传视频模板',
          videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          params: {
            title: "产品名称",
            subtitle: "产品标语",
            images: ["image1.jpg", "image2.jpg"],
            duration: 30,
            style: "modern"
          },
          tags: ['type_1', 'style_2']
        },
        {
          id: 2,
          name: '教程视频模板',
          description: '适合制作步骤教学视频的模板',
          videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
          params: {
            steps: ["第一步", "第二步", "第三步"],
            narrator: true,
            backgroundMusic: "tutorial_music.mp3"
          },
          tags: ['type_2', 'style_1']
        }
      ]
      templateData = mockTemplates.find(t => t.id === parseInt(route.params.templateId))
      
      if (!templateData) throw new Error('模板不存在')
    }

    // 保存到sessionStorage防止刷新丢失
    sessionStorage.setItem(`template-${route.params.templateId}`, JSON.stringify(templateData))
    
    // 填充数据
    Object.assign(template, {
      id: route.params.id,
      ...templateData
    })
    
    jsonString.value = JSON.stringify(template.params, null, 2)
    adjustEditorHeight()
    
  } catch (error) {
    message.error('模板加载失败: ' + error.message)
    router.push('/templates')
  } finally {
    loading.value = false
  }
}

// JSON操作
const validateJson = () => {
  try {
    JSON.parse(jsonString.value)
    jsonError.value = ''
    return true
  } catch (e) {
    jsonError.value = e.message
    return false
  }
}

const formatJson = () => {
  if (!validateJson()) {
    message.error('请先修正JSON错误')
    return
  }
  
  try {
    const obj = JSON.parse(jsonString.value)
    jsonString.value = JSON.stringify(obj, null, 2)
    adjustEditorHeight()
  } catch (e) {
    jsonError.value = e.message
  }
}

const resetParams = () => {
  jsonString.value = JSON.stringify(template.params, null, 2)
  jsonError.value = ''
  adjustEditorHeight()
}

// 应用模板
const handleApply = () => {
  if (!validateJson()) {
    message.error('请修正JSON格式错误')
    return
  }

  Modal.confirm({
    title: '确认生成视频',
    content: '确定使用当前参数生成视频吗？',
    onOk: submitVideoTask
  })
}

const submitVideoTask = () => {
  applying.value = true
  
  // 模拟API请求
  setTimeout(() => {
    applying.value = false
    showSuccessModal.value = true
  }, 1500)
}

// 辅助功能
const adjustEditorHeight = () => {
  if (editor.value) {
    editor.value.style.height = 'auto'
    editor.value.style.height = `${editor.value.scrollHeight}px`
  }
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
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.template-info h2 {
  margin-bottom: 8px;
}

.description {
  color: #666;
  margin-bottom: 12px;
}

.tags {
  margin-top: 8px;
}

.params-section {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.params-display, .params-editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.params-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  min-height: 32px;
}

.header-placeholder {
  width: 200px; /* 与按钮组宽度匹配 */
}

.json-display, .json-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.json-display pre, .json-editor textarea {
  flex: 1;
  min-height: 400px;
  padding: 12px;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  resize: none;
  width: 100%;
}

.json-display {
  background: #f5f5f5;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
}

.editor-toolbar {
  display: flex;
  gap: 8px;
}

.error-tip {
  color: #ff4d4f;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.success-modal {
  text-align: center;
  padding: 16px;
}

.success-icon {
  font-size: 48px;
  color: #52c41a;
  margin-bottom: 16px;
}

.actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .params-section {
    flex-direction: column;
  }
  
  .params-display, .params-editor {
    width: 100%;
  }

  .params-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-placeholder {
    display: none;
  }

  .editor-toolbar {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>