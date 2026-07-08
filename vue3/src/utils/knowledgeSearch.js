const DOC_FILES = [
  '/data/knowledge-sanxingdui.txt',
  '/data/knowledge-sacred-tree.txt',
  '/data/knowledge-vertical-eye-mask.txt',
  '/data/knowledge-standing-figure.txt',
  '/data/knowledge-gold-scepter.txt',
  '/data/knowledge-gold-mask.txt',
  '/data/knowledge-craft.txt'
]

const ALIAS_MAP = {
  神树: '青铜神树',
  通天树: '青铜神树',
  神鸟: '青铜神树',
  纵目: '青铜纵目面具',
  立人像: '青铜大立人像',
  立人: '青铜大立人像',
  金杖: '金杖',
  权杖: '金杖',
  黄金面具: '黄金面具',
  金面具: '黄金面具',
  面具: '黄金面具',
  三星堆: '三星堆遗址',
  古蜀: '三星堆遗址',
  祭祀坑: '三星堆遗址',
  工艺: '古蜀青铜与金器工艺',
  分段铸造: '古蜀青铜与金器工艺',
  嵌铸: '古蜀青铜与金器工艺',
  铸接: '古蜀青铜与金器工艺',
  金箔: '古蜀青铜与金器工艺',
  锤揲: '古蜀青铜与金器工艺'
}

let docCache = null

