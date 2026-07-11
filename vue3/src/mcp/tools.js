/**
 * MCP 工具定义
 * 定义所有可被自然语言调用的工具
 */

import { ROUTE_MAPPINGS, MCP_TOOL_CATEGORIES } from './config'
import { getAgentCurrentDateTime, getAgentWeather } from '@/api/AgentApi'

/**
 * MCP 工具基类
 */
export class MCPTool {
  constructor(config) {
    this.name = config.name
    this.description = config.description
    this.category = config.category
    this.inputSchema = config.inputSchema
    this.handler = config.handler
    this.requireAuth = config.requireAuth || false
  }

  async execute(params, context) {
    try {
      // 权限检查
      if (this.requireAuth && !context.isAuthenticated) {
        return {
          success: false,
          error: '需要登录才能执行此操作'
        }
      }
      
      // 执行工具
      const result = await this.handler(params, context)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// 导航工具
const navigateTool = new MCPTool({
  name: 'navigate_to',
  description: '导航到指定页面',
  category: MCP_TOOL_CATEGORIES.NAVIGATION,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      destination: {
        type: 'string',
        description: '目标页面名称',
        enum: Object.keys(ROUTE_MAPPINGS)
      },
      params: {
        type: 'object',
        description: '页面参数，如 { id: "xxx" }'
      }
    },
    required: ['destination']
  },
  handler: async (params, context) => {
    const { destination, params: routeParams } = params
    const router = context.router
    
    // 根据目标找到对应的路由路径
    const routePath = getRoutePath(destination)
    
    if (!routePath) {
      throw new Error(`未找到页面: ${destination}`)
    }
    
    // 执行路由跳转
    if (routeParams) {
      await router.push({ path: routePath, query: routeParams })
    } else {
      await router.push(routePath)
    }
    
    return {
      message: `已跳转到: ${destination}`,
      path: routePath
    }
  }
})

// 搜索文物工具
const searchHeritageTool = new MCPTool({
  name: 'search_heritage',
  description: '搜索非遗文物作品',
  category: MCP_TOOL_CATEGORIES.SEARCH,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      keyword: {
        type: 'string',
        description: '搜索关键词'
      },
      category: {
        type: 'string',
        description: '文物分类'
      },
      page: {
        type: 'number',
        description: '页码',
        default: 1
      },
      pageSize: {
        type: 'number',
        description: '每页数量',
        default: 10
      }
    },
    required: ['keyword']
  },
  handler: async (params, context) => {
    const { keyword, category, page, pageSize } = params
    const router = context.router

    await router.push({
      path: '/heritage',
      query: {
        keyword,
        category: category || undefined,
        page: page || undefined,
        pageSize: pageSize || undefined
      }
    })
    
    return {
      message: `正在搜索"${keyword}"相关文物`,
      keyword,
      category
    }
  }
})

// 获取文物详情工具
const getArtifactInfoTool = new MCPTool({
  name: 'get_artifact_info',
  description: '获取文物详细信息',
  category: MCP_TOOL_CATEGORIES.INFO,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      artifact_id: {
        type: 'string',
        description: '文物ID'
      }
    },
    required: ['artifact_id']
  },
  handler: async (params, context) => {
    const { artifact_id } = params
    const heritageApi = context.api?.HeritageApi
    
    if (!heritageApi) {
      throw new Error('HeritageApi 未初始化')
    }
    
    const result = await heritageApi.getDetail(artifact_id)
    
    return {
      message: '获取文物详情成功',
      data: result
    }
  }
})

// 打开文物详情并启动AI讲解工具
const openArtifactDetailTool = new MCPTool({
  name: 'open_artifact_detail',
  description: '打开文物详情页，同时可启动AI讲解',
  category: MCP_TOOL_CATEGORIES.INTERACTION,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      artifact_id: {
        type: 'string',
        description: '文物ID'
      },
      auto_explain: {
        type: 'boolean',
        description: '是否自动启动AI讲解',
        default: true
      }
    },
    required: ['artifact_id']
  },
  handler: async (params, context) => {
    const { artifact_id, auto_explain } = params
    const router = context.router
    
    // 跳转到文物详情页
    await router.push(`/heritage/${artifact_id}`)
    
    // 如果需要自动讲解，触发AI讲解
    if (auto_explain) {
      // 通知 Live2D 组件开始讲解
      const event = new CustomEvent('mcp:start-explain', { 
        detail: { artifact_id } 
      })
      window.dispatchEvent(event)
    }
    
    return {
      message: '已打开文物详情页',
      artifact_id,
      auto_explain
    }
  }
})

