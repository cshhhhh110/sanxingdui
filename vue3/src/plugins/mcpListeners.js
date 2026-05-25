/**
 * MCP 全局事件监听器
 */

import { message } from 'ant-design-vue'
import { useUserStore } from '@/store/user.js'

export function setupMcpEventListeners() {
  // 退出登录事件
  window.addEventListener('mcp:logout', async () => {
    console.log('[MCP] 退出登录')
    const userStore = useUserStore()
    await userStore.logout()
    message.success('已退出登录')
  })
}

export default setupMcpEventListeners
