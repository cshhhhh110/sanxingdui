const DEFAULT_SESSION_LABEL = '玄喵探索'

export function buildExplorationTrace(trace = {}, options = {}) {
  const context = options.context || {}
  const references = Array.isArray(options.references) ? options.references : []
  const normalizedTrace = normalizeTrace(trace)
  const sources = references.map(normalizeSource).filter(Boolean)
  const knowledgeGraph = options.knowledgeGraph || discoverKnowledgeRelations({
    question: options.message || normalizedTrace.message || '',
    context,
    references: sources
  })
  const activeGuide = options.activeGuide || normalizedTrace.activeGuide || buildActiveGuideContext(
    options.message || normalizedTrace.message || '',
    context,
    knowledgeGraph
  )
  const graphEntities = Array.isArray(knowledgeGraph.entities) ? knowledgeGraph.entities : []
  const entities = graphEntities.length
    ? graphEntities.map((item) => item.name)
    : inferEntities({
        message: options.message || normalizedTrace.message || '',
        context,
        references: sources,
        route: normalizedTrace.route,
        toolName: normalizedTrace.toolName || normalizedTrace.tool
      })
  const userFriendlySteps = buildUserFriendlySteps(normalizedTrace, {
    references: sources,
    entities,
    context,
    knowledgeGraph
  })

  return {
    sessionId: context.sessionId || normalizedTrace.sessionId || '',
    userIntent: inferUserIntent(normalizedTrace, options.message || ''),
    userFriendlySteps,
    technicalTrace: {
      route: normalizedTrace.route || '',
      toolName: normalizedTrace.toolName || normalizedTrace.tool || '',
      tool: normalizedTrace.toolName || normalizedTrace.tool || '',
      arguments: normalizedTrace.arguments || {},
      duration: Number(normalizedTrace.duration) || 0,
      status: normalizedTrace.status || '',
      result: normalizedTrace.result || '',
      confidence: Number(normalizedTrace.confidence) || 0,
      reason: normalizedTrace.reason || '',
      documents: sources,
      knowledgeGraph,
      activeGuide,
      voiceUsed: Boolean(normalizedTrace.voiceUsed),
      voiceEvents: normalizeVoiceEvents(normalizedTrace.voiceEvents),
      steps: Array.isArray(normalizedTrace.steps) ? normalizedTrace.steps : []
    },
    knowledge: {
      sources,
      entities,
      entityDetails: graphEntities,
      relations: Array.isArray(knowledgeGraph.relations) ? knowledgeGraph.relations : [],
      graph: knowledgeGraph
    },
    guide: activeGuide,
    actions: inferActions(normalizedTrace),
    recommendation: buildActiveGuideFollowups({
      question: options.message || normalizedTrace.message || '',
      context,
      knowledgeGraph
    }).length
      ? buildActiveGuideFollowups({
          question: options.message || normalizedTrace.message || '',
          context,
          knowledgeGraph
        })
      : buildKnowledgeFollowupSuggestions(knowledgeGraph).length
        ? buildKnowledgeFollowupSuggestions(knowledgeGraph)
        : inferRecommendations(entities),
    contextLine: buildContextLine(context, entities),
    voiceUsed: Boolean(normalizedTrace.voiceUsed),
    voiceEvents: normalizeVoiceEvents(normalizedTrace.voiceEvents),
    status: normalizedTrace.status || 'running'
  }
}

export function mergeExplorationTrace(previous = null, trace = {}, options = {}) {
  const next = buildExplorationTrace(trace, options)
  if (!previous) {
    return next
  }

  const previousSources = previous.knowledge?.sources || []
  const mergedSources = dedupeByKey([
    ...previousSources,
    ...(next.knowledge?.sources || [])
  ], (item) => item.path || item.title)
  const mergedEntities = dedupeByKey([
    ...(previous.knowledge?.entities || []),
    ...(next.knowledge?.entities || [])
  ], (item) => item)

  return {
    ...previous,
    ...next,
    knowledge: {
      sources: mergedSources,
      entities: mergedEntities
    },
    userFriendlySteps: mergeSteps(previous.userFriendlySteps || [], next.userFriendlySteps || [])
  }
}

