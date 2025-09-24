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
                    <a-form-item label="来源">
                        <a-select v-model:value="basicForm.origin" placeholder="选择来源" style="width: 150px" allowClear>
                            <a-select-option value="INDEX_TTS">INDEX-TTS</a-select-option>
                            <a-select-option value="EDGE_TTS">EDGE-TTS</a-select-option>
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
          :category="TAG_CATEGORY" @search="handleSearch" @update:tags="fetchTagCategories" />
            </div>
        </div>

        <!-- 操作区域 -->
        
            <div style="display: flex; justify-content: flex-end; align-items: center; min-height: 60px;">
                <a-button type="primary" @click="showAddSpeakerModal">
                    <plus-outlined /> 新增朗读者
                </a-button>
            </div>
        

        <!-- 音色列表 -->
        <div class="voice-table">
            <a-table :columns="columns" :dataSource="currentPageVoices" :pagination="false"
                :rowKey="record => record.id" size="middle">
                <template #index="{ index }">
                    <div style="text-align: center;">
                        {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
                    </div>
                </template>

                <template #reader="{ record }">
                    <div style="text-align: center;">
                        <span>{{ record.name }}</span>
                    </div>
                </template>
                <template #origin="{ record }">
                    <div style="text-align: center;">
                        <a-tag :color="record.origin === 'INDEX_TTS' ? 'blue' : 'green'">
                            {{ record.origin === 'INDEX_TTS' ? 'INDEX-TTS' : 'EDGE-TTS' }}
                        </a-tag>
                    </div>
                </template>
                <template #create_time="{ record }">
                    <div style="text-align: center;">
                        <span>{{ formatDateTime(record.create_time) }}</span>
                    </div>
                </template>

                <template #tags="{ record }">
                    <div style="text-align: center;">
                        <div class="voice-tags">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                    <a-tag v-for="tag in getTagNames(record.tags)" :key="tag.id" color="blue" 
                                           style="cursor: pointer;" @click="filterByTag(tag.id, tag.name)"
                                           :title="`点击筛选标签: ${tag.name}`">{{ tag.name }}</a-tag>
                                </div>
                                <a-tooltip title="编辑标签">
                                    <tags-outlined @click.stop="showTagModal(record)"
                                        style="cursor: pointer; color: #1890ff;" />
                                </a-tooltip>
                            </div>
                        </div>
                    </div>
                </template>

                <template #action="{ record }">
                    <div style="text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <a-button 
                                type="link" 
                                size="small" 
                                @click="toggleAudio(record)"
                                :loading="record.id === currentPlayingId && audioLoading">
                                <play-circle-outlined v-if="record.id !== currentPlayingId || audioPaused" />
                                <pause-circle-outlined v-else />
                                {{ record.id === currentPlayingId && !audioPaused ? '暂停' : '试听' }}
                            </a-button>
                        </div>
                    </div>
                </template>
            </a-table>


        </div>

        <!-- 分页控制 -->
        <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
            :total="pagination.total" @change="handlePaginationChange" />
    </div>
    <!-- 标签编辑模态框 -->
    <a-modal v-model:visible="tagModalVisible" title="编辑音色标签" @ok="handleTagSubmit" @cancel="closeTagModal"
        width="800px">
        <TagSearch :tags="tagCategories" :show-actions="false" :allowVoiceTagging="true"
            :selectedTags="tagForm.currentTags" v-model:selectedTags="tagForm.currentTags" 
            @add-voice-tag="addVoiceTag" @remove-voice-tag="removeVoiceTag" />
    </a-modal>

    <!-- 新增朗读者模态框 -->
    <a-modal v-model:visible="addSpeakerModalVisible" title="新增朗读者" @ok="handleAddSpeaker" @cancel="closeAddSpeakerModal"
        width="500px" :confirmLoading="addSpeakerLoading">
        <a-form :model="addSpeakerForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-form-item label="朗读者姓名" required>
                <a-input v-model:value="addSpeakerForm.name" placeholder="请输入朗读者姓名" />
            </a-form-item>
            <a-form-item label="来源" required>
                <a-radio-group v-model:value="addSpeakerForm.origin">
                    <a-radio value="INDEX_TTS">INDEX-TTS</a-radio>
                    <a-radio value="EDGE_TTS">EDGE-TTS</a-radio>
                </a-radio-group>
            </a-form-item>
            <!-- EDGE-TTS 专用参数 -->
            <template v-if="addSpeakerForm.origin === 'EDGE_TTS'">
                <a-form-item label="语速调节">
                    <a-input-number v-model:value="addSpeakerForm.voice_rate" :min="-50" :max="100" :step="10" addon-after="%" placeholder="0" style="width: 100%" />
                    <div style="font-size: 12px; color: #999; margin-top: 4px;">调节语音播放速度，范围：-50% 到 100%</div>
                </a-form-item>
                <a-form-item label="音量调节">
                    <a-input-number v-model:value="addSpeakerForm.volume" :min="-50" :max="100" :step="10" addon-after="%" placeholder="0" style="width: 100%" />
                    <div style="font-size: 12px; color: #999; margin-top: 4px;">调节音量大小，范围：-50% 到 100%</div>
                </a-form-item>
                <a-form-item label="音调调节">
                    <a-input-number v-model:value="addSpeakerForm.voice_pitch" :min="-50" :max="50" :step="5" addon-after="Hz" placeholder="0" style="width: 100%" />
                    <div style="font-size: 12px; color: #999; margin-top: 4px;">调节音调高低，范围：-50Hz 到 50Hz</div>
                </a-form-item>
            </template>
            <a-form-item label="音频文件" required>
                <a-upload
                    v-model:file-list="addSpeakerForm.fileList"
                    :before-upload="beforeUpload"
                    :remove="handleRemove"
                    accept=".mp3,.wav,.flac,.m4a,.aac"
                    :max-count="1">
                    <a-button>
                        <upload-outlined /> 选择音频文件
                    </a-button>
                </a-upload>
                <div style="margin-top: 8px; color: #999; font-size: 12px;">
                    支持格式：mp3、wav、flac、m4a、aac
                </div>
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue';
// 在现有import部分添加
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    TagsOutlined,
    PlusOutlined,
    UploadOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import TagSearch from '@/components/TagSearch.vue';
import Pagination from '@/components/Pagination.vue';
import {
    getSpeakerPaginateList,
    updateSpeaker,
    getSpeakerSample,
    addSpeaker
} from '@/api/modules/voiceApi';

import { getTagsByCategory } from '@/api/modules/tagApi';

// 搜索类型
const searchType = ref('basic');
const TAG_CATEGORY = 'SPEAKER';
// 基础查询表单
const basicForm = reactive({
    reader: '',
    origin: undefined,
});

// 标签数据
const tagCategories = ref([]);
const tagModalVisible = ref(false);
const tagForm = reactive({
    voiceId: null,
    currentTags: []
});
// 选中的标签
const selectedTags = ref([]);

// 音色数据
const voiceData = ref([]); // 初始化为空数组

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
});
const fetchTagCategories = async () => {
    try {
        const response = await getTagsByCategory({ category: 'SPEAKER' });
        if (response?.code === 0 && Array.isArray(response.data)) {
            // 将嵌套结构扁平化
            const flattenTags = (categories) => {
                return categories.reduce((acc, category) => {
                    acc.push({
                        id: category.id,
                        name: category.tag_name,
                        children: category.children ? flattenTags(category.children) : []
                    });
                    return acc;
                }, []);
            };
            tagCategories.value = flattenTags(response.data);
        }
    } catch (error) {
        console.error('获取SPEAKER标签失败:', error);
        message.error('获取SPEAKER标签失败');
    }
};


