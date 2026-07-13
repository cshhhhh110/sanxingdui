import { AgentRoute } from './routes'
import { discoverKnowledgeRelations } from './knowledgeGraph'

export const GUIDE_ARTIFACTS = Object.freeze([
  {
    id: 'HI-2025-005',
    name: '青铜大立人',
    artifactType: 'artifact',
    themes: ['青铜器', '祭祀文化', '神权表达'],
    reason: '三星堆最具代表性的青铜人物形象，适合作为首次参观入口',
    knowledgeFocus: ['祭祀主持者', '青铜铸造', '神权表达']
  },
  {
    id: 'HI-2025-006',
    name: '青铜神树',
    artifactType: 'artifact',
    themes: ['青铜器', '祭祀文化', '太阳崇拜'],
    reason: '能够连接古蜀宇宙观、太阳崇拜和通天想象',
    knowledgeFocus: ['太阳崇拜', '祭祀体系', '古蜀宇宙观']
  },
  {
    id: 'HI-2025-002',
    name: '金面具',
    artifactType: 'artifact',
    themes: ['金器工艺', '祭祀文化', '身份象征'],
    reason: '能够展示黄金工艺、身份象征与祭祀场景',
    knowledgeFocus: ['黄金工艺', '身份象征', '祭祀仪式']
  },
  {
    id: 'HI-2025-003',
    name: '青铜纵目面具',
    artifactType: 'artifact',
    themes: ['青铜器', '神灵崇拜', '造型艺术'],
    reason: '适合解释三星堆独特的视觉符号和神灵想象',
    knowledgeFocus: ['纵目造型', '神灵崇拜', '古蜀审美']
  },
  {
    id: 'HI-2025-004',
    name: '金杖',
    artifactType: 'artifact',
    themes: ['金器工艺', '权力象征', '古蜀文明'],
    reason: '能够引出古蜀权力秩序和礼仪体系',
    knowledgeFocus: ['权力象征', '鱼鸟纹样', '古蜀礼仪']
  }
])

const GUIDE_ACTION_PATTERN = /(路线|导览|带我|领我|陪我|逛一圈|规划.*(?:路线|行程|参观)|安排.*(?:路线|行程|参观)|推荐.*(?:看|参观|文物)|帮我.*(?:看|规划|安排)|我想看|想去看|准备参观|打算参观)/
const GUIDE_TIME_CONSTRAINT_PATTERN = /(?:(?:我|我们)(?:只有|只剩|还有|有)|(?:只有|只剩))\s*(?:\d+(?:\.\d+)?|半)\s*(?:分钟|分|小时|个小时)/
const GUIDE_FIRST_VISIT_PATTERN = /(?:(?:我|我们)(?:第一次|初次|首次)(?:来|到|参观|游览)|第一次来|刚来|新游客)/
const GUIDE_INTEREST_PATTERN = /(?:我对.+感兴趣|我喜欢.+(?:文物|文化|青铜器|金器|面具)|我想看.+)/
const CONTINUE_GUIDE_PATTERN = /^(继续|下一站|下一个|带我去下一个|前往下一站|继续导览|接着走)(?:[:：].*)?$/
const RESTART_GUIDE_PATTERN = /(重新规划|换一条路线|重新带我|重来|重新推荐|再规划)/
const FIRST_VISIT_PATTERN = /(第一次|初次|首次|刚来|新游客|第一次来)/
const SIMILAR_INTENT_PATTERN = /(类似|相关|接着看|继续看|还能看|下一个|推荐|还有.*吗|还有.*么)/

const INTEREST_RULES = [
  { mode: 'interest', key: 'bronze', pattern: /青铜|青铜器|铸造/, themes: ['青铜器', '青铜工艺'] },
  { mode: 'interest', key: 'gold', pattern: /黄金|金器|金面具|金杖/, themes: ['金器工艺', '身份象征', '权力象征'] },
  { mode: 'interest', key: 'ritual', pattern: /祭祀|祭祀坑|神权|神秘/, themes: ['祭祀文化', '神权表达', '神灵崇拜'] }
]

