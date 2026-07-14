import { getAgentTools, routeAgentRequest } from '@/api/AgentApi'
import { mcpClient } from '@/mcp'
import { AgentRoute, normalizeAgentRoute } from './routes'
import {
  applyAgentDecision,
  createAgentTrace,
  finishAgentTrace,
  markToolRunning,
  updateTraceStep
} from './trace'
import {
  getXuanmiaoContextPayload,
  recordXuanmiaoExploration,
  rememberVisualAidTask,
  rememberXuanmiaoTool
} from './context'
import { discoverKnowledgeRelations } from './knowledgeGraph'
import {
  advanceGuideState,
  buildActiveGuideContext,
  buildGuideTool,
  createGuideRouteMessage
} from './activeGuide'
import {
  emitGuideExperienceAfterTool,
  isGuideExperienceDecision,
  runGuideExperienceBeforeTool,
  waitForGuideTrailArrival
} from './guideExperience'

const DEFAULT_TOOL_TIMEOUT_MS = 6000

class AgentOrchestrator {
  constructor() {
    this.enabledToolNames = null
  }

  async handle(message, options = {}) {
    const {
      attachments = [],
      routingContext = {},
      toolContext = {},
      toolTimeoutMs = DEFAULT_TOOL_TIMEOUT_MS,
      onTrace = null,
      onExperienceEvent = null,
      guideExperienceDelays = null
    } = options
    const baseRoutingContext = {
      ...getXuanmiaoContextPayload(),
      ...routingContext
    }
    const routingKnowledgeGraph = discoverKnowledgeRelations({
      question: message,
      context: baseRoutingContext
    })
    const activeGuide = buildActiveGuideContext(message, baseRoutingContext, routingKnowledgeGraph)
    const guideActionDecision = buildGuideActionDecision(activeGuide, baseRoutingContext)
    const effectiveRoutingContext = {
      ...baseRoutingContext,
      knowledgeEntities: routingKnowledgeGraph.entities,
      knowledgeRelations: routingKnowledgeGraph.relations,
      activeGuideState: activeGuide.state,
      activeGuideRoutePlan: activeGuide.routePlan,
      activeGuideFollowups: activeGuide.followups
    }

    let decision
    let route
    let trace = createAgentTrace({
      surface: effectiveRoutingContext.surface || '',
      message
    })
    emitTrace(onTrace, trace)

    try {
      if (guideActionDecision) {
        decision = guideActionDecision
        route = normalizeAgentRoute(decision?.route)
      } else {
        decision = await routeAgentRequest({
          message,
          attachments,
          context: effectiveRoutingContext
        })
        route = normalizeAgentRoute(decision?.route)
      }
      trace = applyAgentDecision(trace, decision, route)
      emitTrace(onTrace, trace)
    } catch (error) {
      console.warn('[Agent] route failed; falling back to chat pipeline.', error)
      if (activeGuide.routePlan) {
        decision = buildGuideToolDecision(activeGuide)
        route = AgentRoute.TOOL_CALL
        trace = applyAgentDecision(trace, decision, route)
        trace.activeGuide = activeGuide
        emitTrace(onTrace, trace)
      } else {
      trace = finishAgentTrace(
        updateTraceStep(trace, 'understanding', {
          status: 'failed',
          detail: '路由服务不可用，回退到普通问答'
        }),
        {
          status: 'failed',
          result: '路由服务不可用'
        }
      )
      emitTrace(onTrace, trace)
      return {
        route: AgentRoute.DIRECT_ANSWER,
        handled: false,
        success: false,
        message: '',
        arguments: {},
        attachmentContext: '',
        reason: '\u8def\u7531\u670d\u52a1\u4e0d\u53ef\u7528',
        trace
      }
      }
    }

    if (activeGuide.routePlan) {
      if (route !== AgentRoute.TOOL_CALL) {
        decision = buildGuideToolDecision(activeGuide)
        route = AgentRoute.TOOL_CALL
        trace = applyAgentDecision(trace, decision, route)
        emitTrace(onTrace, trace)
      } else if ((decision?.toolName || decision?.tool) === 'control_trail') {
        decision = {
          ...decision,
          activeGuide,
          routePlan: decision.routePlan || activeGuide.routePlan,
          guideAction: decision.guideAction || activeGuide.actionIntent || 'create_guide'
        }
      }
    }
    trace.activeGuide = activeGuide

    const traceFields = {
      route,
      trace,
      arguments: decision?.arguments || {},
      attachmentContext: decision?.attachmentContext || '',
      confidence: decision?.confidence,
      reason: decision?.reason
    }
    console.info('[Agent] route decision', {
      route,
      tool: decision?.tool || '',
      arguments: traceFields.arguments,
      confidence: traceFields.confidence,
      reason: traceFields.reason,
      hasAttachmentContext: Boolean(traceFields.attachmentContext)
    })

    if (route === AgentRoute.TOOL_CALL) {
      const toolName = decision?.toolName || decision?.tool || ''
      let guideExperience = null
      try {
        const enabledToolNames = await this.getEnabledToolNames()
        if (enabledToolNames && !enabledToolNames.has(toolName)) {
          const message = '\u6a21\u578b\u9009\u62e9\u7684\u5de5\u5177\u5728\u5f53\u524d\u5ba2\u6237\u7aef\u4e0d\u53ef\u7528\u3002'
          trace = finishAgentTrace(trace, {
            status: 'failed',
            result: '\u5de5\u5177\u4e0d\u5728\u540e\u7aef\u542f\u7528\u6e05\u5355\u4e2d'
          })
          emitTrace(onTrace, trace)
          return {
            ...traceFields,
            trace,
            tool: toolName,
            toolName,
            handled: true,
            success: false,
            message
          }
        }
        trace = markToolRunning(trace, toolName, decision.arguments || {})
        emitTrace(onTrace, trace)
        if (isGuideExperienceDecision(decision, toolName)) {
          guideExperience = await runGuideExperienceBeforeTool({
            decision,
            emit: onExperienceEvent,
            delays: guideExperienceDelays || undefined
          })
        }
        const execution = await withTimeout(
          mcpClient.executeTool(
            toolName,
            decision.arguments || {},
            toolContext
          ),
          toolTimeoutMs,
          `Tool ${decision.tool || 'unknown'} timed out after ${toolTimeoutMs}ms`
        )
        let completedExecution = execution
        if (isGuideExperienceDecision(decision, toolName)) {
          const trailStatus = await waitForGuideTrailArrival({
            decision,
            execution,
            readTrailStatus: () => getXuanmiaoContextPayload().trailStatus
          })
          completedExecution = attachTrailStatus(execution, trailStatus)
        }
        const normalizedExecution = enrichGuideExecution(completedExecution, activeGuide, toolName, decision)
        if (isGuideExperienceDecision(decision, toolName)) {
          await emitGuideExperienceAfterTool({
            decision,
            execution: normalizedExecution,
            emit: onExperienceEvent,
            experienceState: guideExperience?.experienceState
          })
        }
        console.info('[Agent] tool execution result', {
          tool: decision.tool,
          success: normalizedExecution?.success,
          message: normalizedExecution?.message || ''
        })
        trace = finishAgentTrace(trace, {
          status: normalizedExecution?.success ? 'success' : 'failed',
          result: normalizedExecution?.message || '',
          data: normalizedExecution?.data || null
        })
        rememberXuanmiaoTool(toolName, decision.arguments || {}, normalizedExecution, {
          lastAction: toolName,
          routePlan: activeGuide.routePlan
        })
        if (toolName === 'generate_visual_aid' && normalizedExecution?.success) {
          rememberVisualAidTask(normalizedExecution.data, baseRoutingContext.pendingVisualAidProposal)
        }
        recordXuanmiaoExploration({
          route: activeGuide.routePlan,
          suggestions: activeGuide.followups
        })
        emitTrace(onTrace, trace)
        return {
          ...normalizedExecution,
          ...traceFields,
          trace,
          tool: toolName,
          toolName,
          handled: true
        }
      } catch (error) {
        console.warn('[Agent] tool execution failed.', error)
        if (guideExperience?.experienceState) {
          try {
            await emitGuideExperienceAfterTool({
              decision,
              execution: {
                success: false,
                data: {
                  trailStatus: {
                    status: 'failed',
                    reason: error?.message || 'tool_execution_failed'
                  }
                }
              },
              emit: onExperienceEvent,
              experienceState: guideExperience.experienceState
            })
          } catch (experienceError) {
            console.warn('[Agent] guide experience failure notification failed.', experienceError)
          }
        }
        trace = finishAgentTrace(trace, {
          status: 'failed',
          result: '\u5de5\u5177\u6267\u884c\u8d85\u65f6\u6216\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002'
        })
        emitTrace(onTrace, trace)
        return {
          ...traceFields,
          trace,
          tool: decision?.toolName || decision?.tool || '',
          toolName: decision?.toolName || decision?.tool || '',
          handled: true,
          success: false,
          message: '\u5de5\u5177\u6267\u884c\u8d85\u65f6\u6216\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002',
          error: error?.message || String(error)
        }
      }
    }

    if (route === AgentRoute.UNSUPPORTED) {
      trace = finishAgentTrace(trace, {
        status: 'failed',
        result: '\u5f53\u524d\u80fd\u529b\u672a\u63a5\u5165'
      })
      emitTrace(onTrace, trace)
      return {
        ...traceFields,
        trace,
        handled: true,
        success: false,
        message: decision.message || '\u5f53\u524d\u6682\u4e0d\u652f\u6301\u8fd9\u9879\u80fd\u529b\u3002',
        requiredCapability: decision.requiredCapability
      }
    }

    trace = finishAgentTrace(trace, {
      status: 'success',
      result: route === AgentRoute.RAG ? '进入知识库问答流程' : '进入普通问答流程'
    })
    emitTrace(onTrace, trace)
    return {
      ...traceFields,
      trace,
      handled: false,
      success: true,
      message: decision?.message || ''
    }
  }

