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

      <!-- Form Section -->
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
                    <a-input 
                      v-if="field.type === 'input' && (field.inputType === 'text' || field.inputType === 'url')" 
                      v-model:value="formData[field.name]" 
                      :placeholder="field.placeholder"
                      @dragover.prevent="handleTextDragOver"
                      @dragleave.prevent="handleTextDragLeave"
                      @drop.prevent="handleTextDrop($event, field.name)"
                      :class="{ 'text-drop-active': isTextDragOver }"
                    />
                    <a-input-number v-if="field.type === 'input' && field.inputType === 'number'" v-model:value="formData[field.name]" :placeholder="field.placeholder" style="width: 100%" />
                    <a-textarea 
                      v-if="field.type === 'textarea'" 
                      v-model:value="formData[field.name]" 
                      :rows="field.rows" 
                      :placeholder="field.placeholder"
                      @dragover.prevent="handleTextDragOver"
                      @dragleave.prevent="handleTextDragLeave"
                      @drop.prevent="handleTextDrop($event, field.name)"
                      :class="{ 'text-drop-active': isTextDragOver }"
                    />
                    
                    <!-- Static & Remote Select -->
                    <a-select v-if="field.type === 'select' && (field.options.source === 'static' || field.options.source === 'remote')" v-model:value="formData[field.name]" :mode="field.multiple ? 'multiple' : 'default'" :placeholder="field.placeholder" :loading="field.options && field.options.loading" allow-clear>
                      <a-select-option v-for="option in (field.options && field.options.data) || []" :key="option.value" :value="option.value">{{ option.label }}</a-select-option>
                    </a-select>
                    
                    <!-- Server Select (New) - 改为拖放区域 -->
                    <div v-if="field.type === 'select' && field.options.source === 'server'" class="server-select-wrapper">
                        <div 
                          class="drop-zone"
                          :class="{ 
                            'drop-zone-active': isDragOver && canAcceptDrop(field.options.resourceType),
                            'drop-zone-disabled': isDragOver && !canAcceptDrop(field.options.resourceType),
                            'has-content': formData[field.name] && (Array.isArray(formData[field.name]) ? formData[field.name].length > 0 : true)
                          }"
                          @dragover.prevent="handleDragOver($event, field.options.resourceType)"
                          @dragleave.prevent="handleDragLeave"
                          @drop.prevent="handleDrop($event, field.name)"
                        >
                          <div class="drop-zone-content">
                            <div v-if="!formData[field.name] || (Array.isArray(formData[field.name]) && formData[field.name].length === 0)" class="drop-placeholder">
                              <CloudUploadOutlined :style="{ fontSize: '24px', color: '#ccc' }" />
                              <p>拖拽{{ getResourceTypeLabel(field.options.resourceType) }}到此处</p>
                            </div>
                            <div v-else class="selected-items">
                              <a-tag v-if="!field.multiple" closable @close="clearServerSelection(field.name)">
                                {{ formData[field.name].name }}
                              </a-tag>
                              <a-tag 
                                v-if="field.multiple" 
                                v-for="item in formData[field.name]" 
                                :key="item.id" 
                                closable 
                                @close="removeServerSelectionItem(field.name, item.id)"
                              >
                                {{ item.name }}
                              </a-tag>
                            </div>
                          </div>
                        </div>
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
                            <a-input 
                              v-if="innerField.type === 'input' && (innerField.inputType === 'text' || innerField.inputType === 'url')" 
                              v-model:value="groupInstance[innerField.name]" 
                              :placeholder="innerField.placeholder"
                              @dragover.prevent="handleTextDragOver"
                              @dragleave.prevent="handleTextDragLeave"
                              @drop.prevent="handleTextDropInGroup($event, groupInstance, innerField.name)"
                              :class="{ 'text-drop-active': isTextDragOver }"
                            />
                            <a-input-number v-if="innerField.type === 'input' && innerField.inputType === 'number'" v-model:value="groupInstance[innerField.name]" :placeholder="innerField.placeholder" style="width: 100%" />
                            <a-textarea 
                              v-if="innerField.type === 'textarea'" 
                              v-model:value="groupInstance[innerField.name]" 
                              :rows="innerField.rows" 
                              :placeholder="innerField.placeholder"
                              @dragover.prevent="handleTextDragOver"
                              @dragleave.prevent="handleTextDragLeave"
                              @drop.prevent="handleTextDropInGroup($event, groupInstance, innerField.name)"
                              :class="{ 'text-drop-active': isTextDragOver }"
                            />
                            
                            <!-- Static & Remote Select in Group -->
                            <a-select v-if="innerField.type === 'select' && (innerField.options.source === 'static' || innerField.options.source === 'remote')" v-model:value="groupInstance[innerField.name]" :mode="innerField.multiple ? 'multiple' : 'default'" :placeholder="innerField.placeholder" :loading="innerField.options && innerField.options.loading" allow-clear>
                              <a-select-option v-for="option in (innerField.options && innerField.options.data) || []" :key="option.value" :value="option.value">{{ option.label }}</a-select-option>
                            </a-select>

                            <!-- Server Select in Group (New) - 改为拖放区域 -->
                            <div v-if="innerField.type === 'select' && innerField.options.source === 'server'" class="server-select-wrapper">
                                <div 
                                  class="drop-zone"
                                  :class="{ 
                                    'drop-zone-active': isDragOver && canAcceptDrop(innerField.options.resourceType),
                                    'drop-zone-disabled': isDragOver && !canAcceptDrop(innerField.options.resourceType),
                                    'has-content': groupInstance[innerField.name] && (Array.isArray(groupInstance[innerField.name]) ? groupInstance[innerField.name].length > 0 : true)
                                  }"
                                  @dragover.prevent="handleDragOver($event, innerField.options.resourceType)"
                                  @dragleave.prevent="handleDragLeave"
                                  @drop.prevent="handleDropInGroup($event, groupInstance, innerField.name)"
                                >
                                  <div class="drop-zone-content">
                                    <div v-if="!groupInstance[innerField.name] || (Array.isArray(groupInstance[innerField.name]) && groupInstance[innerField.name].length === 0)" class="drop-placeholder">
                                      <CloudUploadOutlined :style="{ fontSize: '24px', color: '#ccc' }" />
                                      <p>拖拽{{ getResourceTypeLabel(innerField.options.resourceType) }}到此处</p>
                                    </div>
                                    <div v-else class="selected-items">
                                      <a-tag v-if="!innerField.multiple" closable @close="clearServerSelection(groupInstance, innerField.name)">
                                        {{ groupInstance[innerField.name].name }}
                                      </a-tag>
                                      <a-tag 
                                        v-if="innerField.multiple" 
                                        v-for="item in groupInstance[innerField.name]" 
                                        :key="item.id" 
                                        closable 
                                        @close="removeServerSelectionItem(groupInstance, innerField.name, item.id)"
                                      >
                                        {{ item.name }}
                                      </a-tag>
                                    </div>
                                  </div>
                                </div>
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

                  <!-- Non-replicable Group -->
                  <template v-else>
                    <!-- Inlined logic for inner fields -->
                    <template v-for="innerField in field.fields" :key="innerField.name">
                       <a-form-item :label="innerField.label" :name="[field.name, innerField.name]" :rules="generateRules(innerField)">
                         <a-input 
                           v-if="innerField.type === 'input' && (innerField.inputType === 'text' || innerField.inputType === 'url')" 
                           v-model:value="formData[field.name][innerField.name]" 
                           :placeholder="innerField.placeholder"
                           @dragover.prevent="handleTextDragOver"
                           @dragleave.prevent="handleTextDragLeave"
                           @drop.prevent="handleTextDropInGroup($event, formData[field.name], innerField.name)"
                           :class="{ 'text-drop-active': isTextDragOver }"
                         />
                         <a-input-number v-if="innerField.type === 'input' && innerField.inputType === 'number'" v-model:value="formData[field.name][innerField.name]" :placeholder="innerField.placeholder" style="width: 100%" />
                         <a-textarea 
                           v-if="innerField.type === 'textarea'" 
                           v-model:value="formData[field.name][innerField.name]" 
                           :rows="innerField.rows" 
                           :placeholder="innerField.placeholder"
                           @dragover.prevent="handleTextDragOver"
                           @dragleave.prevent="handleTextDragLeave"
                           @drop.prevent="handleTextDropInGroup($event, formData[field.name], innerField.name)"
                           :class="{ 'text-drop-active': isTextDragOver }"
                         />
                         
                         <!-- Static & Remote Select in Non-replicable Group -->
                         <a-select v-if="innerField.type === 'select' && (innerField.options.source === 'static' || innerField.options.source === 'remote')" v-model:value="formData[field.name][innerField.name]" :mode="innerField.multiple ? 'multiple' : 'default'" :placeholder="innerField.placeholder" :loading="innerField.options && innerField.options.loading" allow-clear>
                           <a-select-option v-for="option in (innerField.options && innerField.options.data) || []" :key="option.value" :value="option.value">{{ option.label }}</a-select-option>
                         </a-select>

                         <!-- Server Select in Non-replicable Group -->
                         <div v-if="innerField.type === 'select' && innerField.options.source === 'server'" class="server-select-wrapper">
                             <div 
                               class="drop-zone"
                               :class="{ 
                                 'drop-zone-active': isDragOver && canAcceptDrop(innerField.options.resourceType),
                                 'drop-zone-disabled': isDragOver && !canAcceptDrop(innerField.options.resourceType),
                                 'has-content': formData[field.name][innerField.name] && (Array.isArray(formData[field.name][innerField.name]) ? formData[field.name][innerField.name].length > 0 : true)
                               }"
                               @dragover.prevent="handleDragOver($event, innerField.options.resourceType)"
                               @dragleave.prevent="handleDragLeave"
                               @drop.prevent="handleDropInGroup($event, formData[field.name], innerField.name)"
                             >
                               <div class="drop-zone-content">
                                 <div v-if="!formData[field.name][innerField.name] || (Array.isArray(formData[field.name][innerField.name]) && formData[field.name][innerField.name].length === 0)" class="drop-placeholder">
                                   <CloudUploadOutlined :style="{ fontSize: '24px', color: '#ccc' }" />
                                   <p>拖拽{{ getResourceTypeLabel(innerField.options.resourceType) }}到此处</p>
                                 </div>
                                 <div v-else class="selected-items">
                                   <a-tag v-if="!innerField.multiple" closable @close="clearServerSelection(formData[field.name], innerField.name)">
                                     {{ formData[field.name][innerField.name].name }}
                                   </a-tag>
                                   <a-tag 
                                     v-if="innerField.multiple" 
                                     v-for="item in formData[field.name][innerField.name]" 
                                     :key="item.id" 
                                     closable 
                                     @close="removeServerSelectionItem(formData[field.name], innerField.name, item.id)"
                                   >
                                     {{ item.name }}
                                   </a-tag>
                                 </div>
                               </div>
                             </div>
                         </div>

                         <a-radio-group v-if="innerField.type === 'radio'" v-model:value="formData[field.name][innerField.name]">
                           <a-radio v-for="option in (innerField.options && innerField.options.data) || []" :key="option.value" :value="option.value">{{ option.label }}</a-radio>
                         </a-radio-group>
                         <a-checkbox-group v-if="innerField.type === 'checkbox'" v-model:value="formData[field.name][innerField.name]" :options="(innerField.options && innerField.options.data) || []" />
                         <a-slider v-if="innerField.type === 'input' && innerField.inputType === 'range'" v-model:value="formData[field.name][innerField.name]" :min="Number(innerField.min)" :max="Number(innerField.max)" :step="Number(innerField.step)" />
                         <input v-if="innerField.type === 'input' && innerField.inputType === 'color'" type="color" v-model="formData[field.name][innerField.name]" class="color-picker" />
                         <a-upload v-if="innerField.type === 'input' && innerField.inputType === 'file'" v-model:file-list="formData[field.name][innerField.name]" :customRequest="customUpload" :multiple="innerField.multiple" :accept="innerField.accept" list-type="picture">
                           <a-button><upload-outlined /> 点击上传</a-button>
                         </a-upload>
                         <template #extra v-if="innerField.description"><p class="field-description">{{ innerField.description }}</p></template>
                       </a-form-item>
                    </template>
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

      <!-- Resource Selector - 浮动显示 -->
      <ResourceSelectorModal
        :draggable="true"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
      />
    </a-spin>

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
  PlusOutlined,
  CloudUploadOutlined
} from '@ant-design/icons-vue'
// Import your API functions and the new modal component
import { uploadFile, createVideoTask, fetchRemoteData } from '@/api/modules/videoApi.js' 
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

