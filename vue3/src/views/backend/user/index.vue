<template>
  <div class="user-page">
    <!-- 顶栏 -->
    <header class="page-top">
      <div class="page-top__main">
        <h1 class="page-top__title">用户管理</h1>
      </div>
      <div class="page-top__actions">
        <span v-if="selectedRowKeys.length" class="selection-hint">
          已选 {{ selectedRowKeys.length }} 项
        </span>
        <a-button type="primary" class="btn-primary" @click="handleAdd">
          新增用户
        </a-button>
      </div>
    </header>

    <!-- 筛选 -->
    <section class="filter-bar">
      <a-input
        v-model:value="searchForm.username"
        placeholder="用户名"
        allow-clear
        class="filter-input"
        @pressEnter="handleSearch"
      />
      <a-input
        v-model:value="searchForm.email"
        placeholder="邮箱"
        allow-clear
        class="filter-input"
        @pressEnter="handleSearch"
      />
      <a-select
        v-model:value="searchForm.userType"
        placeholder="类型"
        allow-clear
        class="filter-select"
      >
        <a-select-option value="ADMIN">管理员</a-select-option>
        <a-select-option value="USER">普通用户</a-select-option>
      </a-select>
      <a-select
        v-model:value="searchForm.status"
        placeholder="状态"
        allow-clear
        class="filter-select"
      >
        <a-select-option value="ACTIVE">正常</a-select-option>
        <a-select-option value="INACTIVE">未激活</a-select-option>
        <a-select-option value="BANNED">已封禁</a-select-option>
      </a-select>
      <div class="filter-bar__btns">
        <a-button type="primary" class="btn-primary" @click="handleSearch">查询</a-button>
        <a-button class="btn-ghost" @click="handleReset">重置</a-button>
      </div>
    </section>

    <!-- 列顺序调节 -->
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

    <!-- 表格 -->
    <section class="table-wrap">
      <a-table
        :columns="orderedColumns"
        :data-source="userList"
        :loading="loading"
        :pagination="pagination"
        :row-selection="rowSelection"
        :row-key="record => record.id"
        :scroll="{ x: tableScrollX }"
        size="middle"
        class="minimal-table"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <a-avatar :src="getAvatarUrl(record.avatar)" :size="32" class="cell-avatar">
              {{ record.name?.charAt(0) || record.username?.charAt(0) }}
            </a-avatar>
          </template>

          <template v-else-if="column.key === 'sex'">
            <span class="cell-text">{{ record.sex || '—' }}</span>
          </template>

          <template v-else-if="column.key === 'userType'">
            <span class="cell-tag" :class="record.userType === 'ADMIN' ? 'cell-tag--dark' : 'cell-tag--accent'">
              {{ getUserTypeLabel(record.userType) }}
            </span>
          </template>

          <template v-else-if="column.key === 'status'">
            <span class="cell-status" :class="'cell-status--' + record.status">
              {{ getStatusLabel(record.status) }}
            </span>
          </template>

          <template v-else-if="column.key === 'createdAt'">
            <span class="cell-mono">{{ formatDate(record.createdAt) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <button type="button" class="cell-link" @click="handleView(record)">查看</button>
          </template>
        </template>
      </a-table>
    </section>

    <!-- 详情 -->
    <a-modal
      v-model:open="detailVisible"
      title="用户详情"
      :footer="null"
      centered
      width="400px"
      wrap-class-name="minimal-modal"
    >
      <div v-if="detailUser" class="detail-panel">
        <div class="detail-panel__head">
          <a-avatar :size="48" :src="detailUser.avatarUrl" class="cell-avatar">
            {{ detailUser.name?.charAt(0) || detailUser.username?.charAt(0) }}
          </a-avatar>
          <div>
            <div class="detail-panel__name">{{ detailUser.name || '—' }}</div>
            <div class="detail-panel__user">@{{ detailUser.username || '—' }}</div>
          </div>
        </div>
        <dl class="detail-list">
          <div class="detail-list__row">
            <dt>角色</dt>
            <dd>{{ detailUser.roleLabel }}</dd>
          </div>
          <div class="detail-list__row">
            <dt>状态</dt>
            <dd>{{ detailUser.statusLabel }}</dd>
          </div>
          <div class="detail-list__row">
            <dt>邮箱</dt>
            <dd>{{ detailUser.email || '—' }}</dd>
          </div>
          <div class="detail-list__row">
            <dt>手机</dt>
            <dd>{{ detailUser.phone || '—' }}</dd>
          </div>
          <div class="detail-list__row">
            <dt>性别</dt>
            <dd>{{ detailUser.sex || '—' }}</dd>
          </div>
          <div class="detail-list__row">
            <dt>创建时间</dt>
            <dd class="cell-mono">{{ detailUser.createdAt }}</dd>
          </div>
        </dl>
      </div>
    </a-modal>

    <!-- 新增 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :width="480"
      wrap-class-name="minimal-modal"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        class="minimal-form"
      >
        <div class="form-row">
          <a-form-item label="用户名" name="username">
            <a-input v-model:value="formData.username" placeholder="用户名" :disabled="isEdit" />
          </a-form-item>
          <a-form-item label="邮箱" name="email">
            <a-input v-model:value="formData.email" placeholder="邮箱" />
          </a-form-item>
        </div>
        <div class="form-row">
          <a-form-item label="手机号" name="phone">
            <a-input v-model:value="formData.phone" placeholder="手机号" />
          </a-form-item>
          <a-form-item label="性别" name="sex">
            <a-select v-model:value="formData.sex" placeholder="性别" allow-clear>
              <a-select-option value="男">男</a-select-option>
              <a-select-option value="女">女</a-select-option>
            </a-select>
          </a-form-item>
        </div>
        <a-form-item label="用户类型" name="userType">
          <a-select v-model:value="formData.userType" placeholder="用户类型">
            <a-select-option value="ADMIN">管理员</a-select-option>
            <a-select-option value="USER">普通用户</a-select-option>
          </a-select>
        </a-form-item>
        <div class="form-row">
          <a-form-item label="密码" name="password">
            <a-input-password v-model:value="formData.password" placeholder="密码" />
          </a-form-item>
          <a-form-item label="确认密码" name="confirmPassword">
            <a-input-password v-model:value="formData.confirmPassword" placeholder="再次输入" />
          </a-form-item>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/store/user'
import { getUserPage, register } from '@/api/user'

const COLUMN_STORAGE_KEY = 'backend-user-column-order'

const userStore = useUserStore()
const baseAPI = import.meta.env.VITE_BASE_API || '/api'
const currentUserId = computed(() => userStore.userId)

const searchForm = reactive({
  username: '',
  email: '',
  userType: undefined,
  status: undefined
})

const userList = ref([])
const loading = ref(false)
const selectedRowKeys = ref([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`
})

/** 列定义（不含操作列） */
const COLUMN_DEF_MAP = {
  avatar: { title: '头像', key: 'avatar', width: 72, align: 'center' },
  username: { title: '用户名', dataIndex: 'username', key: 'username', width: 120, ellipsis: true },
  email: { title: '邮箱', dataIndex: 'email', key: 'email', width: 200, ellipsis: true },
  phone: { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130, ellipsis: true },
  sex: { title: '性别', key: 'sex', width: 72, align: 'center' },
  userType: { title: '类型', key: 'userType', width: 100, align: 'center' },
  status: { title: '状态', key: 'status', width: 96, align: 'center' },
  createdAt: { title: '创建时间', key: 'createdAt', width: 168 }
}

const DEFAULT_COLUMN_ORDER = ['avatar', 'username', 'email', 'phone', 'sex', 'userType', 'status', 'createdAt']

const ACTION_COLUMN = {
  title: '操作',
  key: 'action',
  width: 88,
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
  const cols = columnOrder.value
    .map((key) => COLUMN_DEF_MAP[key])
    .filter(Boolean)
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

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = keys
  },
  getCheckboxProps: (record) => ({
    disabled: record.id === currentUserId.value
  })
}))

const modalVisible = ref(false)
const modalTitle = ref('新增用户')
const isEdit = ref(false)
const formRef = ref()
const formData = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  sex: undefined,
  userType: undefined,
  password: '',
  confirmPassword: ''
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  userType: [{ required: true, message: '请选择用户类型', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, message: '请再次输入密码', trigger: 'blur' }]
}

const fetchUserList = async () => {
  loading.value = true
  try {
    const params = {
      currentPage: pagination.current,
      size: pagination.pageSize,
      username: searchForm.username || undefined,
      email: searchForm.email || undefined,
      userType: searchForm.userType || undefined,
      status: searchForm.status || undefined
    }
    const res = await getUserPage(params)
    userList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    message.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchUserList()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.email = ''
  searchForm.userType = undefined
  searchForm.status = undefined
  pagination.current = 1
  fetchUserList()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchUserList()
}

const handleAdd = () => {
  modalTitle.value = '新增用户'
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

const detailVisible = ref(false)
const detailUser = ref({})

const handleView = (record) => {
  detailUser.value = {
    ...record,
    avatarUrl: getAvatarUrl(record.avatar),
    roleLabel: getUserTypeLabel(record.userType),
    statusLabel: getStatusLabel(record.status),
    createdAt: formatDate(record.createdAt)
  }
  detailVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    if (formData.password !== formData.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    await register(formData)
    message.success('新增成功')
    modalVisible.value = false
    fetchUserList()
  } catch (error) {
    if (error.errorFields) return
    message.error(error.message || '新增失败')
  }
}

const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

const resetForm = () => {
  formData.username = ''
  formData.nickname = ''
  formData.email = ''
  formData.phone = ''
  formData.sex = undefined
  formData.userType = undefined
  formData.password = ''
  formData.confirmPassword = ''
  formRef.value?.clearValidate()
}

const getAvatarUrl = (avatar) => (avatar ? baseAPI + avatar : '')

const getUserTypeLabel = (userType) => {
  const typeMap = { ADMIN: '管理员', USER: '普通用户' }
  return typeMap[userType] || '未知'
}

const getStatusLabel = (status) => {
  const statusMap = { ACTIVE: '正常', INACTIVE: '未激活', BANNED: '已封禁' }
  return statusMap[status] || '未知'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchUserList()
})
</script>

<style lang="scss" scoped>
$user-accent: #42664f;
$user-black: #111111;
$user-muted: #6b6b6b;
$user-border: #e8e8e8;
$user-bg: #fafafa;
$user-white: #ffffff;

.user-page {
  min-height: 100%;
  padding: 28px 32px 40px;
  background: $user-white;
  color: $user-black;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* —— 顶栏 —— */
.page-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid $user-black;
}

.page-top__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: $user-black;
}

.page-top__desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: $user-muted;
  letter-spacing: 0.04em;
}

.page-top__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selection-hint {
  font-size: 12px;
  color: $user-accent;
}

/* —— 筛选 —— */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: $user-bg;
  border: 1px solid $user-border;
}

.filter-input {
  width: 160px;
}

.filter-select {
  width: 120px;
}

.filter-bar__btns {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* —— 列顺序条 —— */
.column-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  margin-bottom: 0;
  padding: 12px 16px;
  border: 1px solid $user-border;
  border-bottom: none;
  background: $user-white;
}

.column-bar__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $user-black;
}

.column-bar__hint {
  font-size: 11px;
  color: $user-muted;
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
  color: $user-black;
  background: $user-white;
  border: 1px solid $user-black;
  cursor: grab;
  user-select: none;
  transition: background 0.15s, border-color 0.15s;

  &:active {
    cursor: grabbing;
  }

  &--dragging {
    opacity: 0.45;
    border-style: dashed;
  }

  &--over {
    background: rgba($user-accent, 0.12);
    border-color: $user-accent;
  }

  &--fixed {
    cursor: default;
    color: $user-muted;
    border-color: $user-border;
    background: $user-bg;
  }
}

.column-chip__grip {
  font-size: 10px;
  color: $user-muted;
  letter-spacing: -2px;
}

.column-reset {
  margin-left: auto;
  padding: 0;
  font-size: 12px;
  color: $user-muted;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: $user-accent;
  }
}

/* —— 表格区 —— */
.table-wrap {
  border: 1px solid $user-border;
}

.minimal-table {
  :deep(.ant-table) {
    background: $user-white;
    color: $user-black;
  }

  :deep(.ant-table-thead > tr > th) {
    background: $user-black !important;
    color: $user-white !important;
    font-weight: 500;
    font-size: 12px;
    border-bottom: none !important;
    padding: 12px 14px !important;

    &::before {
      display: none !important;
    }
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid $user-border !important;
    padding: 12px 14px !important;
    font-size: 13px;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: $user-bg !important;
  }

  :deep(.ant-table-tbody > tr.ant-table-row-selected > td) {
    background: rgba($user-accent, 0.06) !important;
  }

  :deep(.ant-checkbox-checked .ant-checkbox-inner) {
    background-color: $user-accent !important;
    border-color: $user-accent !important;
  }

  :deep(.ant-pagination-item-active) {
    border-color: $user-accent !important;

    a {
      color: $user-accent !important;
    }
  }

  :deep(.ant-pagination-item:hover),
  :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
  :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
    border-color: $user-accent !important;
    color: $user-accent !important;
  }
}

/* —— 单元格 —— */
.cell-avatar {
  background: $user-bg !important;
  color: $user-accent !important;
  border: 1px solid $user-border !important;
  font-weight: 600;
}

.cell-text {
  color: $user-muted;
}

.cell-mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: $user-muted;
}

.cell-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid $user-border;

  &--dark {
    color: $user-black;
    background: $user-white;
    border-color: $user-black;
  }

  &--accent {
    color: $user-accent;
    background: rgba($user-accent, 0.08);
    border-color: $user-accent;
  }
}

.cell-status {
  font-size: 12px;
  font-weight: 500;

  &--ACTIVE {
    color: $user-accent;
  }

  &--INACTIVE {
    color: $user-muted;
  }

  &--BANNED {
    color: $user-black;
    text-decoration: line-through;
  }
}

.cell-link {
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  color: $user-accent;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: $user-black;
  }
}

/* —— 按钮 —— */
.btn-primary {
  background: $user-accent !important;
  border-color: $user-accent !important;
  color: $user-white !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;

  &:hover {
    background: color.adjust($user-accent, $lightness: -6%) !important;
    border-color: color.adjust($user-accent, $lightness: -6%) !important;
  }
}

.btn-ghost {
  background: $user-white !important;
  border: 1px solid $user-black !important;
  color: $user-black !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;

  &:hover {
    border-color: $user-accent !important;
    color: $user-accent !important;
  }
}

.filter-input :deep(.ant-input),
.filter-select :deep(.ant-select-selector) {
  border-radius: 0 !important;
  border-color: $user-border !important;
  font-size: 13px !important;
}

.filter-input :deep(.ant-input:focus),
.filter-input :deep(.ant-input-affix-wrapper-focused),
.filter-select.ant-select-focused :deep(.ant-select-selector) {
  border-color: $user-accent !important;
  box-shadow: none !important;
}

/* —— 详情 —— */
.detail-panel__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid $user-border;
}

.detail-panel__name {
  font-size: 16px;
  font-weight: 600;
}

.detail-panel__user {
  font-size: 12px;
  color: $user-muted;
  margin-top: 2px;
}

.detail-list__row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid $user-border;
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }

  dt {
    color: $user-muted;
    margin: 0;
  }

  dd {
    margin: 0;
    font-weight: 500;
    text-align: right;
    max-width: 60%;
    word-break: break-all;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.minimal-form :deep(.ant-form-item-label > label) {
  font-size: 12px;
  color: $user-muted !important;
}

.minimal-form :deep(.ant-input),
.minimal-form :deep(.ant-select-selector) {
  border-radius: 0 !important;
}

@media (max-width: 768px) {
  .user-page {
    padding: 16px;
  }

  .page-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-input,
  .filter-select {
    width: 100%;
  }

  .filter-bar__btns {
    width: 100%;
    margin-left: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

<style lang="scss">
$accent: #42664f;
$black: #111111;
$white: #ffffff;
$border: #e8e8e8;

.minimal-modal {
  .ant-modal-content {
    padding: 0 !important;
    border: 1px solid $black !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .ant-modal-header {
    padding: 16px 20px !important;
    border-bottom: 1px solid $border !important;
    background: $white !important;

    .ant-modal-title {
      font-size: 15px !important;
      font-weight: 600 !important;
      color: $black !important;
    }
  }

  .ant-modal-body {
    padding: 20px !important;
  }

  .ant-modal-footer {
    padding: 14px 20px !important;
    border-top: 1px solid $border !important;
    background: #fafafa !important;
  }

  .ant-btn {
    height: 34px !important;
    padding: 0 20px !important;
    font-size: 13px !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .ant-btn-default {
    background: $white !important;
    border: 1px solid $black !important;
    color: $black !important;

    &:hover {
      border-color: $accent !important;
      color: $accent !important;
    }
  }

  .ant-btn-primary {
    background: $accent !important;
    border-color: $accent !important;
    color: $white !important;

    &:hover {
      background: color.adjust($accent, $lightness: -6%) !important;
      border-color: color.adjust($accent, $lightness: -6%) !important;
    }
  }

  // 详情弹窗头像样式
  .cell-avatar {
    border-radius: 0 !important;
  }
}
</style>
