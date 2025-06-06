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
                    <a-form-item label="语言">
                        <a-select 
                            v-model:value="basicForm.language" 
                            placeholder="选择语言" 
                            style="width: 120px"
                            @dropdownVisibleChange="(open) => open && !languages.length && fetchOptionsData()"
                            :loading="!languages.length">
                            <a-select-option value="">全部</a-select-option>
                            <a-select-option v-for="lang in languages" :key="lang.id" :value="lang">
                                {{ lang }}
                            </a-select-option>
                        </a-select>
                    </a-form-item>

                    <a-form-item label="情感">
                        <a-select 
                            v-model:value="basicForm.emotion" 
                            placeholder="选择情感" 
                            style="width: 120px"
                            @dropdownVisibleChange="(open) => open && !emotions.length && fetchOptionsData()"
                            :loading="!emotions.length">
                            <a-select-option value="">全部</a-select-option>
                            <a-select-option v-for="emo in emotions" :key="emo.id" :value="emo">
                                {{ emo }}
                            </a-select-option>
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

        <div class="action-area">
            <a-button type="primary" @click="syncAudio" style="float: right;">
                <sync-outlined /> 同步音频
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

                <template #language="{ record }">
                    <div style="text-align: center;">
                        <a-select 
                            v-model:value="record.language"
                            :options="record.languageOptions || []"
                            @dropdownVisibleChange="(open) => open && loadSpeakerLanguages(record)"
                            @change="(value) => handleLanguageChange(record, value)"
                            style="width: 120px"
                        />
                    </div>
                </template>

                <template #emotion="{ record }">
                    <div style="text-align: center;">
                        <a-select 
                            v-model:value="record.emotion"
                            :options="record.emotionOptions || []"
                            @dropdownVisibleChange="(open) => open && loadSpeakerEmotions(record)"
                            @change="(value) => handleEmotionChange(record, value)"
                            style="width: 120px"
                        />
                    </div>
                </template>

                <template #speed="{ record }">
                    <div style="text-align: center;">
                        <a-input-number 
                            v-model:value="record.speed"
                            :min="0.01"
                            :max="2"
                            :step="0.1"
                            @change="(value) => handleSpeedChange(record, value)"
                            style="width: 100px"
                        />
                    </div>
                </template>
                <template #model="{ record }">
    <div style="text-align: center;">
        {{ record.model }}
    </div>
</template>

                <template #tags="{ record }">
                    <div style="text-align: center;">
                        <div class="voice-tags">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                    <a-tag v-for="tag in getTagNames(record.tags)" :key="tag.id" color="blue">{{
                                        tag.name }}</a-tag>
                                </div>
                                <a-tooltip title="编辑标签">
                                    <tags-outlined @click.stop="showTagModal(record)"
                                        style="cursor: pointer; color: #1890ff;" />
                                </a-tooltip>
                            </div>
                        </div>
                    </div>
                </template>

                // 修改操作列模板
                <template #action="{ record }">
                    <div style="text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <a-button type="link" size="small" 
                                     @click="showPreviewModal(record)"
                                     :loading="previewLoading">
                                试听
                            </a-button>
                        </div>
                    </div>
                </template>
            </a-table>
            
            <!-- 将试听模态框移到表格外部 -->
            <a-modal v-model:visible="previewModalVisible" 
                     title="试听选项" 
                     width="600px"
                     :footer="null"
                     :maskClosable="false">
                <a-card :bordered="false">
                    <a-form layout="vertical">
                        <a-form-item label="试听文本">
                            <a-textarea v-model:value="previewText" 
                                       :rows="4" 
                                       placeholder="请输入试听文本"/>
                        </a-form-item>
                        
                        <div class="preview-options">
                            <div class="option-description">
                                
                                <a-button type="primary" 
                                          @click="previewVoice(currentPreviewRecord, true)"
                                          :loading="previewLoading">
                                    <play-circle-outlined /> 试听音色
                                </a-button>
                                <a-tooltip title="播放当前朗读者的默认音色样本">
                                        <question-circle-outlined style="margin-left: 8px; color: #999; cursor: help"/>
                                    </a-tooltip>
                            </div>
                            
                            <div class="option-description">
                                
                                <a-button @click="previewVoice(currentPreviewRecord, false)"
                                          :loading="previewLoading">
                                    <play-circle-outlined /> 试听文本
                                </a-button>
                                <a-tooltip title="播放您输入的文本使用当前朗读者的音色">
                                        <question-circle-outlined style="margin-left: 8px; color: #999; cursor: help"/>
                                    </a-tooltip>
                            </div>
                        </div>
                    </a-form>
                </a-card>
            </a-modal>
        </div>

        <!-- 分页控制 -->
        <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
            :total="pagination.total" @change="handlePaginationChange" />
    </div>
    <!-- 标签编辑模态框 -->
    <a-modal v-model:visible="tagModalVisible" title="编辑音色标签" @ok="handleTagSubmit" @cancel="closeTagModal"
        width="800px">
        <TagSearch :tags="tagCategories" :show-actions="false" :allow-voice-tagging="true"
            v-model:selectedTags="tagForm.currentTags" @add-voice-tag="addVoiceTag"
            @remove-voice-tag="removeVoiceTag" />
    </a-modal>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue';
