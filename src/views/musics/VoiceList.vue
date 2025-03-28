<template>
  <div class="voice-list-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <div class="search-header">
        <a-radio-group v-model:value="searchType" size="small">
          <a-radio-button value="basic">基础查询</a-radio-button>
          <a-radio-button value="tag">标签查询</a-radio-button>
        </a-radio-group>
      </div>

      <!-- 基础查询表单 -->
      <div class="basic-search" v-if="searchType === 'basic'">
        <a-form layout="inline" :model="basicForm">
          <a-form-item label="朗读者">
            <a-input v-model:value="basicForm.reader" placeholder="输入朗读者" @pressEnter="handleSearch" />
          </a-form-item>
          <a-form-item label="性别">
            <a-select v-model:value="basicForm.gender" placeholder="选择性别">
              <a-select-option value="male">男</a-select-option>
              <a-select-option value="female">女</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="resetBasicSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 标签查询 -->
      <div class="tag-search" v-if="searchType === 'tag'">
        <TagSearch :tags="tagCategories" :showActions="true" v-model:selectedTags="selectedTags"
          @search="handleSearch" />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-area">
      <a-button type="primary" @click="showUploadModal" style="float: right;">
        <upload-outlined /> 上传音色
      </a-button>
    </div>

    <!-- 音色列表 -->
    <div class="voice-table">
      <a-table :columns="columns" :dataSource="currentPageVoices" :pagination="false"
        :rowKey="record => record.id" size="middle">
        <template #index="{ index }">
          {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
        </template>

        <template #reader="{ record }">
          {{ record.reader }}
        </template>

        <template #gender="{ record }">
          {{ record.gender === 'male' ? '男' : '女' }}
        </template>

        <template #seed="{ record }">
          {{ record.seed }}
        </template>

        <template #tags="{ record }">
          <div class="voice-tags">
            <a-tag v-for="tag in getTagNames(record.tags)" :key="tag" color="blue">{{ tag }}</a-tag>
          </div>
        </template>

        <template #action="{ record }">
          <a-button type="link" size="small" @click="showEditModal(record)">
            <EditOutlined /> 编辑
          </a-button>
          <a-popconfirm title="确认要删除这个音色吗？" ok-text="确认" cancel-text="取消"
            @confirm="() => deleteVoice(record.id)">
            <a-button type="link" size="small" danger>
              <DeleteOutlined /> 删除
            </a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </div>

    <!-- 分页控制 -->
    <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
      :total="pagination.total" @change="handlePaginationChange" />

    <!-- 音色编辑模态框 -->
    <a-modal v-model:visible="editModalVisible" :title="currentVoice ? '编辑音色信息' : '添加音色'" width="800px"
      :maskClosable="false" @ok="handleEditSubmit" @cancel="closeEditModal">
      <a-form :model="voiceForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" ref="voiceFormRef">
        <a-form-item label="朗读者" name="reader" :rules="[{ required: true, message: '请输入朗读者' }]">
          <a-input v-model:value="voiceForm.reader" placeholder="请输入朗读者" />
        </a-form-item>
        <a-form-item label="性别" name="gender" :rules="[{ required: true, message: '请选择性别' }]">
          <a-select v-model:value="voiceForm.gender" placeholder="选择性别">
            <a-select-option value="male">男</a-select-option>
            <a-select-option value="female">女</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="声音种子" name="seed" :rules="[{ required: true, message: '请输入声音种子' }]">
          <a-input v-model:value="voiceForm.seed" placeholder="请输入声音种子" />
        </a-form-item>
        <a-form-item label="标签">
          <TagSearch :tags="tagCategories" :show-actions="false" :allow-voice-tagging="true"
            :voice-tags="voiceForm.tags" @add-voice-tag="addVoiceTag"
            @remove-voice-tag="removeVoiceTag" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 上传音色模态框 -->
    <a-modal v-model:visible="uploadModalVisible" title="上传音色" width="800px"
      :maskClosable="false" @ok="handleUploadSubmit" @cancel="closeUploadModal">
      <a-form :model="uploadForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" ref="uploadFormRef">
        <a-form-item label="朗读者" name="reader" :rules="[{ required: true, message: '请输入朗读者' }]">
          <a-input v-model:value="uploadForm.reader" placeholder="请输入朗读者" />
        </a-form-item>
        <a-form-item label="性别" name="gender" :rules="[{ required: true, message: '请选择性别' }]">
          <a-select v-model:value="uploadForm.gender" placeholder="选择性别">
            <a-select-option value="male">男</a-select-option>
            <a-select-option value="female">女</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="声音种子文件" name="seedFile" :rules="[{ required: true, message: '请上传声音种子文件' }]">
          <a-upload :beforeUpload="() => false" :showUploadList="false" @change="handleFileChange">
            <a-button>选择文件</a-button>
          </a-upload>
          <div v-if="uploadForm.seedFile" class="file-info">
            已选择: {{ uploadForm.seedFile.name }}
          </div>
        </a-form-item>
        <a-form-item label="标签">
          <TagSearch :tags="tagCategories" :show-actions="false" :allow-voice-tagging="true"
            :voice-tags="uploadForm.tags" @add-voice-tag="addVoiceTag"
            @remove-voice-tag="removeVoiceTag" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import TagSearch from '@/components/TagSearch.vue';
import Pagination from '@/components/Pagination.vue';

// 搜索类型
const searchType = ref('basic');

// 基础查询表单
const basicForm = reactive({
  reader: '',
  gender: ''
});

// 标签数据
const tagCategories = ref([
  {
    id: 1,
    name: '音色类型',
    tags: [
      { id: 'type_1', name: '温暖' },
      { id: 'type_2', name: '清亮' },
      { id: 'type_3', name: '浑厚' }
    ]
  },
  {
    id: 2,
    name: '适用场景',
    tags: [
      { id: 'scene_1', name: '新闻播报' },
      { id: 'scene_2', name: '故事讲述' },
      { id: 'scene_3', name: '广告配音' }
    ]
  }
]);

// 选中的标签
const selectedTags = ref([]);

// 音色数据
const voiceData = ref(generateMockVoices(50));

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 生成模拟音色数据
function generateMockVoices(count) {
  const mockVoices = [];
  const types = ['type_1', 'type_2', 'type_3'];
  const scenes = ['scene_1', 'scene_2', 'scene_3'];
  const genders = ['male', 'female'];
  const readers = ['张三', '李四', '王五', '赵六'];

  for (let i = 1; i <= count; i++) {
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)];
    const randomGender = genders[Math.floor(Math.random() * genders.length)];

    mockVoices.push({
      id: i,
      reader: readers[Math.floor(Math.random() * readers.length)],
      gender: randomGender,
      seed: `SEED-${Math.floor(Math.random() * 10000)}`,
      tags: [randomType, randomScene]
    });
  }

  return mockVoices;
}