  async getEnabledToolNames() {
    if (this.enabledToolNames) {
      return this.enabledToolNames
    }

    try {
      const tools = await getAgentTools()
      this.enabledToolNames = new Set((Array.isArray(tools) ? tools : []).map((tool) => tool.name || tool.toolName))
      return this.enabledToolNames
    } catch (error) {
      console.warn('[Agent] enabled tool schema unavailable; using route decision only.', error)
      return null
    }
  }
}

function attachTrailStatus(execution = {}, trailStatus = {}) {
  return {
    ...execution,
    data: {
      ...(execution.data || {}),
      trailStatus
    },
    trailStatus
  }
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timerId
  const timeout = new Promise((_, reject) => {
    timerId = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timerId)
  })
}

function emitTrace(onTrace, trace) {
  if (typeof onTrace === 'function') {
    onTrace({ ...trace, steps: trace.steps.map((step) => ({ ...step })) })
  }
}

export const agentOrchestrator = new AgentOrchestrator()
export default agentOrchestrator

function buildGuideToolDecision(activeGuide = {}) {
  const routePlan = activeGuide.routePlan || {}
  return {
    route: AgentRoute.TOOL_CALL,
    tool: routePlan.firstTool?.tool || 'control_trail',
    toolName: routePlan.firstTool?.toolName || routePlan.firstTool?.tool || 'control_trail',
    arguments: routePlan.firstTool?.arguments || {
      action: 'open_artifact',
      artifact_id: routePlan.stops?.[0]?.artifactId || ''
    },
    confidence: 0.93,
    reason: routePlan.reason || '主动导览路线规划',
    activeGuide,
    routePlan,
    guideAction: activeGuide.actionIntent || 'create_guide'
  }
}

