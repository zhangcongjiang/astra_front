import { createRouter, createWebHistory } from 'vue-router'
import MenuView from '../views/MenuView.vue'
import ImageList from '@/views/images/ImageList.vue'
import MusicList from '@/views/musics/MusicList.vue'
import VideoTemplateList from '@/views/videos/VideoTemplateList.vue'
import VideoTemplateApply from '@/views/videos/VideoTemplateApply.vue'
import MyVideo from '@/views/videos/MyVideo.vue'
import SpeakerList from '@/views/musics/SpeakerList.vue'
import MySound from '@/views/musics/MySound.vue'
import SystemSoundSettings from '@/views/settings/SystemSoundSettings.vue'
import SystemVideoSettings from '@/views/settings/SystemVideoSettings.vue'
import DataVisualList from '@/views/videos/DataVisualList.vue'
import DataVisualApply from '@/views/videos/DataVisualApply.vue'
import GraphicTextList from '@/views/texts/GraphicTextList.vue'
import VideoList from '@/views/videos/VideoList.vue'
import AssetList from '@/views/assets/AssetList.vue'
import VideoDraftList from '@/views/assets/VideoDraftList.vue'
import AssetDetail from '@/views/assets/AssetDetail.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        // 登录页面路由
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/Login.vue'),
            meta: {
                requiresGuest: true, // 只有未登录用户可以访问
                title: '用户登录'
            }
        },
        {
            path: '/',
            name: 'home',
            component: MenuView,
            redirect: '/dashboard', // 默认重定向到工作台
            children: [
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: () => import('../views/Dashboard.vue') // 工作台组件
                },
                {
                    path: '/news',
                    name: 'NewsList',
                    component: () => import('@/views/news/NewsList.vue'),
                    meta: { title: '热点新闻' }
                },
                {
                    path: '/news/:id',
                    name: 'NewsDetail',
                    component: () => import('@/views/news/NewsDetail.vue'),
                    meta: { title: '新闻详情' }
                },
                {
                    path: 'images',
                    name: 'images',
                    component: ImageList // 图片列表组件
                },
                {
                    path: 'musics',
                    name: 'musics',
                    component: MusicList // 音乐列表组件
                },
                {
                    path: 'speakers',
                    name: 'speakers',
                    component: SpeakerList // 工作台组件
                }, {
                    path: 'templates',
                    name: 'templates',
                    component: VideoTemplateList, // 视频模板
                },
                {
                    path: '/templates/apply/:id',
                    name: 'VideoTemplateApply',
                    component: VideoTemplateApply,
                    props: true
                },
                {
                    path: 'data-visuals',
                    name: 'data-visuals',
                    component: DataVisualList // 工作台组件
                }, {
                    path: 'data-visuals/apply/:id',
                    name: 'data-visuals-apply',
                    component: DataVisualApply // 工作台组件
                },
                {
                    path: 'my-sounds',
                    name: 'my-sounds',
                    component: MySound // 工作台组件
                },
                {
                    path: 'my-videos',
                    name: 'my-videos',
                    component: MyVideo // 工作台组件
                },
                {
                    path: 'my-videos/:id',
                    name: 'video-detail',
                    component: () => import('@/views/videos/VideoDetail.vue'),
                    meta: { title: '视频详情' },
                    props: true
                },
                {
                    path: 'system-video',
                    name: 'system-video',
                    component: SystemVideoSettings // 修改为新的系统视频设置组件
                },
                {
                    path: 'system-sound',
                    name: 'system-sound',
                    component: SystemSoundSettings // 修改为新的系统音频设置组件
                },
                {
                    path: 'drafts',
                    name: 'drafts',
                    component: VideoDraftList,
                    meta: { title: '视频草稿' }
                },
                // 在children数组中添加
                {
                    path: 'dynamics',
                    name: 'dynamics',
                    component: () => import('@/views/dynamics/DynamicList.vue'),
                    meta: { title: '我的动态' }
                },
                {
                    path: 'dynamics/:id',
                    name: 'dynamic-detail',
                    component: () => import('@/views/dynamics/DynamicDetail.vue'),
                    meta: { title: '动态详情' },
                    props: true
                },
                {
                    path: 'texts',
                    name: 'texts',
                    component: GraphicTextList,
                    meta: { title: '我的图文' }
                },
                {
                    path: 'text-tools',
                    name: 'text-tools',
                    component: () => import('@/views/tools/ToolPage.vue'),
                    meta: { title: '文本工具' },
                    props: { category: 'text' }  // 确保这里正确传递category
                },
                {
                    path: 'image-tools',
                    name: 'image-tools',
                    component: () => import('@/views/tools/ToolPage.vue'),
                    meta: { title: '图像工具' },
                    props: { category: 'image' }
                },
                {
                    path: 'image-search',
                    name: 'image-search',
                    component: () => import('@/views/tools/ImageSearch.vue'),
                    meta: { title: '图片搜索' }
                },
                {
                    path: 'audio-tools',
                    name: 'audio-tools',
                    component: () => import('@/views/tools/ToolPage.vue'),
                    meta: { title: '音频工具' },
                    props: { category: 'audio' }
                },
                {
                    path: 'video-tools',
                    name: 'video-tools',
                    component: () => import('@/views/tools/ToolPage.vue'),
                    meta: { title: '视频工具' },
                    props: { category: 'video' }
                },
                {
                    path: 'other-tools',
                    name: 'other-tools',
                    component: () => import('@/views/tools/ToolPage.vue'),
                    meta: { title: '其他工具' },
                    props: { category: 'other' }
                },

                {
                    path: 'assets',
                    name: 'assets',
                    component: AssetList,
                    meta: { title: '素材集' }
                },
                {
                    path: 'assets/:id',
                    name: 'asset-detail',
                    component: AssetDetail,
                    meta: { title: '素材集详情' },
                    props: true
                },
                {
                    path: '/videos',
                    name: 'videos',
                    component: VideoList,
                    meta: { title: '视频素材管理' }
                },
                {
                    path: '/texts/create/:id?',
                    name: 'GraphicTextCreate',
                    component: () => import('@/views/texts/GraphicTextCreate.vue'),
                    meta: { title: '创建图文' }
                },
                {
                    path: '/my-accounts',
                    name: 'AccountManage',
                    component: () => import('@/views/account/AccountManage.vue'),
                    meta: { title: '账号管理' }
                },
                {
                    path: '/user-profile',
                    name: 'UserProfile',
                    component: () => import('@/views/account/UserProfile.vue'),
                    meta: { title: '个人信息' }
                },
                {
                    path: '/my-tasks',
                    name: 'MyTasks',
                    component: () => import('@/views/tasks/TaskManagement.vue'),
                    meta: { title: '我的任务' }
                },
                {
                    path: '/tasks/:id',
                    name: 'task-detail',
                    component: () => import('@/views/tasks/TaskDetail.vue'),
                    meta: { title: '任务详情' }
                },
                // 添加异常页面路由
                {
                    path: '/exception/403',
                    name: '403',
                    component: () => import('@/views/exception/403.vue'),
                    meta: { title: '403 无权限' }
                },
                {
                    path: '/exception/404',
                    name: '404',
                    component: () => import('@/views/exception/404.vue'),
                    meta: { title: '404 页面未找到' }
                },
                {
                    path: '/exception/500',
                    name: '500',
                    component: () => import('@/views/exception/500.vue'),
                    meta: { title: '500 服务器错误' }
                },
                // 添加404通配符路由，必须放在最后
                {
                    path: '/:pathMatch(.*)*',
                    name: 'not-found',
                    component: () => import('@/views/exception/404.vue'),
                    meta: { title: '404 页面未找到' }
                }
            ]
        }
    ]
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 如果还没有检查过认证状态，先检查一次
    if (!authStore.user && !authStore.loading) {
        try {
            await authStore.checkAuth()
        } catch (error) {
            // 认证失败，继续执行后续逻辑
        }
    }

    // 如果用户未认证且访问的不是登录页
    if (!authStore.isAuthenticated && to.path !== '/login') {
        next('/login')
        return
    }

    // 如果用户已认证且访问登录页，重定向到首页
    if (authStore.isAuthenticated && to.path === '/login') {
        next('/')
        return
    }

    // 检查是否需要管理员权限
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
        console.error('需要管理员权限')
        next('/')
        return
    }

    next()
})

export default router
