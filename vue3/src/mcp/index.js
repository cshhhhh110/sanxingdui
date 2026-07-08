/**
 * MCP 主入口文件
 * 导出所有 MCP 相关功能
 */

// 导出配置
export { MCP_CONFIG, MCP_TOOL_CATEGORIES, INTENT_KEYWORDS, ROUTE_MAPPINGS, INTENT_CONFIRM } from './config'

// 导出工具
export { MCP_TOOLS, getToolList, MCPTool } from './tools'

// 导出 API 客户端
export { mcpApiClient } from './api'

// 导入主要功能
import { MCP_CONFIG } from './config'
import { MCP_TOOLS } from './tools'
import { mcpApiClient } from './api'

/**
 * MCP 核心类
 * 统一管理 MCP 客户端
 */
class MCPClient {
  constructor() {
    this.config = MCP_CONFIG
    this.tools = MCP_TOOLS
    this.isInitialized = false
    this.listeners = new Map()
  }

  /**
   * 初始化 MCP 客户端
   */
  async initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('[MCP] Client already initialized')
      return
    }

    this.config = { ...this.config, ...options }
    this.isInitialized = true
    
    // 如果配置了使用后端，先获取后端工具列表
    if (this.config.useBackend) {
      try {
        const status = await mcpApiClient.getStatus()
        console.log('[MCP] Backend server status:', status)
      } catch (error) {
        console.warn('[MCP] Backend server not available, using local tools')
      }
    }
    
    if (this.config.debug) {
      console.log('[MCP] Client initialized', this.config)
      console.log('[MCP] Available tools:', Object.keys(this.tools))
    }
  }

  async executeTool(toolName, arguments_ = {}, context = {}) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const tool = this.tools[toolName]
    if (!tool) {
      return {
        success: false,
        tool: toolName,
        message: '模型选择的工具在当前客户端不可用'
      }
    }

    const execution = await tool.execute(arguments_, context)
    return {
      success: execution.success,
      tool: toolName,
      data: execution.data,
      message: execution.success
        ? execution.data?.message || '操作已执行'
        : execution.error || '工具执行失败'
    }
  }

  /**
   * 直接调用后端工具
   */
  async callBackendTool(toolName, params = {}, userId = null) {
    if (!this.config.useBackend) {
      console.warn('[MCP] Backend mode is disabled')
      return null
    }
    
    return await mcpApiClient.callTool(toolName, params, userId)
  }

  /**
   * 获取后端状态
   */
  async getBackendStatus() {
    try {
      return await mcpApiClient.getStatus()
    } catch (error) {
      return { status: 'offline', error: error.message }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => cb(data))
  }

  /**
   * 监听事件
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event) || []
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }
}

// 创建并导出单例
export const mcpClient = new MCPClient()

// 默认导出
export default mcpClient