function buildGuideActionDecision(activeGuide = {}, context = {}) {
  if (activeGuide.actionIntent === 'restart_guide' && activeGuide.routePlan) {
    return buildGuideToolDecision(activeGuide)
  }

  if (activeGuide.actionIntent !== 'continue_guide') {
    return null
  }

  const state = context.activeGuideState || {}
  const plan = state.guidePlan || null
  if (!plan?.nodes?.length || !state.routeId || ['completed', 'cancelled'].includes(state.status)) {
    return {
      route: AgentRoute.DIRECT_ANSWER,
      tool: '',
      toolName: '',
      arguments: {},
      confidence: 0.92,
      reason: '当前没有可继续的导览路线',
      message: state.status === 'completed'
        ? '这条导览路线已经完成。你可以说“重新规划一下”，我会按当前位置再生成一条新路线。'
        : '当前还没有正在进行的导览路线。你可以说“我第一次来三星堆，只有20分钟”，我先帮你规划。'
    }
  }

  const nextIndex = Number.isInteger(state.nextNode)
    ? state.nextNode
    : Number.isInteger(state.currentNode)
      ? state.currentNode + 1
      : 0
  const nextNode = plan.nodes[nextIndex]
  if (!nextNode) {
    return {
      route: AgentRoute.DIRECT_ANSWER,
      tool: '',
      toolName: '',
      arguments: {},
      confidence: 0.92,
      reason: '导览路线没有下一站',
      message: `这条「${state.routeTitle || plan.title || '导览路线'}」已经完成。你可以说“重新规划一下”，我会继续带你探索。`
    }
  }

  return {
    route: AgentRoute.TOOL_CALL,
    tool: 'control_trail',
    toolName: 'control_trail',
    arguments: buildGuideTool(nextNode).arguments,
    confidence: 0.95,
    reason: `继续当前导览路线，前往第 ${nextNode.order} 站：${nextNode.artifact}`,
    activeGuide: {
      ...activeGuide,
      routePlan: plan,
      continueNode: nextNode
    },
    routePlan: plan,
    guideAction: 'continue_guide',
    continueNode: nextNode
  }
}

