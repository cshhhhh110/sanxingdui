import {
  advanceGuideState,
  buildActiveGuideStateFromPlan,
  cancelGuideState,
  normalizeActiveGuideState,
  normalizeGuideHistory,
  normalizeTrailStatus,
  resolveGuideArtifact
} from './activeGuide'

const STORAGE_KEY = 'xuanmiao_short_context'
const RECENT_MESSAGE_LIMIT = 8
const RECENT_TOOL_LIMIT = 6
const HISTORY_ARTIFACT_LIMIT = 10
const HISTORY_ROUTE_LIMIT = 5
const HISTORY_TOPIC_LIMIT = 10

const PRONOUN_PATTERN = /(它|他|她|这件|这个|该文物|刚才那个|刚刚那个)/
const KNOWN_ARTIFACTS = [
  { name: '金面具', id: 'HI-2025-002' },
  { name: '黄金面具', id: 'HI-2025-002' },
  { name: '青铜纵目面具', id: 'HI-2025-003' },
  { name: '纵目面具', id: 'HI-2025-003' },
  { name: '金杖', id: 'HI-2025-004' },
  { name: '青铜大立人', id: 'HI-2025-005' },
  { name: '大立人', id: 'HI-2025-005' },
  { name: '青铜神树', id: 'HI-2025-006' },
  { name: '神树', id: 'HI-2025-006' }
]

const state = loadState()
const listeners = new Set()

export function getXuanmiaoContext() {
  return cloneContext(state)
}

export function getXuanmiaoContextPayload(extra = {}) {
  return compactContext({
    ...getXuanmiaoContext(),
    ...extra
  })
}

export function getXuanmiaoExplorationState() {
  return normalizeGuideHistory(state.explorationHistory)
}

export function updateXuanmiaoContext(patch = {}) {
  mergeIntoState(patch)
  persist()
  notify()
  return getXuanmiaoContext()
}

export function setXuanmiaoTrailStatus(trailStatus = {}) {
  const status = normalizeTrailStatus(trailStatus)
  const patch = {
    trailStatus: status,
    currentPage: status.page || state.currentPage,
    currentScene: status.scene || state.currentScene,
    currentTrailNodeId: status.trailNodeId || state.currentTrailNodeId
  }
  const artifact = resolveGuideArtifact(status.artifactName, status.artifactId)
  if (status.artifactId) patch.currentArtifactId = status.artifactId
  if (status.artifactName || artifact?.name) patch.currentArtifact = status.artifactName || artifact.name
  if (artifact || status.artifactName || status.artifactId) {
    patch.explorationHistory = recordExplorationHistory({
      artifactName: status.artifactName || artifact?.name || '',
      artifactId: status.artifactId || artifact?.id || '',
      topic: artifact?.themes?.[0] || ''
    })
  }
  return updateXuanmiaoContext(patch)
}

export function startXuanmiaoGuide(plan = null, trailStatus = {}) {
  const activeGuideState = buildActiveGuideStateFromPlan(plan)
  if (!activeGuideState) {
    return getXuanmiaoContext()
  }
  const status = normalizeTrailStatus(trailStatus)
  const nextState = status.status === 'arrived'
    ? advanceGuideState(activeGuideState, status)
    : activeGuideState
  return updateXuanmiaoContext({
    activeGuideState: nextState,
    trailStatus: status.status ? status : state.trailStatus,
    explorationHistory: recordExplorationHistory({
      route: plan
    })
  })
}

export function updateXuanmiaoGuideProgress(trailStatus = {}) {
  const status = normalizeTrailStatus(trailStatus)
  const nextState = advanceGuideState(state.activeGuideState, status)
  return updateXuanmiaoContext({
    activeGuideState: nextState,
    trailStatus: status.status ? status : state.trailStatus
  })
}

export function cancelXuanmiaoGuide() {
  const cancelled = cancelGuideState(state.activeGuideState)
  if (!cancelled) return getXuanmiaoContext()
  return updateXuanmiaoContext({
    activeGuideState: cancelled
  })
}

export function setXuanmiaoPageContext({ currentPage = '', currentScene = '' } = {}) {
  return updateXuanmiaoContext({
    currentPage,
    currentScene
  })
}