// 表格列定义
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center',
    slots: { customRender: 'index' }
  },
  {
    title: '朗读者',
    dataIndex: 'reader',
    key: 'reader',
    slots: { customRender: 'reader' }
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    width: 100,
    align: 'center',
    slots: { customRender: 'gender' }
  },
  {
    title: '声音种子',
    dataIndex: 'seed',
    key: 'seed',
    width: 150,
    slots: { customRender: 'seed' }
  },
  {
    title: '标签',
    key: 'tags',
    slots: { customRender: 'tags' }
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center',
    slots: { customRender: 'action' }
  }
];

// 上传模态框相关状态
const uploadModalVisible = ref(false);
const uploadForm = reactive({
  reader: '',
  gender: 'male',
  seedFile: null,
  tags: []
});
const uploadFormRef = ref(null);

// 显示上传模态框
const showUploadModal = () => {
  uploadModalVisible.value = true;
};

// 关闭上传模态框
const closeUploadModal = () => {
  uploadModalVisible.value = false;
  uploadFormRef.value?.resetFields();
  uploadForm.seedFile = null;
};

// 处理文件选择
const handleFileChange = (info) => {
  if (info.file) {
    uploadForm.seedFile = info.file;
  }
};

// 提交上传
const handleUploadSubmit = async () => {
  try {
    await uploadFormRef.value.validate();

    voiceData.value.unshift({
      id: Date.now(),
      reader: uploadForm.reader,
      gender: uploadForm.gender,
      seed: `SEED-${Math.floor(Math.random() * 10000)}`,
      tags: [...uploadForm.tags]
    });

    message.success('上传成功');
    closeUploadModal();
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 编辑模态框相关状态
const editModalVisible = ref(false);
const currentVoice = ref(null);
const voiceForm = reactive({
  id: null,
  reader: '',
  gender: '',
  seed: '',
  tags: []
});
const voiceFormRef = ref(null);

// 根据标签ID获取标签名称
const getTagNames = (tagIds) => {
  const names = [];
  tagIds.forEach(tagId => {
    const foundTag = findTagById(tagId);
    if (foundTag) names.push(foundTag.name);
  });
  return names;
};

// 根据标签ID查找标签
const findTagById = (tagId) => {
  for (const category of tagCategories.value) {
    const foundTag = category.tags.find(t => t.id === tagId);
    if (foundTag) return foundTag;
  }
  return null;
};

// 当前页显示的音色
const currentPageVoices = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredVoices.value.slice(start, end);
});

