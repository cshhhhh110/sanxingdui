<template>
  <main class="ai-guide-page">
    <section class="guide-hero showcase-enter" aria-label="三星堆智能解说入口">
      <div class="hero-avatar showcase-float" style="--delay: 0.15s">
        <img :src="aiAvatar" alt="三星堆智能解说头像" />
      </div>

      <div class="hero-copy">
        <p class="hero-kicker">玄喵讲解</p>
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
        <div class="quick-panel-tab" aria-hidden="true">
          <i class="fas fa-list-ul"></i>
        </div>
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
              <div
                class="message-bubble"
                :class="{ 'message-bubble--with-exploration': hasExploration(messageItem) }"
              >
                <div
                  v-if="messageItem.role === 'assistant' && hasExploration(messageItem) && !messageItem.streamArchived"
                  class="message-exploration message-exploration--live"
                >
                  <div class="exploration-inline-title">
                    <span>
                      <i class="fas fa-paw"></i>
                      玄喵正在探索
                    </span>
                    <small>{{ getExplorationSummaryStatus(messageItem) }}</small>
                  </div>
                  <p class="exploration-live-line">{{ getLiveExplorationLine(messageItem) }}</p>
                </div>

                <div class="message-answer">
                  <p v-for="line in messageItem.content" :key="line">{{ line }}</p>
                </div>

                <details
                  v-if="messageItem.role === 'assistant' && hasExploration(messageItem) && messageItem.streamArchived"
                  class="message-exploration message-exploration--archived exploration-archive"
                >
                  <summary>
                    <span>{{ getExplorationArchiveSummary(messageItem) }}</span>
                  </summary>
                  <p v-if="messageItem.explorationTrace?.contextLine" class="exploration-context-line">
                    {{ messageItem.explorationTrace.contextLine }}
                  </p>
                  <ol v-if="getExplorationStageEvents(messageItem).length" class="agent-trace-steps exploration-timeline">
                    <li
                      v-for="step in getExplorationStageEvents(messageItem)"
                      :key="step.key"
                      :class="`agent-trace-step--${step.status || 'pending'}`"
                    >
                      <span class="agent-step-dot"></span>
                      <span class="agent-step-copy">
                        <strong><span class="exploration-step-icon">{{ step.icon }}</span>{{ step.label }}</strong>
                        <small v-if="step.detail">{{ step.detail }}</small>
                      </span>
                    </li>
                  </ol>
                  <details class="agent-trace-details exploration-expert">
                    <summary>专家模式：查看 Agent 信息</summary>
                    <dl>
                      <div>
                        <dt>route</dt>
                        <dd>{{ messageItem.explorationTrace?.technicalTrace?.route || '-' }}</dd>
                      </div>
                      <div v-if="messageItem.explorationTrace?.technicalTrace?.toolName || messageItem.explorationTrace?.technicalTrace?.tool">
                        <dt>tool</dt>
                        <dd>{{ messageItem.explorationTrace.technicalTrace.toolName || messageItem.explorationTrace.technicalTrace.tool }}</dd>
                      </div>
                      <div v-if="messageItem.explorationTrace?.technicalTrace?.arguments">
                        <dt>arguments</dt>
                        <dd>{{ formatAgentTraceArguments(messageItem.explorationTrace?.technicalTrace || {}) }}</dd>
                      </div>
                      <div v-if="messageItem.explorationTrace?.technicalTrace?.duration">
                        <dt>duration</dt>
                        <dd>{{ messageItem.explorationTrace.technicalTrace.duration }}ms</dd>
                      </div>
                      <div v-if="messageItem.explorationTrace?.technicalTrace">
                        <dt>trace</dt>
                        <dd>{{ formatAgentTraceArguments({ arguments: messageItem.explorationTrace.technicalTrace }) }}</dd>
                      </div>
                    </dl>
                  </details>
                </details>
                <div
                  v-if="messageItem.role === 'assistant' && messageItem.streamArchived && getFollowupSuggestions(messageItem).length"
                  class="message-followups"
                >
                  <strong>继续探索</strong>
                  <div class="followup-list">
                    <button
                      v-for="suggestion in getFollowupSuggestions(messageItem)"
                      :key="suggestion"
                      type="button"
                      @click="handleSuggest(suggestion)"
                    >
                      {{ suggestion }}
                    </button>
                  </div>
                </div>
              </div>
              <details v-if="messageItem.references?.length" class="message-references">
                <summary class="references-title">
                  <span>
                    <i class="fas fa-book-open"></i>
                    资料来源
                  </span>
                  <small>{{ messageItem.references.length }} 条</small>
                </summary>
                <ul>
                  <li
                    v-for="(reference, referenceIndex) in messageItem.references"
                    :key="getReferenceKey(reference, referenceIndex)"
                  >
                    <span class="reference-index">{{ referenceIndex + 1 }}</span>
                    <div class="reference-copy">
                      <button
                        type="button"
                        class="reference-copy--button"
                        :disabled="!getReferenceOpenTarget(reference)"
                        @click="openReference(reference)"
                      >
                        <strong>{{ getReferenceDisplayTitle(reference) }}</strong>
                        <small>{{ getReferenceVisitorMeta(reference) }}</small>
                      </button>
                      <details class="reference-expert" @click.stop>
                        <summary>专家信息</summary>
                        <span>{{ formatReferenceMeta(reference) }}</span>
                      </details>
                    </div>
                  </li>
                </ul>
              </details>
              <div v-if="messageItem.attachments?.length" class="message-attachments">
                <div
                  v-for="attachment in messageItem.attachments"
                  :key="attachment.uid || attachment.id || attachment.fileId || attachment.fileName"
                  class="attachment-card"
                >
                  <img
                    v-if="attachment.mediaType === 'IMAGE'"
                    class="attachment-image"
                    :src="normalizeAttachmentUrl(attachment.filePath || attachment.previewUrl)"
                    :alt="attachment.fileName"
                  />
                  <video
                    v-else-if="attachment.mediaType === 'VIDEO'"
                    class="attachment-video"
                    :src="normalizeAttachmentUrl(attachment.filePath || attachment.previewUrl)"
                    controls
                  ></video>
                  <audio
                    v-else-if="attachment.mediaType === 'AUDIO'"
                    class="attachment-audio"
                    :src="normalizeAttachmentUrl(attachment.filePath || attachment.previewUrl)"
                    controls
                  ></audio>
                  <div v-else class="attachment-file-icon">
                    <i class="fas fa-file-lines"></i>
                  </div>
                  <div class="attachment-meta">
                    <strong>{{ attachment.fileName || '附件' }}</strong>
                    <small>{{ attachment.mediaType || 'FILE' }} · {{ formatFileSize(attachment.fileSize) }}</small>
                  </div>
                  <div v-if="attachment.analysisStatus || attachment.extractedText" class="attachment-analysis">
                    <small v-if="attachment.analysisStatus">
                      {{ formatAnalysisStatus(attachment.analysisStatus) }}
                    </small>
                    <p v-if="attachment.extractedText">{{ attachment.extractedText }}</p>
                  </div>
                </div>
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
          <input
            ref="fileInputRef"
            class="file-input"
            type="file"
            multiple
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md"
            @change="handleAttachmentSelected"
          />
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
            class="attach-button showcase-button-hover"
            :disabled="isThinking"
            title="添加图片、音频、视频或文件"
            @click="openAttachmentPicker"
          >
            <i class="fas fa-paperclip"></i>
          </button>

          <button
            type="button"
            class="voice-button showcase-button-hover"
            :class="{ 'voice-button--active': isListening }"
            :disabled="!voiceInputSupported || isThinking || isTranscribingVoice"
            :title="voiceButtonTitle"
            @click="toggleVoiceRecording"
          >
            <i :class="isTranscribingVoice ? 'fas fa-spinner fa-spin' : (isListening ? 'fas fa-stop' : 'fas fa-microphone')"></i>
          </button>

          <button
            class="send-button showcase-button-hover"
            type="submit"
            :disabled="(!draft.trim() && pendingAttachments.length === 0) || isThinking || isUploadingAttachments || isListening || isTranscribingVoice"
          >
            <i class="fas fa-paper-plane"></i>
            {{ isUploadingAttachments ? '上传中' : competitionActionLabels.send }}
          </button>
        </form>
        <div v-if="pendingAttachments.length" class="pending-attachments">
          <div
            v-for="attachment in pendingAttachments"
            :key="attachment.uid"
            class="pending-attachment"
            :class="`pending-attachment--${attachment.status}`"
          >
            <img
              v-if="attachment.mediaType === 'IMAGE'"
              :src="attachment.previewUrl"
              :alt="attachment.fileName"
            />
            <i v-else :class="getAttachmentIcon(attachment.mediaType)"></i>
            <span>{{ attachment.fileName }}</span>
            <small>{{ attachment.status === 'failed' ? attachment.error : formatFileSize(attachment.fileSize) }}</small>
            <button type="button" @click="removePendingAttachment(attachment.uid)">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>
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
import { createSession as createSessionApi, getChatStreamUrl, transcribeSpeechInput } from '@/api/AiChatApi'
import { uploadTempFile } from '@/api/FileApi'
import { matchFixedAnswer } from '@/config/chatReplyConfig'
import { buildRagPrompt, searchKnowledge } from '@/utils/knowledgeSearch'
import {
  AgentRoute,
  agentOrchestrator,
  buildActiveGuideContext,
  buildActiveGuideFollowups,
  buildKnowledgeFollowupSuggestions,
  discoverKnowledgeRelations,
  createSpeechInputService,
  getSpeechInputSupportMessage,
  SpeechInputService,
  SpeechInputStatus
} from '@/agent'
import { normalizeAgentTrace } from '@/agent/trace'
import {
  formatExplorationStatus,
  mergeExplorationTrace
} from '@/agent/explorationTrace'
import {
  createAgentStreamEvent,
  createCompletedEvent,
  createContextStartEvent,
  createErrorEvent,
  createGeneratingEvent,
  createGuideCompletedEvent,
  createGuideContinueEvent,
  createGuideFirstStopEvent,
  createGuideRecommendationEvent,
  createGuideRoutePlanningEvent,
  createGuideStatusSyncedEvent,
  createKnowledgeEvent,
  createKnowledgeRelationEvent,
  createToolEvent,
  parseAgentStreamEvent,
  streamEventToStep
} from '@/agent/streamEvents'
import { formatYearRange } from '@/data/competitionArtifacts'
import { competitionActionLabels } from '@/data/competitionUi'
import { getSpacetimeArtifactDetail } from '@/api/SpacetimeApi'
import aiAvatar from '@/assets/sanxingdui-ai-chat/xuanmiao-avatar.png'
import { getRecentArtifactTrail, pushCompetitionTrail } from '@/utils/competitionTrail'
import {
  buildContextualQuestion,
  getXuanmiaoContext,
  getXuanmiaoContextPayload,
  rememberXuanmiaoMessage,
  setXuanmiaoArtifactContext,
  setXuanmiaoPageContext,
  updateXuanmiaoContext
} from '@/agent/context'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const messagesContainer = ref(null)
const suggestionRow = ref(null)
const fileInputRef = ref(null)
const suggestionLimit = ref(4)
const draft = ref('')
const isThinking = ref(false)
const showThinkingBubble = ref(false)
const isUploadingAttachments = ref(false)
const isListening = ref(false)
const isTranscribingVoice = ref(false)
const voiceInputStatus = ref(SpeechInputStatus.IDLE)
const currentSessionId = ref(null)
const activeQuickCard = ref('hot')
const artifactContext = ref(null)
const lastAutoAskedEntityId = ref('')
const pendingAttachments = ref([])

