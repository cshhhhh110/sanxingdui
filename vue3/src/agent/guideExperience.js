import { createAgentStreamEvent } from './streamEvents'

export const GuideExperienceState = Object.freeze({
  IDLE: 'idle',
  PREPARING: 'preparing',
  INTRODUCING: 'introducing',
  NAVIGATING: 'navigating',
  ARRIVED: 'arrived',
  EXPLAINING: 'explaining',
  COMPLETED: 'completed',
  FAILED: 'failed'
})

const DEFAULT_GUIDE_EXPERIENCE_DELAYS = {
  preparingMs: 900,
  introducingMs: 2400
}

const ALLOWED_TRANSITIONS = {
  [GuideExperienceState.IDLE]: [GuideExperienceState.PREPARING],
  [GuideExperienceState.PREPARING]: [GuideExperienceState.INTRODUCING, GuideExperienceState.FAILED],
  [GuideExperienceState.INTRODUCING]: [GuideExperienceState.NAVIGATING, GuideExperienceState.FAILED],
  [GuideExperienceState.NAVIGATING]: [GuideExperienceState.ARRIVED, GuideExperienceState.FAILED],
  [GuideExperienceState.ARRIVED]: [GuideExperienceState.EXPLAINING, GuideExperienceState.FAILED],
  [GuideExperienceState.EXPLAINING]: [GuideExperienceState.COMPLETED, GuideExperienceState.FAILED],
  [GuideExperienceState.COMPLETED]: [],
  [GuideExperienceState.FAILED]: []
}

export function isGuideExperienceDecision(decision = {}, toolName = '') {
  return toolName === 'control_trail' &&
    Boolean(decision.routePlan?.nodes?.length || decision.activeGuide?.routePlan?.nodes?.length)
}

