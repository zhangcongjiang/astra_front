<template>
    <div class="effect-list-container">
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
                    <a-form-item label="音效名称">
                        <a-input v-model:value="basicForm.name" placeholder="输入音效名称" @pressEnter="handleSearch" />
                    </a-form-item>
                    <a-form-item label="上传者">
                        <a-input v-model:value="basicForm.uploader" placeholder="输入上传者名称" @pressEnter="handleSearch" />
                    </a-form-item>
                    <a-form-item label="创建时间">
                        <a-range-picker v-model:value="basicForm.dateRange" :show-time="{ format: 'HH:mm' }"
                            format="YYYY-MM-DD HH:mm" :placeholder="['开始时间', '结束时间']" @change="handleDateChange" />
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
        <div class="action-area">
            <a-button type="primary" @click="showUploadModal" style="float: right;">
                <upload-outlined /> 上传音效
            </a-button>
        </div>

        <!-- 上传音效模态框 -->
        <a-modal v-model:visible="uploadModalVisible" title="上传音效" width="800px" :maskClosable="false"
            @ok="handleUploadSubmit" @cancel="closeUploadModal">
            <a-form :model="uploadForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" ref="uploadFormRef">
                <a-form-item label="音效名称" name="name" :rules="[{ required: true, message: '请输入音效名称' }]">
                    <a-input v-model:value="uploadForm.name" placeholder="请输入音效名称" />
                </a-form-item>
                <a-form-item label="音效文件" name="audioFile" :rules="[{ required: true, message: '请上传音效文件' }]">
                    <a-upload :beforeUpload="() => false" :showUploadList="false" @change="handleFileChange">
                        <a-button>选择音效文件</a-button>
                    </a-upload>
                    <div v-if="uploadForm.audioFile" class="file-info">
                        已选择: {{ uploadForm.audioFile.name }}
                    </div>
                </a-form-item>
                <a-form-item label="标签">
                    <TagSearch :tags="tagCategories" :show-actions="false" :allow-image-tagging="true"
                        :image-tags="uploadForm.tags" @add-image-tag="addEffectTag"
                        @remove-image-tag="removeEffectTag" />
                </a-form-item>
            </a-form>
        </a-modal>
        <!-- 特效音列表 -->
        <div class="effect-table">
            <a-table :columns="columns" :dataSource="currentPageEffects" :pagination="false"
                :rowKey="record => record.id" size="middle">
                <template #index="{ index }">
                    {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
                </template>

                <template #name="{ record }">
                    <div class="effect-name-container">
                        <span class="effect-name-text">{{ record.name }}</span>
                    </div>
                </template>

                <template #duration="{ record }">
                    {{ formatDuration(record.duration) }}
                </template>

                <template #scene="{ record }">
                    {{ record.scene }}
                </template>

                <template #tags="{ record }">
                    <div class="effect-tags">
                        <a-tag v-for="tag in getTagNames(record.tags)" :key="tag" color="blue">{{ tag }}</a-tag>
                    </div>
                </template>

                <template #action="{ record }">
                    <div style="display: flex; gap: 4px;">
                        <a-button type="link" size="small" @click="togglePlay(record)">
                            播放
                        </a-button>
                        <a-button type="link" size="small" @click="showEditModal(record)">
                            编辑
                        </a-button>
                        <a-popconfirm title="确认要删除这个特效音吗？" ok-text="确认" cancel-text="取消"
                            @confirm="() => deleteEffect(record.id)">
                            <a-button type="link" size="small" danger>
                                删除
                            </a-button>
                        </a-popconfirm>
                    </div>
                </template>
            </a-table>
        </div>

        <!-- 分页控制 -->
        <Pagination v-model:current="pagination.current" v-model:pageSize="pagination.pageSize"
            :total="pagination.total" @change="handlePaginationChange" />

        <!-- 特效音编辑模态框 -->
        <a-modal v-model:visible="editModalVisible" :title="currentEffect ? '编辑特效音信息' : '添加特效音'" width="800px"
            :maskClosable="false" @ok="handleEditSubmit" @cancel="closeEditModal">
            <a-form :model="effectForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" ref="effectFormRef">
                <a-form-item label="特效名称" name="name" :rules="[{ required: true, message: '请输入特效名称' }]">
                    <a-input v-model:value="effectForm.name" placeholder="请输入特效名称" />
                </a-form-item>
                <a-form-item label="适用场景" name="scene" :rules="[{ required: true, message: '请输入适用场景' }]">
                    <a-input v-model:value="effectForm.scene" placeholder="请输入适用场景" />
                </a-form-item>
                <a-form-item label="特效文件" v-if="!currentEffect">
                    <a-upload :beforeUpload="() => false" :showUploadList="false" @change="handleFileChange">
                        <a-button>选择特效文件</a-button>
                    </a-upload>
                    <div v-if="effectForm.audioFile" class="file-info">
                        已选择: {{ effectForm.audioFile.name }}
                    </div>
                </a-form-item>
                <a-form-item label="时长" v-if="currentEffect">
                    {{ formatDuration(effectForm.duration) }}
                </a-form-item>
                <a-form-item label="标签">
                    <TagSearch :tags="tagCategories" :show-actions="false" :allow-image-tagging="true"
                        :image-tags="effectForm.tags" @add-image-tag="addEffectTag"
                        @remove-image-tag="removeEffectTag" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import TagSearch from '@/components/TagSearch.vue';
import Pagination from '@/components/Pagination.vue';

// 搜索类型
const searchType = ref('basic');

// 基础查询表单
const basicForm = reactive({
    name: '',
    scene: '',
});

// 标签数据
const tagCategories = ref([
    {
        id: 1,
        name: '类型',
        tags: [
            { id: 'type_1', name: '环境音' },
            { id: 'type_2', name: '音效' },
            { id: 'type_3', name: '背景音乐' }
        ]
    },
    {
        id: 2,
        name: '场景',
        tags: [
            { id: 'scene_1', name: '开场' },
            { id: 'scene_2', name: '转场' },
            { id: 'scene_3', name: '高潮' },
            { id: 'scene_4', name: '结尾' }
        ]
    }
]);

// 选中的标签
const selectedTags = ref([]);

// 音效数据
const effectData = ref(generateMockEffects(50));

// 分页配置
const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0
});