export function formatExplorationStatus(trace = {}) {
  if (trace.status === 'running') return '探索中'
  if (trace.status === 'failed') return '遇到阻碍'
  if (trace.status === 'success') return '已完成'
  return '待继续'
}

export function buildFloatingExplorationLines(trace = {}, options = {}) {
  const exploration = buildExplorationTrace(trace, options)
  const steps = exploration.userFriendlySteps || []
  const latestRunning = [...steps].reverse().find((step) => step.status === 'running')
  const latest = latestRunning || steps[steps.length - 1]
  const lines = ['玄喵正在探索']

  if (exploration.contextLine) {
    lines.push(exploration.contextLine)
  }
  if (latest?.label) {
    lines.push(`${latest.icon || '🐱'} ${latest.label}`)
  }
  if (latest?.detail) {
    lines.push(latest.detail)
  }

  return lines.slice(0, 4)
}

function normalizeTrace(trace = {}) {
  return {
    ...trace,
    route: trace.route || '',
    toolName: trace.toolName || trace.tool || '',
    tool: trace.toolName || trace.tool || '',
    arguments: trace.arguments || {},
    status: trace.status || 'running',
    duration: Number(trace.duration) || 0,
    voiceUsed: Boolean(trace.voiceUsed),
    voiceEvents: normalizeVoiceEvents(trace.voiceEvents),
    steps: Array.isArray(trace.steps) ? trace.steps : []
  }
}

function buildUserFriendlySteps(trace, { references = [], entities = [], context = {}, knowledgeGraph = {} } = {}) {
  const steps = []
  const route = trace.route || ''
  const toolName = trace.toolName || trace.tool || ''

  steps.push({
    key: 'understand',
    time: getTimelineTime(0),
    icon: '🐱',
    label: context.currentArtifact
      ? `结合当前参观对象：${context.currentArtifact}`
      : '理解你的问题',
    detail: context.currentPage ? `当前参观位置：${context.currentScene || context.currentPage}` : '',
    status: route || trace.status !== 'running' ? 'success' : 'running'
  })

  if (route === 'RAG') {
    steps.push({
      key: 'knowledge',
      time: getTimelineTime(1),
      icon: '📚',
      label: '查阅古蜀文明资料',
      detail: entities.length ? `重点线索：${entities.slice(0, 3).join('、')}` : '',
      status: references.length || trace.status === 'success' ? 'success' : 'running'
    })
    steps.push({
      key: 'sources',
      time: getTimelineTime(2),
      icon: '🔎',
      label: references.length ? `找到 ${references.length} 条资料线索` : '筛选相关资料线索',
      detail: references.slice(0, 2).map((item) => item.title).filter(Boolean).join('；'),
      status: references.length ? 'success' : (trace.status === 'failed' ? 'failed' : 'running')
    })
  } else if (route === 'TOOL_CALL') {
    steps.push({
      key: 'action',
      time: getTimelineTime(1),
      icon: '🧭',
      label: getToolFriendlyLabel(toolName),
      detail: getToolTarget(trace.arguments),
      status: trace.status === 'failed' ? 'failed' : (trace.status === 'success' ? 'success' : 'running')
    })
  } else if (route === 'UNSUPPORTED') {
    steps.push({
      key: 'unsupported',
      time: getTimelineTime(1),
      icon: '⚠️',
      label: '确认当前能力边界',
      detail: '玄喵会说明目前还不能完成的部分',
      status: trace.status === 'failed' ? 'failed' : 'running'
    })
  } else {
    steps.push({
      key: 'answer',
      time: getTimelineTime(1),
      icon: '💬',
      label: '整理讲解内容',
      detail: '',
      status: trace.status === 'success' ? 'success' : 'running'
    })
  }

  if (trace.status && trace.status !== 'running') {
    steps.push({
      key: 'complete',
      time: getTimelineTime(3),
      icon: trace.status === 'failed' ? '⚠️' : '✨',
      label: trace.status === 'failed' ? '探索暂时受阻' : '完成讲解',
      detail: trace.result || '',
      status: trace.status
    })
  }

  return steps
}

function inferUserIntent(trace, message) {
  if (trace.route === 'RAG') return '知识讲解'
  if (trace.route === 'TOOL_CALL') return '展馆操作'
  if (trace.route === 'UNSUPPORTED') return '能力确认'
  if (message) return '自由问答'
  return DEFAULT_SESSION_LABEL
}

