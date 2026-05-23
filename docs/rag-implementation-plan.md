# 玄喵 RAG 问答升级 · 完整实施计划

## 现状

```
用户提问 → matchFixedAnswer(chatReplyConfig.js) 关键词命中? 
              ↓命中                               ↓未命中
          固定1-2句台词                       WebSocket → XunFeiTest:8089
                                                    ↓
                                              "断开连接，请刷新页面"
```

**问题**：固定关键词宽泛匹配（"是什么"三个字就命中）、回复只有1-2句、WebSocket经常断连、没有真正的知识支撑。

## 目标

```
用户提问 → knowledgeSearch.js(7份知识文档，取top3) → RAG Prompt → MiMo API(流式) → 打字机逐字显示
                                                                      ↓失败
                                                               "喵～网络不太好"
```

**核心**：不依赖 XunFeiTest、不靠固定文案、所有回答都有知识文档做依据。

---

## 你需要新建的文件（3个）

### 文件1：知识文档 × 7

路径：`vue3/public/data/knowledge-*.txt`

每份 200-500 字，纯文本，UTF-8 编码。末尾统一加一行标签方便检索：

```
实体ID：HI-2025-XXX | 朝代：古蜀晚期 | 出土地：三星堆遗址 | 工艺：XXX
```

| 文件名 | 主题 | 实体ID | 重点内容 |
|--------|------|--------|---------|
| `knowledge-sanxingdui.txt` | 三星堆遗址概述 | - | 位置(广汉)、年代(4800-2600年)、1929发现、1986一二号坑、2020六坑、文明意义 |
| `knowledge-sacred-tree.txt` | 青铜神树 | HI-2025-006 | 高3.96米、三层九枝九鸟、盘龙、宇宙观(树通天地)、分段铸造 |
| `knowledge-vertical-eye-mask.txt` | 青铜纵目面具 | HI-2025-003 | 宽1.38米、凸目16cm、人神同形、祭祀通神法器 |
| `knowledge-standing-figure.txt` | 青铜大立人像 | HI-2025-005 | 高2.62米、华丽服饰、赤足站立、大祭司/国王、分段铸造 |
| `knowledge-gold-scepter.txt` | 金杖 | HI-2025-004 | 长1.43米、金箔包木杖、鱼鸟人头纹饰、王权象征、锤揲工艺 |
| `knowledge-gold-mask.txt` | 完整金面具 | HI-2025-002 | 金箔捶打、造型夸张、覆盖死者面部、王权/神权象征 |
| `knowledge-craft.txt` | 古蜀青铜与金器工艺 | - | 分段铸造法、嵌铸工艺、锤揲成型、纹饰刻画、焊接技术 |

### 文件2：知识检索模块

路径：`vue3/src/utils/knowledgeSearch.js`

**新建文件，完整代码如下：**

