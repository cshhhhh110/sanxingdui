<template>
  <div class="activity-management">
    <!-- 顶部装饰条 -->
    <div class="top-stripe"></div>

    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div class="header-text">
          <span class="header-label">MANAGEMENT</span>
          <h2>活动管理</h2>
        </div>
      </div>
      <a-button class="btn-create" @click="showCreateModal">
        <template #icon>
          <i class="fas fa-plus"></i>
        </template>
        新增活动
      </a-button>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <div class="search-title">
        <i class="fas fa-filter"></i>
        筛选条件
      </div>
      <a-form :model="searchForm" layout="inline" class="search-form">
        <a-form-item label="标题">
          <a-input
              v-model:value="searchForm.title"
              placeholder="请输入活动标题"
              allow-clear
              style="width: 200px"
              class="custom-input"
          />
        </a-form-item>

        <a-form-item label="类型">
          <a-select
              v-model:value="searchForm.type"
              placeholder="请选择类型"
              allow-clear
              style="width: 150px"
              class="custom-select"
          >
            <a-select-option value="体验">体验</a-select-option>
            <a-select-option value="展览">展览</a-select-option>
            <a-select-option value="培训">培训</a-select-option>
            <a-select-option value="比赛">比赛</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="状态">
          <a-select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              allow-clear
              style="width: 120px"
              class="custom-select"
          >
            <a-select-option :value="0">草稿</a-select-option>
            <a-select-option :value="1">报名中</a-select-option>
            <a-select-option :value="2">进行中</a-select-option>
            <a-select-option :value="3">已结束</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button class="btn-search" @click="handleSearch">
              <template #icon>
                <i class="fas fa-search"></i>
              </template>
              搜索
            </a-button>
            <a-button class="btn-reset" @click="handleReset">
              <template #icon>
                <i class="fas fa-redo"></i>
              </template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <div class="table-header-bar">
        <span class="table-count">
          共 <em>{{ pagination.total }}</em> 条活动记录
        </span>
      </div>
      <a-table
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
          class="custom-table"
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
              <div v-else class="cover-empty">
                <i class="fas fa-image"></i>
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <span :class="['status-badge', `status-${record.status}`]">
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
            <div class="action-cell">
              <button class="act-btn act-signup" @click="handleViewSignups(record)">
                <i class="fas fa-users"></i> 报名管理
              </button>
              <button class="act-btn act-edit" @click="handleEdit(record)">
                <i class="fas fa-pen"></i> 编辑
              </button>
              <a-popconfirm
                  title="确定要删除此活动吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(record.id)"
              >
                <button class="act-btn act-delete">
                  <i class="fas fa-trash-alt"></i> 删除
                </button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 创建/编辑活动弹窗 -->
    <a-modal
        v-model:open="isModalVisible"
        :title="modalTitle"
        width="800px"
        class="custom-modal"
        @ok="handleModalOk"
        @cancel="handleModalCancel"
    >
      <div class="modal-body">
        <a-form
            :model="formData"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            class="custom-form"
        >
          <a-form-item label="活动标题" required>
            <a-input v-model:value="formData.title" placeholder="请输入活动标题" class="custom-input" />
          </a-form-item>

          <a-form-item label="活动类型" required>
            <a-select v-model:value="formData.type" placeholder="请选择活动类型" class="custom-select">
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
                class="custom-picker"
            />
          </a-form-item>

          <a-form-item label="活动地点">
            <a-input v-model:value="formData.location" placeholder="请输入活动地点" class="custom-input" />
          </a-form-item>

          <a-form-item label="活动描述">
            <a-textarea
                v-model:value="formData.description"
                placeholder="请输入活动描述"
                :rows="4"
                class="custom-textarea"
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
                class="custom-upload"
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
            <a-select v-model:value="formData.status" placeholder="请选择状态" class="custom-select">
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
        class="custom-modal"
    >
      <a-table
          :columns="signupColumns"
          :data-source="signupData"
          :loading="signupLoading"
          :pagination="signupPagination"
          @change="handleSignupTableChange"
          row-key="id"
          class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <span :class="['status-badge', `signup-status-${record.status}`]">
              {{ record.statusName }}
            </span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-cell">
              <button
                  v-if="record.status === 0"
                  class="act-btn act-signup"
                  @click="handleApproveSignup(record.id)"
              >
                <i class="fas fa-check"></i> 通过
              </button>
              <button
                  v-if="record.status === 0"
                  class="act-btn act-delete"
                  @click="handleRejectSignup(record.id)"
              >
                <i class="fas fa-times"></i> 拒绝
              </button>
              <button
                  v-if="record.status === 1"
                  class="act-btn act-edit"
                  @click="handleCheckIn(record.id)"
              >
                <i class="fas fa-clipboard-check"></i> 签到
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
const columns = [
  { title: '活动ID', dataIndex: 'id', key: 'id', width: 180 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '封面', key: 'coverFileId', width: 100 },
  { title: '活动时间', key: 'time', width: 180 },
  { title: '地点', dataIndex: 'location', key: 'location' },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', fixed: 'right', width: 240 }
]

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

