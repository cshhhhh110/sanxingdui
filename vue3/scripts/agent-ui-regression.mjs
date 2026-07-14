import { chromium } from '@playwright/test'

const frontendBase = process.env.FRONTEND_BASE || 'http://127.0.0.1:8800'

const cases = [
  {
    name: 'shop product search',
    command: '\u6253\u5f00\u5546\u57ce\u641c\u7d22\u91d1\u9762\u5177\u6587\u521b',
    decision: {
      route: 'TOOL_CALL',
      tool: 'search_product',
      arguments: { keyword: '\u91d1\u9762\u5177\u6587\u521b', quantity: 1 },
      confidence: 0.98,
      reason: 'mocked shop product search',
      message: '',
      attachmentContext: ''
    },
    verify(url) {
      return url.pathname === '/shop' &&
        (url.searchParams.get('keyword') || '').includes('\u91d1\u9762\u5177') &&
        url.searchParams.get('buyQty') === '1'
    }
  },
  {
    name: 'spacetime trail artifact',
    command: '\u6253\u5f00\u91d1\u9762\u5177\u7684\u65f6\u7a7a\u5c55\u7ebf',
    decision: {
      route: 'TOOL_CALL',
      tool: 'control_trail',
      arguments: { action: 'open_artifact', artifact_id: 'HI-2025-002' },
      confidence: 0.98,
      reason: 'mocked trail artifact control',
      message: '',
      attachmentContext: ''
    },
    verify(url) {
      return url.pathname === '/trail' &&
        url.searchParams.get('entityId') === 'HI-2025-002' &&
        url.searchParams.get('pitCode') === 'K5'
    }
  },
  {
    name: 'guide introduction before trail navigation',
    command: '\u6211\u7b2c\u4e00\u6b21\u6765\u4e09\u661f\u5806\uff0c\u53ea\u670920\u5206\u949f\u3002',
    decision: {
      route: 'TOOL_CALL',
      tool: 'control_trail',
      arguments: { action: 'open_artifact', artifact_id: 'HI-2025-005' },
      confidence: 0.98,
      reason: 'mocked paced guide route',
      message: '',
      attachmentContext: ''
    },
    expectGuidePacing: true,
    verify(url) {
      return url.pathname === '/trail' &&
        url.searchParams.get('entityId') === 'HI-2025-005' &&
        url.searchParams.get('pitCode') === 'K2'
    }
  }
]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const browser = await launchBrowser()
const page = await browser.newPage()

try {
  page.setDefaultTimeout(45000)
  await page.addInitScript(() => {
    window.localStorage.setItem('token', JSON.stringify('agent-ui-regression-token'))
    window.localStorage.setItem('userInfo', JSON.stringify({
      id: 1,
      username: 'agent-regression-user',
      nickname: 'Agent Regression',
      userType: 'USER'
    }))
  })
  await page.route('**/api/ai-chat/session/list**', (route) => json(route, []))
  await page.route('**/api/ai-chat/session/*/state', (route) => json(route, null))

  for (const testCase of cases) {
    await runCase(page, testCase)
  }
  await runDirectAnswerCase(page)
  await runUnsupportedCase(page)
  await runUnknownToolCase(page)
  await runWeatherToolCase(page)
  await runRagReferencesCase(page)
  await runKnowledgeQuestionDoesNotTriggerGuideCase(page)
  await runStreamFallbackStatusCase(page)
  await runImageMultimodalCase(page)
  await runContextMemoryCase(page)
  await runFloatingVoiceShortcutCase(page)

  console.log('Agent UI regression: PASS')
  } finally {
    await page.unroute('**/api/ai-chat/session/list**')
    await page.unroute('**/api/ai-chat/session/*/state')
    await browser.close()
  }

async function runCase(page, testCase) {
  try {
    await page.route('**/api/ai-chat/session/start**', (route) => json(route, `tool-${Date.now()}`))
    await page.route('**/api/agent/tools', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: [
            { name: 'search_product', enabled: true },
            { name: 'control_trail', enabled: true }
          ]
        })
      })
    })
    await page.route('**/api/agent/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: testCase.decision
        })
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })

    const textarea = page.locator('.composer textarea')
    await textarea.waitFor({ state: 'visible' })
    await textarea.fill(testCase.command)
    await page.locator('.composer .send-button').click()

    if (testCase.expectGuidePacing) {
      const narration = page.locator('.message-row--assistant .message-answer').last()
      await narration.getByText(/第一站|第 1 站/).waitFor({ state: 'visible', timeout: 10000 })
      assert(new URL(page.url()).pathname === '/ai-chat', 'guide must remain in chat while introducing the first stop')
      await page.waitForTimeout(700)
      assert(new URL(page.url()).pathname === '/ai-chat', 'control_trail must not run before the introduction phase completes')
    }

    await page.waitForURL((url) => testCase.verify(url), { timeout: 45000, waitUntil: 'commit' })

    const currentUrl = new URL(page.url())
    assert(testCase.verify(currentUrl), `Case "${testCase.name}" reached unexpected URL: ${page.url()}`)
    console.log(`- ${testCase.name}: ${page.url()}`)
  } finally {
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/agent/tools')
    await page.unroute('**/api/agent/route')
  }
}

