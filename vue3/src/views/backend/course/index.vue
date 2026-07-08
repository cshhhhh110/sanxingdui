<template>
  <div class="course-page">
    <header class="page-top">
      <div class="page-top__main">
        <h1 class="page-top__title">课程管理</h1>
      </div>
      <a-button type="primary" class="btn-primary" @click="showCreateModal">
        新增课程
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
        v-model:value="searchForm.level"
        placeholder="难度"
        allow-clear
        class="filter-select"
      >
        <a-select-option
            v-for="option in COURSE_LEVEL_OPTIONS"
            :key="option.value"
            :value="option.value"
        >
          {{ option.label }}
        </a-select-option>
      </a-select>
      <a-select
        v-model:value="searchForm.status"
        placeholder="状态"
        allow-clear
        class="filter-select"
      >
        <a-select-option :value="0">草稿</a-select-option>
        <a-select-option :value="1">已发布</a-select-option>
        <a-select-option :value="2">下架</a-select-option>
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
          row-key="id"
          :scroll="{ x: tableScrollX }"
          size="middle"
          class="minimal-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <button type="button" class="cell-link cell-link--title" @click="handleEdit(record)">
              {{ record.title }}
            </button>
          </template>

          <template v-else-if="column.key === 'level'">
            <span class="cell-tag">{{ getCourseLevelName(record.level) || '—' }}</span>
          </template>

          <template v-else-if="column.key === 'chapterCount'">
            <span class="cell-mono">{{ record.chapterCount || 0 }}</span>
          </template>

          <template v-else-if="column.key === 'coverFileId'">
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

          <template v-else-if="column.key === 'createTime'">
            <span class="cell-mono">{{ formatDate(record.createTime) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-group">
              <button type="button" class="cell-link" @click="handleViewChapters(record)">章节管理</button>
              <span class="action-sep">|</span>
              <button type="button" class="cell-link" @click="handleEdit(record)">编辑</button>
              <span class="action-sep">|</span>
              <a-popconfirm
                  title="确定要删除此课程吗？"
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

    <!-- 创建/编辑课程弹窗 -->
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
          <a-form-item label="课程标题" required>
            <a-input v-model:value="formData.title" placeholder="请输入课程标题" />
          </a-form-item>

          <a-form-item label="难度等级">
            <a-select v-model:value="formData.level" placeholder="请选择难度等级">
              <a-select-option
                  v-for="option in COURSE_LEVEL_OPTIONS"
                  :key="option.value"
                  :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="课程描述">
            <a-textarea
                v-model:value="formData.description"
                placeholder="请输入课程描述"
                :rows="4"
            />
          </a-form-item>

          <a-form-item label="课程封面">
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

          <a-form-item label="课程状态">
            <a-select v-model:value="formData.status" placeholder="请选择状态">
              <a-select-option :value="0">草稿</a-select-option>
              <a-select-option :value="1">已发布</a-select-option>
              <a-select-option :value="2">下架</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 章节管理弹窗 -->
    <a-modal
        v-model:open="isChapterModalVisible"
        title="章节管理"
        width="1000px"
        :footer="null"
        class="minimal-modal"
    >
      <div class="chapter-header">
        <span class="chapter-course-name">{{ currentCourse?.title }}</span>
        <button type="button" class="btn-primary" @click="showAddChapterModal">
          添加章节
        </button>
      </div>

      <a-table
          :columns="chapterColumns"
          :data-source="chapterData"
          :loading="chapterLoading"
          :pagination="false"
          row-key="id"
          size="middle"
          class="minimal-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'videoFileId'">
            <span
                v-if="record.videoFiles && record.videoFiles.length > 0"
                class="video-count"
            >
              {{ record.videoFiles.length }} 个视频
            </span>
            <span v-else class="video-empty">无视频</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-group">
              <button type="button" class="cell-link" @click="handleEditChapter(record)">编辑</button>
              <span class="action-sep">|</span>
              <a-popconfirm
                  title="确定要删除此章节吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDeleteChapter(record.id)"
              >
                <button type="button" class="cell-link cell-link--danger">删除</button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </a-modal>

    <!-- 添加/编辑章节弹窗 -->
    <a-modal
        v-model:open="isChapterFormVisible"
        :title="chapterFormTitle"
        width="700px"
        class="minimal-modal"
        @ok="handleChapterFormOk"
        @cancel="handleChapterFormCancel"
    >
      <div class="modal-body">
        <a-form
            :model="chapterFormData"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            class="minimal-form"
        >
          <a-form-item label="章节标题" required>
            <a-input v-model:value="chapterFormData.title" placeholder="请输入章节标题" />
          </a-form-item>

          <a-form-item label="排序" required>
            <a-input-number
                v-model:value="chapterFormData.sort"
                :min="1"
                placeholder="请输入排序号"
                style="width: 100%"
            />
          </a-form-item>

          <a-form-item label="章节内容">
            <a-textarea
                v-model:value="chapterFormData.content"
                placeholder="请输入章节内容"
                :rows="6"
            />
          </a-form-item>

          <a-form-item label="章节视频">
            <a-upload
                :file-list="videoFileList"
                :before-upload="handleVideoBeforeUpload"
                @remove="handleRemoveVideo"
                accept="video/*"
                :max-count="5"
                list-type="picture-card"
                :show-upload-list="{ showPreviewIcon: false }"
            >
              <div v-if="videoFileList.length < 5" class="upload-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>上传视频</span>
              </div>
            </a-upload>
            <div class="upload-hint">
              支持MP4、AVI、MOV等格式，单个文件不超过500MB
            </div>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { generateUUID } from '@/composables/useBusinessUUID'
import {
  getCoursePage,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseChapters,
  createChapter,
  updateChapter,
  deleteChapter
} from '@/api/CourseApi'
import { uploadBusinessFile, deleteFile } from '@/api/FileApi'
import { COURSE_LEVEL_OPTIONS, getCourseLevelName } from '@/config/courseLevel'

// 搜索表单
const searchForm = reactive({
  title: '',
  level: undefined,
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
const COLUMN_STORAGE_KEY = 'backend-course-column-order'

const COLUMN_DEF_MAP = {
  id: { title: '课程ID', dataIndex: 'id', key: 'id', width: 180 },
  title: { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
  level: { title: '难度', key: 'level', width: 90 },
  coverFileId: { title: '封面', key: 'coverFileId', width: 80, align: 'center' },
  chapterCount: { title: '章节数', dataIndex: 'chapterCount', key: 'chapterCount', width: 80, align: 'center' },
  status: { title: '状态', key: 'status', width: 90, align: 'center' },
  createTime: { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 168 }
}

const DEFAULT_COLUMN_ORDER = ['id', 'title', 'level', 'coverFileId', 'chapterCount', 'status', 'createTime']

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

// 课程弹窗相关
const isModalVisible = ref(false)
const modalTitle = ref('新增课程')
const isEdit = ref(false)
const formData = reactive({
  id: '',
  title: '',
  level: '',
  description: '',
  status: 0,
  coverFileId: null
})

// 封面上传相关
const coverFileList = ref([])
const uploadingCover = ref(false)

// 章节管理相关
const isChapterModalVisible = ref(false)
const currentCourse = ref(null)
const chapterData = ref([])
const chapterLoading = ref(false)

const chapterColumns = [
  { title: '章节ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '视频', key: 'videoFileId', width: 120 },
  { title: '操作', key: 'action', width: 160 }
]

// 章节表单
const isChapterFormVisible = ref(false)
const chapterFormTitle = ref('添加章节')
const isChapterEdit = ref(false)
const chapterFormData = reactive({
  id: null,
  courseId: '',
  title: '',
  content: '',
  sort: 1
})

// 视频文件列表
const videoFileList = ref([])
const uploadingVideo = ref(false)

// 加载课程数据
const loadData = () => {
  loading.value = true
  getCoursePage(
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
  searchForm.level = undefined
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
  modalTitle.value = '新增课程'
  resetForm()
  isModalVisible.value = true
}

const handleEdit = (record) => {
  isEdit.value = true
  modalTitle.value = '编辑课程'
  Object.assign(formData, record)
  loadCourseCover(record)
  isModalVisible.value = true
}

const handleModalOk = () => {
  if (!formData.title) {
    message.error('请填写课程标题')
    return
  }

  if (isEdit.value) {
    updateCourse(
        { courseId: formData.id, ...formData },
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
    createCourse(
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
  formData.level = ''
  formData.description = ''
  formData.status = 0
  formData.coverFileId = null
  coverFileList.value = []
}

const loadCourseCover = (course) => {
  coverFileList.value = []
  if (course.coverFileId) {
    coverFileList.value = [{
      uid: course.coverFileId,
      name: '课程封面',
      status: 'done',
      url: course.coverFilePath || '',
      fileId: course.coverFileId
    }]
  }
}

const handleCoverBeforeUpload = async (file) => {
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) { message.error('封面文件大小不能超过 5MB!'); return false }
  const isImage = file.type.startsWith('image/')
  if (!isImage) { message.error('只能上传图片文件!'); return false }
  try {
    uploadingCover.value = true
    const tempFileId = Date.now()
    coverFileList.value = [{ uid: tempFileId, name: file.name, status: 'uploading', percent: 0 }]
    if (!formData.id) { formData.id = generateUUID() }
    await uploadBusinessFile(
        file,
        { businessType: 'COURSE', businessId: formData.id, businessField: 'cover' },
        false,
        {
          onSuccess: (data) => {
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
        resolve(true)
      }
    } catch (err) {
      console.error('删除封面异常:', err)
      message.error('删除失败')
      reject(false)
    }
  })
}

const handleDelete = (id) => {
  deleteCourse(
      { courseId: id },
      {
        onSuccess: () => {
          message.success('删除成功')
          loadData()
        },
        successMsg: false
      }
  )
}

const handleViewChapters = (record) => {
  currentCourse.value = record
  isChapterModalVisible.value = true
  loadChapters()
}

const loadChapters = () => {
  chapterLoading.value = true
  getCourseChapters(
      { courseId: currentCourse.value.id },
      {
        onSuccess: (data) => {
          chapterData.value = data || []
          chapterLoading.value = false
        },
        onError: () => {
          chapterLoading.value = false
        }
      }
  )
}

const showAddChapterModal = () => {
  isChapterEdit.value = false
  chapterFormTitle.value = '添加章节'
  resetChapterForm()
  chapterFormData.courseId = currentCourse.value.id
  isChapterFormVisible.value = true
}

const handleEditChapter = (record) => {
  isChapterEdit.value = true
  chapterFormTitle.value = '编辑章节'
  Object.assign(chapterFormData, record)
  loadChapterVideos(record)
  isChapterFormVisible.value = true
}

const handleChapterFormOk = () => {
  if (!chapterFormData.title || !chapterFormData.sort) {
    message.error('请填写必填项')
    return
  }

  if (chapterFormData.id) {
    if (isChapterEdit.value) {
      updateChapter(
          { chapterId: chapterFormData.id, ...chapterFormData },
          {
            onSuccess: () => {
              message.success('更新成功')
              isChapterFormVisible.value = false
              loadChapters()
            },
            successMsg: false
          }
      )
    } else {
      message.success('章节创建成功')
      isChapterFormVisible.value = false
      loadChapters()
    }
  } else {
    createChapter(
        chapterFormData,
        {
          onSuccess: () => {
            message.success('创建成功')
            isChapterFormVisible.value = false
            loadChapters()
          },
          successMsg: false
        }
    )
  }
}

const handleChapterFormCancel = () => {
  isChapterFormVisible.value = false
  resetChapterForm()
}

const resetChapterForm = () => {
  chapterFormData.id = null
  chapterFormData.courseId = ''
  chapterFormData.title = ''
  chapterFormData.content = ''
  chapterFormData.sort = 1
  videoFileList.value = []
}

const handleDeleteChapter = (id) => {
  deleteChapter(
      { chapterId: id },
      {
        onSuccess: () => {
          message.success('删除成功')
          loadChapters()
        },
        successMsg: false
      }
  )
}

const loadChapterVideos = (chapter) => {
  videoFileList.value = []
  if (chapter.videoFiles && Array.isArray(chapter.videoFiles)) {
    videoFileList.value = chapter.videoFiles.map(video => ({
      uid: video.id,
      name: video.originalName || '视频文件',
      status: 'done',
      url: video.filePath,
      fileId: video.id
    }))
  }
}

const handleVideoBeforeUpload = async (file) => {
  const isLt500M = file.size / 1024 / 1024 < 500
  if (!isLt500M) {
    message.error('视频文件大小不能超过 500MB!')
    return false
  }

  const isVideo = file.type.startsWith('video/')
  if (!isVideo) {
    message.error('只能上传视频文件!')
    return false
  }

  try {
    uploadingVideo.value = true
    const tempFileId = Date.now()

    videoFileList.value.push({
      uid: tempFileId,
      name: file.name,
      status: 'uploading',
      percent: 0
    })

    if (!chapterFormData.id) {
      if (!chapterFormData.title || !chapterFormData.sort) {
        message.error('请先填写章节标题和排序号')
        const index = videoFileList.value.findIndex(item => item.uid === tempFileId)
        if (index > -1) { videoFileList.value.splice(index, 1) }
        uploadingVideo.value = false
        return false
      }

      await new Promise((resolve, reject) => {
        createChapter(
            {
              courseId: chapterFormData.courseId,
              title: chapterFormData.title,
              content: chapterFormData.content,
              sort: chapterFormData.sort
            },
            {
              onSuccess: (data) => {
                chapterFormData.id = data.id
                message.success('章节创建成功，正在上传视频...')
                resolve()
              },
              onError: (error) => {
                message.error('章节创建失败')
                const index = videoFileList.value.findIndex(item => item.uid === tempFileId)
                if (index > -1) { videoFileList.value.splice(index, 1) }
                reject(error)
              },
              successMsg: false
            }
        )
      })
    }

    await uploadBusinessFile(
        file,
        {
          businessType: 'COURSE_CHAPTER',
          businessId: String(chapterFormData.id),
          businessField: 'video'
        },
        false,
        {
          onSuccess: (data) => {
            const index = videoFileList.value.findIndex(item => item.uid === tempFileId)
            if (index > -1) { videoFileList.value.splice(index, 1) }
            videoFileList.value.push({
              uid: data.id,
              name: data.originalName || file.name,
              status: 'done',
              url: data.filePath,
              fileId: data.id
            })
            message.success('视频上传成功')
            uploadingVideo.value = false
          },
          onError: () => {
            const index = videoFileList.value.findIndex(item => item.uid === tempFileId)
            if (index > -1) {
              videoFileList.value[index].status = 'error'
              setTimeout(() => {
                const idx = videoFileList.value.findIndex(item => item.uid === tempFileId)
                if (idx > -1) { videoFileList.value.splice(idx, 1) }
              }, 2000)
            }
            message.error('视频上传失败')
            uploadingVideo.value = false
          },
          successMsg: false
        }
    )
  } catch (error) {
    console.error('上传失败:', error)
    uploadingVideo.value = false
  }

  return false
}

const handleRemoveVideo = async (file) => {
  try {
    await deleteFile(
        { fileId: file.fileId },
        {
          onSuccess: () => {
            const index = videoFileList.value.findIndex(item => item.uid === file.uid)
            if (index > -1) { videoFileList.value.splice(index, 1) }
            message.success('视频删除成功')
          },
          onError: () => {
            message.error('删除失败')
          },
          successMsg: false
        }
    )
  } catch (error) {
    console.error('删除视频异常:', error)
    message.error('删除失败')
  }
  return false
}

const getFullImagePath = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? path : '/' + path
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

.course-page {
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

.filter-input {
  width: 140px;

  &--wide {
    width: 180px;
  }
}

.filter-select {
  width: 120px;
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
  color: $accent;
  border-color: $accent;
  background: rgba($accent, 0.08);
}

.cell-status {
  font-size: 12px;
  font-weight: 500;

  &--0 { color: $muted; }
  &--1 { color: $accent; }
  &--2 { color: $black; }
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

  &--danger {
    color: $black;
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

.cover-wrap {
  .cover-img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border: 1px solid $border;
    display: block;
  }

  .cover-empty {
    width: 48px;
    height: 48px;
    background: $bg;
    border: 1px dashed $border;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $muted;
    font-size: 14px;
  }
}

.video-count {
  font-size: 12px;
  color: $accent;
}

.video-empty {
  font-size: 12px;
  color: $muted;
}

.chapter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: $bg;
  border: 1px solid $border;
}

.chapter-course-name {
  font-size: 14px;
  font-weight: 600;
  color: $black;
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
  font-size: 13px !important;
  box-shadow: none !important;

  &:hover {
    border-color: $accent !important;
    color: $accent !important;
  }
}

.filter-input :deep(.ant-input),
.filter-select :deep(.ant-select-selector) {
  border-radius: 0 !important;
  border-color: $border !important;
}

.filter-input :deep(.ant-input:focus),
.filter-input :deep(.ant-input-affix-wrapper-focused),
.filter-select.ant-select-focused :deep(.ant-select-selector) {
  border-color: $accent !important;
  box-shadow: none !important;
}

.minimal-form :deep(.ant-form-item-label > label) {
  font-size: 12px;
  color: $muted !important;
}

.minimal-form :deep(.ant-input),
.minimal-form :deep(.ant-select-selector) {
  border-radius: 0 !important;
}

.modal-body {
  padding: 8px 0;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: $muted;

  i { font-size: 22px; color: $accent; }
  span { font-size: 12px; }
}

.upload-hint {
  font-size: 12px;
  color: $muted;
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
      background: color.adjust($accent, $lightness: -6%) !important;
      border-color: color.adjust($accent, $lightness: -6%) !important;
    }
  }
}
</style>
