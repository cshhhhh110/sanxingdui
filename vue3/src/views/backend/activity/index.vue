<template>
  <div class="activity-management">
    <!-- 页面标题 -->
    <header class="page-top">
      <div class="page-top__main">
        <h1 class="page-top__title">活动管理</h1>
      </div>
      <div class="page-top__actions">
        <a-button type="primary" class="btn-primary" @click="showCreateModal">
          新增活动
        </a-button>
      </div>
    </header>

    <!-- 搜索筛选区域 -->
    <section class="filter-bar">
      <a-input
        v-model:value="searchForm.title"
        placeholder="标题"
        allow-clear
        class="filter-input"
        @pressEnter="handleSearch"
      />
      <a-select
        v-model:value="searchForm.type"
        placeholder="类型"
        allow-clear
        class="filter-select"
      >
        <a-select-option value="体验">体验</a-select-option>
        <a-select-option value="展览">展览</a-select-option>
        <a-select-option value="培训">培训</a-select-option>
        <a-select-option value="比赛">比赛</a-select-option>
      </a-select>
      <a-select
        v-model:value="searchForm.status"
        placeholder="状态"
        allow-clear
        class="filter-select"
      >
        <a-select-option :value="0">草稿</a-select-option>
        <a-select-option :value="1">报名中</a-select-option>
        <a-select-option :value="2">进行中</a-select-option>
        <a-select-option :value="3">已结束</a-select-option>
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

    <!-- 数据表格 -->
    <section class="table-wrap">
      <a-table
          :columns="orderedColumns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
          :scroll="{ x: tableScrollX }"
          size="middle"
          class="minimal-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'coverFileId'">
            <div class="cover-wrap">
              <img
                  v-if="record.coverFilePath"
                  :src="getFullImagePath(record.coverFilePath)"
                  alt="封面"
                  class="cover-img"
              />
              <div v-else class="cover-empty">—</div>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <span :class="['cell-status', `cell-status--${record.status}`]">
              {{ record.statusName }}
            </span>
          </template>

          <template v-else-if="column.key === 'time'">
            <div class="time-cell">
              <div class="time-row">
                <span class="time-label">开始</span>
                <span>{{ formatDate(record.startTime) }}</span>
              </div>
              <div class="time-row">
                <span class="time-label">结束</span>
                <span>{{ formatDate(record.endTime) }}</span>
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-group">
              <button type="button" class="cell-link" @click="handleViewSignups(record)">报名管理</button>
              <span class="action-sep">|</span>
              <button type="button" class="cell-link" @click="handleEdit(record)">编辑</button>
              <span class="action-sep">|</span>
              <a-popconfirm
                  title="确定要删除此活动吗？"
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

    <!-- 创建/编辑活动弹窗 -->
    <a-modal
        v-model:open="isModalVisible"
        :title="modalTitle"
        width="800px"
        class="minimal-modal"
        @ok="handleModalOk"
        @cancel="handleModalCancel"
    >
      <div class="modal-body">
        <a-form
            :model="formData"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            class="minimal-form"
        >
          <a-form-item label="活动标题" required>
            <a-input v-model:value="formData.title" placeholder="请输入活动标题" />
          </a-form-item>

          <a-form-item label="活动类型" required>
            <a-select v-model:value="formData.type" placeholder="请选择活动类型">
              <a-select-option value="体验">体验</a-select-option>
              <a-select-option value="展览">展览</a-select-option>
              <a-select-option value="培训">培训</a-select-option>
              <a-select-option value="比赛">比赛</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="活动时间" required>
            <a-range-picker
                v-model:value="timeRange"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
            />
          </a-form-item>

          <a-form-item label="活动地点">
            <a-input v-model:value="formData.location" placeholder="请输入活动地点" />
          </a-form-item>

          <a-form-item label="活动描述">
            <a-textarea
                v-model:value="formData.description"
                placeholder="请输入活动描述"
                :rows="4"
            />
          </a-form-item>

          <a-form-item label="活动封面">
            <a-upload
                v-model:file-list="coverFileList"
                :before-upload="handleCoverBeforeUpload"
                :remove="handleRemoveCover"
                accept="image/*"
                :max-count="1"
                list-type="picture-card"
                :show-upload-list="{ showPreviewIcon: false }"
            >
              <div v-if="coverFileList.length < 1" class="upload-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>上传封面</span>
              </div>
            </a-upload>
            <div class="upload-hint">
              支持JPG、PNG格式，建议尺寸1200×400像素，文件大小不超过5MB
            </div>
          </a-form-item>

          <a-form-item label="活动状态">
            <a-select v-model:value="formData.status" placeholder="请选择状态">
              <a-select-option :value="0">草稿</a-select-option>
              <a-select-option :value="1">报名中</a-select-option>
              <a-select-option :value="2">进行中</a-select-option>
              <a-select-option :value="3">已结束</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 报名管理弹窗 -->
    <a-modal
        v-model:open="isSignupModalVisible"
        title="报名管理"
        width="900px"
        :footer="null"
        class="minimal-modal"
    >
      <a-table
          :columns="signupColumns"
          :data-source="signupData"
          :loading="signupLoading"
          :pagination="signupPagination"
          @change="handleSignupTableChange"
          row-key="id"
          size="middle"
          class="minimal-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <span :class="['cell-status', `signup-status-${record.status}`]">
              {{ record.statusName }}
            </span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-cell">
              <button
                  v-if="record.status === 0"
                  class="cell-link"
                  @click="handleApproveSignup(record.id)"
              >
                通过
              </button>
              <button
                  v-if="record.status === 0"
                  class="cell-link cell-link--danger"
                  @click="handleRejectSignup(record.id)"
              >
                拒绝
              </button>
              <button
                  v-if="record.status === 1"
                  class="cell-link"
                  @click="handleCheckIn(record.id)"
              >
                签到
              </button>
            </div>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { generateUUID } from '@/composables/useBusinessUUID'
