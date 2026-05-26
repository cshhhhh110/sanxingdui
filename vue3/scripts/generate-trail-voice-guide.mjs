import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const seedPath = path.join(projectRoot, 'public/data/competition-artifacts.seed.json')
const audioDir = path.join(projectRoot, 'public/audio/trail-guide')
const manifestPath = path.join(projectRoot, 'public/data/trail-voice-guide.manifest.json')

const TTS_ENDPOINT = process.env.TRAIL_TTS_ENDPOINT || 'http://localhost:8889/api/tts/speech'
const VOICES = (process.env.TRAIL_TTS_VOICES || process.env.TRAIL_TTS_VOICE || 'default,zh_female,sweet')
  .split(',')
  .map((voice) => voice.trim())
  .filter(Boolean)
const SPEED = Number(process.env.TRAIL_TTS_SPEED || 1.0)
const TTS_DELAY_MS = Number(process.env.TRAIL_TTS_DELAY_MS || 15000)
const BATCH_LIMIT = Number(process.env.TRAIL_TTS_BATCH_LIMIT || 9999)
const MODE = String(process.env.TRAIL_TTS_MODE || 'SupplementMissing')
const DRY_RUN = ['1', 'true', 'yes'].includes(String(process.env.TRAIL_TTS_DRY_RUN || '').toLowerCase())
const MAX_RETRIES = Number(process.env.TRAIL_TTS_MAX_RETRIES || 3)
const RETRY_DELAYS_MS = (process.env.TRAIL_TTS_RETRY_DELAYS_MS || '30000,60000,120000')
  .split(',')
  .map((item) => Number(item.trim()))
  .filter((item) => Number.isFinite(item) && item >= 0)

const TYPE_LABELS = {
  artifact: '相关文物',
  site: '遗址',
  era: '时代',
  craft: '工艺',
  material: '材质',
  meaning: '象征',
  motif: '母题',
  ritual: '仪式'
}

const TYPE_TEXTS = {
  artifact: [
    '你点到的是相关文物节点。先比较它和当前展品的造型、工艺与出土语境，再判断它们是不是同一类仪式表达。',
    '相关文物不是旁支。它能帮助你看到同一时期器物之间的组合关系，也能提示下一步该看哪件展品。'
  ],
  site: [
    '你点到的是遗址线索。遗址把文物放回空间坐标里，能解释它为什么和祭祀坑、埋藏或区域文化有关。',
    '先看遗址，再看器物，会更容易理解文物不是孤立展品，而是一次考古发现中的关系节点。'
  ],
  era: [
    '你点到的是时代线索。年代不是背景说明，它会影响器物形态、工艺选择和礼制表达的变化。',
    '顺着时代继续看，可以把三星堆和后续金沙之间的延续、转化与差异慢慢分辨出来。'
  ],
  craft: [
    '你点到的是工艺线索。它解释的不只是怎么做，而是技术能力如何支撑大型礼器和复杂造型。',
    '顺着工艺看，能看到古蜀匠人如何处理铸造、嵌接、锤揲或纹饰，让材料进入仪式秩序。'
  ],
  material: [
    '你点到的是材质线索。青铜、黄金和玉石不只是材料差异，也常常连接身份、权力和祭祀等级。',
    '材质会改变文物的观看方式。金器偏向身份与神性表达，青铜器则常承担更复杂的礼仪结构。'
  ],
  meaning: [
    '你点到的是象征线索。这里要看的不是单个图案，而是它如何连接神权、王权、祖先崇拜或宇宙观。',
    '象征意义能把器物从造型带入思想层面。继续看它，玄喵会把可见形象和不可见观念接起来。'
  ],
  motif: [
    '你点到的是母题线索。纹样和造型不是装饰而已，它们往往承载古蜀人对神灵、祖先和自然的想象。',
    '母题适合横向比较。你可以观察相似纹样如何出现在不同器物上，并形成重复出现的视觉秩序。'
  ],
  ritual: [
    '你点到的是仪式线索。顺着它继续看，会更容易理解祭祀、通神和王权表达怎样共同构成礼仪现场。',
    '仪式语境能解释文物为什么重要。很多器物真正的功能，是在行动和场景中完成的。'
  ]
}

