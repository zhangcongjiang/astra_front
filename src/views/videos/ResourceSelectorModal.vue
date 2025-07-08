<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="80%"
    :destroy-on-close="true"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="loading">
      <div class="search-bar">
        <a-form layout="inline" :model="searchParams">
          <a-form-item v-for="field in searchFields" :key="field.name" :label="field.label">
            <a-input v-if="field.type === 'text'" v-model:value="searchParams[field.name]" :placeholder="field.label" />
            <a-select v-if="field.type === 'select'" v-model:value="searchParams[field.name]" style="width: 120px;">
              <a-select-option v-for="option in field.data" :key="option.value" :value="option.value">
                {{ option.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="fetchResources">搜索</a-button>
            <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </div>
      <div class="resource-container">
        <a-list
          :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
          :data-source="resources"
          class="resource-list"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-card 
                hoverable 
                class="resource-card"
                :class="{ 'selected': isSelected(item) }"
                @click="toggleSelection(item)"
              >
                <!-- Video/Image Preview -->
                <template #cover v-if="currentResourceType.type !== 'audio'">
                  <div class="preview-cover">
                    <img :alt="item.name" :src="getResourceUrl(item)" />
                    <div class="overlay">
                      <a-button type="primary" size="small" @click.stop="previewResource(item)">预览</a-button>
                    </div>
                  </div>
                </template>

                <!-- Audio Preview -->
                <div v-if="currentResourceType.type === 'audio'" class="audio-preview">
                   <sound-outlined />
                   <a-button type="link" @click.stop="previewResource(item)">播放</a-button>
                </div>

                <a-card-meta :title="item.name">
                  <template #description>
                    <p class="resource-desc">ID: {{ item.id }}</p>
                  </template>
                </a-card-meta>
              </a-card>
            </a-list-item>
          </template>
        </a-list>
      </div>
      <Pagination 
        :current="pagination.current" 
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @change="onPaginationChange"
        class="pagination-footer"
      />
    </a-spin>
  </a-modal>

  <!-- Inner preview modal -->
  <a-modal :visible="previewVisible" :title="previewItem?.name" :footer="null" @cancel="previewVisible = false" :z-index="1001">
    <img v-if="currentResourceType.type === 'image' && previewItem" :src="getResourceUrl(previewItem)" style="width: 100%" />
    <video v-if="currentResourceType.type === 'video' && previewItem" :src="getResourceUrl(previewItem)" controls autoplay style="width: 100%"></video>
    <audio v-if="currentResourceType.type === 'audio' && previewItem" :src="getResourceUrl(previewItem)" controls autoplay></audio>
  </a-modal>
</template>

<script setup>
import { ref, watch, computed, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { SoundOutlined } from '@ant-design/icons-vue';
import Pagination from '@/components/Pagination.vue';
// Import your actual API function
import { getServerResources } from '@/api/modules/videoApi.js';
import { resourceTypes } from '@/utils/constant.js';

const props = defineProps({
  visible: Boolean,
  resourceType: {
    type: String,
    required: true,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  selectedValue: {
    type: [Object, Array],
    default: null,
  }
});

const emit = defineEmits(['update:visible', 'select']);

const loading = ref(false);
const resources = ref([]);
const selectedItems = ref([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// Preview Modal State
const previewVisible = ref(false);
const previewItem = ref(null);

const currentResourceType = computed(() => resourceTypes[props.resourceType] || {});
const searchFields = computed(() => currentResourceType.value.searchFields || []);
const searchParams = reactive({});

const title = computed(() => `从服务器选择 - ${currentResourceType.value.label || '资源'}`);

const fetchResources = async () => {
  loading.value = true;
  try {
    const params = {
      type: props.resourceType,
      page: pagination.current,
      page_size: pagination.pageSize,
      ...searchParams
    };
    const response = await getServerResources(currentResourceType.value.url, params);
    if (response.code === 0 && response.data) {
      resources.value = response.data.results;
      pagination.total = response.data.count;
    } else {
      message.error(response.message || '加载资源列表失败');
      resources.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    message.error('加载资源列表失败');
    resources.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const onPaginationChange = (page, pageSize) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchResources();
};

const resetSearch = () => {
  searchFields.value.forEach(field => {
    searchParams[field.name] = field.default;
  });
  fetchResources();
};

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // Reset pagination and search on open
    pagination.current = 1;
    resetSearch();

    // Initialize selection from parent
    if (props.multiple) {
        selectedItems.value = Array.isArray(props.selectedValue)
            ? props.selectedValue.filter(item => item && item.id)
            : [];
    } else {
        selectedItems.value = (props.selectedValue && props.selectedValue.id)
            ? [props.selectedValue]
            : [];
    }
  } else {
    // Clear data on close
    resources.value = [];
    selectedItems.value = [];
    pagination.total = 0;
  }
}, { immediate: true });

watch(() => props.resourceType, () => {
    if (props.visible) {
        pagination.current = 1;
        resetSearch();
    }
});

const getResourceUrl = (item) => {
  if (!item) return 'https://via.placeholder.com/150';

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089';
  const staticBaseUrl = baseUrl.replace('/api', '');
  const type = currentResourceType.value.type;
  if (type === "audio"){
    console.log(`${staticBaseUrl}/media/sound/${item.sound_path}`);
    return `${staticBaseUrl}/media/sound/${item.sound_path}`;
  }
  const pathKey = type === 'image' ? 'img_path' : `${type}_path`;
  const nameKey = type === 'image' ? 'img_name' : `${type}_name`;

  const path = item[pathKey];
  const name = item[nameKey];

  if (!path || !name) {
    return 'https://via.placeholder.com/150';
  }

  const normalizedPath = path.replace(/\\/g, '/');
  const mediaIndex = normalizedPath.indexOf('media');

  if (mediaIndex === -1) {
    return 'https://via.placeholder.com/150';
  }

  let relativePath = normalizedPath.substring(mediaIndex);
  return `${staticBaseUrl}/${relativePath}/${name}`;
};

const isSelected = (item) => {
  return selectedItems.value.some(selected => selected.id === item.id);
};

const toggleSelection = (item) => {
  if (props.multiple) {
    const index = selectedItems.value.findIndex(selected => selected.id === item.id);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    } else {
      selectedItems.value.push(item);
    }
  } else {
    selectedItems.value = [item];
  }
};

const previewResource = (item) => {
    if (!item || !item.id) return;
    previewItem.value = item;
    previewVisible.value = true;
};

const handleOk = () => {
  let selection = null;
  if (props.multiple) {
    selection = selectedItems.value;
  } else {
    selection = selectedItems.value.length > 0 ? selectedItems.value[0] : null;
  }
  emit('select', selection);
  emit('update:visible', false);
};

const handleCancel = () => {
  emit('update:visible', false);
};
</script>

<style scoped>
.search-bar {
  margin-bottom: 16px;
}
.resource-container {
  height: 55vh;
  overflow-y: auto;
  padding-right: 8px; /* Add some padding to avoid scrollbar overlap */
}
.pagination-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.resource-card {
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}
.resource-card.selected {
  border-color: #1890ff;
}
.preview-cover {
  position: relative;
  height: 120px;
  overflow: hidden;
}
.preview-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-cover .overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}
.resource-card:hover .overlay {
  opacity: 1;
}
.audio-preview {
    height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 32px;
    background-color: #f0f2f5;
}
.resource-desc {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: #888;
}
</style>
