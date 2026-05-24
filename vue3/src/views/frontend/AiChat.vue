<template>
  <main class="ai-guide-page">
    <section class="guide-hero showcase-enter" aria-label="三星堆智能解说入口">
      <div class="hero-avatar showcase-float" style="--delay: 0.15s">
        <img :src="aiAvatar" alt="三星堆智能解说头像" />
      </div>

      <div class="hero-copy">
        <p class="hero-kicker">玄喵讲解</p>
        <h1>让玄喵把你刚看过的文物串起来讲</h1>
        <div class="hero-subtitle">
          <span class="line-dot" aria-hidden="true"></span>
          它不是通用聊天框，而是一位会记得你刚才站在哪里的讲解员
          <span class="line-dot" aria-hidden="true"></span>
        </div>
      </div>

      <div class="hero-status showcase-card-hover">
        <span class="status-light" aria-hidden="true"></span>
        图谱增强解说模式
      </div>
    </section>

    <section
      v-if="hasArtifactContext"
      class="context-banner showcase-enter"
      style="--delay: 0.08s"
      aria-label="当前解说上下文"
    >
      <div class="context-copy">
        <p class="context-kicker">当前焦点</p>
        <h2>{{ contextTitle }}</h2>
        <p class="context-journey-line">{{ contextJourneyLine }}</p>
        <p class="context-summary">
          当前问答已绑定核心文物上下文。玄喵会把你刚看过的文物、遗址、年代与工艺一起带入讲解，尽量让回答像串讲，而不是单点问答。
        </p>
      </div>

      <dl class="context-facts">
        <div class="showcase-card-hover">
          <dt>文物主键</dt>
          <dd>{{ artifactContext?.entityId || route.query.entityId || '待补充' }}</dd>
        </div>
        <div class="showcase-card-hover">
          <dt>遗址</dt>
          <dd>{{ contextSite }}</dd>
        </div>
        <div class="showcase-card-hover">
          <dt>年代</dt>
          <dd>{{ contextEra }}</dd>
        </div>
        <div class="showcase-card-hover">
          <dt>工艺</dt>
          <dd>{{ contextCraftLabel }}</dd>
        </div>
      </dl>

      <div class="context-actions">
        <button
          class="context-button context-button--primary showcase-button-hover"
          type="button"
          @click="goToModel"
        >
          {{ competitionActionLabels.backArtifact3d }}
        </button>
        <button
          class="context-button showcase-button-hover"
          type="button"
          @click="goToExploration"
        >
          {{ competitionActionLabels.backExplore }}
        </button>
      </div>
    </section>

    <section class="chat-shell showcase-enter" style="--delay: 0.14s" aria-label="三星堆智能问答区">
      <aside class="quick-panel" aria-label="快捷问题分类">
        <button
          v-for="card in quickCards"
          :key="card.key"
          type="button"
          class="quick-card showcase-card-hover"
          :class="{ 'quick-card--active': activeQuickCard === card.key }"
          :aria-pressed="activeQuickCard === card.key"
          @click="handleQuickCard(card.key)"
        >
          <span class="quick-icon">
            <i :class="card.icon"></i>
          </span>
          <span class="quick-text">
            <strong>{{ card.title }}</strong>
            <small>{{ card.subtitle }}</small>
          </span>
        </button>
      </aside>

      <section class="chat-panel">
        <div ref="messagesContainer" class="message-scroll" aria-live="polite">
          <article
            v-for="messageItem in messages"
            :key="messageItem.id"
            class="message-row showcase-enter"
            :class="`message-row--${messageItem.role}`"
          >
            <div v-if="messageItem.role === 'assistant'" class="message-avatar">
              <img :src="aiAvatar" alt="AI" />
            </div>

            <div class="message-stack">
              <div class="message-bubble">
                <p v-for="line in messageItem.content" :key="line">{{ line }}</p>
              </div>
              <time>{{ messageItem.time }}</time>
            </div>

            <div v-if="messageItem.role === 'user'" class="user-avatar" aria-hidden="true">
              <img v-if="currentUserAvatar" :src="currentUserAvatar" alt="" />
              <i v-else class="fas fa-user"></i>
            </div>
          </article>

          <article v-if="isThinking && showThinkingBubble" class="message-row message-row--assistant message-row--thinking">
            <div class="message-stack">
              <div class="message-bubble thinking-bubble">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </article>
        </div>

        <div ref="suggestionRow" class="suggestion-row" aria-label="推荐问题">
          <button
            v-for="question in currentSuggestQuestions"
            :key="question.text"
            type="button"
            class="suggestion-pill showcase-button-hover"
            @click="handleSuggest(question.text)"
          >
            <i :class="question.icon"></i>
            <span>{{ question.text }}</span>
          </button>
        </div>

        <form class="composer" @submit.prevent="sendMessage()">
          <div class="input-wrap">
            <textarea
              v-model="draft"
              rows="1"
              maxlength="500"
              :placeholder="composerPlaceholder"
              @keydown.enter.exact.prevent="sendMessage()"
            />
          </div>

          <button
            type="button"
            class="voice-button showcase-button-hover"
            :class="{ 'voice-button--active': isListening }"
            :disabled="!voiceInputSupported || isThinking"
            :title="voiceInputSupported ? (isListening ? '停止语音输入' : '开始语音输入') : '当前浏览器不支持语音输入'"
            @click="toggleVoiceInput"
          >
            <i :class="isListening ? 'fas fa-stop' : 'fas fa-microphone'"></i>
          </button>

          <button
            class="send-button showcase-button-hover"
            type="submit"
            :disabled="!draft.trim() || isThinking"
          >
            <i class="fas fa-paper-plane"></i>
            {{ competitionActionLabels.send }}
          </button>
        </form>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { createSession as createSessionApi, getChatStreamUrl } from '@/api/AiChatApi'