const showTagModal = (voice) => {
    tagForm.voiceId = voice.id;
    // 确保传递的是标签ID数组，并且与 TagSearch 组件中的标签ID格式一致
    tagForm.currentTags = voice.tags.map(tag => tag.id);
    console.log('显示标签编辑模态框，当前标签ID：', tagForm.currentTags);
    tagModalVisible.value = true;
};

// 关闭标签编辑模态框
const closeTagModal = () => {
    tagModalVisible.value = false;
    tagForm.voiceId = null;
    tagForm.currentTags = [];
};

// 提交标签编辑
const handleTagSubmit = async () => {
    try {
        const formData = new FormData();
        formData.append('speaker_id', tagForm.voiceId);
        // 直接传递数组
        tagForm.currentTags.forEach(tagId => {
            formData.append('tag_ids[]', tagId);
        });

        const response = await updateSpeaker(formData);
        if (response.code === 0) {
            // 更新本地语音标签数据
            const voiceIndex = voiceData.value.findIndex(v => v.id === tagForm.voiceId);
            if (voiceIndex !== -1) {
                voiceData.value[voiceIndex].tags = [...tagForm.currentTags]; // 使用展开运算符创建新数组
            }
            message.success('标签更新成功');
            closeTagModal();
            fetchSpeakerList(); // 新增：重新获取音色列表数据
        } else {
            message.error(response.message || '标签更新失败');
        }
    } catch (error) {
        console.error('标签更新失败:', error);
        message.error('标签更新失败');
    }
};

