<template>
    <div class="transition-list-container">
        <!-- 搜索区域 -->
        <div class="search-area">
            <div class="search-header">
                <a-radio-group v-model:value="searchType" button-style="solid">
                    <a-radio-button value="basic">基础查询</a-radio-button>
                    <a-radio-button value="tag">标签查询</a-radio-button>
                </a-radio-group>
            </div>

            <div class="search-content">
                <!-- 基础查询 -->
                <div v-if="searchType === 'basic'" class="search-form">
                    <a-form layout="inline" :model="basicForm">
                        <a-form-item label="视频名称">
                            <a-input v-model:value="basicForm.name" placeholder="请输入视频名称" style="width: 200px;"
                                @pressEnter="handleSearch" />
                        </a-form-item>
                        <a-form-item label="用户">
                            <UserSelect v-model:value="basicForm.creator" placeholder="选择用户" style="width: 200px" />
                        </a-form-item>
                        <a-form-item label="方向">
                            <a-select v-model:value="basicForm.orientation" placeholder="请选择方向" style="width: 120px;"
                                allowClear>
                                <a-select-option value="">全部</a-select-option>
                                <a-select-option value="horizontal">横向</a-select-option>
                                <a-select-option value="vertical">纵向</a-select-option>
                            </a-select>
                        </a-form-item>
                        <a-form-item label="创建时间">
                            <a-range-picker v-model:value="basicForm.dateRange" style="width: 240px;"
                                :placeholder="['开始时间', '结束时间']"
                                @change="handleDateChange" />
                        </a-form-item>
                    </a-form>
                </div>

                <!-- 标签查询 -->
                <div v-else-if="searchType === 'tag'" class="tag-search">
                    <TagSearch v-model:selectedTags="selectedTags" :tags="tagCategories" :category="'VIDEO'"
                        :showActions="true" @search="handleSearch" @update:tags="fetchTagCategories" />
                </div>

                <!-- 搜索操作 -->
                <div class="search-actions" v-if="searchType === 'basic'">
                    <a-space>
                        <a-button type="primary" @click="handleSearch">
                            <SearchOutlined /> 查询
                        </a-button>
                        <a-button @click="resetBasicSearch">
                            <ReloadOutlined /> 重置
                        </a-button>
                    </a-space>
                </div>
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="content-area">
            <div class="content-header">
                <div class="content-title">视频列表</div>
                <div class="content-actions">
                    <a-button type="primary" @click="showUploadModal">
                        <UploadOutlined /> 上传视频
                    </a-button>
                </div>
            </div>

            <!-- 视频列表 -->
            <div class="card-list">
                <a-row :gutter="[16, 16]">
                    <a-col v-for="item in data" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                        <a-card class="transition-card" :bodyStyle="{ padding: '16px' }">
                            <div class="card-content">
                                <div class="transition-video">
                                    <!-- 视频播放器 -->
                                    <video :src="getVideoUrl(item)" controls preload="metadata"
                                        @error="handleVideoError">
                                        您的浏览器不支持视频播放
                                    </video>
                                </div>

                                <div class="card-info">
                                    <div class="video-name">{{ item.asset_name || item.name }}</div>

                                    <div class="meta-row">
                                        <div class="meta-item">
                                            <span class="label">时长:</span>
                                            <span class="value">{{ formatDuration(item.duration) }}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="label">大小:</span>
                                            <span class="value">{{ formatFileSize(item.spec?.file_size) }}</span>
                                        </div>
                                    </div>

                                    <div class="meta-row">
                                        <div class="meta-item">
                                            <span class="label">用户:</span>
                                            <span class="value">{{ item.uploader || item.creator || '-' }}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="label">创建时间:</span>
                                            <span class="value">{{ formatDate(item.create_time) }}</span>
                                        </div>
                                    </div>

                                    <div class="tags" v-if="getTagNames(item.tags).length > 0">
                                        <a-tag v-for="tag in getTagNames(item.tags)" :key="tag.id" color="blue"
                                            size="small" class="clickable-tag" @click="filterByTag(tag.id, tag.name)">
                                            {{ tag.name }}
                                        </a-tag>
                                    </div>
                                </div>

                                <div class="card-actions">
                                    <a-space>
                                        <a-button type="text" size="small" @click="showTagModal(item)">
                                            <TagOutlined /> 标签
                                        </a-button>
                                        <a-button type="text" size="small" @click="showAddToAssetModal(item)">
                                            <FolderAddOutlined /> 加入素材集
                                        </a-button>
                                        <a-dropdown>
                                            <template #overlay>
                                                <a-menu>
                                                    <a-menu-item key="download" @click="handleDownload(item)">
                                                        <DownloadOutlined /> 下载
                                                    </a-menu-item>
                                                    <a-menu-item key="edit" @click="handleEdit(item)">
                                                            <EditOutlined />
                                                            编辑
                                                        </a-menu-item>
                                                 
                                                    <a-menu-item key="delete" class="danger-item" @click="handleDelete(item)">
                                                        <DeleteOutlined /> 删除
                                                    </a-menu-item>
                                                </a-menu>
                                            </template>
                                            <a-button type="text" size="small">
                                                更多 <DownOutlined />
                                            </a-button>
                                        </a-dropdown>
                                    </a-space>
                                </div>
                            </div>
                        </a-card>
                    </a-col>
                </a-row>
            </div>

            <!-- 分页 -->
            <Pagination :current="pagination.current" :total="pagination.total" :pageSize="pagination.pageSize"
                :showSizeChanger="true" :showQuickJumper="true"
                :showTotal="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
                @change="handlePaginationChange" />
        </div>

        <!-- 标签编辑模态框 -->
        <a-modal v-model:open="tagModalVisible" title="编辑标签" @ok="handleTagSubmit" @cancel="closeTagModal" :width="600">
            <TagSearch :tags="tagCategories" :show-actions="false" :allowImageTagging="true"
                :image-tags="tagForm.currentTags" @add-image-tag="addVideoTag" @remove-image-tag="removeVideoTag" :category="'VIDEO'" />
        </a-modal>

        <!-- 上传视频模态框 -->
        <a-modal v-model:open="uploadModalVisible" title="上传视频" @ok="handleUploadSubmit" @cancel="closeUploadModal"
            :confirmLoading="uploadLoading" :width="500">
            <a-form ref="uploadFormRef" :model="uploadForm" layout="vertical">
                <a-form-item label="选择视频文件" name="videoFile" :rules="[{ required: true, message: '请选择视频文件' }]">
                    <div class="upload-area" :class="{ 'drag-over': isDragOver }" @dragover="handleDragOver"
                        @dragenter="handleDragEnter" @dragleave="handleDragLeave" @drop="handleDrop"
                        @click="() => $refs.fileInput?.click()">
                        <UploadOutlined style="font-size: 48px; color: #d9d9d9;" />
                        <div class="upload-text">
                            点击或拖拽文件到此区域上传<br>
                            支持格式：MP4、AVI、MOV、WMV、FLV、WebM、MKV
                        </div>
                        <div v-if="uploadForm.videoFile" class="file-info">
                            已选择：{{ uploadForm.videoFile.name }}
                        </div>
                    </div>
                    <input ref="fileInput" type="file" accept=".mp4,.avi,.mov,.wmv,.flv,.webm,.mkv"
                        style="display: none;" @change="(e) => handleFileChange({ file: e.target.files[0] })" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 编辑视频模态框 -->
        <a-modal v-model:open="editModalVisible" title="编辑视频" @ok="handleEditSubmit" @cancel="closeEditModal"
            :width="400">
            <a-form ref="editFormRef" :model="editForm" layout="vertical">
                <a-form-item label="视频名称" name="assetName" :rules="[{ required: true, message: '请输入视频名称' }]">
                    <a-input v-model:value="editForm.assetName" placeholder="请输入视频名称" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 加入素材集模态框 -->
        <a-modal
            v-model:open="addToAssetVisible"
            title="加入素材集"
            @ok="handleAddToAsset"
            @cancel="() => { addToAssetVisible = false; selectedAssetId = null; }"
            :confirm-loading="loadingAssets"
        >
            <div style="margin-bottom: 16px;">
                <strong>视频：</strong>{{ selectedVideo?.asset_name || selectedVideo?.name }}
            </div>
            <div>
                <strong>选择素材集：</strong>
                <a-select
                    v-model:value="selectedAssetId"
                    placeholder="请选择素材集"
                    style="width: 100%; margin-top: 8px;"
                    :loading="loadingAssets"
                >
                    <a-select-option
                        v-for="asset in assetCollections"
                        :key="asset.id"
                        :value="asset.id"
                    >
                        {{ asset.set_name }}
                    </a-select-option>
                </a-select>
            </div>
        </a-modal>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import {
    SearchOutlined,
    ReloadOutlined,
    UploadOutlined,
    EditOutlined,
    TagOutlined,
    DownloadOutlined,
    DeleteOutlined,
    FolderAddOutlined,
    DownOutlined
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';
import TagSearch from '@/components/TagSearch.vue';
import Pagination from '@/components/Pagination.vue';
import UserSelect from '@/components/UserSelect.vue';
import {
    getVideoAssetList,
    deleteVideoAsset,
    editVideoAsset,
    uploadVideoAsset
} from '@/api/modules/videoApi';
import { getTagsByCategory } from '@/api/modules/tagApi';
import { getAssetCollectionList, addItemToAsset } from '@/api/modules/assetApi';

// 搜索类型
const searchType = ref('basic');

// 基础查询表单
const basicForm = reactive({
    name: '',
    creator: '',
    orientation: '',
    dateRange: null
});

// 标签查询
const selectedTags = ref([]);
const tagCategories = ref([]);

// 数据和分页
const data = ref([]);
const loading = ref(false);
const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0
});

