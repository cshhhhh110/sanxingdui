// 玄喵轻量固定问答配置
// 只保留最基础的打招呼与身份介绍，避免抢占 RAG 正式讲解入口。
const GREETING_RULES = [
  {
    patterns: [/^你好$/, /^你好呀$/, /^你好啊$/, /^嗨$/, /^hello$/i, /^hi$/i, /^在吗$/, /^在不在$/, /^玄喵$/, /^你是谁$/, /^你是谁呀$/, /^你叫什么$/, /^你叫什么名字$/],
    reply: '嗨～我是玄喵，直接问我青铜神树、纵目面具、金杖或黄金面具就行。'
  }
]

export function matchFixedAnswer(message) {
  const msg = String(message || '').trim().toLowerCase()
  if (!msg) return null

  for (const rule of GREETING_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(msg))) {
      return rule.reply
    }
  }

  return null
}
