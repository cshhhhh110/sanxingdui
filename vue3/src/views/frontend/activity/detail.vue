<template>
  <div
    class="activity-detail"
    :style="{
      '--detail-texture': `url(${bgTexture})`,
      '--mask-watermark': `url(${maskWatermark})`
    }"
  >
    <a-spin :spinning="loading">
      <main v-if="activity" class="detail-container">
        <section class="detail-hero" aria-label="活动概览">
          <div class="hero-backdrop">
            <img :src="getActivityCover()" :alt="activity.title" />
          </div>
          <div class="hero-gradient"></div>

          <div class="hero-content">

            <button class="back-button" @click="handleBack">
              <i class="fas fa-arrow-left"></i>
              返回
            </button>

            <p class="hero-kicker">SANXINGDUI FIELD EXPERIENCE</p>
            <h1>{{ activity.title }}</h1>

            <div class="hero-tags">
              <span class="type-pill">{{ activity.type || '文化活动' }}</span>
              <span class="status-pill" :class="`status-${activity.status}`">
                {{ activity.statusName }}
              </span>
            </div>

            <div class="hero-info-strip">
              <div class="info-item">
                <span class="info-icon"><i class="fas fa-calendar-alt"></i></span>
                <div>
                  <span class="info-label">活动时间</span>
                  <strong>{{ formatDateTime(activity.startTime) }} 至 {{ formatDateTime(activity.endTime) }}</strong>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon"><i class="fas fa-map-marker-alt"></i></span>
                <div>
                  <span class="info-label">活动地点</span>
                  <strong>{{ activity.location || '待定' }}</strong>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon"><i class="fas fa-users"></i></span>
                <div>
                  <span class="info-label">报名人数</span>
                  <strong>{{ activity.signupCount || 0 }} 人</strong>
                </div>
              </div>

              <div class="hero-actions">
                <template v-if="activity.status === 1">
                  <a-button class="signup-button" type="primary" size="large" @click="handleSignup">
                    <i class="fas fa-pen-to-square"></i>
                    立即报名
                  </a-button>
                </template>
                <template v-else-if="activity.status === 2">
                  <a-button class="signup-button disabled-button" size="large" disabled>
                    <i class="fas fa-clock"></i>
                    活动进行中
                  </a-button>
                </template>
                <template v-else-if="activity.status === 3">
                  <a-button class="signup-button disabled-button" size="large" disabled>
                    <i class="fas fa-times-circle"></i>
                    活动已结束
                  </a-button>
                </template>
                <template v-else>
                  <a-button class="signup-button disabled-button" size="large" disabled>
                    <i class="fas fa-hourglass-half"></i>
                    筹备中
                  </a-button>
                </template>
              </div>
            </div>
          </div>
        </section>

        <section class="detail-body" aria-label="活动内容">
          <article class="content-card detail-card">
            <header class="section-heading">
              <span class="section-mark"><i class="fas fa-scroll"></i></span>
              <h2>活动详情</h2>
            </header>

            <div class="activity-description">
              {{ activity.description || '暂无详细描述' }}
            </div>

            <div class="process-steps" aria-label="活动流程">
              <div
                v-for="(step, index) in processSteps"
                :key="step.title"
                class="process-card"
              >
                <span class="step-number">{{ step.no }}</span>
                <h3>{{ step.title }}</h3>
                <p>{{ step.desc }}</p>
              </div>
            </div>
          </article>

          <aside class="content-card tips-card">
            <header class="section-heading">
              <span class="section-mark"><i class="fas fa-clipboard-list"></i></span>
              <h2>报名须知</h2>
            </header>

            <ul class="tips-list">
              <li><i class="fas fa-check-circle"></i>请确保个人信息准确无误</li>
              <li><i class="fas fa-clipboard-check"></i>报名后请等待审核通知</li>
              <li><i class="fas fa-clock"></i>活动当天请准时签到</li>
              <li><i class="fas fa-headset"></i>如有疑问请联系工作人员</li>
            </ul>

            <div class="notice-box">
              <div class="notice-title">
                <i class="fas fa-bell"></i>
                温馨提示
              </div>
              <p>
                建议穿着舒适运动鞋，携带水杯及防晒用品，活动期间请遵守基地相关规定，注意安全。
              </p>
            </div>
          </aside>
        </section>
      </main>
    </a-spin>

    <a-modal
      v-model:open="isSignupModalVisible"
      title="活动报名"
      @ok="handleSignupOk"
      @cancel="isSignupModalVisible = false"
    >
      <div class="signup-form">
        <h3>{{ activity?.title }}</h3>
        <p><strong>活动时间：</strong>{{ formatDateTime(activity?.startTime) }} 至 {{ formatDateTime(activity?.endTime) }}</p>
        <p><strong>活动地点：</strong>{{ activity?.location }}</p>
        <a-alert
          message="温馨提示"
          description="提交报名后，我们会尽快审核您的申请，请保持手机畅通。"
          type="info"
          show-icon
          style="margin-top: 16px"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getActivityDetail, signupActivity } from '@/api/ActivityApi'