const DEFAULT_SCENE_TEXTS = {
  'scene-anchor.default': {
    intent: 'scene-anchor',
    priority: 80,
    tags: ['stage', 'filter'],
    texts: [
      '这里先确定古蜀坐标。你可以从祭祀坑、时代、遗址或工艺进入，系统会把命中的文物整理成一条可以继续向下走的展线。',
      '先别急着看单件展品。把空间、时代和工艺线索定下来，玄喵会帮你建立一个观察三星堆的坐标系。',
      '这一幕负责建立入口。筛选不是表单，而是在帮你决定先从时间、空间还是技术线索理解古蜀文明。'
    ]
  },
  'artifact-list.default': {
    intent: 'artifact-list',
    priority: 70,
    tags: ['stage', 'artifact-list'],
    texts: [
      '这一幕先选一件代表文物。看它的年代、出土地和工艺，再进入三维展品现场，观察会更有方向。',
      '文物驻足不是简单浏览卡片。你可以先比较摘要、类别和三维状态，再决定哪一件最值得深入。',
      '如果命中文物较多，优先选择有三维模型和清晰工艺线索的展品，这样后面的图谱关系会更容易展开。'
    ]
  },
  'stage-viewer.default': {
    intent: 'stage-viewer',
    priority: 70,
    tags: ['stage', '3d', 'graph'],
    texts: [
      '现在进入展品现场。左侧看三维造型，右侧看关系图谱，两边合起来才像一次完整观察。',
      '先用三维模型看轮廓、比例和细节，再用图谱看遗址、时代、工艺和象征意义之间的关系。',
      '这一幕适合慢一点看。拖拽模型确认器物形态，再点开图谱节点，理解它为什么不只是一个孤立展品。'
    ]
  },
  'guide-chat.default': {
    intent: 'guide-chat',
    priority: 70,
    tags: ['stage', 'chat'],
    texts: [
      '这里是玄喵讲解区。你可以继续追问，让玄喵把展线里的文物线索讲成一段完整故事。',
      '如果刚才看完模型和图谱，可以问玄喵这是什么、为什么重要、它和哪类文物有关。',
      '讲解区适合把观察变成理解。你不用背知识点，只要沿着工艺、象征或时代继续提问。'
    ]
  },
  'graph-type.default': {
    intent: 'graph-node',
    priority: 60,
    tags: ['graph'],
    texts: [
      '你点到了图谱里的一个新线索。先看它和当前文物的关系，再决定要不要继续展开。',
      '图谱节点不是标签堆叠。每一次点击，都是把文物放回更大的考古、工艺或观念网络里。'
    ]
  }
}

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[。！？；，、,.!?;:：]+$/u, '')
    .trim()
}

function sentence(value) {
  const text = cleanText(value)
  return text ? `${text}。` : ''
}

function joinList(items, fallback) {
  const values = (Array.isArray(items) ? items : [items]).map(cleanText).filter(Boolean)
  return values.length ? values.join('、') : fallback
}

function contentHash(text) {
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 10)
}

function sourceHash(text, voice) {
  return crypto.createHash('sha1').update(`${voice}|${SPEED}|${text}`).digest('hex').slice(0, 10)
}

function stableFileName(key, voice, hash) {
  return `${key.replace(/[^a-zA-Z0-9._-]/g, '_')}.${voice}.${hash}.wav`
}

function makeEntry({ presetKey, variant, intent, text, priority = 50, tags = [], entityId, type }) {
  const key = `${presetKey}.${variant}`
  const hash = contentHash(text)
  const sources = Object.fromEntries(
    VOICES.map((voice) => [
      voice,
      {
        wav: `/audio/trail-guide/${stableFileName(key, voice, sourceHash(text, voice))}`
      }
    ])
  )
  const defaultVoice = sources.default ? 'default' : VOICES[0]
  return {
    key,
    presetKey,
    variant,
    intent,
    priority,
    tags,
    entityId,
    type,
    text,
    contentHash: hash,
    voices: VOICES,
    audioUrl: sources[defaultVoice]?.wav || '',
    sources
  }
}

