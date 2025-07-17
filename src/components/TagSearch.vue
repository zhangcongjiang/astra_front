<template>
  <div class="tag-search-container">
    <!-- 管理模式切换和操作区域 -->
    <div class="management-header">
      <!-- 退出管理按钮（只在管理模式下显示） -->
      <a-button 
        v-if="showManagement"
        type="link" 
        @click="toggleManagementMode"
        class="exit-management-btn"
      >
        <span class="btn-text">退出管理</span>
      </a-button>
      
      <!-- 标签管理按钮（只在非管理模式下显示） -->
      <a-button 
        v-else
        type="link" 
        @click="toggleManagementMode"
        class="enter-management-btn"
      >
        <span class="btn-text">标签管理</span>
      </a-button>
      
      <!-- 管理操作按钮（只在管理模式下显示） -->
      <div class="management-actions" v-if="showManagement">
        <a-button type="primary" @click="showAddModal" class="action-btn">
          <span class="btn-text">添加标签</span>
        </a-button>
      </div>
    </div>

    <!-- 标签展示区域 -->
    <div v-if="tags && tags.length">
      <div class="box box1">
        <div class="level-label">一级标签：</div>
        <div class="tags-container" @mouseleave="resetHoverPreview">
          <template v-for="category in tags" :key="category.id">
            <a-checkable-tag 
              :checked="allowImageTagging ? isTagSelected(category.id) : selectedFirstLevelTags.includes(category.id)"
              :class="{ 
                'has-child': category.tags && category.tags.length,
                'management-tag': showManagement,
                'image-tag-selected': allowImageTagging && isTagSelected(category.id)
              }"
              @change="checked => handleFirstLevelChange(category, checked)"
              @mouseenter="hoverFirstLevelTag(category)"
            >
              {{ category.name }}
              <span class="tag-count" v-if="category.tags?.length">({{ category.tags.length }})</span>
              <a-button 
                v-if="showManagement" 
                type="link" 
                size="small" 
                class="edit-btn"
                @click.stop="handleEditTag(category)"
              >
                <EditOutlined />
              </a-button>
              <a-popconfirm
                v-if="showManagement"
                title="确认要删除此标签吗？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="() => handleDeleteTag(category.id)"
              >
                <a-button 
                  type="link" 
                  size="small" 
                  class="delete-btn"
                  @click.stop
                >
                  <DeleteOutlined />
                </a-button>
              </a-popconfirm>
            </a-checkable-tag>
          </template>
        </div>
      </div>
      <a-divider style="margin: 12px 0" dashed />
      <div class="box box2">
        <div class="level-label">二级标签：</div>
        <div class="tags-container">
          <template v-for="tag in visibleSecondLevelTags" :key="tag.id">
            <a-checkable-tag 
              :checked="isTagSelected(tag.id)"
              :class="{
                'management-tag': showManagement,
                'image-tag-selected': isTagSelected(tag.id)
              }"
              @change="checked => handleSecondLevelChange(tag.id, checked)"
            >
              {{ tag.name }}
              <a-button 
                v-if="showManagement" 
                type="link" 
                size="small" 
                class="edit-btn"
                @click.stop="handleEditTag(tag)"
              >
                <EditOutlined />
              </a-button>
              <a-popconfirm
                v-if="showManagement"
                title="确认要删除此标签吗？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="() => handleDeleteTag(tag.id)"
              >
                <a-button 
                  type="link" 
                  size="small" 
                  class="delete-btn"
                  @click.stop
                >
                  <DeleteOutlined />
                </a-button>
              </a-popconfirm>
            </a-checkable-tag>
          </template>
        </div>
      </div>
    </div>
    <div v-else class="null-tags">暂无标签，请添加标签！</div>

    <!-- 查询操作区域 -->
    <div class="tag-search-actions" v-if="showActions && !allowImageTagging">
      <a-button type="primary" @click="handleSearch">查询</a-button>
      <a-button @click="clearTags">清空</a-button>
    </div>

    <!-- 添加/编辑标签模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="currentTag ? '编辑标签' : '添加标签'"
      width="600px"
      :maskClosable="false"
      @ok="handleModalOk"
      @cancel="resetModal"
    >
      <a-form
        :model="tagForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="tagFormRef"
        :rules="formRules"
      >
        <a-form-item label="标签名称" name="name">
          <a-input v-model:value="tagForm.name" placeholder="请输入标签名称" />
        </a-form-item>
        <a-form-item label="标签类型" name="type" v-if="!currentTag || !currentTag.parentId">
          <a-radio-group v-model:value="tagForm.type" button-style="solid">
            <a-radio value="main">一级标签</a-radio>
            <a-radio value="sub">二级标签</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item 
          label="父级标签" 
          name="parentId"
          v-if="tagForm.type === 'sub' && (!currentTag || !currentTag.parentId)"
        >
          <a-select
            v-model:value="tagForm.parentId"
            placeholder="请选择父级标签"
            :options="parentTagOptions"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { addTag } from '@/api/modules/tagApi';

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  showActions: {
    type: Boolean,
    default: true
  },
  tagType: {
    type: String,
    default: '1'
  },
  imageTags: {
    type: Array,
    default: () => []
  },
  allowImageTagging: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    required: true
  }
});

