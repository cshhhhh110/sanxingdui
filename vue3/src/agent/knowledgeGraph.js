const ENTITY_CATALOG = [
  {
    id: 'site.sanxingdui',
    name: '三星堆遗址',
    shortName: '三星堆',
    type: '遗址实体',
    aliases: ['三星堆', '三星堆遗址', '三兴堆']
  },
  {
    id: 'site.jinsha',
    name: '金沙遗址',
    shortName: '金沙',
    type: '遗址实体',
    aliases: ['金沙', '金沙遗址', '金沙文化']
  },
  {
    id: 'concept.ancient_shu',
    name: '古蜀文明',
    shortName: '古蜀',
    type: '文化概念实体',
    aliases: ['古蜀', '古蜀文明', '蜀文化', '古蜀文化']
  },
  {
    id: 'era.late_neolithic',
    name: '新石器时代晚期',
    shortName: '新石器晚期',
    type: '人物/时代实体',
    aliases: ['新石器时代晚期', '新石器晚期', '约公元前2800年']
  },
  {
    id: 'era.shang_zhou',
    name: '商周时期',
    type: '人物/时代实体',
    aliases: ['商周', '商周时期', '商代', '西周', '约公元前1200年']
  },
  {
    id: 'people.ancient_shu_community',
    name: '古蜀先民',
    type: '人物/时代实体',
    aliases: ['古蜀先民', '古蜀人群', '古蜀人', '三星堆先民']
  },
  {
    id: 'artifact.bronze_sacred_tree',
    name: '青铜神树',
    type: '文物实体',
    aliases: ['青铜神树', '神树', '通天神树', '神鸟树']
  },
  {
    id: 'artifact.gold_mask',
    name: '金面具',
    type: '文物实体',
    aliases: ['金面具', '黄金面具', '黄金面罩', '金箔面具']
  },
  {
    id: 'artifact.vertical_eye_mask',
    name: '青铜纵目面具',
    type: '文物实体',
    aliases: ['青铜纵目面具', '纵目面具', '纵目', '大面具']
  },
  {
    id: 'artifact.standing_figure',
    name: '青铜大立人',
    type: '文物实体',
    aliases: ['青铜大立人', '大立人', '大立人像', '青铜大立人像']
  },
  {
    id: 'artifact.gold_scepter',
    name: '金杖',
    type: '文物实体',
    aliases: ['金杖', '黄金权杖', '权杖']
  },
  {
    id: 'concept.sacrifice',
    name: '祭祀文化',
    type: '文化概念实体',
    aliases: ['祭祀', '祭祀文化', '祭祀体系', '祭祀坑', '神权']
  },
  {
    id: 'concept.sun_worship',
    name: '太阳崇拜',
    type: '文化概念实体',
    aliases: ['太阳崇拜', '太阳神鸟', '太阳纹', '太阳信仰']
  },
  {
    id: 'concept.bronze_craft',
    name: '青铜工艺',
    type: '文化概念实体',
    aliases: ['青铜', '青铜器', '青铜工艺', '分段铸造', '铸接']
  },
  {
    id: 'concept.gold_craft',
    name: '金器工艺',
    type: '文化概念实体',
    aliases: ['金器', '金器工艺', '金箔', '锤揲', '黄金工艺']
  }
]

