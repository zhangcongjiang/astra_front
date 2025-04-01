<template>
    <div class="app-container">
        <!-- 顶部导航栏（包含Logo和一级菜单） -->
        <div class="top-nav">
            <!-- Logo区域 -->
            <div class="logo-container" @click="goToDashboard">
                <img src="@/assets/logo.png" alt="Logo" class="logo">
                <span class="logo-text">ASTRA</span>
            </div>

            <!-- 一级菜单 -->
            <div class="top-menu">
                <div v-for="(item, index) in topMenu" :key="item.id" class="top-menu-item"
                    :class="{ 'active': activeTopMenu === index }" @click="selectTopMenu(index)">
                    {{ item.name }}
                </div>
            </div>
        </div>

        <!-- 主体内容区 -->
        <div class="main-content">
            <!-- 左侧二级菜单 -->
            <div class="left-menu">
                <div v-for="(item, index) in leftMenu" :key="item.id" class="left-menu-item"
                    :class="{ 'active': activeLeftMenu === index }" @click="selectLeftMenu(index)">
                    {{ item.name }}
                </div>
            </div>

            <!-- 右侧内容区 -->
            <div class="content">
                <router-view></router-view>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
// 菜单数据
const menuData = [
    {
        id: 1,
        name: '工作台',
        children: [
            { id: 11, name: '工作台', content: '这里是用户工作台...', path: '/dashboard' }
        ]
    },
    {
        id: 2,
        name: '文本素材',
        children: [
            { id: 21, name: '视频文案', content: '这里是视频文案管理...', path: '/video-texts' }
        ]
    },
    {
        id: 3,
        name: '图像管理',
        children: [
            { id: 31, name: '图片列表', content: '这里是用户收集的普通图片...', path: '/images' },
            { id: 32, name: '背景图片', content: '这里是用户可能使用到的背景图片...', path: '/backgrounds' }
        ]
    },
    {
        id: 4,  // 修改前是2，现在改为4
        name: '音频管理',
        children: [
            { id: 41, name: '背景音乐', content: '这里是背景音乐的内容...', path: '/musics' },
            { id: 42, name: '声音特效', content: '这里是声音特效的内容...', path: '/effects' },
            { id: 43, name: '音色管理', content: '这里是朗读者音色的内容...', path: '/speakers' },
        ]
    },
    {
        id: 5,  // 修改前是4，现在改为5
        name: '视频管理',
        children: [
            { id: 51, name: '视频模板', content: '这里是视频管理的内容...', path: '/templates' },
            { id: 52, name: '沙雕动画', content: '这里是沙雕动画的内容...', path: '/shadiao' },
            { id: 53, name: '数据可视化', content: '这里是数据列表动态生成视频的模板内容...', path: '/data-visuals' },
            { id: 54, name: '转场视频', content: '这里是转场视频内容列表...', path: '/transitions' },
        ]
    },
    {
        id: 6,  // 修改前是5，现在改为6
        name: '个人中心',
        children: [
            { id: 61, name: '我的图文', content: '这里是用户创建的图文内容...', path: '/texts' },
            { id: 62, name: '我的视频', content: '这里是平台生成的视频内容...', path: '/my-videos' },
            { id: 63, name: '我的音频', content: '这里是平台生成的音频内容...', path: '/my-sounds' }
        ]
    },
    {
        id: 7,  // 修改前是6，现在改为7
        name: '系统设置',
        children: [
            { id: 71, name: '视频设置', content: '这里是系统设置内容...', path: '/system-video' },
            { id: 72, name: '音频设置', content: '这里是系统设置内容...', path: '/system-sound' }
        ]
    },
    {
        id: 8,  // 新增实用工具菜单
        name: '实用工具',
        children: [
            { id: 81, name: '文本工具', content: '提供各种文本处理工具...', path: '/text-tools' },
            { id: 82, name: '图像工具', content: '提供图像处理和转换工具...', path: '/image-tools' },
            { id: 83, name: '音频工具', content: '提供音频编辑和处理工具...', path: '/audio-tools' },
            { id: 84, name: '视频工具', content: '提供视频编辑和处理工具...', path: '/video-tools' }
        ]
    }
];

