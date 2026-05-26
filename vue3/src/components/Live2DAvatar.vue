<template>
  <div class="live2d-wrapper" :class="{ open: isPanelOpen }">
    <!-- 渚ц竟鍞ゅ嚭鏍囩 -->
    <div class="side-tab" @click="togglePanel" :class="{ 'has-msg': hasPendingMsg }" aria-label="打开玄喵" role="button" tabindex="0" @keydown.enter.prevent="togglePanel" @keydown.space.prevent="togglePanel">
      <img :src="xuanmiaoPeekImage" alt="" />
    </div>

    <!-- 涓婚潰鏉?-->
    <div class="live2d-panel" @mouseenter="cancelAutoHide" @mouseleave="startAutoHide()">
      <!-- AI瀵硅瘽姘旀场 -->
      <div
          id="ai-bubble"
          :class="{
          'speaking': isSpeaking,
          'stopped': isStopped,
          'hiding': isHiding
        }"
          :style="bubbleStyle"
          @click="handleBubbleClick"
      >
        <button
            class="bubble-close"
            type="button"
            aria-label="关闭玄喵气泡"
            title="关闭气泡"
            @click.stop="closeBubble"
        >×</button>
        <div id="stop-hint">点击停止讲解</div>
        <div id="stop-icon"></div>
        <div
            id="ai-content-wrapper"
            :class="{ 'scrollable': isScrollable }"
            ref="contentWrapper"
        >
          <p id="ai-text">
            <span>{{ displayedText }}</span>
            <span v-if="isSpeaking && !isStopped" class="typing-cursor"></span>
          </p>
        </div>
      </div>

      <!-- Live2D鎸傝浇瀹瑰櫒 -->
      <div class="live2d-placeholder"></div>

    </div>

    <!-- 鎻愰棶瀵硅瘽妗?-->
    <div
        v-if="showInputDialog"
        class="input-dialog"
        :class="{ 'show': showInputDialog }"
        :style="{ left: dialogPosition.x + 'px', top: dialogPosition.y + 'px' }"
        @mousedown="startDrag"
    >
      <div class="dialog-header" @mousedown="startDrag">
        <span class="dialog-title">玄喵提问</span>
        <button class="dialog-close" type="button" aria-label="关闭提问框" @click.stop="closeInputDialog">x</button>
      </div>
      <div class="dialog-body">
        <div class="dialog-voice-row" v-if="voiceList.length > 1">
          <span class="voice-row-label">音色</span>
          <select v-model="selectedVoice" @change="onVoiceChange" class="voice-row-select">
            <option v-for="v in voiceList" :key="v.key" :value="v.key">
              {{ v.label }} 路 {{ v.desc }}
            </option>
          </select>
        </div>
        <p class="dialog-hint">请输入你想了解的问题</p>
        <textarea
            ref="dialogInput"
            v-model="inputQuestion"
            class="dialog-input"
            placeholder="例如：青铜神树代表什么、金杖纹样有什么含义、纵目面具为什么夸张..."
            rows="3"
            maxlength="200"
            @keydown.enter.exact.prevent="submitQuestion"
        ></textarea>
        <div class="dialog-footer">
          <button
              class="dialog-btn dialog-btn-voice"
              type="button"
              :class="{ 'dialog-btn-voice--active': isListening || isVoiceInputStarting, 'dialog-btn-voice--unsupported': !voiceInputSupported }"
              :disabled="trailCommandPending"
              :title="voiceInputButtonTitle"
              @click="toggleVoiceInput"
          >
            <i :class="isListening ? 'fas fa-stop' : 'fas fa-microphone'"></i>
            <span>{{ isListening ? '停止听写' : (isVoiceInputStarting ? '准备听写' : '语音提问') }}</span>
          </button>
          <span class="char-count">{{ inputQuestion.length }}/200</span>
          <button class="dialog-btn dialog-btn-cancel" @click="closeInputDialog">取消</button>
          <button class="dialog-btn dialog-btn-submit" @click="submitQuestion" :disabled="!inputQuestion.trim()">
            提问
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { message } from 'ant-design-vue';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { matchFixedAnswer } from '../config/chatReplyConfig.js';
import { createSession as createSessionApi, getChatStreamUrl } from '../api/AiChatApi.js';
import { synthesizeSpeech, revokeSpeechUrl, getVoices } from '../api/TtsApi.js';
import { buildFallbackReply, buildRagPrompt, searchKnowledge } from '../utils/knowledgeSearch.js';
import { createBrowserSpeechRecognition, getBrowserSpeechRecognitionCtor } from '../utils/browserSpeech.js';
import { useUserStore } from '../store/user.js';
import { mcpClient, parseAndExecute } from '../mcp/index.js';
import { getProductPage } from '../api/ShopProductApi.js';
import { getEnabledCategories } from '../api/ShopCategoryApi.js';
import { createOrder } from '../api/OrderApi.js';
import { getUserDefaultAddress } from '../api/AddressApi.js';
import xuanmiaoPeekImage from '../assets/sanxingdui-ai-chat/xuanmiao-peek-cutout.png';