// 上传相关状态
const uploadModalVisible = ref(false);
const uploadLoading = ref(false);
const uploadForm = reactive({
    videoFile: null
});
const uploadFormRef = ref();

// 标签编辑相关状态
const tagModalVisible = ref(false);
const tagForm = reactive({
    assetId: null,
    currentTags: []
});

// 素材集相关变量
const addToAssetVisible = ref(false);
const selectedVideo = ref(null);
const assetCollections = ref([]);
const selectedAssetId = ref(null);
const loadingAssets = ref(false);

// 获取标签分类
const fetchTagCategories = async () => {
    try {
        const response = await getTagsByCategory({ category: 'VIDEO' });
        if (response?.code === 0) {
            // 转换数据结构，将tag_name映射为name
            tagCategories.value = response.data.map(tag => ({
                ...tag,
                name: tag.tag_name, // 将tag_name映射为name
                children: tag.children ? tag.children.map(child => ({
                    ...child,
                    name: child.tag_name
                })) : []
            }));
            console.log('**VIDEO tagCategories**:', tagCategories.value);
        }
    } catch (error) {
        console.error('获取VIDEO标签失败:', error);
        message.error('获取VIDEO标签失败');
    }
};

// 获取视频URL
const getVideoUrl = (item) => {
    if (!item?.spec?.file_path) {
        return '';
    }
    return `/media/${item.spec.file_path}`;
};

