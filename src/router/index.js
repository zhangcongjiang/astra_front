import { createRouter, createWebHistory } from 'vue-router'
import MenuView from '../views/MenuView.vue'
import ImageList from '@/views/images/ImageList.vue'
import MusicList from '@/views/musics/MusicList.vue'
import VideoTemplateList from '@/views/videos/VideoTemplateList.vue'
import VideoTemplateApply from '@/views/videos/VideoTemplateApply.vue'
import BackgroundList from '@/views/images/BackgroundList.vue'
import MyVideo from '@/views/videos/MyVideo.vue'
import EffectList from '@/views/musics/EffectList.vue'
import VoiceList from '@/views/musics/VoiceList.vue'
import MySound from '@/views/musics/MySound.vue'
import SystemSoundSettings from '@/views/settings/SystemSoundSettings.vue'
import SystemVideoSettings from '@/views/settings/SystemVideoSettings.vue'
import DataVisualList from '@/views/videos/DataVisualList.vue'
import DataVisualApply from '@/views/videos/DataVisualApply.vue'
import VideoTextList from '@/views/videos/VideoTextList.vue'
import GraphicTextList from '@/views/texts/GraphicTextList.vue'
import GraphicTextDetail from '@/views/texts/GraphicTextDetail.vue'
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
                }, {
                    path: 'effects',
                    name: 'effects',
                    component: EffectList // 工作台组件
                },
                {
                    path: 'speakers',
                    name: 'speakers',
                    component: VoiceList // 工作台组件
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
                    path: '/texts/detail/:id',
                    name: 'GraphicTextDetail',
                    component: GraphicTextDetail,
                    meta: { title: '图文详情' }
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
                    path: '/texts/create',
                    name: 'GraphicTextCreate',
                    component: () => import('@/views/texts/GraphicTextCreate.vue'),
                    meta: { title: '创建图文' }
                  }
            ]
        }
    ]
})

export default router