const nowMs = () => Math.round(performance.now())

export function createAgentTrace({ surface = '', message = '' } = {}) {
  const startedAt = nowMs()
  return {
    route: '',
    toolName: '',
    tool: '',
    arguments: {},
    status: 'running',
    duration: 0,
    result: '',
    confidence: 0,
    reason: '',
    surface,
    message,
    startedAt,
    steps: [
      {
        key: 'understanding',
        label: '正在理解需求',
        status: 'running',
        detail: '',
        duration: 0
      }
    ]
  }
}

export function updateTraceStep(trace, key, patch = {}) {
  const next = cloneTrace(trace)
  const index = next.steps.findIndex((step) => step.key === key)
  if (index >= 0) {
    next.steps[index] = {
      ...next.steps[index],
      ...patch
    }
  } else {
    next.steps.push({
      key,
      label: patch.label || key,
      status: patch.status || 'pending',
      detail: patch.detail || '',
      duration: patch.duration || 0
    })
  }
  next.duration = nowMs() - next.startedAt
  return next
}

export function applyAgentDecision(trace, decision = {}, route = '') {
  const toolName = decision?.toolName || decision?.tool || ''
  const next = updateTraceStep(trace, 'understanding', {
    status: 'success',
    detail: `意图识别：${route || decision?.route || 'DIRECT_ANSWER'}`
  })

  next.route = route || decision?.route || ''
  next.toolName = toolName
  next.tool = toolName
  next.arguments = decision?.arguments || {}
  next.confidence = Number(decision?.confidence) || 0
  next.reason = decision?.reason || ''

  next.steps.push({
    key: 'route',
    label: '选择能力',
    status: 'success',
    detail: buildRouteDetail(next),
    duration: next.duration
  })
  next.duration = nowMs() - next.startedAt
  return next
}

export function markToolRunning(trace, toolName, args = {}) {
  const detail = Object.keys(args || {}).length
    ? `调用工具：${toolName}，参数：${safeJson(args)}`
    : `调用工具：${toolName}`
  return updateTraceStep(trace, 'tool', {
    label: '调用工具',
    status: 'running',
    detail
  })
}

export function finishAgentTrace(trace, { status = 'success', result = '', data = null } = {}) {
  const next = cloneTrace(trace)
  next.status = status
  next.result = result || ''
  next.data = data || null
  next.duration = nowMs() - next.startedAt
  next.steps.push({
    key: 'result',
    label: '完成任务',
    status,
    detail: result || (status === 'success' ? '执行完成' : '执行失败'),
    duration: next.duration
  })
  return next
}

export function normalizeAgentTrace(trace = null, fallback = {}) {
  if (!trace) {
    return {
      route: fallback.route || '',
      toolName: fallback.toolName || fallback.tool || '',
      tool: fallback.toolName || fallback.tool || '',
      arguments: fallback.arguments || {},
      status: fallback.status || '',
      duration: fallback.duration || 0,
      result: fallback.result || fallback.message || '',
      confidence: Number(fallback.confidence) || 0,
      reason: fallback.reason || '',
      steps: []
    }
  }

  const toolName = trace.toolName || trace.tool || fallback.toolName || fallback.tool || ''
  return {
    ...fallback,
    ...trace,
    toolName,
    tool: toolName,
    arguments: trace.arguments || fallback.arguments || {},
    duration: Number(trace.duration || fallback.duration) || 0,
    confidence: Number(trace.confidence || fallback.confidence) || 0,
    steps: Array.isArray(trace.steps) ? trace.steps : []
  }
}

function buildRouteDetail(trace) {
  if (trace.route === 'TOOL_CALL') {
    return trace.toolName ? `意图识别：TOOL_CALL，工具：${trace.toolName}` : '意图识别：TOOL_CALL'
  }
  if (trace.route === 'RAG') {
    return '意图识别：RAG，检索知识库'
  }
  if (trace.route === 'UNSUPPORTED') {
    return '意图识别：UNSUPPORTED，当前能力未接入'
  }
  return `意图识别：${trace.route || 'DIRECT_ANSWER'}`
}

function cloneTrace(trace) {
  return {
    ...trace,
    steps: Array.isArray(trace?.steps) ? trace.steps.map((step) => ({ ...step })) : []
  }
}

function safeJson(value) {
  try {
    return JSON.stringify(value)
  } catch (error) {
    return String(value)
  }
}