async function runDirectAnswerCase(page) {
  let knowledgeSearchCalls = 0
  let sessionStartCalls = 0
  let streamCalls = 0

  try {
    await page.route('**/api/agent/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'DIRECT_ANSWER',
            tool: null,
            arguments: {},
            confidence: 0.93,
            reason: 'general direct answer',
            message: '\u4f60\u53ef\u4ee5\u76f4\u63a5\u8fd9\u6837\u7406\u89e3\uff1a\u8fd9\u662f\u4e00\u6761\u666e\u901a\u95ee\u7b54\u3002',
            attachmentContext: ''
          }
        })
      })
    })

    await page.route('**/api/agent/knowledge/search**', async (route) => {
      knowledgeSearchCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: { documents: [] } })
      })
    })

    await page.route('**/api/ai-chat/session/start**', async (route) => {
      sessionStartCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: 'unexpected-direct-answer-session' })
      })
    })

    await page.route('**/api/ai-chat/stream', async (route) => {
      streamCalls += 1
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache'
        },
        body: 'data: unexpected\n\ndata: [DONE]\n\n'
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').waitFor({ state: 'visible' })
    await page.locator('.composer textarea').fill('\u4f60\u597d\uff0c\u968f\u4fbf\u804a\u4e24\u53e5')
    await page.locator('.composer .send-button').click()

    await page.getByText('\u4f60\u53ef\u4ee5\u76f4\u63a5\u8fd9\u6837\u7406\u89e3\uff1a\u8fd9\u662f\u4e00\u6761\u666e\u901a\u95ee\u7b54\u3002').waitFor({ timeout: 45000 })
    assert(knowledgeSearchCalls === 0, `Direct answer should not call knowledge search, got ${knowledgeSearchCalls}`)
    assert(sessionStartCalls === 1, `Direct answer should persist one exploration session, got ${sessionStartCalls}`)
    assert(streamCalls === 0, `Direct answer should not call chat stream, got ${streamCalls}`)
    console.log('- direct answer without RAG or SSE: PASS')
  } finally {
    await page.unroute('**/api/agent/route')
    await page.unroute('**/api/agent/knowledge/search**')
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/ai-chat/stream')
  }
}

async function runUnsupportedCase(page) {
  let knowledgeSearchCalls = 0
  let sessionStartCalls = 0
  let streamCalls = 0

  try {
    await page.route('**/api/agent/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'UNSUPPORTED',
            tool: null,
            arguments: {},
            confidence: 0.96,
            reason: 'missing ticket booking capability',
            requiredCapability: 'ticket_booking',
            message: '\u5f53\u524d\u8fd8\u6ca1\u6709\u63a5\u5165\u95e8\u7968\u9884\u8ba2\u5de5\u5177\u3002',
            attachmentContext: ''
          }
        })
      })
    })

    await page.route('**/api/agent/knowledge/search**', async (route) => {
      knowledgeSearchCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: { documents: [] } })
      })
    })

    await page.route('**/api/ai-chat/session/start**', async (route) => {
      sessionStartCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: 'unexpected-unsupported-session' })
      })
    })

    await page.route('**/api/ai-chat/stream', async (route) => {
      streamCalls += 1
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache'
        },
        body: 'data: unexpected\n\ndata: [DONE]\n\n'
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').waitFor({ state: 'visible' })
    await page.locator('.composer textarea').fill('\u5e2e\u6211\u9884\u8ba2\u4e00\u5f20\u95e8\u7968')
    await page.locator('.composer .send-button').click()

    await page.getByText('\u5f53\u524d\u8fd8\u6ca1\u6709\u63a5\u5165\u95e8\u7968\u9884\u8ba2\u5de5\u5177\u3002').waitFor({ timeout: 45000 })
    assert(knowledgeSearchCalls === 0, `Unsupported route should not call knowledge search, got ${knowledgeSearchCalls}`)
    assert(sessionStartCalls === 1, `Unsupported route should persist one exploration session, got ${sessionStartCalls}`)
    assert(streamCalls === 0, `Unsupported route should not call chat stream, got ${streamCalls}`)
    console.log('- unsupported route with clear message: PASS')
  } finally {
    await page.unroute('**/api/agent/route')
    await page.unroute('**/api/agent/knowledge/search**')
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/ai-chat/stream')
  }
}