// 向AI提问工具
const askXuanmiaoTool = new MCPTool({
  name: 'ask_xuanmiao',
  description: '向玄喵AI助手提问关于三星堆文化的问题',
  category: MCP_TOOL_CATEGORIES.INTERACTION,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: '用户问题'
      },
      context_artifact: {
        type: 'string',
        description: '关联文物ID（可选）'
      }
    },
    required: ['question']
  },
  handler: async (params, context) => {
    const { question, context_artifact } = params
    const aiChatApi = context.api?.AiChatApi
    
    if (!aiChatApi) {
      throw new Error('AiChatApi 未初始化')
    }
    
    // 触发 AI 对话
    const event = new CustomEvent('mcp:ask-ai', { 
      detail: { 
        question,
        context_artifact,
        source: 'mcp'
      } 
    })
    window.dispatchEvent(event)
    
    return {
      message: '已提交问题给玄喵，请稍候...',
      question,
      context_artifact
    }
  }
})

// 播放语音介绍工具
const playVoiceIntroTool = new MCPTool({
  name: 'play_voice_intro',
  description: '播放文物语音介绍',
  category: MCP_TOOL_CATEGORIES.INTERACTION,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      artifact_id: {
        type: 'string',
        description: '文物ID'
      },
      voice_type: {
        type: 'string',
        description: '音色类型: normal(普通) / warm(温暖) / lively(活泼)',
        default: 'normal'
      }
    },
    required: ['artifact_id']
  },
  handler: async (params) => {
    const { artifact_id, voice_type } = params
    
    // 触发语音播放事件
    const event = new CustomEvent('mcp:play-voice', { 
      detail: { 
        artifact_id,
        voice_type: voice_type || 'normal'
      } 
    })
    window.dispatchEvent(event)
    
    return {
      message: '已开始播放语音介绍',
      artifact_id,
      voice_type
    }
  }
})

// 报名活动工具
const bookActivityTool = new MCPTool({
  name: 'book_activity',
  description: '报名参加活动',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {
      activity_id: {
        type: 'string',
        description: '活动ID'
      },
      confirm: {
        type: 'boolean',
        description: '是否确认报名',
        default: false
      }
    },
    required: ['activity_id']
  },
  handler: async (params, context) => {
    const { activity_id, confirm } = params
    const activityApi = context.api?.ActivityApi
    
    if (!activityApi) {
      throw new Error('ActivityApi 未初始化')
    }
    
    if (!confirm) {
      return {
        message: '即将报名此活动，请确认',
        requireConfirm: true,
        activity_id
      }
    }
    
    const result = await activityApi.signUp(activity_id)
    
    return {
      message: '报名成功！',
      data: result
    }
  }
})

// 报名课程工具
const enrollCourseTool = new MCPTool({
  name: 'enroll_course',
  description: '报名在线课程',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {
      course_id: {
        type: 'string',
        description: '课程ID'
      },
      confirm: {
        type: 'boolean',
        description: '是否确认报名',
        default: false
      }
    },
    required: ['course_id']
  },
  handler: async (params, context) => {
    const { course_id, confirm } = params
    const courseApi = context.api?.CourseApi
    
    if (!courseApi) {
      throw new Error('CourseApi 未初始化')
    }
    
    if (!confirm) {
      return {
        message: '即将报名此课程，请确认',
        requireConfirm: true,
        course_id
      }
    }
    
    const result = await courseApi.enroll(course_id)
    
    return {
      message: '课程报名成功！',
      data: result
    }
  }
})

// 获取3D模型工具
const get3DModelTool = new MCPTool({
  name: 'get_3d_model',
  description: '获取文物3D模型URL并打开3D展示',
  category: MCP_TOOL_CATEGORIES.INFO,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      artifact_id: {
        type: 'string',
        description: '文物ID'
      }
    },
    required: ['artifact_id']
  },
  handler: async (params, context) => {
    const { artifact_id } = params
    const heritageApi = context.api?.HeritageApi
    
    if (!heritageApi) {
      throw new Error('HeritageApi 未初始化')
    }
    
    const result = await heritageApi.getDetail(artifact_id)
    
    if (!result.modelUrl) {
      throw new Error('该文物暂无3D模型')
    }
    
    // 跳转到3D展示页
    await context.router.push({
      path: '/3d',
      query: { model: artifact_id }
    })
    
    return {
      message: '已打开3D模型展示',
      modelUrl: result.modelUrl,
      artifact_id
    }
  }
})