export default {
  name: 'Live2DAvatar',
  data() {
    return {
      xuanmiaoPeekImage,
      // 渚ц竟鏍?
      isPanelOpen: true,   // 棣栨鍔犺浇灞曠ず鐜勫柕
      hasPendingMsg: false,
      autoHideTimer: null,

      currentAnswer: '',
      isAnswering: false,
      currentSessionId: null,
      userInteracted: false,
      isDestroyed: false,
      ragAbortController: null,

      // 杈撳叆瀵硅瘽妗?
      showInputDialog: false,
      inputQuestion: '',
      dialogPosition: { x: 0, y: 0 },
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      avatarPosition: { x: 0, y: 0 },
      avatarDragOffset: { x: 0, y: 0 },
      avatarPointerStart: { x: 0, y: 0 },
      isAvatarDragging: false,
      avatarDragMoved: false,
      suppressNextAvatarClick: false,

      // 鎵撳瓧鏈?璇煶鐩稿叧
      typewriterInterval: null,
      hideTimeout: null,
      audioEl: null,
      audioCtx: null,
      currentAudioUrl: null,
      externalSpeechContext: null,
      ttsAbortController: null,
      speechPlaybackToken: 0,
      playDelayTimer: null,
      fullTextToSpeak: '',
      displayedText: '',
      isSpeaking: false,
      isStopped: false,
      isHiding: false,
      isScrollable: false,
      thinkingInterval: null,
      thinkingPhrases: [
        '玄喵正在思考中...',
        '玄喵正在整理资料...',
        '玄喵马上为您解答...',
        '玄喵正在核对本地知识...',
        '玄喵在查找更准确的线索...',
        '玄喵已经找到重点了...',
        '玄喵正在组织讲解顺序...',
        '请稍等，玄喵马上说给你听...'
      ],
      // Live2D鐩稿叧
      scriptLoaded: false,
      live2dCanvas: null,
      live2dObserver: null,

      // 闊宠壊
      voiceList: [],
      selectedVoice: 'default',
      voiceInputSupported: false,
      voiceInputError: '',
      isListening: false,
      isVoiceInputStarting: false,
      voiceInputStopRequested: false,
      voiceInputStartToken: 0,
      voiceInputRetrying: false,
      voiceInputAttemptIsRetry: false,
      speechRecognition: null,
      trailCommandSeq: 0,
      trailCommandPending: false,
      mcpEventHandlers: null,
      pendingBatchOrder: null,
      demoCommandTimers: []
    }
  },
  computed: {
    bubbleStyle() {
      const position = this.getSafeAvatarPosition();
      const margin = 12;
      const bubbleWidth = Math.min(280, window.innerWidth - margin * 2);
      const bubbleHeight = 300;
      const avatarWidth = this.live2dCanvas?.offsetWidth || 180;
      const avatarHeight = this.live2dCanvas?.offsetHeight || 360;
      const avatarRight = position.x + avatarWidth;
      const avatarCenterX = position.x + avatarWidth / 2;
      const nearLeft = position.x < bubbleWidth * 0.55;

      const anchorOverlap = Math.min(58, avatarWidth * 0.32);
      const x = nearLeft
        ? avatarRight - anchorOverlap
        : position.x - bubbleWidth + anchorOverlap;
      const topNearAvatar = position.y + Math.min(30, avatarHeight * 0.1);
      const xSafe = Math.max(margin, Math.min(window.innerWidth - bubbleWidth - margin, x));
      const y = Math.max(74, Math.min(window.innerHeight - bubbleHeight - margin, topNearAvatar));
      return {
        left: `${xSafe}px`,
        top: `${y}px`,
        right: 'auto',
        bottom: 'auto',
        width: `${bubbleWidth}px`,
        '--bubble-tail-left': `${Math.max(34, Math.min(bubbleWidth - 34, avatarCenterX - xSafe))}px`
      };
    },
    voiceInputButtonTitle() {
      if (this.isVoiceInputStarting) return '正在准备麦克风';
      if (this.isListening) return '停止语音输入';
      if (this.isSpeaking || this.isAnswering) return '停止玄喵当前讲解并开始语音输入';
      if (this.voiceInputSupported) return '开始语音输入';
      return this.voiceInputError || '当前浏览器不支持语音输入';
    }
  },
  mounted() {
    this.selectedVoice = localStorage.getItem('xuanmiao_voice') || 'default';
    this.refreshVoiceInputSupport();
    this.loadVoices();
    this.loadL2DScript();
    this.observeLive2DCreation();
    this._onDocClick = () => this.resetAutoHide();
    document.addEventListener('click', this._onDocClick);
    window.addEventListener('xuanmiao:say', this.handleExternalSpeech);
    window.addEventListener('xuanmiao:stop', this.handleExternalStop);
    this.initMcpClient();
  },

  methods: {
    async searchProductsByCategory(categoryName) {
      try {
        const categories = await getEnabledCategories();
        const keyword = String(categoryName || '').trim();
        const category = categories.find(c =>
          c.name?.includes(keyword) || keyword.includes(c.name)
        );

        if (!category) {
          const result = await getProductPage({
            title: keyword,
            status: 1,
            hasStock: true,
            pageSize: 100
          });
          return {
            success: true,
            category: null,
            products: result.records || result.data || [],
            total: result.total
          };
        }

        const result = await getProductPage({
          categoryId: category.id,
          status: 1,
          hasStock: true,
          pageSize: 100
        });

        return {
          success: true,
          category,
          products: result.records || result.data || [],
          total: result.total
        };
      } catch (error) {
        console.error('[MCP] Search products error:', error);
        return { success: false, error: error.message };
      }
    },

    async getDefaultAddressId() {
      try {
        const address = await getUserDefaultAddress({ showDefaultMsg: false });
        return address?.id || null;
      } catch (error) {
        console.warn('[MCP] Default address lookup failed:', error);
        return null;
      }
    },

    async batchOrderProducts(products, quantityPerItem = 1) {
      if (!products || products.length === 0) {
        return { success: false, error: '没有可下单的商品' };
      }

      const addressId = await this.getDefaultAddressId();
      if (!addressId) {
        return { success: false, needAddress: true, error: '请先添加或设置默认收货地址' };
      }

      const results = [];
      for (const product of products) {
        try {
          const order = await createOrder({
            productId: product.id,
            quantity: quantityPerItem,
            addressId,
            remark: '玄喵语音下单'
          }, { showDefaultMsg: false });
          results.push({ productId: product.id, productName: product.title, success: true, order });
        } catch (error) {
          results.push({ productId: product.id, productName: product.title, success: false, error: error.message });
        }
      }

      return {
        success: true,
        results,
        totalCount: products.length,
        successCount: results.filter(r => r.success).length
      };
    },

    async loadVoices() {
      try {
        const list = await getVoices();
        if (list && list.length) this.voiceList = list;
      } catch (e) {
        this.voiceList = [
          { key: 'default', label: '默认男声', desc: '中性沉稳 alex' },
          { key: 'zh_female', label: '标准女声', desc: '清晰自然 bella' },
          { key: 'sweet', label: '甜美女声', desc: '甜美活泼 anna' }
        ];
      }
    },

    selectVoice(key) {
      this.selectedVoice = key;
      localStorage.setItem('xuanmiao_voice', key);
    },

    onVoiceChange() {
      localStorage.setItem('xuanmiao_voice', this.selectedVoice);
    },

    initMcpClient() {
      mcpClient.initialize({ debug: import.meta.env.DEV });
      this.mcpEventHandlers = {
        'mcp:start-explain': this.handleStartExplain.bind(this),
        'mcp:ask-ai': this.handleAskAi.bind(this),
        'mcp:play-voice': this.handlePlayVoice.bind(this),
        'mcp:start-quiz': this.handleStartQuiz.bind(this),
      };

      Object.entries(this.mcpEventHandlers).forEach(([event, handler]) => {
        window.addEventListener(event, handler);
      });
    },

    cleanupMcpListeners() {
      if (!this.mcpEventHandlers) return;
      Object.entries(this.mcpEventHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
      this.mcpEventHandlers = null;
    },

    handleStartExplain(event) {
      const { artifact_id } = event.detail || {};
      if (artifact_id) {
        this.startTypewriterAndSpeech('即将为您讲解这件文物，请稍候...', { playDelayMs: 500 });
        setTimeout(() => {
          this.$router.push(`/heritage/${artifact_id}`);
        }, 1200);
      } else {
        this.startTypewriterAndSpeech('请先选择一件文物，我再为您讲解。', { playDelayMs: 500 });
      }
    },

    handleAskAi(event) {
      const { question } = event.detail || {};
      if (question) {
        this.askWithRag(question);
      }
    },

    handlePlayVoice(event) {
      const { artifact_id, voice_type } = event.detail || {};
      if (artifact_id) {
        this.startTypewriterAndSpeech('正在为您播放语音介绍...', { playDelayMs: 500 });
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mcp:play-artifact-voice', {
            detail: { artifact_id, voice_type }
          }));
        }, 1200);
      } else if (this.$route.path.includes('/heritage/')) {
        const currentArtifactId = this.$route.params.id;
        this.startTypewriterAndSpeech('正在播放当前文物的语音介绍...', { playDelayMs: 500 });
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mcp:play-artifact-voice', {
            detail: { artifact_id: currentArtifactId, voice_type }
          }));
        }, 1200);
      } else {
        this.startTypewriterAndSpeech('请先打开一个文物详情页，我才能播放语音介绍。', { playDelayMs: 500 });
      }
    },

    handleStartQuiz() {
      this.startTypewriterAndSpeech('正在跳转知识问答页面...', { playDelayMs: 500 });
    },

    refreshVoiceInputSupport() {
      this.voiceInputSupported = Boolean(getBrowserSpeechRecognitionCtor());
      this.voiceInputError = this.voiceInputSupported ? '' : this.getVoiceInputUnavailableMessage();
      return this.voiceInputSupported;
    },

    getVoiceInputUnavailableMessage() {
      if (typeof window === 'undefined') {
        return '当前运行环境不支持语音输入。';
      }
      const host = window.location.hostname;
      const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(host);
      if (window.location.protocol !== 'https:' && !isLocalhost) {
        return '语音输入需要 HTTPS 或 localhost 环境。';
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        return '当前浏览器没有开放麦克风能力，请换 Edge/Chrome 或检查浏览器权限。';
      }
      return '当前浏览器内核没有开放语音识别能力，建议用系统浏览器 Edge/Chrome 打开 localhost 页面。';
    },

    getSpeechRecognitionErrorMessage(error) {
      const errorMap = {
        'not-allowed': '麦克风权限被拒绝，请在浏览器地址栏允许麦克风后重试。',
        'service-not-allowed': '浏览器语音识别服务不可用，请检查浏览器语音权限或换 Edge/Chrome。',
        'audio-capture': '没有检测到可用麦克风，请检查系统输入设备。',
        'no-speech': '没有听到声音，可以靠近麦克风后再试一次。',
        network: '浏览器语音识别刚才没有连上，玄喵会自动再试一次。',
        aborted: ''
      };
      return errorMap[error] || '语音输入暂时不可用，请改用文字输入。';
    },

    waitForVoiceInputRelease(ms = 520) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    stopVoiceInput() {
      this.voiceInputStartToken += 1;
      this.isVoiceInputStarting = false;
      this.voiceInputRetrying = false;
      this.voiceInputStopRequested = true;
      this.voiceInputAttemptIsRetry = false;
      if (this.speechRecognition) {
        try {
          this.speechRecognition.abort();
        } catch (error) {
          console.warn('璇煶杈撳叆鍋滄澶辫触:', error);
        }
      }
      this.speechRecognition = null;
      this.isListening = false;
    },

    ensureVoiceInput() {
      if (this.speechRecognition) {
        return this.speechRecognition;
      }

      const recognition = createBrowserSpeechRecognition();
      if (!recognition) {
        return null;
      }

      recognition.onstart = () => {
        this.isListening = true;
        this.isVoiceInputStarting = false;
        this.voiceInputAttemptIsRetry = false;
        this.voiceInputError = '';
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0]?.transcript || '';
        }

        const text = transcript.trim();
        if (text) {
          this.inputQuestion = text;
        }
      };

      recognition.onerror = async (event) => {
        const errorType = event?.error || '';
        this.isListening = false;
        this.speechRecognition = null;
        this.isVoiceInputStarting = false;
        if ((errorType === 'network' || errorType === 'aborted') && !this.voiceInputRetrying && !this.voiceInputStopRequested && !this.voiceInputAttemptIsRetry) {
          this.voiceInputRetrying = true;
          await this.waitForVoiceInputRelease(720);
          if (!this.isDestroyed && !this.isListening) {
            await this.startVoiceInputRecognition({ retry: true, quiet: true });
          }
          this.voiceInputRetrying = false;
          return;
        }
        const errorMessage = this.voiceInputAttemptIsRetry && errorType === 'network'
          ? '浏览器语音识别网络服务不可用，请稍后再试或改用文字输入。'
          : this.getSpeechRecognitionErrorMessage(errorType);
        this.voiceInputAttemptIsRetry = false;
        if (errorMessage) {
          this.voiceInputError = errorMessage;
          message.warning(errorMessage);
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        this.speechRecognition = null;
        this.isVoiceInputStarting = false;
        this.voiceInputAttemptIsRetry = false;
      };

      this.speechRecognition = recognition;
      return this.speechRecognition;
    },

    async toggleVoiceInput() {
      if (!this.refreshVoiceInputSupport()) {
        message.warning(this.voiceInputError || '当前浏览器不支持语音输入。');
        return;
      }

      if (this.isListening || this.isVoiceInputStarting) {
        this.stopVoiceInput();
        return;
      }

      this.voiceInputStopRequested = false;
      await this.prepareForVoiceInput();
      await this.startVoiceInputRecognition();
    },

    async startVoiceInputRecognition(options = {}) {
      const token = ++this.voiceInputStartToken;
      this.isVoiceInputStarting = true;
      this.voiceInputStopRequested = false;
      this.voiceInputAttemptIsRetry = Boolean(options.retry);
      this.voiceInputError = '';

      const recognition = this.ensureVoiceInput();
      if (!recognition) {
        this.isVoiceInputStarting = false;
        message.warning(this.getVoiceInputUnavailableMessage());
        return;
      }

      try {
        await this.waitForVoiceInputRelease(options.retry ? 360 : 120);
        if (this.isDestroyed || token !== this.voiceInputStartToken) {
          return;
        }
        recognition.start();
      } catch (error) {
        this.isListening = false;
        this.isVoiceInputStarting = false;
        this.speechRecognition = null;
        console.warn('启动语音输入失败:', error);
        if (!options.retry) {
          await this.waitForVoiceInputRelease(620);
          if (!this.isDestroyed && token === this.voiceInputStartToken) {
            await this.startVoiceInputRecognition({ retry: true, quiet: true });
            return;
          }
        }
        if (!options.quiet) {
          message.warning('语音输入启动失败，请稍后再试。');
        }
      }
    },

    async prepareForVoiceInput() {
      const shouldStopSpeech = this.isSpeaking || this.isAnswering || this.audioEl || this.ttsAbortController;
      if (!shouldStopSpeech) {
        return;
      }

      this.ragAbortController?.abort?.();
      this.isAnswering = false;
      this.stopAudio();
      this.clearAllTimers();
      this.stopThinkingStatus();
      this.isSpeaking = false;
      this.isStopped = false;
      this.isHiding = false;
      this.isScrollable = false;

      const bubbleEl = document.getElementById('ai-bubble');
      if (bubbleEl) {
        bubbleEl.classList.remove('speaking');
      }

      this.notifyExternalSpeech('stopped');
      await this.waitForVoiceInputRelease(520);
    },

    getRagContextPayload() {
      return {};
    },

    getThinkingPhrase() {
      const phrases = this.thinkingPhrases || [];
      if (!phrases.length) {
        return '玄喵正在思考中...';
      }
      return phrases[Math.floor(Math.random() * phrases.length)];
    },

    startThinkingStatus(immediate = true, intervalMs = 2400) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;

      if (immediate) {
        this.displayedText = this.getThinkingPhrase();
        this.checkScrollBar();
        this.scrollToBottom();
      }

      this.thinkingInterval = setInterval(() => {
        if (!this.isSpeaking || this.isStopped || this.isDestroyed) {
          this.stopThinkingStatus();
          return;
        }
        this.displayedText = this.getThinkingPhrase();
        this.checkScrollBar();
        this.scrollToBottom();
      }, intervalMs);
    },

    stopThinkingStatus() {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    },

    async ensureChatSession() {
      if (this.currentSessionId) {
        return this.currentSessionId;
      }

      try {
        const sessionId = await createSessionApi('鐜勫柕涓撲笟璁茶В', {
          showDefaultMsg: false
        });
        this.currentSessionId = sessionId;
        return sessionId;
      } catch (error) {
        this.currentSessionId = null;
        console.warn('鍒涘缓鐜勫柕浼氳瘽澶辫触锛屽噯澶囦娇鐢ㄦ湰鍦板厹搴?', error);
        return null;
      }
    },

    async playSpeechOnly(text) {
      return this.startTypewriterAndSpeech(text, {
        playDelayMs: 2000,
        charDelay: 110,
        thinkingIntervalMs: 2000
      });
    },

    async handleExternalSpeech(event) {
      const detail = event?.detail || {};
      const text = String(detail.text || '').trim();
      if (!text || this.isDestroyed) return;
      if (this.isSpeaking && detail.interrupt === false) return;

      await this.startTypewriterAndSpeech(text, {
        audioUrl: detail.audioUrl || '',
        playDelayMs: detail.playDelayMs ?? 120,
        charDelay: detail.charDelay ?? 68,
        thinkingIntervalMs: detail.thinkingIntervalMs ?? 900,
        externalContext: {
          key: detail.key || '',
          source: detail.source || 'external'
        }
      });
    },

    handleExternalStop(event) {
      const detail = event?.detail || {};
      if (!this.externalSpeechContext) return;
      if (detail.source && detail.source !== this.externalSpeechContext.source) return;
      if (detail.key && detail.key !== this.externalSpeechContext.key) return;
      this.stopSpeech();
    },

    async askWithRag(question) {
      try {
      const docs = await searchKnowledge(question, 1);
        const userMessage = buildRagPrompt(question, docs, this.getRagContextPayload());
        const sessionId = await this.ensureChatSession();

        if (!sessionId) {
          await this.startTypewriterAndSpeech(buildFallbackReply(question, docs, this.getRagContextPayload()), {
            playDelayMs: 700,
            charDelay: 72,
            thinkingIntervalMs: 1400
          });
          return;
        }

        this.isAnswering = true;
        this.clearAllTimers();
        this.stopAudio();
        this.isSpeaking = true;
        this.isStopped = false;
        this.isHiding = false;
        this.isScrollable = false;
        this.startThinkingStatus(true);
        this.fullTextToSpeak = '';
        this.currentAnswer = '';
        const bubbleEl = document.getElementById('ai-bubble');
        if (bubbleEl) {
          bubbleEl.style.display = 'block';
          bubbleEl.style.animation = 'fadeInUp 0.3s ease';
          bubbleEl.classList.add('speaking');
        }
        this.ragAbortController?.abort?.();
        this.ragAbortController = new AbortController();

        let streamText = '';
        const headers = {
          'Content-Type': 'application/json'
        };

        const userStore = useUserStore();
        const token = userStore.token;
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        try {
          await fetchEventSource(getChatStreamUrl(), {
            method: 'POST',
            headers,
            body: JSON.stringify({
              sessionId,
              userMessage
            }),
            signal: this.ragAbortController.signal,
            openWhenHidden: true,
            onmessage: (event) => {
              if (event.data === '[DONE]') {
                return;
              }

              if (event.data.startsWith('[ERROR]')) {
                throw new Error(event.data.replace(/^\[ERROR\]/, '') || 'AI 鍝嶅簲鏆備笉鍙敤');
            }

            streamText += event.data;
            this.currentAnswer = streamText;
          },
            onerror: (error) => {
              throw error;
            }
          });

          if (streamText) {
            await this.playSpeechOnly(streamText);
          } else {
            await this.startTypewriterAndSpeech(buildFallbackReply(question, docs, this.getRagContextPayload()), {
              playDelayMs: 700,
              charDelay: 72,
              thinkingIntervalMs: 1400
            });
          }
        } catch (error) {
          if (this.isDestroyed || this.ragAbortController?.signal?.aborted) {
            return;
          }
          console.error('鐜勫柕 RAG 瀵硅瘽澶辫触:', error);
          await this.startTypewriterAndSpeech(buildFallbackReply(question, docs, this.getRagContextPayload()), {
            playDelayMs: 700,
            charDelay: 72,
            thinkingIntervalMs: 1400
          });
        }
      } catch (error) {
        if (this.isDestroyed) {
          return;
        }
        console.error('鐜勫柕妫€绱㈡垨浼氳瘽鍒濆鍖栧け璐?', error);
        await this.startTypewriterAndSpeech(buildFallbackReply(question), {
          playDelayMs: 700,
          charDelay: 72,
          thinkingIntervalMs: 1400
        });
      } finally {
        this.isAnswering = false;
        this.ragAbortController = null;
      }
    },

    // ========== 渚ц竟鏍?==========
    togglePanel() {
      this.isPanelOpen = !this.isPanelOpen;
      if (this.isPanelOpen) {
        this.hasPendingMsg = false;
        this.userInteracted = true;
        this.startAutoHide();
      } else {
        this.cancelAutoHide();
      }
      this.syncWidgetVisibility();
    },

    syncWidgetVisibility() {
      const w = document.getElementById('live2d-widget');
      if (w) {
        w.style.opacity = this.isPanelOpen ? '1' : '0';
        w.style.pointerEvents = this.isPanelOpen ? 'auto' : 'none';
        w.style.transition = 'opacity 0.3s';
      }
      if (this.live2dCanvas) {
        this.live2dCanvas.style.pointerEvents = this.isPanelOpen ? 'auto' : 'none';
      }
    },

    getSafeAvatarPosition() {
      if (this.avatarPosition.x || this.avatarPosition.y) {
        return this.avatarPosition;
      }
      return {
        x: Math.max(12, window.innerWidth - 190),
        y: Math.max(80, window.innerHeight - 360)
      };
    },

    syncAvatarPosition() {
      if (!this.live2dCanvas) return;
      const rect = this.live2dCanvas.getBoundingClientRect();
      const fallback = this.getSafeAvatarPosition();
      this.avatarPosition = {
        x: rect.width ? rect.left : fallback.x,
        y: rect.height ? rect.top : fallback.y
      };
      this.applyAvatarPosition();
    },

    applyAvatarPosition() {
      if (!this.live2dCanvas) return;
      const width = this.live2dCanvas.offsetWidth || 180;
      const height = this.live2dCanvas.offsetHeight || 360;
      const x = Math.max(8, Math.min(window.innerWidth - width - 8, this.avatarPosition.x));
      const y = Math.max(72, Math.min(window.innerHeight - height - 8, this.avatarPosition.y));
      this.avatarPosition = { x, y };

      Object.assign(this.live2dCanvas.style, {
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        right: 'auto',
        bottom: 'auto'
      });
    },

    handleAvatarClick(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.suppressNextAvatarClick || this.avatarDragMoved) {
        this.suppressNextAvatarClick = false;
        this.avatarDragMoved = false;
        return;
      }
      this.userInteracted = true;
      this.handleClick(e);
    },

    startAvatarDrag(e) {
      if (!this.isPanelOpen || e.button !== 0) return;
      this.syncAvatarPosition();
      this.isAvatarDragging = true;
      this.avatarDragMoved = false;
      this.avatarPointerStart = { x: e.clientX, y: e.clientY };
      this.avatarDragOffset = {
        x: e.clientX - this.avatarPosition.x,
        y: e.clientY - this.avatarPosition.y
      };
      if (this.live2dCanvas) {
        this.live2dCanvas.style.cursor = 'grabbing';
        this.live2dCanvas.style.transform = 'scale(0.96)';
      }
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', this.onAvatarDrag);
      document.addEventListener('pointerup', this.stopAvatarDrag);
      e.preventDefault();
      e.stopPropagation();
    },

    onAvatarDrag(e) {
      if (!this.isAvatarDragging) return;
      const movedDistance = Math.hypot(e.clientX - this.avatarPointerStart.x, e.clientY - this.avatarPointerStart.y);
      if (movedDistance > 4) {
        this.avatarDragMoved = true;
        this.suppressNextAvatarClick = true;
      }
      this.avatarPosition = {
        x: e.clientX - this.avatarDragOffset.x,
        y: e.clientY - this.avatarDragOffset.y
      };
      this.applyAvatarPosition();
    },

    stopAvatarDrag() {
      if (!this.isAvatarDragging) return;
      this.isAvatarDragging = false;
      document.removeEventListener('pointermove', this.onAvatarDrag);
      document.removeEventListener('pointerup', this.stopAvatarDrag);
      document.body.style.userSelect = '';
      if (this.live2dCanvas) {
        this.live2dCanvas.style.cursor = 'grab';
        this.live2dCanvas.style.transform = 'scale(1)';
      }
      if (this.avatarDragMoved) {
        setTimeout(() => {
          this.suppressNextAvatarClick = false;
          this.avatarDragMoved = false;
        }, 120);
      }
    },

    startAutoHide(delay = 30000) {
      this.cancelAutoHide();
      this.autoHideTimer = setTimeout(() => {
        if (!this.isSpeaking && !this.showInputDialog) {
          this.isPanelOpen = false;
          this.syncWidgetVisibility();
        }
      }, delay);
    },

    cancelAutoHide() {
      clearTimeout(this.autoHideTimer);
    },

    resetAutoHide() {
      if (this.isPanelOpen && !this.isSpeaking && !this.showInputDialog) {
        this.startAutoHide();
      }
    },

    // ========== Live2D 鍔犺浇 ==========
    loadL2DScript() {
      if (this.isDestroyed) return;
      if (this.scriptLoaded || window.L2Dwidget) {
        this.scriptLoaded = true;
        this.initLive2D();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js';
      script.onload = () => {
        if (this.isDestroyed) return;
        this.scriptLoaded = true;
        setTimeout(() => this.initLive2D(), 500);
      };
      script.onerror = () => {
        //   console.error('鉂?CDN鍔犺浇澶辫触锛屽皾璇曞鐢ㄥ湴鍧€');
        const backupScript = document.createElement('script');
        backupScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/live2d-widget/3.1.4/L2Dwidget.min.js';
        backupScript.onload = () => {
          if (this.isDestroyed) return;
          this.scriptLoaded = true;
          setTimeout(() => this.initLive2D(), 500);
        };
        backupScript.onerror = () => {
          //  console.error('鉂?鎵€鏈塁DN鍧囧姞杞藉け璐ワ紝璇锋鏌ョ綉缁?);
          this.$emit('load-failed');
        };
        document.head.appendChild(backupScript);
      };
      document.head.appendChild(script);
    },

    initLive2D() {
      if (!window.L2Dwidget) return;
      window.L2Dwidget.init({
        model: {
          // jsonPath: 'https://unpkg.com/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json'
          jsonPath: 'https://unpkg.com/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json'

        },
        display: {
          position: 'right',
          width: 150,
          height: 160,
          hOffset: 20,
          vOffset: 0
        },
        mobile: {show: true, scale: 0.5},
        dialog: {enable: false},
        log: false,
        react: {
          opacityDefault: 1,
          opacityOnHover: 0.8
        }
      });

      setTimeout(() => {
        if (this.isDestroyed) return;
        this.startTypewriterAndSpeech('喵，如果你想了解三星堆的青铜神树、纵目面具、金杖或古蜀工艺，可以直接问我，我会结合资料认真讲给你听。');
      }, 800);
    },

    // ========== 鐩戝惉 Live2D 鐢诲竷 ==========
    observeLive2DCreation() {
      const observer = new MutationObserver((mutations) => {
        if (this.isDestroyed) {
          observer.disconnect();
          return;
        }
        const live2dCanvas = document.querySelector('canvas[width="180"][height="360"]') ||
            document.querySelector('#live2d-widget canvas');

        if (live2dCanvas && !this.live2dCanvas) {
          this.live2dCanvas = live2dCanvas;
          this.syncWidgetVisibility();
          observer.disconnect();
          // console.log('鉁?鎹曡幏鍒癓ive2D canvas锛岀粦瀹氱偣鍑讳簨浠?);

          this.live2dCanvas.style.pointerEvents = 'auto';
          this.live2dCanvas.style.cursor = 'grab';
          this.live2dCanvas.style.zIndex = '99999';
          this.live2dCanvas.style.touchAction = 'none';
          this.syncAvatarPosition();

          this.live2dCanvas.addEventListener('click', this.handleAvatarClick);
          this.live2dCanvas.addEventListener('pointerdown', this.startAvatarDrag);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
      this.live2dObserver = observer;

      setTimeout(() => {
        if (!this.live2dCanvas && !this.isDestroyed) {
          observer.disconnect();
          //   console.error('鉂?鏈崟鑾峰埌Live2D canvas');
        }
      }, 10000);
    },

    // ========== 鐐瑰嚮浜や簰 ==========
    handleClick(e) {
      this.clearAllTimers();
      this.stopAudio();

      // 濡傛灉闈㈡澘鍏抽棴锛屽厛鎵撳紑
      if (!this.isPanelOpen) {
        this.isPanelOpen = true;
        this.hasPendingMsg = false;
        this.startAutoHide();
        return;
      }

      if (this.live2dCanvas) {
        this.live2dCanvas.style.transform = 'scale(0.9)';
        setTimeout(() => {
          this.live2dCanvas.style.transform = 'scale(1)';
        }, 150);
      }

      this.inputQuestion = '';
      this.showInputDialog = true;

      const dialogWidth = 340;
      const dialogHeight = 280;
      const margin = 20;
      const avatar = this.getSafeAvatarPosition();

      this.dialogPosition.x = Math.max(margin, Math.min(window.innerWidth - dialogWidth - margin, avatar.x - dialogWidth - 18));
      this.dialogPosition.y = Math.max(76, Math.min(window.innerHeight - dialogHeight - margin, avatar.y + 34));

      this.$nextTick(() => {
        if (this.$refs.dialogInput) {
          this.$refs.dialogInput.focus();
        }
      });
    },

    closeInputDialog() {
      this.stopVoiceInput();
      this.showInputDialog = false;
      this.inputQuestion = '';
      this.isDragging = false;
    },

    startDrag(e) {
      if (e.target.closest('.dialog-close') || e.target.closest('.dialog-btn') || e.target.closest('.dialog-input') || e.target.closest('.voice-row-select')) {
        return;
      }
      this.isDragging = true;
      this.dragOffset.x = e.clientX - this.dialogPosition.x;
      this.dragOffset.y = e.clientY - this.dialogPosition.y;

      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
      e.preventDefault();
    },

    onDrag(e) {
      if (!this.isDragging) return;
      this.dialogPosition.x = e.clientX - this.dragOffset.x;
      this.dialogPosition.y = e.clientY - this.dragOffset.y;
    },

    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
    },

    async submitQuestion() {
      const question = this.inputQuestion.trim();
      if (!question || this.isAnswering || this.trailCommandPending) return;

      this.stopVoiceInput();
      this.closeInputDialog();

      this.trailCommandPending = true;
      let trailHandled = false;
      try {
        trailHandled = await this.tryHandleTrailCommand(question);
      } finally {
        this.trailCommandPending = false;
      }
      if (trailHandled) {
        return;
      }

      const mcpHandled = await this.handleMcpCommand(question);
      if (mcpHandled) {
        return;
      }

      const fixedReply = matchFixedAnswer(question);
      if (fixedReply) {
        this.startTypewriterAndSpeech(fixedReply);
        return;
      }

      this.askWithRag(question);
    },

    async handleMcpCommand(question) {
      try {
        if (this.handleDemoCommand(question)) {
          return true;
        }

        const userStore = useUserStore();
        const context = {
          router: this.$router,
          currentArtifact: this.getCurrentArtifactId(),
          currentActivity: this.getCurrentActivityId(),
          currentProduct: this.getCurrentProductId(),
          isAuthenticated: userStore.isLoggedIn,
          userId: userStore.userInfo?.id || userStore.user?.id || null
        };

        const result = await parseAndExecute(question, context);
        if (result.needAi) {
          return false;
        }

        if (!result.success) {
          return false;
        }

        const tool = result.tool;
        if (result.data?.needLogin) {
          this.startTypewriterAndSpeech('这个操作需要先登录，正在为您跳转登录页...', { playDelayMs: 500 });
          setTimeout(() => this.$router.push('/auth/login'), 1200);
          return true;
        }

        if (tool === 'batch_create_order') {
          await this.executeBatchOrder(result.data);
          return true;
        }

        if (tool === 'search_product' && result.data?.keyword) {
          this.startTypewriterAndSpeech(result.message || `正在搜索"${result.data.keyword}"...`, { playDelayMs: 500 });
          this.$router.push({
            path: '/shop',
            query: {
              keyword: result.data.keyword,
              buyQty: result.data.quantity || undefined
            }
          });
          return true;
        }

        if (tool === 'batch_pay_orders' || tool === 'batch_cancel_orders') {
          this.startTypewriterAndSpeech(result.message, { playDelayMs: 500 });
          return true;
        }

        if (result.message) {
          this.startTypewriterAndSpeech(result.message, { playDelayMs: 500 });
          return true;
        }

        return false;
      } catch (error) {
        console.error('[MCP] Command processing error:', error);
        return false;
      }
    },

    handleDemoCommand(question) {
      const command = this.parseDemoCommand(question);
      if (!command) return false;

      this.runDemoCommand(command);
      return true;
    },

    parseDemoCommand(question) {
      const normalized = this.normalizeDemoCommand(question);
      if (!normalized) return null;

      const hasAny = (words) => words.some((word) => normalized.includes(word));
      const isNavigationIntent = hasAny(['打开', '进入', '前往', '去', '跳到', '转到', '查看']);
      const isSearchIntent = hasAny(['找', '搜索', '查找', '查询', '看看有什么']);
      const isBuyIntent = hasAny(['买', '购买', '下单']);
      const hasGoldMask = hasAny(['黄金面具', '金面具', '完整金面具', '五号坑金面具']);

      if (hasGoldMask) {
        if (hasAny(['带我看', '去看', '想看', '我要看', '进入', '打开', '导览', '在哪里', '在哪'])) {
          return {
            type: 'trail_artifact',
            route: { path: '/trail', query: { entityId: 'HI-2025-002', pitCode: 'K5' } },
            startText: '好，我带你去时空展线看黄金面具。',
            doneText: '已经进入黄金面具线索，玄喵会继续带你看五号祭祀坑和展品现场。'
          };
        }
        if (isSearchIntent) {
          return {
            type: 'heritage_search',
            route: { path: '/heritage', query: { keyword: '黄金面具' } },
            startText: '正在为你搜索黄金面具相关文物。',
            doneText: '已经打开文物检索结果，可以继续点开详情查看。'
          };
        }
      }

      if (hasAny(['时空展线', '时空短线', '展线', 'trail']) && (isNavigationIntent || normalized === '时空展线' || normalized === '时空短线')) {
        return {
          type: 'navigate',
          route: { path: '/trail' },
          startText: '正在为你打开时空展线。',
          doneText: '已经进入时空展线，可以继续说想看哪件文物。'
        };
      }

      if (hasAny(['订单', '我的订单']) && hasAny(['查看', '打开', '去', '进入'])) {
        return {
          type: 'navigate',
          route: { path: '/orders' },
          startText: '正在为你打开订单页面。',
          doneText: '已经打开我的订单，可以查看刚才的购买记录。'
        };
      }

      if (hasAny(['个人中心', '我的信息', '账户', '我的']) && hasAny(['查看', '打开', '去', '进入'])) {
        return {
          type: 'navigate',
          route: { path: '/profile' },
          startText: '正在为你打开个人中心。',
          doneText: '已经打开个人中心，可以继续查看资料和地址。'
        };
      }

      if (hasAny(['答题', '挑战', '证书']) && (hasAny(['查看', '打开', '去', '进入', '赢']) || normalized === '答题')) {
        return {
          type: 'navigate',
          route: { path: '/quiz' },
          startText: '正在为你打开答题挑战。',
          doneText: '已经进入答题页，准备好就可以开始挑战。'
        };
      }

      if (hasAny(['商城', '商店', '文创商城']) && (isNavigationIntent || normalized === '商城' || normalized === '文创商城')) {
        return {
          type: 'navigate',
          route: { path: '/shop' },
          startText: '正在为你打开文创商城。',
          doneText: '已经打开商城，可以继续说要找什么文创。'
        };
      }

      if ((isSearchIntent || isBuyIntent || hasAny(['文创', '冰箱贴', '手办', '纪念品'])) && !hasGoldMask) {
        const keyword = this.extractDemoShopKeyword(normalized);
        if (keyword) {
          return {
            type: 'shop_search',
            route: { path: '/shop', query: { keyword } },
            startText: `正在为你搜索"${keyword}"。`,
            doneText: `已经打开"${keyword}"的商城搜索结果，可以继续筛选或点开商品。`
          };
        }
      }

      if (hasAny(['文物', '非遗作品', '非遗']) && isNavigationIntent) {
        return {
          type: 'navigate',
          route: { path: '/heritage' },
          startText: '正在为你打开文物列表。',
          doneText: '已经打开文物列表，可以继续搜索具体文物。'
        };
      }

      return null;
    },

    normalizeDemoCommand(text) {
      return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[，。！？、,.?！\s]/g, '');
    },

    extractDemoShopKeyword(normalizedText) {
      const knownKeywords = ['冰箱贴', '手办', '纪念品', '盲盒', '书签', '徽章', '钥匙扣', '文创'];
      const directHit = knownKeywords.find((keyword) => normalizedText.includes(keyword));
      if (directHit) return directHit;

      const cleaned = normalizedText
        .replace(/帮我|请帮我|我想|想要|打开|进入|前往|去|到|看看有什么|看看|搜索|查找|查询|找一下|找|购买|买|下单|全部|一下/g, '')
        .replace(/[零一二两三四五六七八九十百千万\d]+[个件份套]?/g, '')
        .replace(/类的|类|商品|文创商城|商城|商店|的/g, '')
        .trim();
      return cleaned || '';
    },

    runDemoCommand(command) {
      this.startTypewriterAndSpeech(command.startText, {
        playDelayMs: 500,
        forceDuringVoiceInput: true
      });

      this.scheduleDemoCommand(async () => {
        try {
          await this.$router.push(command.route);
        } catch (error) {
          if (error?.name !== 'NavigationDuplicated') {
            console.warn('[MCP] Demo command navigation skipped:', error);
          }
        }

        this.scheduleDemoCommand(() => {
          if (!this.isDestroyed) {
            this.startTypewriterAndSpeech(command.doneText, {
              playDelayMs: 500,
              forceDuringVoiceInput: true
            });
          }
        }, 360);
      }, command.delay || 650);
    },

    scheduleDemoCommand(callback, delay) {
      const timer = window.setTimeout(() => {
        this.demoCommandTimers = this.demoCommandTimers.filter((item) => item !== timer);
        callback();
      }, delay);
      this.demoCommandTimers.push(timer);
      return timer;
    },

    clearDemoCommandTimers() {
      this.demoCommandTimers.forEach((timer) => window.clearTimeout(timer));
      this.demoCommandTimers = [];
    },

    async executeBatchOrder(params) {
      const { category_name, keyword, quantity_per_item = 1 } = params || {};
      const searchKeyword = category_name || keyword;

      if (!searchKeyword) {
        this.startTypewriterAndSpeech('请告诉我您想购买什么分类的商品。', { playDelayMs: 500 });
        return;
      }

      const userStore = useUserStore();
      if (!userStore.isLoggedIn) {
        this.startTypewriterAndSpeech('批量下单需要登录，正在跳转到登录页面...', { playDelayMs: 500 });
        setTimeout(() => this.$router.push('/auth/login'), 1200);
        return;
      }

      this.startTypewriterAndSpeech(`正在搜索"${searchKeyword}"相关商品，请稍候...`, { playDelayMs: 500 });

      try {
        const searchResult = await this.searchProductsByCategory(searchKeyword);
        if (!searchResult.success) {
          this.startTypewriterAndSpeech(`抱歉，未找到"${searchKeyword}"相关商品。`, { playDelayMs: 500 });
          return;
        }

        const products = searchResult.products || [];
        if (products.length === 0) {
          this.startTypewriterAndSpeech(`"${searchKeyword}"下暂无可购买商品。`, { playDelayMs: 500 });
          return;
        }

        const orderResult = await this.batchOrderProducts(products, quantity_per_item);
        if (orderResult.needAddress) {
          this.startTypewriterAndSpeech('下单前需要默认收货地址，正在打开个人中心。', { playDelayMs: 500 });
          setTimeout(() => this.$router.push('/profile'), 1200);
          return;
        }

        const failedCount = orderResult.totalCount - orderResult.successCount;
        const summary = failedCount > 0
          ? `已为您创建 ${orderResult.successCount} 个订单，${failedCount} 个商品下单失败，可到我的订单查看。`
          : `已为您创建 ${orderResult.successCount} 个订单，可到我的订单查看。`;
        this.startTypewriterAndSpeech(summary, { playDelayMs: 500 });
        setTimeout(() => this.$router.push('/orders'), 1600);
      } catch (error) {
        console.error('[MCP] Batch order error:', error);
        this.startTypewriterAndSpeech('批量下单时出错，请稍后重试。', { playDelayMs: 500 });
      }
    },

    getCurrentArtifactId() {
      const match = this.$route.path.match(/\/heritage\/(?:detail\/)?([^/?]+)/);
      return match ? match[1] : null;
    },

    getCurrentActivityId() {
      const match = this.$route.path.match(/\/activity\/(?:detail\/)?([^/?]+)/);
      return match ? match[1] : null;
    },

    getCurrentProductId() {
      const match = this.$route.path.match(/\/shop\/(?:detail\/)?([^/?]+)/);
      return match ? match[1] : null;
    },

    tryHandleTrailCommand(question) {
      if (!question || typeof window === 'undefined') {
        return Promise.resolve(false);
      }

      return new Promise((resolve) => {
        let settled = false;
        const requestId = `trail-command-${Date.now()}-${++this.trailCommandSeq}`;
        const done = (payload = {}) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          resolve(Boolean(payload.handled));
        };
        const timer = window.setTimeout(() => done({ handled: false }), 260);

        try {
          window.dispatchEvent(new CustomEvent('xuanmiao:trail-command', {
            detail: {
              text: question,
              source: 'live2d-avatar',
              requestId,
              respond: done
            }
          }));
        } catch (error) {
          console.warn('鐜勫柕灞曠嚎鍛戒护鍒嗗彂澶辫触:', error);
          done({ handled: false });
        }
      });
    },

    handleBubbleClick() {
      if (this.isSpeaking) {
        this.stopSpeech();
      }
    },

    closeBubble() {
      this.ragAbortController?.abort?.();
      this.isAnswering = false;
      this.stopAudio();
      this.clearAllTimers();
      this.isSpeaking = false;
      this.isStopped = false;
      this.isHiding = false;
      this.isScrollable = false;

      const bubbleEl = document.getElementById('ai-bubble');
      if (bubbleEl) {
        bubbleEl.style.display = 'none';
      }
      this.notifyExternalSpeech('stopped');
    },

    stopSpeech() {
      this.ragAbortController?.abort?.();
      this.isAnswering = false;
      this.stopAudio();
      this.clearAllTimers();

      this.displayedText = this.fullTextToSpeak || this.displayedText;
      this.isSpeaking = false;
      this.isStopped = true;
      this.isAnswering = false;

      this.checkScrollBar();
      this.scheduleHide();
      this.notifyExternalSpeech('stopped');
    },

    // ========== 鎵撳瓧鏈烘晥鏋?==========
    startTypewriterEffect(text, autoHide = false) {
      this.clearAllTimers();
      this.isSpeaking = false;
      this.isStopped = false;
      this.isHiding = false;
      this.isScrollable = false;

      const bubbleEl = document.getElementById('ai-bubble');
      if (!bubbleEl) {
        //  console.warn('鏈壘鍒?AI 姘旀场鍏冪礌 #ai-bubble锛岃烦杩囨墦瀛楁晥鏋?);
        return;
      }
      bubbleEl.style.display = 'block';
      bubbleEl.style.animation = 'fadeInUp 0.3s ease';

      this.displayedText = '';
      let index = 0;
      const speed = 50;

      this.typewriterInterval = setInterval(() => {
        if (index < text.length) {
          this.displayedText += text.charAt(index);
          index++;
          this.checkScrollBar();
          this.scrollToBottom();
        } else {
          clearInterval(this.typewriterInterval);
          this.typewriterInterval = null;
          if (autoHide) this.scheduleHide();
        }
      }, speed);
    },

    async startTypewriterAndSpeech(text, options = {}) {
      const finalText = String(text || '').trim();
      if (!finalText || this.isDestroyed) {
        return;
      }
      if ((this.isListening || this.isVoiceInputStarting) && !options.forceDuringVoiceInput) {
        return;
      }

      const isModelAnswer = options.playDelayMs === 3000;
      const playDelayMs = options.playDelayMs ?? 700;
      const charDelayHint = options.charDelay ?? (isModelAnswer ? 110 : 72);
      const thinkingIntervalMs = options.thinkingIntervalMs ?? (isModelAnswer ? 3000 : 1400);

      this.notifyExternalSpeech('stopped');
      this.clearAllTimers();
      this.stopAudio();
      const playbackToken = this.speechPlaybackToken;
      this.externalSpeechContext = options.externalContext || null;
      this.isSpeaking = true;
      this.isStopped = false;
      this.isHiding = false;
      this.isScrollable = false;
      this.fullTextToSpeak = finalText;

      const bubbleEl = document.getElementById('ai-bubble');
      if (!bubbleEl) return;
      bubbleEl.style.display = 'block';
      bubbleEl.style.animation = 'fadeInUp 0.3s ease';
      bubbleEl.classList.add('speaking');

      this.startThinkingStatus(true, thinkingIntervalMs);

      try {
        let audioUrl = options.audioUrl || '';
        if (!audioUrl) {
          this.ttsAbortController = new AbortController();
          audioUrl = await synthesizeSpeech(finalText, this.selectedVoice, 1.0, {
            signal: this.ttsAbortController.signal
          });
          this.ttsAbortController = null;
        }
        const isCurrentSpeech = () => (
          !this.isDestroyed &&
          this.isSpeaking &&
          this.speechPlaybackToken === playbackToken
        );

        if (!isCurrentSpeech()) {
          revokeSpeechUrl(audioUrl);
          return;
        }

        this.currentAudioUrl = audioUrl;
        const audioEl = new Audio(audioUrl);
        this.audioEl = audioEl;

        let ttsReadyFired = false;
        const startPlaybackAndTyping = () => {
          if (!isCurrentSpeech() || this.audioEl !== audioEl || ttsReadyFired) return;
          ttsReadyFired = true;

          this.stopThinkingStatus();
          const duration = audioEl.duration || 3;
          const charDelay = Math.max(45, Math.min(140, charDelayHint || (duration * 1000) / Math.max(finalText.length, 12)));

          this.displayedText = '';
          let index = 0;
          clearInterval(this.typewriterInterval);
          this.typewriterInterval = setInterval(() => {
            if (!this.isSpeaking) {
              clearInterval(this.typewriterInterval);
              this.typewriterInterval = null;
              return;
            }

            if (index < finalText.length) {
              this.displayedText += finalText.charAt(index);
              index += 1;
              this.checkScrollBar();
              this.scrollToBottom();
            } else {
              clearInterval(this.typewriterInterval);
              this.typewriterInterval = null;
            }
          }, charDelay);

          clearTimeout(this.playDelayTimer);
          this.playDelayTimer = setTimeout(() => {
            if (!isCurrentSpeech() || this.audioEl !== audioEl) return;
            audioEl.play().catch(() => {
              if (!isCurrentSpeech() || this.audioEl !== audioEl) return;
              this.notifyExternalSpeech('error');
              this.continueTypingWithoutSpeech();
              this.startAutoHide();
            });
          }, playDelayMs);
        };

        audioEl.onloadedmetadata = startPlaybackAndTyping;
        setTimeout(() => {
          if (!isCurrentSpeech() || this.audioEl !== audioEl) return;
          if (!ttsReadyFired) {
            startPlaybackAndTyping();
          }
        }, 500);

        audioEl.onended = () => {
          if (!isCurrentSpeech() || this.audioEl !== audioEl) return;
          this.stopThinkingStatus();
          clearInterval(this.typewriterInterval);
          this.typewriterInterval = null;
          this.displayedText = finalText;
          this.isSpeaking = false;
          bubbleEl.classList.remove('speaking');
          this.checkScrollBar();
          this.scheduleHide();
          this.startAutoHide();
          this.notifyExternalSpeech('ended');
        };
        audioEl.onerror = () => {
          if (!isCurrentSpeech() || this.audioEl !== audioEl) return;
          this.stopThinkingStatus();
          this.notifyExternalSpeech('error');
          this.continueTypingWithoutSpeech();
          this.startAutoHide();
        };
      } catch (e) {
        this.ttsAbortController = null;
        if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.name === 'AbortError') {
          return;
        }
        if (this.isDestroyed) return;
        this.stopThinkingStatus();
        this.notifyExternalSpeech('error');
        this.continueTypingWithoutSpeech();
        this.startAutoHide();
      }
    },

    continueTypingWithoutSpeech() {
      this.clearAllTimers();
      this.isSpeaking = false;
      this.isStopped = false;
      this.externalSpeechContext = null;
      const bubbleEl = document.getElementById('ai-bubble');
      if (bubbleEl) bubbleEl.classList.remove('speaking');

      this.displayedText = '';
      let index = 0;
      this.typewriterInterval = setInterval(() => {
        if (index < this.fullTextToSpeak.length) {
          this.displayedText += this.fullTextToSpeak.charAt(index);
          index++;
          this.checkScrollBar();
          this.scrollToBottom();
        } else {
          clearInterval(this.typewriterInterval);
          this.typewriterInterval = null;
          this.scheduleHide();
        }
      }, 50);
    },

    stopAudio() {
      this.speechPlaybackToken += 1;
      if (this.ttsAbortController) {
        this.ttsAbortController.abort();
        this.ttsAbortController = null;
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close();
      }
      this.audioCtx = null;
      if (this.audioEl) {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
        this.audioEl = null;
      }
      if (this.currentAudioUrl) {
        revokeSpeechUrl(this.currentAudioUrl);
        this.currentAudioUrl = null;
      }
    },

    notifyExternalSpeech(status) {
      if (!this.externalSpeechContext) return;
      window.dispatchEvent(new CustomEvent(`xuanmiao:speech-${status}`, {
        detail: {
          ...this.externalSpeechContext,
          status
        }
      }));
      this.externalSpeechContext = null;
    },

    // ========== 宸ュ叿鏂规硶 ==========
    clearAllTimers() {
      clearTimeout(this.hideTimeout);
      clearTimeout(this.playDelayTimer);
      clearInterval(this.typewriterInterval);
      clearInterval(this.thinkingInterval);
      this.hideTimeout = null;
      this.playDelayTimer = null;
      this.typewriterInterval = null;
      this.thinkingInterval = null;
    },

    checkScrollBar() {
      this.$nextTick(() => {
        if (this.$refs.contentWrapper) {
          const wrapper = this.$refs.contentWrapper;
          this.isScrollable = wrapper.scrollHeight > wrapper.clientHeight;
        }
      });
    },

    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.contentWrapper) {
          this.$refs.contentWrapper.scrollTop = this.$refs.contentWrapper.scrollHeight;
        }
      });
    },

    scheduleHide() {
      this.hideTimeout = setTimeout(() => {
        this.isHiding = true;
        setTimeout(() => {
          const bubbleEl = document.getElementById('ai-bubble');
          if (bubbleEl) {
            bubbleEl.style.display = 'none';
          }
          this.isHiding = false;
          this.isStopped = false;
          this.isScrollable = false;
        }, 500);
      }, 30000);
    }
  },
  beforeUnmount() {
    this.isDestroyed = true;
    this.ragAbortController?.abort?.();
    this.stopVoiceInput();
    this.clearDemoCommandTimers();
    this.clearAllTimers();
    this.stopAudio();
    if (window.L2Dwidget) {
      window.L2Dwidget.destroy?.();
    }
    if (this.live2dCanvas) {
      this.live2dCanvas.removeEventListener('click', this.handleAvatarClick);
      this.live2dCanvas.removeEventListener('pointerdown', this.startAvatarDrag);
    }
    if (this.live2dObserver) {
      this.live2dObserver.disconnect();
      this.live2dObserver = null;
    }
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    document.removeEventListener('pointermove', this.onAvatarDrag);
    document.removeEventListener('pointerup', this.stopAvatarDrag);
    document.body.style.userSelect = '';
    if (this._onDocClick) {
      document.removeEventListener('click', this._onDocClick);
      this._onDocClick = null;
    }
    window.removeEventListener('xuanmiao:say', this.handleExternalSpeech);
    window.removeEventListener('xuanmiao:stop', this.handleExternalStop);
    this.cleanupMcpListeners();
  }
}
</script>