import { useUserStore } from '@/store/user'
import bgTexture from '@/assets/culture-activity/activity-bg-texture.png'
import maskWatermark from '@/assets/culture-activity/activity-mask-watermark.png'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activity = ref(null)
const loading = ref(false)
const isSignupModalVisible = ref(false)

const processSteps = [
  {
    no: '01',
    title: '遗址讲解',
    desc: '走进遗址现场，探秘文物发掘故事'
  },
  {
    no: '02',
    title: '青铜工艺',
    desc: '了解青铜铸造与古蜀冶金技术'
  },
  {
    no: '03',
    title: '模拟挖掘',
    desc: '动手挖掘文物模型，体验考古全过程'
  },
  {
    no: '04',
    title: '文创实践',
    desc: '设计专属文创草图，让文物活起来'
  }
]

const loadDetail = () => {
  loading.value = true
  getActivityDetail(
    { activityId: route.params.id },
    {
      onSuccess: (data) => {
        activity.value = data
        loading.value = false
      },
      onError: () => {
        loading.value = false
        message.error('加载失败')
        router.back()
      }
    }
  )
}

const handleSignup = () => {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录')
    router.push('/login')
    return
  }
  isSignupModalVisible.value = true
}

const handleSignupOk = () => {
  if (!userStore.userId) {
    message.error('用户信息异常')
    return
  }

  const activityId = activity.value.id
  if (!activityId) {
    message.error('活动ID不能为空')
    return
  }

  signupActivity(
    {
      activityId: activityId,
      userId: userStore.userId
    },
    {
      onSuccess: () => {
        message.success('报名成功，请等待审核')
        isSignupModalVisible.value = false
        loadDetail()
      },
      successMsg: false
    }
  )
}

const handleBack = () => {
  router.back()
}

const getActivityCover = () => {
  if (activity.value?.coverFilePath) {
    const path = activity.value.coverFilePath
    if (path.startsWith('http')) return path
    return path.startsWith('/') ? path : '/' + path
  }
  return ''
}

const toFutureDate = (dateStr) => {
  if (!dateStr) return null
  const d = dayjs(dateStr)
  const now = dayjs()
  if (d.isAfter(now)) return d

  let future = dayjs(`${now.year()}-${d.format('MM-DD HH:mm')}`)
  if (future.isBefore(now)) {
    future = dayjs(`${now.year() + 1}-${d.format('MM-DD HH:mm')}`)
  }
  return future
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const future = toFutureDate(dateStr)
  return future ? future.format('YYYY-MM-DD HH:mm') : dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped lang="less">
.activity-detail {
  --primary: #42664f;
  --primary-dark: #243d30;
  --ink: #20362d;
  --muted: rgba(36, 61, 48, 0.68);
  --gold: #c2a365;
  --gold-soft: rgba(194, 163, 101, 0.28);
  --paper: #fbf7ee;

  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--ink);
  background:
    linear-gradient(180deg, rgba(252, 249, 241, 0.92), rgba(248, 242, 230, 0.92)),
    var(--detail-texture) top center / cover repeat;
}

.activity-detail::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 8% 12%, rgba(194, 163, 101, 0.16), transparent 28%),
    radial-gradient(circle at 88% 18%, rgba(66, 102, 79, 0.12), transparent 34%);
}

.detail-container {
  position: relative;
  z-index: 1;
  width: min(1100px, calc(100% - 64px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

.detail-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 320px;
  overflow: hidden;
  border: 1px solid rgba(194, 163, 101, 0.28);
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(31, 56, 45, 0.1);
  animation: detailFadeIn 0.55s ease both;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.hero-gradient {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(20, 30, 25, 0.08) 0%, rgba(20, 30, 25, 0.02) 28%, rgba(20, 30, 25, 0.28) 62%, rgba(20, 30, 25, 0.78) 88%, rgba(20, 30, 25, 0.94) 100%),
    linear-gradient(0deg, rgba(30, 50, 40, 0.42) 0%, transparent 40%);
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  min-width: 0;
  padding: 32px 32px 28px;
}

.back-button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 16px;
  color: rgba(255, 252, 245, 0.9);
  font-size: 13px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);

  i {
    font-size: 12px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateX(-2px);
  }
}