function artifactContext(artifact) {
  return {
    entityId: artifact.entityId,
    title: artifact.displayTitle || artifact.title || artifact.entityId,
    category: artifact.category || '文物',
    site: artifact.siteNameZh || artifact.siteLabel || artifact.siteCode || '三星堆遗址',
    era: artifact.eraNameZh || artifact.eraLabel || artifact.yearLabel || artifact.eraCode || '古蜀文明',
    craft: joinList(artifact.craftNamesZh, '关键工艺'),
    meanings: joinList(artifact.symbolicMeaningZh, '象征意义'),
    summary: cleanText(artifact.summary),
    description: cleanText(artifact.description)
  }
}

function addVariants(entries, presetKey, intent, variants, base = {}) {
  variants.forEach((text, index) => {
    entries.push(makeEntry({
      ...base,
      presetKey,
      intent,
      variant: `v${index + 1}`,
      text
    }))
  })
}

function buildOptimizedEntries(seed) {
  const artifacts = Array.isArray(seed.artifacts) ? seed.artifacts : []
  const entries = []

  for (const [presetKey, config] of Object.entries(DEFAULT_SCENE_TEXTS)) {
    addVariants(entries, presetKey, config.intent, config.texts, {
      priority: config.priority,
      tags: config.tags
    })
  }

  for (const [type, label] of Object.entries(TYPE_LABELS)) {
    addVariants(entries, `graph-type.${type}`, 'graph-node', TYPE_TEXTS[type] || [
      `你点到的是${label}线索。可以顺着它继续理解当前文物的关系网络。`
    ], {
      priority: 62,
      tags: ['graph', type],
      type
    })
  }

  for (const artifact of artifacts) {
    const ctx = artifactContext(artifact)
    addVariants(entries, `artifact-list.${ctx.entityId}`, 'artifact-list', [
      `建议先停在${ctx.title}前。${sentence(ctx.summary)}它属于${ctx.category}，出自${ctx.site}，可以作为理解${ctx.era}的重要切口。`,
      `${ctx.title}适合先看整体身份。它的类别是${ctx.category}，核心工艺包括${ctx.craft}，这些信息会影响后面的三维观察。`,
      `从${ctx.title}开始，可以把注意力放在造型、工艺和象征三件事上。${sentence(ctx.description)}`
    ], { entityId: ctx.entityId, priority: 90, tags: ['artifact', 'observe'] })

    addVariants(entries, `stage-viewer.${ctx.entityId}`, 'stage-viewer', [
      `现在看${ctx.title}。先拖拽模型确认轮廓、比例和关键部位，再看右侧图谱里的${ctx.site}、${ctx.era}和${ctx.craft}。`,
      `观察${ctx.title}时，先看它作为${ctx.category}的形态特征，再顺着图谱追踪工艺、遗址和象征意义。`,
      `${ctx.title}的三维展示适合配合图谱一起看。左侧看可见形态，右侧看它和${ctx.meanings}之间的关系。`
    ], { entityId: ctx.entityId, priority: 92, tags: ['artifact', '3d'] })

    addVariants(entries, `guide-chat.${ctx.entityId}`, 'guide-chat', [
      `这里可以继续问玄喵。围绕${ctx.title}，你可以问它为什么重要、用了什么工艺，或者和哪件文物有关。`,
      `如果想深入${ctx.title}，可以追问三个方向：它是什么，它为什么重要，它如何连接${ctx.meanings}。`,
      `接下来可以让玄喵把${ctx.title}讲成一段故事，从${ctx.site}、${ctx.era}、${ctx.craft}一路讲到象征意义。`
    ], { entityId: ctx.entityId, priority: 88, tags: ['artifact', 'chat'] })

    addVariants(entries, `artifact-craft.${ctx.entityId}`, 'artifact-craft', [
      `${ctx.title}的工艺重点可以从${ctx.craft}切入。技术不是附属信息，它决定了器物能否形成复杂造型和稳定结构。`,
      `看${ctx.title}的工艺时，不只看材料怎么加工，还要看工艺如何服务于礼仪、身份和视觉震撼。`
    ], { entityId: ctx.entityId, priority: 76, tags: ['artifact', 'craft'] })

    addVariants(entries, `artifact-symbol.${ctx.entityId}`, 'artifact-symbol', [
      `${ctx.title}的象征意义集中在${ctx.meanings}。这些词不是抽象概念，它们解释了古蜀人如何理解神灵、权力和宇宙秩序。`,
      `如果只看造型，${ctx.title}会像一件奇特器物；把${ctx.meanings}放进来，它才会回到古蜀信仰和仪式系统中。`
    ], { entityId: ctx.entityId, priority: 76, tags: ['artifact', 'meaning'] })

    addVariants(entries, `artifact-context.${ctx.entityId}`, 'artifact-context', [
      `${ctx.title}出自${ctx.site}，时代属于${ctx.era}。这个坐标能帮助你判断它和三星堆祭祀体系、权力表达之间的关系。`,
      `把${ctx.title}放回${ctx.era}看，它不只是单件展品，而是古蜀文明在技术、信仰和社会组织上的一次表达。`
    ], { entityId: ctx.entityId, priority: 74, tags: ['artifact', 'context'] })

    addVariants(entries, `artifact-next.${ctx.entityId}`, 'artifact-next', [
      `看完${ctx.title}后，可以继续点图谱节点，找同遗址、同工艺或同象征意义的文物，看看线索如何延伸。`,
      `下一步建议从${ctx.craft}或${ctx.meanings}里选一个方向继续走，这样展线会从单件文物扩展成关系网络。`
    ], { entityId: ctx.entityId, priority: 72, tags: ['artifact', 'next'] })
  }

  return [...new Map(entries.map((entry) => [entry.key, entry])).values()]
}