<style>
/* ========== 渚ц竟鏍忓竷灞€ ========== */
/* Keep the assistant above the fixed navbar (1000), but below fullscreen viewers and modal/guide overlays. */
.live2d-wrapper {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 1100;
}

/* 渚ц竟鍞ゅ嚭鏍囩 */
.side-tab {
  position: fixed;
  right: 0;
  top: 40%;
  transform: translateY(-50%);
  width: 86px;
  height: 140px;
  padding: 0;
  overflow: hidden;
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  display: block;
  z-index: 1110;
  transition: opacity 0.3s ease, transform 0.24s ease;
  box-shadow: none;
}
.live2d-wrapper.open .side-tab { opacity: 0; pointer-events: none; }

.side-tab:hover,
.side-tab:focus-visible {
  transform: translateY(-50%) translateX(-4px);
  outline: none;
}

.side-tab img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: right center;
  pointer-events: none;
  user-select: none;
}

.side-tab.has-msg::after {
  content: '';
  position: absolute;
  top: 18px;
  right: 16px;
  width: 10px;
  height: 10px;
  background: #e74c3c;
  border: 2px solid #fff9f0;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* 涓婚潰鏉?*/
.live2d-panel {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
.live2d-wrapper.open .live2d-panel {
  opacity: 1;
  pointer-events: auto;
}

.live2d-placeholder {
  position: fixed;
  right: 0;
  bottom: 0;
  width: 180px;
  height: 360px;
  z-index: 8;
  pointer-events: none;
}

#ai-bubble {
  position: fixed;
  bottom: 170px;
  right: 20px;
  width: 280px;
  max-height: 300px;
  background: linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%);
  border: 2px solid #d4a574;
  border-radius: 20px;
  padding: 16px 0;
  box-shadow: 0 8px 32px rgba(139, 69, 19, 0.15);
  z-index: 100001;
  display: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
  overflow: hidden;
}

