<template>
    <div class="tag-search-container">
        <div v-if="tags && tags.length">
            <div class="box box1">
                <div class="level-label">一级标签：</div>
                <div class="tags-container">
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
                    <template v-for="tag in secondLevelTags" :key="tag.id">
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
import { ref, watch } from 'vue';

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
const selectedFirstLevelTags = ref([]); // 选中的一级标签
const secondLevelTags = ref([]); // 当前显示的二级标签
const selectedTags = ref([]); // 选中的二级标签

// 鼠标悬停一级标签时显示对应的二级标签
const hoverFirstLevelTag = (category) => {
    if (category.tags && category.tags.length) {
        secondLevelTags.value = category.tags;
    } else {
        secondLevelTags.value = [];
    }
};

// 一级标签选择变化
const handleFirstLevelChange = (category, checked) => {
    if (checked) {
        selectedFirstLevelTags.value.push(category.id);
        // 如果该分类有二级标签，自动显示
        if (category.tags && category.tags.length) {
            secondLevelTags.value = category.tags;
        }
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
    secondLevelTags.value = [];
    emit('update:selectedTags', selectedTags.value);
    emit('search');
};

// 触发搜索
const handleSearch = () => {
    emit('search');
};

// 初始化显示所有二级标签
const initSecondLevelTags = () => {
    let arr = [];
    props.tags.forEach(v => {
        if (v.tags?.length) {
            arr = [...arr, ...v.tags];
        }
    });
    secondLevelTags.value = arr;
};

// 监听tags变化
watch(() => props.tags, () => {
    initSecondLevelTags();
}, { immediate: true });
</script>

<style scoped>
.tag-search-container {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
    /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); */
}

.box {
    display: flex;
    gap: 16px;
    /* 增加标签与标签名之间的间距 */
}

.level-label {
    font-weight: bold;
    white-space: nowrap;
    width: 100px;
    /* 稍微增加宽度 */
    flex-shrink: 0;
    padding-top: 4px;
    margin-right: 5px;
    /* 与标签对齐 */
}

.tags-container {
    flex: 1;
    max-height: 102px;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    /* 水平间距12px，垂直间距8px */
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
    /* 稍微增加高度 */
    line-height: 30px;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    font-size: 14px;
    padding: 0 12px;
    /* 增加内边距 */
    position: relative;
    overflow: hidden;
    margin: 2px 0;
    /* 上下留出空间 */
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

.box2 {
    margin-bottom: 10px;
}

.null-tags {
    text-align: center;
    height: 48px;
    color: rgba(204, 204, 204, 0.8);
}

.tag-search-actions {
    margin-top: 16px;
    text-align: right;
}

/* 可选中标签样式 */
:deep(.ant-tag-checkable) {
    height: 28px;
    line-height: 28px;
    border: 1px solid #e8e8e8;
    border-radius: 5px;
    font-size: 14px;
    padding: 0 10px;
    position: relative;
    overflow: hidden;
}

:deep(.ant-tag-checkable.has-child) {
    border: 1px solid rgba(85, 167, 34, 0.8);
}

:deep(.ant-tag-checkable-checked) {
    background: rgba(85, 167, 34, 0.1);
    border: 1px solid #55a722;
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

:deep(.ant-tag-checkable:hover) {
    background: rgba(85, 167, 34, 0.2) !important;
    border: 1px solid rgba(85, 167, 34, 0.2) !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .box {
        flex-direction: column;
        gap: 8px;
    }
}
</style>