.hero-kicker {
  position: relative;
  z-index: 1;
  margin: 0 0 8px;
  color: rgba(255, 252, 245, 0.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.28em;
}

.hero-content h1 {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 0 12px;
  color: #fff;
  font-family: "STZhongsong", "Noto Serif SC", "SimSun", serif;
  font-size: clamp(22px, 2.2vw, 32px);
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.06em;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
}

.hero-tags {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.type-pill,
.status-pill {
  display: inline-flex;
  min-width: 74px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  backdrop-filter: blur(8px);
}

.type-pill {
  color: #f9f1d9;
  background: rgba(194, 163, 101, 0.32);
  border: 1px solid rgba(220, 199, 145, 0.42);
}

.status-pill {
  color: #fff;
  background: rgba(66, 102, 79, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 9px 18px rgba(0, 0, 0, 0.18);
}

.status-0 {
  background: rgba(154, 132, 88, 0.72);
}

.status-2 {
  background: rgba(88, 119, 95, 0.72);
}

.status-3 {
  background: rgba(137, 145, 139, 0.72);
}

.hero-info-strip {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px 28px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 16px;
  backdrop-filter: blur(18px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    color: var(--primary-dark);
    font-size: 14px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
}

.info-icon {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #f9f1d9;
  background: linear-gradient(145deg, #4f765c, #284635);
  border-radius: 10px;
  box-shadow: 0 8px 16px rgba(66, 102, 79, 0.22);
}

.info-label {
  display: block;
  margin-bottom: 1px;
  color: #9d7d45;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.hero-actions {
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 12px;
}

.signup-button {
  min-width: 140px;
  height: 40px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.08em;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;

  i {
    margin-right: 8px;
  }
}

:deep(.signup-button.ant-btn-primary) {
  background: linear-gradient(145deg, #c2a365, #8b6f3a);
  border: 2px solid rgba(220, 199, 145, 0.55);
  box-shadow: 0 12px 28px rgba(139, 111, 58, 0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.1);
}

:deep(.signup-button.ant-btn-primary:hover) {
  background: linear-gradient(145deg, #d4b878, #9c8048);
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(139, 111, 58, 0.38), inset 0 0 0 2px rgba(255, 255, 255, 0.12);
}

.disabled-button {
  min-width: 180px;
  color: rgba(36, 61, 48, 0.46) !important;
  background: rgba(255, 255, 255, 0.72) !important;
  border: 1px solid rgba(194, 163, 101, 0.28) !important;
}

.detail-body {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.8fr);
  gap: 14px;
  margin-top: 12px;
  align-items: stretch;
}

.content-card {
  height: 100%;
  background: rgba(255, 253, 248, 0.9);
  border: 1px solid rgba(194, 163, 101, 0.32);
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(31, 56, 45, 0.06);
  backdrop-filter: blur(8px);
}

.detail-card {
  padding: 16px 22px 16px;
}

.tips-card {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background: #f3f7f1;
  border-color: rgba(66, 102, 79, 0.16);
  box-shadow: 0 8px 20px rgba(31, 56, 45, 0.04);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(194, 163, 101, 0.2);

  h2 {
    margin: 0;
    color: var(--primary-dark);
    font-family: "STZhongsong", "Noto Serif SC", "SimSun", serif;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }
}

.section-mark {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  color: #f9f1d9;
  background: var(--primary);
  border-radius: 7px;
  box-shadow: 0 8px 14px rgba(66, 102, 79, 0.14);
}

.activity-description {
  color: #43544e;
  font-size: 14px;
  line-height: 1.7;
  text-align: justify;
  white-space: pre-wrap;
  margin-bottom: 14px;
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 0;
}

.process-card {
  position: relative;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 10px;
  row-gap: 4px;
  min-height: 90px;
  padding: 14px;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(255, 254, 249, 0.94), rgba(249, 243, 230, 0.86));
  border: 1px solid rgba(194, 163, 101, 0.28);
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(31, 56, 45, 0.05);
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 24px rgba(31, 56, 45, 0.08);
  }

  h3 {
    grid-column: 2;
    grid-row: 1;
    margin: 0;
    color: var(--primary-dark);
    font-size: 15px;
    font-weight: 900;
    line-height: 1.2;
  }

  p {
    grid-column: 2;
    grid-row: 2;
    margin: 0;
    color: rgba(36, 61, 48, 0.7);
    font-size: 12px;
    line-height: 1.5;
  }
}

.process-card:not(:last-child)::after {
  content: '›';
  position: absolute;
  top: 50%;
  right: -15px;
  z-index: 2;
  color: var(--primary);
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
  transform: translateY(-50%);
}

.step-number {
  position: relative;
  grid-column: 1;
  grid-row: 1 / span 2;
  display: grid;
  width: 38px;
  height: 38px;
  align-self: start;
  margin-top: 2px;
  place-items: center;
  color: rgba(157, 125, 69, 0.72);
  background: rgba(248, 239, 216, 0.72);
  border: 1px solid rgba(194, 163, 101, 0.28);
  border-radius: 10px;
  font-family: Georgia, serif;
  font-size: 17px;
  font-weight: 900;
}

.tips-list {
  display: grid;
  gap: 0;
  margin: 0 0 4px;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    color: #3d5146;
    font-size: 13px;
    line-height: 1.5;
    border-bottom: 1px dashed rgba(66, 102, 79, 0.16);

    &:last-child {
      border-bottom: none;
      padding-bottom: 4px;
    }

    i {
      flex: 0 0 18px;
      margin-top: 1px;
      color: var(--primary);
      font-size: 14px;
    }
  }
}

.notice-box {
  margin-top: auto;
  padding: 12px 14px 11px;
  background:
    linear-gradient(145deg, rgba(241, 246, 239, 0.82), rgba(255, 252, 244, 0.88));
  border: 1px solid rgba(66, 102, 79, 0.22);
  border-radius: 16px;

  p {
    margin: 6px 0 0;
    padding-right: 96px;
    color: rgba(36, 61, 48, 0.72);
    font-size: 13px;
    line-height: 1.5;
  }
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary-dark);
  font-size: 16px;
  font-weight: 900;

  i {
    color: var(--primary);
  }
}

.signup-form {
  h3 {
    margin-bottom: 16px;
    color: var(--primary-dark);
    font-family: "STZhongsong", "Noto Serif SC", "SimSun", serif;
    font-size: 20px;
    font-weight: 900;
  }

  p {
    margin-bottom: 8px;
    line-height: 1.8;
  }
}

@keyframes detailFadeIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 1180px) {
  .detail-hero {
    min-height: 340px;
  }

  .hero-content {
    padding: 48px 32px 28px;
  }

  .hero-content h1 {
    font-size: clamp(24px, 3vw, 32px);
  }

  .hero-info-strip {
    flex-wrap: wrap;
    gap: 14px;
  }

  .info-item {
    flex: 1 1 calc(50% - 7px);
    min-width: 200px;
  }

  .hero-actions {
    flex: 1 1 100%;
    margin-left: 0;
    padding-left: 0;
    display: flex;
    justify-content: flex-end;
  }

  .detail-body {
    grid-template-columns: 1fr;
  }

  .process-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .process-card:nth-child(2)::after {
    display: none;
  }
}

@media (max-width: 768px) {
  .detail-hero {
    min-height: 320px;
    border-radius: 18px;
  }

  .hero-content {
    padding: 40px 18px 22px;
  }

  .hero-content h1 {
    font-size: 24px;
    letter-spacing: 0.04em;
    margin-bottom: 10px;
  }

  .hero-kicker {
    font-size: 11px;
    letter-spacing: 0.2em;
    margin-bottom: 6px;
  }

  .hero-tags {
    margin-bottom: 12px;
  }

  .hero-info-strip {
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
  }

  .info-item {
    flex: 1 1 auto;
  }

  .hero-actions {
    flex: 1 1 auto;
    margin-left: 0;
    padding-left: 0;
    display: flex;
    justify-content: stretch;
  }

  .signup-button {
    width: 100%;
    min-width: 0;
  }

  .detail-container {
    width: calc(100% - 28px);
    padding: 14px 0 28px;
  }

  .detail-body {
    gap: 12px;
    margin-top: 12px;
  }

  .detail-card,
  .tips-card {
    padding: 18px 16px;
    border-radius: 18px;
  }

  .section-heading h2 {
    font-size: 22px;
  }

  .process-steps {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .process-card {
    min-height: 78px;
  }

  .process-card::after {
    display: none;
  }

  .notice-box p {
    padding-right: 0;
  }
}
</style>