.bubble-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 12;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #8a6045;
  background: rgba(255, 255, 255, 0.72);
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.bubble-close:hover {
  color: #5c3d2e;
  background: rgba(255, 255, 255, 0.96);
  transform: scale(1.04);
}

#ai-content-wrapper {
  max-height: 268px;
  overflow-y: hidden;
  padding: 0 20px 4px;
  box-sizing: border-box;
  z-index: 9;
}

#ai-bubble.speaking #ai-content-wrapper {
  padding-bottom: 28px;
}

#ai-content-wrapper.scrollable {
  overflow-y: auto;
}

#ai-content-wrapper::-webkit-scrollbar {
  width: 6px;
}

#ai-content-wrapper::-webkit-scrollbar-track {
  background: #fff5e6;
  border-radius: 3px;
  margin: 4px 0;
}

#ai-content-wrapper::-webkit-scrollbar-thumb {
  background: #d4a574;
  border-radius: 3px;
}

#ai-content-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #d4a574 #fff5e6;
}

#ai-bubble:hover {
  box-shadow: 0 8px 32px rgba(139, 69, 19, 0.25);
  border-color: #c49464;
}

#ai-bubble.speaking {
  border-color: #e74c3c;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(231, 76, 60, 0.2);
  }
  50% {
    box-shadow: 0 8px 32px rgba(231, 76, 60, 0.4);
  }
}

