import { strict as assert } from 'assert'
import { build } from 'esbuild'
import { mkdtemp, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agent-visual-aid-'))

try {
  const module = await bundleImport('src/agent/visualAid.js', 'visualAid.mjs')
  const graph = {
    entities: [{
      id: 'artifact.bronze_sacred_tree',
      name: '青铜神树',
      type: '文物实体',
      visualPotential: ['祭祀场景', '天地连接', '太阳崇拜']
    }]
  }
  const proposal = module.decideVisualAid({
    question: '青铜神树为什么体现古蜀人的宇宙观？',
    answer: '青铜神树以树干、神鸟和龙形构件组织天地关系。',
    route: 'RAG',
    knowledgeGraph: graph,
    references: [{ title: '青铜神树研究资料', path: 'wiki/tree.md', score: 0.9 }]
  })
  assert(proposal, 'heritage explanation should produce one visual proposal')
  assert.equal(proposal.artifactName, '青铜神树')
  assert.equal(proposal.purpose, 'GUIDE_SUPPORT')
  assert.equal(proposal.sourceReferences.length, 1)

  assert.equal(module.decideVisualAid({
    question: '今天天气怎么样？', answer: '晴。', route: 'RAG', knowledgeGraph: graph
  }), null, 'weather must not propose visual aid')
  assert.equal(module.decideVisualAid({
    question: '打开商城', answer: '已打开。', route: 'RAG', knowledgeGraph: graph
  }), null, 'tool/navigation requests must not propose visual aid')
  assert.equal(module.decideVisualAid({
    question: '青铜神树结构如何？', answer: '分层结构。', route: 'RAG', knowledgeGraph: graph,
    attachments: [{ mediaType: 'IMAGE' }]
  }), null, 'an existing image must suppress visual aid')
  assert.equal(module.decideVisualAid({
    question: '青铜神树结构如何？', answer: '分层结构。', route: 'DIRECT_ANSWER', knowledgeGraph: graph
  }), null, 'non-RAG response must not propose visual aid')

  console.log('Agent visual aid regression: PASS')
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
