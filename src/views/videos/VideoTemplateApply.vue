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

      <!-- 改造开始: 使用a-form动态生成表单 -->
      <div class="params-section">
        <div class="params-editor">
          <div class="params-header">
            <h3>自定义参数配置</h3>
          </div>
          <a-form 
            :model="formData" 
            layout="vertical"
            ref="formRef"
            @finish="handleApply"
          >
            <template v-for="field in formDefinition" :key="field.name">
              <a-form-item
                :label="field.label"
                :name="field.name"
                :rules="generateRules(field)"
              >
                <!-- Input type: text, url, number -->
                <a-input
                  v-if="field.type === 'input' && (field.inputType === 'text' || field.inputType === 'url')"
                  v-model:value="formData[field.name]"
                  :placeholder="field.placeholder"
                />
                <a-input-number
                  v-if="field.type === 'input' && field.inputType === 'number'"
                  v-model:value="formData[field.name]"
                  :placeholder="field.placeholder"
                  style="width: 100%"
                />

                <!-- Textarea -->
                <a-textarea
                  v-if="field.type === 'textarea'"
                  v-model:value="formData[field.name]"
                  :rows="field.rows"
                  :placeholder="field.placeholder"
                />

                <!-- Select -->
                <a-select
                  v-if="field.type === 'select'"
                  v-model:value="formData[field.name]"
                  :mode="field.multiple ? 'multiple' : 'default'"
                  :placeholder="field.placeholder"
                  :loading="field.options && field.options.loading"
                  allow-clear
                >
                  <a-select-option
                    v-for="option in (field.options && field.options.data) || []"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </a-select-option>
                </a-select>

                <!-- Radio Group -->
                <a-radio-group
                  v-if="field.type === 'radio'"
                  v-model:value="formData[field.name]"
                >
                  <a-radio
                    v-for="option in (field.options && field.options.data) || []"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </a-radio>
                </a-radio-group>
                
                <!-- Checkbox Group -->
                <a-checkbox-group
                   v-if="field.type === 'checkbox'"
                   v-model:value="formData[field.name]"
                   :options="(field.options && field.options.data) || []"
                />

                <!-- Input type: range (Slider) -->
                <a-slider
                  v-if="field.type === 'input' && field.inputType === 'range'"
                  v-model:value="formData[field.name]"
                  :min="Number(field.min)"
                  :max="Number(field.max)"
                  :step="Number(field.step)"
                />

                <!-- Input type: color -->
                <input
                  v-if="field.type === 'input' && field.inputType === 'color'"
                  type="color"
                  v-model="formData[field.name]"
                  class="color-picker"
                />

                <!-- Input type: file -->
                <a-upload
                  v-if="field.type === 'input' && field.inputType === 'file'"
                  v-model:file-list="formData[field.name]"
                  :before-upload="() => false"
                  :multiple="field.multiple"
                  :accept="field.accept"
                  list-type="picture"
                >
                  <a-button>
                    <upload-outlined></upload-outlined>
                    点击上传
                  </a-button>
                </a-upload>

                <!-- Field Description -->
                <template #extra v-if="field.description">
                  <p class="field-description">{{ field.description }}</p>
                </template>
              </a-form-item>
            </template>

            <a-form-item>
                <a-button 
                  type="primary" 
                  html-type="submit"
                  :loading="applying"
                  class="apply-btn"
                >
                  <template #icon><RocketOutlined /></template>
                  生成视频
                </a-button>
                <a-button @click="resetParams" style="margin-left: 12px;">
                  <template #icon><ReloadOutlined /></template>
                  重置参数
                </a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>
      <!-- 改造结束 -->
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
  ReloadOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

// Template data
const template = reactive({
  id: null,
  name: '加载中...',
  description: '',
  tags: [],
  params: { form: [] }, // Default to an empty form structure
  videoUrl: ''
})

// Form state
const loading = ref(true)
const applying = ref(false)
const showSuccessModal = ref(false)
const formRef = ref(null); // Reference to the form component
const formData = reactive({}) // Holds the data for the v-models
const formDefinition = computed(() => template.params?.form || [])

// Tag classification data
const tagCategories = ref([
  {
    id: 1, name: '类型',
    tags: [ { id: 'type_1', name: '宣传片' }, { id: 'type_2', name: '教程' }, { id: 'type_3', name: '产品展示' } ]
  },
  {
    id: 2, name: '风格',
    tags: [ { id: 'style_1', name: '简约' }, { id: 'style_2', name: '科技感' }, { id: 'style_3', name: '复古' } ]
  }
])

// Get tag names from IDs
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

onMounted(() => {
  if (!route.params.id) {
    message.error('无效的模板ID')
    router.push('/templates')
    return
  }
  loadTemplateData()
})

