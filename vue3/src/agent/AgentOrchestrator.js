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
      const traceFields = {
        route,
        arguments: decision?.arguments || {},
        attachmentContext: decision?.attachmentContext || '',
        confidence: decision?.confidence,
        reason: decision?.reason
      }

      if (route === AgentRoute.TOOL_CALL) {
        const execution = await mcpClient.executeTool(
          decision.tool,
          decision.arguments || {},
          toolContext
        )
        return {
          ...execution,
          ...traceFields,
          tool: decision.tool,
          handled: true
        }
      }

      if (route === AgentRoute.UNSUPPORTED) {
        return {
          ...traceFields,
          handled: false,  // 改为false，让请求继续发送到AI处理附件
          success: true,
          message: decision.message || '',
          requiredCapability: decision.requiredCapability
        }
      }

      return {
        ...traceFields,
        handled: false,
        success: true,
        message: decision?.message || ''
      }
    } catch (error) {
      console.warn('[Agent] route failed; falling back to chat pipeline.', error)
      return {
        route: AgentRoute.DIRECT_ANSWER,
        handled: false,
        success: false,
        message: '',
        arguments: {},
        attachmentContext: '',
        reason: '\u8def\u7531\u670d\u52a1\u4e0d\u53ef\u7528'
      }
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator()
export default agentOrchestrator
