<template>
  <div class="order-page">
    <header class="page-top">
      <div class="page-top__main">
        <h1 class="page-top__title">订单管理</h1>
      </div>
    </header>

    <section class="filter-bar">
      <a-select
        v-model:value="searchParams.status"
        placeholder="订单状态"
        allow-clear
        class="filter-select"
      >
        <a-select-option :value="null">全部状态</a-select-option>
        <a-select-option :value="0">待支付</a-select-option>
        <a-select-option :value="1">已支付</a-select-option>
        <a-select-option :value="2">已发货</a-select-option>
        <a-select-option :value="3">已完成</a-select-option>
        <a-select-option :value="4">已关闭</a-select-option>
      </a-select>

      <a-input
        v-model:value="searchParams.orderNo"
        placeholder="订单号"
        allow-clear
        class="filter-input"
        @pressEnter="handleSearch"
      />

      <div class="filter-bar__btns">
        <a-button type="primary" class="btn-primary" @click="handleSearch">查询</a-button>
        <a-button class="btn-ghost" @click="handleReset">重置</a-button>
      </div>
    </section>

    <section class="column-bar">
      <span class="column-bar__label">列顺序</span>
      <span class="column-bar__hint">拖拽标签可调换位置</span>
      <div class="column-chips">
        <span
          v-for="(key, index) in draggableColumnKeys"
          :key="key"
          class="column-chip"
          :class="{
            'column-chip--dragging': dragState.dragKey === key,
            'column-chip--over': dragState.overKey === key && dragState.dragKey !== key
          }"
          draggable="true"
          @dragstart="onColumnDragStart($event, key, index)"
          @dragend="onColumnDragEnd"
          @dragover.prevent="onColumnDragOver(key)"
          @dragleave="onColumnDragLeave(key)"
          @drop.prevent="onColumnDrop(key)"
        >
          <span class="column-chip__grip">⋮⋮</span>
          {{ getColumnTitle(key) }}
        </span>
        <span class="column-chip column-chip--fixed">操作</span>
      </div>
      <button type="button" class="column-reset" @click="resetColumnOrder">恢复默认</button>
    </section>

    <section class="table-wrap">
      <a-table
        :columns="orderedColumns"
        :data-source="orderList"
        :loading="loading"
        :pagination="paginationConfig"
        :scroll="{ x: tableScrollX }"
        @change="handleTableChange"
        row-key="id"
        size="middle"
        class="minimal-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'orderNo'">
            <button type="button" class="cell-link cell-link--title" @click="viewOrderDetail(record.id)">
              {{ record.orderNo }}
            </button>
          </template>

          <template v-else-if="column.key === 'mainProductTitle'">
            <span class="cell-text">{{ record.mainProductTitle || '—' }}</span>
          </template>

          <template v-else-if="column.key === 'itemCount'">
            <span class="cell-num">{{ record.itemCount }}</span>
          </template>

          <template v-else-if="column.key === 'payAmount'">
            <span class="cell-price">¥{{ record.payAmount }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <span :class="['cell-status', `cell-status--${record.status}`]">
              {{ record.statusName }}
            </span>
          </template>

          <template v-else-if="column.key === 'createTime'">
            <span class="cell-mono">{{ formatDate(record.createTime) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-group">
              <button type="button" class="cell-link" @click="viewOrderDetail(record.id)">详情</button>
              <span class="action-sep">|</span>
              <a-dropdown v-if="record.status === 1">
                <button type="button" class="cell-link cell-link--more">
                  更多 <DownOutlined />
                </button>
                <template #overlay>
                  <a-menu class="minimal-dropdown" @click="({ key }) => key === 'ship' && handleShip(record)">
                    <a-menu-item key="ship">发货</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal
      v-model:open="shipModalVisible"
      title="订单发货"
      width="440px"
      class="minimal-modal"
      @ok="handleShipSubmit"
      @cancel="shipModalVisible = false"
    >
      <div class="ship-form">
        <p class="ship-order-no">订单号：{{ currentOrder?.orderNo }}</p>
        <a-form-item label="物流单号">
          <a-input v-model:value="logisticsNo" placeholder="请输入快递/物流单号" />
        </a-form-item>
      </div>
    </a-modal>

    <a-modal
      v-model:open="detailModalVisible"
      title="订单详情"
      width="840px"
      class="minimal-modal"
      :footer="null"
    >
      <div v-if="orderDetail" class="order-detail">
        <div class="detail-header">
          <div class="detail-title">
            <h3>{{ orderDetail.orderNo }}</h3>
            <span :class="['detail-status', `detail-status--${orderDetail.status}`]">
              {{ orderDetail.statusName }}
            </span>
          </div>
          <div class="detail-price">¥{{ orderDetail.payAmount }}</div>
        </div>

        <div class="detail-grid">
          <div class="detail-cell">
            <span class="cell-label">订单总额</span>
            <span class="cell-value">¥{{ orderDetail.totalAmount }}</span>
          </div>
          <div class="detail-cell">
            <span class="cell-label">实付金额</span>
            <span class="cell-value price">¥{{ orderDetail.payAmount }}</span>
          </div>
          <div class="detail-cell">
            <span class="cell-label">下单时间</span>
            <span class="cell-value mono">{{ formatDate(orderDetail.createTime) }}</span>
          </div>
          <div class="detail-cell">
            <span class="cell-label">支付时间</span>
            <span class="cell-value mono">{{ orderDetail.payTime ? formatDate(orderDetail.payTime) : '—' }}</span>
          </div>
        </div>

        <div v-if="orderDetail.address" class="detail-section">
          <h4 class="section-title">收货信息</h4>
          <div class="receiver-info">
            <span>{{ orderDetail.address.receiver }}</span>
            <span>{{ orderDetail.address.phone }}</span>
            <span>{{ orderDetail.address.fullAddress }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">商品清单</h4>
          <div class="items-list">
            <div v-for="item in orderDetail.items" :key="item.id" class="item-row">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-price">¥{{ item.price }} × {{ item.quantity }}</span>
              <span class="item-subtotal">¥{{ item.subtotal }}</span>
            </div>
          </div>
        </div>

        <div v-if="orderDetail.remark" class="detail-section">
          <h4 class="section-title">订单备注</h4>
          <p class="remark-text">{{ orderDetail.remark }}</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'
import { getAdminOrderPage, shipOrder, getOrderDetail } from '@/api/OrderApi'

const COLUMN_STORAGE_KEY = 'backend-order-column-order'

const orderList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const shipModalVisible = ref(false)
const currentOrder = ref(null)
const logisticsNo = ref('')
const detailModalVisible = ref(false)
const orderDetail = ref(null)

const searchParams = reactive({
  status: null,
  orderNo: ''
})

const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 条`
}))

const COLUMN_DEF_MAP = {
  orderNo: { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', ellipsis: true },
  mainProductTitle: { title: '商品信息', dataIndex: 'mainProductTitle', key: 'mainProductTitle', ellipsis: true },
  itemCount: { title: '数量', key: 'itemCount', width: 80, align: 'center' },
  payAmount: { title: '实付金额', key: 'payAmount', width: 100, align: 'right' },
  status: { title: '状态', key: 'status', width: 100, align: 'center' },
  createTime: { title: '下单时间', key: 'createTime', width: 168 }
}

const DEFAULT_COLUMN_ORDER = ['orderNo', 'mainProductTitle', 'itemCount', 'payAmount', 'status', 'createTime']

const ACTION_COLUMN = {
  title: '操作',
  key: 'action',
  width: 120,
  fixed: 'right',
  align: 'center'
}

function loadColumnOrder() {
  try {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY)
    if (!saved) return [...DEFAULT_COLUMN_ORDER]
    const parsed = JSON.parse(saved)
    const valid = parsed.filter((k) => DEFAULT_COLUMN_ORDER.includes(k))
    const missing = DEFAULT_COLUMN_ORDER.filter((k) => !valid.includes(k))
    return valid.length ? [...valid, ...missing] : [...DEFAULT_COLUMN_ORDER]
  } catch {
    return [...DEFAULT_COLUMN_ORDER]
  }
}

const columnOrder = ref(loadColumnOrder())
const draggableColumnKeys = computed(() => columnOrder.value)

const orderedColumns = computed(() => {
  const cols = columnOrder.value.map((key) => COLUMN_DEF_MAP[key]).filter(Boolean)
  return [...cols, ACTION_COLUMN]
})

const tableScrollX = computed(() =>
  orderedColumns.value.reduce((sum, col) => sum + (col.width || 120), 0)
)

function getColumnTitle(key) {
  return COLUMN_DEF_MAP[key]?.title || key
}

function saveColumnOrder() {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnOrder.value))
}

function resetColumnOrder() {
  columnOrder.value = [...DEFAULT_COLUMN_ORDER]
  localStorage.removeItem(COLUMN_STORAGE_KEY)
  message.success('列顺序已恢复默认')
}

const dragState = reactive({ dragKey: null, dragIndex: -1, overKey: null })

function onColumnDragStart(e, key, index) {
  dragState.dragKey = key
  dragState.dragIndex = index
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', key)
}

function onColumnDragEnd() {
  dragState.dragKey = null
  dragState.dragIndex = -1
  dragState.overKey = null
}

function onColumnDragOver(key) { dragState.overKey = key }
function onColumnDragLeave(key) { if (dragState.overKey === key) dragState.overKey = null }

function onColumnDrop(targetKey) {
  const fromKey = dragState.dragKey
  if (!fromKey || fromKey === targetKey) return
  const list = [...columnOrder.value]
  const fromIdx = list.indexOf(fromKey)
  const toIdx = list.indexOf(targetKey)
  if (fromIdx < 0 || toIdx < 0) return
  list.splice(fromIdx, 1)
  list.splice(toIdx, 0, fromKey)
  columnOrder.value = list
  saveColumnOrder()
  dragState.overKey = null
}

const formatDate = (d) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch { return d }
}

const loadOrderList = () => {
  loading.value = true
  const params = {
    current: currentPage.value,
    size: pageSize.value
  }
  if (searchParams.status !== null) params.status = searchParams.status
  if (searchParams.orderNo) params.orderNo = searchParams.orderNo

  getAdminOrderPage(params, {
    onSuccess: (res) => {
      orderList.value = res.records || []
      total.value = res.total || 0
      loading.value = false
    },
    onError: () => { loading.value = false }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  loadOrderList()
}

const handleReset = () => {
  searchParams.status = null
  searchParams.orderNo = ''
  currentPage.value = 1
  loadOrderList()
}

const handleTableChange = (pag) => {
  currentPage.value = pag.current
  pageSize.value = pag.pageSize
  loadOrderList()
}

const viewOrderDetail = (orderId) => {
  getOrderDetail(orderId, {
    onSuccess: (data) => {
      orderDetail.value = data
      detailModalVisible.value = true
    },
    onError: () => {}
  })
}

const handleShip = (order) => {
  currentOrder.value = order
  logisticsNo.value = ''
  shipModalVisible.value = true
}

const handleShipSubmit = () => {
  if (!logisticsNo.value) {
    message.error('请输入物流单号')
    return
  }
  shipOrder(currentOrder.value.id, logisticsNo.value, {
    successMsg: '发货成功',
    onSuccess: () => {
      shipModalVisible.value = false
      loadOrderList()
    }
  })
}

onMounted(() => loadOrderList())
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

.order-page {
  min-height: 100%;
  padding: 28px 32px 40px;
  background: $white;
  color: $black;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.page-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid $black;
}

.page-top__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: $bg;
  border: 1px solid $border;
}

.filter-input { width: 180px; }
.filter-select { width: 120px; }

.filter-bar__btns {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.column-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  padding: 12px 16px;
  border: 1px solid $border;
  border-bottom: none;
  background: $white;
}

.column-bar__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.column-bar__hint {
  font-size: 11px;
  color: $muted;
}

.column-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.column-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  background: $white;
  border: 1px solid $black;
  cursor: grab;
  user-select: none;

  &--dragging { opacity: 0.45; border-style: dashed; }
  &--over { background: rgba($accent, 0.12); border-color: $accent; }
  &--fixed { cursor: default; color: $muted; border-color: $border; background: $bg; }
}

.column-chip__grip {
  font-size: 10px;
  color: $muted;
  letter-spacing: -2px;
}

.column-reset {
  margin-left: auto;
  padding: 0;
  font-size: 12px;
  color: $muted;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover { color: $accent; }
}

.table-wrap {
  border: 1px solid $border;
  border-top: none;
}

.minimal-table {
  :deep(.ant-table) {
    background: $white;
    color: $black;
  }

  :deep(.ant-table-thead > tr > th) {
    background: $black !important;
    color: $white !important;
    font-weight: 500;
    font-size: 12px;
    border-bottom: none !important;
    padding: 12px 14px !important;
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid $border !important;
    padding: 12px 14px !important;
    font-size: 13px;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: $bg !important;
  }

  :deep(.ant-pagination-item-active) {
    border-color: $accent !important;
    a { color: $accent !important; }
  }

  :deep(.ant-pagination-item:hover),
  :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
  :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
    border-color: $accent !important;
    color: $accent !important;
  }
}

.cell-link {
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  color: $accent;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover { color: $black; }
  &--title { font-weight: 600; font-size: 13px; }
  &--more { display: inline-flex; align-items: center; gap: 2px; }
}

.cell-text {
  font-size: 13px;
  color: $black;
}

.cell-num {
  font-size: 13px;
  font-weight: 500;
}

.cell-price {
  font-weight: 600;
  color: $accent;
  font-size: 13px;
}

.cell-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 2px;
  &--0 { background: rgba(#f97316, 0.1); color: #c2410c; }
  &--1 { background: rgba(#3b82f6, 0.1); color: #1d4ed8; }
  &--2 { background: rgba(#06b6d4, 0.1); color: #0e7490; }
  &--3 { background: rgba(#22c55e, 0.1); color: #15803d; }
  &--4 { background: rgba($muted, 0.1); color: $muted; }
}

.cell-mono {
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: $muted;
}

.action-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.action-sep {
  color: $border;
  font-size: 11px;
  user-select: none;
}

.btn-primary {
  background: $accent !important;
  border-color: $accent !important;
  color: $white !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;
  &:hover { background: darken($accent, 6%) !important; border-color: darken($accent, 6%) !important; }
}

.btn-ghost {
  background: $white !important;
  border: 1px solid $black !important;
  color: $black !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;
  &:hover { border-color: $accent !important; color: $accent !important; }
}

.filter-input :deep(.ant-input),
.filter-select :deep(.ant-select-selector) {
  border-radius: 0 !important;
  border-color: $border !important;
  font-size: 13px !important;
}

.filter-input :deep(.ant-input:focus),
.filter-input :deep(.ant-input-affix-wrapper-focused),
.filter-select :deep(.ant-select-focused .ant-select-selector) {
  border-color: $accent !important;
  box-shadow: none !important;
}

.ship-form {
  .ship-order-no { font-weight: 600; margin-bottom: 16px; }
}

.order-detail {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 16px;
    border-bottom: 1px solid $border;
    margin-bottom: 16px;
  }

  .detail-title {
    display: flex;
    flex-direction: column;
    gap: 8px;
    h3 { margin: 0; font-size: 18px; font-weight: 600; }
  }

  .detail-status {
    display: inline-block;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 2px;
    &--0 { background: rgba(#f97316, 0.1); color: #c2410c; }
    &--1 { background: rgba(#3b82f6, 0.1); color: #1d4ed8; }
    &--2 { background: rgba(#06b6d4, 0.1); color: #0e7490; }
    &--3 { background: rgba(#22c55e, 0.1); color: #15803d; }
    &--4 { background: rgba($muted, 0.1); color: $muted; }
  }

  .detail-price {
    font-size: 24px;
    font-weight: 700;
    color: $accent;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .detail-cell {
    background: $bg;
    padding: 12px;
    border-radius: 4px;
    .cell-label { display: block; font-size: 11px; color: $muted; margin-bottom: 4px; }
    .cell-value { font-size: 14px; font-weight: 600; &.price { color: $accent; } &.mono { font-family: monospace; font-size: 12px; } }
  }

  .detail-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid $border;
  }

  .section-title {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: $black;
  }

  .receiver-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: $muted;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: $bg;
    border-radius: 4px;
    font-size: 13px;

    .item-title { flex: 1; font-weight: 500; }
    .item-price { color: $muted; margin-right: 16px; }
    .item-subtotal { font-weight: 600; color: $accent; }
  }

  .remark-text {
    margin: 0;
    padding: 12px;
    background: $bg;
    border-radius: 4px;
    font-size: 13px;
    color: $muted;
  }
}
</style>

<style lang="scss">
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$white: #ffffff;

.minimal-modal {
  .ant-modal-content { border-radius: 0 !important; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important; }
  .ant-modal-header { border-bottom: 1px solid $border !important; padding: 16px 20px !important; }
  .ant-modal-title { font-size: 15px !important; font-weight: 600 !important; color: $black !important; }
  .ant-modal-body { padding: 20px !important; }
  .ant-modal-footer { padding: 14px 20px !important; border-top: 1px solid $border !important; }
}

.minimal-modal .ant-btn-primary {
  background: $accent !important;
  border-color: $accent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.minimal-dropdown {
  .ant-dropdown-menu-item { font-size: 13px !important; }
  .ant-dropdown-menu-item-danger { color: #ff4d4f !important; }
}
</style>