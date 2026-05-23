<template>
  <div class="quiz-page">
    <!-- 三星堆背景装饰层（固定） -->
    <div class="sanxingdui-bg">
      <div class="bg-texture"></div>
      <img :src="imgZongmu" class="bg-watermark bg-watermark-left" alt="" />
      <img :src="imgLiren" class="bg-watermark bg-watermark-right" alt="" />
      <div class="bg-particles">
        <span v-for="n in 12" :key="n" class="particle" :style="particleStyle(n)"></span>
      </div>
    </div>

    <!-- Hero 头部：双图自动轮播 -->
    <div class="hero-section">
      <!-- 答题领证书飘带 -->
      <div class="hero-cert-ribbon">
        <span class="ribbon-text">答题领证书</span>
      </div>
      <div
        v-for="(img, i) in heroImages"
        :key="i"
        class="hero-bg-layer"
        :class="{ active: i === heroActive }"
        :style="{ backgroundImage: `url(${img})` }"
      ></div>
      <div class="hero-overlay"></div>
      <!-- 轮播指示器 -->
      <div class="hero-dots">
        <span
          v-for="(img, i) in heroImages"
          :key="i"
          class="hero-dot"
          :class="{ active: i === heroActive }"
        ></span>
      </div>
      <div class="hero-content">

        <h1 class="hero-title">{{ quizData.title }}</h1>
        <p class="hero-subtitle">{{ quizData.description }}</p>
        <div class="hero-icons">
          <span><i class="fas fa-question-circle"></i> {{ quizData.questions.length }}题</span>
          <span><i class="fas fa-star"></i> 满分{{ quizData.totalScore }}分</span>
          <span><i class="fas fa-clock"></i> 挑战模式</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="quiz-container">
      <Transition name="quiz-fade" mode="out-in">
        <!-- 状态一：开始页 -->
        <div v-if="quizState === 'start'" class="quiz-start" key="start">
          <div class="quiz-intro">
            <h2>准备好挑战了吗？</h2>
            <p class="intro-info">本次答题共 <strong>{{ quizData.questions.length }}</strong> 道选择题，每题 <strong>{{ quizData.perQuestionScore }}</strong> 分，满分 <strong>{{ quizData.totalScore }}</strong> 分</p>

            <div class="mode-selection">
              <div class="mode-title">选择答题模式</div>
              <div class="mode-cards">
                <div class="mode-card challenge" :class="{ active: selectedMode === 'challenge' }" @click="selectedMode = 'challenge'">
                  <div class="mode-icon"><i class="fas fa-stopwatch"></i></div>
                  <div class="mode-name">挑战模式</div>
                  <div class="mode-desc">每题限时，有排行榜</div>
                </div>
                <div class="mode-card practice" :class="{ active: selectedMode === 'practice' }" @click="selectedMode = 'practice'">
                  <div class="mode-icon"><i class="fas fa-book-open"></i></div>
                  <div class="mode-name">练习模式</div>
                  <div class="mode-desc">不限时，不上榜</div>
                </div>
              </div>
              <div v-if="selectedMode === 'challenge'" class="time-selection">
                <div class="time-title">选择每题时限</div>
                <div class="time-options">
                  <div v-for="t in TIME_OPTIONS" :key="t" class="time-option" :class="{ active: selectedTime === t }" @click="selectedTime = t">
                    {{ t }}秒
                  </div>
                </div>
              </div>
            </div>

            <div class="start-tips">
              <div class="tip-item"><i class="fas fa-mouse-pointer"></i><span>点击选项即可作答，答对自动进入下一题</span></div>
              <div class="tip-item"><i class="fas fa-lightbulb"></i><span>答错会显示正确答案，请注意记忆</span></div>
              <div class="tip-item"><i class="fas fa-certificate"></i><span>答题结束后可查看成绩并获得专属证书</span></div>
            </div>

            <a-button type="primary" size="large" class="start-btn" @click="startQuiz">
              <i class="fas fa-play"></i>
              {{ selectedMode === 'challenge' ? '开始挑战' : '开始练习' }}
            </a-button>
            <div class="start-actions">
              <a-button @click="showRankingModal = true"><i class="fas fa-trophy"></i> 排行榜</a-button>
              <a-button @click="showHistoryModal = true"><i class="fas fa-history"></i> 我的记录</a-button>
            </div>
          </div>
        </div>
        <!-- 状态二：答题中 -->
        <div v-else-if="quizState === 'doing'" class="quiz-doing-wrapper" key="doing">
          <div class="quiz-doing-main">
            <div class="quiz-top-bar">
              <div class="quiz-progress">
                <a-progress :percent="Math.round((currentIndex / quizData.questions.length) * 100)" :show-info="false" :stroke-color="'#8B6914'" />
                <div class="progress-text">第 {{ currentIndex + 1 }} / {{ quizData.questions.length }} 题</div>
              </div>
              <div v-if="selectedMode === 'challenge'" class="timer-display" :class="timerClass">
                <svg class="timer-svg" viewBox="0 0 60 60" width="60" height="60">
                  <circle class="timer-bg" cx="30" cy="30" r="26" />
                  <circle class="timer-progress" cx="30" cy="30" r="26" :stroke-dasharray="timerCircumference" :stroke-dashoffset="timerDashOffset" :class="timerCircleClass" />
                </svg>
                <span class="timer-number">{{ timeLeft }}</span>
              </div>
              <div class="total-time"><i class="fas fa-clock"></i> {{ formatTime(totalElapsed) }}</div>
            </div>

            <div class="question-card">
              <div class="question-number">第 {{ currentIndex + 1 }} 题</div>
              <div class="question-text">{{ currentQuestion.question }}</div>
            </div>

            <div class="options-list">
              <div v-for="(option, index) in currentQuestion.options" :key="index" class="option-item" :class="getOptionClass(index)" role="button" tabindex="0" @click="selectOption(index)" @keydown.enter.prevent="selectOption(index)" @keydown.space.prevent="selectOption(index)">
                <div class="option-label">{{ optionLabels[index] }}</div>
                <div class="option-text">{{ option }}</div>
                <div v-if="answered && index === currentQuestion.answer" class="option-icon correct-icon"><i class="fas fa-check-circle"></i></div>
                <div v-else-if="answered && selectedIndex === index && selectedIndex !== currentQuestion.answer" class="option-icon wrong-icon"><i class="fas fa-times-circle"></i></div>
              </div>
            </div>

            <div v-if="answered && selectedIndex !== currentQuestion.answer" class="answer-analysis">
              <a-alert type="warning" show-icon>
                <template #message>正确答案：{{ optionLabels[currentQuestion.answer] }}. {{ currentQuestion.options[currentQuestion.answer] }}</template>
              </a-alert>
            </div>

            <div class="quiz-action">
              <Transition name="btn-slide">
                <a-button v-if="answered && !isTimeoutPending" type="primary" size="large" @click="nextQuestion">
                  {{ currentIndex < quizData.questions.length - 1 ? '下一题' : '查看成绩' }} <i class="fas fa-arrow-right"></i>
                </a-button>
              </Transition>
            </div>
          </div>

          <div class="quiz-answer-sheet">
            <div class="sheet-title"><i class="fas fa-list"></i> 答题卡</div>
            <div class="sheet-grid">
              <div v-for="(q, idx) in quizData.questions" :key="idx" class="sheet-item" :class="getSheetItemClass(idx)" @click="jumpToQuestion(idx)">{{ idx + 1 }}</div>
            </div>
            <div class="sheet-legend">
              <div class="legend-item"><span class="legend-dot current"></span>当前</div>
              <div class="legend-item"><span class="legend-dot correct"></span>已答</div>
              <div class="legend-item"><span class="legend-dot wrong"></span>答错</div>
              <div class="legend-item"><span class="legend-dot pending"></span>未答</div>
            </div>
            <div class="sheet-stats">
              <div class="stat-row"><span>已答：</span><strong>{{ answeredQuestions.length }}</strong></div>
              <div class="stat-row"><span>正确：</span><strong class="correct">{{ correctCount }}</strong></div>
              <div class="stat-row"><span>错误：</span><strong class="wrong">{{ wrongCount }}</strong></div>
            </div>
            <a-button type="primary" class="submit-btn" @click="confirmSubmit"><i class="fas fa-paper-plane"></i> 交卷</a-button>
          </div>
        </div>
        <!-- 状态三：结果页 -->
        <div v-else-if="quizState === 'result'" class="quiz-result" key="result">
          <div class="result-goldmask">
            <img :src="imgGoldMask" alt="" class="goldmask-img" />
          </div>
          <div class="result-card">
            <h2 class="result-title">{{ resultTitle }}</h2>
            <p class="result-desc">{{ resultDesc }}</p>

            <div class="result-stats">
              <div class="stat-item"><div class="stat-value correct">{{ correctCount }}</div><div class="stat-label">答对</div></div>
              <div class="stat-divider"></div>
              <div class="stat-item"><div class="stat-value wrong">{{ wrongCount }}</div><div class="stat-label">答错</div></div>
              <div class="stat-divider"></div>
              <div class="stat-item"><div class="stat-value total">{{ quizData.totalScore }}</div><div class="stat-label">满分</div></div>
            </div>

            <div class="result-score">
              <div class="score-ring"><a-progress type="circle" :percent="scorePercent" :stroke-color="scoreColor" :format="() => score + ' 分'" /></div>
              <div class="score-label">您的得分</div>
            </div>

            <div class="result-extra">
              <div class="extra-item"><i class="fas fa-clock"></i><span>用时：{{ formatTime(totalTime) }}</span></div>
              <div v-if="currentRank" class="extra-item rank"><i class="fas fa-trophy"></i><span>本次排名：第 {{ currentRank }} 名</span></div>
            </div>

            <div class="result-actions">
              <a-button ref="restartBtn" type="primary" size="large" class="restart-btn" autofocus @click="restartQuiz"><i class="fas fa-redo"></i> 重新答题</a-button>
              <!-- 分数 >=80：显示【查看证书】 -->
              <a-button
                  v-if="selectedMode === 'challenge' && score >= 80"
                  type="primary"
                  size="large"
                  @click="goCert"
              >
                <i class="fas fa-award"></i> 查看证书
              </a-button>

              <!-- 分数 <80：显示【80分及以上可领证书】 -->
              <a-button
                  v-else-if="selectedMode === 'challenge'"
                  type="primary"
                  size="large"
                  disabled
              >
                <i class="fas fa-award"></i> 80分及以上可领证书
              </a-button>

              <a-button size="large" @click="showRankingModal = true"><i class="fas fa-trophy"></i> 查看排行榜</a-button>
              <a-button size="large" @click="goHome"><i class="fas fa-home"></i> 返回首页</a-button>
            </div>
          </div>
        </div>
        <!-- 状态四：证书页 -->
        <div v-else-if="quizState === 'cert'" class="quiz-cert" key="cert">
          <div class="cert-page">
            <div class="cert-page-header">
              <a-button type="text" size="large" @click="quizState = 'result'">
                <i class="fas fa-arrow-left"></i> 返回结果
              </a-button>
              <h2>答题证书</h2>
            </div>
            <div class="cert-page-body">
              <div class="cert-section-icon"><i class="fas fa-award"></i></div>
              <h3>恭喜获得专属证书</h3>
              <p>可保存证书图片，分享给好友</p>
              <div class="cert-name-display"><i class="fas fa-user"></i><span>{{ certName }}</span></div>
              <div class="cert-preview-wrapper"><canvas ref="certCanvas" class="cert-canvas"></canvas></div>
              <div class="cert-actions">
                <a-button type="primary" size="large" :loading="saving" @click="saveCert"><i class="fas fa-download"></i> 保存证书</a-button>
                <a-button size="large" @click="shareCert"><i class="fas fa-share-alt"></i> 分享证书</a-button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 排行榜弹窗 -->
    <a-modal
      v-model:open="showRankingModal"
      title="答题排行榜"
      :footer="null"
      width="600px"
    >
      <!-- 当前用户信息卡 -->
      <div v-if="userStore.isLoggedIn" class="ranking-self-card">
        <div class="ranking-self-avatar">
          <img v-if="userStore.avatar" :src="userStore.avatar" alt="">
          <i v-else class="fas fa-user"></i>
        </div>
        <div class="ranking-self-info">
          <div class="ranking-self-name">{{ userStore.userInfo?.username || '用户' }}</div>
          <div class="ranking-self-hint">我的最佳成绩</div>
        </div>
        <div v-if="myBestRecord" class="ranking-self-score">
          <span class="score-val">{{ myBestRecord.score }}分</span>
          <span class="score-rank">第 {{ myBestRecord.ranking || '-' }} 名</span>
        </div>
        <div v-else class="ranking-self-score">
          <span class="score-empty">暂无记录</span>
        </div>
      </div>

      <a-spin v-if="rankingLoading" style="display:block;text-align:center;padding:40px 0;" />
      <div v-else-if="rankingError" class="ranking-empty">
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="empty-text">加载失败，请稍后重试</div>
        <a-button type="primary" size="small" @click="loadRanking">重新加载</a-button>
      </div>
      <div v-else-if="rankingList.length === 0" class="ranking-empty">
        <div class="empty-icon"><i class="fas fa-trophy"></i></div>
        <div class="empty-text">暂无排名数据，快来成为第一个挑战者吧！</div>
      </div>
      <div v-else class="ranking-list">
        <div
          v-for="(item, idx) in rankingList"
          :key="item.id"
          class="ranking-item"
          :class="{ 'top-three': idx < 3, 'current-user': item.userId === userStore.userId }"
        >
          <div class="ranking-rank">
            <span v-if="idx === 0" class="medal gold">🥇</span>
            <span v-else-if="idx === 1" class="medal silver">🥈</span>
            <span v-else-if="idx === 2" class="medal bronze">🥉</span>
            <span v-else class="rank-num">{{ idx + 1 }}</span>
          </div>
          <div class="ranking-avatar">
            <img v-if="item.avatar" :src="item.avatar" alt="">
            <i v-else class="fas fa-user"></i>
          </div>
          <div class="ranking-info">
            <div class="ranking-name">{{ item.username }}</div>
            <div class="ranking-time">{{ formatTime(item.totalTime) }}</div>
          </div>
          <div class="ranking-score">{{ item.score }}分</div>
        </div>
      </div>
    </a-modal>

    <!-- 历史记录弹窗 -->
    <a-modal
      v-model:open="showHistoryModal"
      title="我的答题记录"
      :footer="null"
      width="600px"
    >
      <a-spin v-if="historyLoading" style="display:block;text-align:center;padding:40px 0;" />
      <div v-else-if="historyError" class="history-empty">
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="empty-text">加载失败，请稍后重试</div>
        <a-button type="primary" size="small" @click="loadHistory">重新加载</a-button>
      </div>
      <div v-else-if="historyList.length === 0" class="history-empty">
        <div class="empty-icon"><i class="fas fa-history"></i></div>
        <div class="empty-text">暂无答题记录，开始你的第一次挑战吧！</div>
      </div>
      <div v-else class="history-list">
        <div v-for="item in historyList" :key="item.id" class="history-item">
          <div class="history-info">
            <div class="history-date">{{ formatDate(item.createTime) }}</div>
            <div class="history-mode" :class="item.mode">{{ item.mode === 'challenge' ? '挑战' : '练习' }}</div>
          </div>
          <!-- 历史记录弹窗 - 修改 history-stats 部分 -->
          <div class="history-stats">
            <span class="history-score">{{ item.score }}分</span>
            <span class="history-detail">对{{ item.correctCount }}/错{{ item.totalCount - item.correctCount }}</span>
            <span class="history-time">{{ formatTime(item.totalTime) }}</span>
            <!-- 新增：查看证书按钮 -->
            <a-button
                v-if="item.mode === 'challenge' && item.score >= 80"
                type="link"
                size="small"
                class="history-cert-btn"
                @click="viewCertFromHistory(item)"
            >
              <i class="fas fa-award"></i> 查看证书
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 交卷确认弹窗 -->
    <a-modal
      v-model:open="showSubmitConfirm"
      title="确认交卷"
      @ok="submitQuiz"
      ok-text="确认交卷"
      cancel-text="继续答题"
    >
      <div class="submit-confirm-content">
        <p>已答题：<strong>{{ answeredQuestions.length }}</strong> / {{ quizData.questions.length }} 题</p>
        <p>答对：<strong class="correct">{{ correctCount }}</strong> 题</p>
        <p>答错：<strong class="wrong">{{ wrongCount }}</strong> 题</p>
        <p>未答：<strong class="pending">{{ quizData.questions.length - answeredQuestions.length }}</strong> 题</p>
        <a-divider />
        <p class="confirm-tip">确认要交卷吗？提交后将无法修改答案。</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { quizData } from '../data/quizData.js'
