import { chromium } from '@playwright/test'

const frontendBase = process.env.FRONTEND_BASE || 'http://127.0.0.1:8800'
const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const browser = await launchBrowser()
try {
  await runVisualAidConfirmationCase(browser)
  await runConversationRestoreCase(browser)
  console.log('Continuous exploration UI regression: PASS')
} finally {
  await browser.close()
}

async function runVisualAidConfirmationCase(browser) {
  const page = await createAuthenticatedPage(browser)
  let proposalCalls = 0
  let confirmationCalls = 0
  let syncPayload = null
  let proposalPayload = null

  await page.route('**/api/ai-chat/session/list**', (route) => json(route, []))
  await page.route('**/api/ai-chat/session/start**', (route) => json(route, 'visual-session'))
  await page.route('**/api/ai-chat/session/visual-session/state', async (route) => {
    syncPayload = route.request().postDataJSON()
    await json(route, null)
  })
  await page.route('**/api/media-generation/history**', (route) => json(route, pageData([])))
  await page.route('**/api/agent/route', (route) => json(route, {
    route: 'RAG', tool: null, arguments: {}, confidence: 0.97,
    reason: 'artifact significance question', message: '', attachmentContext: ''
  }))
  await page.route('**/api/agent/knowledge/search**', (route) => json(route, {
    documents: [{
      title: '青铜神树研究资料',
      content: '青铜神树体现了古蜀文明对天地连接、祭祀体系和太阳崇拜的想象。',
      excerpt: '青铜神树关联天地连接与祭祀体系。',
      path: 'wiki/artifacts/bronze-tree.md',
      type: 'markdown',
      score: 0.94
    }]
  }))
  await page.route('**/api/ai-chat/stream', (route) => route.fulfill({
    status: 200,
    headers: { 'content-type': 'text/event-stream; charset=utf-8' },
    body: 'data: 青铜神树的重要性，在于它把古蜀人的祭祀秩序、天地想象与太阳崇拜集中在一件文物上。\n\ndata: [DONE]\n\n'
  }))
  await page.route('**/api/visual-aid/proposals', async (route) => {
    proposalCalls += 1
    proposalPayload = route.request().postDataJSON()
    await json(route, proposal({ messageId: proposalPayload.messageId }))
  })
  await page.route('**/api/visual-aid/proposals/proposal-visual/confirm', async (route) => {
    confirmationCalls += 1
    await json(route, task())
  })
  await page.route('**/api/media-generation/tasks/task-visual', (route) => json(route, task({
    status: 'SUCCEEDED', stage: 'SUCCEEDED', stageMessage: '作品已生成', elapsedSeconds: 8, resultUrl: imageDataUrl
  })))

  try {
    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').fill('青铜神树为什么重要？')
    await page.locator('.composer .send-button').click()

    const answer = page.getByText('青铜神树的重要性，在于它把古蜀人的祭祀秩序')
    await answer.waitFor({ state: 'visible' })
    await page.getByText('玄喵的视觉辅助建议').waitFor({ state: 'visible' })
    assert(proposalCalls === 1, `one answer must produce at most one proposal, got ${proposalCalls}`)
    assert(confirmationCalls === 0, 'proposal must not create a paid generation task before confirmation')
    assert(await page.locator('.generation-work').count() === 0, 'work card must not exist before confirmation')
    assert(proposalPayload.sessionId === 'visual-session', 'proposal must carry the current exploration session')
    assert(Array.isArray(proposalPayload.sourceReferences) && proposalPayload.sourceReferences.length === 1,
      'proposal must keep the answer source reference')

    await page.getByRole('button', { name: /生成辅助示意图/ }).click()
    await page.locator('.generation-work__canvas img').waitFor({ state: 'visible' })
    assert(confirmationCalls === 1, `confirmation must create exactly one task, got ${confirmationCalls}`)
    assert(await answer.count() === 1, 'the original knowledge answer must remain visible after generation')
    const answerRow = page.locator('.message-row--assistant').filter({ has: answer })
    assert(await answerRow.locator('.generation-work').count() === 1, 'work card must return to the original answer bubble')
    assert(await answerRow.getByText('AI辅助示意图').count() === 1, 'AI trust label is missing from the visual aid')
    await page.waitForFunction(() => Boolean(window.sessionStorage.getItem('xuanmiao_short_context')))
    await page.waitForTimeout(700)
    assert(syncPayload?.messages?.some((item) => item.generationTaskId === 'task-visual'),
      'conversation snapshot must persist the visual task on its answer')
    assert(syncPayload?.messages?.some((item) => item.references?.length === 1),
      'conversation snapshot must persist source references')
    console.log('- proposal -> explicit confirmation -> original answer work card: PASS')
  } finally {
    await page.close()
  }
}