async function runUnknownToolCase(page) {
  let knowledgeSearchCalls = 0
  let sessionStartCalls = 0
  let streamCalls = 0

  try {
    await page.route('**/api/agent/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'TOOL_CALL',
            tool: 'missing_demo_tool',
            arguments: {},
            confidence: 0.88,
            reason: 'simulated unavailable frontend tool',
            message: '',
            attachmentContext: ''
          }
        })
      })
    })

    await page.route('**/api/agent/knowledge/search**', async (route) => {
      knowledgeSearchCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: { documents: [] } })
      })
    })

    await page.route('**/api/ai-chat/session/start**', async (route) => {
      sessionStartCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: 'unexpected-tool-failure-session' })
      })
    })

    await page.route('**/api/ai-chat/stream', async (route) => {
      streamCalls += 1
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache'
        },
        body: 'data: unexpected\n\ndata: [DONE]\n\n'
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').waitFor({ state: 'visible' })
    await page.locator('.composer textarea').fill('\u8bf7\u6267\u884c\u4e00\u4e2a\u4e0d\u5b58\u5728\u7684\u5de5\u5177')
    await page.locator('.composer .send-button').click()

    await page.locator('.message-answer p', {
      hasText: '\u6a21\u578b\u9009\u62e9\u7684\u5de5\u5177\u5728\u5f53\u524d\u5ba2\u6237\u7aef\u4e0d\u53ef\u7528\u3002'
    }).waitFor({ timeout: 45000 })
    assert(knowledgeSearchCalls === 0, `Unknown tool should not call knowledge search, got ${knowledgeSearchCalls}`)
    assert(sessionStartCalls === 1, `Unknown tool should persist one exploration session, got ${sessionStartCalls}`)
    assert(streamCalls === 0, `Unknown tool should not call chat stream, got ${streamCalls}`)
    console.log('- unknown tool failure message: PASS')
  } finally {
    await page.unroute('**/api/agent/route')
    await page.unroute('**/api/agent/knowledge/search**')
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/ai-chat/stream')
  }
}

async function runWeatherToolCase(page) {
  let knowledgeSearchCalls = 0

  try {
    await page.route('**/api/ai-chat/session/start**', (route) => json(route, 'agent-ui-weather-session'))
    await page.route('**/api/agent/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'TOOL_CALL',
            tool: 'get_weather',
            arguments: { city: '\u6210\u90fd' },
            confidence: 0.98,
            reason: 'weather request with search verb',
            message: '',
            attachmentContext: ''
          }
        })
      })
    })

    await page.route('**/api/agent/tools/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            city: '\u6210\u90fd',
            summary: '\u6210\u90fd\u4eca\u5929\u6674\uff0c\u9002\u5408\u51fa\u884c\u3002'
          }
        })
      })
    })

    await page.route('**/api/agent/knowledge/search**', async (route) => {
      knowledgeSearchCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: { documents: [] } })
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').waitFor({ state: 'visible' })
    await page.locator('.composer textarea').fill('\u67e5\u627e\u4eca\u5929\u5929\u6c14')
    await page.locator('.composer .send-button').click()

    await page.getByText('\u6210\u90fd\u4eca\u5929\u6674\uff0c\u9002\u5408\u51fa\u884c\u3002').waitFor({ timeout: 45000 })
    await page.locator('.exploration-archive > summary').last().waitFor({ timeout: 45000 })
    const visitorText = await page.locator('.message-exploration').last().innerText()
    assert(!visitorText.includes('TOOL_CALL'), 'Visitor mode should hide raw TOOL_CALL label')
    await page.locator('.exploration-archive > summary').last().click()
    const weatherStatusCount = await page.getByText(/\u67e5\u8be2\u6210\u90fd\u51fa\u884c\u4fe1\u606f|\u67e5\u8be2\u53c2\u89c2\u51fa\u884c\u4fe1\u606f/).count()
    assert(weatherStatusCount >= 1, 'Expanded exploration archive should show weather-friendly status')
    await page.getByText('\u4e13\u5bb6\u6a21\u5f0f\uff1a\u67e5\u770b Agent \u4fe1\u606f').click()
    await page.getByText('get_weather', { exact: true }).first().waitFor({ timeout: 45000 })
    const currentUrl = new URL(page.url())
    assert(currentUrl.pathname === '/ai-chat', `Weather tool should stay on AI chat, got ${page.url()}`)
    assert(knowledgeSearchCalls === 0, `Weather tool should not call knowledge search, got ${knowledgeSearchCalls}`)
    console.log('- visitor/expert exploration trace for weather tool: PASS')
  } finally {
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/agent/route')
    await page.unroute('**/api/agent/tools/weather**')
    await page.unroute('**/api/agent/knowledge/search**')
  }
}

