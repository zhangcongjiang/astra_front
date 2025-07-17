import { createRouter, createWebHistory } from 'vue-router'
import MenuView from '../views/MenuView.vue'
import ImageList from '@/views/images/ImageList.vue'
import MusicList from '@/views/musics/MusicList.vue'
import VideoTemplateList from '@/views/videos/VideoTemplateList.vue'
import VideoTemplateApply from '@/views/videos/VideoTemplateApply.vue'
import BackgroundList from '@/views/images/BackgroundList.vue'
import MyVideo from '@/views/videos/MyVideo.vue'
import SpeakerList from '@/views/musics/SpeakerList.vue'
import MySound from '@/views/musics/MySound.vue'
import SystemSoundSettings from '@/views/settings/SystemSoundSettings.vue'
import SystemVideoSettings from '@/views/settings/SystemVideoSettings.vue'
import DataVisualList from '@/views/videos/DataVisualList.vue'
import DataVisualApply from '@/views/videos/DataVisualApply.vue'
import VideoTextList from '@/views/videos/VideoTextList.vue'
import GraphicTextList from '@/views/texts/GraphicTextList.vue'
import TransitionList from '@/views/videos/TransitionList.vue'
import VideoList from '@/views/videos/VideoList.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
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
                    path: 'images',
                    name: 'images',
                    component: ImageList // 图片列表组件
                },
                {
                    path: 'backgrounds',
                    name: 'BackgroundList',
                    component: BackgroundList,
                    meta: { title: '背景图片管理' }
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
                    path: 'video-texts',
                    name: 'video-texts',
                    component: VideoTextList,
                    meta: { title: '视频文案管理' }
                },
                // 在children数组中添加
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
                    path: '/transitions',
                    name: 'transitions',
                    component: TransitionList,
                    meta: { title: '转场视频管理' }
                },
                {
                    path: '/videos',
                    name: 'videos',
                    component: VideoList,
                    meta: { title: '转场视频管理' }
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

export default router