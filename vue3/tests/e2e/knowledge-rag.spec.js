const { test, expect } = require('@playwright/test')

test('obsidian vault is indexed and searchable', async ({ request }) => {
  const apiBase = 'http://127.0.0.1:8889/api/agent/knowledge'
  const statusResponse = await request.get(`${apiBase}/status`)
  expect(statusResponse.ok()).toBeTruthy()
  const status = (await statusResponse.json()).data
  expect(status.available).toBeTruthy()
  expect(status.indexedDocuments).toBeGreaterThanOrEqual(38)

  const cases = [
    { query: '青铜神树采用什么铸造工艺', expected: ['青铜神树', '分铸法'] },
    { query: '三星堆与金沙遗址有什么关系', expected: ['三星堆遗址', '金沙遗址'] },
    { query: '古蜀祭祀系统和青铜面具有什么联系', expected: ['古蜀祭祀系统', '青铜纵目面具'] }
  ]

  for (const item of cases) {
    const searchResponse = await request.get(`${apiBase}/search`, {
      params: { query: item.query, limit: 3 }
    })
    expect(searchResponse.ok()).toBeTruthy()
    const search = (await searchResponse.json()).data
    const titles = search.documents.map((document) => document.title)
    expect(titles).toEqual(expect.arrayContaining(item.expected))
    expect(search.context).toContain('[来源1]')
  }

  const anonymousSync = await request.post(`${apiBase}/sync`)
  expect(anonymousSync.status()).toBe(403)
})

test('web chat uses backend RAG and displays vault sources', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', JSON.stringify('e2e-token'))
    localStorage.setItem('userInfo', JSON.stringify({ id: 1, username: 'e2e', userType: 'USER' }))
  })
  await page.route('**/api/agent/knowledge/status', (route) => route.fulfill({
    contentType: 'application/json',
    json: {
      code: '200',
      data: { available: true, indexedDocuments: 38, lastSyncAt: '2026-07-08T10:00:00Z' }
    }
  }))
  await page.route('**/api/agent/route', (route) => route.fulfill({
    contentType: 'application/json',
    json: { code: '200', data: { route: 'RAG', confidence: 0.98, reason: '知识库问题' } }
  }))
  await page.route('**/api/agent/knowledge/search**', (route) => route.fulfill({
    contentType: 'application/json',
    json: {
      code: '200',
      data: {
        query: '青铜神树采用什么铸造工艺',
        indexedDocuments: 38,
        documents: [{
          title: '青铜神树',
          path: 'entities/artifacts/青铜神树.md',
          type: 'entity',
          status: 'mature',
          tags: ['三星堆', '铸造'],
          related: ['分铸法'],
          sources: ['青铜神树研究'],
          excerpt: '青铜神树采用分段铸造，再将部件连接成整体。',
          content: '# 青铜神树\n青铜神树采用分段铸造，再将部件连接成整体。',
          score: 21.5
        }]
      }
    }
  }))
  await page.route('**/api/ai-chat/session/start**', (route) => route.fulfill({
    contentType: 'application/json',
    json: { code: '200', data: 'e2e-knowledge-session' }
  }))
  await page.route('**/api/ai-chat/stream', (route) => route.fulfill({
    status: 200,
    contentType: 'text/event-stream',
    body: 'data: 青铜神树采用分段铸造工艺。\n\ndata: [DONE]\n\n'
  }))

  await page.goto('/ai-chat')
  await expect(page.locator('.hero-status')).toContainText('第二大脑 · 38 条')
  const input = page.locator('.composer textarea')
  await input.fill('青铜神树采用什么铸造工艺')
  await input.press('Enter')

  await expect(page.locator('.message-source-chip')).toContainText('青铜神树')
  await expect(page.locator('.message-bubble').last()).toContainText('分段铸造工艺')
})