function isWavBuffer(buffer) {
  return buffer.length > 44 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE'
}

async function isValidAudioFile(filePath) {
  try {
    const buffer = await fs.readFile(filePath)
    return isWavBuffer(buffer)
  } catch {
    return false
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch {
    return null
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function synthesize(entry, voice) {
  const response = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: entry.text,
      voice,
      speed: SPEED
    })
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    const error = new Error(`TTS ${response.status}: ${message.slice(0, 200)}`)
    error.status = response.status
    throw error
  }

  const audio = Buffer.from(await response.arrayBuffer())
  if (!isWavBuffer(audio)) {
    const contentType = response.headers.get('content-type') || 'unknown'
    const preview = audio.subarray(0, 200).toString('utf8').replace(/\s+/g, ' ')
    throw new Error(`TTS returned non-WAV content (${contentType}): ${preview}`)
  }

  return audio
}

async function synthesizeWithRetry(entry, voice) {
  let lastError = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await synthesize(entry, voice)
    } catch (error) {
      lastError = error
      const delay = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)] || 0
      process.stdout.write(`FAILED attempt ${attempt}/${MAX_RETRIES}: ${error.message}\n`)
      if (attempt < MAX_RETRIES && delay > 0) {
        process.stdout.write(`Retry after ${Math.round(delay / 1000)}s...\n`)
        await sleep(delay)
      }
    }
  }
  throw lastError
}

async function writeAudioAtomically(outputPath, audio) {
  const partialPath = `${outputPath}.partial`
  await fs.writeFile(partialPath, audio)
  if (!(await isValidAudioFile(partialPath))) {
    await fs.rm(partialPath, { force: true })
    throw new Error('Generated partial file is not a valid WAV')
  }
  await fs.rename(partialPath, outputPath)
}