// 处理视频加载错误
const handleVideoError = (event) => {
    console.error('视频加载失败:', event);
    // 可以在这里添加更多错误处理逻辑
};

// 格式化时长
const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 格式化文件大小
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return '';
    return dayjs(dateString).format('YYYY-MM-DD HH:mm');
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

    // 返回包含标签名称和ID的对象数组，只显示存在的标签
    return tags.map(tag => {
        // 如果tag有tag_name属性，直接使用
        if (tag.tag_name) {
            // 验证标签是否仍然存在于tagCategories中
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
                name: foundTag.name || foundTag.tag_name
            };
        }
        return null; // 标签不存在，返回null
    }).filter(tag => tag && tag.name); // 过滤掉null值和没有名称的标签
};

// 获取数据
// 获取视频列表
const fetchData = async () => {
    try {
        loading.value = true;
        const params = {
            page: pagination.current,
            pageSize: pagination.pageSize
        };

        // 基础查询参数
        if (searchType.value === 'basic') {
            if (basicForm.name) params.name = basicForm.name;
            if (basicForm.creator) params.creator = basicForm.creator; // 传递用户ID
            if (basicForm.orientation) params.orientation = basicForm.orientation;
            if (basicForm.dateRange && basicForm.dateRange.length === 2) {
                params.start_time = dayjs(basicForm.dateRange[0]).format('YYYY-MM-DD HH:mm:ss');
                params.end_time = dayjs(basicForm.dateRange[1]).format('YYYY-MM-DD HH:mm:ss');
            }
        }

        // 标签查询参数
        if (searchType.value === 'tag' && selectedTags.value.length > 0) {
            params.tag_id = selectedTags.value.join(',');
        }

        const response = await getVideoAssetList(params);
        if (response?.code === 0) {
            // 映射数据，添加uploader字段
            data.value = response.data.results.map(item => ({
                ...item,
                uploader: item.username || item.creator || '未知', // 优先使用username字段
                tags: item.tags || [] // 确保tags字段存在
            }));
            
            pagination.total = response.data.count || 0;
        } else {
            message.error(response?.message || '获取视频列表失败');
        }
    } catch (error) {
        console.error('获取视频列表失败:', error);
        message.error('获取视频列表失败');
    } finally {
        loading.value = false;
    }
};

