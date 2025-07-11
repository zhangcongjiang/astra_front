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

      <!-- Main Form Section -->
      <div class="params-section">
        <div class="params-editor">
          <div class="params-header">
            <h3>自定义参数配置</h3>
          </div>
          <a-form 
            :model="formData" 
            layout="vertical"
            ref="formRef"
            @finish="onFormFinish"
          >
            <!-- Loop through top-level form fields and groups -->
            <template v-for="field in formDefinition" :key="field.name">
              
              <!-- Render a standard form item (Inlined Logic) -->
              <template v-if="field.type !== 'group'">
                 <a-form-item :label="field.label" :name="field.name" :rules="generateRules(field)">
                    <!-- Standard Inputs -->
                    <a-input v-if="field.type === 'input' && (field.inputType === 'text' || field.inputType === 'url')" v-model:value="formData[field.name]" :placeholder="field.placeholder" />
                    <a-input-number v-if="field.type === 'input' && field.inputType === 'number'" v-model:value="formData[field.name]" :placeholder="field.placeholder" style="width: 100%" />
                    <a-textarea v-if="field.type === 'textarea'" v-model:value="formData[field.name]" :rows="field.rows" :placeholder="field.placeholder" />
                    
                    <!-- Static & Remote Select -->
                    <a-select v-if="field.type === 'select' && (field.options.source === 'static' || field.options.source === 'remote')" v-model:value="formData[field.name]" :mode="field.multiple ? 'multiple' : 'default'" :placeholder="field.placeholder" :loading="field.options && field.options.loading" allow-clear>
                      <a-select-option v-for="option in (field.options && field.options.data) || []" :key="option.value" :value="option.value">{{ option.label }}</a-select-option>
                    </a-select>
                    
                    <!-- Server Select (New) -->
                    <div v-if="field.type === 'select' && field.options.source === 'server'" class="server-select-wrapper">
                        <div class="selected-display">
                            <span v-if="!formData[field.name] || (Array.isArray(formData[field.name]) && formData[field.name].length === 0)" class="placeholder">未选择</span>
                            <template v-else>
                                <a-tag v-if="!field.multiple" closable @close="clearServerSelection(field.name)">{{ formData[field.name].name }}</a-tag>
                                <a-tag v-if="field.multiple" v-for="item in formData[field.name]" :key="item.id" closable @close="removeServerSelectionItem(field.name, item.id)">{{ item.name }}</a-tag>
                            </template>
                        </div>
                        <a-button @click="openResourceModal(field)">从服务器选择</a-button>
                    </div>

                    <a-radio-group v-if="field.type === 'radio'" v-model:value="formData[field.name]">
                      <a-radio v-for="option in (field.options && field.options.data) || []" :key="option.value" :value="option.value">{{ option.label }}</a-radio>
                    </a-radio-group>
                    <a-checkbox-group v-if="field.type === 'checkbox'" v-model:value="formData[field.name]" :options="(field.options && field.options.data) || []" />
                    <a-slider v-if="field.type === 'input' && field.inputType === 'range'" v-model:value="formData[field.name]" :min="Number(field.min)" :max="Number(field.max)" :step="Number(field.step)" />
                    <input v-if="field.type === 'input' && field.inputType === 'color'" type="color" v-model="formData[field.name]" class="color-picker" />
                    <a-upload v-if="field.type === 'input' && field.inputType === 'file'" v-model:file-list="formData[field.name]" :customRequest="customUpload" :multiple="field.multiple" :accept="field.accept" list-type="picture">
                      <a-button><upload-outlined /> 点击上传</a-button>
                    </a-upload>
                    <template #extra v-if="field.description"><p class="field-description">{{ field.description }}</p></template>
                  </a-form-item>
              </template>

              <!-- Render a Group -->
              <template v-if="field.type === 'group'">
                <div class="form-group-container">
                  <h4 class="group-label">{{ field.label }}</h4>
                  <p v-if="field.description" class="group-description">{{ field.description }}</p>

                  <!-- Replicable Group -->
                  <template v-if="field.replicable">
                    <div v-for="(groupInstance, index) in formData[field.name]" :key="index" class="replicable-group-item">
                       <div class="group-item-header">
                          <h5>{{ field.label }} #{{ index + 1 }}</h5>
                          <a-button type="dashed" danger size="small" @click="removeGroupInstance(field.name, index)" v-if="formData[field.name].length > 1">
                             <template #icon><delete-outlined /></template> 删除
                          </a-button>
                       </div>
                       <!-- Inlined logic for inner fields -->
                       <template v-for="innerField in field.fields" :key="innerField.name">
                          <a-form-item :label="innerField.label" :name="[field.name, index, innerField.name]" :rules="generateRules(innerField)">
                            <a-input v-if="innerField.type === 'input' && (innerField.inputType === 'text' || innerField.inputType === 'url')" v-model:value="groupInstance[innerField.name]" :placeholder="innerField.placeholder" />
                            <a-input-number v-if="innerField.type === 'input' && innerField.inputType === 'number'" v-model:value="groupInstance[innerField.name]" :placeholder="innerField.placeholder" style="width: 100%" />
                            <a-textarea v-if="innerField.type === 'textarea'" v-model:value="groupInstance[innerField.name]" :rows="innerField.rows" :placeholder="innerField.placeholder" />
                            
                            <!-- Static & Remote Select in Group -->
                            <a-select v-if="innerField.type === 'select' && (innerField.options.source === 'static' || innerField.options.source === 'remote')" v-model:value="groupInstance[innerField.name]" :mode="innerField.multiple ? 'multiple' : 'default'" :placeholder="innerField.placeholder" :loading="innerField.options && innerField.options.loading" allow-clear>
                              <a-select-option v-for="option in (innerField.options && innerField.options.data) || []" :key="option.value" :value="option.value">{{ option.label }}</a-select-option>
                            </a-select>

                            <!-- Server Select in Group (New) -->
                            <div v-if="innerField.type === 'select' && innerField.options.source === 'server'" class="server-select-wrapper">
                                <div class="selected-display">
                                    <span v-if="!groupInstance[innerField.name] || (Array.isArray(groupInstance[innerField.name]) && groupInstance[innerField.name].length === 0)" class="placeholder">未选择</span>
                                    <template v-else>
                                        <a-tag v-if="!innerField.multiple" closable @close="clearServerSelection(groupInstance, innerField.name)">{{ groupInstance[innerField.name].name }}</a-tag>
                                        <a-tag v-if="innerField.multiple" v-for="item in groupInstance[innerField.name]" :key="item.id" closable @close="removeServerSelectionItem(groupInstance, innerField.name, item.id)">{{ item.name }}</a-tag>
                                    </template>
                                </div>
                                <a-button @click="openResourceModal(innerField, groupInstance)">从服务器选择</a-button>
                            </div>

                            <a-radio-group v-if="innerField.type === 'radio'" v-model:value="groupInstance[innerField.name]">
                              <a-radio v-for="option in (innerField.options && innerField.options.data) || []" :key="option.value" :value="option.value">{{ option.label }}</a-radio>
                            </a-radio-group>
                            <a-checkbox-group v-if="innerField.type === 'checkbox'" v-model:value="groupInstance[innerField.name]" :options="(innerField.options && innerField.options.data) || []" />
                            <a-slider v-if="innerField.type === 'input' && innerField.inputType === 'range'" v-model:value="groupInstance[innerField.name]" :min="Number(innerField.min)" :max="Number(innerField.max)" :step="Number(innerField.step)" />
                            <input v-if="innerField.type === 'input' && innerField.inputType === 'color'" type="color" v-model="groupInstance[innerField.name]" class="color-picker" />
                            <a-upload v-if="innerField.type === 'input' && innerField.inputType === 'file'" v-model:file-list="groupInstance[innerField.name]" :customRequest="customUpload" :multiple="innerField.multiple" :accept="innerField.accept" list-type="picture">
                              <a-button><upload-outlined /> 点击上传</a-button>
                            </a-upload>
                            <template #extra v-if="innerField.description"><p class="field-description">{{ innerField.description }}</p></template>
                          </a-form-item>
                       </template>
                    </div>
                    <a-button type="dashed" @click="addGroupInstance(field)" style="width: 100%; margin-top: 10px;">
                        <template #icon><plus-outlined /></template> 添加{{ field.label }}
                    </a-button>
                  </template>
                </div>
              </template>
            </template>

            <a-form-item>
                <a-button type="primary" html-type="submit" :loading="applying" class="apply-btn">
                  <template #icon><RocketOutlined /></template> 生成视频
                </a-button>
                <a-button @click="resetParams" style="margin-left: 12px;">
                  <template #icon><ReloadOutlined /></template> 重置参数
                </a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>
    </a-spin>
    
    <!-- Resource Selector Modal -->
    <ResourceSelectorModal
        v-if="modalConfig.resourceType"
        v-model:visible="modalConfig.visible"
        :resource-type="modalConfig.resourceType"
        :multiple="modalConfig.multiple"
        :selected-value="modalConfig.selectedValue"
        @select="handleResourceSelect"
    />

    <a-modal v-model:visible="showSuccessModal" title="视频生成任务已提交" :footer="null" centered >
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
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons-vue'
// Import your API functions and the new modal component
import { uploadFile, createVideoTask } from '@/api/modules/videoApi.js' 
import ResourceSelectorModal from './ResourceSelectorModal.vue';