<style scoped lang="less">
// ── 设计 Token ──────────────────────────────────────────────
@primary:        #42664f;
@primary-light:  #5a8a6a;
@primary-dark:   #2e4a38;
@primary-bg:     #fafafa;
@primary-muted:  #e5e5e5;
@surface:        #ffffff;
@border:         #e5e5e5;
@text-main:      #111;
@text-sub:       #666;
@text-hint:      #999;
@radius-lg:      8px;
@radius-md:      6px;
@radius-sm:      4px;
@shadow-card:    0 2px 12px rgba(66, 102, 79, 0.08);
@shadow-hover:   0 6px 24px rgba(66, 102, 79, 0.14);

// ── 全局容器 ────────────────────────────────────────────────
.activity-management {
  min-height: 100vh;
  background: @primary-bg;
  padding: 32px 36px 48px;
  font-family: var(--font-body, 'PingFang SC', sans-serif);
}

// ── 顶部装饰条 ──────────────────────────────────────────────
.top-stripe {
  display: none;
}

// ── 页面标题栏 ──────────────────────────────────────────────
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px;
  background: transparent;
  border-bottom: 1px solid rgba(66,102,79,0.1);
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .header-icon {
    display: none;
  }

  .header-text {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 10px;

    .header-label {
      display: none;
    }

    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: @text-main;
      letter-spacing: 1px;
    }
  }

  .header-text::before {
    content: '';
    width: 3px;
    height: 20px;
    background: @primary;
    border-radius: 0;
    flex-shrink: 0;
  }

  .btn-create {
    height: 40px;
    padding: 0 22px;
    background: @primary;
    border: none;
    border-radius: @radius-md;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 3px 10px rgba(66, 102, 79, 0.3);

    &:hover {
      background: @primary-light;
      box-shadow: 0 5px 16px rgba(66, 102, 79, 0.4);
      transform: translateY(-1px);
    }

    i { font-size: 13px; }
  }
}

// ── 搜索区域 ────────────────────────────────────────────────
.search-section {
  margin: 0 0 20px;
  padding: 18px 22px;
  background: @surface;
  border-radius: @radius-lg;
  border: 1px solid @border;
}

// ── 自定义按钮 ──────────────────────────────────────────────
.btn-search {
  height: 34px;
  padding: 0 18px;
  background: @primary;
  border: none;
  border-radius: @radius-sm;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover { background: @primary-light; }
  i { font-size: 12px; }
}

.btn-reset {
  height: 34px;
  padding: 0 18px;
  background: transparent;
  border: 1.5px solid @border;
  border-radius: @radius-sm;
  color: @text-sub;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    border-color: @primary;
    color: @primary;
  }
  i { font-size: 12px; }
}

// ── 表格区域 ────────────────────────────────────────────────
.table-section {
  margin: 0;
  padding: 0;
  background: @surface;
  border-radius: @radius-lg;
  border: 1px solid @border;
  overflow: hidden;

  .table-header-bar {
    padding: 14px 24px;
    border-bottom: 1px solid @border;
    background: #fafafa;

    .table-count {
      font-size: 13px;
      color: @text-sub;
      font-weight: 500;
      em { font-style: normal; font-weight: 700; color: @primary; }
    }
  }
}

// ── 封面图 ──────────────────────────────────────────────────
.cover-wrap {
  .cover-img {
    width: 58px;
    height: 58px;
    object-fit: cover;
    border-radius: @radius-sm;
    border: 2px solid @primary-muted;
    display: block;
  }

  .cover-empty {
    width: 58px;
    height: 58px;
    border-radius: @radius-sm;
    background: @primary-bg;
    border: 2px dashed @primary-muted;
    display: flex;
    align-items: center;
    justify-content: center;
    color: @text-hint;
    font-size: 18px;
  }
}