// 搜索
const handleSearch = () => {
    pagination.current = 1;
    fetchData();
};

// 分页变化
const handlePaginationChange = (page, pageSize) => {
    pagination.current = page;
    pagination.pageSize = pageSize;
    fetchData();
};

// 重置基础搜索
const resetBasicSearch = () => {
    basicForm.name = '';
    basicForm.creator = ''; // 重置用户字段
    basicForm.orientation = '';
    basicForm.dateRange = null;
    handleSearch();
};

// 日期变化
const handleDateChange = (dates) => {
    basicForm.dateRange = dates;
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

// 显示上传模态框
const showUploadModal = () => {
    uploadModalVisible.value = true;
};

// 关闭上传模态框
const closeUploadModal = () => {
    uploadModalVisible.value = false;
    uploadForm.videoFile = null;
    uploadFormRef.value?.resetFields();
};

// 处理文件选择
const handleFileChange = (info) => {
    uploadForm.videoFile = info.file;
};

// 添加拖拽相关状态
const isDragOver = ref(false);

// 拖拽处理函数
const handleDragOver = (e) => {
    e.preventDefault();
};

const handleDragEnter = (e) => {
    e.preventDefault();
    isDragOver.value = true;
};

const handleDragLeave = (e) => {
    e.preventDefault();
    isDragOver.value = false;
};

const handleDrop = (e) => {
    e.preventDefault();
    isDragOver.value = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        // 检查文件类型
        const allowedTypes = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (allowedTypes.includes(fileExtension)) {
            uploadForm.videoFile = file;
        } else {
            message.error('请选择支持的视频格式文件');
        }
    }
};

// 提交上传
const handleUploadSubmit = async () => {
    try {
        await uploadFormRef.value?.validate();

        if (!uploadForm.videoFile) {
            message.error('请选择视频文件');
            return;
        }

        uploadLoading.value = true;

        const formData = new FormData();
        formData.append('video_file', uploadForm.videoFile);

        const response = await uploadVideoAsset(formData);
        if (response?.code === 0) {
            message.success('视频上传成功');
            closeUploadModal();
            fetchData(); // 刷新列表
        } else {
            message.error(response?.message || '上传失败');
        }
    } catch (error) {
        console.error('上传视频失败:', error);
        message.error('上传失败');
    } finally {
        uploadLoading.value = false;
    }
};

// 编辑相关状态
const editModalVisible = ref(false);
const editForm = reactive({
    assetId: '',
    assetName: ''
});
const editFormRef = ref();