const emit = defineEmits([
  'search', 
  'update:selectedTags', 
  'update:tags',
  'add-image-tag',
  'remove-image-tag'
]);

// 标签相关状态
const selectedFirstLevelTags = ref([]);
const selectedTags = ref([]);
const hoverSecondLevelTags = ref([]);
const showHoverPreview = ref(false);
const allSecondLevelTags = ref([]);
const showManagement = ref(false);

// 模态框相关状态
const modalVisible = ref(false);
const currentTag = ref(null);
const tagForm = ref({
  name: '',
  type: 'main',
  parentId: null
});
const tagFormRef = ref(null);

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { max: 20, message: '标签名称不能超过20个字符', trigger: 'blur' }
  ],
  parentId: [
    { required: true, message: '请选择父级标签', trigger: 'change' }
  ]
};

// 计算属性
// 修改标签展示逻辑
const visibleSecondLevelTags = computed(() => {
// 处理后端返回的树形结构
if (showHoverPreview.value && selectedFirstLevelTags.value.length === 0) {
return hoverSecondLevelTags.value;
}

if (selectedFirstLevelTags.value.length > 0) {
const tags = [];
props.tags.forEach(category => {
if (selectedFirstLevelTags.value.includes(category.id)) {
// 处理一级标签的子标签
if (category.children?.length) {
tags.push(...category.children);
}
}
});
return tags;
}

// 扁平化所有二级标签
const allTags = [];
props.tags.forEach(category => {
if (category.children?.length) {
allTags.push(...category.children);
}
});
return allTags;
});

// 修改初始化方法
const initSecondLevelTags = () => {
let arr = [];
props.tags.forEach(category => {
if (category.children?.length) {
arr = [...arr, ...category.children];
}
});
allSecondLevelTags.value = arr;

if (props.allowImageTagging) {
selectedTags.value = [...props.imageTags];
}
};

const parentTagOptions = computed(() => {
  return props.tags.map(tag => ({
    value: tag.id,
    label: tag.name
  }));
});

const isTagSelected = (tagId) => {
  if (props.allowImageTagging) {
    return props.imageTags.includes(tagId);
  }
  return selectedTags.value.includes(tagId);
};

// 方法
const toggleManagementMode = () => {
  showManagement.value = !showManagement.value;
};

const getSelectedSecondLevelTags = () => {
  const tags = [];
  props.tags.forEach(category => {
    if (selectedFirstLevelTags.value.includes(category.id)) {
      tags.push(...(category.tags || []));
    }
  });
  return tags;
};

const hoverFirstLevelTag = (category) => {
  if (category.tags?.length) {
    hoverSecondLevelTags.value = category.tags;
    showHoverPreview.value = true;
  }
};

const resetHoverPreview = () => {
  showHoverPreview.value = false;
};