const route = useRoute()
const router = useRouter()

// --- Main Component Logic ---
const template = reactive({ id: null, name: '加载中...', description: '', tags: [], params: { form: [] }})
const loading = ref(true)
const applying = ref(false)
const showSuccessModal = ref(false)
const formRef = ref(null)
const formData = reactive({})
const formDefinition = computed(() => template.params?.form || [])

// Modal State
const modalConfig = reactive({
    visible: false,
    resourceType: null,
    multiple: false,
    activeField: null,
    activeGroupInstance: null, // To handle selections within a group
    selectedValue: null,
});

const tagCategories = ref([
  { id: 1, name: '类型', tags: [ { id: 'type_1', name: '宣传片' }, { id: 'type_2', name: '教程' }, { id: 'type_4', name: '活动记录' } ]},
  { id: 2, name: '风格', tags: [ { id: 'style_1', name: '简约' }, { id: 'style_2', name: '科技感' }, { id: 'style_3', name: '复古' } ]}
])

const generateRules = (field) => {
  const rules = [];
  if (field.required) {
    if (field.type === 'input' && field.inputType === 'file') {
        rules.push({ required: true, type: 'array', min: 1, message: `请上传${field.label}` });
    } else if (field.type === 'select' && field.options.source === 'server') {
        const type = field.multiple ? 'array' : 'object';
        rules.push({ required: true, type: type, message: `请选择${field.label}` });
    }
    else {
        rules.push({ required: true, message: `请输入${field.label}` });
    }
  }
  if (field.validation) {
    const v = field.validation;
    rules.push({
      validator: (_, value) => {
        if (!value && !field.required) return Promise.resolve();
        if (v.minLength && value.length < v.minLength) return Promise.reject(v.errorMessage || `${field.label}长度不能小于${v.minLength}`);
        if (v.maxLength && value.length > v.maxLength) return Promise.reject(v.errorMessage || `${field.label}长度不能超过${v.maxLength}`);
        if (v.pattern && !new RegExp(v.pattern).test(value)) return Promise.reject(v.errorMessage || `${field.label}格式不正确`);
        return Promise.resolve();
      },
    });
  }
  return rules;
};


