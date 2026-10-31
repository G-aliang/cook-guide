import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { importInitialData } from './db/import-data'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 首次使用时自动导入初始数据
importInitialData().then(() => {
  app.mount('#app')
})
