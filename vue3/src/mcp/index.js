export { MCP_CONFIG, MCP_TOOL_CATEGORIES, INTENT_KEYWORDS, ROUTE_MAPPINGS, INTENT_CONFIRM } from './config'
export { MCP_TOOLS, getToolList, MCPTool } from './tools'
export { mcpApiClient } from './api'

import { MCP_CONFIG } from './config'
import { MCP_TOOLS } from './tools'
import { mcpApiClient } from './api'
import { getAgentToolNames } from '@/agent/toolSchemas'

const AGENT_DEMO_TOOLS = new Set(getAgentToolNames())

class MCPClient {
  constructor() {
    this.config = MCP_CONFIG
    this.tools = MCP_TOOLS
    this.isInitialized = false
    this.listeners = new Map()
  }

  async initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('[MCP] Client already initialized')
      return
    }

    this.config = { ...this.config, ...options }
    this.isInitialized = true

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
      console.log('[MCP] Agent demo tools:', Array.from(AGENT_DEMO_TOOLS))
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
        message: '\u6a21\u578b\u9009\u62e9\u7684\u5de5\u5177\u5728\u5f53\u524d\u5ba2\u6237\u7aef\u4e0d\u53ef\u7528\u3002'
      }
    }

    const execution = await tool.execute(arguments_, context)
    return {
      success: execution.success,
      tool: toolName,
      data: execution.data,
      message: execution.success
        ? summarizeSuccessfulTool(toolName, arguments_, execution.data)
        : execution.error || '\u5de5\u5177\u6267\u884c\u5931\u8d25\u3002'
    }
  }

  async callBackendTool(toolName, params = {}, userId = null) {
    if (!this.config.useBackend) {
      console.warn('[MCP] Backend mode is disabled')
      return null
    }

    return await mcpApiClient.callTool(toolName, params, userId)
  }

  async getBackendStatus() {
    try {
      return await mcpApiClient.getStatus()
    } catch (error) {
      return { status: 'offline', error: error.message }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => cb(data))
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event) || []
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }
}

function summarizeSuccessfulTool(toolName, args, data = {}) {
  switch (toolName) {
    case 'navigate_to':
      return `\u5df2\u6253\u5f00 ${args.destination || data.path || '\u76ee\u6807\u9875\u9762'}\u3002`
    case 'search_product':
      return `\u5df2\u5728\u5546\u57ce\u641c\u7d22\u201c${args.keyword}\u201d\u3002`
    case 'search_heritage':
      return `\u5df2\u641c\u7d22\u201c${args.keyword}\u201d\u76f8\u5173\u6587\u7269\u3002`
    case 'control_trail':
      return data?.message || '\u5df2\u6267\u884c\u65f6\u7a7a\u5c55\u7ebf\u64cd\u4f5c\u3002'
    case 'get_weather':
      return data?.message || `\u5df2\u67e5\u8be2 ${args.city || ''} \u5929\u6c14\u3002`
    case 'get_current_datetime':
      return data?.message || '\u5df2\u83b7\u53d6\u5f53\u524d\u65e5\u671f\u548c\u65f6\u95f4\u3002'
    case 'open_artifact_detail':
      return '\u5df2\u6253\u5f00\u6587\u7269\u8be6\u60c5\u9875\u3002'
    case 'play_voice_intro':
      return '\u5df2\u5f00\u59cb\u64ad\u653e\u6587\u7269\u8bed\u97f3\u4ecb\u7ecd\u3002'
    case 'generate_visual_aid':
      return data?.message || '\u89c6\u89c9\u8f85\u52a9\u56fe\u5df2\u8fdb\u5165\u521b\u4f5c\u961f\u5217\u3002'
    default:
      return data?.message || '\u64cd\u4f5c\u5df2\u6267\u884c\u3002'
  }
}

export const mcpClient = new MCPClient()

export default mcpClient