const handleFirstLevelChange = (category, checked) => {
  if (checked) {
    selectedFirstLevelTags.value.push(category.id);
    // 将一级标签 ID 添加到 selectedTags
    if (!selectedTags.value.includes(category.id)) {
      selectedTags.value.push(category.id);
    }
    
    // 在图片标签模式下触发 add-image-tag 事件
    if (props.allowImageTagging) {
      console.log('一级标签选中，触发 add-image-tag 事件:', category.id);
      emit('add-image-tag', category.id);
    }
  } else {
    const index = selectedFirstLevelTags.value.indexOf(category.id);
    if (index > -1) {
      selectedFirstLevelTags.value.splice(index, 1);
    }
    // 从 selectedTags 中移除一级标签 ID
    const tagIndex = selectedTags.value.indexOf(category.id);
    if (tagIndex > -1) {
      selectedTags.value.splice(tagIndex, 1);
    }
    if (category.tags) {
      selectedTags.value = selectedTags.value.filter(
        tagId => !category.tags.some(tag => tag.id === tagId)
      );
    }
    
    // 在图片标签模式下触发 remove-image-tag 事件
    if (props.allowImageTagging) {
      console.log('一级标签取消选中，触发 remove-image-tag 事件:', category.id);
      emit('remove-image-tag', category.id);
    }
  }
  emit('update:selectedTags', selectedTags.value); // 更新选中的标签
  resetHoverPreview();
  emit('search'); // 选择一级标签时自动触发查询
};

const handleSecondLevelChange = (tagId, checked) => {
  console.log('handleSecondLevelChange 被调用:', tagId, checked, 'allowImageTagging:', props.allowImageTagging);
  if (props.allowImageTagging) {
    // 图片标签模式
    if (checked) {
      console.log('准备触发 add-image-tag 事件:', tagId);
      emit('add-image-tag', tagId);
    } else {
      console.log('准备触发 remove-image-tag 事件:', tagId);
      emit('remove-image-tag', tagId);
    }
  } else {
    // 普通查询模式
    if (checked) {
      selectedTags.value.push(tagId);
    } else {
      const index = selectedTags.value.indexOf(tagId);
      if (index > -1) {
        selectedTags.value.splice(index, 1);
      }
    }
    emit('update:selectedTags', selectedTags.value);
    emit('search'); // 点击标签时自动触发查询
  }
};

const clearTags = () => {
  selectedFirstLevelTags.value = [];
  selectedTags.value = [];
  resetHoverPreview();
  emit('update:selectedTags', selectedTags.value);
  emit('search');
};

const handleSearch = () => {
  resetHoverPreview();
  emit('search');
};


// 标签管理相关方法
const showAddModal = (parentId = null) => {
  currentTag.value = null;
  tagForm.value = {
    name: '',
    type: parentId ? 'sub' : 'main',
    parentId: parentId || null
  };
  modalVisible.value = true;
  nextTick(() => {
    tagFormRef.value?.clearValidate();
  });
};

const handleEditTag = (tag) => {
  currentTag.value = tag;
  tagForm.value = {
    name: tag.name,
    type: tag.parentId ? 'sub' : 'main',
    parentId: tag.parentId || null
  };
  modalVisible.value = true;
};

const resetModal = () => {
  modalVisible.value = false;
  currentTag.value = null;
  tagFormRef.value?.resetFields();
};

