<template>
    <n-message-provider>
        <div class="app-container">
            <!-- 顶部导航栏（包含Logo和一级菜单） -->
            <div class="top-nav">
                <!-- Logo区域 -->
                <div class="logo-container" @click="goToDashboard">
                    <img src="@/assets/logo/logo.png" alt="Logo" class="logo">
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
    </n-message-provider>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NMessageProvider } from 'naive-ui';
const router = useRouter();
// 菜单数据
const menuData = [
    {
        id: 1,
        name: '工作台',
        children: [
            { id: 11, name: '工作台', content: '这里是用户工作台...', path: '/dashboard' },
            { id: 12, name: '我的图文', content: '这里是用户创建的图文内容...', path: '/texts' },
            { id: 13, name: '我的视频', content: '这里是平台生成的视频内容...', path: '/my-videos' },
            { id: 14, name: '我的音频', content: '这里是平台生成的音频内容...', path: '/my-sounds' },
            { id: 15, name: '我的账号', content: '这里是我各个平台的账号...', path: '/my-accounts' },
            { id: 16, name: '我的任务', content: '这里是我的任务...', path: '/my-tasks' }
        ]
    },
    {
        id: 2,
        name: '素材中心',
        children: [
            { id: 21, name: '图像素材', content: '这里是用户收集的普通图片...', path: '/images' },
            { id: 22, name: '音乐素材', content: '这里是背景音乐的内容...', path: '/musics' },
            { id: 23, name: '朗读者', content: '这里是朗读者音色的内容...', path: '/speakers' },
        { id: 24, name: '视频素材', content: '这里是视频素材内容列表...', path: '/videos' },
        ]
    },
    {
        id: 3,  // 修改前是2，现在改为4
        name: '文案中心',
        children: [
        { id: 31, name: '文案集', content: '这里是视频文案管理...', path: '/video-texts' },
            { id: 32, name: '素材集', content: '这里是素材资源的内容...', path: '/assets' },
            
        ]
    }, 
    {
        id: 4,  // 修改前是4，现在改为5
        name: '视频模板',
        children: [
            { id: 41, name: '视频模板', content: '这里是视频管理的内容...', path: '/templates' },
            { id: 42, name: '数据可视化', content: '这里是数据列表动态生成视频的模板内容...', path: '/data-visuals' },

        ]
    },
    {
        id: 5,  
        name: '实用工具',
        children: [
            { id: 51, name: '文本工具', content: '提供各种文本处理工具...', path: '/text-tools' },
            { id: 52, name: '图像工具', content: '提供图像处理和转换工具...', path: '/image-tools' },
            { id: 53, name: '音频工具', content: '提供音频编辑和处理工具...', path: '/audio-tools' },
            { id: 54, name: '视频工具', content: '提供视频编辑和处理工具...', path: '/video-tools' },
            { id: 55, name: '其他工具', content: '提供其他收录的工具...', path: '/other-tools' }
        ]
    }, {
        id: 6,  
        name: '系统设置',
        children: [
            { id: 61, name: '视频设置', content: '这里是系统设置内容...', path: '/system-video' },
            { id: 62, name: '音频设置', content: '这里是系统设置内容...', path: '/system-sound' }
        ]
    },
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

// 监听路由变化并更新菜单选中状态
onMounted(() => {
    // 初始化时设置菜单状态
    const currentPath = router.currentRoute.value.path;
    menuData.forEach((topItem, topIndex) => {
        topItem.children?.forEach((subItem, subIndex) => {
            if (subItem.path === currentPath) {
                activeTopMenu.value = topIndex;
                activeLeftMenu.value = subIndex;
            }
        });
    });
    
    // 监听路由变化
    router.afterEach((to) => {
        // 遍历menuData查找匹配的路由
        menuData.forEach((topItem, topIndex) => {
            topItem.children?.forEach((subItem, subIndex) => {
                if (subItem.path === to.path) {
                    activeTopMenu.value = topIndex;
                    activeLeftMenu.value = subIndex;
                }
            });
        });
    });
});
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
    font-size: 22px;
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
    font-size: 22px;
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
    font-size: 22px;
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