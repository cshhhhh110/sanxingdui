/**
 * 认证相关工具函数
 * 配合改进后的user store使用
 */

import { useUserStore } from '@/store/user'
import router from '@/router'

/**
 * 初始化认证状态
 * 应用启动时调用
 */
export function initAuth() {
  const userStore = useUserStore()
  userStore.initialize()
  
  // 如果token过期，自动跳转到登录页
  if (!userStore.isLoggedIn && userStore.token) {
    console.log('Token已过期，自动登出')
    userStore.clearUserInfo()
    redirectToLogin()
  }
}

/**
 * 跳转到登录页
 */
export function redirectToLogin() {
  const currentPath = router.currentRoute.value.fullPath
  
  // 避免在登录页重复跳转
  if (currentPath.includes('/auth/')) {
    return
  }
  
  router.push({
    path: '/auth/login',
    query: { redirect: currentPath }
  })
}

/**
 * 权限守卫函数
 * 用于路由守卫或组件守卫
 * @returns {boolean}
 */
export function requireAuth() {
  const userStore = useUserStore()
  
  // 检查是否登录
  if (!userStore.isLoggedIn) {
    redirectToLogin()
    return false
  }
  
  return true
}

/**
 * 安全登出
 * 清除所有用户状态并跳转
 */
export async function safeLogout() {
  const userStore = useUserStore()
  
  try {
    await userStore.logout()
  } catch (error) {
    console.error('登出过程中发生错误:', error)
  } finally {
    // 确保跳转到登录页
    router.push('/auth/login')
  }
}

/**
 * 获取用户信息的安全包装
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const userStore = useUserStore()
  
  if (!userStore.isLoggedIn) {
    return null
  }
  
  return {
    id: userStore.userId,
    name: userStore.displayName,
    userType: userStore.userType,
    avatar: userStore.avatar,
    isAdmin: userStore.isAdmin,
    isUser: userStore.isUser
  }
}

/**
 * 角色检查工具
 */
export const roleCheck = {
  isAdmin() {
    const userStore = useUserStore()
    return userStore.isAdmin
  },
  
  isUser() {
    const userStore = useUserStore()
    return userStore.isUser
  },
  
  hasUserType(userType) {
    const userStore = useUserStore()
    return userStore.userType === userType
  }
}