import { matchFixedAnswer } from '@/config/chatReplyConfig'
import { buildFallbackReply, buildRagPrompt, searchKnowledge } from '@/utils/knowledgeSearch'
import { createBrowserSpeechRecognition, getBrowserSpeechRecognitionCtor } from '@/utils/browserSpeech'
import { formatYearRange } from '@/data/competitionArtifacts'
import { competitionActionLabels } from '@/data/competitionUi'
import { getSpacetimeArtifactDetail } from '@/api/SpacetimeApi'
import aiAvatar from '@/assets/sanxingdui-ai-chat/ai-avatar.png'
import { getRecentArtifactTrail, pushCompetitionTrail } from '@/utils/competitionTrail'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const messagesContainer = ref(null)
const suggestionRow = ref(null)
const suggestionLimit = ref(4)
const draft = ref('')
const isThinking = ref(false)
const showThinkingBubble = ref(false)
const isListening = ref(false)
const currentSessionId = ref(null)
const activeQuickCard = ref('hot')
const artifactContext = ref(null)
const lastAutoAskedEntityId = ref('')

const quickCards = [
  {
    key: 'hot',
    title: '热门问题',
    subtitle: '快速进入状态',
    icon: 'fas fa-fire'
  },
  {
    key: 'artifact',
    title: '文物解说',
    subtitle: '围绕当前文物',
    icon: 'fas fa-cube'
  },
  {
    key: 'knowledge',
    title: '文明知识',
    subtitle: '补充背景脉络',
    icon: 'fas fa-book-open'
  },
  {
    key: 'timeline',
    title: '时空脉络',
    subtitle: '聚焦年代与遗址',
    icon: 'fas fa-clock'
  }
]

const defaultSuggestQuestionGroups = {
  hot: [
    { text: '三星堆最具代表性的文物有哪些？', icon: 'fas fa-landmark' },
    { text: '三星堆文明为什么会让人觉得神秘？', icon: 'fas fa-star' },
    { text: '祭祀坑的发现意味着什么？', icon: 'fas fa-box-archive' },
    { text: '三星堆和金沙之间有什么联系？', icon: 'fas fa-link' }
  ],
  artifact: [
    { text: '这件文物最值得关注的工艺特点是什么？', icon: 'fas fa-hammer' },
    { text: '它在古蜀祭祀体系中可能承担什么角色？', icon: 'fas fa-torii-gate' },
    { text: '它和其他核心文物相比有什么独特之处？', icon: 'fas fa-scale-balanced' },
    { text: '如果用于答辩，这件文物应该怎么讲？', icon: 'fas fa-microphone-lines' }
  ],
  knowledge: [
    { text: '古蜀文明的宇宙观有哪些典型体现？', icon: 'fas fa-sun' },
    { text: '三星堆青铜铸造技术为什么先进？', icon: 'fas fa-industry' },
    { text: '三星堆和中原文明是怎样交流的？', icon: 'fas fa-route' },
    { text: '古蜀文明的审美风格有哪些特点？', icon: 'fas fa-feather-pointed' }
  ],
  timeline: [
    { text: '这件文物大致处于什么时代？', icon: 'fas fa-hourglass-half' },
    { text: '三星堆到金沙的文化传承如何理解？', icon: 'fas fa-timeline' },
    { text: '祭祀活动在不同时期有什么变化？', icon: 'fas fa-clock-rotate-left' },
    { text: '如果按时间排序，哪些文物最能讲清演变？', icon: 'fas fa-arrow-trend-up' }
  ]
}

const hasArtifactContext = computed(() => {
  return Boolean(route.query.entityId || route.query.title || artifactContext.value)
})

const recentArtifacts = computed(() => getRecentArtifactTrail(2))
const previousArtifact = computed(() => {
  if (!artifactContext.value?.entityId) {
    return recentArtifacts.value[0] || null
  }

  return recentArtifacts.value.find((item) => item.entityId !== artifactContext.value.entityId) || null
})

const contextTitle = computed(() => {
  return (
    artifactContext.value?.displayTitle ||
    artifactContext.value?.title ||
    route.query.title ||
    '当前焦点文物'
  )
})

const contextSite = computed(() => {
  return (
    artifactContext.value?.siteLabel ||
    artifactContext.value?.siteNameZh ||
    route.query.siteCode ||
    '待补充'
  )
})

const contextEra = computed(() => {
  if (artifactContext.value?.yearLabel) {
    return artifactContext.value.yearLabel
  }

  if (
    typeof artifactContext.value?.timeStartYear === 'number' &&
    typeof artifactContext.value?.timeEndYear === 'number'
  ) {
    return formatYearRange(artifactContext.value.timeStartYear, artifactContext.value.timeEndYear)
  }

  return artifactContext.value?.eraLabel || route.query.eraCode || '待补充'
})

const contextCraftLabel = computed(() => {
  return artifactContext.value?.craftLabel || artifactContext.value?.craftNamesZh?.join(' / ') || '待补充'
})

const contextJourneyLine = computed(() => {
  if (previousArtifact.value?.title) {
    return `你刚从 ${previousArtifact.value.title} 继续走来，现在轮到玄喵把它和 ${contextTitle.value} 串起来讲。`
  }

  return `你已经从 3D 展台进入讲解区，玄喵会先围绕 ${contextTitle.value}，再把相关文物与时空线索一并串联起来。`
})

