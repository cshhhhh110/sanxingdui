<template>
  <div class="heritage-page">
    <header class="page-top">
      <div class="page-top__main">
        <h1 class="page-top__title">瑰宝管理</h1>
      </div>
      <a-button type="primary" class="btn-primary" @click="showCreateModal = true">
        新增瑰宝
      </a-button>
    </header>

    <section class="filter-bar">
      <a-input
        v-model:value="searchForm.title"
        placeholder="标题"
        allow-clear
        class="filter-input filter-input--wide"
        @pressEnter="handleSearch"
      />
      <a-select
        v-model:value="searchForm.category"
        placeholder="类别"
        allow-clear
        class="filter-select"
      >
        <a-select-option v-for="category in HERITAGE_CATEGORIES" :key="category" :value="category">
          {{ category }}
        </a-select-option>
      </a-select>
      <a-input
        v-model:value="searchForm.region"
        placeholder="地区"
        allow-clear
        class="filter-input"
        @pressEnter="handleSearch"
      />
      <a-select
        v-model:value="searchForm.status"
        placeholder="状态"
        allow-clear
        class="filter-select"
      >
        <a-select-option
          v-for="(status, key) in HERITAGE_ITEM_STATUS"
          :key="key"
          :value="status.code"
        >
          {{ status.name }}
        </a-select-option>
      </a-select>
      <a-range-picker v-model:value="dateRange" class="filter-range" />
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
        :data-source="heritageStore.heritageList"
        :loading="heritageStore.loading"
        :pagination="pagination"
        :row-key="record => record.id"
        :scroll="{ x: tableScrollX }"
        size="middle"
        class="minimal-table"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <button type="button" class="cell-link cell-link--title" @click="handleView(record)">
              {{ record.title }}
            </button>
          </template>

          <template v-else-if="column.key === 'category'">
            <span class="cell-tag cell-tag--accent">{{ record.category || '—' }}</span>
          </template>

          <template v-else-if="column.key === 'region'">
            <span class="cell-text">{{ record.region || '—' }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <HeritageStatusTag :status="record.status" :status-name="record.statusName" />
          </template>

          <template v-else-if="column.key === 'createTime'">
            <span class="cell-mono">{{ formatDate(record.createTime) }}</span>
          </template>

          <template v-else-if="column.key === 'publishTime'">
            <span class="cell-mono">{{ record.publishTime ? formatDate(record.publishTime) : '—' }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-group">
              <button type="button" class="cell-link" @click="handleView(record)">查看</button>
              <span class="action-sep">|</span>
              <button type="button" class="cell-link" @click="handleEdit(record)">编辑</button>
              <span class="action-sep">|</span>
              <a-dropdown>
                <button type="button" class="cell-link cell-link--more">
                  更多 <DownOutlined />
                </button>
                <template #overlay>
                  <a-menu class="minimal-dropdown" @click="({ key }) => handleAction(key, record)">
                    <a-menu-item v-if="canPublish(record)" key="publish">发布</a-menu-item>
                    <a-menu-item v-if="canOffline(record)" key="offline">下架</a-menu-item>
                    <a-menu-divider v-if="canDelete(record)" />
                    <a-menu-item v-if="canDelete(record)" key="delete" danger>删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </template>
      </a-table>
    </section>

    <HeritageItemCreate v-model:open="showCreateModal" mode="admin" @success="handleModalSuccess" />
    <HeritageDetailModal v-model:open="showDetailModal" :item-id="currentItemId" @success="handleModalSuccess" />
    <HeritageItemEdit v-model:open="showEditModal" :item-id="currentItemId" mode="admin" @success="handleModalSuccess" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'
import { useHeritageStore } from '@/store/heritage'
import { useUserStore } from '@/store/user'
import {
  getHeritageItemPage,
  publishHeritageItem,
  offlineHeritageItem,
  deleteHeritageItem,
  HERITAGE_ITEM_STATUS,
  HERITAGE_CATEGORIES
} from '@/api/HeritageApi'
import HeritageStatusTag from '@/components/common/HeritageStatusTag.vue'
import HeritageItemCreate from '@/components/common/HeritageItemCreate.vue'
import HeritageDetailModal from './detail.vue'
import HeritageItemEdit from '@/components/common/HeritageItemEdit.vue'

const COLUMN_STORAGE_KEY = 'backend-heritage-column-order'

const heritageStore = useHeritageStore()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.userType === 'ADMIN')

const searchForm = reactive({
  title: '',
  category: '',
  region: '',
  status: null
})

const dateRange = ref([])
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showEditModal = ref(false)
const currentItemId = ref(null)

const COLUMN_DEF_MAP = {
  title: { title: '标题', key: 'title', width: 200, ellipsis: true },
  category: { title: '类别', key: 'category', width: 110, ellipsis: true },
  region: { title: '地区', key: 'region', width: 120, ellipsis: true },
  status: { title: '状态', key: 'status', width: 100, align: 'center' },
  createTime: { title: '创建时间', key: 'createTime', width: 168 },
  publishTime: { title: '发布时间', key: 'publishTime', width: 168 }
}

const DEFAULT_COLUMN_ORDER = ['title', 'category', 'region', 'status', 'createTime', 'publishTime']

const ACTION_COLUMN = {
  title: '操作',
  key: 'action',
  width: 200,
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

const dragState = reactive({
  dragKey: null,
  dragIndex: -1,
  overKey: null
})

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

function onColumnDragOver(key) {
  dragState.overKey = key
}

function onColumnDragLeave(key) {
  if (dragState.overKey === key) dragState.overKey = null
}

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

const pagination = computed(() => ({
  current: heritageStore.searchParams.currentPage,
  pageSize: heritageStore.searchParams.size,
  total: heritageStore.total,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 件`
}))

const fetchHeritageList = async () => {
  heritageStore.setLoading(true)
  try {
    const res = await getHeritageItemPage({
      ...searchForm,
      currentPage: heritageStore.searchParams.currentPage,
      size: heritageStore.searchParams.size
    })
    heritageStore.setHeritageList(res.records || [], res.total || 0)
  } catch (error) {
    message.error(error.message || '获取列表失败')
  } finally {
    heritageStore.setLoading(false)
  }
}

const handleSearch = () => {
  heritageStore.searchParams.currentPage = 1
  fetchHeritageList()
}

const handleReset = () => {
  Object.assign(searchForm, { title: '', category: '', region: '', status: null })
  dateRange.value = []
  heritageStore.searchParams.currentPage = 1
  fetchHeritageList()
}

const handleTableChange = (pag) => {
  heritageStore.searchParams.currentPage = pag.current
  heritageStore.searchParams.size = pag.pageSize
  fetchHeritageList()
}

const handleView = (r) => {
  currentItemId.value = r.id
  showDetailModal.value = true
}

const handleEdit = (r) => {
  currentItemId.value = r.id
  showEditModal.value = true
}

const canPublish = (record) => {
  if (isAdmin.value) return record.status !== 2
  return record.status === 0 || record.status === 1
}

const canOffline = (record) => {
  if (isAdmin.value) return record.status === 2
  return false
}

const canDelete = (record) => {
  if (isAdmin.value) return record.status === 0 || record.status === 3
  return record.status === 0
}

const handleAction = (key, record) => {
  if (key === 'publish') {
    Modal.confirm({
      title: '发布确认',
      content: `确定发布「${record.title}」？`,
      onOk: () =>
        publishHeritageItem(
          { itemId: record.id },
          { successMsg: '发布成功', onSuccess: fetchHeritageList }
        )
    })
  } else if (key === 'offline') {
    Modal.confirm({
      title: '下架确认',
      content: `确定下架「${record.title}」？`,
      onOk: () =>
        offlineHeritageItem(
          { itemId: record.id },
          { successMsg: '下架成功', onSuccess: fetchHeritageList }
        )
    })
  } else if (key === 'delete') {
    Modal.confirm({
      title: '删除确认',
      content: `确定删除「${record.title}」？此操作不可恢复。`,
      okType: 'danger',
      onOk: () =>
        deleteHeritageItem(
          { itemId: record.id },
          { successMsg: '删除成功', onSuccess: fetchHeritageList }
        )
    })
  }
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
  } catch {
    return d
  }
}

const handleModalSuccess = () => fetchHeritageList()

onMounted(fetchHeritageList)
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

.heritage-page {
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

.page-top__desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: $muted;
  letter-spacing: 0.04em;
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

.filter-input {
  width: 140px;

  &--wide {
    width: 180px;
  }
}

.filter-select {
  width: 120px;
}

.filter-range {
  min-width: 220px;
}

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

  &--dragging {
    opacity: 0.45;
    border-style: dashed;
  }

  &--over {
    background: rgba($accent, 0.12);
    border-color: $accent;
  }

  &--fixed {
    cursor: default;
    color: $muted;
    border-color: $border;
    background: $bg;
  }
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

  &:hover {
    color: $accent;
  }
}

.table-wrap {
  border: 1px solid $border;
}

.minimal-table {
  :deep(.ant-table-thead > tr > th) {
    background: $black !important;
    color: $white !important;
    font-weight: 500;
    font-size: 12px;
    border-bottom: none !important;
    padding: 12px 14px !important;

    &::before {
      display: none !important;
    }
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

    a {
      color: $accent !important;
    }
  }
}

.cell-text {
  color: $muted;
}

.cell-mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: $muted;
}

.cell-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid $border;

  &--accent {
    color: $accent;
    border-color: $accent;
    background: rgba($accent, 0.08);
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

  &--title {
    font-weight: 600;
    text-align: left;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--more {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  &:hover {
    color: $black;
  }
}

.action-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
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

  &:hover {
    background: color.adjust($accent, $lightness: -6%) !important;
    border-color: color.adjust($accent, $lightness: -6%) !important;
  }
}

.btn-ghost {
  background: $white !important;
  border: 1px solid $black !important;
  color: $black !important;
  border-radius: 0 !important;
  height: 34px !important;
  box-shadow: none !important;

  &:hover {
    border-color: $accent !important;
    color: $accent !important;
  }
}

.filter-input :deep(.ant-input),
.filter-select :deep(.ant-select-selector),
.filter-range :deep(.ant-picker) {
  border-radius: 0 !important;
  border-color: $border !important;
}

.filter-input :deep(.ant-input:focus),
.filter-input :deep(.ant-input-affix-wrapper-focused),
.filter-select.ant-select-focused :deep(.ant-select-selector),
.filter-range.ant-picker-focused {
  border-color: $accent !important;
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .heritage-page {
    padding: 16px;
  }

  .page-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-input,
  .filter-select,
  .filter-range {
    width: 100%;
    min-width: 0;
  }

  .filter-bar__btns {
    width: 100%;
    margin-left: 0;
  }
}
</style>

<style lang="scss">
.minimal-dropdown {
  border-radius: 0 !important;
  padding: 4px !important;

  .ant-dropdown-menu-item {
    font-size: 13px;
    border-radius: 0 !important;

    &:hover {
      background: #fafafa !important;
      color: #42664f !important;
    }
  }
}
</style>