export function setXuanmiaoArtifactContext(artifact = {}, meta = {}) {
  if (!artifact) {
    return getXuanmiaoContext()
  }

  const title = artifact.displayTitle || artifact.title || artifact.name || artifact.currentArtifact || ''
  const entityId = artifact.entityId || artifact.artifactId || artifact.id || artifact.currentArtifactId || ''
  const nextHistory = recordExplorationHistory({
    artifactName: title,
    artifactId: entityId,
    topic: meta.lastTopic || (title ? '文物介绍' : '')
  })

  return updateXuanmiaoContext({
    currentArtifact: title || state.currentArtifact,
    currentArtifactId: entityId || state.currentArtifactId,
    currentScene: meta.currentScene || state.currentScene,
    currentPage: meta.currentPage || state.currentPage,
    lastTopic: meta.lastTopic || (title ? '文物介绍' : state.lastTopic),
    lastAction: meta.lastAction || state.lastAction,
    explorationHistory: nextHistory
  })
}

export function setXuanmiaoTrailNode(node = {}, meta = {}) {
  const nextNode = typeof node === 'string'
    ? { id: node, label: node }
    : {
        id: node.id || node.nodeId || node.key || '',
        label: node.label || node.title || node.name || node.id || ''
      }

  return updateXuanmiaoContext({
    currentTrailNode: nextNode.label || nextNode.id || state.currentTrailNode,
    currentTrailNodeId: nextNode.id || state.currentTrailNodeId,
    currentScene: meta.currentScene || state.currentScene || '时空展线',
    currentPage: meta.currentPage || state.currentPage,
    explorationHistory: recordExplorationHistory({
      topic: nextNode.label || nextNode.id || ''
    })
  })
}

export function rememberXuanmiaoMessage(role, content, meta = {}) {
  const text = String(content || '').trim()
  if (!text) {
    return getXuanmiaoContext()
  }

  const message = {
    role,
    content: text.slice(0, 240),
    at: Date.now(),
    topic: meta.topic || ''
  }
  const artifact = role === 'user' ? inferArtifactFromText(text) : null
  const topic = meta.topic || inferTopicFromText(text)
  return updateXuanmiaoContext({
    recentMessages: [...state.recentMessages, message].slice(-RECENT_MESSAGE_LIMIT),
    lastTopic: topic || state.lastTopic,
    currentArtifact: artifact?.name || state.currentArtifact,
    currentArtifactId: artifact?.id || state.currentArtifactId,
    explorationHistory: recordExplorationHistory({
      artifactName: artifact?.name || '',
      artifactId: artifact?.id || '',
      topic
    })
  })
}

export function rememberXuanmiaoTool(toolName, args = {}, result = {}, meta = {}) {
  const item = {
    toolName: toolName || '',
    arguments: args || {},
    success: result?.success !== false,
    message: result?.message || result?.result || '',
    at: Date.now()
  }

  const patch = {
    recentTools: [...state.recentTools, item].slice(-RECENT_TOOL_LIMIT),
    lastAction: meta.lastAction || toolName || state.lastAction,
    lastResult: item.message || state.lastResult,
    explorationHistory: recordExplorationHistory({
      route: meta.routePlan || result?.data?.routePlan || null
    })
  }

  applyToolResultToPatch(toolName, args, result, patch)
  return updateXuanmiaoContext(patch)
}

export function buildContextualQuestion(question, context = state) {
  const text = String(question || '').trim()
  if (!text) {
    return text
  }

  const artifact = context.currentArtifact || ''
  const artifactId = context.currentArtifactId || ''
  if (!artifact || !PRONOUN_PATTERN.test(text)) {
    return text
  }

  const idPart = artifactId ? `（${artifactId}）` : ''
  return `当前参观对象是${artifact}${idPart}。用户追问：${text}`
}

export function subscribeXuanmiaoContext(listener) {
  if (typeof listener !== 'function') {
    return () => {}
  }
  listeners.add(listener)
  listener(getXuanmiaoContext())
  return () => listeners.delete(listener)
}

export function resetXuanmiaoContext() {
  const fresh = createDefaultContext()
  Object.keys(state).forEach((key) => {
    delete state[key]
  })
  Object.assign(state, fresh)
  persist()
  notify()
  return getXuanmiaoContext()
}

export function recordXuanmiaoExploration(input = {}) {
  return updateXuanmiaoContext({
    explorationHistory: recordExplorationHistory(input)
  })
}