const composerPlaceholder = computed(() => {
  if (hasArtifactContext.value) {
    return `围绕“${contextTitle.value}”提问，例如它的象征意义、工艺特点或时代背景`
  }

  return '请输入你想了解的三星堆相关问题'
})

const currentSuggestQuestions = computed(() => {
  const suggestionGroups = buildContextSuggestionGroups()
  const baseGroup = suggestionGroups[activeQuickCard.value] || suggestionGroups.hot
  return baseGroup.slice(0, suggestionLimit.value)
})

const currentUserAvatar = computed(() => {
  return normalizeAvatarUrl(
    userStore.avatar ||
      userStore.userInfo?.avatarUrl ||
      userStore.userInfo?.userAvatar ||
      userStore.userInfo?.headImg ||
      ''
  )
})

const voiceInputSupported = computed(() => Boolean(getBrowserSpeechRecognitionCtor()))

let suggestionResizeObserver = null
let lastSuggestionRowWidth = 0
let chatAbortController = null
let speechRecognition = null

const messages = ref([])

watch(
  () => route.fullPath,
  async () => {
    await initializeConversation()
  }
)

onMounted(async () => {
  await initializeConversation()

  nextTick(() => {
    syncSuggestionLimit()
    if (suggestionRow.value && typeof ResizeObserver !== 'undefined') {
      suggestionResizeObserver = new ResizeObserver((entries) => {
        const nextWidth = entries[0]?.contentRect?.width || 0
        if (Math.abs(nextWidth - lastSuggestionRowWidth) < 2) {
          return
        }

        lastSuggestionRowWidth = nextWidth
        suggestionLimit.value = 4
        syncSuggestionLimit()
      })
      suggestionResizeObserver.observe(suggestionRow.value)
    }
  })
})

onBeforeUnmount(() => {
  suggestionResizeObserver?.disconnect()
  chatAbortController?.abort?.()
  stopVoiceInput()
})

async function initializeConversation() {
  chatAbortController?.abort?.()
  await loadArtifactContext()
  resetMessages()
  void maybeAutoStartGuide()
}

async function loadArtifactContext() {
  if (!route.query.entityId) {
    artifactContext.value = null
    return
  }

  try {
    artifactContext.value = await getSpacetimeArtifactDetail({ entityId: route.query.entityId }, { showDefaultMsg: false })
    if (artifactContext.value?.entityId) {
      pushCompetitionTrail({
        entityId: artifactContext.value.entityId,
        title: artifactContext.value.displayTitle,
        siteLabel: artifactContext.value.siteLabel,
        eraLabel: artifactContext.value.eraLabel,
        stage: 'ai-chat',
        sourceStage: 'ai-chat',
        reason: route.query.entryReason || ''
      })
    }
  } catch (error) {
    console.error('\u52a0\u8f7d\u6587\u7269\u4e0a\u4e0b\u6587\u5931\u8d25:', error)
    artifactContext.value = null
  }
}

function buildContextSuggestionGroups() {
  if (!hasArtifactContext.value) {
    return defaultSuggestQuestionGroups
  }

  return {
    hot: [
      { text: `${contextTitle.value}最核心的文化意义是什么？`, icon: 'fas fa-star' },
      { text: `${contextTitle.value}为什么适合作为主讲文物？`, icon: 'fas fa-award' },
      { text: `${contextTitle.value}和三星堆祭祀体系有什么关系？`, icon: 'fas fa-torii-gate' },
      { text: `${contextTitle.value}能体现古蜀文明的哪些特点？`, icon: 'fas fa-lightbulb' }
    ],
    artifact: [
      { text: `${contextTitle.value}采用了哪些关键工艺？`, icon: 'fas fa-hammer' },
      { text: `${contextTitle.value}的造型设计说明了什么？`, icon: 'fas fa-drafting-compass' },
      { text: `${contextTitle.value}和同类文物相比有什么独特之处？`, icon: 'fas fa-scale-balanced' },
      { text: `${contextTitle.value}的答辩解说词可以怎么讲？`, icon: 'fas fa-microphone-lines' }
    ],
    knowledge: [
      { text: `${contextTitle.value}反映了怎样的古蜀宇宙观？`, icon: 'fas fa-sun' },
      { text: `${contextTitle.value}与古蜀王权或神权有什么联系？`, icon: 'fas fa-crown' },
      { text: `${contextTitle.value}能否说明三星堆与外部文明的交流？`, icon: 'fas fa-route' },
      { text: `${contextTitle.value}为什么有这么强的视觉冲击力？`, icon: 'fas fa-eye' }
    ],
    timeline: [
      { text: `${contextTitle.value}大致属于哪个时间阶段？`, icon: 'fas fa-hourglass-half' },
      { text: `${contextTitle.value}与金沙文化之间有没有传承线索？`, icon: 'fas fa-timeline' },
      { text: `${contextTitle.value}在演变脉络中处于什么位置？`, icon: 'fas fa-arrow-trend-up' },
      { text: `${contextTitle.value}适合怎样放进时空漫游叙事？`, icon: 'fas fa-map-location-dot' }
    ]
  }
}