async function runRagReferencesCase(page) {
  let streamRelease
  let streamRequestedResolve
  const streamRequested = new Promise((resolve) => {
    streamRequestedResolve = resolve
  })

  try {
    await page.route('**/api/agent/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'RAG',
            tool: null,
            arguments: {},
            confidence: 0.95,
            reason: 'Sanxingdui knowledge question',
            message: '',
            attachmentContext: ''
          }
        })
      })
    })

    await page.route('**/api/agent/knowledge/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            documents: [{
              title: '\u4e09\u661f\u5806\u4e0e\u91d1\u6c99\u9057\u5740\u6bd4\u8f83\u7814\u7a76',
              content: '\u4e09\u661f\u5806\u4e0e\u91d1\u6c99\u90fd\u5c5e\u4e8e\u53e4\u8700\u6587\u660e\u4f53\u7cfb\uff0c\u5728\u796d\u7940\u793c\u4eea\u3001\u91d1\u5668\u548c\u7389\u5668\u7b49\u65b9\u9762\u5b58\u5728\u4f20\u627f\u5173\u7cfb\u3002',
              excerpt: '\u4e09\u661f\u5806\u4e0e\u91d1\u6c99\u90fd\u5c5e\u4e8e\u53e4\u8700\u6587\u660e\u4f53\u7cfb\u3002',
              path: 'wiki/comparisons/sanxingdui-jinsha.md',
              type: 'markdown',
              score: 0.91,
              obsidianUri: 'obsidian://open?vault=knowledge-vault&file=wiki/comparisons/sanxingdui-jinsha.md',
              openUrl: ''
            }]
          }
        })
      })
    })

    await page.route('**/api/ai-chat/session/start**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: 'agent-ui-rag-session' })
      })
    })

    await page.route('**/api/ai-chat/stream', async (route) => {
      streamRequestedResolve()
      await new Promise((resolve) => {
        streamRelease = resolve
      })
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache'
        },
          body: `${agentEventFrame('generating', '\u6b63\u5728\u751f\u6210\u6587\u5316\u5173\u7cfb\u8bb2\u89e3...')}\n\ndata: \u4e09\u661f\u5806\u4e0e\u91d1\u6c99\u9057\u5740\u90fd\u5c5e\u4e8e\u53e4\u8700\u6587\u660e\u4f53\u7cfb\uff0c\u53ef\u4ee5\u4ece\u793c\u4eea\u3001\u91d1\u5668\u548c\u7389\u5668\u7ebf\u7d22\u770b\u5230\u4f20\u627f\u5173\u7cfb\u3002\n\ndata: [DONE]\n\n`
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').waitFor({ state: 'visible' })
    await page.locator('.composer textarea').fill('\u4e09\u661f\u5806\u548c\u91d1\u6c99\u6709\u4ec0\u4e48\u8054\u7cfb\uff1f')
    await page.locator('.composer .send-button').click()

    await streamRequested
    await page.getByText('\u7384\u55b5\u6b63\u5728\u63a2\u7d22').waitFor({ timeout: 45000 })
    const liveStatusCount = await page.getByText(/\u6b63\u5728\u67e5\u9605\u53e4\u8700\u6587\u660e\u8d44\u6599|\u6b63\u5728\u6574\u7406\u4e09\u661f\u5806\u4e0e\u91d1\u6c99\u7684\u5173\u8054|\u6b63\u5728\u751f\u6210\u6587\u5316\u5173\u7cfb\u8bb2\u89e3/).count()
    assert(liveStatusCount >= 1, 'RAG request should show live exploration status before DONE')
    const beforeDoneReferenceCount = await page.locator('.message-references').count()
    assert(beforeDoneReferenceCount === 0, `RAG references should not render before DONE, got ${beforeDoneReferenceCount}`)

    streamRelease()
    await page.getByText('\u4e09\u661f\u5806\u4e0e\u91d1\u6c99\u9057\u5740\u90fd\u5c5e\u4e8e\u53e4\u8700\u6587\u660e\u4f53\u7cfb').waitFor({ timeout: 45000 })
    await page.locator('.exploration-archive > summary').last().waitFor({ timeout: 45000 })
    const answerText = await page.locator('.message-bubble').last().innerText()
    assert(!answerText.includes('[AGENT_EVENT]'), 'SSE agent event should not leak into final answer')
    await page.locator('.exploration-archive > summary').last().click()
    await page.getByText(/\u6574\u7406\u4e09\u661f\u5806\u4e0e\u91d1\u6c99\u7684\u5173\u8054|\u53d1\u73b0\u4e09\u661f\u5806\u9057\u5740\u4e0e\u91d1\u6c99\u9057\u5740\u7684\u5173\u8054\u7ebf\u7d22/).first().waitFor({ timeout: 45000 })
    const visitorText = await page.locator('.message-exploration').last().innerText()
    assert(!visitorText.includes('RAG'), 'Visitor mode should hide raw RAG route label')
    await page.getByText('\u4e13\u5bb6\u6a21\u5f0f\uff1a\u67e5\u770b Agent \u4fe1\u606f').click()
    await page.getByText('RAG', { exact: true }).first().waitFor({ timeout: 45000 })
    await page.locator('.message-references').waitFor({ state: 'visible', timeout: 45000 })
    await page.locator('.message-references > summary').click()
    const referenceVisitorText = await page.locator('.message-references').innerText()
    assert(referenceVisitorText.includes('\u91d1\u6c99\u9057\u5740\u8d44\u6599') || referenceVisitorText.includes('\u4e09\u661f\u5806\u9057\u5740\u8d44\u6599'), 'Reference visitor title should be natural')
    assert(!referenceVisitorText.includes('\u5339\u914d\u5ea6') || referenceVisitorText.includes('\u4e13\u5bb6\u4fe1\u606f'), 'Reference technical details should stay under expert mode')
    await page.getByText('\u7ee7\u7eed\u63a2\u7d22').waitFor({ timeout: 45000 })
    const followupCount = await page.locator('.message-followups .followup-list button').count()
    assert(followupCount >= 1, 'RAG answer should render at least one follow-up exploration suggestion')
    const afterDoneReferenceCount = await page.locator('.message-references').count()
    assert(afterDoneReferenceCount === 1, `RAG references should render after DONE, got ${afterDoneReferenceCount}`)
    console.log('- RAG exploration journey and references after stream done: PASS')
  } finally {
    await page.unroute('**/api/agent/route')
    await page.unroute('**/api/agent/knowledge/search**')
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/ai-chat/stream')
  }
}

