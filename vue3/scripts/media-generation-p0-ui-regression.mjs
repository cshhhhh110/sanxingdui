import { chromium } from '@playwright/test'

const frontendBase = process.env.FRONTEND_BASE || 'http://127.0.0.1:8800'
const imageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
page.setDefaultTimeout(30000)
await page.addInitScript(() => {
  window.localStorage.setItem('token', JSON.stringify('media-generation-regression-token'))
  window.localStorage.setItem('userInfo', JSON.stringify({ id: 7, username: 'media-regression', userType: 'USER' }))
})

try {
  await runGenerationCardCase(page)
  await runFailedRetryCase(page)
  await runRefreshRestoreCase(page)
  console.log('Media generation P0 UI regression: PASS')
} finally {
  await browser.close()
}

async function runGenerationCardCase(page) {
  let createCalls = 0
  let createdPayload = null
  let pollCount = 0
  let latestTask = null

  await page.route('**/api/media-generation/history**', async (route) => {
    const records = latestTask ? [latestTask] : []
    await json(route, { total: records.length, pageNum: 1, pageSize: 30, records })
  })
  await page.route('**/api/ai-chat/session/start**', (route) => json(route, 'session-p0'))
  await page.route('**/api/media-generation/image', async (route) => {
    createCalls += 1
    createdPayload = route.request().postDataJSON()
    latestTask = task({ status: 'PENDING', stage: 'QUEUED', stageMessage: '任务已进入队列' })
    await json(route, latestTask)
  })
  await page.route('**/api/media-generation/tasks/task-p0', async (route) => {
    pollCount += 1
    latestTask = pollCount < 2
      ? task({ status: 'PROCESSING', stage: 'GENERATING', stageMessage: '正在生成画面', elapsedSeconds: 0 })
      : task({ status: 'SUCCEEDED', stage: 'SUCCEEDED', stageMessage: '作品已生成', elapsedSeconds: 7, resultUrl: imageDataUrl })
    await json(route, latestTask)
  })

  await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
  await page.locator('.composer textarea').waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '品质' }).click()
  await page.locator('.composer textarea').fill('生成一张三星堆青铜神树祭祀场景复原图片')
  await page.locator('.composer .send-button').click({ force: true })
  await page.locator('.composer').evaluate((form) => {
    for (let index = 0; index < 4; index += 1) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    }
  })

  await page.getByText('已等待 1 秒', { exact: true }).waitFor({ state: 'visible' })
  assert(await page.getByText('生成阶段不显示虚假百分比').count() === 0, 'technical progress disclaimer must not be shown to users')
  const workImage = page.locator('.generation-work__canvas img')
  await workImage.waitFor({ state: 'visible' })
  assert(createCalls === 1, `five rapid submits must create one request, got ${createCalls}`)
  assert(createdPayload.modelProfile === 'QUALITY', 'quality mode was not sent to backend')
  assert(Boolean(createdPayload.clientRequestId), 'clientRequestId is missing')
  assert(createdPayload.experienceContext?.surface === 'AI_CHAT', 'experienceContext.surface is missing')
  assert(createdPayload.experienceContext?.purpose === 'CULTURAL_RECONSTRUCTION', 'reconstruction purpose was not detected')
  assert(await workImage.evaluate((element) => getComputedStyle(element).objectFit) === 'contain', 'generated image must use object-fit: contain')
  assert(await page.getByText('AI推测复原图').count() > 0, 'AI reconstruction trust label is missing')
  assert(await page.getByText('非考古原貌，仅作文化理解与展示参考。').count() > 0, 'reconstruction disclaimer is missing')
  assert(await page.locator('.message-row--assistant .attachment-card').count() === 0, 'generated result must not render as an attachment')
  assert(await page.locator('.generation-work__footer a[download]').count() === 1, 'download action is missing')

  await page.locator('.generation-work__canvas').click()
  await page.locator('.image-preview-overlay').waitFor({ state: 'visible' })
  await page.locator('.image-preview-close').click()
  await page.locator('.my-works-button').evaluate((button) => button.click())
  await page.getByRole('heading', { name: '我的作品' }).waitFor({ state: 'visible' })
  assert(await page.locator('.work-list-item').count() === 1, 'my works drawer did not show the generated work')
  if (process.env.P0_SCREENSHOT) {
    await page.waitForTimeout(350)
    await page.screenshot({ path: process.env.P0_SCREENSHOT, fullPage: true })
  }
  await page.locator('.works-drawer__header-actions button[title="关闭"]').click()

  await page.unroute('**/api/media-generation/history**')
  await page.unroute('**/api/ai-chat/session/start**')
  await page.unroute('**/api/media-generation/image')
  await page.unroute('**/api/media-generation/tasks/task-p0')
  console.log('- work card, quality profile, idempotent submit, preview, download and drawer: PASS')
}