export function buildGuideExplorationState(context = {}, knowledgeGraph = {}) {
  const history = normalizeGuideHistory(context.explorationHistory)
  const entities = Array.isArray(knowledgeGraph.entities) ? knowledgeGraph.entities : []
  const relations = Array.isArray(knowledgeGraph.relations) ? knowledgeGraph.relations : []
  const trailStatus = normalizeTrailStatus(context.trailStatus)
  const focusArtifact = resolveGuideArtifact(
    trailStatus.artifactName || context.currentArtifact,
    trailStatus.artifactId || context.currentArtifactId
  ) || resolveGuideArtifact(entities.find((item) => item.type === '文物实体')?.name)
  const exploredThemes = new Set(history.exploredTopics.map((item) => item.topic || item.name).filter(Boolean))

  if (focusArtifact) {
    focusArtifact.themes.forEach((theme) => exploredThemes.add(theme))
  }
  relations.forEach((relation) => {
    ;[relation.sourceName, relation.targetName].forEach((name) => {
      const artifact = resolveGuideArtifact(name)
      if (artifact) {
        artifact.themes.forEach((theme) => exploredThemes.add(theme))
      }
      if (/祭祀/.test(name)) exploredThemes.add('祭祀文化')
      if (/太阳/.test(name)) exploredThemes.add('太阳崇拜')
      if (/古蜀/.test(name)) exploredThemes.add('古蜀文明')
      if (/青铜/.test(name)) exploredThemes.add('青铜器')
      if (/金/.test(name)) exploredThemes.add('金器工艺')
    })
  })

  return {
    currentPage: trailStatus.page || context.currentPage || '',
    currentScene: trailStatus.scene || context.currentScene || '',
    currentArtifact: focusArtifact?.name || trailStatus.artifactName || context.currentArtifact || '',
    currentArtifactId: focusArtifact?.id || trailStatus.artifactId || context.currentArtifactId || '',
    currentTrailNode: context.currentTrailNode || '',
    currentTrailNodeId: trailStatus.trailNodeId || context.currentTrailNodeId || '',
    trailStatus,
    activeGuideState: normalizeActiveGuideState(context.activeGuideState),
    viewedArtifacts: history.viewedArtifacts,
    completedRoutes: history.completedRoutes,
    exploredTopics: history.exploredTopics,
    inferredThemes: Array.from(exploredThemes).slice(0, 6),
    lastAction: context.lastAction || '',
    lastResult: context.lastResult || ''
  }
}

export function getGuideActionIntent(message = '') {
  const text = String(message || '').trim()
  if (!text) return ''
  if (RESTART_GUIDE_PATTERN.test(text)) return 'restart_guide'
  if (CONTINUE_GUIDE_PATTERN.test(text)) return 'continue_guide'
  return ''
}

export function hasGuidePlanningIntent(message = '') {
  const text = String(message || '').trim()
  if (!text) return false
  return GUIDE_ACTION_PATTERN.test(text) ||
    GUIDE_TIME_CONSTRAINT_PATTERN.test(text) ||
    GUIDE_FIRST_VISIT_PATTERN.test(text) ||
    GUIDE_INTEREST_PATTERN.test(text)
}