// 添加朗读者标签
const addVoiceTag = (tagId) => {
    if (!tagForm.currentTags.includes(tagId)) {
        tagForm.currentTags.push(tagId);
        console.log('添加朗读者标签ID:', tagId, '当前标签:', tagForm.currentTags);
    }
};

// 移除朗读者标签
const removeVoiceTag = (tagId) => {
    const index = tagForm.currentTags.indexOf(tagId);
    if (index > -1) {
        tagForm.currentTags.splice(index, 1);
        console.log('移除朗读者标签ID:', tagId, '当前标签:', tagForm.currentTags);
    }
};
// 获取音色列表
// 修改 fetchSpeakerList 函数
const fetchSpeakerList = async () => {
    try {
        const params = {
            page: pagination.current,
            pageSize: pagination.pageSize,
            name: basicForm.reader,
            origin: basicForm.origin,
        };

        if (selectedTags.value.length > 0) {
            params.tag_ids = selectedTags.value.join(',');
        }

        const response = await getSpeakerPaginateList(params);
        console.log('API响应:', response);

        // 修正数据提取逻辑
        if (response && response.code === 0 && response.data) {
            voiceData.value = response.data.results || [];
            pagination.total = response.data.count || 0;
        } else {
            voiceData.value = [];
            pagination.total = 0;
        }

    } catch (error) {
        console.error('获取音色列表失败:', error);
        message.error('获取音色列表失败');
        voiceData.value = [];
        pagination.total = 0;
    }
};

// 在onMounted中调用
onMounted(() => {
    fetchSpeakerList();
    fetchTagCategories();
});

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
    pagination.current = current;
    pagination.pageSize = pageSize;
    fetchSpeakerList(); // 重新获取数据
};

// 试听相关状态和方法
const currentPlayingId = ref(null);
const audioLoading = ref(false);
const audioPaused = ref(false);
const currentAudio = ref(null);

// 新增朗读者相关状态
const addSpeakerModalVisible = ref(false);
const addSpeakerLoading = ref(false);
const addSpeakerForm = reactive({
    name: '',
    origin: 'INDEX_TTS',
    voice_rate: 0,
    volume: 0,
    voice_pitch: 0,
    fileList: []
});