export async function searchKnowledge(question, topK = 1) {
  const docs = await loadAllDocs()
  if (!docs.length) return []

  return docs
    .map((doc) => ({ ...doc, score: scoreDoc(question, doc) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

export function buildRagPrompt(question, docs = [], context = {}) {
  const contextSection = buildContextSection(context)
  const knowledgeSection = docs.length
    ? docs
        .map((doc, index) => {
          const meta = doc.entityId ? `（${doc.entityId}）` : ''
          return `参考材料：${doc.title}${meta}\n${extractLead(doc.content)}`
        })
        .join('\n\n')
    : '当前未检索到足够相关的本地资料，请如实说明，不要编造。'

  return `
你是“三星堆数字展馆”的专业讲解助手。请只回答简短版。
要求：
1. 优先依据【当前解说上下文】和【检索资料】。
2. 先给一句结论，再补 1 到 2 个要点。
3. 尽量控制在 60 到 100 字，最多不超过 3 句。
4. 资料不足时直接说“不确定”，不要编造。
5. 不要输出未提供的编号、尺寸、年代等信息。
6. 不要在最终回答中输出【资料1】【资料2】等资料编号或引用标记。
7. 语气专业、简洁，保留一点“玄喵”感即可。
【当前解说上下文】${contextSection || '无'}

【检索资料】
${knowledgeSection}

【用户问题】${question}
`.trim()
}

export function buildFallbackReply(question, docs = [], context = {}) {
  const questionText = String(question || '').trim()
  const title = context.title || context.contextTitle || context.name || ''
  const prefix = title ? `围绕“${title}”` : '这个问题'
  const questionPrefix = buildQuestionIntro(questionText)

  if (docs.length) {
    const lead = extractLead(docs[0].content)
    const guidance = title
      ? '可以继续问它的工艺、年代或象征意义。'
      : '你也可以继续问青铜神树、青铜纵目面具、青铜大立人像、金杖、黄金面具或青铜工艺。'

    return `${questionPrefix}${prefix}可以先这样理解：${lead}。${guidance}`
  }

  return title
    ? `${questionPrefix}${prefix}暂时没有检索到足够明确的本地资料，我不会编造。你可以换个角度继续问。`
    : `${questionPrefix}这个问题暂时没有匹配到足够明确的本地资料，我不会编造。你可以换个角度继续问。`
}

function buildQuestionIntro(questionText) {
  const normalizedQuestion = String(questionText || '').trim()
  if (!normalizedQuestion) return ''

  const cleanQuestion = normalizedQuestion.replace(/[。；;，,、\s]+$/g, '')
  if (!cleanQuestion) return ''

  const hasEndPunctuation = /[！？!?]$/.test(cleanQuestion)
  return `你问到：${cleanQuestion}${hasEndPunctuation ? '' : '。'}`
}

async function loadAllDocs() {
  if (docCache) return docCache

  const results = []
  for (const file of DOC_FILES) {
    try {
      const response = await fetch(file)
      if (!response.ok) continue

      const raw = await response.text()
      const parsed = parseDoc(raw, file)
      if (parsed) results.push(parsed)
    } catch (error) {
      console.warn('知识文档加载失败:', file, error)
    }
  }

  docCache = results
  return docCache
}

function parseDoc(raw, file) {
  const text = String(raw || '').trim()
  if (!text) return null

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) return null

  const title = stripMarkdownHeading(lines[0])
  const lastLine = lines[lines.length - 1]
  const meta = parseMetaLine(lastLine)
  const bodyLines = meta ? lines.slice(1, -1) : lines.slice(1)
  const body = bodyLines.join(' ').replace(/\s+/g, ' ').trim()

  return {
    file,
    title,
    content: body,
    entityId: meta.entityId || null,
    meta,
    corpus: buildCorpus(title, body, meta)
  }
}

function parseMetaLine(line) {
  if (!line || !/实体ID|朝代|出土地点|工艺/.test(line)) {
    return {}
  }

  const meta = {}
  for (const part of line.split('|')) {
    const [rawKey, ...rest] = part.split(/[:：]/)
    const key = String(rawKey || '').trim()
    const value = rest.join(':').trim()
    if (!key || !value) continue

    if (key === '实体ID') meta.entityId = value
    if (key === '朝代') meta.dynasty = value
    if (key === '出土地点') meta.site = value
    if (key === '工艺') meta.craft = value
  }

  return meta
}

function buildCorpus(title, content, meta = {}) {
  return normalizeText(
    [title, content, meta.entityId, meta.dynasty, meta.site, meta.craft]
      .filter(Boolean)
      .join(' ')
  )
}

function scoreDoc(question, doc) {
  const normalizedQuestion = normalizeText(question)
  if (!normalizedQuestion) return 0

  let score = 0
  const corpus = doc.corpus

  for (const [alias, target] of Object.entries(ALIAS_MAP)) {
    if (normalizedQuestion.includes(normalizeText(alias)) && corpus.includes(normalizeText(target))) {
      score += 24
    }
  }

  if (doc.entityId) {
    const entityId = normalizeText(doc.entityId)
    if (normalizedQuestion.includes(entityId)) score += 30
  }

  for (const token of tokenize(doc.title)) {
    if (token.length >= 2 && normalizedQuestion.includes(token)) {
      score += 14
    }
  }

  const qTokens = new Set(tokenize(question))
  let overlap = 0
  for (const token of tokenize([doc.title, doc.content, doc.meta.entityId, doc.meta.dynasty, doc.meta.site, doc.meta.craft].join(' '))) {
    if (token.length >= 2 && qTokens.has(token)) overlap += 1
  }
  score += overlap * 2

  for (const value of Object.values(doc.meta)) {
    if (value && normalizedQuestion.includes(normalizeText(value))) score += 8
  }

  return score
}

function tokenize(input) {
  const text = normalizeText(input)
  if (!text) return []

  const cleaned = text.replace(/[^\u4e00-\u9fffA-Za-z0-9]+/g, ' ')
  const chunks = cleaned.split(/\s+/).filter(Boolean)
  const tokens = []

  for (const chunk of chunks) {
    if (/^[a-zA-Z0-9]+$/.test(chunk) || chunk.length === 1) {
      tokens.push(chunk)
      continue
    }

    for (let i = 0; i < chunk.length - 1; i += 1) {
      tokens.push(chunk.slice(i, i + 2))
    }
  }

  return tokens
}

function normalizeText(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[“”"'.，。！？；、，\s（）()【】\[\]<>·-]/g, '')
}

function stripMarkdownHeading(text) {
  return String(text || '').replace(/^#+\s*/, '').trim()
}

function extractLead(content) {
  const cleaned = String(content || '').replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    return '本地资料仅提供了相关主题的基础线索'
  }

  const firstSentence = cleaned.split(/[。！？；;]/).map((item) => item.trim()).filter(Boolean)[0] || cleaned
  return firstSentence.slice(0, 80)
}

function buildContextSection(context = {}) {
  const parts = []
  if (context.title) parts.push(`文物：${context.title}`)
  if (context.entityId) parts.push(`编号：${context.entityId}`)
  if (context.site) parts.push(`地点：${context.site}`)
  if (context.era) parts.push(`年代：${context.era}`)
  if (context.craft) parts.push(`工艺：${context.craft}`)
  if (context.summary) parts.push(`摘要：${context.summary}`)
  return parts.join('\n')
}