// 编辑视频
const handleEdit = (item) => {
    editForm.assetId = item.id;
    editForm.assetName = item.asset_name;
    editModalVisible.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
    editModalVisible.value = false;
    editForm.assetId = '';
    editForm.assetName = '';
    editFormRef.value?.resetFields();
};

// 提交编辑
const handleEditSubmit = async () => {
    try {
        await editFormRef.value?.validate();

        const formData = new FormData();
        formData.append('asset_id', editForm.assetId);
        formData.append('asset_name', editForm.assetName);

        const response = await editVideoAsset(formData);

        if (response?.code === 0) {
            // 更新本地数据
            const index = data.value.findIndex(item => item.id === editForm.assetId);
            if (index !== -1) {
                data.value[index].asset_name = editForm.assetName;
            }

            message.success('视频名称修改成功');
            closeEditModal();
        } else {
            message.error(response?.message || '修改失败');
        }
    } catch (error) {
        console.error('编辑视频失败:', error);
        message.error('修改失败，请重试');
    }
};

// 显示标签编辑模态框
const showTagModal = (video) => {
    tagForm.assetId = video.id;
    tagForm.currentTags = video.tags.map(tag => tag.id);
    console.log('显示标签编辑模态框，当前标签ID：', tagForm.currentTags);
    tagModalVisible.value = true;
};

// 关闭标签编辑模态框
const closeTagModal = () => {
    tagModalVisible.value = false;
    tagForm.assetId = null;
    tagForm.currentTags = [];
};

// 添加视频标签
const addVideoTag = (tagId) => {
    if (!tagForm.currentTags.includes(tagId)) {
        tagForm.currentTags.push(tagId);
        console.log('添加视频标签ID:', tagId, '当前标签:', tagForm.currentTags);
    }
};

// 移除视频标签
const removeVideoTag = (tagId) => {
    const index = tagForm.currentTags.indexOf(tagId);
    if (index > -1) {
        tagForm.currentTags.splice(index, 1);
        console.log('移除视频标签ID:', tagId, '当前标签:', tagForm.currentTags);
    }
};

// 提交标签编辑
const handleTagSubmit = async () => {
    try {
        const editData = {
            asset_id: tagForm.assetId,
            tag_ids: tagForm.currentTags
        };

        const response = await editVideoAsset(editData);
        if (response.code === 0) {
            const videoIndex = data.value.findIndex(v => v.id === tagForm.assetId);
            if (videoIndex !== -1) {
                data.value[videoIndex].tags = response.data.tags || [];
            }
            message.success('标签更新成功');
            closeTagModal();
            fetchData();
        } else {
            message.error(response.message || '标签更新失败');
        }
    } catch (error) {
        console.error('更新标签失败:', error);
        message.error('标签更新失败');
    }
};

// 下载视频
const handleDownload = (item) => {
    if (item.file_url) {
        const link = document.createElement('a');
        link.href = item.file_url;
        link.download = item.name || 'video';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('开始下载');
    } else {
        message.error('下载链接不可用');
    }
};