import {
  getActivityPage,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitySignups,
  approveSignup,
  rejectSignup,
  checkInSignup
} from '@/api/ActivityApi'
import { uploadBusinessFile, deleteFile } from '@/api/FileApi'

// 搜索表单
const searchForm = reactive({
  title: '',
  type: undefined,
  status: undefined
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条数据`
})

// 表格列定义
const COLUMN_STORAGE_KEY = 'backend-activity-column-order'

const COLUMN_DEF_MAP = {
  id: { title: '活动ID', dataIndex: 'id', key: 'id', width: 180 },
  title: { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
  type: { title: '类型', dataIndex: 'type', key: 'type', width: 90 },
  coverFileId: { title: '封面', key: 'coverFileId', width: 80, align: 'center' },
  time: { title: '活动时间', key: 'time', width: 180 },
  location: { title: '地点', dataIndex: 'location', key: 'location', ellipsis: true },
  status: { title: '状态', key: 'status', width: 90, align: 'center' }
}

const DEFAULT_COLUMN_ORDER = ['id', 'title', 'type', 'coverFileId', 'time', 'location', 'status']

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

// 弹窗相关
const isModalVisible = ref(false)
const modalTitle = ref('新增活动')
const isEdit = ref(false)
const formData = reactive({
  id: '',
  title: '',
  type: '',
  location: '',
  description: '',
  status: 0,
  coverFileId: null
})
const timeRange = ref([])

// 封面上传相关
const coverFileList = ref([])
const uploadingCover = ref(false)

// 报名管理相关
const isSignupModalVisible = ref(false)
const signupData = ref([])
const signupLoading = ref(false)
const signupPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})
const currentActivityId = ref(null)

const signupColumns = [
  { title: '报名ID', dataIndex: 'id', key: 'id', width: 100 },
  { title: '活动标题', dataIndex: 'activityTitle', key: 'activityTitle' },
  { title: '用户名', dataIndex: 'username', key: 'username', width: 150 },
  { title: '状态', key: 'status', width: 100 },
  { title: '报名时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 200 }
]

// 加载数据
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
          tableData.value = data.records || []
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
  searchForm.status = undefined
  pagination.current = 1
  loadData()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const showCreateModal = () => {
  isEdit.value = false
  modalTitle.value = '新增活动'
  resetForm()
  isModalVisible.value = true
}

const handleEdit = (record) => {
  isEdit.value = true
  modalTitle.value = '编辑活动'
  Object.assign(formData, record)
  if (record.startTime && record.endTime) {
    timeRange.value = [dayjs(record.startTime), dayjs(record.endTime)]
  }
  loadActivityCover(record)
  isModalVisible.value = true
}

const handleModalOk = () => {
  if (!formData.title || !formData.type) {
    message.error('请填写必填项')
    return
  }

  if (timeRange.value && timeRange.value.length === 2) {
    formData.startTime = timeRange.value[0].format('YYYY-MM-DD HH:mm:ss')
    formData.endTime = timeRange.value[1].format('YYYY-MM-DD HH:mm:ss')
  }

  if (isEdit.value) {
    updateActivity(
        { activityId: formData.id, ...formData },
        {
          onSuccess: () => {
            message.success('更新成功')
            isModalVisible.value = false
            loadData()
          },
          successMsg: false
        }
    )
  } else {
    formData.id = generateUUID()
    createActivity(
        formData,
        {
          onSuccess: () => {
            message.success('创建成功')
            isModalVisible.value = false
            loadData()
          },
          successMsg: false
        }
    )
  }
}

const handleModalCancel = () => {
  isModalVisible.value = false
  resetForm()
}

const resetForm = () => {
  formData.id = ''
  formData.title = ''
  formData.type = ''
  formData.location = ''
  formData.description = ''
  formData.status = 0
  formData.coverFileId = null
  timeRange.value = []
  coverFileList.value = []
}

const loadActivityCover = (activity) => {
  coverFileList.value = []
  if (activity.coverFileId) {
    coverFileList.value = [{
      uid: activity.coverFileId,
      name: '活动封面',
      status: 'done',
      url: activity.coverFilePath || '',
      fileId: activity.coverFileId
    }]
  }
}

const handleCoverBeforeUpload = async (file) => {
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    message.error('封面文件大小不能超过 5MB!')
    return false
  }

  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件!')
    return false
  }

  try {
    uploadingCover.value = true
    const tempFileId = Date.now()

    coverFileList.value = [{
      uid: tempFileId,
      name: file.name,
      status: 'uploading',
      percent: 0
    }]

    if (!formData.id) {
      formData.id = generateUUID()
    }

    await uploadBusinessFile(
        file,
        {
          businessType: 'ACTIVITY',
          businessId: formData.id,
          businessField: 'cover'
        },
        false,
        {
          onSuccess: (data) => {
            coverFileList.value = []
            coverFileList.value = [{
              uid: data.id,
              name: data.originalName || file.name,
              status: 'done',
              url: data.filePath,
              fileId: data.id
            }]
            formData.coverFileId = data.id
            message.success('封面上传成功')
            uploadingCover.value = false
          },
          onError: () => {
            coverFileList.value = []
            message.error('封面上传失败')
            uploadingCover.value = false
          },
          successMsg: false
        }
    )
  } catch (error) {
    console.error('上传失败:', error)
    coverFileList.value = []
    uploadingCover.value = false
  }

  return false
}

const handleRemoveCover = (file) => {
  return new Promise((resolve, reject) => {
    try {
      if (file.fileId) {
        deleteFile(
            { fileId: file.fileId },
            {
              onSuccess: () => {
                coverFileList.value = []
                formData.coverFileId = null
                message.success('封面删除成功')
                resolve(true)
              },
              onError: () => {
                message.error('删除失败')
                reject(false)
              },
              successMsg: false
            }
        )
      } else {
        coverFileList.value = []
        formData.coverFileId = null
        message.success('文件移除成功')
        resolve(true)
      }
    } catch (error) {
      console.error('删除封面异常:', error)
      message.error('删除失败')
      reject(false)
    }
  })
}

const handleDelete = (id) => {
  deleteActivity(
      { activityId: id },
      {
        onSuccess: () => {
          message.success('删除成功')
          loadData()
        },
        successMsg: false
      }
  )
}

const handleViewSignups = (record) => {
  currentActivityId.value = record.id
  isSignupModalVisible.value = true
  loadSignups()
}

const loadSignups = () => {
  signupLoading.value = true
  getActivitySignups(
      {
        activityId: currentActivityId.value,
        current: signupPagination.current,
        size: signupPagination.pageSize
      },
      {
        onSuccess: (data) => {
          signupData.value = data.records || []
          signupPagination.total = data.total || 0
          signupLoading.value = false
        },
        onError: () => {
          signupLoading.value = false
        }
      }
  )
}

const handleSignupTableChange = (pag) => {
  signupPagination.current = pag.current
  signupPagination.pageSize = pag.pageSize
  loadSignups()
}

const handleApproveSignup = (id) => {
  approveSignup(
      { signupId: id },
      {
        onSuccess: () => {
          message.success('审核通过')
          loadSignups()
        },
        successMsg: false
      }
  )
}

const handleRejectSignup = (id) => {
  rejectSignup(
      { signupId: id },
      {
        onSuccess: () => {
          message.success('已拒绝')
          loadSignups()
        },
        successMsg: false
      }
  )
}

const handleCheckIn = (id) => {
  checkInSignup(
      { signupId: id },
      {
        onSuccess: () => {
          message.success('签到成功')
          loadSignups()
        },
        successMsg: false
      }
  )
}

const getStatusColor = (status) => {
  const colors = { 0: 'default', 1: 'blue', 2: 'green', 3: 'gray' }
  return colors[status] || 'default'
}

const getSignupStatusColor = (status) => {
  const colors = { 0: 'orange', 1: 'green', 2: 'red', 3: 'blue' }
  return colors[status] || 'default'
}

const formatDate = (dateStr) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm') : '-'
}

const getFullImagePath = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? path : '/' + path
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
$user-accent: #42664f;
$user-black: #111111;
$user-muted: #6b6b6b;
$user-border: #e8e8e8;
$user-bg: #fafafa;
$user-white: #ffffff;

.activity-management {
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

.page-top__actions {
  display: flex;
  align-items: center;
  gap: 12px;
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

/* —— 列顺序调节 —— */
.column-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
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
  background: $user-white;
  border: 1px solid $user-black;
  cursor: grab;
  user-select: none;

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
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid $user-border !important;
    padding: 12px 14px !important;
    font-size: 13px;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: $user-bg !important;
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

/* —— 封面图 —— */
.cover-wrap {
  .cover-img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border: 1px solid $user-border;
    display: block;
  }

  .cover-empty {
    width: 48px;
    height: 48px;
    background: $user-bg;
    border: 1px dashed $user-border;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $user-muted;
    font-size: 14px;
  }
}

/* —— 状态 —— */
.cell-status {
  font-size: 12px;
  font-weight: 500;

  &--0 {
    color: $user-muted;
  }

  &--1 {
    color: $user-accent;
  }

  &--2 {
    color: $user-black;
  }

  &--3 {
    color: $user-muted;
  }

  &.signup-status-0 {
    color: #c29147;
  }

  &.signup-status-1 {
    color: $user-accent;
  }

  &.signup-status-2 {
    color: $user-black;
  }
}

/* —— 时间单元格 —— */
.time-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .time-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $user-black;

    .time-label {
      display: inline-block;
      width: 28px;
      font-size: 11px;
      color: $user-muted;
      font-weight: 500;
      background: $user-bg;
      padding: 1px 3px;
      text-align: center;
    }
  }
}

/* —— 操作单元格 —— */
.action-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-sep {
  color: $user-border;
  font-size: 11px;
  user-select: none;
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

  &--danger {
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
    background: darken($user-accent, 6%) !important;
    border-color: darken($user-accent, 6%) !important;
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

/* —— 表单弹窗 —— */
.modal-body {
  padding: 8px 0;
}

.minimal-form :deep(.ant-form-item-label > label) {
  font-size: 12px;
  color: $user-muted !important;
}

.minimal-form :deep(.ant-input),
.minimal-form :deep(.ant-select-selector) {
  border-radius: 0 !important;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: $user-muted;

  i { font-size: 22px; color: $user-accent; }
  span { font-size: 12px; }
}

.upload-hint {
  font-size: 12px;
  color: $user-muted;
  margin-top: 6px;
  line-height: 1.5;
}
</style>

<style lang="scss">
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

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
      background: darken($accent, 6%) !important;
      border-color: darken($accent, 6%) !important;
    }
  }
}
</style>