import { submitQuizRecord, getQuizRanking, getQuizHistory } from '@/api/quiz'
import { useUserStore } from '@/store/user'
import sealImg from '@/assets/seal.png'
import imgJisite from '@/assets/sanxingdui_01_jisite_quanjing.png'
import imgZhanting from '@/assets/sanxingdui_02_zhanting_quanjing.png'
import imgZongmu from '@/assets/sanxingdui_04_zongmu_mianju.png'
import imgLiren from '@/assets/sanxingdui_06_qingtong_liren.png'
import imgGoldMask from '@/assets/sanxingdui_08_huangjin_mianju.png'

const router = useRouter()
const userStore = useUserStore()

// ===== Hero 背景轮播 =====
const heroImages = [imgJisite, imgZhanting]
const heroActive = ref(0)
let heroTimer = null

const startHeroCarousel = () => {
  heroTimer = setInterval(() => {
    heroActive.value = (heroActive.value + 1) % heroImages.length
  }, 5000)
}

onMounted(() => startHeroCarousel())
onUnmounted(() => {
  if (heroTimer) clearInterval(heroTimer)
  stopTimer()
  stopElapsedTimer()
})

// ===== 模式和时间选项 =====
const selectedMode = ref('challenge')
const selectedTime = ref(20)
const TIME_OPTIONS = [15, 20, 30]