// 拖放相关状态
const isDragOver = ref(false)
const currentDragType = ref(null)
const draggedItem = ref(null)
const isTextDragOver = ref(false)

// Modal State - 保留但不再使用
const modalConfig = reactive({
    visible: false,
    resourceType: null,
    multiple: false,
    activeField: null,
    activeGroupInstance: null,
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
  loadTemplateData();
});

// 从 history.state 加载模板数据
const loadTemplateData = async () => {
    loading.value = true;
    try {
        const passedTemplateStr = history.state.template;
        if (!passedTemplateStr) {
            throw new Error('未找到模板数据，请返回列表页重新选择。');
        }
        
        const passedTemplate = JSON.parse(passedTemplateStr);
        const routeId = route.params.id;

        // 校验传递过来的模板ID和URL中的ID是否一致
        if (!passedTemplate || String(passedTemplate.id) !== routeId) {
            throw new Error('无效的模板数据，请从列表页重新选择模板。');
        }
        
        Object.assign(template, passedTemplate);
        await initializeForm();
    } catch (error) {
        message.error(error.message || '加载模板数据失败');
        router.push('/templates');
    } finally {
        loading.value = false;
    }
};

const getGroupDefault = (groupField) => {
    const defaultInstance = {};
    for (const innerField of groupField.fields) {
        defaultInstance[innerField.name] = innerField.defaultValue ?? (innerField.multiple ? [] : null);
    }
    return defaultInstance;
};

