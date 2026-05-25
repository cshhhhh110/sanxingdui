<template>
  <div class="live2d-wrapper" :class="{ open: isPanelOpen }">
    <!-- 侧边唤出标签 -->
    <div class="side-tab" @click="togglePanel" :class="{ 'has-msg': hasPendingMsg }">
      <span class="tab-icon">🐱</span>
      <span class="tab-label">玄喵</span>
    </div>

    <!-- 主面板 -->
    <div class="live2d-panel" @mouseenter="cancelAutoHide" @mouseleave="startAutoHide()">
      <!-- AI对话气泡 -->
      <div
          id="ai-bubble"
          :class="{
          'speaking': isSpeaking,
          'stopped': isStopped,
          'hiding': isHiding
        }"
          @click="handleBubbleClick"
      >
        <div id="stop-hint">点击停止播放</div>
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

      <!-- Live2D挂载容器 -->
      <div class="live2d-placeholder"></div>

    </div>

    <!-- 提问对话框 -->
    <div
        v-if="showInputDialog"
        class="input-dialog"
        :class="{ 'show': showInputDialog }"
        :style="{ left: dialogPosition.x + 'px', top: dialogPosition.y + 'px' }"
        @mousedown="startDrag"
    >
      <div class="dialog-header" @mousedown="startDrag">
        <span class="dialog-title"> 玄喵的提问</span>
        <button class="dialog-close" @click.stop="closeInputDialog">×</button>
      </div>
      <div class="dialog-body">
        <div class="dialog-voice-row" v-if="voiceList.length > 1">
          <span class="voice-row-label">音色</span>
          <select v-model="selectedVoice" @change="onVoiceChange" class="voice-row-select">
            <option v-for="v in voiceList" :key="v.key" :value="v.key">
              {{ v.label }} · {{ v.desc }}
            </option>
          </select>
        </div>
        <p class="dialog-hint">请输入你想了解的问题</p>
        <textarea
            ref="dialogInput"
            v-model="inputQuestion"
            class="dialog-input"
            placeholder="如：青铜神树代表什么、金杖纹样有什么含义、纵目面具为何夸张..."
            rows="3"
            maxlength="200"
            @keydown.enter.exact.prevent="submitQuestion"
        ></textarea>
        <div class="dialog-footer">
          <button
              class="dialog-btn dialog-btn-voice"
              type="button"
              :class="{ 'dialog-btn-voice--active': isListening }"
              :disabled="!voiceInputSupported"
              :title="voiceInputSupported ? (isListening ? '停止语音输入' : '开始语音输入') : '当前浏览器不支持语音输入'"
              @click="toggleVoiceInput"
          >
            <i :class="isListening ? 'fas fa-stop' : 'fas fa-microphone'"></i>
            <span>{{ isListening ? '停止听写' : '语音提问' }}</span>
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