const RELATION_CATALOG = [
  relation('site.sanxingdui', 'concept.ancient_shu', '属于', '三星堆遗址属于古蜀文明的重要遗存。'),
  relation('site.jinsha', 'concept.ancient_shu', '属于', '金沙遗址同样属于古蜀文明体系。'),
  relation('site.sanxingdui', 'site.jinsha', '相关', '三星堆与金沙在古蜀文明、礼仪传统和器物象征上存在延续线索。'),
  relation('site.sanxingdui', 'era.late_neolithic', '延续至', '三星堆文化脉络可上溯到新石器时代晚期。'),
  relation('site.sanxingdui', 'era.shang_zhou', '延续至', '三星堆遗址的重要祭祀遗存与商周时期密切相关。'),
  relation('people.ancient_shu_community', 'concept.ancient_shu', '属于', '古蜀先民是理解古蜀文明生产、礼仪和信仰的主体。'),
  relation('people.ancient_shu_community', 'site.sanxingdui', '相关', '三星堆遗存反映了古蜀先民的礼仪实践和技术能力。'),
  relation('artifact.bronze_sacred_tree', 'site.sanxingdui', '发现于', '青铜神树发现于三星堆遗址。'),
  relation('artifact.bronze_sacred_tree', 'concept.sacrifice', '体现', '青铜神树体现了三星堆祭祀文化与通天观念。'),
  relation('artifact.bronze_sacred_tree', 'concept.sun_worship', '相关', '青铜神树的神鸟和树形意象常被用来讨论太阳崇拜。'),
  relation('artifact.bronze_sacred_tree', 'artifact.standing_figure', '相关', '青铜神树和青铜大立人都可放入祭祀场景理解。'),
  relation('artifact.gold_mask', 'site.sanxingdui', '发现于', '金面具发现于三星堆祭祀坑相关背景中。'),
  relation('artifact.gold_mask', 'concept.gold_craft', '体现', '金面具体现了古蜀金器加工和礼仪表达。'),
  relation('artifact.gold_mask', 'concept.sacrifice', '相关', '金面具与祭祀仪式、身份象征和神权表达有关。'),
  relation('artifact.gold_mask', 'concept.sun_worship', '相关', '金面具可与古蜀黄金崇拜和太阳意象联系理解。'),
  relation('artifact.vertical_eye_mask', 'site.sanxingdui', '发现于', '青铜纵目面具是三星堆极具辨识度的青铜器。'),
  relation('artifact.vertical_eye_mask', 'concept.sacrifice', '体现', '青铜纵目面具体现了古蜀神灵崇拜和祭祀想象。'),
  relation('artifact.standing_figure', 'site.sanxingdui', '发现于', '青铜大立人发现于三星堆遗址。'),
  relation('artifact.standing_figure', 'concept.sacrifice', '体现', '青铜大立人常被放入祭祀主持者或礼仪角色中讨论。'),
  relation('artifact.gold_scepter', 'site.sanxingdui', '发现于', '金杖是三星堆黄金器物的重要代表。'),
  relation('artifact.gold_scepter', 'concept.gold_craft', '体现', '金杖体现了古蜀金器工艺与权力象征。'),
  relation('artifact.gold_scepter', 'concept.ancient_shu', '体现', '金杖有助于理解古蜀权力与礼仪秩序。'),
  relation('concept.bronze_craft', 'site.sanxingdui', '相关', '三星堆青铜器显示出复杂的铸造、组合和造型能力。'),
  relation('concept.gold_craft', 'site.sanxingdui', '相关', '三星堆金器体现了古蜀礼仪系统中的黄金表达。')
]

const PRONOUN_PATTERN = /(它|这个|这件|该文物|刚才那个|刚刚那个|这里|其)/

export function discoverKnowledgeRelations(input = {}) {
  const question = String(input.question || input.message || '').trim()
  const context = input.context || {}
  const documents = input.documents || input.docs || input.references || []
  const text = buildAnalysisText({ question, context, documents })
  const entities = extractKnowledgeEntities({ text, context, question, documents })
  const relations = prioritizeRelations(extractRelations(entities, text), question)
  const suggestions = buildKnowledgeFollowupSuggestions({
    entities,
    relations,
    context,
    question
  })

  return {
    entities,
    relations,
    relationChain: buildRelationChain(relations),
    suggestions,
    summary: summarizeKnowledgeRelations({ entities, relations, context }),
    evidence: buildEvidence(documents)
  }
}

