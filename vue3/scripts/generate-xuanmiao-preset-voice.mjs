import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const configPath = path.join(rootDir, 'src', 'config', 'chatReplyConfig.js')
const outputDir = path.join(rootDir, 'public', 'audio', 'xuanmiao-preset')
const manifestPath = path.join(outputDir, 'preset-voice.manifest.json')
const endpoint = process.env.TTS_ENDPOINT || 'http://localhost:8889/api/tts/speech'
const voice = process.env.TTS_VOICE || 'default'
const delayMs = Number(process.env.TTS_DELAY_MS || 1600)
const maxRetries = Number(process.env.TTS_RETRIES || 2)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function hashText(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16)
}

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  } catch {
    return { version: 1, generatedAt: '', endpoint, voice, items: [] }
  }
}

function extractPresets(source) {
  const presets = []
  const blockRe = /\{\s*id:\s*'([^']+)'[\s\S]*?reply:\s*'([^']+)'[\s\S]*?\n\s*\}/g
  let match
  while ((match = blockRe.exec(source))) {
    presets.push({
      id: match[1],
      reply: match[2]
    })
  }
  if (!presets.length) {
    throw new Error('No fixed reply presets found in chatReplyConfig.js')
  }
  return presets
}

async function synthesize(text) {
  let lastError = null
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ text, voice, speed: 1.0 })
      })
      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`HTTP ${response.status}: ${detail.slice(0, 240)}`)
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length < 1024) {
        throw new Error(`Audio too small: ${buffer.length} bytes`)
      }
      return buffer
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        await sleep(1200 * (attempt + 1))
      }
    }
  }
  throw lastError
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })
  const source = await fs.readFile(configPath, 'utf8')
  const presets = extractPresets(source)
  const previous = await readManifest()
  const previousById = new Map((previous.items || []).map((item) => [item.id, item]))
  const items = []

  for (const preset of presets) {
    const filename = `preset.${preset.id}.${voice}.wav`
    const outputPath = path.join(outputDir, filename)
    const textHash = hashText(preset.reply)
    const oldItem = previousById.get(preset.id)
    let shouldGenerate = true

    try {
      const stat = await fs.stat(outputPath)
      shouldGenerate = !(oldItem && oldItem.textHash === textHash && oldItem.bytes === stat.size)
    } catch {
      shouldGenerate = true
    }

    if (shouldGenerate) {
      console.log(`[generate] ${preset.id}`)
      const audio = await synthesize(preset.reply)
      await fs.writeFile(outputPath, audio)
      items.push({
        id: preset.id,
        voice,
        text: preset.reply,
        textHash,
        file: `/audio/xuanmiao-preset/${filename}`,
        bytes: audio.length
      })
      await sleep(delayMs)
    } else {
      console.log(`[skip] ${preset.id}`)
      items.push({
        ...oldItem,
        text: preset.reply,
        file: `/audio/xuanmiao-preset/${filename}`
      })
    }
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    endpoint,
    voice,
    total: items.length,
    items
  }
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`Done. Generated manifest: ${manifestPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