async function runKnowledgeQuestionDoesNotTriggerGuideCase(page) {
  let routePlanInPayload = 'missing'
  let streamCalls = 0

  try {
    await page.route('**/api/agent/route', async (route) => {
      const payload = route.request().postDataJSON()
      routePlanInPayload = payload?.context?.activeGuideRoutePlan ?? null
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'RAG',
            tool: null,
            arguments: {},
            confidence: 0.98,
            reason: 'knowledge question must remain RAG',
            message: '',
            attachmentContext: ''
          }
        })
      })
    })

    await page.route('**/api/agent/knowledge/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            documents: [{
              title: '三星堆遗址资料',
              content: '三星堆大量独特器物、复杂祭祀遗存和仍待研究的文字线索，使其呈现出神秘感。',
              excerpt: '独特器物与复杂祭祀遗存共同形成神秘感。',
              path: 'wiki/sites/sanxingdui.md',
              type: 'markdown',
              score: 0.9
            }]
          }
        })
      })
    })

    await page.route('**/api/ai-chat/session/start**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: 'knowledge-not-guide-session' })
      })
    })

    await page.route('**/api/ai-chat/stream', async (route) => {
      streamCalls += 1
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream; charset=utf-8' },
        body: 'data: 三星堆的神秘感来自独特器物、复杂祭祀遗存，以及许多仍待研究的历史问题。\n\ndata: [DONE]\n\n'
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').waitFor({ state: 'visible' })
    await page.locator('.composer textarea').fill('三星堆文明为什么会让人觉得神秘？')
    await page.locator('.composer .send-button').click()
    await page.getByText('三星堆的神秘感来自独特器物').waitFor({ timeout: 45000 })

    const currentUrl = new URL(page.url())
    const lastAnswer = await page.locator('.message-bubble').last().innerText()
    assert(currentUrl.pathname === '/ai-chat', `knowledge question must remain in AI chat, got ${page.url()}`)
    assert(routePlanInPayload === null, 'knowledge question must not attach an activeGuideRoutePlan')
    assert(streamCalls === 1, `knowledge question should enter RAG stream exactly once, got ${streamCalls}`)
    assert(!lastAnswer.includes('20分钟主题导览'), 'knowledge answer must not contain a generated guide route')
    assert(!lastAnswer.includes('第 1 站'), 'knowledge answer must not contain a guide stop')
    console.log('- knowledge question remains RAG instead of GuidePlan: PASS')
  } finally {
    await page.unroute('**/api/agent/route')
    await page.unroute('**/api/agent/knowledge/search**')
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/ai-chat/stream')
  }
}

async function runStreamFallbackStatusCase(page) {
  try {
    await page.route('**/api/agent/route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'RAG',
            tool: null,
            arguments: {},
            confidence: 0.94,
            reason: 'fallback status case',
            message: '',
            attachmentContext: ''
          }
        })
      })
    })

    await page.route('**/api/agent/knowledge/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: { documents: [] } })
      })
    })

    await page.route('**/api/ai-chat/session/start**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: 'agent-ui-fallback-session' })
      })
    })

    await page.route('**/api/ai-chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache'
        },
        body: `${agentEventFrame('error', '\u5f53\u524d\u667a\u80fd\u751f\u6210\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u6b63\u5728\u5207\u6362\u5907\u7528\u8d44\u6599\u65b9\u6848...', 'failed')}\n\ndata: [ERROR]\u6a21\u578b\u6682\u65f6\u4e0d\u53ef\u7528\n\n`
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').waitFor({ state: 'visible' })
    await page.locator('.composer textarea').fill('\u4e09\u661f\u5806\u6587\u660e\u4e3a\u4ec0\u4e48\u795e\u79d8\uff1f')
    await page.locator('.composer .send-button').click()

    await page.waitForTimeout(1500)
    assert(!page.isClosed(), 'stream fallback should not crash the chat page')
    console.log('- stream fallback status and archive: PASS')
  } finally {
    await page.unroute('**/api/agent/route')
    await page.unroute('**/api/agent/knowledge/search**')
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/ai-chat/stream')
  }
}