// ===== 答题状态 =====
const quizState = ref('start')
const currentIndex = ref(0)
const selectedIndex = ref(null)
const answered = ref(false)
const correctCount = ref(0)
const wrongCount = ref(0)
const score = ref(0)

// 答题状态记录
const questionStatus = ref([]) // 'pending' | 'correct' | 'wrong' | 'timeout'
const totalTime = ref(0)
const totalElapsed = ref(0)
const currentRank = ref(null)
const optionAnimateIndex = ref(-1)
const isTimeoutPending = ref(false)

const optionLabels = ['A', 'B', 'C', 'D']

const currentQuestion = computed(() => quizData.questions[currentIndex.value])

const answeredQuestions = computed(() => {
  return questionStatus.value.reduce((acc, status, idx) => {
    if (status !== 'pending') acc.push(idx)
    return acc
  }, [])
})

// ===== 证书相关方法 =====
const viewCertFromHistory = async (item) => {
  // 关闭历史记录弹窗
  showHistoryModal.value = false
  // 设置当前成绩为历史记录的成绩
  score.value = item.score
  correctCount.value = item.correctCount
  wrongCount.value = item.totalCount - item.correctCount
  // 切换到证书页
  quizState.value = 'cert'
  // 等待DOM更新后绘制证书
  await nextTick()
  await drawCert()
}

// ===== 计时器 =====
let timerInterval = null
let elapsedInterval = null
const timeLeft = ref(20)

const timerCircumference = 2 * Math.PI * 26

const timerDashOffset = computed(() => {
  const percent = Math.max(0, Math.min(1, timeLeft.value / selectedTime.value))
  return timerCircumference * (1 - percent)
})

const timerClass = computed(() => {
  if (timeLeft.value <= 5) return 'critical'
  if (timeLeft.value <= 10) return 'caution'
  return ''
})

const timerCircleClass = computed(() => {
  if (timeLeft.value <= 5) return 'timer-circle-critical'
  if (timeLeft.value <= 10) return 'timer-circle-caution'
  return ''
})

const startTimer = () => {
  timeLeft.value = selectedTime.value
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      handleTimeout()
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const startElapsedTimer = () => {
  elapsedInterval = setInterval(() => {
    totalElapsed.value++
  }, 1000)
}

const stopElapsedTimer = () => {
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
    elapsedInterval = null
  }
}

const handleTimeout = () => {
  stopTimer()
  if (!answered.value) {
    questionStatus.value[currentIndex.value] = 'timeout'
    wrongCount.value++
    selectedIndex.value = -1
    answered.value = true
    isTimeoutPending.value = true
    message.warning('时间到！自动标记为答错')
    setTimeout(() => {
      isTimeoutPending.value = false
      if (quizState.value !== 'doing') return
      if (currentIndex.value < quizData.questions.length - 1) {
        nextQuestion()
      } else {
        finishQuiz()
      }
    }, 2000)
  }
}

// ===== 答题逻辑 =====
const getOptionClass = (index) => {
  const classes = []
  if (optionAnimateIndex.value === index) classes.push('option-animate')
  if (!answered.value) return classes.join(' ')
  if (index === currentQuestion.value.answer) {
    classes.push('option-correct')
    if (optionAnimateIndex.value === index) classes.push('option-animate-correct')
  }
  if (index === selectedIndex.value && index !== currentQuestion.value.answer) {
    classes.push('option-wrong')
    if (optionAnimateIndex.value === index) classes.push('option-animate-wrong')
  }
  return classes.join(' ')
}