function createInitialMessages() {
  const welcome = {
    id: 1,
    role: 'assistant',
    content: [
      '\u6b22\u8fce\u6765\u5230\u7384\u55b5\u8bb2\u89e3\u53f0\u3002\u6211\u4e0d\u4f1a\u53ea\u628a\u7b54\u6848\u629b\u7ed9\u4f60\uff0c\u800c\u662f\u4f1a\u6309\u201c\u8fd9\u662f\u4ec0\u4e48\u3001\u4e3a\u4ec0\u4e48\u91cd\u8981\u3001\u5b83\u548c\u8c01\u6709\u5173\u3001\u4f60\u4e0b\u4e00\u6b65\u8fd8\u80fd\u770b\u4ec0\u4e48\u201d\u7684\u987a\u5e8f\uff0c\u628a\u6587\u7269\u8bb2\u6210\u4e00\u6bb5\u5b8c\u6574\u6545\u4e8b\u3002'
    ],
    time: getCurrentTime()
  }

  if (!hasArtifactContext.value) {
    return [welcome]
  }

  const secondLines = [
    `\u5f53\u524d\u5df2\u9501\u5b9a\u89e3\u8bf4\u5bf9\u8c61\uff1a${contextTitle.value}\u3002`,
    route.query.entryReason
      ? `\u4f60\u4e4b\u6240\u4ee5\u8d70\u5230\u8fd9\u91cc\uff0c\u662f\u56e0\u4e3a\uff1a${route.query.entryReason}`
      : `\u6211\u4f1a\u5148\u56f4\u7ed5 ${contextTitle.value} \u7684\u51fa\u571f\u5730\u3001\u5e74\u4ee3\u3001\u5de5\u827a\u548c\u5bd3\u610f\u6765\u5c55\u5f00\u3002`
  ]

  if (previousArtifact.value?.title) {
    secondLines.push(`\u4f60\u521a\u624d\u8fd8\u770b\u8fc7 ${previousArtifact.value.title}\uff0c\u5982\u679c\u4f60\u613f\u610f\uff0c\u6211\u4e5f\u53ef\u4ee5\u628a\u5b83\u4eec\u653e\u5728\u4e00\u8d77\u6bd4\u8f83\u5de5\u827a\u4e0e\u8c61\u5f81\u610f\u4e49\u3002`)
  } else {
    secondLines.push('\u4f60\u53ef\u4ee5\u76f4\u63a5\u95ee\u6211\u5b83\u7684\u6587\u5316\u610f\u4e49\u3001\u5de5\u827a\u7279\u70b9\uff0c\u6216\u8005\u8ba9\u7384\u55b5\u5e2e\u4f60\u7ec4\u7ec7\u4e00\u6bb5\u7b54\u8fa9\u89e3\u8bf4\u8bcd\u3002')
  }

  return [
    welcome,
    {
      id: 2,
      role: 'assistant',
      content: secondLines,
      time: getCurrentTime()
    }
  ]
}

function resetMessages() {
  currentSessionId.value = null
  messages.value = createInitialMessages()
  scrollToBottom()
}

function getCurrentArtifactEntityId() {
  return artifactContext.value?.entityId || route.query.entityId || ''
}

function updateAssistantMessageById(messageId, content, fallbackTime = '') {
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }

  targetMessage.content = Array.isArray(content) ? content : [content]
  if (fallbackTime && !targetMessage.time) {
    targetMessage.time = fallbackTime
  }
  scrollToBottom()
}

function appendAssistantPlaceholder(content = '...') {
  const id = Date.now() + Math.random()
  messages.value.push({
    id,
    role: 'assistant',
    content: [content],
    time: getCurrentTime()
  })
  scrollToBottom()
  return id
}

function buildAutoGuideQuestion() {
  return '请你以三星堆数字展馆讲解员“玄喵”的口吻，围绕当前文物先做一段开场讲解。按“这是什么、为什么重要、它和什么有关、下一步还可以看什么”的顺序来讲，控制在四句以内，语言自然、适合答辩演示。'
}

async function maybeAutoStartGuide() {
  const entityId = getCurrentArtifactEntityId()
  if (!entityId || entityId === lastAutoAskedEntityId.value) {
    return
  }

  lastAutoAskedEntityId.value = entityId
  await requestAutoGuide(entityId)
}

async function requestAutoGuide(expectedEntityId) {
  const question = buildAutoGuideQuestion()
  let docs = []
  let userMessage = question

  const placeholderId = Date.now() + Math.random()
  messages.value.push({
    id: placeholderId,
    role: 'assistant',
    content: ['玄喵正在结合当前文物整理讲解线索……'],
    time: getCurrentTime()
  })
  scrollToBottom()
  updateAssistantMessageById(placeholderId, '...')

  try {
    docs = await searchKnowledge(question, 1)
    userMessage = buildPromptWithContext(question, docs)
  } catch (error) {
    console.warn('自动讲解检索失败，继续使用当前文物上下文生成讲解。', error)
  }

  if (!currentSessionId.value) {
    await createSession()
  }

  if (!currentSessionId.value) {
    updateAssistantMessageById(placeholderId, getMockReply(question, docs))
    return
  }

  isThinking.value = true
  showThinkingBubble.value = false
  chatAbortController?.abort?.()
  const controller = new AbortController()
  chatAbortController = controller
  let aiResponse = ''
  const token = userStore.token
  const headers = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    await fetchEventSource(getChatStreamUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId: currentSessionId.value,
        userMessage
      }),
      signal: controller.signal,
      openWhenHidden: true,
      onmessage(event) {
        if (event.data === '[DONE]') {
          isThinking.value = false
          if (!aiResponse) {
            updateAssistantMessageById(placeholderId, getMockReply(question, docs))
          }
          return
        }

        if (event.data.startsWith('[ERROR]')) {
          isThinking.value = false
          updateAssistantMessageById(placeholderId, getMockReply(question, docs))
          return
        }

        aiResponse += event.data
        updateAssistantMessageById(placeholderId, aiResponse)
      },
      onerror(error) {
        if (controller.signal.aborted || getCurrentArtifactEntityId() !== expectedEntityId) {
          return 0
        }
        console.error('自动讲解 SSE 连接失败:', error)
        isThinking.value = false
        updateAssistantMessageById(placeholderId, getMockReply(question, docs))
        return 999999999
      },
      onclose() {
        isThinking.value = false
      }
    })
  } catch (error) {
    if (!controller.signal.aborted && getCurrentArtifactEntityId() === expectedEntityId) {
      console.error('自动讲解请求失败:', error)
      updateAssistantMessageById(placeholderId, getMockReply(question, docs))
    }
    isThinking.value = false
  } finally {
    if (chatAbortController === controller) {
      chatAbortController = null
    }
  }
}