const HERITAGE_KNOWLEDGE_KEYWORDS = [
  '三星堆',
  '金沙',
  '文物',
  '遗址',
  '考古',
  '青铜',
  '金器',
  '金面具',
  '祭祀坑',
  '神树',
  '面具',
  '大立人',
  '金杖',
  '古蜀',
  '展陈',
  '博物馆',
  '文明',
  '纹饰',
  '器物',
  '文化遗产'
]
const RAG_BLOCKED_MEDIA_TYPES = new Set(['IMAGE', 'AUDIO', 'VIDEO'])
const HERITAGE_KNOWLEDGE_KEYWORDS_NORMALIZED = [
  '三星堆',
  '金沙',
  '文物',
  '遗址',
  '考古',
  '青铜',
  '金器',
  '金面具',
  '祭祀坑',
  '神树',
  '面具',
  '大立人',
  '金杖',
  '古蜀',
  '展陈',
  '博物馆',
  '文明',
  '纹饰',
  '器物',
  '文化遗产'
]
const MIN_REFERENCE_SCORE = 0

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

const voiceInputSupported = computed(() => SpeechInputService.isSupported())

const voiceButtonTitle = computed(() => {
  if (!voiceInputSupported.value) return '当前浏览器不支持麦克风录音'
  if (isTranscribingVoice.value) return '正在识别语音'
  if (isListening.value) return '停止语音输入'
  return '开始语音输入'
})

let suggestionResizeObserver = null
let lastSuggestionRowWidth = 0
let chatAbortController = null
let speechInputService = null

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
  stopVoiceRecording({ transcribe: false })
  pendingAttachments.value.forEach((attachment) => {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl)
    }
  })
})

async function initializeConversation() {
  chatAbortController?.abort?.()
  setXuanmiaoPageContext({
    currentPage: route.fullPath,
    currentScene: 'AI文博助手'
  })
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
      setXuanmiaoArtifactContext(artifactContext.value, {
        currentPage: route.fullPath,
        currentScene: 'AI文博助手',
        lastAction: 'open_ai_chat_artifact'
      })
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

function sanitizeAssistantText(text) {
  return String(text || '')
    .replace(/【\s*资料\s*\d+\s*】/g, '')
    .replace(/【\s*参考资料\s*\d+\s*】/g, '')
    .trim()
}

function updateAssistantMessageById(messageId, content, fallbackTime = '') {
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }

  targetMessage.content = Array.isArray(content)
    ? content.map(sanitizeAssistantText).filter(Boolean)
    : [sanitizeAssistantText(content)]
  if (fallbackTime && !targetMessage.time) {
    targetMessage.time = fallbackTime
  }
  scrollToBottom()
}

function updateAssistantReferencesById(messageId, docs = []) {
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }

  targetMessage.references = normalizeKnowledgeReferences(docs)
  if (targetMessage.agentTrace) {
    updateAssistantExplorationTraceById(messageId, targetMessage.agentTrace, {
      references: targetMessage.references
    })
  }
  scrollToBottom()
}

function updateAssistantKnowledgeGraphById(messageId, knowledgeGraph = null) {
  if (!knowledgeGraph) {
    return
  }
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }
  targetMessage.knowledgeGraph = knowledgeGraph
  targetMessage.activeGuide = buildActiveGuideContext(targetMessage.sourceQuestion || '', getXuanmiaoContext(), knowledgeGraph)
  targetMessage.followupSuggestions = buildActiveGuideFollowups({
    question: targetMessage.sourceQuestion || '',
    context: getXuanmiaoContext(),
    knowledgeGraph
  })
  if (!targetMessage.followupSuggestions.length) {
    targetMessage.followupSuggestions = buildKnowledgeFollowupSuggestions(knowledgeGraph)
  }
  if (targetMessage.agentTrace) {
    updateAssistantExplorationTraceById(messageId, targetMessage.agentTrace, {
      knowledgeGraph,
      activeGuide: targetMessage.activeGuide
    })
  }
}

function updateAssistantAgentTraceById(messageId, trace = null, options = {}) {
  if (!trace) {
    return
  }
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }

  targetMessage.agentTrace = normalizeAgentTrace(trace, targetMessage.agentTrace || {})
  updateAssistantExplorationTraceById(messageId, targetMessage.agentTrace, options)
  scrollToBottom()
}

function updateAssistantExplorationTraceById(messageId, trace = null, options = {}) {
  if (!trace) {
    return
  }
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }

  const references = options.references || targetMessage.references || []
  const knowledgeGraph = options.knowledgeGraph || targetMessage.knowledgeGraph || null
  const activeGuide = options.activeGuide || targetMessage.activeGuide || null
  targetMessage.explorationTrace = mergeExplorationTrace(
    targetMessage.explorationTrace,
    trace,
    {
      message: options.message || trace.message || '',
      context: getXuanmiaoContextPayload({
        currentPage: route.fullPath,
        surface: 'ai_chat'
      }),
      references,
      knowledgeGraph,
      activeGuide
    }
  )
  if (targetMessage.streamEvents?.length) {
    targetMessage.explorationTrace.userFriendlySteps = targetMessage.streamEvents.map(streamEventToStep)
  }
}

function buildAgentTrace(result = {}, extra = {}) {
  if (!result?.route && !result?.trace && !extra.route) {
    return null
  }

  return normalizeAgentTrace(result.trace, {
    route: result.route || extra.route || '',
    toolName: result.toolName || result.tool || '',
    tool: result.toolName || result.tool || '',
    arguments: result.arguments || {},
    confidence: Number(result.confidence) || 0,
    reason: result.reason || '',
    status: result.success === false ? 'failed' : (result.success === true ? 'success' : ''),
    result: result.message || '',
    handled: Boolean(result.handled),
    referenceCount: extra.referenceCount || 0,
    message: extra.message || result.trace?.message || ''
  })
}

function formatAgentTraceStatus(trace = {}) {
  const route = trace.route || 'UNKNOWN'
  const statusText = trace.status === 'running'
    ? '执行中'
    : trace.status === 'failed'
      ? '失败'
      : trace.status === 'success'
        ? '完成'
        : '待处理'
  return `${route} · ${statusText}`
}

function formatExplorationTraceStatus(explorationTrace = {}) {
  return formatExplorationStatus(explorationTrace)
}

const EXPLORATION_STAGE_MAP = {
  understand: {
    order: 10,
    icon: '🐱',
    label: '正在理解问题'
  },
  search: {
    order: 20,
    icon: '📚',
    label: '正在查阅资料'
  },
  relation: {
    order: 30,
    icon: '🔎',
    label: '正在整理线索'
  },
  tool_prepare: {
    order: 35,
    icon: '🏛',
    label: '正在定位展陈节点'
  },
  tool_execute: {
    order: 36,
    icon: '🧭',
    label: '正在加载参观路线'
  },
  generate: {
    order: 40,
    icon: '✨',
    label: '正在生成讲解'
  },
  guide: {
    order: 50,
    icon: '🧭',
    label: '正在推荐继续探索'
  },
  error: {
    order: 90,
    icon: '⚠️',
    label: '正在切换备用方案'
  }
}

function hasExploration(messageItem = {}) {
  return messageItem.role === 'assistant' && Boolean(
    messageItem.streamEvents?.length ||
    messageItem.explorationTrace
  )
}

function getEventStageKey(event = {}) {
  if (event.status === 'failed' || event.type === 'error') {
    return 'error'
  }
  if (event.type === 'knowledge_search') {
    return 'search'
  }
  if (event.type === 'relation_discovery') {
    return 'relation'
  }
  if (event.type === 'proactive_direction') {
    return 'guide'
  }
  if (event.type === 'route_planning' || event.type === 'guide_plan_created' || event.type === 'guide_preparing_visit' || event.type === 'guide_introducing_destination') {
    return 'tool_prepare'
  }
  if (event.type === 'guide_first_stop_opening' || event.type === 'guide_continue_requested' || event.type === 'guide_next_stop_opening' || event.type === 'guide_navigating') {
    return 'tool_execute'
  }
  if (event.type === 'guide_status_synced' || event.type === 'guide_completed' || event.type === 'guide_arrived' || event.type === 'guide_explaining') {
    return 'generate'
  }
  if (event.type === 'tool_prepare') {
    return 'tool_prepare'
  }
  if (event.type === 'tool_execute') {
    return 'tool_execute'
  }
  if (event.type === 'generating' || event.type === 'completed') {
    return 'generate'
  }
  return 'understand'
}

function getExplorationStageEvents(messageItem = {}) {
  const rawEvents = Array.isArray(messageItem.streamEvents) ? messageItem.streamEvents : []
  const stages = new Map()

  rawEvents.forEach((event) => {
    const stageKey = getEventStageKey(event)
    const stage = EXPLORATION_STAGE_MAP[stageKey] || EXPLORATION_STAGE_MAP.understand
    const previous = stages.get(stageKey)
    const status = event.status === 'failed'
      ? 'failed'
      : messageItem.streamArchived
        ? 'success'
        : event.status || previous?.status || 'running'

    stages.set(stageKey, {
      key: stageKey,
      order: stage.order,
      icon: getVisitorStageIcon(event, stageKey, messageItem),
      label: getVisitorStageLabel(event, stageKey, messageItem),
      detail: previous?.detail || '',
      status
    })
  })

  if (!stages.size && messageItem.explorationTrace?.userFriendlySteps?.length) {
    messageItem.explorationTrace.userFriendlySteps.forEach((step = {}) => {
      const stageKey = getTraceStepStageKey(step)
      const stage = EXPLORATION_STAGE_MAP[stageKey] || EXPLORATION_STAGE_MAP.understand
      if (!stages.has(stageKey)) {
        stages.set(stageKey, {
          key: stageKey,
          order: stage.order,
          icon: step.icon || stage.icon,
          label: normalizeArchivedStageLabel(step.label || stage.label),
          detail: step.detail || '',
          status: messageItem.streamArchived ? 'success' : (step.status || 'running')
        })
      }
    })
  }

  return Array.from(stages.values())
    .sort((left, right) => left.order - right.order)
}