// ── 状态徽章 ────────────────────────────────────────────────
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;

  &.status-0 {
    background: #f5f5f5;
    color: #888;
    border: 1px solid #e0e0e0;
  }
  &.status-1 {
    background: #e8f4fd;
    color: #1a7fc1;
    border: 1px solid #b8d9f0;
  }
  &.status-2 {
    background: #edf7f0;
    color: @primary;
    border: 1px solid @primary-muted;
  }
  &.status-3 {
    background: #f5f5f5;
    color: #aaa;
    border: 1px solid #e0e0e0;
  }

  // 报名状态
  &.signup-status-0 {
    background: #fff8e8;
    color: #c8860a;
    border: 1px solid #f8dfa0;
  }
  &.signup-status-1 {
    background: #edf7f0;
    color: @primary;
    border: 1px solid @primary-muted;
  }
  &.signup-status-2 {
    background: #fef0f0;
    color: #d94040;
    border: 1px solid #f5b8b8;
  }
  &.signup-status-3 {
    background: #e8f4fd;
    color: #1a7fc1;
    border: 1px solid #b8d9f0;
  }
}

// ── 时间单元格 ──────────────────────────────────────────────
.time-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .time-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: @text-main;

    .time-label {
      display: inline-block;
      width: 28px;
      font-size: 11px;
      color: @text-hint;
      font-weight: 600;
      background: @primary-bg;
      border-radius: 3px;
      padding: 1px 3px;
      text-align: center;
    }
  }
}

// ── 操作按钮组 ──────────────────────────────────────────────
.action-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.act-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: @radius-sm;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1.5px solid;
  transition: all 0.18s ease;
  white-space: nowrap;

  i { font-size: 11px; }

  &.act-signup {
    background: #edf7f0;
    border-color: @primary-muted;
    color: @primary;
    &:hover {
      background: @primary;
      color: #fff;
      border-color: @primary;
    }
  }

  &.act-edit {
    background: #e8f4fd;
    border-color: #b8d9f0;
    color: #1a7fc1;
    &:hover {
      background: #1a7fc1;
      color: #fff;
      border-color: #1a7fc1;
    }
  }

  &.act-delete {
    background: #fef0f0;
    border-color: #f5b8b8;
    color: #d94040;
    &:hover {
      background: #d94040;
      color: #fff;
      border-color: #d94040;
    }
  }
}

// ── 表单 Modal ──────────────────────────────────────────────
.modal-body {
  padding: 8px 0;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: @text-hint;

  i { font-size: 22px; color: @primary-muted; }
  span { font-size: 12px; }
}

.upload-hint {
  font-size: 12px;
  color: @text-hint;
  margin-top: 6px;
  line-height: 1.5;
}

// ── Ant Design 组件覆写 ─────────────────────────────────────
:deep(.ant-table) {
  font-size: 13px;

  .ant-table-thead > tr > th {
    background: #fafafa;
    color: @text-sub;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e9eee9;
    text-transform: uppercase;
    padding: 12px 16px;
  }

  .ant-table-tbody > tr > td {
    padding: 12px 16px;
    border-bottom: 1px solid #f2f4f2;
    color: @text-main;
    vertical-align: middle;
    font-size: 13px;
  }

  .ant-table-tbody > tr:hover > td {
    background: #fafafa;
  }
}

:deep(.ant-input),
:deep(.ant-input-affix-wrapper),
:deep(.ant-picker),
:deep(.ant-select:not(.ant-select-customize-input) .ant-select-selector) {
  border-color: @border !important;
  border-radius: @radius-sm !important;
  font-size: 13px;

  &:focus,
  &:hover {
    border-color: @primary !important;
    box-shadow: 0 0 0 2px rgba(66, 102, 79, 0.1) !important;
  }
}

:deep(.ant-btn-primary) {
  background: @primary;
  border-color: @primary;
  border-radius: @radius-sm;

  &:hover {
    background: @primary-light;
    border-color: @primary-light;
  }
}

:deep(.ant-modal-header) {
  border-bottom: 2px solid @primary-muted;
  padding: 16px 24px;

  .ant-modal-title {
    font-size: 16px;
    font-weight: 700;
    color: @text-main;
  }
}

:deep(.ant-modal-footer) {
  border-top: 1px solid @border;
  padding: 12px 24px;

  .ant-btn-primary {
    background: @primary;
    border-color: @primary;
  }
}

:deep(.ant-upload.ant-upload-select-picture-card) {
  border: 2px dashed @primary-muted;
  border-radius: @radius-md;
  background: @primary-bg;

  &:hover {
    border-color: @primary;
  }
}

:deep(.ant-form-item-label > label) {
  color: @text-sub;
  font-weight: 600;
  font-size: 13px;
}

:deep(.ant-pagination-item-active) {
  border-color: @primary;
  a { color: @primary; }
}

:deep(.ant-pagination-item:hover) {
  border-color: @primary;
  a { color: @primary; }
}
</style>