// 生成模拟音效数据
function generateMockEffects(count) {
    const mockEffects = [];
    const types = ['type_1', 'type_2', 'type_3'];
    const scenes = ['scene_1', 'scene_2', 'scene_3', 'scene_4'];
    const uploaders = ['用户A', '用户B', '用户C', '用户D'];

    for (let i = 1; i <= count; i++) {
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomScene = scenes[Math.floor(Math.random() * scenes.length)];

        mockEffects.push({
            id: i,
            name: `音效${i}.mp3`,
            url: `https://www.example.com/audio/${Math.floor(Math.random() * 1000)}.mp3`,
            uploader: uploaders[Math.floor(Math.random() * uploaders.length)],
            uploadTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD'),
            tags: [randomType, randomScene],
            duration: Math.floor(Math.random() * 300) + 30 // 30-330秒
        });
    }

    return mockEffects;
}

// 播放状态
const currentPlaying = ref({ id: null });
const isPlaying = ref(false);


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
        title: '特效名称',
        dataIndex: 'name',
        key: 'name',
        slots: { customRender: 'name' }
    },
    {
        title: '时长',
        dataIndex: 'duration',
        key: 'duration',
        width: 100,
        align: 'center',
        slots: { customRender: 'duration' }
    },
    {
        title: '适用场景',
        dataIndex: 'scene',
        key: 'scene',
        width: 150
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

// 编辑模态框相关状态
const editModalVisible = ref(false);
const currentEffect = ref(null);
const effectForm = reactive({
    id: null,
    name: '',
    scene: '',
    duration: 0,
    audioFile: null,
    audioUrl: '',
    tags: []
});
const effectFormRef = ref(null);

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

// 格式化时长
const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 当前页显示的特效音
const currentPageEffects = computed(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredEffects.value.slice(start, end);
});

// 过滤后的特效音
const filteredEffects = computed(() => {
    const filtered = effectData.value.filter(effect => {
        if (searchType.value === 'basic') {
            const nameMatch = effect.name.toLowerCase().includes(
                (basicForm.name || '').toLowerCase()
            );
            const sceneMatch = (effect.scene || '').toLowerCase().includes(
                (basicForm.scene || '').toLowerCase()
            );
            return nameMatch && sceneMatch;
        }

        if (searchType.value === 'tag' && selectedTags.value.length > 0) {
            return selectedTags.value.some(tagId => effect.tags.includes(tagId));
        }

        return true;
    });

    pagination.total = filtered.length;
    return filtered;
});

// 切换播放状态
const togglePlay = (effect) => {
    const audioElement = document.querySelector(`audio[ref="audioPlayer_${effect.id}"]`);

    if (!audioElement) return;

    if (currentPlaying.value.id === effect.id) {
        if (isPlaying.value) {
            audioElement.pause();
            isPlaying.value = false;
        } else {
            audioElement.play();
            isPlaying.value = true;
        }
    } else {
        if (currentPlaying.value.id) {
            const prevAudioElement = document.querySelector(`audio[ref="audioPlayer_${currentPlaying.value.id}"]`);
            if (prevAudioElement) {
                prevAudioElement.pause();
                prevAudioElement.currentTime = 0;
            }
        }

        currentPlaying.value = effect;
        audioElement.currentTime = 0;
        audioElement.play();
        isPlaying.value = true;
    }
};
// 在script setup中添加
const uploadModalVisible = ref(false);
const uploadForm = reactive({
    name: '',
    audioFile: null,
    tags: []
});
const uploadFormRef = ref(null);

const showUploadModal = () => {
    uploadModalVisible.value = true;
};

