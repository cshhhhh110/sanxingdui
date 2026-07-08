<template>
  <div class="dashboard-command">
    <section class="command-top">
      <div class="command-identity">
        <span class="console-label">OVERVIEW</span>
        <h1>管理工作台</h1>
        <p>查看平台核心数据、订单走势和内容运营情况。</p>
      </div>

      <div class="header-tools">
        <span class="time-pill"><ClockCircleOutlined /> {{ currentTime }}</span>
        <div class="operator-inline">
          <a-avatar :size="38" :src="avatarUrl" class="profile-avatar">
            {{ userInfo?.name?.charAt(0) || userInfo?.username?.charAt(0) || 'A' }}
          </a-avatar>
          <div>
            <strong>{{ userInfo?.name || userInfo?.username || 'Admin' }}</strong>
            <span>{{ roleLabel }}</span>
          </div>
        </div>
        <a-button class="refresh-action" :loading="loading" @click="fetchStatistics">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </div>
    </section>

    <section class="data-ticker">
        <article
          v-for="metric in metrics"
          :key="metric.key"
          class="ticker-item"
          :class="{ active: metric.highlight }"
        >
          <div class="ticker-icon">
            <component :is="metric.icon" />
          </div>
          <div>
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <em>{{ metric.sub }}</em>
          </div>
        </article>
    </section>

    <section class="command-main">
      <div class="chart-theatre">
        <div class="theatre-header">
          <div>
            <span class="console-label">REVENUE OBSERVATORY</span>
            <h2>销售趋势主监控</h2>
          </div>
          <span class="theatre-tag">近 7 天 / ¥</span>
        </div>
        <div ref="salesChartRef" class="chart-viewport sales-chart"></div>
      </div>

      <aside class="mission-panel">
        <div class="mission-title">
          <span class="console-label">FAST ROUTES</span>
          <h2>模块直达</h2>
        </div>

        <div class="route-stack">
          <button
            v-for="item in quickActions"
            :key="item.path"
            type="button"
            class="route-item"
            @click="goTo(item.path)"
          >
            <span><component :is="item.icon" /></span>
            <strong>{{ item.title }}</strong>
            <ArrowRightOutlined />
          </button>
        </div>
      </aside>
    </section>

    <section class="ops-summary">
      <div class="summary-card">
        <span>今日新增用户</span>
        <strong>{{ statistics.todayNewUsers }}</strong>
        <em>USER INCREASE</em>
      </div>
      <div class="summary-card">
        <span>今日订单量</span>
        <strong>{{ statistics.todayOrders }}</strong>
        <em>ORDER FLOW</em>
      </div>
      <div class="summary-card accent">
        <span>今日销售额</span>
        <strong>¥{{ formatMoney(statistics.todaySales) }}</strong>
        <em>SALES SIGNAL</em>
      </div>
      <div class="summary-card">
        <span>内容运营量</span>
        <strong>{{ statistics.totalHeritageItems }}</strong>
        <em>HERITAGE ITEMS</em>
      </div>
    </section>

    <section class="analysis-board">
      <div class="analysis-card wide">
        <div class="analysis-head">
          <div>
            <span class="console-label">ORDER CURVE</span>
            <h2>订单变化曲线</h2>
          </div>
          <span>近 7 天</span>
        </div>
        <div ref="orderChartRef" class="chart-viewport"></div>
      </div>

      <div class="analysis-card">
        <div class="analysis-head">
          <div>
            <span class="console-label">ORDER STATUS</span>
            <h2>订单状态</h2>
          </div>
        </div>
        <div ref="orderStatusChartRef" class="chart-viewport"></div>
      </div>

      <div class="analysis-card">
        <div class="analysis-head">
          <div>
            <span class="console-label">ARCHIVE MIX</span>
            <h2>瑰宝类别</h2>
          </div>
        </div>
        <div ref="heritageCategoryChartRef" class="chart-viewport"></div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  BookOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  ReadOutlined
} from '@ant-design/icons-vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getDashboardStatistics } from '@/api/dashboard'

const router = useRouter()

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer
])
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const THEME_COLOR = '#42664f'
const THEME_DEEP = '#243d2f'
const THEME_GRADIENT = ['#42664f', '#638a70', '#8eb49a', '#c8a45d', '#e5dbc2']

const roleLabel = computed(() => {
  const roleMap = { ADMIN: '高级系统管理员', USER: '标准用户' }
  return roleMap[userInfo.value?.userType] || '平台访客'
})