const getTagNames = (tagIds) => {
  const names = []
  if (!tagIds) return names
  for (const category of tagCategories.value) {
    for (const tag of category.tags) {
      if (tagIds.includes(tag.id)) names.push(tag.name)
    }
  }
  return names
}

onMounted(() => {
  if (!route.params.id) {
    message.error('无效的模板ID');
    router.push('/templates');
    return;
  }
  loadTemplateData();
});

const loadTemplateData = async () => {
  try {
    loading.value = true;
    let templateData = null; 
    
    // --- MOCK DATA ---
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockTemplates = [
      {
          id: 2,
          name: '动态故事相册模板',
          description: '可动态添加多个内容场景，每个场景都可以独立配置。',
          tags: ['type_4', 'style_3'],
          params: {
            "form": [
              { "name": "opening_video", "label": "片头视频", "type": "input", "inputType": "file", "description": "上传一个视频作为开场。", "defaultValue": [] },
              {
                "name": "content_scenes",
                "label": "内容场景",
                "type": "group",
                "replicable": true,
                "description": "点击下方按钮添加更多场景。",
                "fields": [
                  { "name": "image", "label": "场景图片 (服务器)", "type": "select", "required": true, "options": { "source": "server", "resourceType": "image" }, "defaultValue": null },
                  { "name": "transition", "label": "转场特效", "type": "select", "defaultValue": "dissolve", "options": { "source": "static", "data": [{ "value": "dissolve", "label": "叠化" }, { "value": "wipe", "label": "擦除" }] } },
                  { "name": "script", "label": "场景文案", "type": "textarea", "rows": 2, "placeholder": "描述这个场景...", "defaultValue": "" },
                  { "name": "audio", "label": "音频 (服务器)", "type": "select", "required": true, "options": { "source": "server", "resourceType": "audio" }, "defaultValue": null },
                ]
              },
              { "name": "background_music", "label": "背景音乐 (服务器多选)", "type": "select", "multiple": true, "options": { "source": "server", "resourceType": "audio" }, "defaultValue": [] }
            ]
          }
      },
      {"id":1,"name":"宣传片模板","tags":["type_1","style_1"],"params":{"form":[{"name":"template_id","label":"模板ID","type":"input","inputType":"text","description":"通常为隐藏字段，此处为展示目的。"},{"name":"background","label":"背景图片","type":"select","required":true,"options":{"source":"server","resourceType":"image"},"description":"从您的媒体库中选择一张背景图片。"},{"name":"bgm","label":"背景音乐","type":"select","required":true,"options":{"source":"server","resourceType":"audio"},"description":"从您的媒体库中选择一首背景音乐。"},{"name":"title","label":"视频标题","type":"input","inputType":"text","required":true,"placeholder":"请输入视频的标题"},{"name":"reader","label":"选择配音员","type":"select","required":true,"options":{"source":"remote","url":"https://api.example.com/readers","valueKey":"id","labelKey":"name"},"description":"选择一个AI配音员来朗读文案。"},{"name":"start_images","label":"开场图片","type":"select","required":true,"options":{"source":"server","resourceType":"image"}},{"name":"start_text","label":"开场文案","type":"textarea","rows":3,"required":true,"placeholder":"请输入视频的开场白。"},{"name":"content","label":"核心内容场景","type":"group","replicable":true,"description":"点击“添加场景”以创建多个视频片段。","fields":[{"name":"images","label":"场景关联图片","type":"select","multiple":true,"required":true,"options":{"source":"server","resourceType":"image"},"description":"按住Ctrl/Command可选择多张图片。"},{"name":"name","label":"场景核心人物/事件","type":"input","inputType":"text","placeholder":"例如：布朗尼·詹姆斯"},{"name":"text","label":"场景解说文案","type":"textarea","rows":3,"required":true,"placeholder":"请输入该场景的解说词。"}]}]}}
    ];
    templateData = mockTemplates.find(t => t.id === parseInt(route.params.id));
    if (!templateData) throw new Error('模板不存在');
    
    Object.assign(template, { id: route.params.id, ...templateData });
    await initializeForm();
  } catch (error) {
    message.error('模板加载失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

const getGroupDefault = (groupField) => {
    const defaultInstance = {};
    for (const innerField of groupField.fields) {
        defaultInstance[innerField.name] = innerField.defaultValue ?? (innerField.multiple ? [] : null);
    }
    return defaultInstance;
};

const initializeForm = async () => {
  for (const field of formDefinition.value) {
    if (field.type === 'group') {
      if (field.replicable) {
        formData[field.name] = [getGroupDefault(field)];
      } else {
        formData[field.name] = getGroupDefault(field);
      }
    } else {
      formData[field.name] = field.defaultValue ?? (field.multiple ? [] : null);
    }
  }
};

const addGroupInstance = (groupField) => {
    formData[groupField.name].push(getGroupDefault(groupField));
};

const removeGroupInstance = (groupName, index) => {
    if (formData[groupName].length > 1) {
        formData[groupName].splice(index, 1);
    } else {
        message.warning('至少需要保留一个场景。');
    }
};

const resetParams = () => {
  formRef.value.clearValidate();
  initializeForm();
  message.success('参数已重置');
};

const customUpload = async ({ file, onSuccess, onError }) => {
    const data = new FormData();
    data.append('file', file);
    try {
        const response = await uploadFile(data); 
        file.url = response.url; 
        onSuccess(response, file);
        message.success(`${file.name} 上传成功`);
    } catch (error) {
        message.error(`${file.name} 上传失败`);
        onError(error);
    }
};

// --- New Modal Handling Logic ---
const openResourceModal = (field, groupInstance = null) => {
    modalConfig.visible = true;
    modalConfig.resourceType = field.options.resourceType;
    modalConfig.multiple = field.multiple || false;
    modalConfig.activeField = field.name;
    modalConfig.activeGroupInstance = groupInstance; // Store the group instance if any
    
    if (groupInstance) {
        modalConfig.selectedValue = groupInstance[field.name];
    } else {
        modalConfig.selectedValue = formData[field.name];
    }
};

const handleResourceSelect = (selection) => {
    // Filter out null or invalid entries before assignment
    const cleanedSelection = Array.isArray(selection)
        ? selection.filter(item => item && typeof item === 'object' && item.id)
        : (selection && typeof selection === 'object' && selection.id ? selection : null);

    if (modalConfig.activeGroupInstance) {
        // Update a field within a group
        modalConfig.activeGroupInstance[modalConfig.activeField] = cleanedSelection;
    } else if (modalConfig.activeField) {
        // Update a top-level field
        formData[modalConfig.activeField] = cleanedSelection;
    }

    // Reset config
    modalConfig.activeField = null;
    modalConfig.activeGroupInstance = null;
};

const clearServerSelection = (context, fieldName) => {
    if (fieldName) { // In a group
        context[fieldName] = null;
    } else { // Top level
        formData[context] = null;
    }
};

const removeServerSelectionItem = (context, fieldName, itemId) => {
    const isGroup = typeof context === 'object' && context !== null;
    const currentSelection = isGroup ? context[fieldName] : formData[fieldName];
    
    if (Array.isArray(currentSelection)) {
        const newSelection = currentSelection.filter(item => item.id !== itemId);
        if (isGroup) {
            context[fieldName] = newSelection;
        } else {
            formData[fieldName] = newSelection;
        }
    }
};

const buildFinalParams = (rawFormData) => {
    const finalParams = {};
    const formDef = formDefinition.value;

    const processValue = (fieldDefinition, value) => {
        if (!fieldDefinition || value === null || value === undefined) return value;

        // Handle file uploads
        if (fieldDefinition.type === 'input' && fieldDefinition.inputType === 'file') {
            const fileList = value || [];
            const urls = fileList.filter(f => f.status === 'done' && f.url).map(f => f.url);
            return fieldDefinition.multiple ? urls : (urls[0] || null);
        }

        // Handle server selections
        if (fieldDefinition.type === 'select' && fieldDefinition.options.source === 'server') {
            if (fieldDefinition.multiple) {
                return Array.isArray(value) ? value.map(item => item.id) : []; // Send back IDs
            }
            return value ? value.id : null; // Send back ID
        }

        return value;
    };

    for (const key in rawFormData) {
        const fieldDef = formDef.find(f => f.name === key);
        if (!fieldDef) continue;

        if (fieldDef.type === 'group' && fieldDef.replicable) {
            finalParams[key] = rawFormData[key].map(groupInstance => {
                const processedInstance = {};
                for (const innerKey in groupInstance) {
                    const innerFieldDef = fieldDef.fields.find(f => f.name === innerKey);
                    processedInstance[innerKey] = processValue(innerFieldDef, groupInstance[innerKey]);
                }
                return processedInstance;
            });
        } else {
            finalParams[key] = processValue(fieldDef, rawFormData[key]);
        }
    }
    return finalParams;
}

const onFormFinish = (values) => {
  const finalParams = buildFinalParams(formData);

  Modal.confirm({
    title: '确认生成视频',
    content: '您确定要使用当前配置生成视频吗？',
    async onOk() {
      try {
        applying.value = true;
        await createVideoTask(finalParams); 
        showSuccessModal.value = true;
        message.success('任务已提交，您可以在“我的视频”中查看进度。');
        goToMyVideos();
      } catch (error) {
        message.error('任务提交失败，请稍后重试。');
      } finally {
        applying.value = false;
      }
    },
  });
};

const goToMyVideos = () => {
  router.push('/my-videos');
  showSuccessModal.value = false;
};

</script>


<style>
/* Basic styles for clarity */
.template-apply-container { max-width: 800px; margin: 0 auto; padding: 24px; }
.template-info { margin-bottom: 24px; }
.template-info .description { color: #888; }
.params-section { background-color: #fdfdfd; border: 1px solid #e8e8e8; border-radius: 8px; }
.params-editor { padding: 24px; }
.params-header { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.params-header h3 { font-size: 16px; font-weight: 500; }
.field-description { color: #aaa; font-size: 12px; margin-top: 4px; line-height: 1.2; }
.apply-btn { margin-right: 12px; }
.color-picker { width: 100%; height: 32px; border: 1px solid #d9d9d9; border-radius: 2px; cursor: pointer; }

/* Group styles */
.form-group-container {
  border: 1px solid #f0f0f0;
  padding: 16px;
  border-radius: 6px;
  margin-top: 20px;
  background-color: #fafafa;
}
.group-label {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
}
.group-description {
  color: #888;
  font-size: 13px;
  margin-bottom: 16px;
}
.replicable-group-item {
  border: 1px dashed #d9d9d9;
  padding: 16px;
  margin-top: 16px;
  border-radius: 4px;
  position: relative;
}
.group-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}
.group-item-header h5 {
  margin: 0;
  font-size: 14px;
}

.server-select-wrapper {
    display: flex;
    align-items: center;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    padding: 0 4px 0 11px;
    transition: all 0.3s;
    background-color: white;
}
.server-select-wrapper:hover {
    border-color: #40a9ff;
}
.selected-display {
    flex-grow: 1;
    min-height: 30px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
}
.selected-display .placeholder {
    color: #bfbfbf;
}
/* Modal styles */
.success-modal { text-align: center; }
.success-icon { font-size: 48px; color: #52c41a; margin-bottom: 16px; }
.success-modal .actions { margin-top: 24px; }
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