function inferEntities({ message = '', context = {}, references = [], route = '', toolName = '' } = {}) {
  const text = [
    message,
    context.currentArtifact,
    context.currentScene,
    context.currentTrailNode,
    ...references.map((item) => `${item.title || ''} ${item.path || ''}`)
  ].filter(Boolean).join(' ')

  const candidates = [
    '三星堆',
    '金沙遗址',
    '古蜀文明',
    '金面具',
    '青铜神树',
    '青铜纵目面具',
    '青铜大立人',
    '金杖',
    '祭祀坑',
    '青铜文化',
    '祭祀体系',
    '文创商城',
    '时空展线'
  ]
  const found = candidates.filter((entity) => text.includes(entity))

  if (route === 'TOOL_CALL' && toolName?.includes('product')) {
    found.push('文创商城')
  }
  if (!found.length && route === 'RAG') {
    found.push('三星堆', '古蜀文明')
  }

  return dedupeByKey(found, (item) => item).slice(0, 6)
}

function inferActions(trace) {
  if (trace.route !== 'TOOL_CALL') {
    return []
  }
  const toolName = trace.toolName || trace.tool || ''
  return [{
    type: toolName || 'tool',
    label: getToolFriendlyLabel(toolName),
    target: getToolTarget(trace.arguments)
  }]
}

function inferRecommendations(entities = []) {
  return entities.slice(0, 4).map((entity) => `继续了解${entity}`)
}

function buildContextLine(context = {}, entities = []) {
  if (context.currentArtifact && entities.length) {
    const next = entities.find((entity) => entity !== context.currentArtifact)
    return next
      ? `基于你的当前探索：${context.currentArtifact} → ${next}`
      : `基于你的当前探索：${context.currentArtifact}`
  }
  if (context.currentArtifact) {
    return `基于你的当前探索：${context.currentArtifact}`
  }
  if (context.currentTrailNode) {
    return `基于你的展线位置：${context.currentTrailNode}`
  }
  return ''
}

function getToolFriendlyLabel(toolName = '') {
  const labelMap = {
    search_product: '前往文创商城查找商品',
    batch_create_order: '整理可购买的文创商品',
    open_spacetime_trail: '打开时空展线',
    open_artifact_detail: '打开文物详情',
    play_artifact_voice: '播放文物讲解',
    get_weather: '查询参观出行信息'
  }
  return labelMap[toolName] || '调用展馆服务'
}

function getToolTarget(args = {}) {
  const target = args.keyword || args.artifactName || args.artifactTitle || args.city || args.target || args.entityId || ''
  return target ? `目标：${target}` : ''
}

function normalizeSource(source = {}) {
  if (!source || typeof source !== 'object') return null
  return {
    title: source.title || source.name || '知识库资料',
    path: source.path || source.filePath || '',
    score: Number(source.score) || 0,
    type: source.type || 'document',
    obsidianUri: source.obsidianUri || '',
    openUrl: source.openUrl || ''
  }
}

function normalizeVoiceEvents(events = []) {
  if (!Array.isArray(events)) return []
  return events.map((event) => ({
    id: event.id || '',
    type: event.type || '',
    text: event.text || '',
    sourceEventType: event.sourceEventType || '',
    timestamp: event.timestamp || ''
  })).filter((event) => event.type || event.text)
}

function mergeSteps(previousSteps, nextSteps) {
  const byKey = new Map()
  previousSteps.forEach((step) => byKey.set(step.key, step))
  nextSteps.forEach((step) => byKey.set(step.key, { ...byKey.get(step.key), ...step }))
  return Array.from(byKey.values())
}

function dedupeByKey(items, getKey) {
  const seen = new Set()
  const result = []
  items.forEach((item) => {
    const key = getKey(item)
    if (!key || seen.has(key)) return
    seen.add(key)
    result.push(item)
  })
  return result
}

function getTimelineTime(offsetSeconds = 0) {
  const date = new Date(Date.now() + offsetSeconds * 1000)
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
import {
  buildKnowledgeFollowupSuggestions,
  discoverKnowledgeRelations
} from './knowledgeGraph'
import {
  buildActiveGuideContext,
  buildActiveGuideFollowups
} from './activeGuide'
