import { strict as assert } from 'assert'
import { build } from 'esbuild'
import { mkdtemp, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agent-knowledge-graph-'))

try {
  const graphModule = await bundleImport('src/agent/knowledgeGraph.js', 'knowledgeGraph.mjs')

  runSanxingduiJinshaCase(graphModule)
  runContextPronounCase(graphModule)
  runEraAndPeopleEntityCase(graphModule)
  runPromptContextCase(graphModule)
  runRecommendationCase(graphModule)

  console.log('Agent knowledge graph regression: PASS')
} finally {
  await rm(tempDir, { recursive: true, force: true })
}

async function bundleImport(relativeEntry, name) {
  const outfile = path.join(tempDir, name)
  await build({
    entryPoints: [path.join(root, relativeEntry)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent'
  })
  return import(pathToFileURL(outfile).href)
}

function runSanxingduiJinshaCase({ discoverKnowledgeRelations }) {
  const graph = discoverKnowledgeRelations({
    question: '三星堆和金沙有什么联系？',
    documents: [{
      title: '三星堆与金沙遗址比较研究',
      content: '三星堆与金沙都属于古蜀文明体系，在祭祀礼仪、金器和玉器方面存在延续关系。'
    }]
  })

  assert(graph.entities.some((item) => item.name === '三星堆遗址'), 'should identify Sanxingdui entity')
  assert(graph.entities.some((item) => item.name === '金沙遗址'), 'should identify Jinsha entity')
  assert(graph.entities.some((item) => item.name === '古蜀文明'), 'should identify ancient Shu concept')
  assert(graph.relations.some((item) => item.sourceName === '三星堆遗址' && item.targetName === '金沙遗址'), 'should discover Sanxingdui-Jinsha relation')
  console.log('- Sanxingdui and Jinsha relation discovery: PASS')
}

function runContextPronounCase({ discoverKnowledgeRelations }) {
  const graph = discoverKnowledgeRelations({
    question: '它和祭祀有什么关系？',
    context: {
      currentArtifact: '青铜神树',
      currentPage: '/trail',
      currentTrailNode: '文物驻足'
    }
  })

  assert(graph.entities.some((item) => item.name === '青铜神树' && item.fromContext), 'pronoun should resolve to current artifact')
  assert(graph.relations.some((item) => item.sourceName === '青铜神树' && item.targetName === '祭祀文化'), 'should return sacred tree-sacrifice relation')
  console.log('- context pronoun relation discovery: PASS')
}

function runPromptContextCase({ discoverKnowledgeRelations, buildKnowledgePromptContext }) {
  const graph = discoverKnowledgeRelations({
    question: '金面具为什么特别？',
    documents: [{
      title: '金面具研究资料',
      content: '金面具体现古蜀金器工艺，也与祭祀仪式和身份象征有关。'
    }]
  })
  const promptContext = buildKnowledgePromptContext(graph)

  assert(promptContext.includes('识别实体'), 'prompt context should include entity line')
  assert(promptContext.includes('金面具'), 'prompt context should mention gold mask')
  assert(promptContext.includes('金器工艺') || promptContext.includes('祭祀文化'), 'prompt context should include related concepts')
  console.log('- knowledge prompt context: PASS')
}

function runEraAndPeopleEntityCase({ discoverKnowledgeRelations }) {
  const graph = discoverKnowledgeRelations({
    question: '三星堆先民在商周时期形成了怎样的礼仪？',
    documents: [{
      title: '三星堆时代背景',
      content: '三星堆遗址从新石器时代晚期延续至商周时期，反映古蜀先民的祭祀礼仪和技术能力。'
    }]
  })

  assert(graph.entities.some((item) => item.type === '人物/时代实体' && item.name === '商周时期'), 'should identify era entity')
  assert(graph.entities.some((item) => item.type === '人物/时代实体' && item.name === '古蜀先民'), 'should identify people/community entity')
  assert(graph.relations.some((item) => item.sourceName === '古蜀先民' && item.targetName === '古蜀文明'), 'should return people-culture relation')
  console.log('- era and people/community entity extraction: PASS')
}

function runRecommendationCase({ discoverKnowledgeRelations, buildKnowledgeFollowupSuggestions }) {
  const graph = discoverKnowledgeRelations({
    question: '介绍青铜神树',
    context: { currentArtifact: '青铜神树' }
  })
  const suggestions = buildKnowledgeFollowupSuggestions(graph)

  assert(suggestions.some((item) => item.includes('太阳神鸟')), 'sacred tree should recommend sun bird exploration')
  assert(suggestions.some((item) => item.includes('祭祀文化')), 'sacred tree should recommend sacrifice exploration')
  console.log('- relationship-based follow-up recommendations: PASS')
}