const toggleAudio = async (record) => {
    // 如果当前正在播放这个音频，则暂停/恢复
    if (currentPlayingId.value === record.id && currentAudio.value) {
        if (audioPaused.value) {
            currentAudio.value.play();
            audioPaused.value = false;
        } else {
            currentAudio.value.pause();
            audioPaused.value = true;
        }
        return;
    }

    // 停止当前播放的音频
    if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value = null;
    }

    audioLoading.value = true;
    currentPlayingId.value = record.id;
    audioPaused.value = false;

    try {
        const params = {
            speaker_id: record.id
        };

        const response = await getSpeakerSample(params);

        if (response && response.data && response.data.file_path) {
            const filePath = response.data.file_path;
            console.log('准备播放的文件路径:', filePath);
            
            // 直接使用音频文件路径
            const audio = new Audio(filePath);
            currentAudio.value = audio;
            
            audio.onloadeddata = () => {
                audioLoading.value = false;
                audio.play();
            };

            audio.onended = () => {
                currentPlayingId.value = null;
                currentAudio.value = null;
                audioPaused.value = false;
            };

            audio.onerror = () => {
                message.error('音频加载失败');
                currentPlayingId.value = null;
                currentAudio.value = null;
                audioPaused.value = false;
                audioLoading.value = false;
            };
        } else {
            console.error('获取试听文件路径失败:', response);
            message.error('获取试听文件路径失败');
            currentPlayingId.value = null;
            audioLoading.value = false;
        }
    } catch (error) {
        console.error('试听出错:', error);
        message.error('试听出错: ' + (error.response?.data?.message || error.message));
        currentPlayingId.value = null;
        audioLoading.value = false;
    }
};

// 根据标签ID查找标签（递归查找，支持二级标签）
const findTagById = (tagId) => {
    const searchInCategories = (categories) => {
        for (const category of categories) {
            // 检查当前分类是否匹配
            if (category.id === tagId) {
                return category;
            }
            // 如果有子分类，递归查找
            if (category.children && category.children.length > 0) {
                const foundTag = searchInCategories(category.children);
                if (foundTag) return foundTag;
            }
        }
        return null;
    };
    
    return searchInCategories(tagCategories.value);
};

// 获取标签名称，添加标签存在性验证
const getTagNames = (tags) => {
    if (!tags || !Array.isArray(tags)) return [];
    
    return tags.map(tag => {
        // 如果tag有name属性，验证标签是否仍然存在
        if (tag.tag_name) {
            const existingTag = findTagById(tag.id);
            if (existingTag) {
                return {
                    id: tag.id,
                    name: tag.tag_name
                };
            }
            return null; // 标签已被删除，返回null
        }
        // 如果只有ID，通过ID查找标签
        const foundTag = findTagById(tag.id || tag);
        if (foundTag) {
            return {
                id: foundTag.id,
                name: foundTag.name
            };
        }
        return null; // 标签不存在，返回null
    }).filter(Boolean); // 过滤掉null值
};


// 当前页显示的音色
// 修改 currentPageVoices 计算属性，使用服务端分页
const currentPageVoices = computed(() => {
// 如果使用服务端分页，直接返回 voiceData
return voiceData.value;
});

// 搜索
const handleSearch = () => {
    pagination.current = 1; // 重置到第一页
    fetchSpeakerList(); // 重新获取数据
};

// 重置基础查询
const resetBasicSearch = () => {
    basicForm.reader = '';
    basicForm.origin = undefined;
    handleSearch();
};

// 通过标签快速过滤
const filterByTag = (tagId, tagName) => {
    // 切换到标签查询模式
    searchType.value = 'tag';
    
    // 清空当前选中的标签
    selectedTags.value = [];
    
    // 选中点击的标签
    selectedTags.value.push(tagId);
    
    // 执行搜索
    handleSearch();
    
    // 提示用户
    message.success(`已按标签"${tagName}"进行筛选`);
};

// 格式化时间显示
const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 新增朗读者相关方法
const showAddSpeakerModal = () => {
    addSpeakerModalVisible.value = true;
};

