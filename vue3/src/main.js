import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import Vant from 'vant'

import 'vant/lib/index.css' // 引入 Vant 样式

// 导入Font Awesome
import '@fortawesome/fontawesome-free/css/all.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)
app.use(Vant) // 关键：必须注册 Vant

// 添加全局错误处理器来抑制ResizeObserver警告
const originalConsoleError = console.error
console.error = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('ResizeObserver loop')) {
    return
  }
  originalConsoleError(...args)
}

app.mount('#app')