export function extractKnowledgeEntities(input = {}) {
  const text = buildAnalysisText(input)
  const normalizedText = normalizeText(text)
  const context = input.context || {}
  const question = String(input.question || input.message || '').trim()
  const matches = []

  ENTITY_CATALOG.forEach((entity) => {
    const matchedAliases = entity.aliases.filter((alias) => normalizedText.includes(normalizeText(alias)))
    if (matchedAliases.length) {
      matches.push({
        id: entity.id,
        name: entity.name,
        shortName: entity.shortName || entity.name,
        type: entity.type,
        matchedAliases,
        score: matchedAliases.length
      })
    }
  })

  if (PRONOUN_PATTERN.test(question) && context.currentArtifact) {
    const contextualEntity = findEntityByName(context.currentArtifact)
    const existingContextEntity = contextualEntity
      ? matches.find((item) => item.id === contextualEntity.id)
      : null
    if (existingContextEntity) {
      existingContextEntity.fromContext = true
      existingContextEntity.score += 10
    } else if (contextualEntity) {
      matches.unshift({
        id: contextualEntity.id,
        name: contextualEntity.name,
        shortName: contextualEntity.shortName || contextualEntity.name,
        type: contextualEntity.type,
        matchedAliases: [context.currentArtifact],
        score: 10,
        fromContext: true
      })
    }
  }

  return dedupeBy(matches, (item) => item.id).slice(0, 8)
}

export function buildKnowledgePromptContext(graph = {}) {
  const entities = Array.isArray(graph.entities) ? graph.entities : []
  const relations = Array.isArray(graph.relations) ? graph.relations : []
  if (!entities.length && !relations.length) {
    return ''
  }

  const entityLine = entities.length
    ? `识别实体：${entities.map((item) => `${item.name}（${item.type}）`).join('、')}`
    : ''
  const relationLines = relations.slice(0, 5).map((item) => {
    return `${item.sourceName} --${item.relation}--> ${item.targetName}：${item.summary}`
  })
  const suggestionLine = graph.suggestions?.length
    ? `可继续引导：${graph.suggestions.slice(0, 3).join('；')}`
    : ''

  return [entityLine, ...relationLines, suggestionLine].filter(Boolean).join('\n')
}

export function summarizeKnowledgeRelations({ entities = [], relations = [], context = {} } = {}) {
  if (relations.length) {
    const first = relations[0]
    return `发现 ${first.sourceName} 与 ${first.targetName} 的“${first.relation}”线索`
  }
  if (context.currentArtifact) {
    return `围绕当前参观对象 ${context.currentArtifact} 继续探索`
  }
  if (entities.length) {
    return `识别到 ${entities.slice(0, 3).map((item) => item.name).join('、')} 等知识实体`
  }
  return ''
}

export function buildKnowledgeFollowupSuggestions(input = {}) {
  const entities = Array.isArray(input.entities) ? input.entities : []
  const relations = Array.isArray(input.relations) ? input.relations : []
  const context = input.context || {}
  const names = new Set([
    context.currentArtifact,
    ...entities.map((item) => item.name),
    ...relations.flatMap((item) => [item.sourceName, item.targetName])
  ].filter(Boolean))

  const suggestions = []
  if (names.has('青铜神树')) {
    suggestions.push('金沙太阳神鸟和太阳崇拜有什么联系？')
    suggestions.push('古蜀祭祀文化为什么重要？')
    suggestions.push('青铜大立人与青铜神树有什么关系？')
  }
  if (names.has('金面具')) {
    suggestions.push('金面具为什么能体现古蜀礼仪？')
    suggestions.push('金面具和太阳崇拜有什么关系？')
    suggestions.push('查看金面具时空展线')
  }
  if (names.has('三星堆遗址') || names.has('三星堆') || names.has('金沙遗址')) {
    suggestions.push('三星堆和金沙之间有哪些延续线索？')
    suggestions.push('古蜀文明为什么会形成独特面貌？')
    suggestions.push('为什么三星堆青铜器造型独特？')
  }
  if (names.has('祭祀文化')) {
    suggestions.push('祭祀坑的发现意味着什么？')
  }

  return dedupeBy(suggestions, (item) => item).slice(0, 3)
}

export function getKnowledgeEntityCatalog() {
  return ENTITY_CATALOG.map((item) => ({ ...item, aliases: [...item.aliases] }))
}

export function getKnowledgeRelationCatalog() {
  return RELATION_CATALOG.map((item) => ({ ...item }))
}

