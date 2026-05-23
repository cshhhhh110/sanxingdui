<template>
  <div class="culture-page" :style="{ '--culture-bg': `url(${cultureBg})` }">
    <section class="culture-hero" aria-label="三星堆文化活动">
      <h1>三星堆文化活动</h1>
      <img class="title-divider" :src="titleDivider" alt="" aria-hidden="true" />
      <p>走进古蜀现场，参与文明体验</p>
    </section>

    <section class="filter-panel" aria-label="活动筛选">
      <a-input
        v-model:value="searchForm.title"
        class="filter-search"
        placeholder="搜索活动标题"
        allow-clear
        @press-enter="handleSearch"
      >
        <template #prefix>
          <i class="fas fa-search"></i>
        </template>
      </a-input>

      <a-select
        v-model:value="searchForm.type"
        class="filter-select"
        placeholder="活动类型"
        allow-clear
      >
        <a-select-option value="体验">体验</a-select-option>
        <a-select-option value="培训">培训</a-select-option>
        <a-select-option value="展演">展演</a-select-option>
        <a-select-option value="展览">展览</a-select-option>
        <a-select-option value="比赛">比赛</a-select-option>
      </a-select>

      <a-select
        v-model:value="searchForm.status"
        class="filter-select"
        placeholder="报名中"
        allow-clear
      >
        <a-select-option :value="1">报名中</a-select-option>
        <a-select-option :value="2">进行中</a-select-option>
        <a-select-option :value="3">已结束</a-select-option>
      </a-select>

      <a-button class="filter-button" type="primary" @click="handleSearch">
        <i class="fas fa-filter"></i>
        筛选
      </a-button>

      <a-button class="reset-button" @click="handleReset">
        <i class="fas fa-rotate-left"></i>
        重置
      </a-button>
    </section>

    <section class="activity-grid" aria-label="活动列表">
      <a-spin :spinning="loading">
        <div v-if="activityList.length > 0" class="activity-grid-inner">
          <article
            v-for="activity in activityList"
            :key="activity.id"
            class="activity-card"
            role="button"
            tabindex="0"
            @click="goToDetail(activity.id)"
            @keydown.enter="goToDetail(activity.id)"
            @keydown.space.prevent="goToDetail(activity.id)"
          >
            <div class="activity-cover">
              <img :src="getActivityCover(activity)" :alt="activity.title" />
            </div>

            <div class="activity-info">
              <header class="activity-heading">
                <h3 class="activity-title">{{ activity.title }}</h3>
                <a-tag :color="getStatusColor(activity.status)">
                  {{ activity.statusName }}
                </a-tag>
              </header>

              <div class="activity-type">
                <i class="fas fa-award"></i>
                <span>{{ activity.type || '文化活动' }}</span>
              </div>

              <div class="activity-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar"></i>
                  <span>{{ formatDate(activity.startTime) }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ activity.location || '待定' }}</span>
                </div>
              </div>

              <span class="activity-region">{{ activity.location || '待定' }}</span>
            </div>

            <button
              v-if="activity.status === 1"
              class="activity-action"
              type="button"
              @click.stop="handleSignup(activity)"
            >
              立即报名
              <i class="fas fa-chevron-right"></i>
            </button>
            <button v-else class="activity-action" type="button">
              探寻活动
              <i class="fas fa-chevron-right"></i>
            </button>
          </article>
        </div>

        <a-empty v-if="!loading && activityList.length === 0" description="暂无活动" />
      </a-spin>
    </section>

    <div class="pagination-section" v-if="pagination.total > 0">
      <a-pagination
        v-model:current="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="true"
        :show-total="total => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>

    <a-modal
      v-model:open="isSignupModalVisible"
      title="活动报名"
      @ok="handleSignupOk"
      @cancel="isSignupModalVisible = false"
    >
      <div class="signup-info">
        <h3>{{ selectedActivity?.title }}</h3>
        <p><strong>活动时间：</strong>{{ formatDateTime(selectedActivity?.startTime) }} 至 {{ formatDateTime(selectedActivity?.endTime) }}</p>
        <p><strong>活动地点：</strong>{{ selectedActivity?.location }}</p>
        <p><strong>活动类型：</strong>{{ selectedActivity?.type }}</p>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getActivityPage, signupActivity } from '@/api/ActivityApi'
