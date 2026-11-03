import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { syncInitialData } from './db/import-data'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 启动时同步数据（首次导入 / 版本变化时增量更新，个人数据保留）
syncInitialData().then(() => {
  app.mount('#app')
})