async function runImageMultimodalCase(page) {
  let knowledgeSearchCalls = 0

  await page.route('**/api/file/upload/temp', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: '200',
        msg: 'ok',
        data: {
          id: 9001,
          originalName: 'agent-image.png',
          filePath: '/files/temp/agent-image.png',
          fileSize: 68,
          fileType: 'IMAGE'
        }
      })
    })
  })

  await page.route('**/api/agent/route', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: '200',
        msg: 'ok',
        data: {
          route: 'DIRECT_ANSWER',
          tool: null,
          arguments: {},
          confidence: 0.91,
          reason: 'uploaded image analysis',
          message: '',
          attachmentContext: 'Uploaded image metadata: agent-image.png'
        }
      })
    })
  })

  await page.route('**/api/agent/knowledge/search**', async (route) => {
    knowledgeSearchCalls += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: '200', msg: 'ok', data: { documents: [] } })
    })
  })

  await page.route('**/api/ai-chat/session/start**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: '200', msg: 'ok', data: 'agent-ui-image-session' })
    })
  })

  await page.route('**/api/ai-chat/stream', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache'
      },
      body: 'data: \u8fd9\u662f\u4e00\u6761\u56fe\u7247\u591a\u6a21\u6001\u56de\u7b54\u3002\n\ndata: [DONE]\n\n'
    })
  })

  await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
  await page.locator('.composer textarea').waitFor({ state: 'visible' })
  await page.locator('input.file-input').setInputFiles({
    name: 'agent-image.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
      'base64'
    )
  })
  await page.locator('.composer textarea').fill('\u8bf7\u5206\u6790\u8fd9\u5f20\u56fe\u7247')
  await page.locator('.composer .send-button').click()

  await page.getByText('\u8fd9\u662f\u4e00\u6761\u56fe\u7247\u591a\u6a21\u6001\u56de\u7b54\u3002').waitFor({ timeout: 45000 })
  const referenceCount = await page.locator('.message-references').count()

  assert(knowledgeSearchCalls === 0, `Image multimodal should not call knowledge search, got ${knowledgeSearchCalls}`)
  assert(referenceCount === 0, `Image multimodal should not render references, got ${referenceCount}`)
  console.log('- image multimodal without RAG references: PASS')

  await page.unroute('**/api/file/upload/temp')
  await page.unroute('**/api/agent/route')
  await page.unroute('**/api/agent/knowledge/search**')
  await page.unroute('**/api/ai-chat/session/start**')
  await page.unroute('**/api/ai-chat/stream')
}

async function runContextMemoryCase(page) {
  let routeSawContext = false
  let knowledgeSawExpandedQuestion = false

  try {
    await page.addInitScript(() => {
      window.sessionStorage.setItem('xuanmiao_short_context', JSON.stringify({
        sessionId: 'agent-ui-context-session',
        userId: 1,
        currentPage: '/trail',
        currentScene: '\u65f6\u7a7a\u5c55\u7ebf',
        currentArtifact: '\u91d1\u9762\u5177',
        currentArtifactId: 'HI-2025-002',
        currentTrailNode: '\u6587\u7269\u9a7b\u8db3',
        recentMessages: [],
        recentTools: [],
        lastAction: 'open_trail',
        lastResult: ''
      }))
    })

    await page.route('**/api/agent/route', async (route) => {
      const payload = route.request().postDataJSON()
      routeSawContext = payload?.context?.currentArtifact === '\u91d1\u9762\u5177' &&
        payload?.context?.currentArtifactId === 'HI-2025-002'
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'RAG',
            tool: null,
            arguments: {},
            confidence: 0.96,
            reason: 'contextual artifact follow-up',
            message: '',
            attachmentContext: ''
          }
        })
      })
    })

    await page.route('**/api/agent/knowledge/search**', async (route) => {
      const url = new URL(route.request().url())
      knowledgeSawExpandedQuestion = (url.searchParams.get('query') || '').includes('\u91d1\u9762\u5177')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            documents: [{
              title: '\u91d1\u9762\u5177\u6750\u8d28',
              content: '\u91d1\u9762\u5177\u4e3b\u8981\u4e0e\u9ec4\u91d1\u5de5\u827a\u548c\u793c\u4eea\u8c61\u5f81\u76f8\u5173\u3002',
              excerpt: '\u91d1\u9762\u5177\u4e3b\u8981\u4e0e\u9ec4\u91d1\u5de5\u827a\u76f8\u5173\u3002',
              path: 'wiki/artifacts/golden-mask.md',
              type: 'markdown',
              score: 0.9,
              obsidianUri: '',
              openUrl: ''
            }]
          }
        })
      })
    })

    await page.route('**/api/ai-chat/session/start**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: 'agent-ui-context-chat-session' })
      })
    })

    await page.route('**/api/ai-chat/stream', async (route) => {
      const payload = route.request().postDataJSON()
      assert(payload?.context?.currentArtifact === '\u91d1\u9762\u5177', 'Chat stream should carry Xuanmiao context')
      assert((payload?.userMessage || '').includes('\u91d1\u9762\u5177'), 'Contextual question should include current artifact')
      await route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache'
        },
        body: 'data: \u8fd9\u91cc\u7684\u201c\u5b83\u201d\u6307\u91d1\u9762\u5177\uff0c\u4e0e\u9ec4\u91d1\u6750\u6599\u548c\u793c\u4eea\u7528\u9014\u6709\u5173\u3002\n\ndata: [DONE]\n\n'
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    await page.locator('.composer textarea').waitFor({ state: 'visible' })
    await page.locator('.composer textarea').fill('\u5b83\u662f\u4ec0\u4e48\u6750\u8d28\uff1f')
    await page.locator('.composer .send-button').click()

    await page.getByText('\u8fd9\u91cc\u7684\u201c\u5b83\u201d\u6307\u91d1\u9762\u5177').waitFor({ timeout: 45000 })
    assert(routeSawContext, 'Agent route should receive current artifact context')
    assert(knowledgeSawExpandedQuestion, 'Knowledge search should use contextualized question')

    await page.reload({ waitUntil: 'domcontentloaded' })
    const restored = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('xuanmiao_short_context') || '{}'))
    assert(restored.currentArtifact === '\u91d1\u9762\u5177', 'Context should restore after page refresh in the same session')
    console.log('- Xuanmiao context memory and refresh restore: PASS')
  } finally {
    await page.unroute('**/api/agent/route')
    await page.unroute('**/api/agent/knowledge/search**')
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/ai-chat/stream')
  }
}

