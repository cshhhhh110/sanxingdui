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
          handled: true,
          success: false,
          message: decision.message || '\u5f53\u524d\u6682\u4e0d\u652f\u6301\u8fd9\u9879\u80fd\u529b\u3002',
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
