import { chromium, firefox } from '@playwright/test'

const targets = [
  { name: 'Edge', type: 'chromium', channel: 'msedge' },
  { name: 'Chrome', type: 'chromium', channel: 'chrome' },
  { name: 'Bundled Chromium', type: 'chromium' },
  { name: 'Firefox', type: 'firefox' }
]

let verified = 0

for (const target of targets) {
  const result = await inspectTarget(target)
  if (result.available) {
    verified += 1
    console.log(`- ${target.name}: available, MediaRecorder=${result.mediaRecorder}, opus=${result.opus}, webm=${result.webm}`)
  } else {
    console.log(`- ${target.name}: unavailable (${result.error})`)
  }
}

if (!verified) {
  throw new Error('No browser was available for MediaRecorder matrix verification.')
}

console.log('Browser MediaRecorder matrix: PASS')

async function inspectTarget(target) {
  let browser
  try {
    const launcher = target.type === 'firefox' ? firefox : chromium
    browser = await launcher.launch({
      headless: true,
      ...(target.channel ? { channel: target.channel } : {})
    })
    const page = await browser.newPage()
    await page.goto('about:blank')
    const support = await page.evaluate(() => ({
      mediaRecorder: typeof window.MediaRecorder !== 'undefined',
      opus: typeof window.MediaRecorder !== 'undefined' &&
        window.MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
      webm: typeof window.MediaRecorder !== 'undefined' &&
        window.MediaRecorder.isTypeSupported('audio/webm')
    }))
    return { available: true, ...support }
  } catch (error) {
    return { available: false, error: error.message.split('\n')[0] }
  } finally {
    await browser?.close?.()
  }
}