#ai-bubble::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: var(--bubble-tail-left, 220px);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #d4a574;
  transform: translateX(-50%);
}

#stop-hint {
  position: absolute;
  right: 42px;
  bottom: 10px;
  background: rgba(116, 65, 48, 0.94);
  color: white;
  padding: 4px 9px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

#stop-hint::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 5px solid rgba(116, 65, 48, 0.94);
}

#ai-bubble.speaking #stop-hint {
  opacity: 1;
}

#stop-icon {
  position: absolute;
  right: 12px;
  bottom: 9px;
  width: 24px;
  height: 24px;
  background: #b94d43;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  opacity: 0;
  box-shadow: 0 8px 18px rgba(116, 40, 32, 0.18);
  transition: opacity 0.3s ease, transform 0.2s ease, background 0.2s ease;
  z-index: 10;
}

#ai-bubble.speaking #stop-icon {
  display: flex;
  opacity: 1;
}

#ai-bubble.speaking #stop-icon:hover {
  background: #9f3b34;
  transform: scale(1.05);
}

#stop-icon::before {
  content: '';
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: #fff;
}

#ai-text {
  margin: 0;
  color: #5c3d2e;
  font-size: 14px;
  line-height: 1.6;
  font-family: "Microsoft YaHei", sans-serif;
  word-wrap: break-word;
  white-space: pre-wrap;
  padding-right: 24px;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: #5c3d2e;
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

