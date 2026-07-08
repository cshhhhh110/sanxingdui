const PRESET_AUDIO_BASE = '/audio/xuanmiao-preset'

export const FIXED_REPLY_PRESETS = [
  {
    id: 'welcome',
    patterns: [/^(欢迎|欢迎语|开始介绍|开场)$/],
    reply: '欢迎来到青铜数元，我是 AI 虚拟向导玄喵。你可以直接问我三星堆文物、知识图谱、三维展馆和项目功能。'
  },
  {
    id: 'hello',
    patterns: [/^(你好|你好呀|你好啊|嗨|hi|hello|在吗|在不在|玄喵)$/i],
    reply: '你好呀，我是玄喵。想了解青铜神树、纵目面具、金杖、金面具，或者想让我带你逛展馆，都可以直接问我。'
  },
  {
    id: 'identity',
    patterns: [/^(你是谁|你是谁呀|你叫什么|你叫什么名字|介绍一下你自己)$/],
    reply: '我是玄喵，青铜数元里的 AI 虚拟向导。我会结合本地知识库和项目功能，帮你理解三星堆文物背后的文明线索。'
  },
  {
    id: 'capability',
    patterns: [/^(你能做什么|玄喵能做什么|有什么功能|你会什么)$/],
    reply: '我可以回答三星堆文化问题，带你查看文物线索，讲解知识图谱、三维展馆、时空探索、文创商城和答题学习功能。'
  },
  {
    id: 'how-to-ask',
    patterns: [/^(怎么提问|如何提问|我该怎么问|怎么和你对话)$/],
    reply: '你可以像聊天一样直接提问，例如青铜神树象征什么，纵目面具为什么特别，或者带我去看文创商城。'
  },
  {
    id: 'enter-museum',
    patterns: [/^(怎么进入展馆|如何进入展馆|怎么逛展馆|带我逛展馆)$/],
    reply: '你可以从首页进入三维数字展馆，也可以直接告诉我想看的文物，我会尽量帮你跳转到对应展线。'
  },
  {
    id: 'voice-question',
    patterns: [/^(怎么语音提问|如何语音提问|可以语音吗|语音怎么用)$/],
    reply: '点击玄喵提问框里的语音提问按钮，就可以用语音输入问题。识别完成后，我会根据问题进行讲解。'
  },
  {
    id: 'sanxingdui',
    patterns: [/^(三星堆是什么|介绍三星堆|三星堆简介|什么是三星堆)$/],
    reply: '三星堆是古蜀文明的重要遗址，出土了青铜神树、纵目面具、金杖等代表性文物，展现出独特的祭祀体系、工艺水平和审美想象。'
  },
  {
    id: 'ancient-shu',
    patterns: [/^(古蜀文明是什么|介绍古蜀文明|什么是古蜀文明)$/],
    reply: '古蜀文明是长江上游重要的区域文明。三星堆文物让我们看到古蜀人在祭祀、权力象征、青铜工艺和宇宙观上的独特表达。'
  },
  {
    id: 'sacred-tree',
    patterns: [/青铜神树|神树象征|通天神树/],
    reply: '青铜神树通常被理解为连接天地、人神沟通的象征。它复杂的枝干、神鸟和树形结构，体现了古蜀人对宇宙秩序和祭祀空间的想象。'
  },
  {
    id: 'eye-mask',
    patterns: [/纵目面具|青铜纵目|纵目为什么|面具为什么/],
    reply: '青铜纵目面具最突出的特征是夸张的眼部造型。它可能与神性观看、祖先崇拜和祭祀权威有关，是三星堆视觉形象中极具辨识度的符号。'
  },
  {
    id: 'standing-figure',
    patterns: [/青铜大立人|大立人像|立人像/],
    reply: '青铜大立人像体量巨大，姿态庄重，双手似乎曾持有器物。它常被视为祭祀主持者、权力人物或神职形象的重要表达。'
  },
  {
    id: 'gold-scepter',
    patterns: [/金杖|黄金杖|权杖/],
    reply: '金杖是三星堆权力与礼制的重要象征。其纹样和材质共同强化了身份、祭祀和统治权威的视觉表达。'
  },
  {
    id: 'gold-mask',
    patterns: [/金面具|黄金面具|完整金面具/],
    reply: '金面具以黄金材质和面部造型强化神圣感，体现了三星堆对身份、祭祀与审美表达的高度重视。'
  },
  {
    id: 'sacrificial-pits',
    patterns: [/祭祀坑|几号坑|器物坑|三星堆坑/],
    reply: '三星堆祭祀坑集中出土了大量青铜器、金器、玉石器和象牙等遗存，为理解古蜀礼仪活动和文明结构提供了关键线索。'
  },
  {
    id: 'knowledge-graph',
    patterns: [/知识图谱|图谱|关系网络|关系图谱/],
    reply: '知识图谱会把文物、遗址、时代、工艺和象征意义连接起来，让观众看到的不只是一件展品，而是一张古蜀文明关系网络。'
  },
  {
    id: 'rag',
    patterns: [/RAG|检索增强|智能问答|问答系统/i],
    reply: 'RAG 检索增强生成会先从本地知识库查找相关资料，再生成回答，这样可以降低幻觉风险，让讲解更可靠。'
  },
  {
    id: 'three-d-museum',
    patterns: [/3D|三维展馆|数字展馆|三维数字展馆|模型旋转/i],
    reply: '三维数字展馆支持文物旋转、缩放和细节观察，让观众从器型结构、纹饰特征到视觉风格获得更直观的沉浸体验。'
  },
  {
    id: 'spacetime',
    patterns: [/时空探索|时空展线|时代筛选|遗址筛选|工艺筛选/],
    reply: '时空探索模块可以按照历史时代、遗址空间和制作工艺筛选文物，帮助观众从多维视角进入三星堆文化。'
  },
  {
    id: 'shop',
    patterns: [/文创商城|商城|文创产品|购买文创|买文创/],
    reply: '文创商城把三星堆文化符号转化为可传播、可购买的产品，让文化展示进一步连接消费和传播场景。'
  },
  {
    id: 'study',
    patterns: [/研学|课程|学习模块|研学课程|文化学习/],
    reply: '研学课程模块承载三星堆历史、青铜工艺和文化知识内容，让文化理解从参观延伸到系统学习。'
  },
  {
    id: 'quiz',
    patterns: [/答题|刷题|题库|知识问答|挑战|证书/],
    reply: '答题系统通过刷题、挑战和成绩记录，把参观后的知识转化为互动学习体验，也适合研学和课堂场景。'
  },
  {
    id: 'ai-image',
    patterns: [/AI生图|生图|图像生成|生成图片|纹样生成/i],
    reply: 'AI 生图模块可以结合三星堆纹样和古蜀意象，辅助生成文化创意视觉内容，为文创设计提供灵感。'
  },
  {
    id: 'tech-stack',
    patterns: [/技术栈|用了什么技术|项目技术|技术融合/],
    reply: '项目融合 Vue three、Spring Boot、My S Q L、Three dot J S、知识图谱和大模型问答技术，实现展示、交互和智能导览的结合。'
  },
  {
    id: 'project-highlight',
    patterns: [/项目亮点|特色|创新点|有什么亮点/],
    reply: '青铜数元的亮点在于用知识图谱组织文化关系，用 RAG 提升讲解可靠性，再结合三维展馆和玄喵向导形成可交互的寻踪体验。'
  },
  {
    id: 'culture-value',
    patterns: [/文化价值|社会价值|有什么价值|意义是什么/],
    reply: '这个系统让三星堆文化以更智能、更年轻、更可交互的方式被看见、被理解、被传承，也能服务博物馆研学和线上展览。'
  },
  {
    id: 'future-plan',
    patterns: [/未来规划|后续计划|以后怎么做|发展方向/],
    reply: '未来可以继续扩展文物数据和三维模型资源，接入更多博物馆研学、线上展览和文化教育场景。'
  },
  {
    id: 'searching',
    patterns: [/^(请稍等|稍等|正在查询|帮我查一下)$/],
    reply: '好的，我正在整理相关线索。你也可以补充文物名称、遗址空间或工艺关键词，我会讲得更准确。'
  },
  {
    id: 'not-understood',
    patterns: [/^(没听清|听不懂|你没听懂|重新说)$/],
    reply: '没关系，你可以换一种说法，或者直接说文物名称，比如青铜神树、纵目面具、金杖和金面具。'
  },
  {
    id: 'network-error',
    patterns: [/^(网络异常|出错了|没有声音|你怎么不说话)$/],
    reply: '如果暂时没有声音，可能是浏览器拦截了音频或网络请求较慢。你可以先点击页面任意位置，再重新向我提问。'
  },
  {
    id: 'login-required',
    patterns: [/^(需要登录吗|为什么要登录|登录有什么用)$/],
    reply: '浏览文物和提问通常不需要登录。涉及订单、个人中心或学习记录时，系统会提示你先登录。'
  },
  {
    id: 'navigate-done',
    patterns: [/^(跳转完成|打开完成|操作完成|完成了)$/],
    reply: '已经完成啦。你可以继续告诉我想看哪件文物，或者问我这页内容背后的文化线索。'
  }
]

