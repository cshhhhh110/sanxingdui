/**
 * MCP 后端 API 客户端
 * 用于前端调用后端 MCP Server
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * MCP API 客户端
 */
class McpApiClient {
  constructor() {
    this.baseUrl = `${BASE_URL}/api/mcp`
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * 获取所有可用工具列表
   */
  async getTools() {
    const response = await this.client.get('/tools')
    return response.data
  }

  /**
   * 调用指定工具
   */
  async callTool(tool, params = {}, userId = null) {
    const headers = {}
    if (userId) {
      headers['X-User-Id'] = userId
    }

    const response = await this.client.post('/call', {
      tool,
      params,
      userId
    }, { headers })

    return response.data
  }

  /**
   * 批量调用工具
   */
  async batchCall(requests) {
    const response = await this.client.post('/batch', requests)
    return response.data
  }

  /**
   * 检查工具是否存在
   */
  async checkTool(name) {
    const response = await this.client.get(`/tools/${name}`)
    return response.data
  }

  /**
   * 获取 MCP 服务状态
   */
  async getStatus() {
    const response = await this.client.get('/status')
    return response.data
  }
}

// 创建单例
export const mcpApiClient = new McpApiClient()

// 导出默认实例
export default mcpApiClient