#ai-bubble.hiding {
  animation: fadeOut 0.5s ease forwards;
}

#ai-bubble.stopped {
  border-color: #95a5a6;
  animation: none;
}

#ai-bubble.stopped #stop-hint {
  opacity: 0;
}

#live2d-widget {
  bottom: 0px !important;
  right: 20px !important;
  z-index: 1100 !important;
}

#live2d-widget canvas {
  cursor: pointer !important;
}

/* ========== 鎻愰棶瀵硅瘽妗嗘牱寮?========== */
.input-dialog {
  position: fixed;
  width: 340px;
  background: linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%);
  border: 2px solid #d4a574;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(139, 69, 19, 0.2);
  z-index: 1300;
  opacity: 0;
  transform: translateY(10px) scale(0.95);
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
  user-select: none;
}

.input-dialog.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #d4a574 0%, #c49464 100%);
  border-radius: 14px 14px 0 0;
  cursor: move;
}

.dialog-title {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dialog-title::before {
  content: '?';
  font-size: 12px;
  opacity: 0.7;
}

.dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 18px;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-close:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

.dialog-body {
  padding: 16px;
}

.dialog-hint {
  margin: 0 0 12px 0;
  color: #8b6914;
  font-size: 13px;
  font-weight: 500;
}

.dialog-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e8d5b7;
  border-radius: 10px;
  background: #fff;
  color: #5c3d2e;
  font-size: 14px;
  line-height: 1.5;
  font-family: "Microsoft YaHei", sans-serif;
  resize: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.dialog-input:focus {
  outline: none;
  border-color: #d4a574;
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.2);
}