// 开始知识问答工具
const startQuizTool = new MCPTool({
  name: 'start_quiz',
  description: '开始知识问答',
  category: MCP_TOOL_CATEGORIES.INTERACTION,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: '问答主题',
        enum: ['general', 'artifact', 'history', 'craft', 'general'],
        default: 'general'
      },
      difficulty: {
        type: 'string',
        description: '难度级别',
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      }
    }
  },
  handler: async (params, context) => {
    const { topic, difficulty } = params
    const router = context.router
    
    // 直接跳转到问答页面
    await router.push('/quiz')
    
    return {
      message: `正在跳转知识问答页面...`,
      topic,
      difficulty
    }
  }
})

// ========== 商城相关工具 ==========

// 搜索商品工具
const searchProductTool = new MCPTool({
  name: 'search_product',
  description: '搜索商城商品并可指定数量购买',
  category: MCP_TOOL_CATEGORIES.SEARCH,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      keyword: {
        type: 'string',
        description: '搜索关键词/商品名称'
      },
      category: {
        type: 'string',
        description: '商品分类'
      },
      quantity: {
        type: 'number',
        description: '购买数量',
        default: 1
      }
    },
    required: ['keyword']
  },
  handler: async (params, context) => {
    const { keyword, category, quantity } = params
    const router = context.router
    
    // 跳转到商城并传递搜索参数和数量
    await router.push({
      path: '/shop',
      query: { 
        keyword,
        category,
        buyQty: quantity || 1
      }
    })
    
    return {
      message: `正在搜索"${keyword}"...`,
      keyword,
      quantity: quantity || 1
    }
  }
})

// 加入购物车工具
const addToCartTool = new MCPTool({
  name: 'add_to_cart',
  description: '将商品加入购物车',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {
      product_id: {
        type: 'string',
        description: '商品ID'
      },
      quantity: {
        type: 'number',
        description: '购买数量',
        default: 1
      }
    },
    required: ['product_id']
  },
  handler: async (params) => {
    const { product_id, quantity } = params
    
    // 触发加入购物车事件
    const event = new CustomEvent('mcp:add-to-cart', {
      detail: { product_id, quantity: quantity || 1 }
    })
    window.dispatchEvent(event)
    
    return {
      message: '已加入购物车',
      product_id,
      quantity: quantity || 1
    }
  }
})

// 查看购物车工具
const viewCartTool = new MCPTool({
  name: 'view_cart',
  description: '查看购物车商品',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (params, context) => {
    const router = context.router
    
    // 跳转到确认订单页
    await router.push('/order/confirm')
    
    return {
      message: '正在打开购物车...'
    }
  }
})

// 创建订单工具（单个）
const createOrderTool = new MCPTool({
  name: 'create_order',
  description: '创建商品订单',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {
      product_id: {
        type: 'string',
        description: '商品ID'
      },
      quantity: {
        type: 'number',
        description: '购买数量',
        default: 1
      },
      address_id: {
        type: 'string',
        description: '收货地址ID'
      },
      remark: {
        type: 'string',
        description: '订单备注'
      }
    },
    required: ['product_id']
  },
  handler: async (params) => {
    const { product_id, quantity, address_id, remark } = params
    
    // 触发创建订单事件
    const event = new CustomEvent('mcp:create-order', {
      detail: { product_id, quantity: quantity || 1, address_id, remark }
    })
    window.dispatchEvent(event)
    
    return {
      message: '正在创建订单...',
      product_id,
      quantity: quantity || 1
    }
  }
})

// 批量下单工具
const batchCreateOrderTool = new MCPTool({
  name: 'batch_create_order',
  description: '批量下单购买多个商品或某一分类的全部商品',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: false,  // 改为 false，在 handler 内部处理登录检查
  inputSchema: {
    type: 'object',
    properties: {
      category_name: {
        type: 'string',
        description: '商品分类名称'
      },
      keyword: {
        type: 'string',
        description: '搜索关键词'
      },
      quantity_per_item: {
        type: 'number',
        description: '每个商品购买数量',
        default: 1
      },
      address_id: {
        type: 'string',
        description: '收货地址ID'
      },
      remark: {
        type: 'string',
        description: '订单备注'
      }
    }
  },
  handler: async (params, context) => {
    const { category_name, keyword, quantity_per_item = 1, address_id, remark } = params
    const router = context.router
    
    // 显示正在处理的提示
    const searchKeyword = category_name || keyword
    
    if (!searchKeyword) {
      throw new Error('请指定要购买的商品分类或关键词')
    }
    
    // 检查登录状态
    if (!context.isAuthenticated) {
      // 未登录，跳转到登录页
      return {
        message: '批量下单需要登录，正在跳转到登录页面...',
        needLogin: true,
        redirectTo: '/login',
        category_name,
        keyword: searchKeyword,
        quantity_per_item
      }
    }
    
    // 已登录，跳转到商城页面，传递搜索参数
    await router.push({
      path: '/shop',
      query: { 
        category: searchKeyword,
        mode: 'batch_order',
        quantity: quantity_per_item
      }
    })
    
    // 触发全局批量下单准备事件
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mcp:prepare-batch-order', {
        detail: { category_name, keyword: searchKeyword, quantity_per_item, address_id, remark }
      }))
    }, 1000)
    
    return {
      message: `正在搜索"${searchKeyword}"分类商品，准备批量下单...`,
      category_name,
      keyword: searchKeyword,
      quantity_per_item
    }
  }
})