const loadTemplateData = async () => {
  try {
    loading.value = true
    
    // Simulate fetching template data
    let templateData = route.state?.template || JSON.parse(sessionStorage.getItem(`template-${route.params.id}`))
    
    const sourceRecord = route.state?.sourceRecord;
    
    if (!templateData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      // Use the comprehensive mock data
      const mockTemplates = [
        {
            id: 1,
            name: '产品宣传模板',
            description: '适用于产品推广的高质量宣传视频模板',
            videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            params: JSON.parse(
              `{
                "form": [
                  { "name": "video_title", "label": "视频标题", "type": "input", "inputType": "text", "required": true, "placeholder": "请输入吸引人的标题", "description": "标题将作为视频的封面和文件名。", "validation": { "minLength": 5, "maxLength": 40, "errorMessage": "标题长度必须在5到40个字符之间。" }, "defaultValue": "" },
                  { "name": "video_script", "label": "视频文案", "type": "textarea", "required": true, "rows": 10, "placeholder": "请在这里输入视频的讲述文案或脚本...", "description": "文案内容将用于生成字幕和AI语音。", "defaultValue": "" },
                  { "name": "narrator_voice", "label": "讲述人声音", "type": "select", "required": true, "defaultValue": "female_1", "description": "选择一个AI声音来朗读您的文案。", "options": { "source": "static", "data": [{ "value": "female_1", "label": "温柔女声" }, { "value": "male_1", "label": "磁性男声" }, { "value": "child_1", "label": "天真童声" }] } },
                  { "name": "bg_music", "label": "背景音乐(多选)", "type": "select", "required": false, "multiple": true, "description": "按住 Ctrl/Command 并单击可选择多首音乐。", "options": { "source": "remote", "url": "https://mock.api.com/music/list", "valueKey": "musicId", "labelKey": "musicName" }, "defaultValue": [] },
                  { "name": "aspect_ratio", "label": "视频比例", "type": "radio", "required": true, "defaultValue": "9:16", "options": { "source": "static", "data": [{ "value": "16:9", "label": "16:9 (横屏)" }, { "value": "9:16", "label": "9:16 (竖屏)" }, { "value": "1:1", "label": "1:1 (方形)" }] } },
                  { "name": "subtitle_style", "label": "字幕风格", "type": "checkbox", "defaultValue": ["highlight"], "options": { "source": "static", "data": [{ "value": "highlight", "label": "重点词高亮" }, { "value": "karaoke", "label": "卡拉OK效果" }, { "value": "glow", "label": "描边发光" }] } },
                  { "name": "image_files", "label": "图片素材", "type": "input", "inputType": "file", "multiple": true, "accept": "image/jpeg, image/png, image/webp", "description": "上传图片作为视频的插图或背景。", "defaultValue": [] },
                  { "name": "image_duration", "label": "图片播放速度(秒/张)", "type": "input", "inputType": "range", "min": "2", "max": "10", "step": "0.5", "defaultValue": 4, "description": "控制每张图片在视频中停留的时间。" },
                  { "name": "watermark_position", "label": "水印位置", "type": "select", "defaultValue": "bottom_right", "options": { "source": "static", "data": [{ "value": "top_left", "label": "左上角" }, { "value": "top_right", "label": "右上角" }, { "value": "bottom_left", "label": "左下角" }, { "value": "bottom_right", "label": "右下角" }] } },
                  { "name": "theme_color", "label": "主题颜色", "type": "input", "inputType": "color", "defaultValue": "#ffffff", "description": "选择一个颜色用于标题或元素高亮。" }
                ]
              }`
            ),
            tags: ['type_1', 'style_2']
        },
        {
            id: 2,
            name: '故事相册模板',
            description: '一个简单的模板，用于将图片制作成带转场和音效的故事短片。',
            videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            params: {
              "form": [
                { "name": "video_title", "label": "相册标题", "type": "input", "inputType": "text", "required": true, "defaultValue": "我的美好回忆" },
                { "name": "image_files", "label": "上传图片", "type": "input", "inputType": "file", "multiple": true, "required": true, "accept": "image/*", "description": "请至少上传3张图片。", "defaultValue": [] },
                { "name": "image_animation", "label": "图片入场动画", "type": "select", "defaultValue": "fade_in", "options": { "source": "static", "data": [ { "value": "fade_in", "label": "淡入" }, { "value": "fly_in_left", "label": "从左飞入" }, { "value": "zoom_in", "label": "放大进入" } ] } },
                { "name": "scene_description", "label": "场景描述（分段）", "type": "textarea", "rows": 5, "defaultValue": "", "placeholder": "每一行代表一个场景的描述，将对应一张图片。", "description": "请确保行数和图片数量一致。" },
                { "name": "transition_effect", "label": "转场特效", "type": "select", "defaultValue": "dissolve", "options": { "source": "static", "data": [ { "value": "cut", "label": "硬切" }, { "value": "dissolve", "label": "叠化" }, { "value": "wipe_right", "label": "向右擦除" } ] } },
                { "name": "sound_effects", "label": "特效音（可多选）", "type": "select", "multiple": true, "defaultValue": [], "options": { "source": "static", "data": [ { "value": "shutter", "label": "相机快门声" }, { "value": "whoosh", "label": "风声/嗖" }, { "value": "ding", "label": "叮" } ] } }
              ]
            },
            tags: ['type_4', 'style_3']
        }
      ]
      templateData = mockTemplates.find(t => t.id === parseInt(route.params.id))
      if (!templateData) throw new Error('模板不存在')
    }
    
    sessionStorage.setItem(`template-${route.params.id}`, JSON.stringify(templateData))
    
    Object.assign(template, { id: route.params.id, ...templateData })
    
    // Initialize form data and handle external data injection
    await initializeForm(sourceRecord)

  } catch (error) {
    message.error('模板加载失败: ' + error.message)
    router.push('/templates')
  } finally {
    loading.value = false
  }
}