.dialog-input::placeholder {
  color: #c4b896;
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.char-count {
  margin-left: auto;
  color: #b8a88a;
  font-size: 11px;
  flex-shrink: 0;
}

.dialog-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.dialog-btn-cancel {
  background: #f0e6d6;
  color: #8b6914;
}

.dialog-btn-cancel:hover {
  background: #e8d5b7;
}

.dialog-btn-voice {
  background: #eef4ea;
  color: #42664f;
  border: 1px solid rgba(66, 102, 79, 0.18);
}

.dialog-btn-voice--unsupported {
  color: #8b765d;
  background: #f7f0e6;
  border-style: dashed;
}

.dialog-btn-voice:hover:not(:disabled) {
  background: #e0ebdf;
  box-shadow: 0 4px 12px rgba(66, 102, 79, 0.12);
}

.dialog-btn-voice--active {
  color: #fff;
  background: linear-gradient(135deg, #42664f, #2d5140);
  border-color: transparent;
}

.dialog-btn-submit {
  background: linear-gradient(135deg, #d4a574 0%, #c49464 100%);
  color: #fff;
}

.dialog-btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #c49464 0%, #b88454 100%);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.4);
}

.dialog-btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 瀵硅瘽妗嗗皬涓夎 */
.input-dialog::after {
  content: '';
  position: absolute;
  bottom: -10px;
  right: 80px;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #d4a574;
}

/* ========== 瀵硅瘽妗嗛煶鑹查€夋嫨 ========== */
.dialog-voice-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.voice-row-label {
  font-size: 12px;
  color: #8b6914;
  font-weight: 500;
  flex-shrink: 0;
}

.voice-row-select {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #e8d5b7;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #5c3d2e;
  cursor: pointer;
  outline: none;
  font-family: "Microsoft YaHei", sans-serif;
}

.voice-row-select:focus {
  border-color: #d4a574;
  box-shadow: 0 0 0 2px rgba(212,165,116,0.15);
}

@media (max-width: 768px) {
  .input-dialog {
    right: 20px;
    width: calc(100vw - 40px);
    max-width: 340px;
  }
}
</style>