async function runFailedRetryCase(page) {
  const failed = task({ taskId: 'failed-p0', status: 'FAILED', stage: 'FAILED', stageMessage: '生成失败', errorMessage: '供应商暂时不可用' })
  let retryCalls = 0
  await page.route('**/api/media-generation/history**', (route) => json(route, { total: 1, pageNum: 1, pageSize: 30, records: [failed] }))
  await page.route('**/api/media-generation/tasks/failed-p0/retry', async (route) => {
    retryCalls += 1
    await json(route, task({ taskId: 'retry-p0', status: 'PENDING', stage: 'QUEUED', stageMessage: '任务已进入队列' }))
  })
  await page.route('**/api/media-generation/tasks/retry-p0', (route) => json(route,
    task({ taskId: 'retry-p0', status: 'SUCCEEDED', stage: 'SUCCEEDED', stageMessage: '作品已生成', resultUrl: imageDataUrl })))

  await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
  await page.locator('.my-works-button').evaluate((button) => button.click())
  await page.locator('.work-list-item').click()
  await page.getByRole('button', { name: /重新尝试/ }).click()
  await page.locator('.generation-work__canvas img').waitFor({ state: 'visible' })
  assert(retryCalls === 1, `failed work retry should call backend once, got ${retryCalls}`)

  await page.unroute('**/api/media-generation/history**')
  await page.unroute('**/api/media-generation/tasks/failed-p0/retry')
  await page.unroute('**/api/media-generation/tasks/retry-p0')
  console.log('- failed work retry: PASS')
}

async function runRefreshRestoreCase(page) {
  const running = task({ taskId: 'restore-p0', status: 'PROCESSING', stage: 'GENERATING', stageMessage: '正在生成画面', elapsedSeconds: 9 })
  await page.route('**/api/media-generation/history**', (route) => json(route, { total: 1, pageNum: 1, pageSize: 30, records: [running] }))
  await page.route('**/api/media-generation/tasks/restore-p0', (route) => json(route,
    task({ taskId: 'restore-p0', status: 'SUCCEEDED', stage: 'SUCCEEDED', stageMessage: '作品已生成', elapsedSeconds: 12, resultUrl: imageDataUrl })))

  await page.goto(`${frontendBase}/ai-chat`, { waitUntil: 'domcontentloaded' })
  await page.getByText('已恢复上次未完成的图片创作').waitFor({ state: 'visible' })
  await page.locator('.generation-work__canvas img').waitFor({ state: 'visible' })

  await page.unroute('**/api/media-generation/history**')
  await page.unroute('**/api/media-generation/tasks/restore-p0')
  console.log('- running task restoration after refresh: PASS')
}

function task(overrides = {}) {
  return {
    taskId: 'task-p0', mediaType: 'IMAGE', mode: 'TEXT_TO_IMAGE', status: 'PENDING',
    stage: 'QUEUED', stageMessage: '任务已进入队列', progress: null, elapsedSeconds: 0,
    modelProfile: 'QUALITY', contentLabel: 'AI_RECONSTRUCTION', promptRaw: '三星堆青铜神树祭祀场景复原图',
    resultUrl: null, createTime: '2026-07-14T10:00:00', ...overrides
  }
}

async function json(route, data) {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '200', msg: 'ok', data }) })
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