// 过滤后的音色
const filteredVoices = computed(() => {
  const filtered = voiceData.value.filter(voice => {
    if (searchType.value === 'basic') {
      const readerMatch = (voice.reader || '').toLowerCase().includes(
        (basicForm.reader || '').toLowerCase()
      );
      const genderMatch = !basicForm.gender || voice.gender === basicForm.gender;
      return readerMatch && genderMatch;
    }

    if (searchType.value === 'tag' && selectedTags.value.length > 0) {
      return selectedTags.value.some(tagId => voice.tags.includes(tagId));
    }

    return true;
  });

  pagination.total = filtered.length;
  return filtered;
});

// 搜索
const handleSearch = () => {
  pagination.current = 1;
};

// 重置基础查询
const resetBasicSearch = () => {
  basicForm.reader = '';
  basicForm.gender = '';
  handleSearch();
};

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
  pagination.current = current;
  pagination.pageSize = pageSize;
};

// 处理文件选择
const handleUploadChange = (info) => {
  if (info.file.status === 'done') {
    message.success(`${info.file.name} 上传成功`);
    voiceData.value.unshift({
      id: Date.now(),
      reader: '新上传',
      gender: 'male',
      seed: `SEED-${Math.floor(Math.random() * 10000)}`,
      tags: []
    });
  }
};

// 显示编辑模态框
const showEditModal = (voice) => {
  currentVoice.value = voice;
  voiceForm.id = voice.id;
  voiceForm.reader = voice.reader;
  voiceForm.gender = voice.gender;
  voiceForm.seed = voice.seid;
  voiceForm.tags = [...voice.tags];
  editModalVisible.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
  editModalVisible.value = false;
  currentVoice.value = null;
  voiceFormRef.value?.resetFields();
};

// 添加音色标签
const addVoiceTag = (tagId) => {
  if (!voiceForm.tags.includes(tagId)) {
    voiceForm.tags.push(tagId);
  }
};

// 移除音色标签
const removeVoiceTag = (tagId) => {
  const index = voiceForm.tags.indexOf(tagId);
  if (index > -1) {
    voiceForm.tags.splice(index, 1);
  }
};

// 提交编辑
const handleEditSubmit = async () => {
  try {
    await voiceFormRef.value.validate();

    if (currentVoice.value) {
      const index = voiceData.value.findIndex(v => v.id === voiceForm.id);
      if (index !== -1) {
        voiceData.value[index] = {
          ...voiceData.value[index],
          reader: voiceForm.reader,
          gender: voiceForm.gender,
          seed: voiceForm.seed,
          tags: [...voiceForm.tags]
        };
      }
    } else {
      voiceData.value.unshift({
        id: Date.now(),
        reader: voiceForm.reader,
        gender: voiceForm.gender,
        seed: voiceForm.seed,
        tags: [...voiceForm.tags]
      });
    }

    message.success('保存成功');
    closeEditModal();
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 删除音色
const deleteVoice = (voiceId) => {
  const index = voiceData.value.findIndex(v => v.id === voiceId);
  if (index !== -1) {
    voiceData.value.splice(index, 1);
    message.success('删除成功');
  } else {
    message.error('删除失败');
  }
};

// 初始化
onMounted(() => {
  pagination.total = voiceData.value.length;
});
</script>

<style scoped>
.voice-list-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-header {
  margin-bottom: 16px;
}

.basic-search .ant-form-item {
  margin-bottom: 16px;
}

.tag-search {
  margin-top: 16px;
}

.voice-table {
  flex: 1;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.voice-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-area {
  margin-bottom: 20px;
}
</style>