export default {
  name: 'Live2DAvatar',
  data() {
    return {
      // 侧边栏
      isPanelOpen: true,   // 首次加载展示玄喵
      hasPendingMsg: false,
      autoHideTimer: null,

      currentAnswer: '',
      isAnswering: false,
      currentSessionId: null,
      userInteracted: false,
      isDestroyed: false,
      ragAbortController: null,

      // 输入对话框
      showInputDialog: false,
      inputQuestion: '',
      dialogPosition: { x: 0, y: 0 },
      isDragging: false,
      dragOffset: { x: 0, y: 0 },

      // 打字机/语音相关
      typewriterInterval: null,
      hideTimeout: null,
      audioEl: null,
      audioCtx: null,
      currentAudioUrl: null,
      playDelayTimer: null,
      fullTextToSpeak: '',
      displayedText: '',
      isSpeaking: false,
      isStopped: false,
      isHiding: false,
      isScrollable: false,
      thinkingInterval: null,
      thinkingPhrases: [
        '玄喵正在思考中…',
        '玄喵正在整理资料…',
        '玄喵马上为您解答…',
        '玄喵正在核对本地知识…',
        '玄喵在查找更准确的线索…',
        '玄喵已经找到重点了…',
        '玄喵正在组织讲解顺序…',
        '请稍等，玄喵马上说给你听…'
      ],
      // Live2D相关
      scriptLoaded: false,
      live2dCanvas: null,
      live2dObserver: null,

      // 音色
      voiceList: [],
      selectedVoice: 'default',
      voiceInputSupported: false,
      isListening: false,
      speechRecognition: null
    }
  },
  mounted() {
    this.selectedVoice = localStorage.getItem('xuanmiao_voice') || 'default';
    this.voiceInputSupported = Boolean(getBrowserSpeechRecognitionCtor());
    this.loadVoices();
    this.loadL2DScript();
    this.observeLive2DCreation();
    this._onDocClick = () => this.resetAutoHide();
    document.addEventListener('click', this._onDocClick);
  },

  methods: {
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

    stopVoiceInput() {
      if (this.speechRecognition) {
        try {
          this.speechRecognition.abort();
        } catch (error) {
          console.warn('语音输入停止失败:', error);
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

      recognition.onerror = (event) => {
        this.isListening = false;
        this.speechRecognition = null;
        if (event?.error && event.error !== 'aborted') {
          message.warning('语音输入暂时不可用，请改用文字输入。');
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        this.speechRecognition = null;
      };

      this.speechRecognition = recognition;
      return this.speechRecognition;
    },

    toggleVoiceInput() {
      if (!this.voiceInputSupported) {
        message.warning('当前浏览器不支持语音输入。');
        return;
      }

      if (this.isAnswering) {
        return;
      }

      if (this.isListening) {
        this.stopVoiceInput();
        return;
      }

      const recognition = this.ensureVoiceInput();
      if (!recognition) {
        message.warning('当前浏览器不支持语音输入。');
        return;
      }

      try {
        recognition.start();
      } catch (error) {
        console.warn('启动语音输入失败:', error);
        message.warning('语音输入启动失败，请稍后再试。');
      }
    },

    getRagContextPayload() {
      return {};
    },

    getThinkingPhrase() {
      const phrases = this.thinkingPhrases || [];
      if (!phrases.length) {
        return '玄喵正在思考中…';
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
        const sessionId = await createSessionApi('玄喵专业讲解', {
          showDefaultMsg: false
        });
        this.currentSessionId = sessionId;
        return sessionId;
      } catch (error) {
        this.currentSessionId = null;
        console.warn('创建玄喵会话失败，准备使用本地兜底:', error);
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
                throw new Error(event.data.replace(/^\[ERROR\]/, '') || 'AI 响应暂不可用');
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
          console.error('玄喵 RAG 对话失败:', error);
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
        console.error('玄喵检索或会话初始化失败:', error);
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

    // ========== 侧边栏 ==========
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

    // ========== Live2D 加载 ==========
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
        //   console.error('❌ CDN加载失败，尝试备用地址');
        const backupScript = document.createElement('script');
        backupScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/live2d-widget/3.1.4/L2Dwidget.min.js';
        backupScript.onload = () => {
          if (this.isDestroyed) return;
          this.scriptLoaded = true;
          setTimeout(() => this.initLive2D(), 500);
        };
        backupScript.onerror = () => {
          //  console.error('❌ 所有CDN均加载失败，请检查网络');
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
        this.startTypewriterAndSpeech('喵～如果你想了解三星堆的青铜神树、纵目面具、金杖或古蜀工艺，可以直接问我，我会结合资料认真讲给你听。');
      }, 800);
    },

    // ========== 监听 Live2D 画布 ==========
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
          // console.log('✅ 捕获到Live2D canvas，绑定点击事件');

          this.live2dCanvas.style.pointerEvents = 'auto';
          this.live2dCanvas.style.cursor = 'pointer';
          this.live2dCanvas.style.zIndex = '99999';

          this.live2dCanvas.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.userInteracted = true;
            this.handleClick(e);
          });

          this.live2dCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.userInteracted = true;
            this.handleClick(e);
          });

          this.live2dCanvas.addEventListener('mousedown', () => {
            this.live2dCanvas.style.transform = 'scale(0.9)';
          });
          this.live2dCanvas.addEventListener('mouseup', () => {
            this.live2dCanvas.style.transform = 'scale(1)';
          });
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
          //   console.error('❌ 未捕获到Live2D canvas');
        }
      }, 10000);
    },

    // ========== 点击交互 ==========
    handleClick(e) {
      this.clearAllTimers();
      this.stopAudio();

      // 如果面板关闭，先打开
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

      this.dialogPosition.x = window.innerWidth - dialogWidth - 200 - margin;
      this.dialogPosition.y = window.innerHeight - dialogHeight - 170 - margin;

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

    submitQuestion() {
      const question = this.inputQuestion.trim();
      if (!question || this.isAnswering) return;

      this.stopVoiceInput();
      this.closeInputDialog();

      const fixedReply = matchFixedAnswer(question);
      if (fixedReply) {
        this.startTypewriterAndSpeech(fixedReply);
        return;
      }

      this.askWithRag(question);
    },

    handleBubbleClick() {
      if (this.isSpeaking) {
        this.stopSpeech();
      }
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
    },

    // ========== 打字机效果 ==========
    startTypewriterEffect(text, autoHide = false) {
      this.clearAllTimers();
      this.isSpeaking = false;
      this.isStopped = false;
      this.isHiding = false;
      this.isScrollable = false;

      const bubbleEl = document.getElementById('ai-bubble');
      if (!bubbleEl) {
        //  console.warn('未找到 AI 气泡元素 #ai-bubble，跳过打字效果');
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

      const isModelAnswer = options.playDelayMs === 3000;
      const playDelayMs = options.playDelayMs ?? 700;
      const charDelayHint = options.charDelay ?? (isModelAnswer ? 110 : 72);
      const thinkingIntervalMs = options.thinkingIntervalMs ?? (isModelAnswer ? 3000 : 1400);

      this.clearAllTimers();
      this.stopAudio();
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
        const audioUrl = await synthesizeSpeech(finalText, this.selectedVoice);
        if (this.isDestroyed || !this.isSpeaking) {
          revokeSpeechUrl(audioUrl);
          return;
        }

        this.currentAudioUrl = audioUrl;
        this.audioEl = new Audio(audioUrl);

        let ttsReadyFired = false;
        const startPlaybackAndTyping = () => {
          if (this.isDestroyed || ttsReadyFired || !this.isSpeaking) return;
          ttsReadyFired = true;

          this.stopThinkingStatus();
          const duration = this.audioEl.duration || 3;
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
            if (this.isDestroyed || !this.isSpeaking || !this.audioEl) return;
            this.audioEl.play().catch(() => {
              if (this.isDestroyed) return;
              this.continueTypingWithoutSpeech();
              this.startAutoHide();
            });
          }, playDelayMs);
        };

        this.audioEl.onloadedmetadata = startPlaybackAndTyping;
        setTimeout(() => {
          if (this.isDestroyed) return;
          if (!ttsReadyFired) {
            startPlaybackAndTyping();
          }
        }, 500);

        this.audioEl.onended = () => {
          if (this.isDestroyed || !this.isSpeaking) return;
          this.stopThinkingStatus();
          clearInterval(this.typewriterInterval);
          this.typewriterInterval = null;
          this.displayedText = finalText;
          this.isSpeaking = false;
          bubbleEl.classList.remove('speaking');
          this.checkScrollBar();
          this.scheduleHide();
          this.startAutoHide();
        };
        this.audioEl.onerror = () => {
          if (this.isDestroyed) return;
          this.stopThinkingStatus();
          this.continueTypingWithoutSpeech();
          this.startAutoHide();
        };
      } catch (e) {
        if (this.isDestroyed) return;
        this.stopThinkingStatus();
        this.continueTypingWithoutSpeech();
        this.startAutoHide();
      }
    },

    continueTypingWithoutSpeech() {
      this.clearAllTimers();
      this.isSpeaking = false;
      this.isStopped = false;
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

    // ========== 工具方法 ==========
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
    this.clearAllTimers();
    this.stopAudio();
    if (window.L2Dwidget) {
      window.L2Dwidget.destroy?.();
    }
    if (this.live2dCanvas) {
      this.live2dCanvas.removeEventListener('click', this.handleClick);
    }
    if (this.live2dObserver) {
      this.live2dObserver.disconnect();
      this.live2dObserver = null;
    }
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    if (this._onDocClick) {
      document.removeEventListener('click', this._onDocClick);
      this._onDocClick = null;
    }
  }
}
</script>