```js
// 知识检索模块 —— 本地文档库 + 关键词匹配 + TF-IDF 相似度
// 返回 top-3 最相关文档

// ==================== 配置 ====================

const DOC_FILES = [
  '/data/knowledge-sanxingdui.txt',
  '/data/knowledge-sacred-tree.txt',
  '/data/knowledge-vertical-eye-mask.txt',
  '/data/knowledge-standing-figure.txt',
  '/data/knowledge-gold-scepter.txt',
  '/data/knowledge-gold-mask.txt',
  '/data/knowledge-craft.txt'
]

// 专有名词映射 —— 用户口语 → 文档关键词
const ALIAS_MAP = {
  '神树': '青铜神树',
  '通天树': '青铜神树',
  '大立人': '青铜大立人像',
  '大立人像': '青铜大立人像',
  '纵目': '青铜纵目面具',
  '凸眼': '青铜纵目面具',
  '千里眼': '青铜纵目面具',
  '黄金面具': '完整金面具',
  '金面具': '完整金面具',
  '权杖': '金杖',
  '金杖': '金杖',
  '三星堆': '三星堆遗址',
  '古蜀': '古蜀文明',
  '青铜': '古蜀青铜与金器工艺',
  '金器': '古蜀青铜与金器工艺',
  '铸造': '古蜀青铜与金器工艺',
  '工艺': '古蜀青铜与金器工艺'
}

// ==================== 文档缓存 ====================

let docCache = null  // [{file, title, content, entityId}]

async function loadAllDocs() {
  if (docCache) return docCache

  const results = []
  for (const file of DOC_FILES) {
    try {
      const resp = await fetch(file)
      if (!resp.ok) continue
      const raw = await resp.text()
      const parsed = parseDoc(raw, file)
      if (parsed) results.push(parsed)
    } catch (e) {
      console.warn('知识文档加载失败:', file, e.message)
    }
  }

  docCache = results
  console.log('知识库加载完成，共', docCache.length, '份文档')
  return docCache
}

function parseDoc(raw, file) {
  const text = raw.trim()
  if (!text) return null

  // 提取首行作为标题
  const lines = text.split('\n')
  const title = lines[0].replace(/^#+\s*/, '').replace('标题：', '').trim()

  // 提取实体ID
  const entityMatch = text.match(/HI-\d{4}-\d{3}/)
  const entityId = entityMatch ? entityMatch[0] : null

  // 提取标签行中的属性（最后一行通常为标签行）
  const lastLine = lines[lines.length - 1]
  let tags = {}
  if (lastLine.includes('|')) {
    lastLine.split('|').forEach(part => {
      const [k, v] = part.split('：').map(s => s.trim())
      if (k && v) tags[k] = v
    })
  }

  return { file, title, content: text, entityId, tags }
}

// ==================== 分词 ====================

function tokenize(str) {
  // 中文按字符切分 + 英文数字按词切分
  // 过滤单字和停用词
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
    '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
    '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
    '什么', '怎么', '哪', '吗', '呢', '吧', '啊', '哦', '哈', '呀',
    '可以', '能', '应该', '这个', '那个', '哪个', '为什么', '因为',
    '所以', '但是', '虽然', '如果', '或者', '以及', '而且', '然后',
    '请问', '知道', '告诉', '介绍', '讲解', '说明', '讲一下', '说一下',
    '一下', '一点', '一些', '这种', '那种', '各种', '每个', '很多',
    '比较', '非常', '特别', '真的', '太', '更', '最', '还', '又', '再',
    '想', '想要', '需要', '想知道', '了解', '认识'
  ])

  // 中文：按字符 + 双字组合
  const cleaned = str.replace(/[，。！？、；：""''（）《》【】\s\\/\\-]+/g, ' ')
  const chars = cleaned.split('').filter(c => c !== ' ')
  const tokens = []

  for (let i = 0; i < chars.length; i++) {
    // 单字
    if (!stopWords.has(chars[i]) && !/[a-zA-Z0-9]/.test(chars[i])) {
      tokens.push(chars[i])
    }
    // 双字组合
    if (i < chars.length - 1) {
      const bigram = chars[i] + chars[i + 1]
      if (!stopWords.has(bigram) && !/[a-zA-Z0-9]{2}/.test(bigram)) {
        tokens.push(bigram)
      }
    }
  }

  // 英文/数字词
  const enTokens = cleaned.match(/[a-zA-Z0-9]+/g)
  if (enTokens) tokens.push(...enTokens)

  return tokens
}

// ==================== 匹配打分 ====================

function scoreDoc(question, doc) {
  let score = 0

  const qLower = question.toLowerCase()
  const dLower = doc.content.toLowerCase()

  const qTokens = tokenize(question)
  const dTokens = tokenize(doc.content)

  // 1. 专有名词精确匹配（高权重）
  for (const [alias, target] of Object.entries(ALIAS_MAP)) {
    if (qLower.includes(alias) && dLower.includes(target)) {
      score += 30
    }
  }

  // 2. 实体ID直接匹配
  if (doc.entityId) {
    const idShort = doc.entityId.slice(-3)  // 后三位数字
    if (qLower.includes(doc.entityId.toLowerCase()) || qLower.includes(idShort)) {
      score += 30
    }
  }

  // 3. 标题词匹配
  const titleTokens = tokenize(doc.title)
  for (const tt of titleTokens) {
    if (tt.length >= 2 && qLower.includes(tt)) {
      score += 20
    }
  }

  // 4. token重叠度
  const qTokenSet = new Set(qTokens)
  let overlap = 0
  for (const dt of dTokens) {
    if (qTokenSet.has(dt) && dt.length >= 2) {
      overlap++
    }
  }
  score += overlap * 2

  // 5. 标签字段匹配
  if (doc.tags) {
    for (const val of Object.values(doc.tags)) {
      if (val.length >= 2 && qLower.includes(val)) {
        score += 10
      }
    }
  }

  return score
}

// ==================== 对外接口 ====================

/**
 * 搜索知识库，返回 topK 个最相关的文档
 * @param {string} question - 用户问题
 * @param {number} topK - 返回文档数，默认3
 * @returns {Promise<Array<{title, content, entityId, score}>>}
 */
export async function searchKnowledge(question, topK = 3) {
  const docs = await loadAllDocs()
  if (!docs.length) return []

  const scored = docs.map(doc => ({
    title: doc.title,
    content: doc.content,
    entityId: doc.entityId,
    score: scoreDoc(question, doc)
  }))

  // 按分数降序排列
  scored.sort((a, b) => b.score - a.score)

  // 过滤掉0分的
  const relevant = scored.filter(d => d.score > 0)

  return relevant.slice(0, topK)
}

/**
 * 构建 RAG prompt
 * @param {string} question - 用户问题
 * @param {Array} docs - searchKnowledge 返回的文档列表
 * @returns {string} 拼装好的 system prompt
 */
export function buildRagPrompt(question, docs) {
  if (!docs.length) {
    return `你是玄喵，三星堆虚拟导游。用户问了一个超出你知识范围的问题："${question}"。请诚实告知你不知道，并引导用户询问青铜神树、黄金面具、金杖、青铜大立人、纵目面具等三星堆相关知识。控制在50字以内。`
  }

  const knowledgeParts = docs.map((d, i) =>
    `【资料${i + 1}】${d.title}\n${d.content}`
  ).join('\n\n')

  return `你是玄喵，一只可爱的虚拟猫导游，生活在三星堆数字博物馆。请严格根据以下参考资料回答用户问题。