// 在现有import部分添加
import { 
    UploadOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    PlayCircleOutlined, 
    TagsOutlined,
    QuestionCircleOutlined  // 新增
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import TagSearch from '@/components/TagSearch.vue';
import Pagination from '@/components/Pagination.vue';
import {  
    getSpeakerList, 
    updateSpeaker, 
    getSpeakerSample, 
    syncSpeakerAudio, 
    getAllEmotions, 
    getAllLanguages,
    getLanguagesBySpeaker,
    getEmotionsBySpeaker } from '@/api/modules/voiceApi';
import { request } from '@/api/config/request';
import { getTagsByCategory } from '@/api/modules/tagApi';
import { SyncOutlined } from '@ant-design/icons-vue';
// 搜索类型
const searchType = ref('basic');
const TAG_CATEGORY = 'SPEAKER';
// 基础查询表单
const basicForm = reactive({
    reader: '',
    language: '',  // 确保包含语言字段
    emotion: ''    // 确保包含情感字段
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

// 在script setup部分添加状态
const languages = ref([]);
const emotions = ref([]);

// 获取语言和情感数据
const fetchOptionsData = async () => {
    if (languages.value.length && emotions.value.length) return;
    
    try {
        const [langRes, emoRes] = await Promise.all([
            getAllLanguages(),
            getAllEmotions()
        ]);
        languages.value = langRes.data || [];
        emotions.value = emoRes.data || [];
    } catch (error) {
        console.error('获取选项数据失败:', error);
        message.error('获取选项数据失败');
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
// 获取音色列表
// 修改获取音色列表方法
const fetchSpeakerList = async () => {
    try {
        const params = {
            page: pagination.current,
            page_size: pagination.pageSize,
            name: basicForm.reader,
            language: basicForm.language || undefined,
            emotion: basicForm.emotion || undefined
        };
        
        if (selectedTags.value.length > 0) {
            params.tag_ids = selectedTags.value.join(',');
        }

        const response = await getSpeakerList(params);
        
        // 确保数据结构正确
        voiceData.value = response.data?.list || response.data || response || [];
        pagination.total = response.data?.total || response.total || voiceData.value.length;
        
    } catch (error) {
        console.error('获取音色列表失败:', error);
        message.error('获取音色列表失败');
    }
};

// 在onMounted中调用
onMounted(() => {
    fetchSpeakerList();
    fetchTagCategories();
    fetchOptionsData(); // 新增
});

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
    pagination.current = current;
    pagination.pageSize = pageSize;
    fetchSpeakerList(); // 重新获取数据
};

// 试听相关状态和方法
const previewModalVisible = ref(false);
const previewText = ref('欢迎使用语音合成系统，这是一个默认的试听文本。');
const currentPreviewRecord = ref(null);
const previewLoading = ref(false);

const showPreviewModal = (record) => {
    currentPreviewRecord.value = record;
    previewModalVisible.value = true;
};

const previewVoice = async (record, isDefault = true) => {
    if (!record) return;
    
    previewLoading.value = true;
    try {
        const params = {
            speaker_id: record.id,
            text: previewText.value, // 无论isDefault为何值都传递text
            is_default: isDefault
        };

        const response = await getSpeakerSample(params);
        
        // 检查响应结构并获取 file_path
        if (response && response.data && response.data.file_path) {
            const filePath = response.data.file_path;
            // 根据 file_path 去后端获取音频文件
            console.log('准备播放的文件路径:', filePath);
            const audioResponse = await request({
                method: 'get',
                url: `/${filePath}`,
                responseType: 'arraybuffer' // 获取二进制数据
            });

            // 音频播放逻辑
            const blob = new Blob([audioResponse], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };
        } else {
            console.error('获取试听文件路径失败:', response);
            message.error('获取试听文件路径失败');
        }
    } catch (error) {
        console.error('试听出错:', error);
        message.error('试听出错: ' + (error.response?.data?.message || error.message));
    } finally {
        previewLoading.value = false;
    }
};


// 添加同步音频功能
const syncAudio = async () => {
    try {
        const response = await syncSpeakerAudio(); // 需要添加对应的API方法
        if (response.code === 0) {
            message.success('音频同步成功');
            fetchSpeakerList(); // 刷新列表
        } else {
            message.error(response.message || '音频同步失败');
        }
    } catch (error) {
        console.error('同步音频出错:', error);
        message.error('同步音频出错');
    }
};

// 修改获取标签名称的方法
const getTagNames = (tags) => {
    if (!tags || !Array.isArray(tags)) return [];

    // 返回包含标签名称和ID的对象数组
    return tags.map(tag => ({
        id: tag.id, // 标签ID
        name: tag.tag_name // 标签名称
    })).filter(tag => tag.name);
};

// 根据标签ID查找标签
const findTagById = (tagId) => {
    // 直接遍历 tagCategories 查找标签
    for (const tag of tagCategories.value) {
        if (tag.id === tagId) return tag;
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
            // 修改性别匹配逻辑
            const genderMatch = basicForm.gender === '不限' || voice.gender === basicForm.gender;
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
    pagination.current = 1; // 重置到第一页
    fetchSpeakerList(); // 重新获取数据
};

// 重置基础查询
const resetBasicSearch = () => {
    basicForm.reader = '';
    basicForm.language = '';
    basicForm.emotion = '';
    handleSearch();
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
        title: '语言',
        dataIndex: 'language',
        key: 'language',
        align: 'center',
        width: 100,
        slots: { customRender: 'language' }
    },
    {
        title: '情感',
        dataIndex: 'emotion',
        key: 'emotion',
        align: 'center',
        width: 100,
        slots: { customRender: 'emotion' }
    },
    {
        title: '语速',
        dataIndex: 'speed',
        key: 'speed',
        align: 'center',
        width: 100,
        slots: { customRender: 'speed' }
    },
    {
        title: '音频模型',  
        dataIndex: 'model',
        key: 'model',
        align: 'center',
        width: 120,
        slots: { customRender: 'model' }
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
// 添加语言切换方法
const handleLanguageChange = async (record, newLanguage) => {
    try {
        const formData = new FormData();
        formData.append('speaker_id', record.id);
        formData.append('language', newLanguage);
        
        const response = await updateSpeaker(formData);
        if (response.code === 0) {
            message.success('语言更新成功');
            // 更新本地数据
            const index = voiceData.value.findIndex(v => v.id === record.id);
            if (index !== -1) {
                voiceData.value[index].language = newLanguage;
            }
        } else {
            message.error(response.message || '语言更新失败');
        }
    } catch (error) {
        console.error('语言更新失败:', error);
        message.error('语言更新失败');
    }
};

const handleEmotionChange = async (record, newEmotion) => {
    try {
        const formData = new FormData();
        formData.append('speaker_id', record.id);
        formData.append('emotion', newEmotion);
        
        const response = await updateSpeaker(formData);
        if (response.code === 0) {
            message.success('情感更新成功');
            // 更新本地数据
            const index = voiceData.value.findIndex(v => v.id === record.id);
            if (index !== -1) {
                voiceData.value[index].emotion = newEmotion;
            }
        } else {
            message.error(response.message || '情感更新失败');
        }
    } catch (error) {
        console.error('情感更新失败:', error);
        message.error('情感更新失败');
    }
};

// 加载朗读者的语言选项
const loadSpeakerLanguages = async (record) => {
    if (record.languageOptions) return;
    
    try {
        const response = await getLanguagesBySpeaker(record.id);
        record.languageOptions = response.data.map(lang => ({
            value: lang,
            label: lang
        }));
    } catch (error) {
        console.error('获取语言选项失败:', error);
        record.languageOptions = [];
    }
};

// 加载朗读者的情感选项
const loadSpeakerEmotions = async (record) => {
    if (record.emotionOptions) return;
    
    try {
        const response = await getEmotionsBySpeaker(record.id);
        record.emotionOptions = response.data.map(emo => ({
            value: emo,
            label: emo
        }));
    } catch (error) {
        console.error('获取情感选项失败:', error);
        record.emotionOptions = [];
    }
};

const handleSpeedChange = async (record, newSpeed) => {
    try {
        // 确保值在范围内
        newSpeed = Math.max(0.01, Math.min(2, newSpeed));
        
        const formData = new FormData();
        formData.append('speaker_id', record.id);
        formData.append('speed', newSpeed);
        
        const response = await updateSpeaker(formData);
        if (response.code === 0) {
            message.success('语速更新成功');
            // 更新本地数据
            const index = voiceData.value.findIndex(v => v.id === record.id);
            if (index !== -1) {
                voiceData.value[index].speed = newSpeed;
            }
        } else {
            message.error(response.message || '语速更新失败');
        }
    } catch (error) {
        console.error('语速更新失败:', error);
        message.error('语速更新失败');
    }
};
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

.action-area {
    margin-bottom: 20px;
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