function createDefaultContext() {
  return {
    sessionId: createSessionId(),
    userId: null,
    currentPage: '',
    currentScene: '',
    currentArtifact: '',
    currentArtifactId: '',
    currentTrailNode: '',
    currentTrailNodeId: '',
    trailStatus: {
      artifactId: '',
      artifactName: '',
      trailNodeId: '',
      scene: '',
      page: '',
      status: ''
    },
    activeGuideState: {
      routeId: '',
      routeTitle: '',
      mode: '',
      currentNode: null,
      nextNode: null,
      progress: { completed: 0, total: 0 },
      startedAt: '',
      lastUpdatedAt: '',
      status: '',
      guidePlan: null
    },
    recentMessages: [],
    recentTools: [],
    lastTopic: '',
    lastAction: '',
    lastResult: '',
    explorationHistory: {
      viewedArtifacts: [],
      completedRoutes: [],
      exploredTopics: [],
      lastGuideSuggestions: []
    },
    updatedAt: Date.now()
  }
}

function loadState() {
  if (typeof window === 'undefined') {
    return createDefaultContext()
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return createDefaultContext()
    }
    return normalizeContext(JSON.parse(raw))
  } catch (error) {
    return createDefaultContext()
  }
}

function normalizeContext(value = {}) {
  const defaults = createDefaultContext()
  return {
    ...defaults,
    ...value,
    sessionId: value.sessionId || defaults.sessionId,
    recentMessages: Array.isArray(value.recentMessages)
      ? value.recentMessages.slice(-RECENT_MESSAGE_LIMIT)
      : [],
    recentTools: Array.isArray(value.recentTools)
      ? value.recentTools.slice(-RECENT_TOOL_LIMIT)
      : [],
    trailStatus: normalizeTrailStatus(value.trailStatus || {}),
    activeGuideState: normalizeActiveGuideState(value.activeGuideState || {}),
    explorationHistory: normalizeGuideHistory(value.explorationHistory || {})
  }
}

function mergeIntoState(patch = {}) {
  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined) {
      state[key] = value
    }
  })
  state.updatedAt = Date.now()
}

function applyToolResultToPatch(toolName, args = {}, result = {}, patch = {}) {
  if (toolName === 'control_trail') {
    const trailStatus = normalizeTrailStatus(result?.data?.trailStatus || result?.trailStatus || {})
    patch.trailStatus = trailStatus.status
      ? trailStatus
      : {
          artifactId: args.artifact_id || args.entityId || '',
          artifactName: '',
          trailNodeId: args.action || '',
          scene: '时空展线',
          page: '/trail',
          status: result?.success === false ? 'failed' : 'executing'
        }
    patch.currentPage = patch.trailStatus.page || '/trail'
    patch.currentScene = patch.trailStatus.scene || '时空展线'
    patch.currentTrailNode = args.action || patch.currentTrailNode || state.currentTrailNode
    patch.currentTrailNodeId = patch.trailStatus.trailNodeId || state.currentTrailNodeId
    const artifactId = patch.trailStatus.artifactId || args.artifact_id || args.entityId || result?.data?.artifactId || result?.data?.entityId || ''
    const artifact = resolveGuideArtifact(patch.trailStatus.artifactName, artifactId)
    if (artifactId) {
      patch.currentArtifactId = artifactId
    }
    if (patch.trailStatus.artifactName || artifact?.name) {
      patch.currentArtifact = patch.trailStatus.artifactName || artifact.name
    }
    if (result?.data?.activeGuideState) {
      patch.activeGuideState = normalizeActiveGuideState(result.data.activeGuideState)
    } else if (result?.data?.routePlan) {
      patch.activeGuideState = patch.trailStatus.status === 'arrived'
        ? advanceGuideState(buildActiveGuideStateFromPlan(result.data.routePlan), patch.trailStatus)
        : buildActiveGuideStateFromPlan(result.data.routePlan)
    } else if (state.activeGuideState?.routeId && patch.trailStatus.status === 'arrived') {
      patch.activeGuideState = advanceGuideState(state.activeGuideState, patch.trailStatus)
    }
    patch.explorationHistory = recordExplorationHistory({
      artifactName: artifact?.name || '',
      artifactId,
      topic: artifact?.themes?.[0] || '',
      route: result?.data?.routePlan || null
    })
  }

  if (toolName === 'open_artifact_detail') {
    patch.currentScene = '文物详情'
    patch.currentArtifactId = args.artifact_id || args.entityId || state.currentArtifactId
  }
}