function relation(sourceId, targetId, relationName, summary) {
  const source = ENTITY_CATALOG.find((item) => item.id === sourceId)
  const target = ENTITY_CATALOG.find((item) => item.id === targetId)
  return {
    sourceId,
    targetId,
    sourceName: source?.name || sourceId,
    targetName: target?.name || targetId,
    relation: relationName,
    summary
  }
}

function extractRelations(entities = [], text = '') {
  const entityIds = new Set(entities.map((item) => item.id))
  const normalizedText = normalizeText(text)
  const matched = RELATION_CATALOG.filter((item) => {
    const sourceHit = entityIds.has(item.sourceId)
    const targetHit = entityIds.has(item.targetId)
    if (sourceHit && targetHit) {
      return true
    }
    if (sourceHit && hasRelationKeyword(normalizedText, item)) {
      return true
    }
    if (targetHit && hasRelationKeyword(normalizedText, item)) {
      return true
    }
    return false
  })

  return dedupeBy(matched, (item) => `${item.sourceId}:${item.relation}:${item.targetId}`).slice(0, 8)
}

function prioritizeRelations(relations = [], question = '') {
  const normalizedQuestion = normalizeText(question)
  return [...relations].sort((left, right) => {
    return scoreRelationForQuestion(right, normalizedQuestion) - scoreRelationForQuestion(left, normalizedQuestion)
  })
}

function scoreRelationForQuestion(relationItem, normalizedQuestion) {
  const source = ENTITY_CATALOG.find((item) => item.id === relationItem.sourceId)
  const target = ENTITY_CATALOG.find((item) => item.id === relationItem.targetId)
  return endpointQuestionScore(source, normalizedQuestion) + endpointQuestionScore(target, normalizedQuestion)
}

function endpointQuestionScore(entity, normalizedQuestion) {
  if (!entity || !normalizedQuestion) {
    return 0
  }
  return [entity.name, entity.shortName, ...entity.aliases].some((alias) => normalizedQuestion.includes(normalizeText(alias)))
    ? 10
    : 0
}

function hasRelationKeyword(text, relationItem) {
  const relationWords = [
    relationItem.relation,
    relationItem.sourceName,
    relationItem.targetName,
    '关系',
    '联系',
    '意义',
    '特别',
    '重要',
    '象征',
    '祭祀',
    '文明',
    '延续'
  ]
  return relationWords.some((word) => text.includes(normalizeText(word)))
}

function buildAnalysisText(input = {}) {
  const context = input.context || {}
  const documents = input.documents || input.docs || input.references || []
  return [
    input.text,
    input.question,
    input.message,
    context.currentArtifact,
    context.currentScene,
    context.currentTrailNode,
    ...documents.map((item) => [
      item.title,
      item.content,
      item.excerpt,
      item.path,
      Array.isArray(item.tags) ? item.tags.join(' ') : ''
    ].filter(Boolean).join(' '))
  ].filter(Boolean).join(' ')
}

function buildRelationChain(relations = []) {
  return relations.slice(0, 5).map((item) => ({
    source: item.sourceName,
    relation: item.relation,
    target: item.targetName,
    label: `${item.sourceName} → ${item.targetName}`
  }))
}

function buildEvidence(documents = []) {
  return documents.slice(0, 4).map((item) => ({
    title: item.title || item.name || '',
    path: item.path || item.file || '',
    score: Number(item.score) || 0
  })).filter((item) => item.title || item.path)
}

function findEntityByName(name = '') {
  const normalizedName = normalizeText(name)
  return ENTITY_CATALOG.find((entity) => {
    return normalizeText(entity.name) === normalizedName ||
      normalizeText(entity.shortName || '') === normalizedName ||
      entity.aliases.some((alias) => normalizedName.includes(normalizeText(alias)) || normalizeText(alias).includes(normalizedName))
  })
}

function normalizeText(text = '') {
  return String(text || '').toLowerCase().replace(/\s+/g, '')
}

function dedupeBy(items = [], getKey) {
  const seen = new Set()
  return items.filter((item) => {
    const key = getKey(item)
    if (!key || seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