function outputPathFromAudioUrl(audioUrl) {
  return path.join(projectRoot, 'public', String(audioUrl || '').replace(/^\//, ''))
}

function collectExistingValidSources(previousEntry) {
  const sources = {}
  for (const voice of VOICES) {
    const wav = previousEntry?.sources?.[voice]?.wav
    if (wav) sources[voice] = { wav }
  }
  return sources
}

function buildSourcesForKey(key, text, existingSources = {}) {
  return Object.fromEntries(
    VOICES.map((voice) => [
      voice,
      existingSources[voice]?.wav
        ? existingSources[voice]
        : {
            wav: `/audio/trail-guide/${stableFileName(key, voice, sourceHash(text, voice))}`
          }
    ])
  )
}

function selectPreviousEntry(previousEntriesByKey, key) {
  return previousEntriesByKey.get(key) || null
}

function buildEntryFromPreviousText(previousEntry, optimizedEntry) {
  const text = cleanText(previousEntry?.text) || optimizedEntry.text
  const presetKey = previousEntry?.presetKey || optimizedEntry.presetKey
  const variant = previousEntry?.variant || optimizedEntry.variant
  const rebuilt = makeEntry({
    presetKey,
    variant,
    intent: previousEntry?.intent || optimizedEntry.intent,
    text,
    priority: previousEntry?.priority || optimizedEntry.priority,
    tags: Array.isArray(previousEntry?.tags) ? previousEntry.tags : optimizedEntry.tags,
    entityId: previousEntry?.entityId || optimizedEntry.entityId,
    type: previousEntry?.type || optimizedEntry.type
  })

  return {
    ...rebuilt,
    key: optimizedEntry.key,
    presetKey: optimizedEntry.presetKey,
    variant: optimizedEntry.variant
  }
}

function mergeEntryForMode(optimizedEntry, previousEntry) {
  if (MODE.toLowerCase() === 'refreshoptimized') return optimizedEntry
  if (!previousEntry) return optimizedEntry

  const supplementEntry = buildEntryFromPreviousText(previousEntry, optimizedEntry)
  return {
    ...supplementEntry,
    sources: {
      ...supplementEntry.sources,
      ...collectExistingValidSources(previousEntry)
    }
  }
}

async function buildReadySources(entry) {
  const readySources = {}
  for (const voice of VOICES) {
    const source = entry.sources?.[voice]
    if (!source?.wav) continue
    if (await isValidAudioFile(outputPathFromAudioUrl(source.wav))) {
      readySources[voice] = source
    }
  }
  return readySources
}

async function writeManifestAtomically(manifest) {
  const tempPath = `${manifestPath}.tmp`
  await fs.writeFile(tempPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await fs.rename(tempPath, manifestPath)
}

async function main() {
  const seed = JSON.parse(await fs.readFile(seedPath, 'utf8'))
  const previousManifest = await readJsonIfExists(manifestPath)
  const previousEntries = Array.isArray(previousManifest?.entries) ? previousManifest.entries : []
  const previousEntriesByKey = new Map(previousEntries.map((entry) => [entry.key, entry]))
  const optimizedEntries = buildOptimizedEntries(seed)
  const manifestEntries = []
  let generatedCount = 0
  let failedCount = 0
  let missingCount = 0
  let readyVoiceCount = 0

  await fs.mkdir(audioDir, { recursive: true })
  await fs.mkdir(path.dirname(manifestPath), { recursive: true })

  process.stdout.write(`Mode: ${MODE}\n`)
  process.stdout.write(`Endpoint: ${TTS_ENDPOINT}\n`)
  process.stdout.write(`Voices: ${VOICES.join(', ')}\n`)
  process.stdout.write(`Delay: ${Math.round(TTS_DELAY_MS / 1000)}s\n`)
  process.stdout.write(`Batch limit: ${BATCH_LIMIT}\n`)
  process.stdout.write(`Dry run: ${DRY_RUN}\n\n`)

  for (const optimizedEntry of optimizedEntries) {
    const previousEntry = selectPreviousEntry(previousEntriesByKey, optimizedEntry.key)
    const entry = mergeEntryForMode(optimizedEntry, previousEntry)
    const readySources = await buildReadySources(entry)

    for (const voice of VOICES) {
      if (readySources[voice]) {
        readyVoiceCount += 1
        process.stdout.write(`Ready ${entry.key} [${voice}]\n`)
        continue
      }

      missingCount += 1
      const source = entry.sources?.[voice]
      if (!source?.wav) continue
      const outputPath = outputPathFromAudioUrl(source.wav)

      if (DRY_RUN) {
        process.stdout.write(`Dry-run missing ${entry.key} [${voice}] -> ${source.wav}\n`)
        continue
      }

      if (generatedCount >= BATCH_LIMIT) {
        process.stdout.write(`Pending ${entry.key} [${voice}]\n`)
        continue
      }

      if (generatedCount > 0 && TTS_DELAY_MS > 0) {
        await sleep(TTS_DELAY_MS)
      }

      process.stdout.write(`Generating ${entry.key} [${voice}]... `)
      try {
        if (await fileExists(outputPath)) {
          await fs.rm(outputPath, { force: true })
        }
        const audio = await synthesizeWithRetry(entry, voice)
        await writeAudioAtomically(outputPath, audio)
        generatedCount += 1
        readyVoiceCount += 1
        readySources[voice] = source
        process.stdout.write(`${audio.length} bytes\n`)
      } catch (error) {
        failedCount += 1
        process.stdout.write(`FAILED final: ${error.message}\n`)
      }
    }

    const readyVoices = VOICES.filter((voice) => Boolean(readySources[voice]))
    const defaultVoice = readySources.default ? 'default' : readyVoices[0]
    manifestEntries.push({
      ...entry,
      audioUrl: defaultVoice ? readySources[defaultVoice]?.wav || '' : '',
      sources: readySources,
      ready: readyVoices.length > 0,
      readyVoices
    })
  }

  const knownKeys = new Set(manifestEntries.map((entry) => entry.key))
  for (const previousEntry of previousEntries) {
    if (!previousEntry?.key || knownKeys.has(previousEntry.key)) continue
    const legacyText = cleanText(previousEntry.text)
    if (!legacyText) continue
    const legacyEntry = {
      ...previousEntry,
      text: legacyText,
      sources: buildSourcesForKey(previousEntry.key, legacyText, previousEntry.sources)
    }
    const readySources = await buildReadySources(legacyEntry)

    for (const voice of VOICES) {
      if (readySources[voice]) {
        readyVoiceCount += 1
        process.stdout.write(`Ready ${legacyEntry.key} [${voice}]\n`)
        continue
      }

      missingCount += 1
      const source = legacyEntry.sources?.[voice]
      if (!source?.wav) continue
      const outputPath = outputPathFromAudioUrl(source.wav)

      if (DRY_RUN) {
        process.stdout.write(`Dry-run missing ${legacyEntry.key} [${voice}] -> ${source.wav}\n`)
        continue
      }

      if (generatedCount >= BATCH_LIMIT) {
        process.stdout.write(`Pending ${legacyEntry.key} [${voice}]\n`)
        continue
      }

      if (generatedCount > 0 && TTS_DELAY_MS > 0) {
        await sleep(TTS_DELAY_MS)
      }

      process.stdout.write(`Generating ${legacyEntry.key} [${voice}]... `)
      try {
        if (await fileExists(outputPath)) {
          await fs.rm(outputPath, { force: true })
        }
        const audio = await synthesizeWithRetry(legacyEntry, voice)
        await writeAudioAtomically(outputPath, audio)
        generatedCount += 1
        readyVoiceCount += 1
        readySources[voice] = source
        process.stdout.write(`${audio.length} bytes\n`)
      } catch (error) {
        failedCount += 1
        process.stdout.write(`FAILED final: ${error.message}\n`)
      }
    }

    const readyVoices = VOICES.filter((voice) => Boolean(readySources[voice]))
    if (!readyVoices.length) continue
    const defaultVoice = readySources.default ? 'default' : readyVoices[0]
    manifestEntries.push({
      ...legacyEntry,
      audioUrl: readySources[defaultVoice]?.wav || legacyEntry.audioUrl || '',
      sources: readySources,
      ready: true,
      readyVoices,
      legacy: true
    })
  }

  const manifest = {
    version: 3,
    generatedAt: new Date().toISOString(),
    provider: 'springboot-mimo-tts',
    mode: MODE,
    voices: VOICES,
    defaultVoice: VOICES.includes('default') ? 'default' : VOICES[0],
    speed: SPEED,
    format: 'wav',
    entries: manifestEntries
  }

  if (!DRY_RUN) {
    await writeManifestAtomically(manifest)
    process.stdout.write(`\nManifest written: ${manifestPath}\n`)
  } else {
    process.stdout.write('\nDry-run only; manifest was not written.\n')
  }

  const readyEntries = manifestEntries.filter((entry) => entry.ready).length
  const fullVoiceEntries = manifestEntries.filter((entry) => VOICES.every((voice) => entry.readyVoices?.includes(voice))).length
  process.stdout.write(`Entries: ${manifestEntries.length}; ready entries: ${readyEntries}; full voice entries: ${fullVoiceEntries}\n`)
  process.stdout.write(`Ready voices: ${readyVoiceCount}; missing voices seen: ${missingCount}; generated this run: ${generatedCount}; failed this run: ${failedCount}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