const avatarUrl = computed(() => userInfo.value?.avatar)

const currentTime = ref('')
let timeInterval = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-')
}

const loading = ref(false)
const statistics = ref({
  totalUsers: 0,
  todayNewUsers: 0,
  totalOrders: 0,
  todayOrders: 0,
  totalSales: 0,
  todaySales: 0,
  totalHeritageItems: 0,
  totalCourses: 0,
  totalActivities: 0,
  orderStatusDistribution: {},
  heritageCategoryDistribution: {},
  last7DaysOrders: [],
  last7DaysSales: []
})

const metrics = computed(() => [
  {
    key: 'users',
    label: '平台用户',
    value: statistics.value.totalUsers,
    sub: `今日新增 ${statistics.value.todayNewUsers}`,
    icon: UserOutlined
  },
  {
    key: 'orders',
    label: '累计订单',
    value: statistics.value.totalOrders,
    sub: `今日 ${statistics.value.todayOrders} 笔`,
    icon: ShoppingOutlined
  },
  {
    key: 'sales',
    label: '销售总额',
    value: `¥${formatMoney(statistics.value.totalSales)}`,
    sub: `今日 ¥${formatMoney(statistics.value.todaySales)}`,
    icon: DollarOutlined,
    highlight: true
  },
  {
    key: 'heritage',
    label: '古蜀瑰宝',
    value: statistics.value.totalHeritageItems,
    sub: `课程 ${statistics.value.totalCourses} / 活动 ${statistics.value.totalActivities}`,
    icon: BookOutlined
  }
])

const quickActions = [
  { title: '用户管理', path: '/back/user', icon: UserOutlined },
  { title: '古蜀瑰宝', path: '/back/heritage', icon: DatabaseOutlined },
  { title: '活动管理', path: '/back/activity', icon: CalendarOutlined },
  { title: '课程管理', path: '/back/course', icon: ReadOutlined },
  { title: '商品管理', path: '/back/shop/product', icon: AppstoreOutlined },
  { title: '订单管理', path: '/back/shop/orders', icon: OrderedListOutlined }
]

const orderChartRef = ref(null)
const salesChartRef = ref(null)
const orderStatusChartRef = ref(null)
const heritageCategoryChartRef = ref(null)

let orderChart = null
let salesChart = null
let orderStatusChart = null
let heritageCategoryChart = null

const formatMoney = (value) => {
  if (!value && value !== 0) return '0.00'
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const goTo = (path) => {
  router.push(path)
}

const fetchStatistics = () => {
  loading.value = true
  getDashboardStatistics({
    onSuccess: (data) => {
      statistics.value = {
        ...statistics.value,
        ...data,
        orderStatusDistribution: data?.orderStatusDistribution || {},
        heritageCategoryDistribution: data?.heritageCategoryDistribution || {},
        last7DaysOrders: data?.last7DaysOrders || [],
        last7DaysSales: data?.last7DaysSales || []
      }
      loading.value = false
      nextTick(() => {
        initCharts()
      })
    },
    onError: (error) => {
      console.error(error)
      message.error('同步工作台数据失败')
      loading.value = false
    }
  })
}

const initCharts = () => {
  initOrderChart()
  initSalesChart()
  initOrderStatusChart()
  initHeritageCategoryChart()
}

const axisStyle = {
  axisLine: { lineStyle: { color: 'rgba(66, 102, 79, 0.18)' } },
  axisTick: { show: false },
  axisLabel: { color: '#7c8f84' },
  splitLine: { lineStyle: { color: 'rgba(66, 102, 79, 0.08)' } }
}

const tooltipStyle = {
  trigger: 'axis',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderColor: 'rgba(66, 102, 79, 0.14)',
  textStyle: { color: THEME_DEEP },
  extraCssText: 'box-shadow: 0 16px 42px rgba(36, 61, 47, 0.14); border-radius: 14px;'
}

const initOrderChart = () => {
  if (!orderChartRef.value) return
  if (orderChart) orderChart.dispose()
  orderChart = echarts.init(orderChartRef.value)
  const source = statistics.value.last7DaysOrders || []
  const dates = source.map(item => item.date)
  const counts = source.map(item => item.count)

  orderChart.setOption({
    color: [THEME_COLOR],
    grid: { left: 38, right: 24, top: 36, bottom: 48 },
    tooltip: tooltipStyle,
    xAxis: { type: 'category', data: dates, axisLabel: { rotate: 32, color: '#7c8f84' }, axisLine: axisStyle.axisLine, axisTick: axisStyle.axisTick },
    yAxis: { type: 'value', ...axisStyle },
    series: [{
      name: '订单数',
      type: 'line',
      data: counts,
      smooth: true,
      symbolSize: 9,
      lineStyle: { width: 4, color: THEME_COLOR },
      itemStyle: { color: '#fff', borderColor: THEME_COLOR, borderWidth: 3 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(66, 102, 79, 0.28)' },
            { offset: 1, color: 'rgba(66, 102, 79, 0.02)' }
          ]
        }
      }
    }]
  })
}