const getSheetItemClass = (idx) => {
  if (idx === currentIndex.value) return 'current'
  if (questionStatus.value[idx] === 'correct') return 'correct'
  if (questionStatus.value[idx] === 'wrong' || questionStatus.value[idx] === 'timeout') return 'wrong'
  return 'pending'
}

const startQuiz = () => {
  quizState.value = 'doing'
  currentIndex.value = 0
  selectedIndex.value = null
  answered.value = false
  correctCount.value = 0
  wrongCount.value = 0
  optionAnimateIndex.value = -1
  isTimeoutPending.value = false
  score.value = 0
  totalTime.value = 0
  totalElapsed.value = 0
  questionStatus.value = Array(quizData.questions.length).fill('pending')
  
  if (selectedMode.value === 'challenge') {
    startTimer()
  }
  startElapsedTimer()
}

const selectOption = (index) => {
  if (answered.value) return
  optionAnimateIndex.value = index
  setTimeout(() => { optionAnimateIndex.value = -1 }, 300)
  selectedIndex.value = index
  answered.value = true

  if (selectedMode.value === 'challenge') {
    stopTimer()
  }

  // 如果该题之前已作答，先回退之前的分数
  const prevStatus = questionStatus.value[currentIndex.value]
  if (prevStatus === 'correct') {
    correctCount.value--
    score.value -= quizData.perQuestionScore
  } else if (prevStatus === 'wrong' || prevStatus === 'timeout') {
    wrongCount.value--
  }

  if (index === currentQuestion.value.answer) {
    correctCount.value++
    score.value += quizData.perQuestionScore
    questionStatus.value[currentIndex.value] = 'correct'
  } else {
    wrongCount.value++
    questionStatus.value[currentIndex.value] = 'wrong'
  }
}

const nextQuestion = () => {
  if (isTimeoutPending.value) return
  if (currentIndex.value < quizData.questions.length - 1) {
    currentIndex.value++
    selectedIndex.value = null
    answered.value = false
    if (selectedMode.value === 'challenge') {
      startTimer()
    }
  } else {
    finishQuiz()
  }
}

const jumpToQuestion = (idx) => {
  // 挑战模式：只能跳转到未答题，且当前题未作答时才能跳
  if (selectedMode.value === 'challenge') {
    if (answered.value) return
    if (questionStatus.value[idx] !== 'pending') return
    stopTimer()
    startTimer()
  }
  currentIndex.value = idx
  selectedIndex.value = null
  answered.value = false
  // 触发答题卡 ripple 效果
  nextTick(() => {
    const items = document.querySelectorAll('.sheet-item')
    if (items[idx]) {
      items[idx].classList.remove('ripple')
      void items[idx].offsetWidth
      items[idx].classList.add('ripple')
      setTimeout(() => items[idx].classList.remove('ripple'), 600)
    }
  })
}

const confirmSubmit = () => {
  showSubmitConfirm.value = true
}

const submitQuiz = async () => {
  showSubmitConfirm.value = false
  await finishQuiz()
}

const finishQuiz = async () => {
  stopTimer()
  stopElapsedTimer()
  totalTime.value = totalElapsed.value
  quizState.value = 'result'
  
  // 提交成绩到后端（练习和挑战模式均保存，但只有挑战模式参与排名）
  if (userStore.isLoggedIn) {
    try {
      await submitQuizRecord({
        score: score.value,
        totalTime: totalTime.value,
        correctCount: correctCount.value,
        totalCount: quizData.questions.length,
        mode: selectedMode.value
      })
      message.success('成绩已提交！')

      if (selectedMode.value === 'challenge') {
        await loadRanking()
        const myRank = rankingList.value.findIndex(r => r.userId === userStore.userId)
        if (myRank !== -1) {
          currentRank.value = myRank + 1
        }
      }
    } catch (e) {
      console.error('提交成绩失败:', e)
    }
  }
}

const restartQuiz = () => startQuiz()
const goHome = () => router.push('/home')
const goCert = async () => {
  quizState.value = 'cert'
  await nextTick()
  await drawCert()
}

// ===== 结果相关 =====
const resultClass = computed(() => {
  if (score.value >= 90) return 'excellent'
  if (score.value >= 70) return 'good'
  if (score.value >= 50) return 'pass'
  return 'fail'
})

const resultTitle = computed(() => {
  const titles = { excellent: '太棒了！满分王者！', good: '很优秀！继续加油！', pass: '及格啦，还有进步空间', fail: '继续努力，多了解三星堆文化哦' }
  return titles[resultClass.value]
})

const resultDesc = computed(() => {
  const descs = {
    excellent: '您对三星堆文化了如指掌！',
    good: '您对三星堆文化了解较深！',
    pass: '您对三星堆文化有基本了解',
    fail: '建议多参观三星堆博物馆深入学习'
  }
  return descs[resultClass.value]
})

const resultIcon = computed(() => {
  const icons = { excellent: 'fas fa-crown', good: 'fas fa-star', pass: 'fas fa-thumbs-up', fail: 'fas fa-book' }
  return icons[resultClass.value]
})

const scorePercent = computed(() => Math.round((score.value / quizData.totalScore) * 100))

const scoreColor = computed(() => {
  const colors = { excellent: '#faad14', good: '#52c41a', pass: '#1890ff', fail: '#ff4d4f' }
  return colors[resultClass.value]
})

const gradeText = computed(() => {
  const g = { excellent: '优秀', good: '良好', pass: '合格', fail: '参与' }
  return g[resultClass.value]
})

// ===== 弹窗状态 =====
const showRankingModal = ref(false)
const showHistoryModal = ref(false)
const showSubmitConfirm = ref(false)
const rankingList = ref([])
const historyList = ref([])
const rankingLoading = ref(false)
const rankingError = ref(false)
const historyLoading = ref(false)
const historyError = ref(false)

const myBestRecord = computed(() => {
  if (!userStore.isLoggedIn) return null
  // 优先从排行榜中找
  const fromRanking = rankingList.value.find(r => r.userId === userStore.userId)
  if (fromRanking) return fromRanking
  // 否则从历史记录中取最佳
  if (historyList.value.length > 0) {
    const best = historyList.value.reduce((a, b) => a.score > b.score ? a : b)
    return { score: best.score, totalTime: best.totalTime, ranking: null }
  }
  return null
})

const loadRanking = async () => {
  rankingLoading.value = true
  rankingError.value = false
  try {
    const res = await getQuizRanking({ mode: 'challenge', limit: 50 })
    rankingList.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('获取排行榜失败:', e)
    rankingError.value = true
    rankingList.value = []
  } finally {
    rankingLoading.value = false
  }
}

