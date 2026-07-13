import { strict as assert } from 'assert'
import { build } from 'esbuild'
import { mkdtemp, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agent-active-guide-'))

try {
  const guideModule = await bundleImport('src/agent/activeGuide.js', 'activeGuide.mjs')
  const guideExperienceModule = await bundleImport('src/agent/guideExperience.js', 'guideExperience.mjs')

  runFirstVisitTwentyMinuteRouteCase(guideModule)
  runTimeRouteCase(guideModule)
  runInterestRouteCase(guideModule)
  runKnowledgeQuestionDoesNotPlanCase(guideModule)
  runSimilarArtifactRecommendationCase(guideModule)
  runVisitedArtifactDedupCase(guideModule)
  runGuideStateAdvanceCase(guideModule)
  runRestartIntentCase(guideModule)
  await runGuideExperienceCase(guideModule, guideExperienceModule)

  console.log('Agent active guide regression: PASS')
} finally {
  await rm(tempDir, { recursive: true, force: true })
}

function runKnowledgeQuestionDoesNotPlanCase({ buildActiveGuideContext, hasGuidePlanningIntent, planGuideRoute }) {
  const questions = [
    '三星堆文明为什么会让人觉得神秘？',
    '祭祀坑的发现意味着什么？',
    '三星堆青铜器为什么造型独特？',
    '青铜神树和祭祀有什么关系？',
    '金面具为什么特别？',
    '三星堆第一次发掘是在什么时候？',
    '参观三星堆需要注意什么？'
  ]

  questions.forEach((question) => {
    assert.equal(hasGuidePlanningIntent(question), false, `knowledge question must not be guide intent: ${question}`)
    assert.equal(planGuideRoute(question, { context: {} }), null, `knowledge question must not create GuidePlan: ${question}`)
    assert.equal(buildActiveGuideContext(question, {}, {}).routePlan, null, `knowledge context must not expose route plan: ${question}`)
  })
  assert.equal(hasGuidePlanningIntent('我第一次来三星堆，只有20分钟。'), true)
  assert.equal(hasGuidePlanningIntent('我对青铜器感兴趣，帮我规划路线。'), true)
  console.log('- knowledge questions stay out of guide planning: PASS')
}

async function bundleImport(relativeEntry, name) {
  const outfile = path.join(tempDir, name)
  await build({
    entryPoints: [path.join(root, relativeEntry)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent'
  })
  return import(pathToFileURL(outfile).href)
}

function runFirstVisitTwentyMinuteRouteCase({ planGuideRoute }) {
  const routePlan = planGuideRoute('我第一次来三星堆，只有20分钟。', {
    context: {
      currentPage: '/',
      explorationHistory: {}
    }
  })

  assert(routePlan, 'should create first-visit guide plan')
  assert.equal(routePlan.mode, 'first_visit', 'should mark first visit route')
  assert.equal(routePlan.duration, 20, 'should extract 20 minute duration')
  assert.equal(routePlan.routeSource, 'template_fallback', 'should keep deterministic fallback source')
  assert.equal(routePlan.nodes[0].artifact, '青铜大立人', 'golden demo should start from standing figure')
  assert(routePlan.nodes.some((node) => node.artifact === '青铜神树'), 'route should include bronze sacred tree')
  assert(routePlan.nodes.every((node) => node.artifactType === 'artifact'), 'nodes should include artifactType')
  assert(routePlan.nodes.every((node) => node.knowledgeFocus?.length), 'nodes should include knowledge focus')
  assert.equal(routePlan.firstTool.arguments.artifact_id, 'HI-2025-005', 'first tool should open first stop')
  console.log('- first visitor 20-minute route planning: PASS')
}

function runTimeRouteCase({ planGuideRoute }) {
  const routePlan = planGuideRoute('我只有10分钟，帮我快速看重点。', {
    context: {
      currentPage: '/trail',
      explorationHistory: {}
    }
  })

  assert(routePlan, 'should create time route')
  assert.equal(routePlan.mode, 'time', 'should mark time route')
  assert.equal(routePlan.duration, 10, 'should extract 10 minute duration')
  assert(routePlan.nodes.length <= 2, '10-minute route should stay compact')
  console.log('- time limited route planning: PASS')
}

function runInterestRouteCase({ planGuideRoute }) {
  const routePlan = planGuideRoute('我想看青铜器路线。', {
    context: {
      currentPage: '/trail',
      explorationHistory: {}
    }
  })

  assert(routePlan, 'should create interest route')
  assert.equal(routePlan.mode, 'interest', 'should mark interest route')
  assert(routePlan.nodes.some((node) => node.themes.includes('青铜器')), 'interest route should include bronze artifacts')
  console.log('- basic interest route planning: PASS')
}

function runSimilarArtifactRecommendationCase({ buildActiveGuideFollowups }) {
  const suggestions = buildActiveGuideFollowups({
    question: '还有类似的吗？',
    context: {
      currentArtifact: '青铜神树',
      currentArtifactId: 'HI-2025-006',
      explorationHistory: {
        viewedArtifacts: [{ id: 'HI-2025-006', name: '青铜神树' }],
        exploredTopics: [{ topic: '祭祀文化' }]
      }
    },
    knowledgeGraph: {
      entities: [{ name: '青铜神树', type: '文物实体' }],
      relations: [{ sourceName: '青铜神树', targetName: '祭祀文化', relation: '体现' }]
    }
  })

  assert(suggestions.some((item) => item.includes('青铜大立人')), 'should recommend related standing figure')
  assert(suggestions.some((item) => item.includes('祭祀')), 'should recommend sacrifice theme')
  console.log('- similar artifact recommendation: PASS')
}

function runVisitedArtifactDedupCase({ buildActiveGuideFollowups, planGuideRoute }) {
  const routePlan = planGuideRoute('带我看看三星堆重要文物。', {
    context: {
      explorationHistory: {
        viewedArtifacts: [
          { id: 'HI-2025-005', name: '青铜大立人' },
          { id: 'HI-2025-006', name: '青铜神树' }
        ]
      }
    }
  })
  assert(routePlan.nodes[0].artifact !== '青铜大立人', 'route should avoid already viewed first stop')

  const suggestions = buildActiveGuideFollowups({
    question: '接着看什么？',
    context: {
      currentArtifact: '金面具',
      currentArtifactId: 'HI-2025-002',
      explorationHistory: {
        viewedArtifacts: [
          { id: 'HI-2025-002', name: '金面具' },
          { id: 'HI-2025-004', name: '金杖' }
        ],
        exploredTopics: [{ topic: '金器工艺' }]
      }
    },
    knowledgeGraph: {
      entities: [{ name: '金面具', type: '文物实体' }],
      relations: [{ sourceName: '金面具', targetName: '金器工艺', relation: '体现' }]
    }
  })

  assert(!suggestions.includes('继续看金杖'), 'should avoid recommending a viewed artifact as direct next stop')
  assert(suggestions.length > 0, 'should still provide guide suggestions')
  console.log('- visited artifact recommendation dedup: PASS')
}

function runGuideStateAdvanceCase({
  advanceGuideState,
  buildActiveGuideStateFromPlan,
  getGuideActionIntent,
  getNextGuideNode,
  planGuideRoute
}) {
  const plan = planGuideRoute('我第一次来三星堆，只有20分钟。', { context: { explorationHistory: {} } })
  const activeState = buildActiveGuideStateFromPlan(plan)
  assert.equal(activeState.status, 'active', 'guide should start active')
  assert.equal(getNextGuideNode(activeState).artifact, '青铜神树', 'after first stop next node should be bronze sacred tree')
  assert.equal(getGuideActionIntent('继续'), 'continue_guide', 'continue should map to guide action')

  const advanced = advanceGuideState(activeState, {
    artifactId: 'HI-2025-006',
    artifactName: '青铜神树',
    trailNodeId: 'artifact-HI-2025-006',
    scene: '时空展线',
    page: '/trail',
    status: 'arrived'
  })

  assert.equal(advanced.currentNode, 1, 'continue should advance to second node')
  assert.equal(advanced.nextNode, 2, 'next pointer should move forward')
  assert.equal(advanced.progress.completed, 2, 'completed count should include reached nodes')
  console.log('- continue guide state advance: PASS')
}

function runRestartIntentCase({ getGuideActionIntent, planGuideRoute }) {
  assert.equal(getGuideActionIntent('重新规划一下'), 'restart_guide', 'restart phrase should map to restart action')
  const plan = planGuideRoute('重新规划一下，我想看黄金器物。', {
    context: {
      currentArtifact: '青铜神树',
      currentArtifactId: 'HI-2025-006',
      explorationHistory: {
        viewedArtifacts: [{ id: 'HI-2025-006', name: '青铜神树' }]
      }
    }
  })
  assert(plan, 'restart should create a fresh plan')
  assert.equal(plan.mode, 'interest', 'restart with interest should create interest plan')
  assert(plan.nodes.some((node) => node.artifact === '金面具' || node.artifact === '金杖'), 'restart should honor new gold interest')
  console.log('- restart guide intent and planning: PASS')
}

async function runGuideExperienceCase({ planGuideRoute }, {
  emitGuideExperienceAfterTool,
  runGuideExperienceBeforeTool
}) {
  const plan = planGuideRoute('我第一次来三星堆，只有20分钟。', { context: { explorationHistory: {} } })
  const decision = {
    routePlan: plan,
    guideAction: 'create_guide',
    tool: 'control_trail',
    toolName: 'control_trail'
  }
  const events = []
  const timeline = []
  let releaseIntroduction
  const introductionCompletion = new Promise((resolve) => {
    releaseIntroduction = resolve
  })
  const originalWindow = global.window
  global.window = {
    setTimeout: (callback) => {
      callback()
      return 0
    }
  }
  try {
    const beforeTool = runGuideExperienceBeforeTool({
      decision,
      emit: (event) => {
        events.push(event)
        timeline.push(event.type)
        if (event.type === 'guide_introducing_destination') {
          return introductionCompletion.then(() => timeline.push('introducing_completed'))
        }
        return Promise.resolve()
      },
      delays: {
        preparingMs: 0,
        introducingMs: 0
      }
    })
    await Promise.resolve()
    await Promise.resolve()
    assert(!timeline.includes('guide_navigating'), 'navigation must remain blocked while introduction is playing')
    assert(!timeline.includes('control_trail_executed'), 'control_trail must not execute while introduction is playing')
    releaseIntroduction()
    await beforeTool
    timeline.push('control_trail_executed')
    const completedExperience = await emitGuideExperienceAfterTool({
      decision,
      execution: {
        data: {
          trailStatus: {
            artifactId: 'HI-2025-005',
            artifactName: '青铜大立人',
            trailNodeId: 'artifact-HI-2025-005',
            scene: '时空展线',
            page: '/trail',
            status: 'arrived'
          }
        }
      },
      emit: async (event) => {
        events.push(event)
        timeline.push(event.type)
      }
    })
    assert.equal(completedExperience.experienceState.state, 'completed', 'experience state should complete after explanation')
  } finally {
    global.window = originalWindow
  }

  assert.deepEqual(
    events.map((event) => event.type),
    [
      'guide_preparing_visit',
      'guide_introducing_destination',
      'guide_navigating',
      'guide_arrived',
      'guide_explaining'
    ],
    'guide experience should emit visitor-facing route events in order'
  )
  assert(events[1].message.includes('青铜大立人'), 'destination intro should mention first stop')
  assert(events[4].message.includes('青铜大立人'), 'arrival explanation should mention reached artifact')
  assert(
    timeline.indexOf('control_trail_executed') > timeline.indexOf('introducing_completed'),
    'control_trail must wait until destination introduction completes'
  )
  assert(
    timeline.indexOf('control_trail_executed') > timeline.indexOf('guide_navigating') &&
      timeline.indexOf('control_trail_executed') < timeline.indexOf('guide_arrived'),
    'control_trail must execute only between navigating and arrived'
  )
  assert.deepEqual(
    events.map((event) => event.metadata?.guideExperienceState?.state),
    ['preparing', 'introducing', 'navigating', 'arrived', 'explaining'],
    'guide events should expose the real experience state machine'
  )
  console.log('- guide experience orchestration events: PASS')
}