// 删除视频
const handleDelete = (item) => {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除视频 "${item.name}" 吗？此操作不可撤销。`,
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
            try {
                const response = await deleteVideoAsset(item.id);
                if (response?.code === 0) {
                    message.success('删除成功');
                    fetchData();
                } else {
                    message.error(response?.message || '删除失败');
                }
            } catch (error) {
                console.error('删除视频失败:', error);
                message.error('删除失败');
            }
        }
    });
};

// 组件挂载时获取数据
onMounted(() => {
    fetchData();
    fetchTagCategories();
});

// 显示加入素材集模态框
const showAddToAssetModal = async (video) => {
    selectedVideo.value = video;
    addToAssetVisible.value = true;
    await fetchAssetCollections();
};

// 获取素材集列表
const fetchAssetCollections = async () => {
    try {
        loadingAssets.value = true;
        console.log('开始获取素材集列表...');
        const response = await getAssetCollectionList({});
        console.log('素材集API返回:', response);
        
        if (response && response.results && Array.isArray(response.results)) {
            assetCollections.value = response.results;
            console.log('素材集列表:', assetCollections.value);
        } else {
            console.warn('素材集数据格式异常:', response);
            assetCollections.value = [];
        }
    } catch (error) {
        console.error('获取素材集列表失败:', error);
        message.error('获取素材集列表失败');
        assetCollections.value = [];
    } finally {
        loadingAssets.value = false;
    }
};

// 处理加入素材集
const handleAddToAsset = async () => {
    if (!selectedAssetId.value) {
        message.warning('请选择素材集');
        return;
    }
    
    try {
        loadingAssets.value = true;
        const response = await addItemToAsset({
            set_id: selectedAssetId.value,
            resource_id: selectedVideo.value.id,
            asset_type: 'video'
        });
        
        if (response.code === 0) {
            message.success('加入素材集成功');
            addToAssetVisible.value = false;
            selectedAssetId.value = null;
        } else {
            message.error(response.message || '加入素材集失败');
        }
    } catch (error) {
        console.error('加入素材集失败:', error);
        message.error('加入素材集失败');
    } finally {
        loadingAssets.value = false;
    }
};
</script>

<style scoped>
.transition-list-container {
    padding: 20px;
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

.search-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
}

.search-form {
    flex: 1;
}

.tag-search {
    flex: 1;
    /* 添加这行，让标签查询也占据全宽 */
    margin-top: 16px;
}

.content-area {
    margin-bottom: 20px;
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.content-title {
    font-size: 18px;
    font-weight: 600;
    color: #262626;
}

.content-actions {
    /* 上传按钮样式 */
}

.card-list {
    margin-bottom: 20px;
}

.transition-card {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 12px;
    overflow: hidden;
}

.transition-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-content {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.card-info {
    padding: 12px 0;
    flex: 1;
}

.video-name {
    font-size: 16px;
    font-weight: 700;
    color: #262626;
    margin-bottom: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.transition-video {
    width: 100%;
    aspect-ratio: 16/9;
    background: #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 12px;
}

.transition-video video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.meta-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
    line-height: 1.5;
}

.meta-item {
    flex: 1;
    display: flex;
    align-items: baseline;
}

.meta-item:first-child {
    margin-right: 12px;
}

.label {
    color: #8c8c8c;
    font-size: 12px;
    margin-right: 4px;
    white-space: nowrap;
    line-height: 1.5;
}

.value {
    color: #595959;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tags {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.clickable-tag {
    cursor: pointer;
    transition: all 0.2s ease;
}

.clickable-tag:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-actions {
    padding: 12px 0 0 0;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: flex-end;
}

.card-actions .ant-btn {
    border: none;
    box-shadow: none;
    transition: all 0.2s ease;
}

.card-actions .ant-btn:hover {
    background-color: #f5f5f5;
    transform: scale(1.1);
}

.danger-item {
    color: #ff4d4f !important;
}

.danger-item:hover {
    background-color: #fff2f0 !important;
}

.upload-area {
    border: 2px dashed #d9d9d9;
    border-radius: 6px;
    padding: 20px;
    text-align: center;
    transition: border-color 0.3s ease;
    cursor: pointer;
}

.upload-area:hover {
    border-color: #1890ff;
}

.upload-area.drag-over {
    border-color: #1890ff;
    background-color: #f0f8ff;
}

.upload-text {
    margin-top: 8px;
    color: #8c8c8c;
    font-size: 14px;
}

.file-info {
    margin-top: 8px;
    color: #52c41a;
    font-size: 12px;
}

@media (max-width: 768px) {
    .search-content {
        flex-direction: column;
        gap: 16px;
    }

    .search-actions {
        padding-top: 0;
        align-self: flex-end;
    }

    .content-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .meta-row {
        flex-direction: column;
        align-items: flex-start;
    }

    .meta-item:first-child {
        margin-right: 0;
        margin-bottom: 4px;
    }
}
</style>