function enrichGuideExecution(execution = {}, activeGuide = {}, toolName = '', decision = {}) {
  const routePlan = decision.routePlan || activeGuide.routePlan
  if (!routePlan || toolName !== 'control_trail') {
    return execution
  }
  const trailStatus = execution?.data?.trailStatus || execution?.trailStatus || {}
  const activeGuideState = trailStatus.status === 'arrived'
    ? advanceGuideState(
        decision.guideAction === 'continue_guide'
          ? { ...(activeGuide.state?.activeGuideState || {}), guidePlan: routePlan }
          : { guidePlan: routePlan, routeId: routePlan.id, routeTitle: routePlan.title, mode: routePlan.mode, currentNode: routePlan.currentNode, nextNode: 1, progress: { completed: 0, total: routePlan.nodes?.length || 0 }, status: 'active', startedAt: new Date().toISOString() },
        trailStatus
      )
    : null
  return {
    ...execution,
    data: {
      ...(execution.data || {}),
      routePlan,
      activeGuideState,
      guideAction: decision.guideAction || activeGuide.actionIntent || 'create_guide',
      guideFollowups: activeGuide.followups
    },
    message: createGuideExecutionMessage({
      routePlan,
      activeGuideState,
      decision,
      execution
    })
  }
}

function createGuideExecutionMessage({ routePlan, activeGuideState, decision, execution }) {
  if (decision.guideAction === 'continue_guide') {
    const node = decision.continueNode || routePlan?.nodes?.[activeGuideState?.currentNode]
    if (activeGuideState?.status === 'completed') {
      return `已到达「${node?.artifact || '本路线最后一站'}」。这条「${routePlan.title}」已经完成，你可以说“重新规划一下”继续探索。`
    }
    const nextNode = Number.isInteger(activeGuideState?.nextNode)
      ? routePlan?.nodes?.[activeGuideState.nextNode]
      : null
    return [
      `已带你到达「${node?.artifact || '下一站'}」。`,
      nextNode ? `准备好后说“继续”，我再带你去「${nextNode.artifact}」。` : '这条路线已经接近尾声。'
    ].filter(Boolean).join('\n')
  }
  return createGuideRouteMessage(routePlan, activeGuideState) || execution.message
}