function syncSuggestionLimit() {
  nextTick(() => {
    const row = suggestionRow.value
    if (!row) {
      return
    }

    const pills = Array.from(row.children)
    if (pills.length < 4) {
      return
    }

    const firstTop = pills[0]?.offsetTop || 0
    const hasWrapped = pills.some((pill) => pill.offsetTop > firstTop + 2)
    suggestionLimit.value = hasWrapped ? 3 : 4
  })
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function appendAssistantMessage(content) {
  const lines = Array.isArray(content) ? content : [content]
  messages.value.push({
    id: Date.now() + Math.random(),
    role: 'assistant',
    content: lines,
    time: getCurrentTime()
  })
  scrollToBottom()
}

async function createSession() {
  try {
    const title = hasArtifactContext.value
      ? `三星堆解说 - ${contextTitle.value}`
      : '三星堆智能助手'
    const sessionId = await createSessionApi(title, {
      showDefaultMsg: false
    })
    currentSessionId.value = sessionId
  } catch (error) {
    currentSessionId.value = null
    console.error('创建 AI 会话失败:', error)
  }
}

function getCurrentContextPayload() {
  if (!hasArtifactContext.value) {
    return null
  }

  return {
    title: contextTitle.value,
    entityId: artifactContext.value?.entityId || route.query.entityId || '',
    site: contextSite.value,
    era: contextEra.value,
    craft: contextCraftLabel.value,
    summary: artifactContext.value?.summary || '',
    previousTitle: previousArtifact.value?.title || '',
    previousSite: previousArtifact.value?.siteLabel || '',
    previousEra: previousArtifact.value?.eraLabel || '',
    entryReason: route.query.entryReason || ''
  }
}

function getMockReply(question = '', docs = []) {
  return buildFallbackReply(question, docs, getCurrentContextPayload() || {})
}

function buildPromptWithContext(question, docs = []) {
  return buildRagPrompt(question, docs, getCurrentContextPayload() || {})
}

function handleQuickCard(key) {
  activeQuickCard.value = key
  suggestionLimit.value = 4
  syncSuggestionLimit()
}

function handleSuggest(question) {
  sendMessage(question)
}

function stopVoiceInput() {
  if (speechRecognition) {
    try {
      speechRecognition.abort()
    } catch (error) {
      console.warn('语音输入停止失败:', error)
    }
  }
  speechRecognition = null
  isListening.value = false
}

function ensureVoiceInput() {
  if (speechRecognition) {
    return speechRecognition
  }

  const recognition = createBrowserSpeechRecognition()
  if (!recognition) {
    return null
  }

  recognition.onstart = () => {
    isListening.value = true
  }

  recognition.onresult = (event) => {
    let transcript = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      transcript += event.results[i][0]?.transcript || ''
    }

    const text = transcript.trim()
    if (text) {
      draft.value = text
    }
  }

  recognition.onerror = (event) => {
    isListening.value = false
    speechRecognition = null
    if (event?.error && event.error !== 'aborted') {
      message.warning('语音输入暂时不可用，请改用文字输入。')
    }
  }

  recognition.onend = () => {
    isListening.value = false
    speechRecognition = null
  }

  speechRecognition = recognition
  return speechRecognition
}

function toggleVoiceInput() {
  if (!voiceInputSupported.value) {
    message.warning('当前浏览器不支持语音输入。')
    return
  }

  if (isThinking.value) {
    return
  }

  if (isListening.value) {
    stopVoiceInput()
    return
  }

  const recognition = ensureVoiceInput()
  if (!recognition) {
    message.warning('当前浏览器不支持语音输入。')
    return
  }

  try {
    recognition.start()
  } catch (error) {
    console.warn('启动语音输入失败:', error)
    message.warning('语音输入启动失败，请稍后再试。')
  }
}

async function sendMessage(presetQuestion = '') {
  const question = (presetQuestion || draft.value).trim()
  if (!question || isThinking.value) {
    return
  }

  stopVoiceInput()

  const fixedAnswer = matchFixedAnswer(question)

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: [question],
    time: getCurrentTime()
  })
  draft.value = ''
  scrollToBottom()
  const assistantPlaceholderId = appendAssistantPlaceholder()

  if (fixedAnswer) {
    updateAssistantMessageById(assistantPlaceholderId, fixedAnswer)
    return
  }

  let docs = []
  let userMessage = question

  try {
          docs = await searchKnowledge(question, 1)
    userMessage = buildPromptWithContext(question, docs)
  } catch (error) {
    console.warn('本地知识检索失败，降级为原始问题:', error)
  }

  if (!currentSessionId.value) {
    await createSession()
  }

  if (!currentSessionId.value) {
    updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
    return
  }

  isThinking.value = true
  showThinkingBubble.value = false
  chatAbortController?.abort?.()
  chatAbortController = new AbortController()

  let aiResponse = ''
  const token = userStore.token
  const headers = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    await fetchEventSource(getChatStreamUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId: currentSessionId.value,
        userMessage
      }),
      signal: chatAbortController.signal,
      openWhenHidden: true,
      onmessage(event) {
        if (event.data === '[DONE]') {
          isThinking.value = false
          if (!aiResponse) {
            updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
          }
          return
        }

        if (event.data.startsWith('[ERROR]')) {
          isThinking.value = false
          message.warning('AI 响应暂不可用，已切换为本地知识讲解')
          updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
          return
        }

        aiResponse += event.data
        updateAssistantMessageById(assistantPlaceholderId, aiResponse)
      },
      onerror(error) {
        console.error('AI SSE 连接失败:', error)
        isThinking.value = false
        updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
        return 999999999
      },
      onclose() {
        isThinking.value = false
      }
    })
  } catch (error) {
    console.error('发送 AI 消息失败:', error)
    isThinking.value = false
    updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
  } finally {
    chatAbortController = null
  }
}