function getTraceStepStageKey(step = {}) {
  const label = `${step.label || ''} ${step.detail || ''}`
  if (/资料|知识|查阅|检索/.test(label)) {
    return 'search'
  }
  if (/线索|关联|整理/.test(label)) {
    return 'relation'
  }
  if (/工具|调度|打开|搜索|商城|天气|展线|定位/.test(label)) {
    return 'tool_prepare'
  }
  if (/生成|讲解|回答|完成/.test(label)) {
    return 'generate'
  }
  if (/失败|错误|备用/.test(label)) {
    return 'error'
  }
  return 'understand'
}

function appendAssistantStreamEventById(messageId, event = null) {
  if (!event) {
    return
  }
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }
  if (!Array.isArray(targetMessage.streamEvents)) {
    targetMessage.streamEvents = []
  }
  const normalizedEvent = createAgentStreamEvent(event.type || 'thinking_status', event)
  normalizedEvent.message = getVisitorStageLabel(normalizedEvent, getEventStageKey(normalizedEvent), targetMessage)
  normalizedEvent.icon = getVisitorStageIcon(normalizedEvent, getEventStageKey(normalizedEvent), targetMessage)
  const normalizedStage = getEventStageKey(normalizedEvent)
  const existingStageIndex = targetMessage.streamEvents.findIndex((item) => getEventStageKey(item) === normalizedStage)
  if (existingStageIndex >= 0 && normalizedEvent.type !== 'error') {
    targetMessage.streamEvents[existingStageIndex] = {
      ...targetMessage.streamEvents[existingStageIndex],
      ...normalizedEvent,
      id: targetMessage.streamEvents[existingStageIndex].id
    }
    if (targetMessage.agentTrace) {
      updateAssistantExplorationTraceById(messageId, targetMessage.agentTrace)
    }
    scrollToBottom()
    return
  }
  const lastEvent = targetMessage.streamEvents[targetMessage.streamEvents.length - 1]
  if (lastEvent && lastEvent.type === normalizedEvent.type && lastEvent.message === normalizedEvent.message) {
    targetMessage.streamEvents[targetMessage.streamEvents.length - 1] = {
      ...lastEvent,
      ...normalizedEvent
    }
  } else {
    targetMessage.streamEvents.push(normalizedEvent)
  }
  if (targetMessage.agentTrace) {
    updateAssistantExplorationTraceById(messageId, targetMessage.agentTrace)
  }
  scrollToBottom()
}

function archiveAssistantStreamById(messageId, finalMessage = '探索完成') {
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }
  if (!targetMessage.streamEvents?.some((event) => event.type === 'completed')) {
    appendAssistantStreamEventById(messageId, createCompletedEvent(finalMessage))
  }
  targetMessage.streamArchived = true
  targetMessage.followupSuggestions = buildFollowupSuggestions(targetMessage)
  if (targetMessage.agentTrace) {
    updateAssistantExplorationTraceById(messageId, targetMessage.agentTrace)
  }
  scrollToBottom()
}

function getExplorationSummaryStatus(messageItem = {}) {
  if (!messageItem.streamArchived) {
    const latest = messageItem.streamEvents?.[messageItem.streamEvents.length - 1]
    return latest?.status === 'failed' ? '备用方案' : '实时'
  }
  return `${getExplorationStepCount(messageItem)}步 · ${getExplorationDuration(messageItem)}`
}

function getExplorationStepCount(messageItem = {}) {
  return getExplorationStageEvents(messageItem).length
}

function getExplorationArchiveSummary(messageItem = {}) {
  return `玄喵探索过程 · ${getExplorationStepCount(messageItem)}步 · ${getExplorationDuration(messageItem)}`
}

function getLiveExplorationLine(messageItem = {}) {
  const stages = getExplorationStageEvents(messageItem)
  const latestRunning = [...stages].reverse().find((stage) => stage.status === 'running')
  const latest = latestRunning || stages[stages.length - 1]
  if (!latest?.label) {
    return '正在把问题和当前展陈线索对齐'
  }
  return `${latest.icon || '🐱'} ${latest.label}`
}

function getExplorationDuration(messageItem = {}) {
  const traceDuration = Number(messageItem.explorationTrace?.technicalTrace?.duration) || 0
  if (traceDuration > 0) {
    return formatDuration(traceDuration)
  }
  const events = Array.isArray(messageItem.streamEvents) ? messageItem.streamEvents : []
  if (events.length >= 2) {
    const first = new Date(events[0].timestamp).getTime()
    const last = new Date(events[events.length - 1].timestamp).getTime()
    if (!Number.isNaN(first) && !Number.isNaN(last) && last >= first) {
      return formatDuration(last - first)
    }
  }
  return '刚刚'
}

