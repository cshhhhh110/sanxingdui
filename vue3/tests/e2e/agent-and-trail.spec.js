const { test, expect } = require('@playwright/test')

test('anonymous visitor can progress through all four trail scenes', async ({ page }) => {
  // The model asset is large and irrelevant to the scene-navigation regression.
  await page.route(/\.(glb|gltf)(\?.*)?$/i, (route) => route.abort())
  await page.goto('/trail')

  const goldMask = page.getByRole('button', { name: /金面具，进入五号祭祀坑展线/ })
  await expect(goldMask).toBeVisible()
  await goldMask.click()

  await expect(page).toHaveURL(/\/trail/)
  await expect(page).not.toHaveURL(/\/auth\/login/)
  await expect(page.locator('.trail-progress-card__head strong')).toHaveText('2/4')

  const stageStep = page.locator('.trail-progress-step').filter({ hasText: '展品现场' })
  await expect(stageStep).toBeEnabled()
  await stageStep.click()
  await expect(page.locator('.trail-progress-card__head strong')).toHaveText('3/4')

  const guideStep = page.locator('.trail-progress-step').filter({ hasText: '玄喵讲解' })
  await expect(guideStep).toBeEnabled()
  await guideStep.click()
  await expect(page.locator('.trail-progress-card__head strong')).toHaveText('4/4')
  await expect(page).not.toHaveURL(/\/auth\/login/)
})

test('agent routes live queries and returns a direct answer in one call', async ({ request }) => {
  const apiBase = 'http://127.0.0.1:8889/api'
  const dateResponse = await request.get(`${apiBase}/agent/tools/datetime`)
  expect(dateResponse.ok()).toBeTruthy()
  const dateBody = await dateResponse.json()
  expect(dateBody.data.timezone).toBe('Asia/Shanghai')
  expect(dateBody.data.message).toContain('北京时间')

  const weatherRoute = await request.post(`${apiBase}/agent/route`, {
    data: { message: '查成都天气', attachments: [], context: { surface: 'e2e' } }
  })
  expect(weatherRoute.ok()).toBeTruthy()
  const weatherDecision = (await weatherRoute.json()).data
  expect(weatherDecision.route).toBe('TOOL_CALL')
  expect(weatherDecision.tool).toBe('get_weather')
  expect(weatherDecision.arguments.city).toContain('成都')

  const directRoute = await request.post(`${apiBase}/agent/route`, {
    data: { message: '用一句话解释什么是光合作用', attachments: [], context: { surface: 'e2e' } }
  })
  expect(directRoute.ok()).toBeTruthy()
  const directDecision = (await directRoute.json()).data
  expect(directDecision.route).toBe('DIRECT_ANSWER')
  expect(directDecision.message.length).toBeGreaterThan(10)

  const shopRoute = await request.post(`${apiBase}/agent/route`, {
    data: { message: '打开商城，搜索青铜面具文创产品', attachments: [], context: { surface: 'e2e' } }
  })
  expect(shopRoute.ok()).toBeTruthy()
  const shopDecision = (await shopRoute.json()).data
  expect(shopDecision.route).toBe('TOOL_CALL')
  expect(shopDecision.tool).toBe('search_product')
  expect(shopDecision.arguments.keyword).toContain('青铜面具')
})

test('explicit actions bypass informational fixed replies', async ({ page }) => {
  await page.route('**/api/agent/route', (route) => route.fulfill({
    contentType: 'application/json',
    json: {
      code: '200',
      data: {
        route: 'TOOL_CALL',
        tool: 'search_product',
        arguments: { keyword: '青铜面具文创产品', quantity: 1 },
        confidence: 0.99,
        reason: '商城商品搜索'
      }
    }
  }))
  await page.goto('/')
  const matches = await page.evaluate(async () => {
    const { matchFixedAnswer } = await import('/src/config/chatReplyConfig.js')
    return {
      action: matchFixedAnswer('打开商城，搜索青铜面具文创产品'),
      information: matchFixedAnswer('文创商城'),
      greeting: matchFixedAnswer('你好')
    }
  })

  expect(matches.action).toBeNull()
  expect(matches.information).toBeNull()
  expect(matches.greeting?.id).toBe('hello')

  const execution = await page.evaluate(async () => {
    const [{ agentOrchestrator }, { default: router }] = await Promise.all([
      import('/src/agent/index.js'),
      import('/src/router/index.js')
    ])
    return agentOrchestrator.handle('打开商城，搜索青铜面具文创产品', {
      routingContext: { surface: 'e2e' },
      toolContext: { router }
    })
  })

  expect(execution.handled).toBeTruthy()
  expect(execution.tool).toBe('search_product')
  await expect(page).toHaveURL(/\/shop\?/)
  expect(new URL(page.url()).searchParams.get('keyword')).toBe('青铜面具文创产品')
})
