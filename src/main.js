import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
// 添加 Naive UI
import naive from 'naive-ui'
import { useAutoPublishArticleStore } from './stores/autoPublishArticle'
import { useAutoPublishDynamicStore } from './stores/autoPublishDynamic'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)  // 使用路由
app.use(ElementPlus)
app.use(Antd)
app.use(naive)  // 添加 Naive UI

const autoPublishArticleStore = useAutoPublishArticleStore()
window.__autoPublishArticleRunnerActive = true
autoPublishArticleStore.init()
const autoPublishDynamicStore = useAutoPublishDynamicStore()
window.__autoPublishDynamicRunnerActive = true
autoPublishDynamicStore.init()

app.mount('#app')