function formatDuration(ms = 0) {
  if (!ms || ms < 100) {
    return '刚刚'
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`
}

function getVisitorStageIcon(event = {}, stageKey = '', messageItem = {}) {
  if (stageKey === 'search') return '📚'
  if (stageKey === 'relation') return inferTopic(messageItem).includes('神树') ? '🌳' : '🔎'
  if (stageKey === 'tool_prepare') return '🏛'
  if (stageKey === 'tool_execute') return '🧭'
  if (stageKey === 'generate') return messageItem.streamArchived ? '✓' : '✨'
  if (stageKey === 'error') return '⚠️'
  return event.icon || '🐱'
}

function getVisitorStageLabel(event = {}, stageKey = '', messageItem = {}) {
  const topic = inferTopic(messageItem)
  const routeName = messageItem.agentTrace?.route || messageItem.explorationTrace?.technicalTrace?.route || ''
  const toolName = event.metadata?.toolName ||
    messageItem.agentTrace?.toolName ||
    messageItem.agentTrace?.tool ||
    messageItem.explorationTrace?.technicalTrace?.toolName ||
    ''
  const args = event.metadata?.arguments ||
    messageItem.agentTrace?.arguments ||
    messageItem.explorationTrace?.technicalTrace?.arguments ||
    {}
  const target = inferToolTarget(args, topic)
  const archived = Boolean(messageItem.streamArchived)

  if (stageKey === 'search') {
    return archived ? `查阅${topic}资料` : `正在查阅${topic}资料`
  }
  if (stageKey === 'relation') {
    if (event.type === 'proactive_direction') {
      const suggestion = event.metadata?.suggestions?.[0] || ''
      return archived
        ? (suggestion ? `推荐继续探索：${suggestion}` : '推荐新的探索方向')
        : (suggestion ? `正在生成继续探索建议：${suggestion}` : '正在生成继续探索建议')
    }
    const relation = Array.isArray(event.metadata?.relations) ? event.metadata.relations[0] : null
    if (relation?.sourceName && relation?.targetName) {
      return archived
        ? `发现${relation.sourceName}与${relation.targetName}的关联线索`
        : `正在分析${relation.sourceName}与${relation.targetName}的关联`
    }
    if (isSanxingduiJinshaQuestion(messageItem)) {
      return archived ? '整理三星堆与金沙的关联' : '正在整理三星堆与金沙的关联'
    }
    return archived ? `整理${topic}相关线索` : `正在整理${topic}相关线索`
  }
  if (stageKey === 'tool_prepare') {
    if (['guide_preparing_visit', 'guide_introducing_destination'].includes(event.type)) {
      return archived ? event.message.replace(/^正在/, '') : event.message
    }
    if (event.type === 'route_planning' || event.type === 'guide_plan_created') {
      const firstStop =
        event.metadata?.routePlan?.nodes?.[0]?.artifact ||
        event.metadata?.routePlan?.stops?.[0]?.artifactName ||
        target
      return archived ? `规划参观路线：${firstStop}` : `正在规划参观路线：${firstStop}`
    }
    if (/trail|spacetime|control_trail/.test(toolName)) {
      return archived ? `定位${target}展陈节点` : `正在定位${target}展陈节点`
    }
    if (toolName === 'search_product') {
      return archived ? `查找${target}文创商品` : `正在查找${target}文创商品`
    }
    if (toolName === 'get_weather') {
      return archived ? `查询${target || '参观'}出行信息` : `正在查询${target || '参观'}出行信息`
    }
    return archived ? '准备展馆能力' : '正在准备展馆能力'
  }
  if (stageKey === 'tool_execute') {
    if (event.type === 'guide_navigating') {
      return archived ? event.message.replace(/^正在/, '') : event.message
    }
    if (event.type === 'guide_first_stop_opening' || event.type === 'guide_next_stop_opening') {
      const nodeName = event.metadata?.node?.artifact || target
      return archived ? `打开导览站点：${nodeName}` : `正在打开导览站点：${nodeName}`
    }
    if (event.type === 'guide_continue_requested') {
      return archived ? '继续当前导览路线' : '正在继续当前导览路线'
    }
    if (/trail|spacetime|control_trail/.test(toolName)) {
      return archived ? '加载参观路线' : '正在加载参观路线'
    }
    return archived ? '完成工具调用' : '正在调度展馆能力'
  }
  if (stageKey === 'generate') {
    if (event.type === 'guide_arrived' || event.type === 'guide_explaining') {
      return archived ? event.message.replace(/^正在/, '') : event.message
    }
    if (event.type === 'guide_status_synced') {
      const artifactName = event.metadata?.trailStatus?.artifactName || target
      return archived ? `已到达${artifactName}` : `正在确认已到达${artifactName}`
    }
    if (event.type === 'guide_completed') {
      return archived ? '完成导览路线' : '正在完成导览路线'
    }
    if (routeName === AgentRoute.TOOL_CALL || /trail|spacetime|control_trail/.test(toolName)) {
      return archived ? '已完成跳转' : '正在确认操作结果'
    }
    if (isSanxingduiJinshaQuestion(messageItem)) {
      return archived ? '完成文化关系讲解' : '正在生成文化关系讲解'
    }
    return archived ? '完成讲解' : '正在生成讲解'
  }
  if (stageKey === 'guide') {
    const suggestion = event.metadata?.suggestions?.[0] || ''
    return archived
      ? (suggestion ? `推荐下一站：${suggestion}` : '推荐新的探索方向')
      : (suggestion ? `正在生成下一步建议：${suggestion}` : '正在生成下一步建议')
  }
  if (stageKey === 'error') {
    return archived ? '已切换备用方案' : '正在切换备用方案'
  }
  if (messageItem.explorationTrace?.contextLine) {
    return archived
      ? messageItem.explorationTrace.contextLine.replace(/^基于你的当前探索：/, '结合当前展陈：')
      : messageItem.explorationTrace.contextLine.replace(/^基于你的当前探索：/, '正在结合当前展陈：')
  }
  return archived ? '理解问题意图' : '正在理解问题意图'
}

function normalizeArchivedStageLabel(label = '') {
  return String(label || '')
    .replace(/^正在/, '')
    .replace(/^已找到 \d+ 条相关资料线索，正在整理关联\.{0,3}$/, '整理资料线索')
    .replace(/\.{3}$/, '')
}

function inferTopic(messageItem = {}) {
  const graphEntity = messageItem.knowledgeGraph?.entities?.[0] ||
    messageItem.explorationTrace?.knowledge?.entityDetails?.[0]
  if (graphEntity?.name) {
    return graphEntity.name
  }

  const context = getXuanmiaoContext()
  const text = [
    messageItem.sourceQuestion,
    context.currentArtifact,
    context.currentTrailNode,
    messageItem.explorationTrace?.contextLine,
    ...(messageItem.references || []).map((item) => `${item.title || ''} ${item.path || ''}`)
  ].filter(Boolean).join(' ')

  const topicCandidates = [
    '青铜神树',
    '金面具',
    '三星堆与金沙',
    '三星堆',
    '金沙遗址',
    '祭祀坑',
    '青铜纵目面具',
    '青铜大立人',
    '金杖',
    '古蜀文明'
  ]
  if (/三星堆/.test(text) && /金沙/.test(text)) {
    return '古蜀文明'
  }
  return topicCandidates.find((item) => text.includes(item)) || '古蜀文明'
}

function isSanxingduiJinshaQuestion(messageItem = {}) {
  const text = [
    messageItem.sourceQuestion,
    ...(messageItem.references || []).map((item) => item.title || '')
  ].filter(Boolean).join(' ')
  return /三星堆/.test(text) && /金沙/.test(text)
}

function inferToolTarget(args = {}, fallback = '') {
  return args.keyword || args.artifactName || args.artifactTitle || args.target || args.city || fallback || '当前文物'
}

function formatStreamEventTime(event = {}) {
  const date = event.timestamp ? new Date(event.timestamp) : new Date()
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function appendStreamEventFromTrace(messageId, trace = {}) {
  if (!trace) {
    return
  }
  if (!trace.route) {
    appendAssistantStreamEventById(messageId, createAgentStreamEvent('thinking_status'))
    return
  }
  if (trace.route === AgentRoute.RAG) {
    appendAssistantStreamEventById(messageId, createKnowledgeEvent(0, getXuanmiaoContext()))
    return
  }
  if (trace.route === AgentRoute.TOOL_CALL) {
    appendAssistantStreamEventById(
      messageId,
      createToolEvent(trace.toolName || trace.tool || '', trace.status === 'running' ? 'prepare' : 'execute', trace.arguments || {})
    )
    return
  }
  if (trace.route === AgentRoute.UNSUPPORTED || trace.status === 'failed') {
    appendAssistantStreamEventById(messageId, createErrorEvent('玄喵正在确认当前能力边界，并准备给出替代说明...'))
    return
  }
  appendAssistantStreamEventById(messageId, createGeneratingEvent())
}

function formatAgentTraceArguments(trace = {}) {
  const args = trace.arguments || {}
  if (!Object.keys(args).length) {
    return ''
  }
  try {
    return JSON.stringify(args)
  } catch (error) {
    return String(args)
  }
}

function normalizeKnowledgeReferences(docs = []) {
  const seen = new Set()
  return docs
    .map((doc) => ({
      title: doc.title || getFileNameFromPath(doc.path || doc.file) || '知识库文档',
      path: doc.path || doc.file || '',
      type: doc.type || doc.knowledgeSource || '',
      score: Number(doc.score) || 0,
      obsidianUri: doc.obsidianUri || '',
      openUrl: doc.openUrl || '',
      sources: Array.isArray(doc.sources) ? doc.sources : []
    }))
    .filter((doc) => doc.score > MIN_REFERENCE_SCORE)
    .filter((doc) => {
      const key = `${doc.title}::${doc.path}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
    .slice(0, 4)
}

function hasRagBlockedAttachment(attachments = []) {
  return attachments.some((attachment) => RAG_BLOCKED_MEDIA_TYPES.has(attachment.mediaType))
}

function shouldUseKnowledge(question, attachments = []) {
  const normalizedQuestion = String(question || '').trim().toLowerCase()
  if (!normalizedQuestion || hasRagBlockedAttachment(attachments)) {
    return false
  }

  return HERITAGE_KNOWLEDGE_KEYWORDS_NORMALIZED.some((keyword) => normalizedQuestion.includes(keyword.toLowerCase()))
}

function toAgentAttachment(attachment = {}) {
  return {
    fileId: String(attachment.fileId || attachment.id || ''),
    fileName: attachment.fileName || attachment.originalName || '',
    mediaType: attachment.mediaType || attachment.fileType || '',
    size: attachment.fileSize || attachment.size || 0,
    mimeType: attachment.mimeType || '',
    filePath: attachment.filePath || ''
  }
}

async function routeAiChatMessage(question, attachments = [], onTrace = null, onExperienceEvent = null) {
  const routingContext = getXuanmiaoContextPayload({
    surface: 'ai_chat',
    currentPage: route.fullPath,
    currentPath: route.fullPath,
    artifactEntityId: getCurrentArtifactEntityId(),
    artifactTitle: contextTitle.value,
    hasAttachments: attachments.length > 0,
    attachmentTypes: attachments.map((item) => item.mediaType || item.fileType || '')
  })

  return agentOrchestrator.handle(question, {
    attachments: attachments.map(toAgentAttachment),
    routingContext,
    toolContext: {
      router,
      currentArtifact: getCurrentArtifactEntityId(),
      isAuthenticated: userStore.isLoggedIn,
      userId: userStore.userInfo?.id || userStore.user?.id || null
    },
    onTrace,
    onExperienceEvent
  })
}

function formatAgentExecutionMessage(result = {}) {
  if (!result.success) {
    return result.message || '操作执行失败，请稍后重试。'
  }

  const data = result.data || {}
  switch (result.tool) {
    case 'search_product':
      return data.keyword ? `已打开文创商城，并搜索“${data.keyword}”。` : '已打开文创商城。'
    case 'search_heritage':
      return data.keyword ? `已进入文物页面，并搜索“${data.keyword}”。` : '已进入文物页面。'
    case 'search_activity':
      return data.keyword ? `已进入活动页面，并搜索“${data.keyword}”。` : '已进入活动页面。'
    case 'navigate_to':
      return '已为你打开对应页面。'
    case 'view_cart':
      return '已为你打开购物车。'
    case 'view_orders':
      return '已为你打开订单页面。'
    case 'view_courses':
      return '已为你打开课程页面。'
    case 'view_profile':
      return '已为你打开个人中心。'
    case 'get_weather':
      return data.summary || data.message || result.message || '天气信息已获取。'
    case 'get_current_datetime':
      return data.summary || data.message || result.message || '当前日期时间已获取。'
    case 'control_trail':
      if (data.routePlan) {
        return result.message || data.message || '已为你规划参观路线。'
      }
      return data.silent ? '已执行时空展线操作。' : (data.message || '已切换到时空展线。')
    case 'open_artifact_detail':
      return '已打开文物详情页。'
    case 'play_voice_intro':
      return '已开始播放文物语音讲解。'
    case 'start_quiz':
      return '已打开知识问答。'
    default:
      return result.message || '操作已执行。'
  }
}

function getFileNameFromPath(path = '') {
  const normalized = String(path || '').replace(/\\/g, '/')
  return normalized.split('/').filter(Boolean).pop() || ''
}

function getReferenceKey(reference, index) {
  return `${reference.path || reference.title || 'reference'}-${index}`
}

function getReferenceOpenTarget(reference = {}) {
  return reference.obsidianUri || reference.openUrl || ''
}

function openReference(reference = {}) {
  const target = getReferenceOpenTarget(reference)
  if (!target) {
    message.info('当前来源暂不支持跳转')
    return
  }
  window.location.href = target
}

function formatReferenceMeta(reference = {}) {
  const parts = []
  const path = reference.path || reference.sources?.[0] || ''
  if (path) {
    parts.push(path)
  }
  if (reference.score) {
    parts.push(`匹配度 ${Math.round(reference.score)}`)
  }
  if (reference.type && !parts.includes(reference.type)) {
    parts.push(reference.type)
  }
  return parts.join(' · ') || '本地知识库'
}

function getReferenceDisplayTitle(reference = {}) {
  const rawTitle = reference.title || getFileNameFromPath(reference.path || reference.sources?.[0] || '') || ''
  const text = `${rawTitle} ${reference.path || ''}`
  if (/青铜神树/.test(text)) return '青铜神树研究资料'
  if (/金面具|黄金面具/.test(text)) return '金面具研究资料'
  if (/金沙/.test(text)) return '金沙遗址资料'
  if (/祭祀坑/.test(text)) return '祭祀坑研究资料'
  if (/古蜀/.test(text)) return '古蜀文明相关资料'
  if (/三星堆/.test(text)) return '三星堆遗址资料'
  if (/青铜/.test(text)) return '三星堆青铜器资料'
  return rawTitle
    .replace(/\.(md|markdown|txt|json|csv)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim() || '本地知识库资料'
}

function getReferenceVisitorMeta(reference = {}) {
  if (getReferenceOpenTarget(reference)) {
    return '可在本地知识库中继续查看'
  }
  if (reference.type) {
    return '来自本地知识库'
  }
  return '资料已用于本次讲解'
}

function getFollowupSuggestions(messageItem = {}) {
  if (!messageItem.followupSuggestions?.length) {
    messageItem.followupSuggestions = buildFollowupSuggestions(messageItem)
  }
  return messageItem.followupSuggestions
}

function buildFollowupSuggestions(messageItem = {}) {
  const activeGuideSuggestions = buildActiveGuideFollowups({
    question: messageItem.sourceQuestion || '',
    context: getXuanmiaoContext(),
    knowledgeGraph: messageItem.knowledgeGraph ||
      messageItem.explorationTrace?.knowledge?.graph ||
      messageItem.explorationTrace?.technicalTrace?.knowledgeGraph ||
      {}
  })
  if (activeGuideSuggestions.length) {
    return uniqueSuggestions(activeGuideSuggestions)
  }

  const graphSuggestions = buildKnowledgeFollowupSuggestions(
    messageItem.knowledgeGraph ||
    messageItem.explorationTrace?.knowledge?.graph ||
    messageItem.explorationTrace?.technicalTrace?.knowledgeGraph ||
    {}
  )
  if (graphSuggestions.length) {
    return uniqueSuggestions(graphSuggestions)
  }

  const topic = inferFollowupTopic(messageItem)
  const routeName = messageItem.agentTrace?.route || messageItem.explorationTrace?.technicalTrace?.route || ''
  const toolName = messageItem.agentTrace?.toolName ||
    messageItem.agentTrace?.tool ||
    messageItem.explorationTrace?.technicalTrace?.toolName ||
    ''
  const text = `${messageItem.sourceQuestion || ''} ${messageItem.content?.join(' ') || ''}`

  if (routeName === AgentRoute.TOOL_CALL || toolName) {
    if (/trail|spacetime|control_trail/.test(toolName)) {
      return uniqueSuggestions([
        `介绍${topic}`,
        `${topic}为什么重要？`,
        `播放${topic}语音讲解`
      ])
    }
    if (toolName === 'search_product') {
      return uniqueSuggestions([
        `${topic}文创有什么设计亮点？`,
        `查看${topic}时空展线`,
        `${topic}和三星堆祭祀有什么关系？`
      ])
    }
  }

  if (/三星堆/.test(text) && /金沙/.test(text)) {
    return uniqueSuggestions([
      '为什么三星堆青铜器造型独特？',
      '金沙遗址发现了什么？',
      '查看三星堆青铜神树'
    ])
  }

  if (topic && topic !== '古蜀文明') {
    return uniqueSuggestions([
      `${topic}为什么重要？`,
      `${topic}和祭祀有什么关系？`,
      `查看${topic}时空展线`
    ])
  }

  return uniqueSuggestions([
    '为什么三星堆青铜器造型独特？',
    '祭祀坑的发现意味着什么？',
    '三星堆和金沙之间有什么联系？'
  ])
}

function inferFollowupTopic(messageItem = {}) {
  const context = getXuanmiaoContext()
  if (context.currentArtifact) {
    return context.currentArtifact
  }
  const text = [
    messageItem.sourceQuestion,
    messageItem.content?.join(' '),
    ...(messageItem.references || []).map((item) => `${item.title || ''} ${item.path || ''}`)
  ].filter(Boolean).join(' ')
  return [
    '青铜神树',
    '金面具',
    '青铜纵目面具',
    '青铜大立人',
    '金杖',
    '祭祀坑',
    '金沙遗址',
    '三星堆'
  ].find((item) => text.includes(item)) || '古蜀文明'
}

function uniqueSuggestions(items = []) {
  return [...new Set(items.filter(Boolean))].slice(0, 3)
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function typeAssistantMessageById(messageId, text, options = {}) {
  const finalText = String(text || '').trim()
  if (!finalText) return

  const thinkingMs = options.thinkingMs ?? 650
  const charDelay = options.charDelay ?? 24
  isThinking.value = true
  showThinkingBubble.value = true
  scrollToBottom()
  await wait(thinkingMs)

  isThinking.value = false
  showThinkingBubble.value = false
  updateAssistantMessageById(messageId, '')

  let displayed = ''
  for (const char of finalText) {
    displayed += char
    updateAssistantMessageById(messageId, displayed)
    await wait(charDelay)
  }
}

function appendAssistantPlaceholder(content = '...') {
  const id = Date.now() + Math.random()
  messages.value.push({
    id,
    role: 'assistant',
    content: [content],
    knowledgeGraph: null,
    streamEvents: [],
    streamArchived: false,
    time: getCurrentTime()
  })
  scrollToBottom()
  return id
}

function attachAssistantQuestion(messageId, question = '') {
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) {
    return
  }
  targetMessage.sourceQuestion = question
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
  let pendingReferences = []
  let userMessage = question

  const placeholderId = Date.now() + Math.random()
  messages.value.push({
    id: placeholderId,
    role: 'assistant',
    content: ['玄喵正在结合当前文物整理讲解线索……'],
    sourceQuestion: question,
    time: getCurrentTime()
  })
  scrollToBottom()
  updateAssistantMessageById(placeholderId, '...')

  try {
    docs = await searchKnowledge(question, 1)
    pendingReferences = normalizeKnowledgeReferences(docs)
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
          } else if (pendingReferences.length) {
            updateAssistantReferencesById(placeholderId, pendingReferences)
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
  const sharedContext = getXuanmiaoContext()
  if (!hasArtifactContext.value) {
    return sharedContext
  }

  return {
    ...sharedContext,
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
  return buildAiUnavailableMessage([])
}

function buildPromptWithContext(question, docs = []) {
  return buildRagPrompt(question, docs, getCurrentContextPayload() || {})
}

function buildAiUnavailableMessage(attachments = []) {
  if (attachments.length) {
    return '多模态解析已提交，但 AI 服务连接中断，请稍后重试。若是视频，请优先使用 10 秒以内、画面清晰且带音轨的 MP4。'
  }
  return 'AI 服务连接中断，已无法获取完整回答，请稍后重试。'
}

function handleQuickCard(key) {
  activeQuickCard.value = key
  suggestionLimit.value = 4
  syncSuggestionLimit()
}

function handleSuggest(question) {
  sendMessage(question)
}

function openAttachmentPicker() {
  fileInputRef.value?.click()
}

function handleAttachmentSelected(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) {
    return
  }

  const availableSlots = Math.max(0, 5 - pendingAttachments.value.length)
  if (files.length > availableSlots) {
    message.warning('单条消息最多支持 5 个附件。')
  }

  files.slice(0, availableSlots).forEach((file) => {
    const mediaType = inferMediaType(file)
    const limit = getAttachmentSizeLimit(mediaType)
    if (file.size > limit * 1024 * 1024) {
      message.error(`${file.name} 超过 ${limit}MB 限制。`)
      return
    }

    pendingAttachments.value.push({
      uid: `${Date.now()}-${Math.random()}`,
      file,
      fileId: null,
      mediaType,
      fileName: file.name,
      filePath: '',
      mimeType: file.type || '',
      fileSize: file.size,
      status: 'local',
      previewUrl: mediaType === 'IMAGE' || mediaType === 'VIDEO' || mediaType === 'AUDIO'
        ? URL.createObjectURL(file)
        : '',
      error: ''
    })
  })
}

function removePendingAttachment(uid) {
  const target = pendingAttachments.value.find((item) => item.uid === uid)
  if (target?.previewUrl) {
    URL.revokeObjectURL(target.previewUrl)
  }
  pendingAttachments.value = pendingAttachments.value.filter((item) => item.uid !== uid)
}

async function ensureAttachmentsUploaded(attachments) {
  if (!attachments.length) {
    return []
  }

  isUploadingAttachments.value = true
  try {
    const result = []
    for (const attachment of attachments) {
      if (attachment.fileId) {
        result.push(toRequestAttachment(attachment))
        continue
      }

      attachment.status = 'uploading'
      const uploaded = await uploadTempFile(attachment.file, {
        showDefaultMsg: false,
        errorMsg: '附件上传失败'
      })

      attachment.fileId = uploaded.id
      attachment.filePath = uploaded.filePath
      attachment.fileName = uploaded.originalName || attachment.fileName
      attachment.fileSize = uploaded.fileSize || attachment.fileSize
      attachment.mediaType = normalizeMediaType(uploaded.fileType || attachment.mediaType)
      attachment.status = 'done'
      result.push(toRequestAttachment(attachment))
    }
    return result
  } catch (error) {
    const failed = attachments.find((item) => item.status === 'uploading')
    if (failed) {
      failed.status = 'failed'
      failed.error = '上传失败'
    }
    throw error
  } finally {
    isUploadingAttachments.value = false
  }
}

function toRequestAttachment(attachment) {
  return {
    fileId: attachment.fileId,
    mediaType: attachment.mediaType,
    fileName: attachment.fileName,
    filePath: attachment.filePath,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize
  }
}

function toDisplayAttachment(attachment) {
  return {
    uid: attachment.uid,
    id: attachment.id,
    fileId: attachment.fileId,
    mediaType: attachment.mediaType,
    fileName: attachment.fileName,
    filePath: attachment.filePath,
    previewUrl: attachment.previewUrl,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    analysisStatus: attachment.analysisStatus,
    extractedText: attachment.extractedText,
    extractedMeta: attachment.extractedMeta
  }
}

function formatAnalysisStatus(status) {
  const statusMap = {
    DONE: '已解析',
    FAILED: '解析失败',
    PENDING: '解析中',
    SKIPPED: '未解析'
  }
  return statusMap[status] || status
}

function inferMediaType(file) {
  const mime = file.type || ''
  const name = file.name.toLowerCase()
  if (mime.startsWith('image/')) return 'IMAGE'
  if (mime.startsWith('audio/')) return 'AUDIO'
  if (mime.startsWith('video/')) return 'VIDEO'
  if (/\.(pdf|doc|docx|txt|md)$/i.test(name)) return 'DOCUMENT'
  return 'FILE'
}

function normalizeMediaType(fileType) {
  const type = (fileType || '').toUpperCase()
  if (type === 'IMG' || type === 'IMAGE') return 'IMAGE'
  if (type === 'AUDIO') return 'AUDIO'
  if (type === 'VIDEO') return 'VIDEO'
  if (['PDF', 'DOC', 'TXT', 'XLS', 'PPT', 'DOCUMENT'].includes(type)) return 'DOCUMENT'
  return 'FILE'
}

function getAttachmentSizeLimit(mediaType) {
  const limits = {
    IMAGE: 10,
    AUDIO: 50,
    VIDEO: 200,
    DOCUMENT: 20,
    FILE: 50
  }
  return limits[mediaType] || 50
}

function getAttachmentIcon(mediaType) {
  const icons = {
    IMAGE: 'fas fa-image',
    AUDIO: 'fas fa-file-audio',
    VIDEO: 'fas fa-file-video',
    DOCUMENT: 'fas fa-file-lines',
    FILE: 'fas fa-paperclip'
  }
  return icons[mediaType] || icons.FILE
}

function formatFileSize(size = 0) {
  if (!size) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function normalizeAttachmentUrl(url) {
  if (!url) return ''
  if (/^blob:/i.test(url) || /^https?:\/\//i.test(url)) {
    return url
  }
  const baseURL = import.meta.env.VITE_APP_BASE_API || '/api'
  const staticBaseURL = baseURL.replace(/\/api\/?$/, '')
  return `${staticBaseURL}/${url.replace(/^\/+/, '')}`
}

function appendVoiceTranscript(text) {
  const transcript = (text || '').trim()
  if (!transcript) return

  draft.value = draft.value.trim()
    ? `${draft.value.trim()}\n${transcript}`
    : transcript
}

function ensureSpeechInputService() {
  if (speechInputService) {
    return speechInputService
  }

  speechInputService = createSpeechInputService({
    maxDurationMs: 60000,
    transcribe: (file) => transcribeSpeechInput(file, {
      showDefaultMsg: false,
      errorMsg: '语音识别失败，请重试或改用文字输入。'
    }),
    onAutoStop: () => {
      message.info('录音已达到 60 秒，正在自动识别。')
      void stopVoiceRecording()
    },
    onStatus: ({ status }) => {
      voiceInputStatus.value = status || SpeechInputStatus.IDLE
      isListening.value = status === SpeechInputStatus.LISTENING
      isTranscribingVoice.value = status === SpeechInputStatus.PROCESSING
    },
    onError: (error) => {
      message.warning(error?.message || '语音输入失败，可以继续使用文字提问。')
    }
  })
  return speechInputService
}

async function startVoiceRecording() {
  await ensureSpeechInputService().start()
  message.info('正在录音，再次点击麦克风结束识别。')
}

async function stopVoiceRecording(options = {}) {
  const { transcribe = true } = options
  if (!speechInputService) {
    return
  }
  if (!transcribe) {
    speechInputService.cancel()
    isListening.value = false
    isTranscribingVoice.value = false
    voiceInputStatus.value = SpeechInputStatus.IDLE
    return
  }
  try {
    const transcript = await speechInputService.stopAndTranscribe()
    appendVoiceTranscript(transcript)
  } catch (error) {
    console.warn('Speech input transcription failed:', error)
  }
}

async function toggleVoiceRecording() {
  if (!voiceInputSupported.value) {
    message.warning(getSpeechInputSupportMessage() || '当前浏览器暂不支持语音输入，请尝试Chrome或Edge。')
    return
  }

  if (isThinking.value || isTranscribingVoice.value) {
    return
  }

  if (isListening.value) {
    await stopVoiceRecording()
    return
  }

  try {
    await startVoiceRecording()
  } catch (error) {
    isListening.value = false
    isTranscribingVoice.value = false
    console.warn('Start voice input failed:', error)
    message.warning(error?.message || '玄喵无法访问麦克风，请检查浏览器权限。')
  }
}

async function sendMessage(presetQuestion = '') {
  const question = (presetQuestion || draft.value).trim()
  if (
    (!question && pendingAttachments.value.length === 0) ||
    isThinking.value ||
    isUploadingAttachments.value ||
    isListening.value ||
    isTranscribingVoice.value
  ) {
    return
  }

  stopVoiceRecording({ transcribe: false })
  updateXuanmiaoContext({
    userId: userStore.userInfo?.id || userStore.user?.id || null,
    currentPage: route.fullPath,
    currentScene: 'AI文博助手'
  })
  rememberXuanmiaoMessage('user', question || '[附件消息]', {
    topic: hasArtifactContext.value || getXuanmiaoContext().currentArtifact ? '文物追问' : ''
  })

  const fixedAnswer = pendingAttachments.value.length ? null : matchFixedAnswer(question)

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: [question || '[附件消息]'],
    attachments: pendingAttachments.value.map(toDisplayAttachment),
    time: getCurrentTime()
  })
  draft.value = ''
  const attachmentsToSend = [...pendingAttachments.value]
  pendingAttachments.value = []
  scrollToBottom()
  const assistantPlaceholderId = appendAssistantPlaceholder()
  attachAssistantQuestion(assistantPlaceholderId, question)

  if (fixedAnswer) {
    await typeAssistantMessageById(assistantPlaceholderId, fixedAnswer.reply)
    archiveAssistantStreamById(assistantPlaceholderId, '已完成快速讲解')
    return
  }

  isThinking.value = true
  showThinkingBubble.value = false
  appendAssistantStreamEventById(
    assistantPlaceholderId,
    createContextStartEvent(getXuanmiaoContextPayload({
      currentPage: route.fullPath,
      surface: 'ai_chat'
    }))
  )

  let docs = []
  let pendingReferences = []
  let pendingKnowledgeGraph = null
  const contextualQuestion = buildContextualQuestion(question, getXuanmiaoContext())
  let userMessage = contextualQuestion
  let uploadedAttachments = []
  let agentResult = null
  const guideExperienceNarration = []

  try {
    uploadedAttachments = await ensureAttachmentsUploaded(attachmentsToSend)
  } catch (error) {
    console.error('附件上传失败:', error)
    appendAssistantStreamEventById(assistantPlaceholderId, createErrorEvent('附件上传失败，请删除失败附件后重试。'))
    updateAssistantMessageById(assistantPlaceholderId, ['附件上传失败，请删除失败附件后重试。'])
    archiveAssistantStreamById(assistantPlaceholderId, '探索暂时受阻')
    pendingAttachments.value = attachmentsToSend
    isThinking.value = false
    return
  }

  try {
    agentResult = await routeAiChatMessage(question, uploadedAttachments, (trace) => {
      appendStreamEventFromTrace(assistantPlaceholderId, trace)
      updateAssistantAgentTraceById(assistantPlaceholderId, trace, { message: question })
    }, (event) => {
      appendAssistantStreamEventById(assistantPlaceholderId, event)
      if ([
        'guide_preparing_visit',
        'guide_introducing_destination',
        'guide_navigating',
        'guide_arrived',
        'guide_explaining'
      ].includes(event?.type) && event.message) {
        guideExperienceNarration.push(event.message)
        updateAssistantMessageById(assistantPlaceholderId, guideExperienceNarration.join('\n\n'))
        scrollToBottom()
      }
    })
    appendStreamEventFromTrace(assistantPlaceholderId, agentResult?.trace || agentResult)
    updateAssistantAgentTraceById(
      assistantPlaceholderId,
      buildAgentTrace(agentResult, { message: question }),
      { message: question }
    )
  } catch (error) {
    console.warn('AI chat agent routing failed; continuing with chat fallback.', error)
    appendAssistantStreamEventById(
      assistantPlaceholderId,
      createErrorEvent('玄喵的智能调度暂时不可用，正在切换普通问答方案...')
    )
    updateAssistantAgentTraceById(assistantPlaceholderId, {
      route: 'CHAT_FALLBACK',
      success: false,
      reason: 'Agent route failed; using chat fallback',
      message: question
    }, { message: question })
  }

  if (agentResult?.handled) {
    isThinking.value = false
    showThinkingBubble.value = false
    if (agentResult.data?.routePlan) {
      appendAssistantStreamEventById(
        assistantPlaceholderId,
        createGuideRoutePlanningEvent(agentResult.data.routePlan, getXuanmiaoContext())
      )
      if (agentResult.data?.guideAction === 'create_guide' || agentResult.data?.guideAction === 'restart_guide') {
        appendAssistantStreamEventById(
          assistantPlaceholderId,
          createGuideFirstStopEvent(agentResult.data.routePlan)
        )
      }
    }
    if (agentResult.data?.guideAction === 'continue_guide') {
      appendAssistantStreamEventById(
        assistantPlaceholderId,
        createGuideContinueEvent(agentResult.data.activeGuideState || getXuanmiaoContext().activeGuideState)
      )
    }
    if (agentResult.data?.trailStatus) {
      appendAssistantStreamEventById(
        assistantPlaceholderId,
        createGuideStatusSyncedEvent(agentResult.data.trailStatus)
      )
    }
    if (agentResult.data?.activeGuideState?.status === 'completed') {
      appendAssistantStreamEventById(
        assistantPlaceholderId,
        createGuideCompletedEvent(agentResult.data.activeGuideState)
      )
    }
    updateAssistantMessageById(
      assistantPlaceholderId,
      formatAgentExecutionMessage(agentResult)
    )
    archiveAssistantStreamById(assistantPlaceholderId, agentResult.success ? '展馆能力已完成' : '探索暂时受阻')
    return
  }

  if (
    !uploadedAttachments.length &&
    agentResult?.route === AgentRoute.DIRECT_ANSWER &&
    agentResult.message
  ) {
    appendAssistantStreamEventById(assistantPlaceholderId, createGeneratingEvent())
    await typeAssistantMessageById(assistantPlaceholderId, agentResult.message, {
      thinkingMs: 350,
      charDelay: 16
    })
    archiveAssistantStreamById(assistantPlaceholderId, '讲解已生成')
    rememberXuanmiaoMessage('assistant', agentResult.message)
    return
  }

  const shouldUseRagByAgent = agentResult?.route === AgentRoute.RAG
  const shouldUseLegacyRagFallback = agentResult?.success === false && shouldUseKnowledge(question, attachmentsToSend)
  const shouldAttachKnowledge = !hasRagBlockedAttachment(uploadedAttachments.length ? uploadedAttachments : attachmentsToSend) &&
    (shouldUseRagByAgent || shouldUseLegacyRagFallback)

  if (shouldAttachKnowledge) {
    try {
      appendAssistantStreamEventById(assistantPlaceholderId, createKnowledgeEvent(0, getXuanmiaoContext()))
      docs = await searchKnowledge(contextualQuestion, 3)
      pendingReferences = normalizeKnowledgeReferences(docs)
      pendingKnowledgeGraph = discoverKnowledgeRelations({
        question: contextualQuestion,
        context: getCurrentContextPayload(),
        documents: docs
      })
      const pendingActiveGuide = buildActiveGuideContext(
        contextualQuestion,
        getXuanmiaoContext(),
        pendingKnowledgeGraph
      )
      appendAssistantStreamEventById(
        assistantPlaceholderId,
        createKnowledgeEvent(pendingReferences.length, getXuanmiaoContext())
      )
      appendAssistantStreamEventById(
        assistantPlaceholderId,
        createKnowledgeRelationEvent(pendingKnowledgeGraph, getXuanmiaoContext())
      )
      if (pendingActiveGuide.followups.length) {
        appendAssistantStreamEventById(
          assistantPlaceholderId,
          createGuideRecommendationEvent(pendingActiveGuide, getXuanmiaoContext())
        )
      }
      updateAssistantKnowledgeGraphById(assistantPlaceholderId, pendingKnowledgeGraph)
      updateAssistantAgentTraceById(
        assistantPlaceholderId,
        buildAgentTrace(agentResult, {
          referenceCount: pendingReferences.length,
          message: question
        }),
        {
          message: question,
          references: pendingReferences,
          knowledgeGraph: pendingKnowledgeGraph,
          activeGuide: pendingActiveGuide
        }
      )
      if (docs.length) {
        userMessage = buildPromptWithContext(contextualQuestion, docs)
      }
    } catch (error) {
      console.warn('Knowledge reference lookup failed; continuing AI chat without visible references.', error)
      appendAssistantStreamEventById(
        assistantPlaceholderId,
        createErrorEvent('资料检索暂时不稳定，玄喵正在切换备用讲解方案...')
      )
    }
  }

  if (!currentSessionId.value) {
    await createSession()
  }

  if (!currentSessionId.value) {
    appendAssistantStreamEventById(assistantPlaceholderId, createErrorEvent('会话暂时不可用，玄喵正在使用备用资料回答...'))
    updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
    archiveAssistantStreamById(assistantPlaceholderId, '已使用备用资料')
    isThinking.value = false
    return
  }

  isThinking.value = true
  showThinkingBubble.value = false
  appendAssistantStreamEventById(assistantPlaceholderId, createGeneratingEvent())
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
        userMessage,
        attachments: uploadedAttachments,
        context: getXuanmiaoContextPayload({
          currentPage: route.fullPath,
          surface: 'ai_chat'
        })
      }),
      signal: chatAbortController.signal,
      openWhenHidden: true,
      onmessage(event) {
        const streamEvent = parseAgentStreamEvent(event.data)
        if (streamEvent) {
          appendAssistantStreamEventById(assistantPlaceholderId, streamEvent)
          return
        }

        if (event.data === '[DONE]') {
          isThinking.value = false
          if (!aiResponse) {
            updateAssistantMessageById(
              assistantPlaceholderId,
              uploadedAttachments.length ? buildAiUnavailableMessage(uploadedAttachments) : getMockReply(question, docs)
            )
          } else if (pendingReferences.length) {
            updateAssistantReferencesById(assistantPlaceholderId, pendingReferences)
          }
          if (aiResponse) {
            rememberXuanmiaoMessage('assistant', aiResponse, {
              topic: shouldAttachKnowledge ? '文物讲解' : ''
            })
          }
          archiveAssistantStreamById(assistantPlaceholderId, aiResponse ? '讲解已生成' : '已使用备用资料')
          return
        }

        if (event.data.startsWith('[ERROR]')) {
          isThinking.value = false
          appendAssistantStreamEventById(
            assistantPlaceholderId,
            createErrorEvent('当前智能生成服务暂时不可用，正在切换备用资料方案...')
          )
          message.warning('AI 响应暂不可用')
          updateAssistantMessageById(
            assistantPlaceholderId,
            uploadedAttachments.length ? event.data.replace('[ERROR]', '') || buildAiUnavailableMessage(uploadedAttachments) : getMockReply(question, docs)
          )
          archiveAssistantStreamById(assistantPlaceholderId, '已切换备用资料')
          return
        }

        aiResponse += event.data
        updateAssistantMessageById(assistantPlaceholderId, aiResponse)
      },
      onerror(error) {
        console.error('AI SSE 连接失败:', error)
        isThinking.value = false
        appendAssistantStreamEventById(
          assistantPlaceholderId,
          createErrorEvent('连接中断，玄喵正在切换备用资料方案...')
        )
        updateAssistantMessageById(
          assistantPlaceholderId,
          uploadedAttachments.length ? buildAiUnavailableMessage(uploadedAttachments) : getMockReply(question, docs)
        )
        archiveAssistantStreamById(assistantPlaceholderId, '已切换备用资料')
        return 999999999
      },
      onclose() {
        isThinking.value = false
      }
    })
  } catch (error) {
    console.error('发送 AI 消息失败:', error)
    isThinking.value = false
    appendAssistantStreamEventById(
      assistantPlaceholderId,
      createErrorEvent('消息发送失败，玄喵正在切换备用资料方案...')
    )
    updateAssistantMessageById(
      assistantPlaceholderId,
      uploadedAttachments.length ? buildAiUnavailableMessage(uploadedAttachments) : getMockReply(question, docs)
    )
    archiveAssistantStreamById(assistantPlaceholderId, '已切换备用资料')
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
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 14px;
  height: calc(100vh - 64px);
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  padding: 18px 40px 20px;
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
  grid-row: 1;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  align-items: center;
  min-height: 150px;
  padding: 24px 36px 34px;
  overflow: visible;
  background:
    radial-gradient(circle at 12% 56%, rgba(214, 189, 130, 0.2), transparent 28%),
    radial-gradient(circle at 88% 14%, rgba(66, 102, 79, 0.1), transparent 30%);
  border-bottom: 1px solid rgba(214, 189, 130, 0.28);
}