import { useUserStore } from '@/store/user'
import cultureBg from '@/assets/culture-activity/culture-activity-bg.png'
import titleDivider from '@/assets/culture-activity/culture-title-divider.png'

const router = useRouter()
const userStore = useUserStore()

const searchForm = reactive({
  title: '',
  type: undefined,
  status: 1
})

const activityList = ref([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0
})

const isSignupModalVisible = ref(false)
const selectedActivity = ref(null)

const loadData = () => {
  loading.value = true
  getActivityPage(
    {
      current: pagination.current,
      size: pagination.pageSize,
      ...searchForm
    },
    {
      onSuccess: (data) => {
        activityList.value = data.records || []
        pagination.total = data.total || 0
        loading.value = false
      },
      onError: () => {
        loading.value = false
      }
    }
  )
}

const handleSearch = () => {
  pagination.current = 1
  loadData()
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.type = undefined
  searchForm.status = 1
  pagination.current = 1
  loadData()
}

const handlePageChange = () => {
  loadData()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDetail = (id) => {
  router.push(`/activity/${id}`)
}

const handleSignup = (activity) => {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录')
    router.push('/login')
    return
  }

  selectedActivity.value = activity
  isSignupModalVisible.value = true
}

const handleSignupOk = () => {
  if (!userStore.userId) {
    message.error('用户信息异常')
    return
  }

  const activityId = selectedActivity.value.id
  if (!activityId) {
    message.error('活动ID不能为空')
    return
  }

  signupActivity(
    {
      activityId,
      userId: userStore.userId
    },
    {
      onSuccess: () => {
        message.success('报名成功，请等待审核')
        isSignupModalVisible.value = false
        selectedActivity.value = null
      },
      successMsg: false
    }
  )
}

const getStatusColor = (status) => {
  const colors = {
    1: 'blue',
    2: 'green',
    3: 'gray'
  }
  return colors[status] || 'default'
}

const getActivityCover = (activity) => {
  if (activity.coverFilePath) {
    const path = activity.coverFilePath
    if (path.startsWith('http')) return path
    return path.startsWith('/') ? path : '/' + path
  }
  return 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(activity.title)
}

const formatDate = (dateStr) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD') : '-'
}

const formatDateTime = (dateStr) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="less">
.culture-page {
  --culture-primary: #42664f;
  --culture-deep: #243d30;
  --culture-ink: #1f382d;
  --culture-gold: #b79a62;
  --culture-paper: #fbf8ef;
  --culture-muted: rgba(36, 61, 48, 0.65);

  min-height: 100vh;
  overflow-x: hidden;
  color: var(--culture-ink);
  background:
    linear-gradient(180deg, rgba(250, 247, 238, 0.48) 0%, rgba(250, 247, 238, 0.68) 42%, rgba(255, 253, 248, 0.96) 72%),
    var(--culture-bg) top center / 100% auto no-repeat;
  background-color: #fbf8ef;
}

.culture-hero {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  padding: 44px 24px 20px;
  text-align: center;
}

.culture-hero h1 {
  margin: 0;
  color: var(--culture-deep);
  font-family: "STZhongsong", "Noto Serif SC", "SimSun", serif;
  font-size: clamp(38px, 3.6vw, 50px);
  font-weight: 900;
  line-height: 1.18;
  letter-spacing: 0.22em;
  text-shadow: 0 10px 28px rgba(36, 61, 48, 0.08);
}

.title-divider {
  display: block;
  width: clamp(360px, 30vw, 500px);
  height: 44px;
  margin: 6px auto 2px;
  object-fit: cover;
  object-position: center;
  mix-blend-mode: multiply;
  opacity: 0.98;
  filter: sepia(0.1) saturate(0.86) contrast(1.08);
  user-select: none;
  pointer-events: none;
}

.culture-hero p {
  margin: 0;
  color: var(--culture-muted);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.16em;
}

.filter-panel {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(280px, 1.55fr) minmax(180px, 0.72fr) minmax(180px, 0.72fr) 136px 136px;
  gap: 18px;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto 20px;
  padding: 16px 22px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(183, 154, 98, 0.2);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(30, 50, 38, 0.08);
  backdrop-filter: blur(8px);
}

