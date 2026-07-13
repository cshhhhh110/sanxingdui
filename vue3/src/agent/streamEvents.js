export const AGENT_EVENT_PREFIX = '[AGENT_EVENT]'

const EVENT_LABELS = {
  thinking_status: {
    icon: '🐱',
    message: '玄喵正在理解你的问题...'
  },
  knowledge_search: {
    icon: '📚',
    message: '正在查阅古蜀文明资料...'
  },
  tool_prepare: {
    icon: '🧭',
    message: '正在准备展馆能力...'
  },
  tool_execute: {
    icon: '✨',
    message: '正在调度展馆能力...'
  },
  relation_discovery: {
    icon: '🔎',
    message: '正在发现相关知识线索...'
  },
  proactive_direction: {
    icon: '🧭',
    message: '发现新的探索方向...'
  },
  route_planning: {
    icon: '🏛',
    message: '正在规划参观路线...'
  },
  guide_plan_created: {
    icon: '🏛',
    message: '已生成导览计划'
  },
  guide_preparing_visit: {
    icon: '🐱',
    message: '正在准备导览'
  },
  guide_introducing_destination: {
    icon: '📚',
    message: '正在介绍目的地'
  },
  guide_navigating: {
    icon: '🧭',
    message: '正在带你前往展线'
  },
  guide_first_stop_opening: {
    icon: '🧭',
    message: '正在打开第一站'
  },
  guide_arrived: {
    icon: '✓',
    message: '已到达导览站点'
  },
  guide_explaining: {
    icon: '✨',
    message: '正在开始讲解'
  },
  guide_status_synced: {
    icon: '✓',
    message: '展线状态已同步'
  },
  guide_continue_requested: {
    icon: '🧭',
    message: '正在继续导览'
  },
  guide_next_stop_opening: {
    icon: '✨',
    message: '正在打开下一站'
  },
  guide_completed: {
    icon: '✓',
    message: '导览路线已完成'
  },
  generating: {
    icon: '✍️',
    message: '正在生成讲解...'
  },
  completed: {
    icon: '✓',
    message: '探索完成'
  },
  error: {
    icon: '⚠️',
    message: '当前智能生成服务暂时不可用，正在切换备用资料方案...'
  }
}

