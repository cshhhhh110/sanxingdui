import { routeAgentRequest } from '@/api/AgentApi'
import { mcpClient } from '@/mcp'
import { AgentRoute, normalizeAgentRoute } from './routes'

class AgentOrchestrator {
  async handle(message, options = {}) {
    const {
      attachments = [],
      routingContext = {},
      toolContext = {}
    } = options

    try {
      const decision = await routeAgentRequest({
        message,
        attachments,
        context: routingContext
      })
      const route = normalizeAgentRoute(decision?.route)

      if (route === AgentRoute.TOOL_CALL) {
        const execution = await mcpClient.executeTool(
          decision.tool,
          decision.arguments || {},
          toolContext
        )
        return {
          ...execution,
          route,
          handled: true,
          confidence: decision.confidence,
          reason: decision.reason
        }
      }

      if (route === AgentRoute.UNSUPPORTED) {
        return {
          route,
          handled: false,  // 改为false，让请求继续发送到AI处理附件
          success: true,
          message: decision.message || '',
          requiredCapability: decision.requiredCapability,
          confidence: decision.confidence,
          reason: decision.reason
        }
      }

      return {
        route,
        handled: false,
        success: true,
        message: decision?.message || '',
        attachmentContext: decision?.attachmentContext || '',
        confidence: decision?.confidence,
        reason: decision?.reason
      }
    } catch (error) {
      console.warn('[Agent] 路由失败，安全降级为直接回答:', error)
      return {
        route: AgentRoute.DIRECT_ANSWER,
        handled: false,
        success: false,
        attachmentContext: '',
        reason: '路由服务不可用'
      }
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator()
export default agentOrchestrator