function goToModel() {
  router.push({
    path: '/3d',
    query: {
      entityId: artifactContext.value?.entityId || route.query.entityId || '',
      title: contextTitle.value,
      siteCode: artifactContext.value?.siteCode || route.query.siteCode || '',
      eraCode: artifactContext.value?.eraCode || route.query.eraCode || '',
      glbUrl: artifactContext.value?.resolvedGlbUrl || route.query.glbUrl || ''
    }
  })
}

function goToExploration() {
  router.push({
    path: '/tanmi',
    query: {
      siteCode: artifactContext.value?.siteCode || route.query.siteCode || '',
      eraCode: artifactContext.value?.eraCode || route.query.eraCode || '',
      craftCode: artifactContext.value?.craftCodes?.[0] || ''
    }
  })
}

function normalizeAvatarUrl(avatar) {
  if (!avatar) {
    return ''
  }

  if (/^https?:\/\//i.test(avatar)) {
    return avatar
  }

  const baseURL = import.meta.env.VITE_APP_BASE_API || import.meta.env.VUE_APP_BASE_API || '/api'
  const staticBaseURL = baseURL.replace(/\/api\/?$/, '')
  const cleanPath = avatar.replace(/\\/g, '/').replace(/^\/+/, '')
  return `${staticBaseURL}/${cleanPath}`
}

function getCurrentTime() {
  const date = new Date()
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}
</script>

<style>
@import '@/styles/competitionMotion.css';

.ai-guide-page {
  --primary: #42664f;
  --primary-dark: #18372b;
  --paper: #fbf7ee;
  --gold: #d6bd82;
  --ink: #1f332c;
  --muted: #72847c;
  position: relative;
  min-height: calc(100vh - 64px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px 40px 30px;
  color: var(--ink);
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.88), rgba(244, 240, 230, 0.88)),
    url('@/assets/sanxingdui-ai-chat/bg-pattern.png') center / cover repeat;
}

.ai-guide-page,
.ai-guide-page * {
  box-sizing: border-box;
}

.ai-guide-page button,
.ai-guide-page textarea {
  font-family: inherit;
}

.ai-guide-page button {
  appearance: none;
}

.ai-guide-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 10% 10%, rgba(214, 189, 130, 0.18), transparent 22%),
    radial-gradient(circle at 88% 18%, rgba(66, 102, 79, 0.1), transparent 24%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.42), transparent 25%, transparent 75%, rgba(255, 255, 255, 0.35));
}

.guide-hero,
.chat-shell,
.context-banner {
  position: relative;
  z-index: 1;
  width: min(1400px, 100%);
  margin: 0 auto;
}

.guide-hero {
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  align-items: center;
  min-height: 138px;
  padding: 14px 36px 18px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 253, 248, 0.34), rgba(255, 253, 248, 0.08)),
    radial-gradient(circle at 16% 50%, rgba(214, 189, 130, 0.16), transparent 28%);
  border-bottom: 1px solid rgba(214, 189, 130, 0.28);
}

.hero-avatar {
  position: absolute;
  left: 36px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  width: 104px;
  height: 104px;
  place-items: center;
  border: 1px solid rgba(214, 189, 130, 0.76);
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.94) 0 46%, rgba(232, 216, 181, 0.78) 47% 58%, rgba(255, 253, 247, 0.88) 59%);
  box-shadow: 0 18px 42px rgba(66, 102, 79, 0.16);
}

.hero-avatar::before {
  content: '';
  position: absolute;
  inset: 9px;
  border: 1px dashed rgba(66, 102, 79, 0.32);
  border-radius: 50%;
}

.hero-avatar img {
  position: relative;
  z-index: 1;
  width: 68px;
  height: 68px;
  object-fit: cover;
  border-radius: 50%;
}

.hero-copy {
  min-width: 0;
  width: min(860px, calc(100% - 360px));
  text-align: center;
}

.hero-kicker,
.context-kicker {
  margin: 0 0 6px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.34em;
}

.hero-copy h1,
.context-copy h2 {
  margin: 0;
  color: var(--primary-dark);
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-weight: 900;
}

.hero-copy h1 {
  font-size: clamp(40px, 4.1vw, 58px);
  line-height: 1.04;
  letter-spacing: 0.12em;
  text-shadow: 0 10px 24px rgba(66, 102, 79, 0.1);
}

.hero-subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 700px;
  margin: 12px auto 0;
  color: var(--primary);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.hero-subtitle::before,
.hero-subtitle::after {
  content: '';
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, transparent, rgba(214, 189, 130, 0.88));
}

.hero-subtitle::after {
  background: linear-gradient(90deg, rgba(214, 189, 130, 0.88), transparent);
}

.line-dot {
  flex: 0 0 auto;
  width: 20px;
  height: 12px;
  border: 2px solid rgba(214, 189, 130, 0.9);
  border-radius: 999px;
}

