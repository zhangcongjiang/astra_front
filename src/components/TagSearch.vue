<template>
    <div class="tag-search-container">
        <div v-if="tags && tags.length">
            <div class="box box1">
                <div class="level-label">一级标签：</div>
                <div class="tags-container" @mouseleave="resetHoverPreview">
                    <template v-for="category in tags" :key="category.id">
                        <a-checkable-tag :checked="selectedFirstLevelTags.includes(category.id)"
                            :class="{ 'has-child': category.tags && category.tags.length }"
                            @change="checked => handleFirstLevelChange(category, checked)"
                            @mouseenter="hoverFirstLevelTag(category)">
                            {{ category.name }}
                        </a-checkable-tag>
                    </template>
                </div>
            </div>
            <a-divider style="margin: 12px 0" dashed />
            <div class="box box2">
                <div class="level-label">二级标签：</div>
                <div class="tags-container">
                    <template v-for="tag in visibleSecondLevelTags" :key="tag.id">
                        <a-checkable-tag :checked="selectedTags.includes(tag.id)"
                            @change="checked => handleSecondLevelChange(tag.id, checked)">
                            {{ tag.name }}
                        </a-checkable-tag>
                    </template>
                </div>
            </div>
        </div>
        <div v-else class="null-tags">暂无标签，请前往标签管理添加！</div>
        <div class="tag-search-actions" v-if="showActions">
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="clearTags">清空</a-button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
    tags: {
        type: Array,
        default: () => []
    },
    showActions: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['search', 'update:selectedTags']);

// 标签相关状态
const selectedFirstLevelTags = ref([]);
const selectedTags = ref([]);
const hoverSecondLevelTags = ref([]);
const showHoverPreview = ref(false);
const allSecondLevelTags = ref([]);

// 计算当前显示的二级标签
const visibleSecondLevelTags = computed(() => {
    // 有悬停预览且没有选中一级标签时显示悬停预览
    if (showHoverPreview.value && selectedFirstLevelTags.value.length === 0) {
        return hoverSecondLevelTags.value;
    }
    // 选中了一级标签时显示对应的二级标签
    if (selectedFirstLevelTags.value.length > 0) {
        return getSelectedSecondLevelTags();
    }
    // 默认显示所有二级标签
    return allSecondLevelTags.value;
});

// 获取所有选中一级标签对应的二级标签
const getSelectedSecondLevelTags = () => {
    const tags = [];
    props.tags.forEach(category => {
        if (selectedFirstLevelTags.value.includes(category.id)) {
            tags.push(...(category.tags || []));
        }
    });
    return tags;
};

// 鼠标悬停一级标签
const hoverFirstLevelTag = (category) => {
    if (category.tags?.length) {
        hoverSecondLevelTags.value = category.tags;
        showHoverPreview.value = true;
    }
};

// 重置悬停预览
const resetHoverPreview = () => {
    showHoverPreview.value = false;
};

// 一级标签选择变化
const handleFirstLevelChange = (category, checked) => {
    if (checked) {
        selectedFirstLevelTags.value.push(category.id);
    } else {
        const index = selectedFirstLevelTags.value.indexOf(category.id);
        if (index > -1) {
            selectedFirstLevelTags.value.splice(index, 1);
        }
        // 移除该分类下的所有二级标签选择
        if (category.tags) {
            selectedTags.value = selectedTags.value.filter(
                tagId => !category.tags.some(tag => tag.id === tagId)
            );
            emit('update:selectedTags', selectedTags.value);
        }
    }
    resetHoverPreview();
};

// 二级标签选择变化
const handleSecondLevelChange = (tagId, checked) => {
    if (checked) {
        selectedTags.value.push(tagId);
    } else {
        const index = selectedTags.value.indexOf(tagId);
        if (index > -1) {
            selectedTags.value.splice(index, 1);
        }
    }
    emit('update:selectedTags', selectedTags.value);
};

// 清空所有标签选择
const clearTags = () => {
    selectedFirstLevelTags.value = [];
    selectedTags.value = [];
    resetHoverPreview();
    emit('update:selectedTags', selectedTags.value);
    emit('search');
};

// 触发搜索
const handleSearch = () => {
    resetHoverPreview();
    emit('search');
};

// 初始化所有二级标签
const initSecondLevelTags = () => {
    let arr = [];
    props.tags.forEach(v => {
        if (v.tags?.length) {
            arr = [...arr, ...v.tags];
        }
    });
    allSecondLevelTags.value = arr;
};

// 监听tags变化
watch(() => props.tags, () => {
    initSecondLevelTags();
}, { immediate: true });
</script>

<style scoped>
.tag-search-container {
    background: #fff;
    padding: 5px;
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
    gap: 5px;
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
}

.box>div:first-child {
    font-weight: bold;
    white-space: nowrap;
    width: 70px;
    flex-basis: 70px;
    flex-grow: 0;
}

.box>div:nth-child(2) {
    flex-basis: 0;
    flex-grow: 1;
    max-height: 102px;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.null-tags {
    text-align: center;
    height: 48px;
    color: rgba(204, 204, 204, 0.8);
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
    .box {
        flex-direction: column;
        gap: 8px;
    }
}
</style>