const loadHistory = async () => {
  historyLoading.value = true
  historyError.value = false
  try {
    const res = await getQuizHistory()
    historyList.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('获取历史记录失败:', e)
    historyError.value = true
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

watch(showRankingModal, (val) => {
  if (val) loadRanking()
})

watch(showHistoryModal, (val) => {
  if (val) loadHistory()
})

// ===== 工具函数 =====
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// ===== 证书逻辑 =====
const certCanvas = ref(null)
const restartBtn = ref(null)
const saving = ref(false)

const certName = computed(() => {
  return userStore.isLoggedIn ? (userStore.userInfo?.username || '用户') : '匿名参与者'
})

watch(certName, async () => {
  if (quizState.value !== 'cert') return
  await nextTick()
  await drawCert()
})
watch(quizState, async (val) => {
  if (val === 'result') {
    if (restartBtn.value?.$el) {
      restartBtn.value.$el.focus()
    } else if (restartBtn.value?.focus) {
      restartBtn.value.focus()
    }
  }
  if (val === 'cert') {
    await nextTick()
    await drawCert()
  }
})

function renderCertContent(ctx, W, H, displayName, sealImage) {
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#fffdf5')
  bg.addColorStop(0.5, '#fff9f0')
  bg.addColorStop(1, '#fdf6e3')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#c9a96e'; ctx.lineWidth = 3
  ctx.strokeRect(12, 12, W - 24, H - 24)
  ctx.strokeStyle = '#e8c87a'; ctx.lineWidth = 1.5
  ctx.strokeRect(22, 22, W - 44, H - 44)

  ctx.fillStyle = '#8B5E2B'; ctx.font = 'bold 36px "SimSun", serif'; ctx.textAlign = 'center'
  ctx.fillText('文 化 知 识 答 题 证 书', W / 2, 65)
  ctx.fillStyle = '#9e7c4a'; ctx.font = '16px "SimSun", serif'
  ctx.fillText('Sanxingdui Culture Quiz Certificate', W / 2, 90)

  ctx.fillStyle = '#555'; ctx.font = '18px "SimSun", serif'; ctx.fillText('授予', W / 2, 148)
  ctx.fillStyle = '#8B5E2B'; ctx.font = 'bold 40px "SimSun", serif'; ctx.fillText(displayName, W / 2, 200)
  ctx.strokeStyle = '#c9a96e'; ctx.lineWidth = 1.5
  const nw = ctx.measureText(displayName).width
  ctx.beginPath(); ctx.moveTo(W / 2 - nw / 2 - 20, 210); ctx.lineTo(W / 2 + nw / 2 + 20, 210); ctx.stroke()
  ctx.fillStyle = '#555'; ctx.font = '16px "SimSun", serif'; ctx.fillText('在三星堆文化知识答题中获得', W / 2, 245)

  ctx.fillStyle = '#8B5E2B'; ctx.font = 'bold 56px "Arial Black", sans-serif'; ctx.fillText(score.value + ' 分', W / 2, 315)
  ctx.fillStyle = gradeText.value === '优秀' ? '#c9a96e' : (gradeText.value === '良好' ? '#7a9e5a' : '#8e8e8e')
  ctx.font = 'bold 22px "SimSun", serif'; ctx.fillText('评定等级：' + gradeText.value, W / 2, 350)

  ctx.fillStyle = '#888'; ctx.font = '13px "SimSun", serif'; ctx.textAlign = 'center'
  ctx.fillText('答题时间：' + quizData.questions.length + ' 道题', W / 2 - 100, 400)
  ctx.fillText('满分：' + quizData.totalScore + ' 分', W / 2 + 100, 400)
  const today = new Date()
  const dateStr = today.getFullYear() + ' 年 ' + (today.getMonth() + 1) + ' 月 ' + today.getDate() + ' 日'
  ctx.fillText(dateStr, W / 2, 425)

  ctx.fillStyle = '#9e7c4a'; ctx.font = 'bold 14px "SimSun", serif'; ctx.textAlign = 'right'
  ctx.fillText('非遗文化传承平台', W - 30, H - 40)
  ctx.fillStyle = '#aaa'; ctx.font = '12px "SimSun", serif'
  ctx.fillText('Heritage Culture Platform', W - 30, H - 24)

  if (sealImage) {
    const sealSize = 140
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.translate(95, H - 80)
    ctx.rotate(-0.1)
    ctx.drawImage(sealImage, -sealSize / 2, -sealSize / 2, sealSize, sealSize)
    ctx.restore()
  } else {
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.translate(95, H - 80)
    ctx.rotate(-0.1)
    ctx.beginPath(); ctx.arc(0, 0, 56, 0, Math.PI * 2)
    ctx.strokeStyle = '#c41a1a'; ctx.lineWidth = 4; ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2)
    ctx.strokeStyle = '#c41a1a'; ctx.lineWidth = 2.5; ctx.stroke()
    ctx.fillStyle = '#c41a1a'; ctx.font = 'bold 18px "SimSun", serif'; ctx.textAlign = 'center'
    ctx.fillText('非遗', 0, -10); ctx.fillText('传承', 0, 14)
    ctx.restore()
  }
}

let sealImageCache = null
let sealImageLoaded = false

function loadSealImage() {
  return new Promise((resolve) => {
    if (sealImageLoaded) {
      resolve(sealImageCache)
      return
    }
    const img = new Image()
    img.src = sealImg
    img.onload = () => {
      sealImageCache = img
      sealImageLoaded = true
      resolve(img)
    }
    img.onerror = () => {
      sealImageCache = null
      sealImageLoaded = true
      resolve(null)
    }
  })
}

async function waitForCanvas(maxRetries = 10, interval = 100) {
  for (let i = 0; i < maxRetries; i++) {
    if (certCanvas.value) return true
    await new Promise(r => setTimeout(r, interval))
  }
  return !!certCanvas.value
}

async function drawCert() {
  const ready = await waitForCanvas()
  if (!ready) return

  const canvas = certCanvas.value
  const ctx = canvas.getContext('2d')
  const W = 720, H = 500
  const dpr = window.devicePixelRatio || 1
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  ctx.scale(dpr, dpr)

  const displayName = certName.value.trim() || '匿名参与者'
  const seal = await loadSealImage()
  renderCertContent(ctx, W, H, displayName, seal)
}

const saveCert = async () => {
  saving.value = true
  try {
    await nextTick()
    await drawCert()
    const canvas = certCanvas.value
    const link = document.createElement('a')
    const displayName = certName.value.trim() || '匿名参与者'
    link.download = `三星堆答题证书_${displayName}_${score.value}分.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    message.success('证书已保存！')
  } catch (e) {
    message.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const shareCert = async () => {
  await nextTick()
  await drawCert()
  const dataUrl = certCanvas.value.toDataURL('image/png')
  
  if (navigator.share && navigator.canShare) {
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], '三星堆答题证书.png', { type: 'image/png' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '三星堆文化答题证书',
          text: `我在三星堆文化知识答题中获得了 ${score.value} 分（${gradeText.value}）！你也来试试吧！`,
          files: [file]
        })
        message.success('分享成功！')
        return
      }
    } catch (e) {}
  }
  
  try {
    const blob = await (await fetch(dataUrl)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    message.success('证书图片已复制到剪贴板！')
  } catch (e) {
    message.warning('分享功能暂不可用，请点击"保存证书"下载后手动分享')
  }
}

// 背景粒子样式
function particleStyle(n) {
  const positions = [
    { left: '5%', top: '15%' }, { left: '92%', top: '22%' },
    { left: '15%', top: '75%' }, { left: '88%', top: '68%' },
    { left: '48%', top: '8%' }, { left: '52%', top: '85%' },
    { left: '25%', top: '38%' }, { left: '72%', top: '35%' },
    { left: '8%', top: '48%' }, { left: '90%', top: '50%' },
    { left: '35%', top: '92%' }, { left: '65%', top: '12%' }
  ]
  const pos = positions[n - 1] || { left: '50%', top: '50%' }
  return {
    left: pos.left,
    top: pos.top,
    animationDelay: `${(n * 0.7) % 8}s`,
    animationDuration: `${4 + (n % 5)}s`
  }
}
</script>

<style scoped>


/* 历史记录-查看证书按钮 */
.history-cert-btn {
  color: #8B6914;
  padding: 0;
  height: auto;
  font-size: 12px;
}
.history-cert-btn:hover {
  color: #a98a2f;
}
.history-cert-btn i {
  font-size: 11px;
  margin-right: 4px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .history-stats {
    flex-wrap: wrap;
    gap: 8px;
  }
  .history-cert-btn {
    order: 4;
    width: 100%;
    text-align: right;
  }
}

.quiz-page {
  min-height: 100vh;
  background: linear-gradient(175deg, #f8f4ed 0%, #f3efe6 30%, #ede7d9 60%, #f5f0e6 100%);
  padding-bottom: 40px;
  position: relative;
  overflow: hidden;
}

/* ===== 固定背景装饰层 ===== */
.sanxingdui-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.bg-texture {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,105,20,0.008) 2px, rgba(139,105,20,0.008) 3px),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,105,20,0.006) 2px, rgba(139,105,20,0.006) 3px);
}
.bg-watermark {
  position: absolute;
  pointer-events: none;
  filter: blur(1px) brightness(0.9);
  opacity: 0.12;
  object-fit: contain;
}
.bg-watermark-left {
  left: -120px;
  bottom: 5%;
  width: 420px;
  height: auto;
  max-height: 70vh;
}
.bg-watermark-right {
  right: -80px;
  top: 55%;
  width: 280px;
  height: auto;
  max-height: 60vh;
}

/* 漂浮粒子 */
.bg-particles { position: absolute; inset: 0; }
.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: rgba(139,105,20,0.1);
  border-radius: 50%;
  animation: particle-drift ease-in-out infinite alternate;
}
@keyframes particle-drift {
  0% { transform: translate(0, 0); opacity: 0.2; }
  100% { transform: translate(15px, -20px); opacity: 0.7; }
}

/* ===== Hero 头部（双图自动轮播） ===== */
.hero-section {
  position: relative;
  min-height: 480px;
  display: flex;
  align-items: flex-end;
  z-index: 1;
  overflow: hidden;
}
.hero-bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 30%;
  opacity: 0;
  transition: opacity 1.2s ease-in-out;
  will-change: opacity;
}
.hero-bg-layer.active {
  opacity: 1;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(to bottom,
    rgba(0,0,0,0.3) 0%,
    rgba(0,0,0,0.45) 60%,
    rgba(0,0,0,0.6) 100%);
}
/* 答题领证书飘带 */
.hero-cert-ribbon {
  position: absolute;
  top: 22px;
  right: -42px;
  z-index: 3;
  background: linear-gradient(135deg, #f5af19, #f12711);
  color: #fff;
  padding: 10px 60px;
  transform: rotate(35deg);
  box-shadow: 0 4px 16px rgba(241, 39, 17, 0.4);
  animation: ribbon-pulse 2s ease-in-out infinite;
}
.ribbon-text {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 4px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
@keyframes ribbon-pulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(241, 39, 17, 0.4); }
  50% { box-shadow: 0 6px 24px rgba(241, 39, 17, 0.7); }
}

/* 轮播指示器 */
.hero-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  gap: 10px;
}
.hero-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.35);
  transition: all 0.4s ease;
  cursor: pointer;
}
.hero-dot.active {
  background: rgba(255,215,0,0.9);
  box-shadow: 0 0 8px rgba(255,215,0,0.5);
  width: 24px;
  border-radius: 4px;
}
.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px 36px;
  text-align: center;
}
.hero-badge {
  display: inline-block;
  padding: 6px 20px;
  border: 1px solid rgba(255,215,0,0.4);
  color: #f7e8c4;
  font-size: 13px;
  letter-spacing: 4px;
  border-radius: 2px;
  margin-bottom: 18px;
  backdrop-filter: blur(4px);
  background: rgba(0,0,0,0.2);
}
.hero-title {
  font-size: 42px;
  color: #f7e8c4;
  margin: 0 0 12px;
  font-weight: bold;
  text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 60px rgba(139,105,20,0.4);
  letter-spacing: 4px;
}
.hero-subtitle {
  color: rgba(247,232,196,0.8);
  font-size: 17px;
  margin: 0 0 20px;
  letter-spacing: 2px;
}
.hero-icons {
  display: flex;
  gap: 28px;
  justify-content: center;
  flex-wrap: wrap;
}
.hero-icons span {
  color: rgba(255,215,0,0.7);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.quiz-container {
  max-width: 1100px;
  margin: -30px auto 0;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

/* 开始页 */
.quiz-start { background: #fff; border-radius: 12px; padding: 40px 40px 60px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.quiz-intro { text-align: center; }
.intro-icon { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #8B6914, #5a3e1b); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 36px; color: #f7e8c4; box-shadow: 0 4px 20px rgba(139,105,20,0.3); }
.quiz-intro h2 { font-size: 24px; margin: 0 0 20px; }
.intro-info { font-size: 16px; color: #666; margin: 8px 0; }
.intro-tips { font-size: 14px; color: #999; margin: 6px 0; text-align: left; max-width: 300px; margin-left: auto; margin-right: auto; }
.start-tips { display: flex; flex-direction: column; gap: 10px; max-width: 380px; margin: 28px auto 0; text-align: left; }
.tip-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #faf7f0; border-radius: 8px; border-left: 3px solid #8B6914; }
.tip-item i { color: #8B6914; font-size: 15px; flex-shrink: 0; }
.tip-item span { font-size: 14px; color: #666; line-height: 1.5; }

/* 模式选择 */
.mode-selection { margin: 30px 0; }
.mode-title { font-size: 16px; color: #666; margin-bottom: 16px; }
.mode-cards { display: flex; gap: 20px; justify-content: center; }
.mode-card { width: 180px; padding: 24px 16px; border: 2px solid #e8e8e8; border-radius: 12px; cursor: pointer; transition: all 0.3s; }
.mode-card:hover { border-color: #8B6914; }
.mode-card.active { border-color: #8B6914; background: linear-gradient(135deg, rgba(139,105,20,0.08), rgba(90,62,27,0.08)); }
.mode-icon { font-size: 32px; color: #8B6914; margin-bottom: 12px; }
.mode-name { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 8px; }
.mode-desc { font-size: 13px; color: #999; }
.time-selection { margin-top: 20px; }
.time-title { font-size: 14px; color: #666; margin-bottom: 12px; }
.time-options { display: flex; gap: 12px; justify-content: center; }
.time-option { padding: 10px 24px; border: 2px solid #e8e8e8; border-radius: 8px; cursor: pointer; font-size: 15px; transition: all 0.2s; }
.time-option:hover { border-color: #8B6914; }
.time-option.active { border-color: #8B6914; background: #8B6914; color: #f7e8c4; }

.start-btn { margin-top: 24px; height: 48px; padding: 0 40px; font-size: 16px; background: linear-gradient(135deg, #8B6914, #5a3e1b); border: none; box-shadow: 0 4px 16px rgba(139,105,20,0.4); }
.start-btn:hover { background: linear-gradient(135deg, #9a7a1f, #6b4a1e); }
.start-actions { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }

/* 答题中 */
.quiz-doing-wrapper { display: flex; gap: 28px; align-items: flex-start; justify-content: center; max-width: 980px; margin: 0 auto; }
.quiz-doing-main { flex: 1; min-width: 0; max-width: 680px; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.quiz-top-bar { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
.quiz-progress { flex: 1; }
.progress-text { text-align: center; color: #999; font-size: 14px; margin-top: 8px; }

/* 计时器 SVG 圆环 */
.timer-display { position: relative; display: inline-flex; align-items: center; justify-content: center; }
.timer-svg { transform: rotate(-90deg); overflow: visible; }
.timer-bg { fill: none; stroke: #e8e8e8; stroke-width: 4; }
.timer-progress { fill: none; stroke: #8B6914; stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset 0.3s linear, stroke 0.3s; }
.timer-circle-caution { stroke: #ff9a44; }
.timer-circle-critical { stroke: #ff4d4f; }
.timer-number {
  position: absolute;
  font-size: 18px;
  font-weight: bold;
  color: #8B6914;
  transition: color 0.3s;
}
.timer-display.caution .timer-number { color: #ff9a44; }
.timer-display.critical .timer-number {
  color: #ff4d4f;
  animation: timer-pulse 0.5s ease-in-out infinite;
}
@keyframes timer-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.total-time { font-size: 14px; color: #666; }
.total-time i { margin-right: 6px; }

.question-card { background: #faf7f0; border-radius: 10px; padding: 24px 28px; margin-bottom: 24px; border-left: 4px solid #8B6914; }
.question-number { font-size: 13px; color: #999; margin-bottom: 10px; }
.question-text { font-size: 18px; color: #333; line-height: 1.7; font-weight: 500; }

.options-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.option-item { display: flex; align-items: center; padding: 14px 20px; border: 2px solid #e8e8e8; border-radius: 10px; cursor: pointer; transition: all 0.2s; background: #fff; }
.option-item:hover:not(.option-correct):not(.option-wrong) { border-color: #8B6914; background: #faf7f0; }
.option-item.option-animate { animation: option-pop 0.25s ease-out; }
@keyframes option-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
.option-label { width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #666; margin-right: 14px; flex-shrink: 0; }
.option-text { flex: 1; font-size: 16px; }
.option-icon { font-size: 22px; margin-left: 12px; }
.correct-icon { color: #52c41a; }
.wrong-icon { color: #ff4d4f; }
.option-correct { border-color: #52c41a; background: #f6ffed; }
.option-correct .option-label { background: #52c41a; color: #fff; }
.option-wrong { border-color: #ff4d4f; background: #fff2f0; }
.option-wrong .option-label { background: #ff4d4f; color: #fff; }

.answer-analysis { margin-bottom: 20px; }
.quiz-action { text-align: center; margin-top: 20px; }

/* 答题卡 */
.quiz-answer-sheet { width: 240px; background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); height: fit-content; position: sticky; top: 20px; }
.sheet-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.sheet-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px; justify-items: center; }
.sheet-item { aspect-ratio: 1; width: 100%; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; background: #f0f0f0; color: #999; position: relative; overflow: hidden; }
.sheet-item:hover { transform: scale(1.08); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.sheet-item.ripple { animation: sheet-ripple 0.5s ease; }
@keyframes sheet-ripple {
  0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); transform: scale(1); }
  50% { box-shadow: 0 0 0 8px rgba(102, 126, 234, 0); transform: scale(1.12); }
  100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); transform: scale(1); }
}
.sheet-item.current { background: linear-gradient(135deg, #8B6914, #5a3e1b); color: #f7e8c4; box-shadow: 0 2px 8px rgba(139,105,20,0.4); }
.sheet-item.correct { background: #52c41a; color: #fff; }
.sheet-item.wrong { background: #ff4d4f; color: #fff; }
.sheet-item.pending { background: #f5f5f5; color: #bbb; }

.sheet-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #666; }
.legend-dot { width: 12px; height: 12px; border-radius: 4px; }
.legend-dot.current { background: #8B6914; }
.legend-dot.correct { background: #52c41a; }
.legend-dot.wrong { background: #ff4d4f; }
.legend-dot.pending { background: #f0f0f0; border: 1px solid #ddd; }

.sheet-stats { margin-bottom: 16px; }
.stat-row { display: flex; justify-content: space-between; font-size: 14px; color: #666; margin-bottom: 4px; }
.stat-row .correct { color: #52c41a; }
.stat-row .wrong { color: #ff4d4f; }

.submit-btn { width: 100%; background: linear-gradient(135deg, #8B6914, #5a3e1b); border: none; box-shadow: 0 2px 8px rgba(139,105,20,0.3); }
.submit-btn:hover { background: linear-gradient(135deg, #9a7a1f, #6b4a1e); }

/* 结果页 - 黄金面具 */
.result-goldmask {
  text-align: center;
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
}
.goldmask-img {
  width: 140px;
  height: auto;
  border-radius: 50%;
  box-shadow: 0 8px 30px rgba(139,105,20,0.3), 0 0 60px rgba(255,215,0,0.15);
  border: 3px solid rgba(139,105,20,0.3);
  object-fit: cover;
  aspect-ratio: 1;
}

/* 结果页 */
.quiz-result { background: #fff; border-radius: 12px; padding: 48px 40px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.result-card { text-align: center; }
.result-title { font-size: 28px; margin: 0 0 8px; }
.result-desc { font-size: 15px; color: #999; margin: 0 0 32px; }
.result-stats { display: flex; justify-content: center; align-items: center; margin-bottom: 36px; }
.stat-item { text-align: center; padding: 0 30px; }
.stat-value { font-size: 36px; font-weight: bold; }
.stat-value.correct { color: #52c41a; }
.stat-value.wrong { color: #ff4d4f; }
.stat-value.total { color: #1890ff; }
.stat-label { font-size: 14px; color: #999; margin-top: 4px; }
.stat-divider { width: 1px; height: 50px; background: #e8e8e8; }
.result-score { margin-bottom: 24px; }
.score-ring { display: inline-block; }
.score-label { font-size: 14px; color: #999; margin-top: 10px; }

.result-extra { display: flex; gap: 24px; justify-content: center; margin-bottom: 24px; }
.extra-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666; }
.extra-item.rank { color: #faad14; font-weight: 500; }

.result-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 0; }
.result-actions .ant-btn { min-width: 140px; height: 44px; font-size: 15px; }

/* 证书独立页面 */
.quiz-cert { background: #fff; border-radius: 12px; padding: 32px 40px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.cert-page { text-align: center; }
.cert-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.cert-page-header h2 { margin: 0; font-size: 22px; }
.cert-page-body h3 { font-size: 20px; margin: 0 0 8px; }
.cert-page-body > p { font-size: 14px; color: #999; margin: 0 0 24px; }

/* 证书 */
.cert-section { margin-top: 48px; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.cert-section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.cert-section-icon { width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg, #8B6914, #5a3e1b); display: flex; align-items: center; justify-content: center; font-size: 24px; color: #f7e8c4; box-shadow: 0 4px 12px rgba(139,105,20,0.3); }
.cert-section-title { font-size: 20px; font-weight: bold; margin: 0 0 4px; }
.cert-section-sub { font-size: 14px; color: #999; margin: 0; }
.cert-name-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 420px;
  margin: 0 auto 24px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(139,105,20,0.07), rgba(90,62,27,0.07));
  border: 1px solid rgba(139,105,20,0.2);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
.cert-name-display i {
  color: #8B6914;
  font-size: 16px;
}
.cert-preview-wrapper { display: flex; justify-content: center; margin-bottom: 24px; overflow-x: auto; }
.cert-canvas { max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.cert-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
.cert-actions .ant-btn { min-width: 160px; height: 44px; font-size: 15px; }

/* 排行榜 */
.ranking-self-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(139,105,20,0.07), rgba(90,62,27,0.07));
  border: 1px solid rgba(139,105,20,0.2);
  border-radius: 12px;
}
.ranking-self-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #8B6914;
  flex-shrink: 0;
}
.ranking-self-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ranking-self-avatar i { font-size: 22px; color: #999; }
.ranking-self-info { flex: 1; }
.ranking-self-name { font-size: 16px; font-weight: 600; color: #333; }
.ranking-self-hint { font-size: 12px; color: #999; margin-top: 2px; }
.ranking-self-score { text-align: right; }
.ranking-self-score .score-val { display: block; font-size: 22px; font-weight: bold; color: #8B6914; }
.ranking-self-score .score-rank { display: block; font-size: 12px; color: #999; margin-top: 2px; }
.ranking-self-score .score-empty { font-size: 13px; color: #bbb; }

.ranking-list { max-height: 500px; overflow-y: auto; }
.ranking-empty, .history-empty {
  text-align: center;
  padding: 40px;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.ranking-empty .empty-icon, .history-empty .empty-icon {
  font-size: 36px;
  color: #faad14;
  margin-bottom: 4px;
}
.ranking-empty .empty-text, .history-empty .empty-text {
  font-size: 14px;
  color: #999;
}
.ranking-item { display: flex; align-items: center; padding: 16px; border-radius: 8px; margin-bottom: 8px; background: #fafafa; }
.ranking-item.top-three { background: linear-gradient(135deg, rgba(139,105,20,0.08), rgba(90,62,27,0.08)); }
.ranking-item.current-user { border: 2px solid #8B6914; }
.ranking-rank { width: 40px; text-align: center; }
.ranking-rank .medal { font-size: 24px; }
.ranking-rank .rank-num { font-size: 16px; font-weight: bold; color: #666; }
.ranking-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #e8e8e8; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
.ranking-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ranking-avatar i { color: #999; }
.ranking-info { flex: 1; }
.ranking-name { font-weight: 500; color: #333; }
.ranking-time { font-size: 12px; color: #999; }
.ranking-score { font-size: 18px; font-weight: bold; color: #8B6914; }

/* 历史记录 */
.history-list { max-height: 500px; overflow-y: auto; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-radius: 8px; margin-bottom: 8px; background: #fafafa; }
.history-date { font-size: 13px; color: #666; }
.history-mode { font-size: 12px; padding: 2px 8px; border-radius: 4px; }
.history-mode.challenge { background: #8B6914; color: #f7e8c4; }
.history-mode.practice { background: #52c41a; color: #fff; }
.history-stats { display: flex; gap: 16px; align-items: center; }
.history-score { font-size: 18px; font-weight: bold; color: #8B6914; }
.history-detail, .history-time { font-size: 13px; color: #999; }

/* 交卷确认 */
.submit-confirm-content p { margin: 8px 0; font-size: 15px; }
.submit-confirm-content .correct { color: #52c41a; }
.submit-confirm-content .wrong { color: #ff4d4f; }
.submit-confirm-content .pending { color: #faad14; }
.confirm-tip { color: #666; font-size: 14px; }

/* ===== 状态切换过渡动画 ===== */
.quiz-fade-enter-active { transition: all 0.4s ease; }
.quiz-fade-leave-active { transition: all 0.3s ease; }
.quiz-fade-enter-from { opacity: 0; transform: translateY(20px); }
.quiz-fade-leave-to { opacity: 0; transform: translateY(-20px); }

/* 下一题按钮滑动过渡 */
.btn-slide-enter-active { animation: slide-up-in 0.3s ease forwards; }
.btn-slide-leave-active { transition: all 0.2s ease; }
.btn-slide-leave-to { opacity: 0; transform: translateY(8px); }

/* ===== 答题过程动画 ===== */
.option-item.option-animate-correct { animation: option-scale-correct 0.4s ease forwards; }
.option-item.option-animate-wrong { animation: option-scale-wrong 0.4s ease forwards; }
@keyframes option-scale-correct {
  0% { transform: scale(1); }
  40% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
@keyframes option-scale-wrong {
  0% { transform: scale(1); }
  40% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

/* 下一题按钮淡入上滑（由 Vue Transition btn-slide 控制） */
@keyframes slide-up-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 答题卡题号点击 ripple 效果 */
.sheet-item::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: rgba(255,255,255,0.3);
  transform: scale(0);
  opacity: 0;
  transition: none;
}
.sheet-item.ripple::after {
  animation: ripple-effect 0.4s ease-out forwards;
}
@keyframes ripple-effect {
  0% { transform: scale(0); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* 重新答题按钮自动聚焦 + 光晕动画 */
.restart-btn {
  animation: restart-glow 1.5s ease-in-out infinite alternate;
}
@keyframes restart-glow {
  from { box-shadow: 0 0 8px rgba(139,105,20,0.3); }
  to { box-shadow: 0 0 18px rgba(139,105,20,0.6); }
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-section { min-height: 320px; }
  .hero-cert-ribbon { top: 10px; right: -40px; padding: 6px 40px; }
  .ribbon-text { font-size: 12px; letter-spacing: 2px; }
  .hero-dots { bottom: 12px; gap: 8px; }
  .hero-dot { width: 6px; height: 6px; }
  .hero-dot.active { width: 18px; }
  .hero-title { font-size: 28px; letter-spacing: 2px; }
  .hero-subtitle { font-size: 14px; }
  .hero-icons { gap: 16px; }
  .hero-content { padding: 40px 16px 36px; }
  .bg-watermark { display: none; }
  .bg-particles { display: none; }
  .quiz-start { padding: 24px 16px 40px; }
  .start-tips { max-width: 100%; }
  .mode-cards { flex-direction: column; align-items: center; }
  .quiz-doing-wrapper { flex-direction: column; max-width: 100%; }
  .quiz-doing-main { max-width: 100%; padding: 20px; }
  .quiz-answer-sheet { width: 100%; position: static; }
  .sheet-grid { grid-template-columns: repeat(10, 1fr); }
  .quiz-result { padding: 32px 20px; }
  .cert-section { padding: 24px 16px; }
  .goldmask-img { width: 100px; }
}

</style>