// 查看我的订单工具
const viewOrdersTool = new MCPTool({
  name: 'view_orders',
  description: '查看我的订单列表',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'number',
        description: '订单状态筛选'
      }
    }
  },
  handler: async (params, context) => {
    const router = context.router
    const { status } = params
    
    // 跳转到订单列表
    await router.push({
      path: '/orders',
      query: status !== undefined ? { status } : {}
    })
    
    return {
      message: '正在打开订单列表...',
      status
    }
  }
})

// 批量支付订单工具
const batchPayOrdersTool = new MCPTool({
  name: 'batch_pay_orders',
  description: '批量支付所有待支付的订单',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {
      payType: {
        type: 'string',
        description: '支付方式',
        default: 'OTHER'
      }
    }
  },
  handler: async (params) => {
    // 触发批量支付事件
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mcp:batch-pay-orders', {
        detail: { payType: params.payType || 'OTHER' }
      }))
    }, 100)
    
    return {
      message: null  // 不显示提示，由页面组件处理
    }
  }
})

// 批量取消订单工具
const batchCancelOrdersTool = new MCPTool({
  name: 'batch_cancel_orders',
  description: '批量取消所有待支付的订单',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async () => {
    // 触发批量取消事件
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mcp:batch-cancel-orders', {
        detail: {}
      }))
    }, 100)
    
    return {
      message: null  // 不显示提示，由页面组件处理
    }
  }
})

// 搜索活动工具
const searchActivityTool = new MCPTool({
  name: 'search_activity',
  description: '搜索活动',
  category: MCP_TOOL_CATEGORIES.SEARCH,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      keyword: {
        type: 'string',
        description: '搜索关键词'
      }
    },
    required: ['keyword']
  },
  handler: async (params, context) => {
    const { keyword } = params
    const router = context.router
    
    // 跳转到活动页面
    await router.push({
      path: '/activity',
      query: keyword ? { search: keyword } : {}
    })
    
    return {
      message: `正在搜索活动"${keyword}"...`,
      keyword
    }
  }
})

// 查看课程工具
const viewCoursesTool = new MCPTool({
  name: 'view_courses',
  description: '查看在线课程',
  category: MCP_TOOL_CATEGORIES.INTERACTION,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (params, context) => {
    const router = context.router
    await router.push('/course')
    return {
      message: '正在打开课程页面...'
    }
  }
})

const getWeatherTool = new MCPTool({
  name: 'get_weather',
  description: '查询指定城市的实时天气和今日预报',
  category: MCP_TOOL_CATEGORIES.INFO,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: '城市名称，例如成都、北京'
      }
    },
    required: ['city']
  },
  handler: async ({ city }) => getAgentWeather(city)
})

const getCurrentDateTimeTool = new MCPTool({
  name: 'get_current_datetime',
  description: '查询当前北京时间和日期',
  category: MCP_TOOL_CATEGORIES.INFO,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async () => getAgentCurrentDateTime()
})

const TRAIL_ARTIFACT_PITS = {
  'HI-2025-002': 'K5',
  'HI-2025-003': 'K2',
  'HI-2025-004': 'K1',
  'HI-2025-005': 'K2',
  'HI-2025-006': 'K2'
}

async function dispatchTrailControl(command) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('时空展线响应超时')), 3000)
    window.dispatchEvent(new CustomEvent('xuanmiao:trail-command', {
      detail: {
        command,
        source: 'agent-tool',
        respond(payload = {}) {
          window.clearTimeout(timer)
          if (payload.handled) resolve(payload)
          else reject(new Error(payload.message || '当前展线无法执行该操作'))
        }
      }
    }))
  })
}