// Initialize form values from definition and handle remote options
const initializeForm = async (sourceRecord = null) => {
  for (const field of formDefinition.value) {
    // Set default value
    formData[field.name] = field.defaultValue ?? null

    // Override with source record data if available
    if (sourceRecord) {
        if (field.name === 'video_title' && sourceRecord.name) {
            formData.video_title = sourceRecord.name;
        }
        if (field.name === 'video_script' && sourceRecord.text) {
            formData.video_script = sourceRecord.text;
        }
    }

    // Handle remote options for select
    if (field.type === 'select' && field.options?.source === 'remote') {
      field.options.loading = true
      try {
        // Mock API call for remote options
        console.log(`Fetching options from: ${field.options.url}`)
        await new Promise(resolve => setTimeout(resolve, 500))
        const remoteData = [
            { musicId: 'm1', musicName: '轻松的旋律' },
            { musicId: 'm2', musicName: '激昂的节奏' },
            { musicId: 'm3', musicName: '宁静的午后' }
        ];
        field.options.data = remoteData.map(item => ({
          value: item[field.options.valueKey],
          label: item[field.options.labelKey]
        }))

      } catch (e) {
        message.error(`加载 ${field.label} 选项失败`)
        field.options.data = []
      } finally {
        field.options.loading = false
      }
    }
  }
}

// Generate validation rules for a-form-item
const generateRules = (field) => {
  const rules = []
  if (field.required) {
    rules.push({ required: true, message: `请输入${field.label}` })
  }
  if (field.validation) {
    const v = field.validation
    rules.push({
      validator: (_, value) => {
        if (!value) return Promise.resolve() // Pass if not required and empty
        if (v.minLength && value.length < v.minLength) {
          return Promise.reject(v.errorMessage || `${field.label}长度不能小于${v.minLength}`)
        }
        if (v.maxLength && value.length > v.maxLength) {
          return Promise.reject(v.errorMessage || `${field.label}长度不能超过${v.maxLength}`)
        }
        if (v.pattern && !new RegExp(v.pattern).test(value)) {
            return Promise.reject(v.errorMessage || `${field.label}格式不正确`)
        }
        return Promise.resolve()
      }
    })
  }
  return rules
}

// Reset form to default values
const resetParams = () => {
  formRef.value.clearValidate();
  initializeForm();
  message.success('参数已重置');
}

// Handle form submission
const handleApply = (values) => {
  console.log('Form Submitted. Values:', values)
  // The 'values' object already contains all form data.
  // For file uploads, the value will be an array of file objects.
  
  Modal.confirm({
    title: '确认生成视频',
    content: '确定使用当前参数生成视频吗？',
    onOk: () => submitVideoTask(values),
  })
}

const submitVideoTask = (finalParams) => {
  applying.value = true
  console.log('Submitting task with params:', finalParams)

  // Here you would typically construct a FormData object if you have files
  // and send it to your API.

  // Simulate API request
  setTimeout(() => {
    applying.value = false
    showSuccessModal.value = true
  }, 1500)
}

const goToMyVideos = () => {
  router.push('/my-videos')
  showSuccessModal.value = false
}

</script>

<style>
/* Add some basic styling to make it look good */
.template-apply-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
.template-info {
  margin-bottom: 24px;
}
.template-info .description {
  color: #888;
}
.template-info .tags {
  margin-top: 8px;
}
.params-section {
  background-color: #fdfdfd;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}
.params-editor {
  padding: 24px;
}
.params-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.params-header h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}
.field-description {
  color: #aaa;
  font-size: 12px;
  margin-top: 4px;
}
.apply-btn {
  margin-right: 12px;
}
.color-picker {
  width: 100%;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
}
.success-modal {
  text-align: center;
}
.success-icon {
  font-size: 48px;
  color: #52c41a;
  margin-bottom: 16px;
}
.success-modal h3 {
  font-size: 20px;
}
.success-modal p {
  color: #888;
}
.success-modal .actions {
  margin-top: 24px;
}
</style>


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