export function createGuideExperienceState(decision = {}) {
  const context = buildGuideExperienceContext(decision)
  return {
    id: `guide-experience-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    state: GuideExperienceState.IDLE,
    previousState: '',
    routeId: context.routePlan?.id || '',
    artifactId: context.node?.artifactId || '',
    artifactName: context.node?.artifact || context.node?.artifactName || '',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export async function runGuideExperienceBeforeTool(input = {}) {
  const {
    decision = {},
    emit = null,
    delays = DEFAULT_GUIDE_EXPERIENCE_DELAYS
  } = input
  const context = buildGuideExperienceContext(decision)
  const experienceState = createGuideExperienceState(decision)
  if (!context.node) return { ...context, experienceState }

  transitionGuideExperience(experienceState, GuideExperienceState.PREPARING)
  const preparingMessage = buildPreparingMessage(context)
  const preparingCompletion = emitGuideExperienceEvent(emit, 'guide_preparing_visit', {
    message: preparingMessage,
    metadata: withExperienceState(context, experienceState)
  })
  await waitForExperiencePhase(preparingCompletion, delays.preparingMs, preparingMessage)

  transitionGuideExperience(experienceState, GuideExperienceState.INTRODUCING)
  const introducingMessage = buildDestinationIntroMessage(context)
  const introducingCompletion = emitGuideExperienceEvent(emit, 'guide_introducing_destination', {
    message: introducingMessage,
    metadata: withExperienceState(context, experienceState)
  })
  await waitForExperiencePhase(introducingCompletion, delays.introducingMs, introducingMessage)

  transitionGuideExperience(experienceState, GuideExperienceState.NAVIGATING)
  emitGuideExperienceEvent(emit, 'guide_navigating', {
    message: buildNavigatingMessage(context),
    metadata: withExperienceState(context, experienceState)
  })

  return { ...context, experienceState }
}

export async function waitForGuideTrailArrival(input = {}) {
  const {
    execution = {},
    decision = {},
    readTrailStatus = null,
    timeoutMs = 8000,
    pollMs = 100
  } = input
  const initialStatus = getExecutionTrailStatus(execution)
  if (isTerminalTrailStatus(initialStatus)) return initialStatus
  if (typeof readTrailStatus !== 'function') return initialStatus

  const target = buildGuideExperienceContext(decision).node || {}
  const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0)
  while (Date.now() <= deadline) {
    const status = readTrailStatus() || {}
    if (status.status === 'failed') return status
    if (status.status === 'arrived' && isTargetTrailStatus(status, target)) return status
    await wait(pollMs)
  }
  return {
    ...initialStatus,
    artifactId: initialStatus.artifactId || target.artifactId || '',
    artifactName: initialStatus.artifactName || target.artifact || target.artifactName || '',
    status: 'failed',
    reason: 'trail_arrival_timeout'
  }
}

export async function emitGuideExperienceAfterTool(input = {}) {
  const {
    decision = {},
    execution = {},
    emit = null,
    experienceState = createNavigatingExperienceState(decision)
  } = input
  const context = buildGuideExperienceContext(decision)
  const trailStatus = getExecutionTrailStatus(execution)
  const arrived = trailStatus.status === 'arrived'
  const node = {
    ...context.node,
    artifact: trailStatus.artifactName || context.node?.artifact || context.node?.artifactName || ''
  }
  const nextContext = { ...context, node, trailStatus }

  if (!arrived) {
    transitionGuideExperience(experienceState, GuideExperienceState.FAILED)
    emitGuideExperienceEvent(emit, 'guide_arrived', {
      status: 'failed',
      message: trailStatus.reason === 'trail_arrival_timeout'
        ? '展线到达确认超时，这次没有继续讲解。'
        : '这一步没有顺利到达目标展线。',
      metadata: withExperienceState(nextContext, experienceState)
    })
    return { ...nextContext, experienceState }
  }

  transitionGuideExperience(experienceState, GuideExperienceState.ARRIVED)
  const arrivedCompletion = emitGuideExperienceEvent(emit, 'guide_arrived', {
    status: 'success',
    message: `我们到了，这里就是${node.artifact || '这一站'}。`,
    metadata: withExperienceState(nextContext, experienceState)
  })
  await waitForExperiencePhase(arrivedCompletion, 500, `我们到了，这里就是${node.artifact || '这一站'}。`)

  transitionGuideExperience(experienceState, GuideExperienceState.EXPLAINING)
  const explainingCompletion = emitGuideExperienceEvent(emit, 'guide_explaining', {
    status: 'success',
    message: buildExplainingMessage(nextContext),
    metadata: withExperienceState(nextContext, experienceState)
  })
  await waitForExperiencePhase(explainingCompletion, 900, buildExplainingMessage(nextContext))
  transitionGuideExperience(experienceState, GuideExperienceState.COMPLETED)

  return { ...nextContext, experienceState }
}

export function transitionGuideExperience(experienceState = {}, nextState = '') {
  const currentState = experienceState.state || GuideExperienceState.IDLE
  if (!ALLOWED_TRANSITIONS[currentState]?.includes(nextState)) {
    throw new Error(`Invalid guide experience transition: ${currentState} -> ${nextState}`)
  }
  experienceState.previousState = currentState
  experienceState.state = nextState
  experienceState.updatedAt = new Date().toISOString()
  return experienceState
}

export function buildGuideExperienceContext(decision = {}) {
  const routePlan = decision.routePlan || decision.activeGuide?.routePlan || {}
  const guideAction = decision.guideAction || decision.activeGuide?.actionIntent || 'create_guide'
  const node = decision.continueNode ||
    routePlan.nodes?.[guideAction === 'continue_guide' ? routePlan.currentNode + 1 : routePlan.currentNode || 0] ||
    routePlan.nodes?.[0] ||
    null
  return {
    guideAction,
    routePlan,
    node,
    routeTitle: routePlan.title || '',
    routeDuration: routePlan.duration || 0,
    order: node?.order || 1
  }
}

export function buildPreparingMessage(context = {}) {
  if (context.guideAction === 'continue_guide') {
    return `好的，我们继续「${context.routeTitle || '当前导览路线'}」。`
  }
  if (context.guideAction === 'restart_guide') {
    return `好的，我按你的新需求重新规划一条「${context.routeTitle || '导览路线'}」。`
  }
  return context.routeTitle
    ? `好的，我为你规划了「${context.routeTitle}」。`
    : '好的，我先为你规划一段适合当前状态的参观路线。'
}

export function buildDestinationIntroMessage(context = {}) {
  const node = context.node || {}
  const focus = Array.isArray(node.knowledgeFocus) && node.knowledgeFocus.length
    ? `这一站重点看${node.knowledgeFocus.slice(0, 2).join('、')}。`
    : ''
  const reason = node.reason ? `${node.reason}。` : ''
  return `第 ${node.order || context.order || 1} 站，我们先看${node.artifact || node.artifactName || '目标文物'}。${reason}${focus}`
}

export function buildNavigatingMessage(context = {}) {
  const node = context.node || {}
  return `我现在带你进入${node.artifact || node.artifactName || '这一站'}的展线，到了以后再继续讲。`
}

export function buildExplainingMessage(context = {}) {
  const node = context.node || {}
  const focus = Array.isArray(node.knowledgeFocus) && node.knowledgeFocus.length
    ? `可以先从${node.knowledgeFocus.slice(0, 2).join('、')}理解它。`
    : '我会结合它的背景、工艺和文化关系继续讲解。'
  return `我们到了，这就是${node.artifact || node.artifactName || '这一站'}。${focus}`
}

function createNavigatingExperienceState(decision = {}) {
  const state = createGuideExperienceState(decision)
  state.state = GuideExperienceState.NAVIGATING
  state.previousState = GuideExperienceState.INTRODUCING
  return state
}

function withExperienceState(context = {}, experienceState = {}) {
  return {
    ...context,
    guideExperienceState: { ...experienceState }
  }
}

function emitGuideExperienceEvent(emit, type, patch = {}) {
  if (typeof emit !== 'function') return null
  return emit(createAgentStreamEvent(type, patch))
}

async function waitForExperiencePhase(completion, fallbackMs, message = '') {
  if (completion && typeof completion.then === 'function') {
    await completion
    return
  }
  const readableMs = Math.min(4200, Math.max(700, String(message || '').length * 75))
  const configuredMs = Number.isFinite(Number(fallbackMs)) ? Number(fallbackMs) : readableMs
  await wait(Math.max(0, configuredMs))
}

function getExecutionTrailStatus(execution = {}) {
  return execution?.data?.trailStatus || execution?.trailStatus || {}
}

function isTerminalTrailStatus(status = {}) {
  return status.status === 'arrived' || status.status === 'failed'
}

function isTargetTrailStatus(status = {}, target = {}) {
  const targetId = target.artifactId || target.entityId || ''
  const targetName = target.artifact || target.artifactName || ''
  if (targetId && status.artifactId) return targetId === status.artifactId
  if (targetName && status.artifactName) return targetName === status.artifactName
  return true
}

function wait(ms = 0) {
  const safeMs = Math.max(0, Number(ms) || 0)
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, safeMs)
  })
}