async function runConversationRestoreCase(browser) {
  const page = await createAuthenticatedPage(browser, () => {
    window.localStorage.setItem('ai-chat-current-session', 'restore-session')
    window.confirm = () => true
  })
  let startCalls = 0
  let deleteCalls = 0
  const restoredTask = task({
    status: 'SUCCEEDED', stage: 'SUCCEEDED', stageMessage: '作品已生成', elapsedSeconds: 9, resultUrl: imageDataUrl
  })
  const session = {
    sessionId: 'restore-session',
    title: '20分钟青铜神树探索',
    summary: '青铜神树为什么重要？',
    status: 'ACTIVE',
    currentArtifact: '青铜神树',
    currentTrailNode: '玄喵讲解',
    activeGuideState: { routeId: 'guide-20', currentNode: 1, status: 'paused' },
    lastVisualAidTask: 'task-visual',
    context: {
      conversationId: 'restore-session', currentArtifact: '青铜神树', currentArtifactId: 'HI-2025-006',
      currentTrailNode: '玄喵讲解', activeGuideState: { routeId: 'guide-20', currentNode: 1, status: 'paused' },
      lastVisualAidTask: 'task-visual'
    }
  }
  const references = [{
    title: '青铜神树研究资料', path: 'wiki/artifacts/bronze-tree.md', type: 'markdown', score: 0.94
  }]
  const restoredProposal = proposal({ status: 'CONFIRMED', generationTaskId: 'task-visual' })
  const messages = [
    storedMessage({ id: 1, clientMessageId: 'user-restored', role: 'user', content: '青铜神树为什么重要？' }),
    storedMessage({
      id: 2,
      clientMessageId: 'assistant-restored',
      role: 'assistant',
      content: '青铜神树连接着古蜀人的祭祀秩序与天地想象。',
      generationTaskId: 'task-visual',
      references,
      trace: { route: 'RAG', tool: null, duration: 321 },
      uiPayload: {
        content: ['青铜神树连接着古蜀人的祭祀秩序与天地想象。'],
        streamArchived: true,
        visualAidProposal: restoredProposal,
        generationTaskId: 'task-visual',
        agentTrace: { route: 'RAG', tool: null, duration: 321 }
      }
    })
  ]
  let sessions = [session]

  await page.route('**/api/ai-chat/session/list**', (route) => json(route, sessions))
  await page.route('**/api/ai-chat/session/start**', async (route) => {
    startCalls += 1
    sessions = [{ sessionId: 'new-session', title: '新的玄喵探索', status: 'ACTIVE' }, ...sessions]
    await json(route, 'new-session')
  })
  await page.route('**/api/ai-chat/session/restore-session', async (route) => {
    deleteCalls += 1
    sessions = sessions.filter((item) => item.sessionId !== 'restore-session')
    await json(route, null)
  })
  await page.route('**/api/ai-chat/session/restore-session/messages', (route) => json(route, messages))
  await page.route('**/api/ai-chat/session/restore-session/state', (route) => json(route, null))
  await page.route('**/api/ai-chat/session/new-session/state', (route) => json(route, null))
  await page.route('**/api/media-generation/history**', (route) => json(route, pageData([restoredTask])))
  await page.route('**/api/media-generation/tasks/task-visual', (route) => json(route, restoredTask))

  try {
    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.getByText('20分钟青铜神树探索').waitFor({ state: 'visible' })
    await page.getByText('青铜神树连接着古蜀人的祭祀秩序与天地想象。').waitFor({ state: 'visible' })
    await page.locator('.generation-work__canvas img').waitFor({ state: 'visible' })
    assert(await page.locator('.message-references').count() === 1, 'restored answer lost its source references')
    assert(await page.getByText('已确认，作品会回到这段讲解中').count() === 1, 'restored proposal status is missing')
    const context = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('xuanmiao_short_context') || '{}'))
    assert(context.conversationId === 'restore-session', 'restored context lost conversationId')
    assert(context.currentArtifact === '青铜神树', 'restored context lost currentArtifact')
    assert(context.currentTrailNode === '玄喵讲解', 'restored context lost currentTrailNode')
    assert(context.activeGuideState?.routeId === 'guide-20', 'restored context lost activeGuideState')
    assert(context.lastVisualAidTask === 'task-visual', 'restored context lost lastVisualAidTask')
    await page.getByTitle('新建探索').evaluate((button) => button.click())
    await page.waitForFunction(() => window.localStorage.getItem('ai-chat-current-session') === 'new-session')
    assert(startCalls === 1, `new exploration should create one session, got ${startCalls}`)
    const restoredRow = page.locator('.exploration-library li').filter({ hasText: '20分钟青铜神树探索' })
    await restoredRow.locator('.exploration-session-delete').evaluate((button) => button.click())
    await page.waitForFunction(() => !document.body.innerText.includes('20分钟青铜神树探索'))
    assert(deleteCalls === 1, `delete exploration should remove one session, got ${deleteCalls}`)
    console.log('- conversation restore, new exploration and delete lifecycle: PASS')
  } finally {
    await page.close()
  }
}