const initSalesChart = () => {
  if (!salesChartRef.value) return
  if (salesChart) salesChart.dispose()
  salesChart = echarts.init(salesChartRef.value)
  const source = statistics.value.last7DaysSales || []
  const dates = source.map(item => item.date)
  const amounts = source.map(item => Number(item.amount || 0))

  salesChart.setOption({
    color: [THEME_COLOR],
    grid: { left: 56, right: 28, top: 34, bottom: 48 },
    tooltip: {
      ...tooltipStyle,
      formatter: function(params) {
        return params[0].name + '<br/>' + params[0].marker + '销售额: ¥' + params[0].value.toFixed(2)
      }
    },
    xAxis: { type: 'category', data: dates, axisLabel: { rotate: 32, color: '#7c8f84' }, axisLine: axisStyle.axisLine, axisTick: axisStyle.axisTick },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}', color: '#7c8f84' }, splitLine: axisStyle.splitLine },
    series: [{
      name: '销售额',
      type: 'bar',
      data: amounts,
      barWidth: 24,
      itemStyle: {
        borderRadius: [14, 14, 6, 6],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#42664f' },
            { offset: 0.55, color: '#6f987b' },
            { offset: 1, color: '#d8e8dc' }
          ]
        }
      }
    }]
  })
}

const initOrderStatusChart = () => {
  if (!orderStatusChartRef.value) return
  if (orderStatusChart) orderStatusChart.dispose()
  orderStatusChart = echarts.init(orderStatusChartRef.value)
  const data = Object.entries(statistics.value.orderStatusDistribution || {}).map(([name, value]) => ({ name, value }))

  orderStatusChart.setOption({
    color: THEME_GRADIENT,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(66, 102, 79, 0.14)',
      textStyle: { color: THEME_DEEP }
    },
    legend: { bottom: 4, textStyle: { color: '#6f8277' } },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: ['50%', '72%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 12, borderColor: '#fff', borderWidth: 3 },
      label: { color: '#425448', fontWeight: 700 },
      data
    }]
  })
}

const initHeritageCategoryChart = () => {
  if (!heritageCategoryChartRef.value) return
  if (heritageCategoryChart) heritageCategoryChart.dispose()
  heritageCategoryChart = echarts.init(heritageCategoryChartRef.value)
  const data = Object.entries(statistics.value.heritageCategoryDistribution || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  heritageCategoryChart.setOption({
    color: THEME_GRADIENT,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(66, 102, 79, 0.14)',
      textStyle: { color: THEME_DEEP }
    },
    legend: { type: 'scroll', orient: 'vertical', right: 8, top: 24, bottom: 24, textStyle: { color: '#6f8277' } },
    series: [{
      name: '古蜀瑰宝类别',
      type: 'pie',
      radius: ['0%', '62%'],
      center: ['38%', '50%'],
      data,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      emphasis: { itemStyle: { shadowBlur: 18, shadowOffsetX: 0, shadowColor: 'rgba(66, 102, 79, 0.24)' } }
    }]
  })
}