function compactContext(context = {}) {
  return {
    sessionId: context.sessionId || '',
    userId: context.userId || null,
    currentPage: context.currentPage || '',
    currentScene: context.currentScene || '',
    currentArtifact: context.currentArtifact || '',
    currentArtifactId: context.currentArtifactId || '',
    currentTrailNode: context.currentTrailNode || '',
    currentTrailNodeId: context.currentTrailNodeId || '',
    trailStatus: normalizeTrailStatus(context.trailStatus || {}),
    activeGuideState: normalizeActiveGuideState(context.activeGuideState || {}),
    recentMessages: Array.isArray(context.recentMessages) ? context.recentMessages.slice(-RECENT_MESSAGE_LIMIT) : [],
    recentTools: Array.isArray(context.recentTools) ? context.recentTools.slice(-RECENT_TOOL_LIMIT) : [],
    lastTopic: context.lastTopic || '',
    lastAction: context.lastAction || '',
    lastResult: context.lastResult || '',
    explorationHistory: normalizeGuideHistory(context.explorationHistory || {}),
    updatedAt: context.updatedAt || Date.now()
  }
}

function recordExplorationHistory(input = {}) {
  const history = normalizeGuideHistory(state.explorationHistory || {})
  const artifactName = input.artifactName || input.currentArtifact || ''
  const artifactId = input.artifactId || input.currentArtifactId || ''
  const resolvedArtifact = resolveGuideArtifact(artifactName, artifactId)
  const topic = input.topic || ''
  const route = input.route || null

  if (resolvedArtifact || artifactName || artifactId) {
    history.viewedArtifacts = upsertHistoryItem(
      history.viewedArtifacts,
      {
        id: resolvedArtifact?.id || artifactId,
        name: resolvedArtifact?.name || artifactName,
        at: Date.now()
      },
      (item) => item.id || item.name,
      HISTORY_ARTIFACT_LIMIT
    )
  }

  if (topic) {
    history.exploredTopics = upsertHistoryItem(
      history.exploredTopics,
      { topic, at: Date.now() },
      (item) => item.topic,
      HISTORY_TOPIC_LIMIT
    )
  }

  if (route?.id || route?.title) {
    history.completedRoutes = upsertHistoryItem(
      history.completedRoutes,
      {
        id: route.id || route.title,
        title: route.title || route.id,
        stops: Array.isArray(route.nodes)
          ? route.nodes.map((node) => node.artifact || node.artifactName || node.artifactId).filter(Boolean)
          : Array.isArray(route.stops) ? route.stops.map((stop) => stop.artifactName || stop.name || stop.artifactId).filter(Boolean) : [],
        at: Date.now()
      },
      (item) => item.id || item.title,
      HISTORY_ROUTE_LIMIT
    )
  }

  if (Array.isArray(input.suggestions)) {
    history.lastGuideSuggestions = input.suggestions.filter(Boolean).slice(-6)
  }

  return history
}

function upsertHistoryItem(items = [], item = {}, getKey, limit) {
  const key = getKey(item)
  if (!key) {
    return items.slice(-limit)
  }
  return [
    ...items.filter((existing) => getKey(existing) !== key),
    item
  ].slice(-limit)
}

function inferTopicFromText(text = '') {
  if (/祭祀|祭祀坑|神权/.test(text)) return '祭祀文化'
  if (/太阳|神鸟/.test(text)) return '太阳崇拜'
  if (/青铜/.test(text)) return '青铜器'
  if (/金器|黄金|金面具|金杖/.test(text)) return '金器工艺'
  if (/古蜀|三星堆|金沙/.test(text)) return '古蜀文明'
  return ''
}

function cloneContext(context) {
  return JSON.parse(JSON.stringify(compactContext(context)))
}

function persist() {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(compactContext(state)))
}

function notify() {
  const snapshot = getXuanmiaoContext()
  listeners.forEach((listener) => listener(snapshot))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xuanmiao:context-updated', { detail: snapshot }))
  }
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `xuanmiao-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function inferArtifactFromText(text) {
  return KNOWN_ARTIFACTS.find((artifact) => text.includes(artifact.name)) || null
}