const closeAddSpeakerModal = () => {
    addSpeakerModalVisible.value = false;
    addSpeakerForm.name = '';
    addSpeakerForm.origin = 'INDEX_TTS';
    addSpeakerForm.voice_rate = 0;
    addSpeakerForm.volume = 0;
    addSpeakerForm.voice_pitch = 0;
    addSpeakerForm.fileList = [];
};

const beforeUpload = (file) => {
    const isValidFormat = ['mp3', 'wav', 'flac', 'm4a', 'aac'].some(format => 
        file.name.toLowerCase().endsWith(`.${format}`)
    );
    if (!isValidFormat) {
        message.error('只支持 mp3、wav、flac、m4a、aac 格式的音频文件');
        return false;
    }
    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
        message.error('音频文件大小不能超过 50MB');
        return false;
    }
    return false; // 阻止自动上传
};

const handleRemove = () => {
    addSpeakerForm.fileList = [];
};

const handleAddSpeaker = async () => {
    if (!addSpeakerForm.name.trim()) {
        message.error('请输入朗读者姓名');
        return;
    }
    if (addSpeakerForm.fileList.length === 0) {
        message.error('请选择音频文件');
        return;
    }

    addSpeakerLoading.value = true;
    try {
        const formData = new FormData();
        formData.append('name', addSpeakerForm.name.trim());
        formData.append('origin', addSpeakerForm.origin);
        // EDGE-TTS 专用参数
        if (addSpeakerForm.origin === 'EDGE_TTS') {
            // 格式化参数为带符号和单位的字符串
            const voiceRate = addSpeakerForm.voice_rate >= 0 ? `+${addSpeakerForm.voice_rate}%` : `${addSpeakerForm.voice_rate}%`;
            const volume = addSpeakerForm.volume >= 0 ? `+${addSpeakerForm.volume}%` : `${addSpeakerForm.volume}%`;
            const voicePitch = addSpeakerForm.voice_pitch >= 0 ? `+${addSpeakerForm.voice_pitch}Hz` : `${addSpeakerForm.voice_pitch}Hz`;
            
            formData.append('voice_rate', voiceRate);
            formData.append('volume', volume);
            formData.append('voice_pitch', voicePitch);
        }
        formData.append('audio_file', addSpeakerForm.fileList[0].originFileObj);

        const response = await addSpeaker(formData);
        if (response.code === 0) {
            message.success('朗读者添加成功');
            closeAddSpeakerModal();
            // 刷新列表
            fetchSpeakerList();
        } else {
            message.error(response.message || '添加朗读者失败');
        }
    } catch (error) {
        console.error('添加朗读者失败:', error);
        message.error('添加朗读者失败: ' + (error.response?.data?.message || error.message));
    } finally {
        addSpeakerLoading.value = false;
    }
};

// 初始化
onMounted(() => {
    pagination.total = voiceData.value.length;
});
// 修改表格列定义
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
        align: 'center',
        width: 150,
        slots: { customRender: 'reader' }
    },
    {
        title: '来源',
        dataIndex: 'origin',
        key: 'origin',
        align: 'center',
        width: 120,
        slots: { customRender: 'origin' }
    },
    {
        title: '上传时间',
        dataIndex: 'create_time',
        key: 'create_time',
        align: 'center',
        width: 180,
        slots: { customRender: 'create_time' }
    },
    {
        title: '标签',
        key: 'tags',
        width: 300,
        align: 'center',
        slots: { customRender: 'tags' }
    },
    {
        title: '操作',
        key: 'action',
        width: 200,
        align: 'center',
        slots: { customRender: 'action' }
    }
];

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
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.voice-tags .ant-tag {
    margin: 0;
}

.preview-options {
    display: flex;
    gap: 24px;
    margin-top: 20px;
}

.option-description {
    flex: 1;
    padding: 16px;
    border-radius: 4px;
    background: #f9f9f9;
}

.option-description h4 {
    margin-bottom: 8px;
    color: #1890ff;
}

.option-description p {
    margin-bottom: 12px;
    color: #666;
}
</style>