const handleResize = () => {
  orderChart?.resize()
  salesChart?.resize()
  orderStatusChart?.resize()
  heritageCategoryChart?.resize()
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  fetchStatistics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  orderChart?.dispose()
  salesChart?.dispose()
  orderStatusChart?.dispose()
  heritageCategoryChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

.dashboard-command {
  min-height: calc(100vh - 136px);
  padding: 28px 32px 40px;
  background: $white;
  color: $black;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.command-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid $black;
}

.command-identity {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.console-label {
  display: inline-flex;
  width: fit-content;
  color: $muted;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.command-identity h1 {
  margin: 8px 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.command-identity p {
  max-width: 560px;
  margin: 0;
  color: $muted;
  font-size: 14px;
  line-height: 1.6;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  height: 34px;
  font-size: 13px;
  color: $muted;
  border: 1px solid $border;
  border-radius: 0;
}

.operator-inline {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  border: 1px solid $border;
  background: $bg;
}

.operator-inline strong {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: $black;
}

.operator-inline span {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: $muted;
}

.profile-avatar {
  border: 2px solid $white;
  background: $accent;
}

.refresh-action {
  height: 34px !important;
  padding: 0 16px !important;
  border-radius: 0 !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  color: $white !important;
  background: $accent !important;
  border-color: $accent !important;
  box-shadow: none !important;

  &:hover {
    background: color.adjust($accent, $lightness: -6%) !important;
    border-color: color.adjust($accent, $lightness: -6%) !important;
  }
}

.data-ticker {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 28px;
}

.ticker-item {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  min-height: 108px;
  padding: 18px;
  border: 1px solid $border;
  background: $bg;
  transition: transform 0.24s ease, box-shadow 0.24s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    background: $white;
  }

  &.active {
    color: $white;
    border-color: $accent;
    background: $accent;

    .ticker-icon {
      color: $white;
      background: rgba(255, 255, 255, 0.2);
    }

    span, em {
      color: rgba(255, 255, 255, 0.8);
    }

    strong {
      color: $white;
    }
  }
}

.ticker-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 0;
  color: $accent;
  background: rgba($accent, 0.12);
  font-size: 18px;
}

.ticker-item span {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: $muted;
}

.ticker-item strong {
  display: block;
  margin: 6px 0 8px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: $black;
  line-height: 1;
}

.ticker-item em {
  display: block;
  font-size: 12px;
  font-style: normal;
  color: $muted;
}

.command-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  margin-bottom: 28px;
}

.chart-theatre,
.mission-panel,
.analysis-card,
.summary-card {
  border: 1px solid $border;
  background: $white;
}

.chart-theatre {
  position: relative;
  overflow: hidden;
  min-height: 480px;
}

.theatre-header,
.analysis-head,
.mission-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px 8px;
  border-bottom: 1px solid $border;
}

.theatre-header h2,
.analysis-head h2,
.mission-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: $black;
}

.theatre-tag,
.analysis-head > span {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 0;
  color: $accent;
  background: rgba($accent, 0.1);
  font-size: 12px;
  font-weight: 500;
}

.chart-viewport {
  width: 100%;
  height: 380px;
  padding: 16px;
}

.sales-chart {
  height: 420px;
}

.mission-panel {
  overflow: hidden;
}

.route-stack {
  display: grid;
  gap: 10px;
  padding: 16px 20px 24px;
}

.route-item {
  display: grid;
  grid-template-columns: 42px 1fr 18px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid $border;
  border-radius: 0;
  color: $black;
  background: $bg;
  cursor: pointer;
  transition: all 0.22s ease;

  &:hover {
    transform: translateX(4px);
    border-color: $accent;
    background: rgba($accent, 0.05);
  }

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 0;
    color: $accent;
    background: $white;
  }

  strong {
    text-align: left;
    font-weight: 600;
  }

  .anticon {
    color: $muted;
  }
}

.ops-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 28px;
}

.summary-card {
  padding: 20px 22px;
  border: 1px solid $border;
  border-radius: 0;
  background: $bg;

  &.accent {
    color: $white;
    border-color: $accent;
    background: $accent;

    span, em {
      color: rgba(255, 255, 255, 0.8);
    }

    strong {
      color: $white;
    }
  }
}

.summary-card span {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: $muted;
}

.summary-card strong {
  display: block;
  margin: 8px 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: $black;
  line-height: 1;
}

.summary-card em {
  display: block;
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
  color: $muted;
  letter-spacing: 0.04em;
}

.analysis-board {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.analysis-card {
  position: relative;
  overflow: hidden;
}

@media (max-width: 1380px) {
  .command-top,
  .command-main,
  .analysis-board {
    grid-template-columns: 1fr;
  }

  .data-ticker,
  .ops-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-command {
    padding: 16px;
  }

  .command-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .data-ticker,
  .ops-summary,
  .analysis-board {
    grid-template-columns: 1fr;
  }

  .sales-chart,
  .chart-viewport {
    height: 300px;
  }
}
</style>