.hero-status {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: var(--primary-dark);
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  background: rgba(255, 253, 248, 0.82);
  border: 1px solid rgba(214, 189, 130, 0.74);
  border-radius: 999px;
  box-shadow: 0 16px 32px rgba(66, 102, 79, 0.1);
}

.status-light {
  width: 11px;
  height: 11px;
  background: var(--primary);
  border-radius: 50%;
  box-shadow: 0 0 0 5px rgba(66, 102, 79, 0.1);
}

.context-banner {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr) auto;
  gap: 18px;
  margin: 18px auto 22px;
  padding: 22px 24px;
  background:
    linear-gradient(135deg, rgba(255, 253, 248, 0.92), rgba(245, 241, 232, 0.86)),
    radial-gradient(circle at top right, rgba(214, 189, 130, 0.18), transparent 26%);
  border: 1px solid rgba(214, 189, 130, 0.48);
  border-radius: 26px;
  box-shadow: 0 22px 50px rgba(66, 102, 79, 0.1);
}

.context-copy h2 {
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.12;
  letter-spacing: 0.08em;
}

.context-journey-line {
  margin: 12px 0 0;
  color: var(--ink);
  font-size: 14px;
  line-height: 1.78;
}

.context-summary {
  margin: 12px 0 0;
  color: var(--muted);
  line-height: 1.8;
}

.context-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.context-facts div {
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(214, 189, 130, 0.3);
  border-radius: 18px;
}

.context-facts dt {
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 12px;
}

.context-facts dd {
  margin: 0;
  color: var(--primary-dark);
  font-weight: 700;
  line-height: 1.6;
}

.context-actions {
  display: grid;
  align-content: center;
  gap: 12px;
}

.context-button {
  min-width: 156px;
  padding: 13px 18px;
  color: var(--primary);
  font-weight: 800;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(214, 189, 130, 0.58);
  border-radius: 999px;
}

.context-button--primary {
  color: #fff;
  background: linear-gradient(135deg, #42664f, #2d5140);
  box-shadow: 0 14px 24px rgba(66, 102, 79, 0.18);
}

.chat-shell {
  display: grid;
  grid-template-columns: 276px minmax(0, 1fr);
  grid-template-areas: 'quick chat';
  gap: 20px;
  height: clamp(560px, calc(100vh - 236px), 680px);
  min-height: 0;
  padding: 24px 28px;
  overflow: hidden;
  background: rgba(255, 253, 248, 0.9);
  border: 1px solid rgba(214, 189, 130, 0.58);
  border-radius: 30px;
  box-shadow:
    0 28px 70px rgba(66, 102, 79, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.62);
}

.quick-panel {
  display: grid;
  grid-template-columns: 1fr;
  align-content: start;
  gap: 12px;
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding: 14px;
  background: linear-gradient(180deg, rgba(255, 253, 248, 0.96), rgba(248, 243, 232, 0.72));
  border: 1px solid rgba(214, 189, 130, 0.4);
  border-radius: 22px;
}

.quick-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 11px;
  align-items: center;
  min-height: 70px;
  padding: 11px 12px;
  color: var(--primary);
  text-align: left;
  cursor: pointer;
  background: rgba(255, 253, 248, 0.9);
  border: 1px solid rgba(214, 189, 130, 0.46);
  border-radius: 15px;
}

.quick-card--active,
.quick-card:hover {
  color: #fff;
  background: linear-gradient(135deg, #42664f, #2d5140);
  border-color: rgba(66, 102, 79, 0.7);
  box-shadow: 0 14px 26px rgba(66, 102, 79, 0.18);
}

.quick-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: currentColor;
  font-size: 19px;
  background: rgba(66, 102, 79, 0.1);
  border-radius: 50%;
}

.quick-card--active .quick-icon,
.quick-card:hover .quick-icon {
  background: rgba(255, 255, 255, 0.18);
}

.quick-text {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.quick-text strong {
  display: block;
  font-size: 15px;
  line-height: 1.25;
  white-space: nowrap;
}

.quick-text small {
  display: block;
  color: rgba(31, 51, 44, 0.68);
  font-size: 12.5px;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
}

.quick-card--active .quick-text small,
.quick-card:hover .quick-text small {
  color: rgba(255, 255, 255, 0.78);
}

.chat-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 6px 0 0;
}

.message-scroll {
  display: flex;
  min-height: 0;
  height: 100%;
  max-height: none;
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
  padding: 12px;
  scroll-behavior: smooth;
}

.message-scroll::-webkit-scrollbar {
  width: 6px;
}

.message-scroll::-webkit-scrollbar-thumb {
  background: rgba(66, 102, 79, 0.28);
  border-radius: 999px;
}

.message-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.message-row--user {
  justify-content: flex-end;
  padding-left: 18%;
}

.message-row--assistant {
  justify-content: flex-start;
}

.message-row--thinking {
  padding-left: 56px;
}

.message-avatar,
.user-avatar {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
}

.message-avatar {
  background: #f7efdf;
  border: 1px solid rgba(214, 189, 130, 0.78);
  box-shadow: 0 8px 18px rgba(66, 102, 79, 0.12);
}

.message-avatar img {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 50%;
}