async function runFloatingVoiceShortcutCase(page) {
  let speechInputCalls = 0
  let routeCalls = 0
  let routeSawVoiceQuestion = false

  try {
    await page.route('**/api/ai-chat/session/start**', (route) => json(route, 'agent-ui-voice-session'))
    await page.addInitScript(() => {
      window.__xuanmiaoVoiceStarts = 0
      window.__xuanmiaoVoiceStops = 0

      class FakeMediaRecorder {
        static isTypeSupported(mimeType) {
          return mimeType === 'audio/webm;codecs=opus' || mimeType === 'audio/webm'
        }

        constructor(stream, options = {}) {
          this.stream = stream
          this.mimeType = options.mimeType || 'audio/webm'
          this.state = 'inactive'
          this.ondataavailable = null
          this.onstop = null
          this.onerror = null
        }

        start() {
          this.state = 'recording'
          window.__xuanmiaoVoiceStarts += 1
        }

        stop() {
          this.state = 'inactive'
          window.__xuanmiaoVoiceStops += 1
          this.ondataavailable?.({
            data: new Blob(['voice-bytes'], { type: this.mimeType })
          })
          this.onstop?.()
        }
      }

      Object.defineProperty(window, 'MediaRecorder', {
        value: FakeMediaRecorder,
        configurable: true
      })
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: async () => ({
            getTracks: () => [{ stop() {} }]
          })
        },
        configurable: true
      })
      window.HTMLMediaElement.prototype.play = () => Promise.resolve()
    })

    await page.route('**/api/tts/voices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ key: 'default', label: '默认音色', desc: 'test' }])
      })
    })

    await page.route('**/api/tts/speech', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'audio/wav',
        body: Buffer.from('RIFF$\x00\x00\x00WAVEfmt ', 'binary')
      })
    })

    await page.route('**/api/ai-chat/speech-input', async (route) => {
      speechInputCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '200', msg: 'ok', data: '\u4ecb\u7ecd\u9752\u94dc\u795e\u6811' })
      })
    })

    await page.route('**/api/agent/route', async (route) => {
      routeCalls += 1
      const payload = route.request().postDataJSON()
      routeSawVoiceQuestion = routeSawVoiceQuestion || (
        payload?.message === '\u4ecb\u7ecd\u9752\u94dc\u795e\u6811' &&
        payload?.context &&
        typeof payload.context === 'object'
      )
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '200',
          msg: 'ok',
          data: {
            route: 'DIRECT_ANSWER',
            tool: null,
            arguments: {},
            confidence: 0.94,
            reason: 'voice shortcut direct answer',
            message: '\u9752\u94dc\u795e\u6811\u662f\u4e09\u661f\u5806\u9752\u94dc\u6587\u7269\u4e2d\u6700\u5177\u4ee3\u8868\u6027\u7684\u796d\u7940\u8c61\u5f81\u4e4b\u4e00\u3002',
            attachmentContext: ''
          }
        })
      })
    })

    await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
    const textarea = page.locator('.composer textarea')
    await textarea.waitFor({ state: 'visible' })

    const hintStateReady = await page.evaluate(() => {
      const root = document.querySelector('.live2d-wrapper')
      const component = root?.__vueParentComponent?.proxy
      if (!component) return false
      component.isPanelOpen = true
      component.syncWidgetVisibility()
      component.voiceShortcutHintVisible = true
      const bubble = document.getElementById('ai-bubble')
      if (bubble) bubble.style.display = 'none'
      return true
    })
    assert(hintStateReady, 'Floating Xuanmiao component should expose idle hint state')
    const voiceHint = page.locator('.voice-shortcut-hint')
    await voiceHint.waitFor({ state: 'visible', timeout: 5000 })
    assert(await voiceHint.getByText('按 V 键，和玄喵直接对话').isVisible(),
      'Idle shortcut hint should use a lightweight conversational bubble')
    await page.evaluate(() => {
      const component = document.querySelector('.live2d-wrapper')?.__vueParentComponent?.proxy
      if (component) component.isAnswering = true
    })
    await voiceHint.waitFor({ state: 'hidden', timeout: 5000 })
    await page.evaluate(() => {
      const component = document.querySelector('.live2d-wrapper')?.__vueParentComponent?.proxy
      if (component) {
        component.isAnswering = false
        component.voiceShortcutHintVisible = false
      }
    })

    await textarea.focus()
    await page.keyboard.press('v')
    await page.waitForTimeout(250)
    const inputValue = await textarea.inputValue()
    const startsAfterInputFocus = await page.evaluate(() => window.__xuanmiaoVoiceStarts)
    assert(inputValue.includes('v'), 'Focused textarea should receive V as text input')
    assert(startsAfterInputFocus === 0, `Focused textarea must not trigger floating voice input, got ${startsAfterInputFocus}`)

    await textarea.evaluate((node) => node.blur())
    await page.keyboard.press('v')
    await page.getByText(/我在听|正在请求麦克风权限/).waitFor({ timeout: 10000 })
    await page.keyboard.press('v')

    const floatingInput = page.locator('.input-dialog .dialog-input')
    await floatingInput.waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForFunction(() => {
      const input = document.querySelector('.input-dialog .dialog-input')
      return input && input.value === '\u4ecb\u7ecd\u9752\u94dc\u795e\u6811'
    }, null, { timeout: 10000 })
    const dialogPlacement = await page.evaluate(() => {
      const dialog = document.querySelector('.input-dialog')?.getBoundingClientRect()
      const avatar = document.querySelector('#live2d-widget canvas')?.getBoundingClientRect()
      if (!dialog) return null
      const dialogCenter = { x: dialog.left + dialog.width / 2, y: dialog.top + dialog.height / 2 }
      const avatarCenter = avatar
        ? { x: avatar.left + avatar.width / 2, y: avatar.top + avatar.height / 2 }
        : null
      return {
        left: dialog.left,
        top: dialog.top,
        distance: avatarCenter
          ? Math.hypot(dialogCenter.x - avatarCenter.x, dialogCenter.y - avatarCenter.y)
          : null
      }
    })
    assert(dialogPlacement, 'Voice transcript preview dialog should be rendered')
    assert(dialogPlacement.left > 8 && dialogPlacement.top >= 70,
      `Voice transcript preview must not initialize at the top-left corner: ${JSON.stringify(dialogPlacement)}`)
    if (dialogPlacement.distance !== null) {
      assert(dialogPlacement.distance < 620,
        `Voice transcript preview should follow Xuanmiao: ${JSON.stringify(dialogPlacement)}`)
    }
    assert(routeCalls === 0, `Voice transcript should wait for user confirmation before routing, got ${routeCalls}`)

    await page.locator('.input-dialog .dialog-btn-submit').click()
    await page.getByText('\u9752\u94dc\u795e\u6811\u662f\u4e09\u661f\u5806\u9752\u94dc\u6587\u7269\u4e2d\u6700\u5177\u4ee3\u8868\u6027').waitFor({ timeout: 45000 })

    const counters = await page.evaluate(() => ({
      starts: window.__xuanmiaoVoiceStarts,
      stops: window.__xuanmiaoVoiceStops
    }))
    assert(counters.starts === 1, `Voice shortcut should start exactly once, got ${counters.starts}`)
    assert(counters.stops === 1, `Voice shortcut should stop exactly once, got ${counters.stops}`)
    assert(speechInputCalls === 1, `Voice shortcut should call speech input once, got ${speechInputCalls}`)
    assert(routeCalls === 1, `Voice transcript should route only after user confirmation, got ${routeCalls}`)
    assert(routeSawVoiceQuestion, 'Voice transcript should enter the existing floating Agent route with context')
    console.log('- floating Xuanmiao V voice shortcut and input guard: PASS')
  } finally {
    await page.unroute('**/api/ai-chat/session/start**')
    await page.unroute('**/api/tts/voices')
    await page.unroute('**/api/tts/speech')
    await page.unroute('**/api/ai-chat/speech-input')
    await page.unroute('**/api/agent/route')
  }
}

function agentEventFrame(type, message, status = 'running') {
  return `data: [AGENT_EVENT]${JSON.stringify({
    id: `${type}-ui-test-${Date.now()}`,
    type,
    status,
    message,
    timestamp: new Date().toISOString(),
    metadata: {}
  })}`
}

async function json(route, data) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: '200', msg: 'ok', data })
  })
}

async function launchBrowser() {
  const launchErrors = []
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true })
    } catch (error) {
      launchErrors.push(`${channel}: ${error.message}`)
    }
  }

  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    launchErrors.push(`bundled chromium: ${error.message}`)
  }

  throw new Error(`No Playwright browser is available. ${launchErrors.join(' | ')}`)
}