.filter-panel::after {
  content: '';
  position: absolute;
  inset: 7px;
  pointer-events: none;
  border: 1px solid rgba(183, 154, 98, 0.12);
  border-radius: 12px;
}

.filter-search,
.filter-select,
.filter-button,
.reset-button {
  position: relative;
  z-index: 1;
}

.filter-panel :deep(.ant-input-affix-wrapper),
.filter-panel :deep(.ant-select-selector) {
  height: 52px !important;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.84) !important;
  border-color: rgba(36, 61, 48, 0.18) !important;
  border-radius: 9px !important;
  box-shadow: none !important;
}

.filter-panel :deep(.ant-input-affix-wrapper) {
  padding: 0 18px;
}

.filter-panel :deep(.ant-input) {
  height: 50px;
  color: var(--culture-ink);
  font-size: 15px;
  background: transparent;
}

.filter-panel :deep(.ant-input-prefix) {
  margin-inline-end: 12px;
  color: #9a7c47;
  font-size: 17px;
}

.filter-panel :deep(.ant-select-selection-search-input),
.filter-panel :deep(.ant-select-selection-placeholder),
.filter-panel :deep(.ant-select-selection-item) {
  height: 50px !important;
  line-height: 50px !important;
  color: var(--culture-ink);
  font-size: 15px;
}

.filter-panel :deep(.ant-select-selection-placeholder) {
  color: rgba(36, 61, 48, 0.46);
}

.filter-panel :deep(.ant-select-arrow) {
  color: rgba(36, 61, 48, 0.55);
}

.filter-panel :deep(.ant-input-affix-wrapper:hover),
.filter-panel :deep(.ant-select-selector:hover) {
  border-color: rgba(66, 102, 79, 0.48) !important;
}

.filter-panel :deep(.ant-input-affix-wrapper-focused),
.filter-panel :deep(.ant-select-focused .ant-select-selector) {
  border-color: var(--culture-primary) !important;
  box-shadow: 0 0 0 3px rgba(66, 102, 79, 0.1) !important;
}

.filter-button,
.reset-button {
  height: 52px;
  border-radius: 9px;
  font-size: 16px;
  font-weight: 800;
}