<style>
/* ========== 侧边栏布局 ========== */
/* Keep the assistant above the fixed navbar (1000), but below fullscreen viewers and modal/guide overlays. */
.live2d-wrapper {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 1100;
}

/* 侧边唤出标签 */
.side-tab {
  position: fixed;
  right: 0;
  top: 40%;
  transform: translateY(-50%);
  width: 32px;
  padding: 10px 6px;
  background: linear-gradient(135deg, #d4a574, #c49464);
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 1110;
  transition: opacity 0.3s;
  box-shadow: -2px 0 12px rgba(139, 69, 19, 0.2);
}
.live2d-wrapper.open .side-tab { opacity: 0; pointer-events: none; }

.side-tab.has-msg::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: #e74c3c;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.tab-icon { font-size: 18px; line-height: 1; }
.tab-label {
  writing-mode: vertical-rl;
  font-size: 11px;
  color: #fff;
  letter-spacing: 2px;
}

/* 主面板 */
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
  z-index: 9;
  display: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
  overflow: hidden;
}

#ai-content-wrapper {
  max-height: 268px;
  overflow-y: hidden;
  padding: 0 20px;
  box-sizing: border-box;
  z-index: 9;
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
  right: 60px;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #d4a574;
}

#stop-hint {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #e74c3c;
  color: white;
  padding: 4px 12px;
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
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #e74c3c;
}

#ai-bubble.speaking #stop-hint {
  opacity: 1;
}

#stop-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #e74c3c;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
}

#ai-bubble.speaking #stop-icon {
  display: flex;
  opacity: 1;
}

#stop-icon::before {
  content: '■';
  color: white;
  font-size: 10px;
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

/* ========== 提问对话框样式 ========== */
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
  content: '⠿';
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

/* 对话框小三角 */
.input-dialog::after {
  content: '';
  position: absolute;
  bottom: -10px;
  right: 80px;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #d4a574;
}

/* ========== 对话框音色选择 ========== */
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
