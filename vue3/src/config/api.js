/**
 * API配置文件
 */

// 获取环境变量中的API地址，如果没有则使用默认值
export const API_BASE_URL = import.meta.env.VITE_APP_BASE_API || 'http://localhost:8080'

// API端点配置
export const API_ENDPOINTS = {
  // 用户相关
  USER: {
    LOGIN: '/api/user/login',
    REGISTER: '/api/user/register',
    CURRENT: '/api/user/current',
    UPDATE: '/api/user/update',
    UPDATE_PASSWORD: '/api/user/password'
  },

  // 文件相关
  FILE: {
    UPLOAD: '/api/file/upload',
    PREVIEW: '/api/file/preview',
    DOWNLOAD: '/api/file/download',
    DELETE: '/api/file/delete'
  },

  // 非遗作品
  HERITAGE: {
    LIST: '/api/heritage/list',
    DETAIL: '/api/heritage',
    CREATE: '/api/heritage/create',
    UPDATE: '/api/heritage/update',
    DELETE: '/api/heritage/delete'
  },

  // 传承人
  INHERITOR: {
    LIST: '/api/inheritor/list',
    DETAIL: '/api/inheritor',
    CREATE: '/api/inheritor/create',
    UPDATE: '/api/inheritor/update',
    DELETE: '/api/inheritor/delete'
  },

  // 活动
  ACTIVITY: {
    LIST: '/api/activity/list',
    DETAIL: '/api/activity',
    CREATE: '/api/activity/create',
    UPDATE: '/api/activity/update',
    DELETE: '/api/activity/delete',
    SIGNUP: '/api/activity/signup',
    CANCEL_SIGNUP: '/api/activity/cancel-signup'
  },

  // 课程
  COURSE: {
    LIST: '/api/course/list',
    DETAIL: '/api/course',
    CREATE: '/api/course/create',
    UPDATE: '/api/course/update',
    DELETE: '/api/course/delete'
  },

  // 商城
  SHOP: {
    CATEGORY_LIST: '/api/shop/category/list',
    PRODUCT_LIST: '/api/shop/product/list',
    PRODUCT_DETAIL: '/api/shop/product',
    CART_LIST: '/api/shop/cart/list',
    CART_ADD: '/api/shop/cart/add',
    ORDER_CREATE: '/api/shop/order/create',
    ORDER_LIST: '/api/shop/order/list'
  },

  // AI助手
  AI: {
    CHAT: '/api/ai/chat',
    SUMMARIZE: '/api/ai/summarize',
    REVIEW: '/api/ai/review'
  }
}

export default {
  API_BASE_URL,
  API_ENDPOINTS
}