const closeUploadModal = () => {
    uploadModalVisible.value = false;
    uploadFormRef.value?.resetFields();
    uploadForm.audioFile = null;
};

const handleUploadSubmit = async () => {
    try {
        await uploadFormRef.value.validate();

        effectData.value.unshift({
            id: Date.now(),
            name: uploadForm.name,
            duration: await getAudioDuration(uploadForm.audioFile),
            uploadTime: dayjs().format('YYYY-MM-DD HH:mm'),
            audioUrl: URL.createObjectURL(uploadForm.audioFile),
            tags: [...uploadForm.tags]
        });

        message.success('上传成功');
        closeUploadModal();
    } catch (error) {
        console.error('表单验证失败:', error);
    }
};

// 音频结束处理
const handleAudioEnded = () => {
    isPlaying.value = false;
    currentPlaying.value = { id: null };
};

// 搜索
const handleSearch = () => {
    pagination.current = 1;
};

// 重置基础查询
const resetBasicSearch = () => {
    basicForm.name = '';
    basicForm.scene = '';
    handleSearch();
};

// 分页变化处理
const handlePaginationChange = ({ current, pageSize }) => {
    pagination.current = current;
    pagination.pageSize = pageSize;
};

// 处理文件选择
const handleFileChange = (info) => {
    if (info.file) {
        effectForm.audioFile = info.file;
        effectForm.audioUrl = URL.createObjectURL(info.file);

        getAudioDuration(info.file).then(duration => {
            effectForm.duration = duration;
        });
    }
};

// 获取音频时长
const getAudioDuration = (file) => {
    return new Promise((resolve) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const reader = new FileReader();

        reader.onload = function (e) {
            audioContext.decodeAudioData(e.target.result, function (buffer) {
                resolve(Math.round(buffer.duration));
            });
        };

        reader.readAsArrayBuffer(file);
    });
};

// 显示编辑模态框
const showEditModal = (effect) => {
    currentEffect.value = effect;
    effectForm.id = effect.id;
    effectForm.name = effect.name;
    effectForm.scene = effect.scene;
    effectForm.duration = effect.duration;
    effectForm.audioUrl = effect.audioUrl;
    effectForm.tags = [...effect.tags];
    editModalVisible.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
    editModalVisible.value = false;
    currentEffect.value = null;
    effectForm.audioFile = null;
    effectFormRef.value?.resetFields();
};

// 添加特效音标签
const addEffectTag = (tagId) => {
    if (!effectForm.tags.includes(tagId)) {
        effectForm.tags.push(tagId);
    }
};

// 移除特效音标签
const removeEffectTag = (tagId) => {
    const index = effectForm.tags.indexOf(tagId);
    if (index > -1) {
        effectForm.tags.splice(index, 1);
    }
};

// 提交编辑
const handleEditSubmit = async () => {
    try {
        await effectFormRef.value.validate();

        if (currentEffect.value) {
            const index = effectData.value.findIndex(e => e.id === effectForm.id);
            if (index !== -1) {
                effectData.value[index] = {
                    ...effectData.value[index],
                    name: effectForm.name,
                    scene: effectForm.scene,
                    tags: [...effectForm.tags]
                };
            }
        } else {
            effectData.value.unshift({
                id: Date.now(),
                name: effectForm.name,
                scene: effectForm.scene,
                duration: effectForm.duration,
                audioUrl: effectForm.audioUrl,
                tags: [...effectForm.tags]
            });
        }

        message.success('保存成功');
        closeEditModal();
    } catch (error) {
        console.error('表单验证失败:', error);
    }
};

// 删除特效音
const deleteEffect = (effectId) => {
    const index = effectData.value.findIndex(e => e.id === effectId);
    if (index !== -1) {
        if (currentPlaying.value.id === effectId) {
            const audioElement = document.querySelector(`audio[ref="audioPlayer_${effectId}"]`);
            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
            }
            currentPlaying.value = { id: null };
            isPlaying.value = false;
        }

        effectData.value.splice(index, 1);
        message.success('删除成功');
    } else {
        message.error('删除失败');
    }
};

// 初始化
onMounted(() => {
    pagination.total = effectData.value.length;
});

// 组件卸载时停止所有音频
onUnmounted(() => {
    if (currentPlaying.value.id) {
        const audioElement = document.querySelector(`audio[ref="audioPlayer_${currentPlaying.value.id}"]`);
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
    }
});
</script>

<style scoped>
.effect-list-container {
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

.effect-table {
    flex: 1;
    margin-bottom: 20px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 16px;
}

.effect-name-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.effect-name-text {
    flex: 1;
}

.play-icon-wrapper {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
}

.play-icon {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: flex-end;
}

.play-bar {
    width: 3px;
    background-color: #1890ff;
    margin-right: 2px;
    transition: all 0.3s ease;
}

.play-bar1 {
    height: 8px;
}

.play-bar2 {
    height: 12px;
}

.play-bar3 {
    height: 16
}

.action-area {
    margin-bottom: 20px;
}

.file-info {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
}
</style>
