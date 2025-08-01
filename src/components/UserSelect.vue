<template>
  <a-select 
    v-model:value="selectedUser"
    :placeholder="placeholder"
    :style="{ width: width }"
    :allowClear="allowClear"
    :loading="loading"
    @dropdownVisibleChange="handleDropdownVisibleChange"
  >
    <a-select-option value="">全部</a-select-option>
    <a-select-option 
      v-for="user in userList" 
      :key="user.id" 
      :value="user.id"  
    >
      {{ user.username }}
    </a-select-option>
  </a-select>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getUsers } from '@/api/modules/accountApi'
import { message } from 'ant-design-vue'

const props = defineProps({
  modelValue: {
    type: [String, undefined],
    default: undefined
  },
  placeholder: {
    type: String,
    default: '选择用户'
  },
  width: {
    type: String,
    default: '120px'
  },
  allowClear: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const userList = ref([])
const loading = ref(false)
const hasLoaded = ref(false)

const selectedUser = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  selectedUser.value = newVal
})

// 监听内部值变化
watch(selectedUser, (newVal) => {
  emit('update:modelValue', newVal)
})

// 获取用户列表
const fetchUsers = async () => {
  if (hasLoaded.value) return
  
  try {
    loading.value = true
    const response = await getUsers()
    
    if (response && response.code === 0) {
      userList.value = response.data || []
      hasLoaded.value = true
    } else {
      message.error('获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 下拉框展开时加载数据
const handleDropdownVisibleChange = (open) => {
  if (open && !hasLoaded.value) {
    fetchUsers()
  }
}
</script>