const SPEAKABLE_EVENT_TYPES = new Set([
  'thinking_status',
  'knowledge_search',
  'relation_discovery',
  'proactive_direction',
  'route_planning',
  'guide_plan_created',
  'guide_preparing_visit',
  'guide_introducing_destination',
  'guide_navigating',
  'guide_first_stop_opening',
  'guide_arrived',
  'guide_explaining',
  'guide_status_synced',
  'guide_continue_requested',
  'guide_next_stop_opening',
  'guide_completed',
  'tool_prepare',
  'completed',
  'error'
])

export function createVoicePolicySession(options = {}) {
  return {
    id: options.id || `voice-policy-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    question: String(options.question || '').trim(),
    route: options.route || '',
    context: options.context || {},
    spoken: {
      start: false,
      clue: false,
      guide: false,
      completed: false,
      error: false
    }
  }
}

export function selectAgentVoiceCue(event = {}, session = null) {
  if (!event || !session || !SPEAKABLE_EVENT_TYPES.has(event.type)) {
    return null
  }

  if (event.type === 'error') {
    if (session.spoken.error) return null
    session.spoken.error = true
    return buildCue('error', '当前语音服务可能不稳定，请先查看文字讲解。', event, {
      priority: 90,
      interrupt: false
    })
  }

  if (isGuideExperienceEvent(event.type)) {
    const key = `experience_${event.type}`
    if (session.spoken[key]) return null
    session.spoken[key] = true
    return buildCue(key, event.message || buildGuideCue(event), event, {
      priority: event.type === 'guide_arrived' || event.type === 'guide_explaining' ? 50 : 38,
      interrupt: false
    })
  }

  if (!session.spoken.start && isStartEvent(event)) {
    session.spoken.start = true
    return buildCue('start', buildStartCue(session, event), event, {
      priority: 40,
      interrupt: false
    })
  }

  // Ordinary Q&A speaks one preparation cue at most. Later exploration
  // events stay visual so the answer audio can start without queueing behind them.
  return null
}

export function createVoiceTraceEvent(cue = {}, event = {}) {
  if (!cue?.text) return null
  return {
    id: cue.id || `voice-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: cue.type || 'cue',
    text: cue.text,
    sourceEventType: event.type || cue.sourceEventType || '',
    timestamp: new Date().toISOString()
  }
}

function isStartEvent(event = {}) {
  return event.type === 'thinking_status' ||
    event.type === 'knowledge_search' ||
    event.type === 'route_planning' ||
    event.type === 'guide_plan_created' ||
    event.type === 'guide_preparing_visit' ||
    event.type === 'guide_introducing_destination' ||
    event.type === 'guide_first_stop_opening' ||
    event.type === 'tool_prepare'
}

function isGuideExperienceEvent(type = '') {
  return [
    'guide_preparing_visit',
    'guide_introducing_destination',
    'guide_navigating',
    'guide_arrived',
    'guide_explaining'
  ].includes(type)
}

function buildCue(type, text, event, options = {}) {
  return {
    id: `voice-${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    text,
    priority: Number(options.priority) || 0,
    interrupt: Boolean(options.interrupt),
    sourceEventType: event.type || '',
    metadata: {
      ...(event.metadata || {}),
      policy: 'agent-voice-policy'
    }
  }
}

function buildStartCue(session, event) {
  const question = session.question
  const context = session.context || {}
  const artifact = context.currentArtifact || context.artifactTitle || ''

  if (event.type === 'tool_prepare') {
    return buildToolStartCue(event.metadata?.toolName || '', event.metadata?.arguments || {})
  }

  if (artifact) {
    return `我先结合你正在看的${artifact}来查找线索。`
  }

  if (question.includes('三星堆') && question.includes('金沙')) {
    return '让我帮你查找三星堆和金沙之间的联系。'
  }

  if (question.includes('青铜神树')) {
    return '我来帮你梳理青铜神树的相关资料。'
  }

  if (question.includes('金面具') || question.includes('黄金面具')) {
    return '我来帮你查找金面具的相关线索。'
  }

  return '让我先帮你查找相关资料。'
}

function buildToolStartCue(toolName, args = {}) {
  const target = args.artifactName || args.artifactTitle || args.keyword || args.target || ''
  if (toolName === 'control_trail' || toolName === 'open_spacetime_trail') {
    return target ? `我来帮你打开${target}的展线。` : '我来帮你打开对应的展线。'
  }
  if (toolName === 'search_product') {
    return target ? `我来帮你查找${target}相关文创。` : '我来帮你查找相关文创。'
  }
  if (toolName === 'get_weather') {
    return '我来帮你查询参观出行信息。'
  }
  return '我来帮你执行这个操作。'
}

function buildGuideCue(event = {}) {
  if (event.type === 'route_planning' || event.type === 'guide_plan_created' || event.type === 'guide_first_stop_opening') {
    const firstStop =
      event.metadata?.routePlan?.nodes?.[0]?.artifact ||
      event.metadata?.routePlan?.stops?.[0]?.artifactName ||
      event.metadata?.node?.artifact ||
      ''
    return firstStop
      ? `我先带你从${firstStop}这一站开始看。`
      : '我正在帮你规划一条参观路线。'
  }
  if (event.type === 'guide_continue_requested' || event.type === 'guide_next_stop_opening') {
    const nextStop =
      event.metadata?.activeGuideState?.guidePlan?.nodes?.[event.metadata?.activeGuideState?.nextNode]?.artifact ||
      event.metadata?.node?.artifact ||
      ''
    return nextStop
      ? `我们继续前往${nextStop}。`
      : '我们继续当前导览路线。'
  }
  const suggestion = event.metadata?.suggestions?.[0] || ''
  return suggestion
    ? `我发现一个可以继续探索的方向：${suggestion}。`
    : '我发现了一个新的探索方向。'
}
