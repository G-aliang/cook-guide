import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { syncInitialData } from './db/import-data'
import { setupPwa } from './pwa'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 启动时同步数据（首次导入 / 版本变化时增量更新，个人数据保留）
syncInitialData().then(() => {
  app.mount('#app')
})

// 注册 Service Worker：检测到新版本时由 App.vue 弹出「有新版本」提示
// 只在生产构建中注册，开发环境不启用 SW（devOptions.enabled = false）
if (import.meta.env.PROD) {
  setupPwa()
}
