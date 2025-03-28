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
                    name: 'backgrounds',
                    component: BackgroundList // 工作台组件
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
                    path: 'shadiao',
                    name: 'shadiao',
                    component: () => import('../views/Dashboard.vue') // 工作台组件
                }, {
                    path: 'data-visuals',
                    name: 'data-visuals',
                    component: () => import('../views/Dashboard.vue') // 工作台组件
                },
                {
                    path: 'my-images',
                    name: 'my-images',
                    component: () => import('../views/Dashboard.vue') // 工作台组件
                }, {
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
                    path: 'system',
                    name: 'system',
                    component: () => import('../views/Dashboard.vue') // 工作台组件
                },
                // 其他子路由...
            ]
        }
    ]
})

export default router