const initializeForm = async () => {
  // Clear previous form data to ensure a clean state
  Object.keys(formData).forEach(key => delete formData[key]);

  // Set template_id for submission
  formData.template_id = template.id;

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

    // Handle remote select data loading
    if (field.type === 'select' && field.options.source === 'remote') {
      field.options.loading = true;
      try {
        const response = await fetchRemoteData(field.options.url);
        field.options.data = response.data.map(item => ({ value: item.id, label: item.name }));
      } catch (error) {
        message.error(`Failed to load options for ${field.label}`);
      } finally {
        field.options.loading = false;
      }
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

    // Directly assign template_id first
    if (rawFormData.template_id) {
        finalParams.template_id = rawFormData.template_id;
    }

    for (const key in rawFormData) {
        // Skip template_id as it's already handled
        if (key === 'template_id') continue;

        const fieldDef = formDef.find(f => f.name === key);
        
        // If there's no field definition, it's not a form field we need to process.
        if (!fieldDef) {
            continue;
        }

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

// 拖放相关方法
const getResourceTypeLabel = (resourceType) => {
  const labels = {
    'image': '图片',
    'video': '视频', 
    'audio': '音频',
    'text': '文本'
  };
  return labels[resourceType] || '素材';
};

const handleDragStart = (item) => {
  draggedItem.value = item;
  // 处理多选情况：如果是数组，取第一个元素的类型作为当前拖拽类型
  if (Array.isArray(item)) {
    currentDragType.value = item.length > 0 ? item[0].type : null;
  } else {
    currentDragType.value = item.type;
  }
};

const handleDragEnd = () => {
  draggedItem.value = null;
  currentDragType.value = null;
  isDragOver.value = false;
};

const handleDragOver = (event, targetResourceType) => {
  event.preventDefault();
  isDragOver.value = true;
  
  // 检查是否可以接受当前拖拽的素材类型
  if (currentDragType.value && currentDragType.value !== targetResourceType) {
    event.dataTransfer.dropEffect = 'none';
  } else {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const canAcceptDrop = (targetResourceType) => {
  return currentDragType.value === targetResourceType;
};

const handleDrop = (event, fieldName) => {
  event.preventDefault();
  isDragOver.value = false;
  
  if (!draggedItem.value) return;
  
  // 获取字段定义
  const fieldDef = formDefinition.value.find(f => f.name === fieldName);
  if (!fieldDef) return;
  
  // 处理多选素材拖拽
  const itemsToAdd = Array.isArray(draggedItem.value) ? draggedItem.value : [draggedItem.value];
  
  // 检查所有素材的类型是否匹配
  const invalidItems = itemsToAdd.filter(item => item.type !== fieldDef.options.resourceType);
  if (invalidItems.length > 0) {
    message.warning(`只能拖拽${getResourceTypeLabel(fieldDef.options.resourceType)}类型的素材到此处`);
    return;
  }
  
  // 处理拖放
  if (fieldDef.multiple) {
    // 多选模式：添加所有素材
    const currentValue = formData[fieldName] || [];
    const newItems = [];
    let duplicateCount = 0;
    
    itemsToAdd.forEach(item => {
      const exists = currentValue.some(existingItem => existingItem.id === item.id);
      if (!exists) {
        newItems.push(item);
      } else {
        duplicateCount++;
      }
    });
    
    if (newItems.length > 0) {
      formData[fieldName] = [...currentValue, ...newItems];
      if (newItems.length === 1) {
        message.success(`已添加${newItems[0].name}`);
      } else {
        message.success(`已添加${newItems.length}个素材`);
      }
    }
    
    if (duplicateCount > 0) {
      message.warning(`${duplicateCount}个素材已存在，已跳过`);
    }
  } else {
    // 单选模式：只能添加一个素材
    if (itemsToAdd.length > 1) {
      message.warning('该字段只能选择一个素材');
      return;
    }
    formData[fieldName] = itemsToAdd[0];
    message.success(`已选择${itemsToAdd[0].name}`);
  }
};

const handleDropInGroup = (event, groupInstance, fieldName) => {
  event.preventDefault();
  isDragOver.value = false;
  
  if (!draggedItem.value) return;
  
  // 获取字段定义
  const groupField = formDefinition.value.find(f => f.type === 'group');
  if (!groupField) return;
  
  const fieldDef = groupField.fields.find(f => f.name === fieldName);
  if (!fieldDef) return;
  
  // 处理多选素材拖拽
  const itemsToAdd = Array.isArray(draggedItem.value) ? draggedItem.value : [draggedItem.value];
  
  // 检查所有素材的类型是否匹配
  const invalidItems = itemsToAdd.filter(item => item.type !== fieldDef.options.resourceType);
  if (invalidItems.length > 0) {
    message.warning(`只能拖拽${getResourceTypeLabel(fieldDef.options.resourceType)}类型的素材到此处`);
    return;
  }
  
  // 处理拖放
  if (fieldDef.multiple) {
    // 多选模式：添加所有素材
    const currentValue = groupInstance[fieldName] || [];
    const newItems = [];
    let duplicateCount = 0;
    
    itemsToAdd.forEach(item => {
      const exists = currentValue.some(existingItem => existingItem.id === item.id);
      if (!exists) {
        newItems.push(item);
      } else {
        duplicateCount++;
      }
    });
    
    if (newItems.length > 0) {
      groupInstance[fieldName] = [...currentValue, ...newItems];
      if (newItems.length === 1) {
        message.success(`已添加${newItems[0].name}`);
      } else {
        message.success(`已添加${newItems.length}个素材`);
      }
    }
    
    if (duplicateCount > 0) {
      message.warning(`${duplicateCount}个素材已存在，已跳过`);
    }
  } else {
    // 单选模式：只能添加一个素材
    if (itemsToAdd.length > 1) {
      message.warning('该字段只能选择一个素材');
      return;
    }
    groupInstance[fieldName] = itemsToAdd[0];
    message.success(`已选择${itemsToAdd[0].name}`);
  }
};

// 处理文本拖拽
const handleTextDragOver = (event) => {
  // 只有当拖拽的是文本类素材时才允许
  if (currentDragType.value === 'text') {
    isTextDragOver.value = true
  }
}

const handleTextDragLeave = (event) => {
  isTextDragOver.value = false
}

const handleTextDrop = (event, fieldName) => {
      isTextDragOver.value = false
      
      if (!draggedItem.value) {
        return
      }

      // 检查是否为文本类素材
      const items = Array.isArray(draggedItem.value) ? draggedItem.value : [draggedItem.value]
      const textItems = items.filter(item => item.type === 'text')
      
      if (textItems.length === 0) {
        message.warning('只能拖拽文本类素材到此处')
        return
      }

      // 提取所有文本内容并用换行符拼接
       const textContents = textItems
         .map(item => {
           // 对于文本类型，优先使用 resource_detail.text
           const content = item.resource_detail?.text || item.content || item.text || item.name || ''
           return typeof content === 'string' ? content : String(content)
         })
         .filter(content => content.trim())
      
      if (textContents.length === 0) {
        message.warning('文本素材内容为空')
        return
      }
      
      // 用换行符拼接多个文本
      const combinedText = textContents.join('\n')
      
      // 填充到表单字段
      formData[fieldName] = combinedText
      
      const count = textContents.length
      message.success(`已填充 ${count} 个文本素材到字段`)
    }

const handleTextDropInGroup = (event, groupInstance, fieldName) => {
      isTextDragOver.value = false
      
      if (!draggedItem.value) {
        return
      }

      // 检查是否为文本类素材
      const items = Array.isArray(draggedItem.value) ? draggedItem.value : [draggedItem.value]
      const textItems = items.filter(item => item.type === 'text')
      
      if (textItems.length === 0) {
        message.warning('只能拖拽文本类素材到此处')
        return
      }

      // 提取所有文本内容并用换行符拼接
       const textContents = textItems
         .map(item => {
           // 对于文本类型，优先使用 resource_detail.text
           const content = item.resource_detail?.text || item.content || item.text || item.name || ''
           return typeof content === 'string' ? content : String(content)
         })
         .filter(content => content.trim())
      
      if (textContents.length === 0) {
        message.warning('文本素材内容为空')
        return
      }
      
      // 用换行符拼接多个文本
      const combinedText = textContents.join('\n')
      
      // 填充到组内字段
      groupInstance[fieldName] = combinedText
      
      const count = textContents.length
      message.success(`已填充 ${count} 个文本素材到字段`)
    }

</script>


<style>
/* Basic styles for clarity */
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

/* 拖放相关样式 */
.drop-zone {
  min-height: 60px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.drop-zone:hover {
  border-color: #40a9ff;
  background-color: #f0f8ff;
}

.drop-zone.drag-over {
  border-color: #1890ff;
  background-color: #e6f7ff;
  border-style: solid;
}

.drop-zone.disabled {
  border-color: #f0f0f0;
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.drop-zone.disabled:hover {
  border-color: #f0f0f0;
  background-color: #f5f5f5;
}

.drop-placeholder {
  color: #8c8c8c;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.drop-placeholder .anticon {
  font-size: 18px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
}

.selected-tag .remove-btn {
  cursor: pointer;
  color: #999;
  font-size: 12px;
}

.selected-tag .remove-btn:hover {
  color: #ff4d4f;
}
</style>



<style scoped>
.template-apply-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-right: 200px;
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

.text-drop-active {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
  background-color: #f6ffed !important;
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