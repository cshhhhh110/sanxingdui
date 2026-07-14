const ALLOWED_PATTERN = /(结构|造型|工艺|祭祀|场景|宇宙观|天地|太阳崇拜|用途|使用|身份|姿态|服饰|纹样|残缺|复原|原貌|为什么.*(重要|特别)|如何理解)/
const BLOCKED_PATTERN = /(今天|日期|几点|天气|商城|购物|订单|打开|跳转|导航|不要(图片|生图)|不用(图片|生图)|别生成)/

const ARTIFACT_IDS = {
  青铜神树: 'HI-2025-006',
  青铜大立人: 'HI-2025-005',
  金面具: 'HI-2025-002',
  黄金面具: 'HI-2025-002',
  金杖: 'HI-2025-004'
}

export function decideVisualAid(input = {}) {
  const question = String(input.question || '').trim()
  const answer = String(input.answer || '').trim()
  const route = String(input.route || '').toUpperCase()
  const attachments = Array.isArray(input.attachments) ? input.attachments : []
  if (!question || !answer || route !== 'RAG') return null
  if (attachments.some((item) => String(item.mediaType || '').toUpperCase() === 'IMAGE')) return null
  if (BLOCKED_PATTERN.test(question) || !ALLOWED_PATTERN.test(question)) return null

  const graph = input.knowledgeGraph || {}
  const context = input.context || {}
  const entity = (graph.entities || []).find((item) =>
    item.type === '文物实体' && Array.isArray(item.visualPotential) && item.visualPotential.length
  )
  const artifactName = entity?.name || context.currentArtifact || ''
  const focus = entity?.visualPotential || inferFocus(question, artifactName)
  if (!artifactName || !focus.length) return null

  const purpose = /复原|还原|当年|原貌|残缺/.test(question)
    ? 'CULTURAL_RECONSTRUCTION'
    : 'GUIDE_SUPPORT'
  const focusText = focus.slice(0, 3).join('、')
  return {
    artifactId: context.currentArtifactId || ARTIFACT_IDS[artifactName] || entity?.id || '',
    artifactName,
    title: `生成${artifactName}视觉辅助示意图`,
    reason: `用画面呈现${focusText}，帮助理解当前讲解。`,
    prompt: buildPrompt({ artifactName, focus, question, purpose }),
    purpose,
    contentLabel: purpose === 'CULTURAL_RECONSTRUCTION' ? 'AI_RECONSTRUCTION' : 'AI_ILLUSTRATION',
    knowledgeFocus: focus.slice(0, 3),
    sourceReferences: normalizeSources(input.references)
  }
}

function buildPrompt({ artifactName, focus, question, purpose }) {
  const style = purpose === 'CULTURAL_RECONSTRUCTION'
    ? '基于公开考古资料的审慎文化复原示意'
    : '博物馆教育用途的文化辅助示意'
  return [
    `${style}：${artifactName}。`,
    `重点表现：${focus.slice(0, 3).join('、')}。`,
    `讲解问题：${question}。`,
    '画面清晰、克制、可信，避免现代文字、水印和伪造考古结论；明确属于AI辅助示意，不作为考古原貌。'
  ].join(' ')
}

function inferFocus(question, artifactName) {
  const focus = []
  if (/祭祀|使用|场景/.test(question)) focus.push('祭祀场景')
  if (/宇宙观|天地/.test(question)) focus.push('天地连接')
  if (/结构|造型|工艺|纹样|服饰|姿态/.test(question)) focus.push('文物结构细节')
  if (/太阳/.test(question)) focus.push('太阳崇拜')
  if (/身份|权力/.test(question)) focus.push('礼仪身份')
  if (!focus.length && artifactName) focus.push(`${artifactName}的文化语境`)
  return [...new Set(focus)]
}

function normalizeSources(references = []) {
  return (Array.isArray(references) ? references : []).slice(0, 4).map((item) => ({
    title: item.title || item.name || '文博资料',
    path: item.path || '',
    score: Number(item.score) || 0,
    type: item.type || 'knowledge'
  }))
}