.guide-hero::after {
  content: '';
  position: absolute;
  left: 220px;
  right: 220px;
  bottom: 22px;
  height: 1px;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent, rgba(214, 189, 130, 0.82), transparent);
}

.hero-avatar {
  position: absolute;
  left: 52px;
  bottom: 18px;
  display: grid;
  width: 104px;
  height: 104px;
  place-items: center;
  z-index: 3;
  border: 1px solid rgba(214, 189, 130, 0.76);
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.94) 0 46%, rgba(232, 216, 181, 0.78) 47% 58%, rgba(255, 253, 247, 0.88) 59%);
  box-shadow:
    0 20px 48px rgba(66, 102, 79, 0.18),
    0 0 0 12px rgba(255, 253, 248, 0.58);
}

.hero-avatar::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px dashed rgba(66, 102, 79, 0.32);
  border-radius: 50%;
}

.hero-avatar::after {
  content: '';
  position: absolute;
  inset: -9px;
  border-radius: 50%;
  border: 1px solid rgba(214, 189, 130, 0.28);
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
  position: relative;
  min-width: 0;
  width: min(860px, calc(100% - 360px));
  text-align: center;
}

.hero-kicker {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  margin: 0;
  color: var(--primary);
  font-size: clamp(22px, 2.2vw, 34px);
  font-weight: 800;
  letter-spacing: 0.18em;
  text-shadow: 0 8px 20px rgba(66, 102, 79, 0.12);
}

