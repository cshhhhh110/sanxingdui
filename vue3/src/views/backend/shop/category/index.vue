<template>
  <div class="category-page">
    <header class="page-top">
      <div class="page-top__main">
        <h1 class="page-top__title">商品分类管理</h1>
      </div>
      <a-button type="primary" class="btn-primary" @click="showCreateModal">
        新增分类
      </a-button>
    </header>

    <section class="filter-bar">
      <a-input
        v-model:value="searchForm.name"
        placeholder="分类名称"
        allow-clear
        class="filter-input filter-input--wide"
        @pressEnter="handleSearch"
      />
      <a-select
        v-model:value="searchForm.status"
        placeholder="状态"
        allow-clear
        class="filter-select"
      >
        <a-select-option :value="1">启用</a-select-option>
        <a-select-option :value="0">禁用</a-select-option>
      </a-select>
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
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        :scroll="{ x: tableScrollX }"
        row-key="id"
        size="middle"
        class="minimal-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <button type="button" class="cell-link cell-link--title" @click="showEditModal(record)">
              {{ record.name }}
            </button>
          </template>

          <template v-else-if="column.key === 'status'">
            <span :class="['cell-status', `cell-status--${record.status}`]">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </span>
          </template>

          <template v-else-if="column.key === 'createTime'">
            <span class="cell-mono">{{ formatDate(record.createTime) }}</span>
          </template>

          <template v-else-if="column.key === 'updateTime'">
            <span class="cell-mono">{{ formatDate(record.updateTime) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-group">
              <button type="button" class="cell-link" @click="showEditModal(record)">编辑</button>
              <span class="action-sep">|</span>
              <a-popconfirm
                title="确定要删除这个分类吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <button type="button" class="cell-link cell-link--danger">删除</button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="540px"
      class="minimal-modal"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <div class="modal-body">
        <a-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          :label-col="{ span: 5 }"
          :wrapper-col="{ span: 19 }"
          class="minimal-form"
        >
          <a-form-item label="分类名称" name="name">
            <a-input v-model:value="formData.name" placeholder="请输入分类名称" :maxlength="100" />
          </a-form-item>

          <a-form-item label="状态" name="status">
            <a-radio-group v-model:value="formData.status">
              <a-radio :value="1">启用</a-radio>
              <a-radio :value="0">禁用</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { getCategoryPage, createCategory, updateCategory, deleteCategory } from '@/api/ShopCategoryApi'

const COLUMN_STORAGE_KEY = 'backend-category-column-order'

const loading = ref(false)
const tableData = ref([])
const modalVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const currentEditId = ref(null)

const isEdit = computed(() => !!currentEditId.value)

const searchForm = reactive({
  name: '',
  status: null
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 条`
})

const formData = reactive({
  name: '',
  status: 1
})

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 100, message: '分类名称长度不能超过100个字符', trigger: 'blur' }
  ]
}

const COLUMN_DEF_MAP = {
  id: { title: '分类ID', dataIndex: 'id', key: 'id', width: 200 },
  name: { title: '分类名称', dataIndex: 'name', key: 'name', ellipsis: true },
  status: { title: '状态', key: 'status', width: 90, align: 'center' },
  createTime: { title: '创建时间', key: 'createTime', width: 168 },
  updateTime: { title: '更新时间', key: 'updateTime', width: 168 }
}

const DEFAULT_COLUMN_ORDER = ['id', 'name', 'status', 'createTime', 'updateTime']

const ACTION_COLUMN = {
  title: '操作',
  key: 'action',
  width: 140,
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

const modalTitle = computed(() => isEdit.value ? '编辑分类' : '新增分类')

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

const fetchCategoryList = () => {
  loading.value = true
  const params = {
    current: pagination.current,
    size: pagination.pageSize,
    name: searchForm.name || null,
    status: searchForm.status
  }
  getCategoryPage(params, {
    onSuccess: (res) => {
      tableData.value = res.records || []
      pagination.total = res.total || 0
      pagination.current = res.current || 1
      loading.value = false
    },
    onError: () => { loading.value = false }
  })
}

const handleSearch = () => {
  pagination.current = 1
  fetchCategoryList()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.status = null
  pagination.current = 1
  fetchCategoryList()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchCategoryList()
}

const showCreateModal = () => {
  currentEditId.value = null
  modalVisible.value = true
  nextTick(() => resetForm())
}

const showEditModal = (record) => {
  currentEditId.value = record.id
  modalVisible.value = true
  nextTick(() => {
    Object.assign(formData, { name: record.name, status: record.status })
    formRef.value?.clearValidate()
  })
}

const resetForm = () => {
  formData.name = ''
  formData.status = 1
  formRef.value?.resetFields()
  formRef.value?.clearValidate()
}

const handleSubmit = () => {
  formRef.value?.validate().then(() => {
    submitLoading.value = true
    const params = isEdit.value ? { ...formData, id: currentEditId.value } : formData
    const apiCall = isEdit.value ? updateCategory : createCategory
    apiCall(params, {
      successMsg: isEdit.value ? '更新分类成功' : '创建分类成功',
      onSuccess: () => {
        submitLoading.value = false
        modalVisible.value = false
        fetchCategoryList()
        nextTick(() => resetForm())
      },
      onError: () => { submitLoading.value = false }
    })
  })
}

const handleCancel = () => {
  modalVisible.value = false
  nextTick(() => resetForm())
}

const handleDelete = (id) => {
  deleteCategory(id, {
    successMsg: '删除分类成功',
    onSuccess: () => fetchCategoryList(),
    onError: () => {}
  })
}

onMounted(() => fetchCategoryList())
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

.category-page {
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

.filter-input { width: 140px; &--wide { width: 180px; } }
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
  &--danger { color: $black; }
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

.cell-mono {
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: $muted;
}

.cell-status {
  font-size: 12px;
  font-weight: 500;
  &--1 { color: $accent; }
  &--0 { color: $muted; }
}

.btn-primary {
  background: $accent !important;
  border-color: $accent !important;
  color: $white !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;
  &:hover { background: color.adjust($accent, $lightness: -6%) !important; border-color: color.adjust($accent, $lightness: -6%) !important; }
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

.modal-body { padding: 8px 0; }

.minimal-form :deep(.ant-form-item-label > label) {
  font-size: 12px;
  color: $muted !important;
}

.minimal-form :deep(.ant-input),
.minimal-form :deep(.ant-select-selector),
.minimal-form :deep(.ant-radio-wrapper) {
  border-radius: 0 !important;
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
</style>