## 回答规则
1. 优先使用参考资料中的准确信息，不要编造
2. 如果资料不足以回答，诚实说"这一点我还不太确定"
3. 语气亲切活泼，像一只学富五车的小猫
4. 控制在80-150字，说重点

## 参考资料
${knowledgeParts}

## 用户问题
${question}

请用玄喵的口吻回答（可以带"喵～"）：`
}
```

### 文件3：MiMo 对话 API

路径：`vue3/src/api/MiMoChatApi.js`

**新建文件，完整代码如下：**

```js
// 小米 MiMo 大模型对话 API（OpenAI 兼容协议）
// 直接从前端调用，不经过后端代理

const MIMO_CONFIG = {
  baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
  apiKey: 'tp-cw5krxeylfm24io4jrivrnxw6seswmf75lmymun04e80mk6w',
  model: 'mimo-v2.5-pro',
  maxTokens: 512,
  temperature: 0.7
}

/**
 * 非流式对话（一次性返回完整回答）
 * @param {string} systemPrompt - 系统提示词（RAG组装好的）
 * @param {string} userMessage - 用户问题
 * @returns {Promise<string>} AI回答
 */
export async function chat(systemPrompt, userMessage) {
  const body = {
    model: MIMO_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: MIMO_CONFIG.maxTokens,
    temperature: MIMO_CONFIG.temperature,
    stream: false
  }

  const resp = await fetch(`${MIMO_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MIMO_CONFIG.apiKey
    },
    body: JSON.stringify(body)
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => 'unknown')
    throw new Error(`MiMo API ${resp.status}: ${errText.slice(0, 200)}`)
  }

  const json = await resp.json()
  return json.choices[0].message.content
}