export function createAgentStreamEvent(type, patch = {}) {
  const defaults = EVENT_LABELS[type] || EVENT_LABELS.thinking_status
  return {
    id: patch.id || `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    status: patch.status || 'running',
    icon: patch.icon || defaults.icon,
    message: patch.message || defaults.message,
    timestamp: patch.timestamp || new Date().toISOString(),
    metadata: patch.metadata || {}
  }
}

export function createContextStartEvent(context = {}) {
  const artifact = context.currentArtifact || context.artifactTitle || ''
  const trailNode = context.currentTrailNode || ''
  if (artifact) {
    return createAgentStreamEvent('thinking_status', {
      message: `正在结合你当前查看的${artifact}资料...`,
      metadata: { artifact, trailNode }
    })
  }
  if (trailNode) {
    return createAgentStreamEvent('thinking_status', {
      message: `正在结合当前展线节点：${trailNode}...`,
      metadata: { trailNode }
    })
  }
  return createAgentStreamEvent('thinking_status')
}

export function createKnowledgeEvent(referenceCount = 0, context = {}) {
  const artifact = context.currentArtifact || ''
  if (referenceCount > 0) {
    return createAgentStreamEvent('relation_discovery', {
      message: `已找到 ${referenceCount} 条相关资料线索，正在整理关联...`,
      metadata: { referenceCount, artifact }
    })
  }
  return createAgentStreamEvent('knowledge_search', {
    message: artifact
      ? `正在查阅${artifact}相关资料...`
      : '正在查阅古蜀文明资料...'
  })
}

export function createKnowledgeRelationEvent(knowledgeGraph = {}, context = {}) {
  const relations = Array.isArray(knowledgeGraph.relations) ? knowledgeGraph.relations : []
  const entities = Array.isArray(knowledgeGraph.entities) ? knowledgeGraph.entities : []
  const artifact = context.currentArtifact || ''
  if (relations.length) {
    const first = relations[0]
    return createAgentStreamEvent('relation_discovery', {
      message: `发现${first.sourceName}与${first.targetName}的关联线索，正在整理讲解脉络...`,
      metadata: {
        artifact,
        entities: entities.map((item) => item.name),
        relations: relations.slice(0, 5)
      }
    })
  }
  if (entities.length) {
    return createAgentStreamEvent('relation_discovery', {
      message: `识别到${entities.slice(0, 3).map((item) => item.name).join('、')}，正在组织知识关系...`,
      metadata: {
        artifact,
        entities: entities.map((item) => item.name),
        relations: []
      }
    })
  }
  return createAgentStreamEvent('relation_discovery', {
    message: artifact
      ? `正在分析${artifact}的相关文化关系...`
      : '正在分析相关文化关系...',
    metadata: { artifact, entities: [], relations: [] }
  })
}

export function createGuideRecommendationEvent(activeGuide = {}, context = {}) {
  const suggestions = Array.isArray(activeGuide.followups) ? activeGuide.followups : []
  const artifact = context.currentArtifact || activeGuide.state?.currentArtifact || ''
  const first = suggestions[0] || ''
  return createAgentStreamEvent('proactive_direction', {
    status: 'success',
    message: first
      ? `发现新的探索方向：${first}`
      : artifact
        ? `发现可以围绕${artifact}继续探索`
        : '发现新的探索方向',
    metadata: {
      artifact,
      suggestions,
      guideState: activeGuide.state || {},
      reason: activeGuide.proactive?.reason || ''
    }
  })
}

export function createGuideRoutePlanningEvent(routePlan = {}, context = {}) {
  const firstStop = routePlan.nodes?.[0] || routePlan.stops?.[0]
  return createAgentStreamEvent('guide_plan_created', {
    status: 'success',
    message: firstStop
      ? `已规划「${routePlan.title || '参观路线'}」，第一站是${firstStop.artifact || firstStop.artifactName}`
      : '已生成参观路线',
    metadata: {
      routePlan,
      context
    }
  })
}

export function createGuideFirstStopEvent(routePlan = {}) {
  const firstStop = routePlan.nodes?.[0] || routePlan.stops?.[0]
  return createAgentStreamEvent('guide_first_stop_opening', {
    message: firstStop
      ? `正在带你前往第一站：${firstStop.artifact || firstStop.artifactName}`
      : '正在打开导览第一站',
    metadata: { routePlan, node: firstStop || null }
  })
}

export function createGuideExperienceEvent(type, patch = {}) {
  return createAgentStreamEvent(type, patch)
}

export function createGuideStatusSyncedEvent(trailStatus = {}) {
  return createAgentStreamEvent('guide_status_synced', {
    status: trailStatus.status === 'failed' ? 'failed' : 'success',
    message: trailStatus.status === 'arrived'
      ? `已到达${trailStatus.artifactName || '目标展线节点'}`
      : trailStatus.status === 'failed'
        ? '展线状态同步失败'
        : '展线状态已同步',
    metadata: { trailStatus }
  })
}

export function createGuideContinueEvent(activeGuideState = {}) {
  const nextNode = activeGuideState.guidePlan?.nodes?.[activeGuideState.nextNode]
  return createAgentStreamEvent('guide_continue_requested', {
    message: nextNode
      ? `继续导览，准备前往${nextNode.artifact}`
      : '正在继续当前导览路线',
    metadata: { activeGuideState }
  })
}

export function createGuideNextStopEvent(node = {}) {
  return createAgentStreamEvent('guide_next_stop_opening', {
    message: node?.artifact
      ? `正在打开下一站：${node.artifact}`
      : '正在打开下一站',
    metadata: { node }
  })
}

export function createGuideCompletedEvent(activeGuideState = {}) {
  return createAgentStreamEvent('guide_completed', {
    status: 'success',
    message: activeGuideState.routeTitle
      ? `「${activeGuideState.routeTitle}」已完成`
      : '导览路线已完成',
    metadata: { activeGuideState }
  })
}

export function createToolEvent(toolName = '', phase = 'prepare', args = {}) {
  const friendly = getToolFriendlyMessage(toolName, args, phase)
  return createAgentStreamEvent(phase === 'execute' ? 'tool_execute' : 'tool_prepare', {
    message: friendly,
    metadata: { toolName, arguments: args }
  })
}

export function createGeneratingEvent() {
  return createAgentStreamEvent('generating')
}

export function createCompletedEvent(message = '探索完成') {
  return createAgentStreamEvent('completed', {
    status: 'success',
    message
  })
}

export function createErrorEvent(message = EVENT_LABELS.error.message) {
  return createAgentStreamEvent('error', {
    status: 'failed',
    message
  })
}

export function parseAgentStreamEvent(raw = '') {
  if (typeof raw !== 'string' || !raw.startsWith(AGENT_EVENT_PREFIX)) {
    return null
  }
  try {
    const payload = JSON.parse(raw.slice(AGENT_EVENT_PREFIX.length))
    return normalizeAgentStreamEvent(payload)
  } catch (error) {
    return createErrorEvent()
  }
}

export function serializeAgentStreamEvent(event = {}) {
  return `${AGENT_EVENT_PREFIX}${JSON.stringify(normalizeAgentStreamEvent(event))}`
}

export function streamEventToStep(event = {}) {
  const normalized = normalizeAgentStreamEvent(event)
  return {
    key: normalized.id,
    time: formatEventTime(normalized.timestamp),
    icon: normalized.icon,
    label: normalized.message,
    detail: '',
    status: normalized.status || 'running'
  }
}

export function normalizeAgentStreamEvent(event = {}) {
  const defaults = EVENT_LABELS[event.type] || EVENT_LABELS.thinking_status
  return {
    id: event.id || `${event.type || 'event'}-${Date.now()}`,
    type: event.type || 'thinking_status',
    status: event.status || 'running',
    icon: event.icon || defaults.icon,
    message: event.message || defaults.message,
    timestamp: event.timestamp || new Date().toISOString(),
    metadata: event.metadata || {}
  }
}

function getToolFriendlyMessage(toolName = '', args = {}, phase = 'prepare') {
  const keyword = args.keyword || args.artifactName || args.artifactTitle || args.city || args.target || ''
  const suffix = keyword ? `：${keyword}` : ''
  const actionMap = {
    search_product: `正在帮你查找相关文创商品${suffix}`,
    batch_create_order: `正在整理可购买的文创商品${suffix}`,
    control_trail: `正在带你进入对应时空展线${suffix}`,
    open_spacetime_trail: `正在带你进入对应时空展线${suffix}`,
    open_artifact_detail: `正在打开文物详情${suffix}`,
    play_artifact_voice: `正在准备文物语音讲解${suffix}`,
    get_weather: `正在查询参观出行信息${suffix}`
  }
  if (actionMap[toolName]) {
    return actionMap[toolName]
  }
  return phase === 'execute'
    ? '正在调度展馆能力...'
    : '正在准备展馆能力...'
}

function formatEventTime(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date()
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