const goToDashboard = () => {

    activeTopMenu.value = 0;
    activeLeftMenu.value = 0;
    router.push(menuData[0].children[0].path);
};

// 当前选中的一级菜单索引
const activeTopMenu = ref(0);
// 当前选中的二级菜单索引
const activeLeftMenu = ref(0);

// 顶部一级菜单
const topMenu = computed(() => {
    return menuData.map(item => ({
        id: item.id,
        name: item.name
    }));
});

// 左侧二级菜单
const leftMenu = computed(() => {
    return menuData[activeTopMenu.value]?.children || [];
});

// 当前内容标题
const currentContentTitle = computed(() => {
    return leftMenu.value[activeLeftMenu.value]?.name || '';
});

// 当前内容
const currentContent = computed(() => {
    return leftMenu.value[activeLeftMenu.value]?.content || '';
});

// 选择一级菜单
const selectTopMenu = (index) => {
    activeTopMenu.value = index;
    activeLeftMenu.value = 0; // 重置二级菜单选中项
    // 跳转到该一级菜单的第一个二级菜单
    if (menuData[index]?.children?.length > 0) {  // 修改这里，增加子菜单存在性检查
        router.push(menuData[index].children[0].path);
    } else {
        // 如果没有子菜单，可以跳转到默认页面或保持当前页面
        router.push('/dashboard');
    }
};

// 选择二级菜单
const selectLeftMenu = (index) => {
    activeLeftMenu.value = index;
    const currentMenu = leftMenu.value[index];
    if (currentMenu?.path) {
        router.push(currentMenu.path);
    }
};
</script>

<style scoped>
/* 基础布局 */
.app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
}

/* 顶部导航栏样式 */
.top-nav {
    display: flex;
    height: 60px;
    background-color: #2c3e50;
    color: white;
    align-items: center;
    padding: 0 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;
}

/* Logo区域样式 */
.logo-container {
    display: flex;
    align-items: center;
    margin-right: 50px;
    cursor: pointer;
    transition: all 0.3s;
}

.logo-container:hover {
    opacity: 0.8;
}

.logo-container:active {
    transform: scale(0.98);
}

.logo {
    width: 36px;
    height: 36px;
    margin-right: 10px;
    object-fit: contain;
}

.logo-text {
    font-size: 18px;
    font-weight: bold;
    color: #ffffff;
    letter-spacing: 1px;
}

/* 一级菜单样式 */
.top-menu {
    display: flex;
    height: 100%;
}

.top-menu-item {
    padding: 0 20px;
    line-height: 60px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 18px;
    position: relative;
}

.top-menu-item:hover {
    background-color: #34495e;
}

.top-menu-item.active {
    background-color: #1abc9c;
}

.top-menu-item.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #ffffff;
}

/* 主体内容区 */
.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* 左侧菜单样式 */
.left-menu {
    width: 184px;
    background-color: #ffffff;
    border-right: 1px solid #eaeaea;
    overflow-y: auto;
    padding: 10px 0;
}

.left-menu-item {
    padding: 12px 25px;
    cursor: pointer;
    transition: all 0.3s;
    color: #555;
    font-size: 18px;
    border-left: 3px solid transparent;
}

.left-menu-item:hover {
    background-color: #f5f5f5;
    color: #333;
}

.left-menu-item.active {
    background-color: #f0f9ff;
    color: #1abc9c;
    border-left: 3px solid #1abc9c;
    font-weight: 500;
}

/* 内容区域样式 */
.content {
    flex: 1;
    padding: 0;
    overflow-y: auto;
    background-color: #f9f9f9;
}

.content h2 {
    margin-bottom: 20px;
    color: #2c3e50;
    font-size: 22px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.content-body {
    line-height: 1.8;
    color: #555;
    padding: 10px;
    background-color: white;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>