export function planGuideRoute(message = '', options = {}) {
  const text = String(message || '').trim()
  const actionIntent = getGuideActionIntent(text)
  if (actionIntent === 'continue_guide') return null
  if (!hasGuidePlanningIntent(text) && actionIntent !== 'restart_guide') {
    return null
  }

  const context = options.context || {}
  const knowledgeGraph = options.knowledgeGraph || discoverKnowledgeRelations({ question: text, context })
  const state = buildGuideExplorationState(context, knowledgeGraph)
  const routeIntent = inferRouteIntent(text, knowledgeGraph, state)
  const routeStops = selectRouteArtifacts({
    intent: routeIntent,
    state,
    knowledgeGraph,
    allowCurrentArtifact: actionIntent === 'restart_guide'
  })
  if (!routeStops.length) return null

  const duration = routeIntent.duration || distributeDuration(routeStops.length)
  const nodes = routeStops.slice(0, 3).map((artifact, index) => {
    const stayTime = Math.max(3, Math.round(duration / Math.min(routeStops.length, 3)))
    return {
      order: index + 1,
      artifactId: artifact.id,
      artifact: artifact.name,
      artifactName: artifact.name,
      artifactType: artifact.artifactType || 'artifact',
      duration: stayTime,
      reason: artifact.reason,
      relation: buildArtifactRelations(artifact, knowledgeGraph),
      knowledgeFocus: artifact.knowledgeFocus || artifact.themes || [],
      status: index === 0 ? 'current' : 'pending',
      themes: artifact.themes || []
    }
  })

  const plan = {
    id: `guide-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: buildRouteTitle(routeIntent, duration),
    mode: routeIntent.mode,
    routeSource: options.routeSource || 'template_fallback',
    duration,
    reason: buildRouteReason(routeIntent, state),
    nodes,
    currentNode: 0,
    completedNodes: [],
    createdAt: new Date().toISOString(),
    intent: routeIntent.intent,
    currentStopIndex: 0,
    stops: nodes.map((node) => ({
      order: node.order,
      artifactId: node.artifactId,
      artifactName: node.artifact,
      themes: node.themes,
      reason: node.reason
    })),
    firstTool: buildGuideTool(nodes[0]),
    reasonForTool: '根据导览计划打开第一站，并等待时空展线回传真实到达状态'
  }

  return plan
}

export function buildActiveGuideStateFromPlan(plan = null, overrides = {}) {
  if (!plan?.id || !Array.isArray(plan.nodes) || !plan.nodes.length) {
    return null
  }
  const currentIndex = normalizeNodeIndex(overrides.currentNode ?? plan.currentNode ?? 0, plan.nodes.length)
  const nextIndex = currentIndex + 1 < plan.nodes.length ? currentIndex + 1 : null
  return {
    routeId: plan.id,
    routeTitle: plan.title || '',
    mode: plan.mode || 'first_visit',
    currentNode: currentIndex,
    nextNode: nextIndex,
    progress: {
      completed: Array.isArray(overrides.completedNodes) ? overrides.completedNodes.length : 0,
      total: plan.nodes.length
    },
    startedAt: overrides.startedAt || new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    status: overrides.status || 'active',
    guidePlan: plan
  }
}

export function getNextGuideNode(activeGuideState = {}) {
  const state = normalizeActiveGuideState(activeGuideState)
  const plan = state.guidePlan
  if (!plan?.nodes?.length || state.status === 'completed' || state.status === 'cancelled') {
    return null
  }
  const nextIndex = Number.isInteger(state.nextNode)
    ? state.nextNode
    : Number.isInteger(state.currentNode)
      ? state.currentNode + 1
      : 0
  return plan.nodes[nextIndex] || null
}

export function advanceGuideState(activeGuideState = {}, trailStatus = {}) {
  const state = normalizeActiveGuideState(activeGuideState)
  const plan = state.guidePlan
  if (!plan?.nodes?.length) return state
  const arrivedNodeIndex = findNodeIndexByTrailStatus(plan.nodes, trailStatus)
  const currentNode = arrivedNodeIndex >= 0 ? arrivedNodeIndex : normalizeNodeIndex(state.nextNode ?? state.currentNode, plan.nodes.length)
  const completedNodes = Array.from(new Set([
    ...(Array.isArray(plan.completedNodes) ? plan.completedNodes : []),
    ...Array.from({ length: currentNode + 1 }, (_, index) => index)
  ])).filter((index) => index >= 0 && index < plan.nodes.length)
  const nextNode = currentNode + 1 < plan.nodes.length ? currentNode + 1 : null
  const status = nextNode === null ? 'completed' : 'active'
  const nextPlan = {
    ...plan,
    currentNode,
    completedNodes,
    nodes: plan.nodes.map((node, index) => ({
      ...node,
      status: index < currentNode ? 'completed' : index === currentNode ? 'current' : 'pending'
    }))
  }
  return {
    ...state,
    currentNode,
    nextNode,
    progress: {
      completed: completedNodes.length,
      total: plan.nodes.length
    },
    status,
    lastUpdatedAt: new Date().toISOString(),
    guidePlan: nextPlan
  }
}

export function cancelGuideState(activeGuideState = {}) {
  const state = normalizeActiveGuideState(activeGuideState)
  if (!state.routeId) return null
  return {
    ...state,
    status: 'cancelled',
    lastUpdatedAt: new Date().toISOString()
  }
}

export function buildGuideTool(node = {}) {
  return {
    route: AgentRoute.TOOL_CALL,
    tool: 'control_trail',
    toolName: 'control_trail',
    arguments: {
      action: 'open_artifact',
      artifact_id: node.artifactId || node.id || ''
    }
  }
}

export function buildActiveGuideFollowups(input = {}) {
  const question = String(input.question || input.message || '').trim()
  const context = input.context || {}
  const knowledgeGraph = input.knowledgeGraph || discoverKnowledgeRelations({
    question,
    context
  })
  const state = buildGuideExplorationState(context, knowledgeGraph)
  const activeState = state.activeGuideState
  const history = normalizeGuideHistory(context.explorationHistory)
  const viewedNames = new Set(history.viewedArtifacts.map((item) => item.name).filter(Boolean))
  const names = new Set([
    state.currentArtifact,
    ...(knowledgeGraph.entities || []).map((item) => item.name),
    ...(knowledgeGraph.relations || []).flatMap((item) => [item.sourceName, item.targetName])
  ].filter(Boolean))
  const suggestions = []

  const nextNode = getNextGuideNode(activeState)
  if (nextNode && activeState.status !== 'completed') {
    suggestions.push(`前往下一站：${nextNode.artifact}`)
  }

  if (SIMILAR_INTENT_PATTERN.test(question) && state.currentArtifact) {
    relatedArtifactsFor(state.currentArtifact)
      .filter((artifact) => !viewedNames.has(artifact.name))
      .slice(0, 1)
      .forEach((artifact) => suggestions.push(`继续看${artifact.name}`))
  }

  if (names.has('青铜神树') || state.inferredThemes.includes('太阳崇拜')) {
    suggestions.push('金沙太阳神鸟和太阳崇拜有什么关系？')
    suggestions.push('继续看青铜大立人')
    suggestions.push('三星堆祭祀体系为什么重要？')
  }
  if (names.has('金面具') || state.inferredThemes.includes('金器工艺')) {
    suggestions.push('继续看金杖')
    suggestions.push('金面具为什么代表身份象征？')
    suggestions.push('黄金器物在祭祀中有什么作用？')
  }
  if (names.has('三星堆遗址') || names.has('金沙遗址') || state.inferredThemes.includes('古蜀文明')) {
    suggestions.push('三星堆和金沙之间有哪些延续线索？')
    suggestions.push('带我看看三星堆最有代表性的文物')
  }

  GUIDE_ARTIFACTS
    .filter((artifact) => !viewedNames.has(artifact.name))
    .slice(0, 2)
    .forEach((artifact) => suggestions.push(`继续看${artifact.name}`))

  return unique(suggestions)
    .filter((suggestion) => {
      const artifact = GUIDE_ARTIFACTS.find((item) => suggestion.includes(item.name))
      return !artifact || !suggestion.startsWith('继续看') || !viewedNames.has(artifact.name)
    })
    .slice(0, 3)
}

export function buildActiveGuideContext(message = '', context = {}, knowledgeGraph = {}) {
  const state = buildGuideExplorationState(context, knowledgeGraph)
  const routePlan = planGuideRoute(message, { context, knowledgeGraph })
  const followups = buildActiveGuideFollowups({ question: message, context, knowledgeGraph })

  return {
    state,
    routePlan,
    followups,
    actionIntent: getGuideActionIntent(message),
    proactive: {
      shouldRecommend: followups.length > 0,
      reason: state.currentArtifact
        ? `围绕当前文物 ${state.currentArtifact} 继续导览`
        : '根据当前会话探索状态推荐下一步'
    }
  }
}

export function createGuideRouteMessage(routePlan = null, activeGuideState = null) {
  const nodes = routePlan?.nodes || routePlan?.stops || []
  if (!nodes.length) {
    return ''
  }
  const stopLines = nodes.map((node) => {
    const name = node.artifact || node.artifactName || node.name
    const duration = node.duration ? `，约 ${node.duration} 分钟` : ''
    return `${node.order}. ${name}${duration}：${node.reason}`
  })
  const nextNode = activeGuideState ? getNextGuideNode(activeGuideState) : nodes[1]
  return [
    `我为你规划一条「${routePlan.title}」：`,
    ...stopLines,
    `先从第 1 站「${nodes[0].artifact || nodes[0].artifactName}」开始，我会等展线确认到达后再继续讲解。`,
    nextNode ? `如果准备好了，可以说“继续”，我再带你去下一站「${nextNode.artifact || nextNode.artifactName}」。` : ''
  ].filter(Boolean).join('\n')
}

export function createGuideContinueMessage(activeGuideState = {}, trailStatus = {}) {
  const state = normalizeActiveGuideState(activeGuideState)
  const currentNode = state.guidePlan?.nodes?.[state.currentNode]
  const nextNode = getNextGuideNode(state)
  if (state.status === 'completed' || !nextNode) {
    return `这条「${state.routeTitle || '导览路线'}」已经完成。你可以说“重新规划一下”，我会按当前位置再生成一条新路线。`
  }
  const arrived = trailStatus?.status === 'arrived'
    ? `当前已到达${trailStatus.artifactName || currentNode?.artifact || '上一站'}。`
    : ''
  return `${arrived}接下来我们去看「${nextNode.artifact}」，它的重点是${nextNode.knowledgeFocus?.slice(0, 2).join('、') || nextNode.reason}。`
}

export function resolveGuideArtifact(name = '', id = '') {
  const normalizedName = String(name || '').trim()
  const normalizedId = String(id || '').trim()
  return GUIDE_ARTIFACTS.find((artifact) => {
    return artifact.id === normalizedId ||
      artifact.name === normalizedName ||
      normalizedName.includes(artifact.name) ||
      artifact.name.includes(normalizedName)
  }) || null
}

export function normalizeGuideHistory(value = {}) {
  return {
    viewedArtifacts: normalizeHistoryItems(value.viewedArtifacts, 10),
    completedRoutes: normalizeHistoryItems(value.completedRoutes, 5),
    exploredTopics: normalizeHistoryItems(value.exploredTopics, 10),
    lastGuideSuggestions: Array.isArray(value.lastGuideSuggestions)
      ? value.lastGuideSuggestions.slice(-6)
      : []
  }
}

export function normalizeTrailStatus(value = {}) {
  const status = ['pending', 'executing', 'arrived', 'failed'].includes(value?.status)
    ? value.status
    : ''
  return {
    artifactId: value?.artifactId || value?.entityId || '',
    artifactName: value?.artifactName || value?.title || '',
    trailNodeId: value?.trailNodeId || value?.nodeId || '',
    scene: value?.scene || '',
    page: value?.page || '',
    status
  }
}

export function normalizeActiveGuideState(value = {}) {
  if (!value || typeof value !== 'object') {
    return {
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
    }
  }
  const guidePlan = value.guidePlan || value.plan || null
  return {
    routeId: value.routeId || guidePlan?.id || '',
    routeTitle: value.routeTitle || guidePlan?.title || '',
    mode: value.mode || guidePlan?.mode || '',
    currentNode: Number.isInteger(value.currentNode) ? value.currentNode : null,
    nextNode: Number.isInteger(value.nextNode) ? value.nextNode : null,
    progress: {
      completed: Number(value.progress?.completed || 0),
      total: Number(value.progress?.total || guidePlan?.nodes?.length || 0)
    },
    startedAt: value.startedAt || '',
    lastUpdatedAt: value.lastUpdatedAt || '',
    status: ['active', 'paused', 'completed', 'cancelled'].includes(value.status) ? value.status : '',
    guidePlan
  }
}

function inferRouteIntent(text = '', knowledgeGraph = {}, state = {}) {
  const duration = extractDuration(text)
  const interest = INTEREST_RULES.find((rule) => rule.pattern.test(text))
  const hasFirstVisit = FIRST_VISIT_PATTERN.test(text)
  const graphThemes = inferThemesFromKnowledgeGraph(knowledgeGraph)
  if (interest) {
    return {
      mode: 'interest',
      intent: `interest_${interest.key}`,
      duration: duration || 20,
      themes: unique([...interest.themes, ...graphThemes])
    }
  }
  if (duration) {
    return {
      mode: hasFirstVisit ? 'first_visit' : 'time',
      intent: hasFirstVisit ? 'first_visit_time_route' : 'time_route',
      duration,
      themes: unique([...state.inferredThemes, ...graphThemes])
    }
  }
  return {
    mode: hasFirstVisit ? 'first_visit' : 'time',
    intent: hasFirstVisit ? 'first_visit_route' : 'representative_artifact_route',
    duration: 20,
    themes: unique([...state.inferredThemes, ...graphThemes])
  }
}

function selectRouteArtifacts({ intent, state, knowledgeGraph, allowCurrentArtifact = false }) {
  const viewedIds = new Set((state.viewedArtifacts || []).map((item) => item.id).filter(Boolean))
  const currentId = state.currentArtifactId || ''
  const themes = new Set(intent.themes || [])
  const entityNames = new Set((knowledgeGraph.entities || []).map((item) => item.name).filter(Boolean))
  const scored = GUIDE_ARTIFACTS.map((artifact, index) => {
    let score = 100 - index
    if (!allowCurrentArtifact && viewedIds.has(artifact.id)) score -= 80
    if (!allowCurrentArtifact && currentId && artifact.id === currentId) score -= 60
    artifact.themes.forEach((theme) => {
      if (themes.has(theme)) score += 30
    })
    if (entityNames.has(artifact.name)) score += 20
    if (intent.mode === 'first_visit' && ['HI-2025-005', 'HI-2025-006', 'HI-2025-002'].includes(artifact.id)) score += 40
    if (intent.mode === 'time' && intent.duration <= 10 && ['HI-2025-005', 'HI-2025-006'].includes(artifact.id)) score += 25
    return { artifact, score }
  }).sort((a, b) => b.score - a.score)

  const selected = scored
    .filter((item) => allowCurrentArtifact || !viewedIds.has(item.artifact.id))
    .map((item) => item.artifact)
    .slice(0, intent.duration <= 10 ? 2 : 3)

  if (intent.mode === 'first_visit' && !viewedIds.has('HI-2025-005')) {
    const preferred = ['HI-2025-005', 'HI-2025-006', 'HI-2025-002']
      .map((id) => GUIDE_ARTIFACTS.find((artifact) => artifact.id === id))
      .filter((artifact) => artifact && (allowCurrentArtifact || !viewedIds.has(artifact.id)))
    return preferred.slice(0, intent.duration <= 10 ? 2 : 3)
  }

  if (selected.length >= 2) return selected
  scored.forEach((item) => {
    if (!selected.some((artifact) => artifact.id === item.artifact.id)) {
      selected.push(item.artifact)
    }
  })
  return selected.slice(0, intent.duration <= 10 ? 2 : 3)
}

function extractDuration(text = '') {
  if (/半小时/.test(text)) return 30
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(小时|个小时)/)
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60)
  const minuteMatch = text.match(/(\d+)\s*(分钟|分)/)
  if (minuteMatch) return Number(minuteMatch[1])
  return 0
}

function distributeDuration(stopCount = 3) {
  return stopCount <= 2 ? 10 : 20
}

function buildRouteTitle(intent, duration) {
  if (intent.mode === 'first_visit') return `三星堆${duration}分钟精华路线`
  if (intent.mode === 'interest') return `三星堆${duration}分钟主题导览`
  return `三星堆${duration}分钟参观路线`
}

function buildRouteReason(intent, state) {
  if (intent.mode === 'first_visit') {
    return `根据首次参观状态和${intent.duration}分钟时间约束生成。`
  }
  if (intent.mode === 'interest') {
    return `根据你的兴趣方向和当前知识关系生成。`
  }
  const viewed = state.viewedArtifacts?.length ? `，并避开已看过的${state.viewedArtifacts.length}件文物` : ''
  return `根据你的时间约束${viewed}生成。`
}

function buildArtifactRelations(artifact, knowledgeGraph = {}) {
  const relations = Array.isArray(knowledgeGraph.relations) ? knowledgeGraph.relations : []
  return unique([
    ...artifact.themes,
    ...relations
      .filter((relation) => [relation.sourceName, relation.targetName].includes(artifact.name))
      .map((relation) => relation.sourceName === artifact.name ? relation.targetName : relation.sourceName)
  ]).slice(0, 4)
}

function inferThemesFromKnowledgeGraph(knowledgeGraph = {}) {
  const names = [
    ...(knowledgeGraph.entities || []).map((item) => item.name),
    ...(knowledgeGraph.relations || []).flatMap((item) => [item.sourceName, item.targetName])
  ].join(' ')
  const themes = []
  if (/祭祀|神权/.test(names)) themes.push('祭祀文化')
  if (/太阳/.test(names)) themes.push('太阳崇拜')
  if (/青铜/.test(names)) themes.push('青铜器')
  if (/金/.test(names)) themes.push('金器工艺')
  if (/古蜀/.test(names)) themes.push('古蜀文明')
  return themes
}

function findNodeIndexByTrailStatus(nodes = [], trailStatus = {}) {
  const status = normalizeTrailStatus(trailStatus)
  if (!status.artifactId && !status.artifactName) return -1
  return nodes.findIndex((node) => {
    return node.artifactId === status.artifactId ||
      node.artifact === status.artifactName ||
      node.artifactName === status.artifactName
  })
}

function relatedArtifactsFor(name = '') {
  if (/青铜神树/.test(name)) {
    return GUIDE_ARTIFACTS.filter((item) => ['青铜大立人', '青铜纵目面具', '金面具'].includes(item.name))
  }
  if (/金面具/.test(name)) {
    return GUIDE_ARTIFACTS.filter((item) => ['金杖', '青铜大立人', '青铜纵目面具'].includes(item.name))
  }
  if (/青铜大立人/.test(name)) {
    return GUIDE_ARTIFACTS.filter((item) => ['青铜神树', '金杖', '青铜纵目面具'].includes(item.name))
  }
  return GUIDE_ARTIFACTS
}

function normalizeNodeIndex(value, length) {
  const index = Number.isInteger(value) ? value : 0
  return Math.max(0, Math.min(index, Math.max(0, length - 1)))
}

function normalizeHistoryItems(items, limit) {
  return Array.isArray(items)
    ? items.filter(Boolean).slice(-limit)
    : []
}

function unique(items = []) {
  return items.filter((item, index) => item && items.indexOf(item) === index)
}