const handleModalOk = async () => {
  try {
    await tagFormRef.value.validate();
    console.log('category:', props.category);
    const tagData = {
      tag_name: tagForm.value.name,
      parent: tagForm.value.type === 'main' ? '' : tagForm.value.parentId || '',
      category: props.category // 使用从 ImageList 传递过来的 category
    };
    
    if (currentTag.value) {
      // 更新标签逻辑
      tagData.id = currentTag.value.id;
      // await api.updateTag(tagData);
      message.success('标签更新成功');
    } else {
      // 创建标签逻辑
      await handleAddTag(tagData); // 调用添加标签方法
    }
    
    // 刷新标签列表
    emit('update:tags');
    resetModal();
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

const handleDeleteTag = async (tagId) => {
  try {
    // await api.deleteTag(tagId);
    message.success('标签删除成功');
    emit('update:tags');
  } catch (error) {
    message.error('标签删除失败');
    console.error(error);
  }
};

const handleAddTag = async (tagData) => {
  try {
    const response = await addTag(tagData);
    if (response.code === 0) {
      message.success('标签添加成功');
      emit('update:tags'); // 触发标签列表更新
    } else {
      message.error(response.message || '标签添加失败');
    }
  } catch (error) {
    console.error('标签添加失败:', error);
    message.error('标签添加失败');
  }
};

// 监听tags变化
watch(() => props.tags, () => {
  initSecondLevelTags();
}, { immediate: true });

// 监听图片标签变化
watch(() => props.imageTags, (newVal) => {
  if (props.allowImageTagging) {
    selectedTags.value = [...newVal];
  }
});
</script>

<style scoped>
.tag-search-container {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.enter-management-btn,
.exit-management-btn {
  padding: 0;
  height: auto;
  color: #1890ff;
}

.exit-management-btn {
  color: #ff4d4f;
}

.management-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.action-btn {
  white-space: nowrap;
}

.btn-text {
  display: inline-block;
  padding: 0 4px;
}

.box {
  display: flex;
  gap: 16px;
}

.level-label {
  font-weight: bold;
  white-space: nowrap;
  width: 100px;
  flex-shrink: 0;
  padding-top: 4px;
  margin-right: 6px;
}

.tags-container {
  flex: 1;
  max-height: 102px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.box2 {
  margin-bottom: 10px;
}

.null-tags {
  text-align: center;
  height: 48px;
  color: rgba(204, 204, 204, 0.8);
  line-height: 48px;
}

.tag-search-actions {
  margin-top: 20px;
  text-align: right;
}

.tag-count {
  font-size: 12px;
  color: #888;
  margin-left: 4px;
}

.edit-btn {
  margin-left: 4px;
  color: #888;
  padding: 0;
  height: auto;
}

.delete-btn {
  margin-left: 2px;
  color: #ff4d4f;
  padding: 0;
  height: auto;
}

.edit-btn:hover {
  color: #1890ff;
}

.delete-btn:hover {
  color: #ff7875;
}

/* 可选中标签样式 */
:deep(.ant-tag-checkable) {
  height: 32px;
  line-height: 30px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 14px;
  padding: 0 12px;
  position: relative;
  overflow: hidden;
  margin: 2px 0;
  color: rgba(0, 0, 0, 0.85);
  background: transparent;
  transition: none;
  display: inline-flex;
  align-items: center;
}

/* 管理模式下标签样式 */
:deep(.management-tag) {
  cursor: pointer;
  padding-right: 8px;
}

/* 图片标签选中状态 */
:deep(.image-tag-selected) {
  background-color: #f6ffed;
  border-color: #b7eb8f;
}

/* 选中状态样式 */
:deep(.ant-tag-checkable-checked) {
  border: 1px solid #55a722 !important;
  background: transparent !important;
  color: rgba(0, 0, 0, 0.85) !important;
}

:deep(.ant-tag-checkable-checked:hover) {
  border: 1px solid #55a722 !important;
}

:deep(.ant-tag-checkable-checked::before) {
  display: block;
  content: '';
  width: 20px;
  height: 6px;
  background-color: #55a722;
  position: absolute;
  bottom: 0px;
  right: -7px;
  transform: rotate(-45deg);
}

/* 悬停状态 */
:deep(.ant-tag-checkable:hover) {
  border-color: #d9d9d9 !important;
}

/* 有子标签的一级标签样式 */
:deep(.ant-tag-checkable.has-child) {
  border: 1px solid #e8e8e8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .management-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
  
  .box {
    flex-direction: column;
    gap: 8px;
  }
  
  .level-label {
    width: auto;
    margin-bottom: 8px;
  }
}
</style>