async function createAuthenticatedPage(browser, extraInit) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  page.setDefaultTimeout(45000)
  await page.addInitScript((withExtra) => {
    window.localStorage.setItem('token', JSON.stringify('continuous-exploration-token'))
    window.localStorage.setItem('userInfo', JSON.stringify({ id: 7, username: 'exploration-regression', userType: 'USER' }))
    if (!withExtra) window.localStorage.removeItem('ai-chat-current-session')
  }, Boolean(extraInit))
  if (extraInit) await page.addInitScript(extraInit)
  return page
}

function proposal(overrides = {}) {
  return {
    proposalId: 'proposal-visual', sessionId: 'visual-session', messageId: 'assistant-visual',
    artifactId: 'HI-2025-006', artifactName: '青铜神树', title: '生成青铜神树视觉辅助示意图',
    reason: '用画面呈现祭祀场景、天地连接和太阳崇拜，帮助理解当前讲解。',
    prompt: '博物馆教育用途的青铜神树祭祀场景示意图', purpose: 'GUIDE_SUPPORT',
    contentLabel: 'AI_ILLUSTRATION', knowledgeFocus: ['祭祀场景', '天地连接', '太阳崇拜'],
    sourceReferences: [{ title: '青铜神树研究资料', path: 'wiki/artifacts/bronze-tree.md', score: 0.94 }],
    status: 'PROPOSED', ...overrides
  }
}

function task(overrides = {}) {
  return {
    taskId: 'task-visual', mediaType: 'IMAGE', mode: 'TEXT_TO_IMAGE', status: 'PENDING', stage: 'QUEUED',
    stageMessage: '任务已进入队列', elapsedSeconds: 0, modelProfile: 'FAST', contentLabel: 'AI_ILLUSTRATION',
    promptRaw: '博物馆教育用途的青铜神树祭祀场景示意图', resultUrl: null,
    experienceContext: { surface: 'AI_CHAT', purpose: 'GUIDE_SUPPORT', proposalId: 'proposal-visual', sessionId: 'visual-session' },
    createTime: '2026-07-14T10:00:00', ...overrides
  }
}

function storedMessage(overrides = {}) {
  return {
    id: 1, sessionId: 'restore-session', role: 'assistant', content: '', messageType: 'TEXT',
    clientMessageId: '', generationTaskId: '', attachments: [], trace: null, references: [], uiPayload: {},
    createTime: '2026-07-14T10:00:00', ...overrides
  }
}

function pageData(records) {
  return { total: records.length, pageNum: 1, pageSize: 30, records }
}

async function json(route, data) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: '200', msg: 'ok', data })
  })
}

async function launchBrowser() {
  const errors = []
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, headless: true }) }
    catch (error) { errors.push(`${channel}: ${error.message}`) }
  }
  try { return await chromium.launch({ headless: true }) }
  catch (error) { errors.push(`bundled: ${error.message}`) }
  throw new Error(`No Playwright browser is available. ${errors.join(' | ')}`)
}
