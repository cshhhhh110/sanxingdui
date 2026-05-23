import { defineStore } from 'pinia'
import { login } from '@/api/user'

// 安全的localStorage操作工具
const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn(`Failed to parse localStorage item: ${key}`, error)
      localStorage.removeItem(key) // 清除损坏的数据
      return null
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to set localStorage item: ${key}`, error)
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove localStorage item: ${key}`, error)
    }
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: storage.get('userInfo'),
    token: storage.get('token') || ''
  }),
  getters: {
    // 判断是否登录（只检查token是否存在）
    isLoggedIn: (state) => !!state.token && !!state.userInfo,

    // 获取用户类型
    userType: (state) => state.userInfo?.userType || '',

    // 判断是否是管理员
    isAdmin: (state) => state.userInfo?.userType === 'ADMIN',

    // 判断是否是普通用户
    isUser: (state) => state.userInfo?.userType === 'USER',

    // 获取用户显示名称
    displayName: (state) => {
      if (!state.userInfo) return '未登录'
      return state.userInfo.nickname || state.userInfo.username || '用户'
    },

    // 获取用户头像
    avatar: (state) => state.userInfo?.avatar || '',

    // 获取用户ID
    userId: (state) => state.userInfo?.id || null
  },

  actions: {
    // 初始化用户状态
    initialize() {
      // 检查登录状态有效性
      if (!this.isLoggedIn) {
        this.clearUserInfo()
      }
    },

    // 设置用户信息（登录时调用）
    setUserInfo(data) {
      if (!data || !data.token) {
        console.error('setUserInfo: 数据或token不能为空')
        return
      }

      // 更新状态
      this.userInfo = data.userInfo || data
      this.token = data.token

      // 持久化存储
      storage.set('userInfo', this.userInfo)
      storage.set('token', this.token)
    },

    // 更新用户信息（不更新token）
    updateUserInfo(data) {
      if (!data) {
        console.warn('updateUserInfo: 传入数据为空')
        return
      }

      // 合并用户信息
      this.userInfo = { ...this.userInfo, ...data }

      // 更新存储
      storage.set('userInfo', this.userInfo)
    },

    // 清除用户信息
    clearUserInfo() {
      this.userInfo = null
      this.token = ''

      // 清除存储
      storage.remove('userInfo')
      storage.remove('token')
    },

    // 登录
    async login(loginForm) {
      try {
        const res = await login(loginForm)

        if (!res || !res.token) {
          throw new Error('登录响应数据异常')
        }

        this.setUserInfo(res)
        return res
      } catch (error) {
        this.clearUserInfo()
        throw error
      }
    },

    // 退出登录
    async logout() {
      try {
        // 后端没有提供 logout 接口，直接清除前端存储即可
        // 如果后端有 logout 接口，可以在这里调用
        // if (this.token) {
        //   await logout()
        // }
        
        this.clearUserInfo()
        console.log('用户已退出登录')
      } catch (error) {
        console.error('退出登录失败:', error)
        // 即使出错也要清除用户信息
        this.clearUserInfo()
      }
    }
  }
})