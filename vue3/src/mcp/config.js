/**
 * MCP (Model Context Protocol) 配置文件
 * 用于自然语言操控网页的核心配置
 */

// MCP Server 配置
export const MCP_CONFIG = {
  // 是否启用 MCP 功能
  enabled: true,

  // MCP Server 地址（如果使用后端服务）
  serverUrl: '/api/mcp',

  // 是否使用后端 MCP Server
  useBackend: true,

  // 后端 MCP API 基础路径
  backendApiUrl: '/api/mcp',

  // 默认语言
  defaultLanguage: 'zh-CN',

  // 调试模式
  debug: import.meta.env.DEV,

  // 自然语言指令超时时间（毫秒）
  commandTimeout: 10000,

  // 是否显示调试日志
  showDebugLog: false,
}

// MCP 工具分类配置
export const MCP_TOOL_CATEGORIES = {
  NAVIGATION: 'navigation',    // 页面导航
  SEARCH: 'search',             // 搜索查询
  INTERACTION: 'interaction',   // 用户交互
  BUSINESS: 'business',        // 业务操作
  INFO: 'info',                // 信息获取
}

// 自然语言意图关键词配置
export const INTENT_KEYWORDS = {
  navigation: ['去', '打开', '跳到', '转到', '进入', '访问', '看看', '查看'],
  search: ['搜索', '查找', '找', '查询', '看看有什么'],
  like: ['喜欢', '点赞', '收藏', '关注'],
  book: ['预约', '报名', '预订', '参加'],
  play: ['播放', '听', '看', '打开'],
  help: ['怎么', '如何', '帮助', '教程', '使用'],
  buy: ['加入购物车'],  // 只保留"加入购物车"，其他由专门的批量下单处理
  stop: ['停止', '取消', '关闭', '退出'],
}

// 路由映射表 - 自然语言到路由的映射
export const ROUTE_MAPPINGS = {
  home: ['首页', '主页', '回到首页', '首页'],
  heritage: ['非遗作品', '文物', '作品', '非遗', '去看看非遗'],
  inheritor: ['传承人', '传承', '匠人', '手艺人'],
  activity: ['活动', '最近活动', '活动中心', '报名活动'],
  course: ['课程', '在线课程', '学习', '教程'],
  shop: ['商城', '商店', '购物', '手办'],
  'ai-chat': ['AI助手', '聊天', '玄喵聊天', 'AI对话'],
  profile: ['我的', '个人中心', '个人', '我的信息', '账户'],
  '3d': ['3D', '3d', '三维', '立体'],
  '3dlist': ['3D列表', '藏品列表', '3D藏品'],
  trail: ['时空展线', '时空短线', '展线', '玄喵展线', '祭祀坑展线'],
  quiz: ['问答', '知识问答', '答题', '挑战', '答题游戏'],
}

// 意图确认配置
export const INTENT_CONFIRM = {
  // 需要二次确认的操作类型
  requiresConfirm: ['book', 'buy', 'pay', 'cancel'],
  
  // 确认超时时间（毫秒）
  confirmTimeout: 30000,
}