function normalizeMessage(message) {
  return String(message || '')
    .trim()
    .replace(/[，。！？、,.?！\s]/g, '')
    .toLowerCase()
}

const ACTION_REQUEST_PATTERN = /(打开|进入|前往|跳转|带我去|带我到|搜索|搜一下|查找|购买|下单|加入购物车|查看|播放|开始|继续|返回|定位)/
const SAFE_FIXED_REPLY_IDS = new Set([
  'welcome',
  'hello',
  'identity',
  'capability',
  'how-to-ask',
  'enter-museum',
  'voice-question',
  'searching',
  'not-understood',
  'network-error',
  'login-required',
  'navigate-done'
])

export function getPresetAudioUrl(id, voice = 'default') {
  return `${PRESET_AUDIO_BASE}/preset.${id}.${voice}.wav`
}

export function matchFixedAnswer(message) {
  const msg = normalizeMessage(message)
  if (!msg) return null
  if (ACTION_REQUEST_PATTERN.test(msg)) return null

  for (const rule of FIXED_REPLY_PRESETS) {
    if (!SAFE_FIXED_REPLY_IDS.has(rule.id)) continue
    if (rule.patterns.some((pattern) => pattern.test(msg))) {
      return {
        id: rule.id,
        reply: rule.reply,
        audioUrl: getPresetAudioUrl(rule.id, 'default')
      }
    }
  }

  return null
}