const controlTrailTool = new MCPTool({
  name: 'control_trail',
  description: '控制时空展线中的文物、祭祀坑、场景、3D现场、讲解和图谱',
  category: MCP_TOOL_CATEGORIES.INTERACTION,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string' },
      artifact_id: { type: 'string' },
      pit_code: { type: 'string' },
      graph_target: { type: 'string' }
    },
    required: ['action']
  },
  handler: async (params, context) => {
    if (params.action === 'start_quiz') {
      await context.router.push('/quiz')
      return { message: '正在打开答题挑战。' }
    }

    const onTrail = context.router.currentRoute.value.path === '/trail'
    if (!onTrail && params.action === 'open_artifact') {
      await context.router.push({
        path: '/trail',
        query: {
          entityId: params.artifact_id,
          pitCode: TRAIL_ARTIFACT_PITS[params.artifact_id]
        }
      })
      return { message: '已进入时空展线并定位目标文物。' }
    }

    if (!onTrail) {
      await context.router.push('/trail')
      await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)))
    }
    await dispatchTrailControl(params)
    return { silent: true }
  }
})

const viewProfileTool = new MCPTool({
  name: 'view_profile',
  description: '打开当前用户的个人中心',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (params, context) => {
    await context.router.push('/profile')
    return { message: '正在打开个人中心。' }
  }
})

// 退出登录工具
const logoutTool = new MCPTool({
  name: 'logout',
  description: '退出当前用户登录',
  category: MCP_TOOL_CATEGORIES.BUSINESS,
  requireAuth: true,
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async () => {
    window.dispatchEvent(new CustomEvent('mcp:logout', {
      detail: {}
    }))
    return {
      message: '正在退出登录...'
    }
  }
})

// 获取用户位置工具
const getUserLocationTool = new MCPTool({
  name: 'get_user_location',
  description: '获取用户当前位置（城市名称），用于天气查询等需要位置信息的场景',
  category: MCP_TOOL_CATEGORIES.UTILITY,
  requireAuth: false,
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async () => {
    // 优先使用IP定位（无需浏览器权限，无需API Key）
    try {
      const response = await fetch('https://ip.useragentinfo.com/json', {
        timeout: 3000
      })
      const data = await response.json()

      if (data && data.city) {
        return {
          city: data.city || data.province || '成都',
          province: data.province,
          message: `已获取您的位置：${data.city || data.province}`
        }
      }
    } catch (error) {
      console.warn('IP定位失败，使用默认城市', error)
    }

    // 降级：使用默认城市
    return {
      city: '成都',
      message: '无法获取位置信息，默认使用成都（项目所在地）'
    }
  }
})

// 导出所有工具
export const MCP_TOOLS = {
  navigate_to: navigateTool,
  search_heritage: searchHeritageTool,
  get_artifact_info: getArtifactInfoTool,
  open_artifact_detail: openArtifactDetailTool,
  ask_xuanmiao: askXuanmiaoTool,
  play_voice_intro: playVoiceIntroTool,
  book_activity: bookActivityTool,
  enroll_course: enrollCourseTool,
  get_3d_model: get3DModelTool,
  start_quiz: startQuizTool,
  // 商城相关
  search_product: searchProductTool,
  add_to_cart: addToCartTool,
  view_cart: viewCartTool,
  create_order: createOrderTool,
  batch_create_order: batchCreateOrderTool,
  batch_pay_orders: batchPayOrdersTool,
  batch_cancel_orders: batchCancelOrdersTool,
  view_orders: viewOrdersTool,
  // 其他
  search_activity: searchActivityTool,
  view_courses: viewCoursesTool,
  get_user_location: getUserLocationTool,
  get_weather: getWeatherTool,
  get_current_datetime: getCurrentDateTimeTool,
  control_trail: controlTrailTool,
  view_profile: viewProfileTool,
  // 账户
  logout: logoutTool,
}

// 获取工具列表（用于 MCP 协议）
export function getToolList() {
  return Object.values(MCP_TOOLS).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }))
}

// 辅助函数：根据目标名称获取路由路径
function getRoutePath(destination) {
  const routePaths = {
    home: '/home',
    heritage: '/heritage',
    inheritor: '/inheritor',
    activity: '/activity',
    course: '/course',
    shop: '/shop',
    'ai-chat': '/ai-chat',
    profile: '/profile',
    '3d': '/3d',
    '3dlist': '/3dlist',
    trail: '/trail',
    quiz: '/quiz',
  }
  return routePaths[destination] || null
}
