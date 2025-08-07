<template>
  <div class="pagination-control" :class="{ 'mobile-layout': isMobile }">
    <div class="page-size-selector">
      <span>每页显示:</span>
      <a-select 
        v-model:value="innerPageSize" 
        style="width: 80px; margin-left: 8px;"
        @change="handlePageSizeChange"
      >
        <a-select-option 
          v-for="option in pageSizeOptions" 
          :key="option" 
          :value="option"
        >
          {{ option }}
        </a-select-option>
      </a-select>
      <span style="margin-left: 8px;">项</span>
    </div>
    
    <a-pagination
      v-model:current="innerCurrent"
      :total="total"
      :pageSize="innerPageSize"
      show-less-items
      @change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  current: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  total: {
    type: Number,
    default: 0
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 20, 50, 100]
  }
});

const emit = defineEmits(['update:current', 'update:pageSize', 'change']);

const innerCurrent = ref(props.current);
const innerPageSize = ref(props.pageSize);
const isMobile = ref(false);

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
};

const handlePageChange = (page) => {
  innerCurrent.value = page;
  emit('update:current', page);
  emit('change', { current: page, pageSize: innerPageSize.value });
};

const handlePageSizeChange = (size) => {
  innerPageSize.value = size;
  innerCurrent.value = 1; // 重置到第一页
  emit('update:pageSize', size);
  emit('update:current', 1);
  emit('change', { current: 1, pageSize: size });
};

// 响应外部prop变化
watch(() => props.current, (val) => {
  if (val !== innerCurrent.value) {
    innerCurrent.value = val;
  }
});

watch(() => props.pageSize, (val) => {
  if (val !== innerPageSize.value) {
    innerPageSize.value = val;
  }
});

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.pagination-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 60px;
  width: 100%;
}

.page-size-selector {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

/* 移动端布局 */
.mobile-layout {
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

@media (max-width: 768px) {
  .pagination-control:not(.mobile-layout) {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
}
</style>