.hero-kicker::before {
  content: '';
  width: 86px;
  height: 14px;
  background:
    linear-gradient(90deg, transparent, rgba(214, 189, 130, 0.82)),
    radial-gradient(circle at right, rgba(214, 189, 130, 0.95) 0 3px, transparent 4px);
  mask: linear-gradient(#000 0 0) center / 100% 1px no-repeat,
    radial-gradient(ellipse at center, #000 0 52%, transparent 54%) right / 20px 14px no-repeat;
}

.hero-kicker::after {
  content: '';
  width: 86px;
  height: 14px;
  background:
    linear-gradient(90deg, rgba(214, 189, 130, 0.82), transparent),
    radial-gradient(circle at left, rgba(214, 189, 130, 0.95) 0 3px, transparent 4px);
  mask: linear-gradient(#000 0 0) center / 100% 1px no-repeat,
    radial-gradient(ellipse at center, #000 0 52%, transparent 54%) left / 20px 14px no-repeat;
}

.hero-copy::before,
.hero-copy::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(214, 189, 130, 0.8);
  border-radius: 999px;
  transform: translateY(-50%);
}

.hero-copy::before {
  left: calc(50% - 170px);
}

.hero-copy::after {
  right: calc(50% - 170px);
}

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
  grid-row: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr) auto;
  gap: 18px;
  max-height: 118px;
  margin: 0 auto;
  padding: 14px 18px;
  overflow-y: auto;
  background:
    linear-gradient(135deg, rgba(255, 253, 248, 0.92), rgba(245, 241, 232, 0.86)),
    radial-gradient(circle at top right, rgba(214, 189, 130, 0.18), transparent 26%);
  border: 1px solid rgba(214, 189, 130, 0.48);
  border-radius: 26px;
  box-shadow: 0 22px 50px rgba(66, 102, 79, 0.1);
}

.context-copy h2 {
  font-size: clamp(22px, 2.4vw, 30px);
  line-height: 1.12;
  letter-spacing: 0.08em;
}

.context-journey-line {
  margin: 8px 0 0;
  color: var(--ink);
  font-size: 14px;
  line-height: 1.78;
}

.context-summary {
  margin: 8px 0 0;
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
  padding: 10px 12px;
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
  grid-row: 3;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'chat';
  height: 100%;
  min-height: 0;
  margin-top: 0;
  padding: 24px 28px 24px 58px;
  overflow: hidden;
  background: rgba(255, 253, 248, 0.9);
  border: 1px solid rgba(214, 189, 130, 0.58);
  border-radius: 30px;
  box-shadow:
    0 28px 70px rgba(66, 102, 79, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.62);
}

.quick-panel {
  position: absolute;
  top: 38px;
  left: 18px;
  z-index: 8;
  display: grid;
  grid-template-columns: 1fr;
  align-content: start;
  gap: 12px;
  width: 72px;
  min-width: 0;
  height: auto;
  min-height: 0;
  padding: 0;
  overflow: visible;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.quick-panel:hover,
.quick-panel:focus-within {
  background: transparent;
}

.quick-panel-tab {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  width: 52px;
  height: 68px;
  place-items: center;
  color: #fff;
  pointer-events: none;
  background: linear-gradient(135deg, #42664f, #2d5140);
  border: 1px solid rgba(66, 102, 79, 0.7);
  border-radius: 0 16px 16px 0;
  box-shadow: 0 12px 22px rgba(66, 102, 79, 0.18);
}

.quick-panel-tab i {
  font-size: 17px;
}

.quick-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 11px;
  align-items: center;
  width: 238px;
  min-height: 70px;
  margin-left: 0;
  padding: 11px 12px;
  color: var(--primary);
  text-align: left;
  cursor: pointer;
  background: rgba(255, 253, 248, 0.9);
  border: 1px solid rgba(214, 189, 130, 0.46);
  border-radius: 15px;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-260px);
  transition:
    opacity 0.2s ease,
    transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.quick-panel:hover .quick-card,
.quick-panel:focus-within .quick-card {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(60px);
}

.quick-panel:hover .quick-card:nth-of-type(1),
.quick-panel:focus-within .quick-card:nth-of-type(1) {
  transition-delay: 0.02s;
}

.quick-panel:hover .quick-card:nth-of-type(2),
.quick-panel:focus-within .quick-card:nth-of-type(2) {
  transition-delay: 0.07s;
}

.quick-panel:hover .quick-card:nth-of-type(3),
.quick-panel:focus-within .quick-card:nth-of-type(3) {
  transition-delay: 0.12s;
}

.quick-panel:hover .quick-card:nth-of-type(4),
.quick-panel:focus-within .quick-card:nth-of-type(4) {
  transition-delay: 0.17s;
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

.message-bubble--with-exploration {
  display: grid;
  gap: 10px;
}

.message-answer {
  display: grid;
  gap: 0;
}

.message-exploration {
  display: grid;
  gap: 7px;
  color: #56655f;
  font-size: 12px;
  line-height: 1.5;
}

.message-exploration--live {
  padding: 7px 9px;
  background: rgba(238, 246, 240, 0.62);
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 12px;
}

.message-exploration--archived {
  padding-top: 6px;
  margin-top: 0;
  border-top: 1px dashed rgba(66, 102, 79, 0.12);
}

.exploration-inline-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--primary-dark);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.exploration-inline-title span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.exploration-inline-title small {
  color: #7a8b83;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
}

.exploration-live-line {
  margin: 0;
  color: #5f715f;
  font-size: 12px;
  font-weight: 700;
}

.message-exploration .agent-trace-steps {
  margin-top: 0;
}

.message-exploration .agent-trace-steps li {
  grid-template-columns: 14px minmax(0, 1fr);
}

.message-exploration .agent-step-copy strong {
  font-size: 12px;
}

.message-followups {
  display: grid;
  gap: 8px;
  padding-top: 4px;
}

.message-followups > strong {
  color: #6f7d76;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.followup-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.followup-list button {
  padding: 6px 10px;
  color: #3f604f;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  background: rgba(241, 247, 242, 0.84);
  border: 1px solid rgba(66, 102, 79, 0.18);
  border-radius: 999px;
  transition: 0.18s ease;
}

.followup-list button:hover {
  color: #7b5b24;
  background: rgba(255, 248, 229, 0.9);
  border-color: rgba(214, 189, 130, 0.55);
}

.message-stack time {
  color: #8e9b96;
  font-size: 13px;
}

.message-references {
  display: grid;
  gap: 8px;
  max-width: 620px;
  padding: 10px 12px 11px;
  color: #42584f;
  background: rgba(255, 253, 248, 0.72);
  border: 1px solid rgba(214, 189, 130, 0.42);
  border-radius: 14px;
}

.references-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  cursor: pointer;
  list-style: none;
}

.references-title::-webkit-details-marker {
  display: none;
}

.references-title span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.references-title small {
  color: #6f7d76;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.references-title::after {
  color: #7b6a3e;
  font-size: 11px;
  content: '展开';
}

.message-references[open] .references-title::after {
  content: '收起';
}

.message-references ul {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.message-references li {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.message-agent-trace {
  max-width: 620px;
  padding: 9px 12px;
  color: #51615b;
  background: rgba(241, 246, 242, 0.62);
  border: 1px dashed rgba(66, 102, 79, 0.24);
  border-radius: 12px;
}

.exploration-journey {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  background:
    radial-gradient(circle at 18px 18px, rgba(214, 189, 130, 0.18), transparent 28px),
    linear-gradient(180deg, rgba(255, 253, 248, 0.92), rgba(238, 246, 240, 0.76));
  border: 1px solid rgba(214, 189, 130, 0.5);
  border-radius: 18px;
  box-shadow: 0 14px 30px rgba(66, 102, 79, 0.08);
}

.exploration-journey--archived {
  padding: 12px 14px;
  background: rgba(255, 253, 248, 0.72);
  border-style: dashed;
}

.agent-trace-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #51615b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.agent-trace-title span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.agent-trace-title small {
  color: #7a8b83;
  font-size: 11px;
  letter-spacing: 0;
}

.exploration-title {
  color: var(--primary-dark);
  font-size: 13px;
  letter-spacing: 0.12em;
}

.exploration-context-line {
  margin: 0;
  padding: 8px 10px;
  color: #5d6d52;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
  background: rgba(214, 189, 130, 0.14);
  border-radius: 12px;
}

.agent-trace-steps {
  display: grid;
  gap: 8px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.agent-trace-steps li {
  display: grid;
  grid-template-columns: 14px 72px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.exploration-timeline {
  position: relative;
  gap: 10px;
  margin-top: 0;
}

.exploration-timeline::before {
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: 4px;
  width: 1px;
  background: linear-gradient(180deg, rgba(66, 102, 79, 0.18), rgba(214, 189, 130, 0.52));
  content: '';
}

.exploration-stream {
  padding: 2px 0 0;
}

.exploration-stream .agent-trace-step--running .agent-step-copy strong {
  color: #8a622b;
}

.agent-step-dot {
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 999px;
  background: #b8c4bc;
  box-shadow: 0 0 0 4px rgba(184, 196, 188, 0.18);
}

.agent-trace-step--running .agent-step-dot {
  background: #c98b35;
  box-shadow: 0 0 0 4px rgba(201, 139, 53, 0.18);
  animation: agentPulse 1.2s ease-in-out infinite;
}

.agent-trace-step--success .agent-step-dot {
  background: #3f8f62;
  box-shadow: 0 0 0 4px rgba(63, 143, 98, 0.16);
}

.agent-trace-step--failed .agent-step-dot {
  background: #b94d43;
  box-shadow: 0 0 0 4px rgba(185, 77, 67, 0.16);
}

.agent-step-copy {
  display: grid;
  gap: 2px;
}

.agent-step-copy strong {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #35483f;
  font-size: 12px;
}

.agent-step-copy small {
  color: #718178;
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.exploration-step-time {
  color: #8e7d55;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.8;
}

.exploration-step-icon {
  font-size: 13px;
}

.exploration-discovery {
  display: grid;
  gap: 8px;
  padding: 10px 11px;
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 14px;
}

.exploration-discovery > strong {
  color: var(--primary-dark);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.exploration-entity-chain {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 18px;
}

.exploration-entity-chain span {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  color: #42664f;
  font-size: 12px;
  font-weight: 800;
  background: rgba(233, 242, 235, 0.9);
  border-radius: 999px;
}

.exploration-entity-chain span:not(:last-child)::after {
  position: absolute;
  right: -13px;
  color: #9c8554;
  content: '→';
}

.agent-trace-details {
  margin-top: 9px;
}

.exploration-expert {
  margin-top: 2px;
  padding-top: 7px;
  border-top: 1px dashed rgba(66, 102, 79, 0.18);
}

.exploration-archive {
  display: grid;
  gap: 8px;
}

.exploration-archive > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--primary-dark);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  list-style: none;
}

.exploration-archive > summary::-webkit-details-marker {
  display: none;
}

.exploration-archive > summary::after {
  color: #8e7d55;
  font-size: 12px;
  content: '展开';
}

.exploration-archive[open] > summary::after {
  content: '收起';
}

.agent-trace-details summary {
  color: #7a8b83;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

@keyframes agentPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.28);
  }
}

.message-agent-trace dl {
  display: grid;
  gap: 6px;
  margin: 10px 0 0;
}

.message-agent-trace dl div {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px;
}

.message-agent-trace dt {
  color: #7a8b83;
  font-size: 12px;
  font-weight: 800;
}

.message-agent-trace dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #35483f;
  font-size: 12px;
}

.reference-index {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  background: linear-gradient(135deg, #42664f, #2d5140);
  border-radius: 999px;
}

.reference-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.reference-copy--button {
  width: 100%;
  padding: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.reference-copy--button:not(:disabled):hover strong {
  color: #8a622b;
  text-decoration: underline;
}

.reference-copy--button:disabled {
  cursor: default;
}

.reference-copy--button strong {
  display: block;
  overflow: hidden;
  color: var(--primary-dark);
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reference-copy--button small {
  display: block;
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reference-expert {
  margin-top: 3px;
  color: #7b8a82;
  font-size: 11px;
}

.reference-expert summary {
  width: max-content;
  color: #8e7d55;
  font-weight: 800;
  cursor: pointer;
}

.reference-expert span {
  display: block;
  margin-top: 3px;
  overflow-wrap: anywhere;
}

.message-attachments {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.attachment-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  max-width: 460px;
  padding: 10px;
  background: rgba(255, 253, 248, 0.86);
  border: 1px solid rgba(214, 189, 130, 0.46);
  border-radius: 14px;
}

.attachment-image,
.attachment-video {
  width: 96px;
  height: 72px;
  object-fit: cover;
  background: rgba(66, 102, 79, 0.08);
  border-radius: 10px;
}

.attachment-audio {
  grid-column: 1 / -1;
  width: 100%;
}

.attachment-file-icon {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  color: var(--primary);
  font-size: 24px;
  background: rgba(66, 102, 79, 0.1);
  border-radius: 12px;
}

.attachment-meta {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.attachment-meta strong {
  overflow: hidden;
  color: var(--primary-dark);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-meta small {
  color: var(--muted);
  font-size: 12px;
}

.attachment-analysis {
  grid-column: 1 / -1;
  display: grid;
  gap: 4px;
  padding-top: 2px;
}

.attachment-analysis small {
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
}

.attachment-analysis p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #53615b;
  font-size: 12px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
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
  grid-template-columns: minmax(0, 1fr) 54px 54px 154px;
  gap: 14px;
  align-items: stretch;
  padding: 16px;
  background: rgba(255, 253, 248, 0.96);
  border: 1px solid rgba(214, 189, 130, 0.68);
  border-radius: 20px;
  box-shadow: 0 14px 34px rgba(66, 102, 79, 0.1);
}

.file-input {
  display: none;
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
  overflow-y: auto;
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

.attach-button,
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

.attach-button:hover:not(:disabled),
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

.attach-button:disabled,
.voice-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.pending-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 16px 0;
}

.pending-attachment {
  display: grid;
  grid-template-columns: 36px minmax(90px, 180px) auto 28px;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 6px 8px;
  color: var(--primary-dark);
  background: rgba(255, 253, 248, 0.92);
  border: 1px solid rgba(214, 189, 130, 0.58);
  border-radius: 12px;
}

.pending-attachment img {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 8px;
}

.pending-attachment > i {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  color: var(--primary);
  background: rgba(66, 102, 79, 0.1);
  border-radius: 8px;
}

.pending-attachment span {
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-attachment small {
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
}

.pending-attachment button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: var(--primary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.pending-attachment--failed {
  border-color: rgba(180, 60, 52, 0.55);
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
    gap: 12px;
    padding: 14px 28px 16px;
  }

  .guide-hero {
    min-height: 132px;
    padding: 20px 26px 28px;
  }

  .hero-avatar {
    left: 34px;
    width: 104px;
    height: 104px;
  }

  .hero-avatar img {
    width: 68px;
    height: 68px;
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
    height: 100%;
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
    height: 100%;
    min-height: 0;
    max-height: none;
    padding-left: 54px;
  }

  .quick-panel {
    top: 18px;
    width: 68px;
    max-height: calc(100% - 36px);
    overflow: visible;
  }

  .quick-card {
    width: min(238px, calc(100vw - 116px));
  }

  .quick-card {
    grid-template-columns: 38px minmax(0, 1fr);
    justify-items: stretch;
    text-align: left;
  }
}

@media (max-width: 768px) {
  .ai-guide-page {
    gap: 10px;
    padding: 10px 14px 12px;
  }

  .guide-hero {
    gap: 16px;
    min-height: 128px;
    padding: 18px;
    text-align: center;
  }

  .hero-avatar {
    position: relative;
    left: auto;
    top: auto;
    bottom: auto;
    transform: none;
  }

  .hero-copy {
    width: 100%;
  }

  .hero-kicker {
    gap: 12px;
    font-size: 24px;
    letter-spacing: 0.12em;
  }

  .hero-kicker::before,
  .hero-kicker::after {
    width: 38px;
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