.filter-button {
  color: #fff;
  background: linear-gradient(135deg, #42664f, #2d5140);
  border: 0;
  box-shadow: 0 12px 22px rgba(31, 56, 45, 0.22);
}

.filter-button:hover,
.filter-button:focus {
  background: linear-gradient(135deg, #365744, #1f382d);
  transform: translateY(-1px);
}

.reset-button {
  color: #5f4d30;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(183, 154, 98, 0.55);
}

.reset-button:hover,
.reset-button:focus {
  color: var(--culture-primary);
  border-color: rgba(66, 102, 79, 0.45);
}

.filter-button i,
.reset-button i {
  margin-right: 8px;
}

.activity-grid {
  position: relative;
  z-index: 1;
  min-height: 380px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.activity-grid-inner {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.activity-card {
  position: relative;
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 18px;
  min-height: 136px;
  padding: 14px 22px 14px 14px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 15px;
  box-shadow: 0 10px 28px rgba(30, 50, 38, 0.08);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.activity-card:hover,
.activity-card:focus-visible {
  transform: translateY(-4px);
  border-color: rgba(66, 102, 79, 0.28);
  box-shadow: 0 18px 36px rgba(30, 50, 38, 0.14);
  outline: none;
}

.activity-cover {
  position: relative;
  z-index: 1;
  align-self: center;
  width: 150px;
  height: 106px;
  overflow: hidden;
  background: #e9e2d5;
  border-radius: 9px;
}

.activity-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.32s ease;
}

.activity-card:hover .activity-cover img {
  transform: scale(1.04);
}

.activity-info {
  position: relative;
  z-index: 2;
  min-width: 0;
  padding-right: 112px;
}

.activity-heading {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.activity-title {
  display: -webkit-box;
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--culture-deep);
  font-family: "STZhongsong", "Noto Serif SC", "SimSun", serif;
  font-size: 19px;
  font-weight: 900;
  line-height: 1.34;
  letter-spacing: 0.02em;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.activity-heading :deep(.ant-tag) {
  flex: 0 0 auto;
  margin: 2px 0 0;
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 800;
}

.activity-type {
  display: inline-flex;
  max-width: 160px;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  padding: 3px 9px;
  overflow: hidden;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--culture-primary);
  border-radius: 4px;
}

.activity-meta {
  display: grid;
  gap: 6px;
  margin-top: 9px;
}

.meta-item {
  display: flex;
  min-width: 0;
  align-items: center;
  color: rgba(36, 61, 48, 0.66);
  font-size: 14px;
  line-height: 1.45;
}

.meta-item i {
  flex: 0 0 22px;
  color: #9a7c47;
}

.meta-item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-region {
  display: inline-block;
  max-width: 160px;
  margin-top: 8px;
  padding: 3px 13px;
  overflow: hidden;
  color: rgba(66, 102, 79, 0.78);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #edf3ef;
  border-radius: 999px;
}

.activity-action {
  position: absolute;
  right: 24px;
  bottom: 18px;
  z-index: 3;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 0;
  color: var(--culture-primary);
  font: inherit;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  background: transparent;
  border: 0;
  transition: color 0.2s ease, transform 0.2s ease;
}

.activity-action:hover {
  color: var(--culture-deep);
  transform: translateX(3px);
}

.activity-action i {
  font-size: 12px;
}

.pagination-section {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  max-width: 1280px;
  margin: 20px auto 0;
  padding: 10px 0 14px;
}

.pagination-section :deep(.ant-pagination) {
  display: flex;
  align-items: center;
}

.pagination-section :deep(.ant-pagination-total-text) {
  margin-right: 18px;
  color: var(--culture-ink);
  font-weight: 700;
}

.pagination-section :deep(.ant-pagination-item) {
  border-color: rgba(183, 154, 98, 0.35);
  border-radius: 7px;
}

.pagination-section :deep(.ant-pagination-item-active) {
  background: var(--culture-primary);
  border-color: var(--culture-primary);
}

.pagination-section :deep(.ant-pagination-item-active a) {
  color: #fff;
}

.pagination-section :deep(.ant-pagination-prev button),
.pagination-section :deep(.ant-pagination-next button),
.pagination-section :deep(.ant-select-selector) {
  border-color: rgba(183, 154, 98, 0.35) !important;
  border-radius: 7px !important;
}

.signup-info h3 {
  margin-bottom: 16px;
  color: var(--culture-deep);
  font-family: "STZhongsong", "Noto Serif SC", "SimSun", serif;
  font-size: 20px;
  font-weight: 900;
}

.signup-info p {
  margin-bottom: 8px;
  line-height: 1.8;
}

@media (max-width: 1328px) {
  .filter-panel,
  .activity-grid,
  .pagination-section {
    width: calc(100% - 48px);
  }
}

@media (max-width: 1120px) {
  .filter-panel {
    grid-template-columns: minmax(240px, 1fr) minmax(160px, 0.6fr) minmax(160px, 0.6fr);
  }

  .filter-button,
  .reset-button {
    width: 100%;
  }

  .activity-grid-inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .culture-hero {
    padding: 34px 18px 18px;
  }

  .culture-hero h1 {
    font-size: 34px;
    letter-spacing: 0.1em;
  }

  .title-divider {
    width: min(78vw, 360px);
    height: 34px;
  }

  .culture-hero p {
    font-size: 15px;
    letter-spacing: 0.08em;
  }

  .filter-panel {
    grid-template-columns: 1fr;
    width: calc(100% - 28px);
    padding: 16px;
    border-radius: 14px;
  }

  .activity-grid {
    width: calc(100% - 28px);
  }

  .activity-card {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 16px;
  }

  .activity-cover {
    width: 100%;
    height: 190px;
  }

  .activity-info {
    padding-right: 0;
  }

  .activity-heading {
    align-items: flex-start;
  }

  .activity-action {
    position: relative;
    right: auto;
    bottom: auto;
    justify-self: end;
    margin-top: 4px;
  }

  .pagination-section {
    width: calc(100% - 28px);
    overflow-x: auto;
    justify-content: flex-start;
    padding-bottom: 20px;
  }
}
</style>