/**
 * 流式对话（SSE，逐字返回）
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userMessage - 用户问题
 * @param {Object} callbacks
 * @param {function(string)} callbacks.onToken - 每收到一个token
 * @param {function(string)} callbacks.onDone - 完整回答
 * @param {function(Error)} callbacks.onError - 出错
 */
export async function chatStream(systemPrompt, userMessage, { onToken, onDone, onError } = {}) {
  const body = {
    model: MIMO_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: MIMO_CONFIG.maxTokens,
    temperature: MIMO_CONFIG.temperature,
    stream: true
  }

  try {
    const resp = await fetch(`${MIMO_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MIMO_CONFIG.apiKey
      },
      body: JSON.stringify(body)
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'unknown')
      throw new Error(`MiMo API ${resp.status}: ${errText.slice(0, 200)}`)
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()  // 保留不完整的行

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const dataStr = trimmed.slice(5).trim()
        if (dataStr === '[DONE]') continue

        try {
          const json = JSON.parse(dataStr)
          const token = json.choices?.[0]?.delta?.content
          if (token) {
            fullText += token
            if (onToken) onToken(token)
          }
        } catch (e) {
          // 跳过无法解析的行
        }
      }
    }

    if (onDone) onDone(fullText)

  } catch (e) {
    if (onError) onError(e)
    else console.error('MiMo chatStream 错误:', e)
  }
}
```

---

## 你需要修改的文件（1个）

### 文件：vue3/src/components/Live2DAvatar.vue

**改3个地方：import、submitQuestion、删除旧逻辑。**

#### 修改1：顶部 import（约第84-85行）

找到：
```js
import { matchFixedAnswer } from '../config/chatReplyConfig.js';
import { synthesizeSpeech, revokeSpeechUrl, getVoices } from '../api/TtsApi.js';
```

替换为：
```js
import { synthesizeSpeech, revokeSpeechUrl, getVoices } from '../api/TtsApi.js';
import { searchKnowledge, buildRagPrompt } from '../utils/knowledgeSearch.js';
import { chatStream } from '../api/MiMoChatApi.js';
```

#### 修改2：submitQuestion 方法（约第457行）

找到整个 `submitQuestion` 方法，完整替换为：

```js
async submitQuestion() {
  const question = this.inputQuestion.trim();
  if (!question) return;

  this.closeInputDialog();

  // 显示加载状态
  this.startTypewriterEffect('喵～让我想想...', false);
  this.userInteracted = true;

  try {
    // 第一步：知识检索
    const docs = await searchKnowledge(question);

    // 第二步：组装 RAG prompt
    const systemPrompt = buildRagPrompt(question, docs);

    // 第三步：调 MiMo 流式生成
    let fullAnswer = '';
    let started = false;

    await chatStream(systemPrompt, question, {
      onToken: (token) => {
        if (!started) {
          // 收到第一个 token 时清掉"让我想想"
          this.clearAllTimers();
          this.stopAudio();
          this.displayedText = '';
          this.isSpeaking = true;
          this.isStopped = false;
          this.isHiding = false;
          const b = document.getElementById('ai-bubble');
          if (b) { b.style.display = 'block'; b.classList.add('speaking'); }
          started = true;
        }
        this.displayedText += token;
        this.checkScrollBar();
        this.scrollToBottom();
      },
      onDone: async (text) => {
        fullAnswer = text;
        this.isSpeaking = false;
        this.isStopped = true;
        this.fullTextToSpeak = fullAnswer;
        this.checkScrollBar();
        this.scheduleHide();

        // 生成语音
        if (fullAnswer) {
          try {
            const audioUrl = await synthesizeSpeech(fullAnswer, this.selectedVoice);
            if (!this.isDestroyed && audioUrl) {
              this.currentAudioUrl = audioUrl;
              this.audioEl = new Audio(audioUrl);
              this.audioEl.play();
            }
          } catch (e) {
            console.warn('TTS 生成失败:', e);
          }
        }
      },
      onError: (err) => {
        console.error('MiMo 对话失败:', err);
        this.clearAllTimers();
        this.stopAudio();
        this.displayedText = '喵～网络不太好，稍后再问我吧';
        this.isSpeaking = false;
        this.isStopped = true;
        this.scheduleHide();
      }
    });

  } catch (e) {
    console.error('知识检索失败:', e);
    this.clearAllTimers();
    this.stopAudio();
    this.displayedText = '喵～我的小脑袋有点晕，过会儿再来问我吧';
    this.isSpeaking = false;
    this.isStopped = true;
    this.scheduleHide();
  }
},
```

#### 修改3：handleMessage 保留但不再用于问答

WebSocket 的 `handleMessage` 方法保持不变（不需要改），因为 WebSocket 连接的代码也不动——它可能会用于其他功能。但实际上，玄喵问答不再走 WebSocket 了。**如果你确认 XunFeiTest 不再需要，可以做以下清理：**

- 删除 `initWS()` 方法的调用（mounted 里）
- 删除 `ws`、`wsReconnectTimer` 相关 data 和 methods
- 但建议先保留，等新流程稳定后再删，不影响功能

---

## 实施顺序（严格按这个来）

```
第1步：创建 7 个 knowledge-*.txt → public/data/
         ↓ 30-60 分钟
第2步：创建 knowledgeSearch.js → utils/
         ↓ 已提供完整代码，复制粘贴
第3步：创建 MiMoChatApi.js → api/
         ↓ 已提供完整代码，复制粘贴
第4步：修改 Live2DAvatar.vue 的 3 处
         ↓ 改 import + 替换 submitQuestion
第5步：测试

注意：第2、3、4步代码都给你写好了，只需要复制粘贴+保存。
      前端 Vite 热更新，保存后刷新页面即可，不用重启后端。
```

---

## 验收测试

修改完成后，打开前端页面，点击玄喵提问，逐条测试：

| # | 测试问题 | 期望回答 | 验证点 |
|---|---------|---------|--------|
| 1 | "青铜神树有什么特点" | 提到 3.96米、九只神鸟、宇宙观 | 知识文档被检索到 |
| 2 | "黄金面具怎么做的" | 提到金箔捶打、王权象征 | 工艺知识被注入 |
| 3 | "金杖上的纹饰是什么" | 提到鱼、鸟、人头纹饰 | 精准匹配金杖文档 |
| 4 | "纵目面具的眼睛为什么凸出来" | 提到人神同形、通神 | 纵目面具文档命中 |
| 5 | "古蜀人用什么工艺铸造青铜器" | 提到分段铸造、嵌铸 | 工艺文档被检索 |
| 6 | "今天天气怎么样" | 诚实说不知道，引导回三星堆话题 | 无匹配文档，兜底prompt生效 |
| 7 | "三星堆和金沙有什么关系" | 给出合理回答或诚实不知道 | 不编造、不崩溃 |

---

## 兜底策略

代码里已经内置了3层兜底：

| 场景 | 表现 |
|------|------|
| 知识库没匹配到任何文档 | RAG prompt 让 AI 诚实说"不知道"并引导回三星堆 |
| MiMo API 调用失败 | 显示"喵～网络不太好，稍后再问我吧" |
| 知识文档加载失败 | 显示"喵～我的小脑袋有点晕，过会儿再来问我吧" |

---

## 架构变化图

```
之前：
提问 → matchFixedAnswer(固定台词) ──未命中──→ WebSocket(XunFeiTest:8089) ──断开──→ "连接断开"
              ↓命中
          1-2句固定文案

之后：
提问 → searchKnowledge(7份txt, top3) → buildRagPrompt → MiMo API 流式 → 打字机逐字
                                                                 ↓失败
                                                          "网络不太好"
XunFeiTest WebSocket 不再参与问答流程
```

---

## 不改的东西

- `chatReplyConfig.js` —— 保留不动，万一新流程有问题可以快速切回
- `TtsService.java` —— 不动，TTS 照常工作
- `AiChatController.java` —— 不动，后台管理页的 AI 对话不受影响
- `application.yml` —— 不动，MiMo 配置已就绪
- XunFeiTest 后端 —— 不动，先保留