.user-avatar {
  color: #fff;
  background: linear-gradient(135deg, #42664f, #2d5140);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-stack {
  display: grid;
  max-width: min(670px, 100%);
  gap: 8px;
}

.message-row--user .message-stack {
  justify-items: end;
}

.message-bubble {
  padding: 17px 20px;
  color: var(--ink);
  font-size: 16px;
  line-height: 1.85;
  background: rgba(248, 249, 244, 0.94);
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(66, 102, 79, 0.08);
}

.message-row--assistant .message-bubble {
  border-top-left-radius: 6px;
  background: linear-gradient(180deg, rgba(249, 249, 244, 0.96), rgba(238, 246, 240, 0.82));
}

.message-row--user .message-bubble {
  color: #244337;
  border-top-right-radius: 6px;
  background: #e9f4ec;
  border-color: rgba(66, 102, 79, 0.18);
}

.message-bubble p {
  margin: 0;
}

.message-stack time {
  color: #8e9b96;
  font-size: 13px;
}

.thinking-bubble {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  width: auto;
  min-width: 72px;
  min-height: 36px;
  padding: 10px 16px;
  justify-content: center;
  border-radius: 999px;
}

.thinking-bubble span {
  width: 7px;
  height: 7px;
  background: var(--primary);
  border-radius: 50%;
  animation: thinkingPulse 1s ease-in-out infinite;
}

.thinking-bubble span:nth-child(2) {
  animation-delay: 0.15s;
}

.thinking-bubble span:nth-child(3) {
  animation-delay: 0.3s;
}

.suggestion-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 10px 12px 12px;
}

.suggestion-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 18px;
  color: var(--primary);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  background: rgba(255, 253, 248, 0.9);
  border: 1px solid rgba(214, 189, 130, 0.72);
  border-radius: 999px;
}

.suggestion-pill:hover {
  color: var(--primary-dark);
  background: #edf4ef;
  border-color: rgba(66, 102, 79, 0.42);
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 54px 154px;
  gap: 14px;
  align-items: stretch;
  padding: 16px;
  background: rgba(255, 253, 248, 0.96);
  border: 1px solid rgba(214, 189, 130, 0.68);
  border-radius: 20px;
  box-shadow: 0 14px 34px rgba(66, 102, 79, 0.1);
}

.input-wrap {
  display: grid;
  align-items: center;
  min-height: 62px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(66, 102, 79, 0.2);
  border-radius: 15px;
}

.input-wrap textarea {
  width: 100%;
  min-height: 62px;
  max-height: 120px;
  padding: 20px 20px 16px 24px;
  resize: none;
  color: var(--ink);
  font: inherit;
  line-height: 1.55;
  background: transparent;
  border: 0;
  outline: none;
}

.input-wrap textarea::placeholder {
  color: #a2aca7;
}

.send-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 62px;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  background: linear-gradient(135deg, #42664f, #2d5140);
  border: 0;
  border-radius: 15px;
  box-shadow: 0 14px 24px rgba(66, 102, 79, 0.22);
  transition: opacity 0.2s ease;
}

.send-button:hover:not(:disabled) {
  box-shadow: 0 18px 28px rgba(66, 102, 79, 0.28);
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.voice-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  color: #42664f;
  background: rgba(233, 242, 235, 0.95);
  border: 1px solid rgba(66, 102, 79, 0.2);
  border-radius: 15px;
  box-shadow: 0 12px 22px rgba(66, 102, 79, 0.09);
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.voice-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #e0efe5;
  border-color: rgba(66, 102, 79, 0.32);
  box-shadow: 0 16px 26px rgba(66, 102, 79, 0.14);
}

.voice-button--active {
  color: #fff;
  background: linear-gradient(135deg, #42664f, #2d5140);
  border-color: transparent;
  box-shadow: 0 16px 26px rgba(66, 102, 79, 0.24);
}

.voice-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@keyframes thinkingPulse {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

@media (max-width: 1366px) {
  .ai-guide-page {
    padding: 16px 28px 26px;
  }

  .guide-hero {
    min-height: 118px;
    padding: 10px 26px 14px;
  }

  .hero-avatar {
    left: 26px;
    width: 86px;
    height: 86px;
  }

  .hero-avatar img {
    width: 56px;
    height: 56px;
  }

  .hero-copy h1 {
    font-size: clamp(36px, 3.8vw, 52px);
  }

  .hero-subtitle {
    font-size: 15px;
    margin-top: 9px;
  }

  .hero-status {
    right: 26px;
  }

  .context-banner {
    grid-template-columns: 1fr;
  }

  .context-actions {
    grid-auto-flow: column;
    justify-content: start;
  }

  .chat-shell {
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 18px;
    height: clamp(520px, calc(100vh - 210px), 640px);
    padding: 22px;
  }
}

@media (max-width: 1180px) {
  .hero-copy {
    width: min(760px, calc(100% - 180px));
  }

  .hero-status {
    display: none;
  }

  .chat-shell {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
  }

  .quick-panel {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    height: auto;
  }

  .quick-card {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .ai-guide-page {
    padding: 18px 14px 26px;
  }

  .guide-hero {
    gap: 16px;
    text-align: center;
  }

  .hero-avatar {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
  }

  .hero-copy {
    width: 100%;
  }

  .hero-copy h1 {
    font-size: 36px;
    letter-spacing: 0.08em;
  }

  .hero-subtitle {
    justify-content: center;
    font-size: 15px;
    letter-spacing: 0.08em;
  }

  .hero-subtitle::before,
  .hero-subtitle::after,
  .line-dot {
    display: none;
  }

  .hero-status {
    display: inline-flex;
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    justify-self: center;
  }

  .context-banner {
    padding: 18px;
  }

  .context-facts {
    grid-template-columns: 1fr;
  }

  .context-actions {
    grid-auto-flow: row;
  }

  .chat-shell {
    padding: 16px;
    border-radius: 22px;
  }

  .quick-panel {
    grid-template-columns: 1fr 1fr;
    padding: 12px;
  }

  .message-row--user {
    padding-left: 0;
  }

  .message-bubble {
    font-size: 15px;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .send-button {
    min-height: 52px;
  }
}
</style>
