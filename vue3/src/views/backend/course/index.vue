<template>
  <div class="course-management">
    <!-- 顶部装饰条 -->
    <div class="top-stripe"></div>

    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <i class="fas fa-book-open"></i>
        </div>
        <div class="header-text">
          <span class="header-label">MANAGEMENT</span>
          <h2>课程管理</h2>
        </div>
      </div>
      <a-button class="btn-create" @click="showCreateModal">
        <template #icon>
          <i class="fas fa-plus"></i>
        </template>
        新增课程
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
              placeholder="请输入课程标题"
              allow-clear
              style="width: 200px"
          />
        </a-form-item>

        <a-form-item label="难度">
          <a-select
              v-model:value="searchForm.level"
              placeholder="请选择难度"
              allow-clear
              style="width: 150px"
          >
            <a-select-option
                v-for="option in COURSE_LEVEL_OPTIONS"
                :key="option.value"
                :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="状态">
          <a-select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              allow-clear
              style="width: 120px"
          >
            <a-select-option :value="0">草稿</a-select-option>
            <a-select-option :value="1">已发布</a-select-option>
            <a-select-option :value="2">下架</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-space>
            <button class="btn-search" @click="handleSearch">
              <i class="fas fa-search"></i> 搜索
            </button>
            <button class="btn-reset" @click="handleReset">
              <i class="fas fa-redo"></i> 重置
            </button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <div class="table-header-bar">
        <span class="table-count">
          共 <em>{{ pagination.total }}</em> 条课程记录
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

          <template v-else-if="column.key === 'action'">
            <div class="action-cell">
              <button class="act-btn act-chapter" @click="handleViewChapters(record)">
                <i class="fas fa-list-ul"></i> 章节管理
              </button>
              <button class="act-btn act-edit" @click="handleEdit(record)">
                <i class="fas fa-pen"></i> 编辑
              </button>
              <a-popconfirm
                  title="确定要删除此课程吗？"
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

    <!-- 创建/编辑课程弹窗 -->
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
        class="custom-modal"
    >
      <div class="chapter-header">
        <div class="chapter-header-left">
          <div class="chapter-course-tag">
            <i class="fas fa-book"></i>
          </div>
          <div>
            <div class="chapter-label">当前课程</div>
            <div class="chapter-course-name">{{ currentCourse?.title }}</div>
          </div>
        </div>
        <button class="btn-add-chapter" @click="showAddChapterModal">
          <i class="fas fa-plus"></i> 添加章节
        </button>
      </div>

      <a-table
          :columns="chapterColumns"
          :data-source="chapterData"
          :loading="chapterLoading"
          :pagination="false"
          row-key="id"
          class="custom-table chapter-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'videoFileId'">
            <span
                v-if="record.videoFiles && record.videoFiles.length > 0"
                class="video-badge has-video"
            >
              <i class="fas fa-film"></i> {{ record.videoFiles.length }} 个视频
            </span>
            <span v-else class="video-badge no-video">
              <i class="fas fa-file-alt"></i> 无视频
            </span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-cell">
              <button class="act-btn act-edit" @click="handleEditChapter(record)">
                <i class="fas fa-pen"></i> 编辑
              </button>
              <a-popconfirm
                  title="确定要删除此章节吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDeleteChapter(record.id)"
              >
                <button class="act-btn act-delete">
                  <i class="fas fa-trash-alt"></i> 删除
                </button>
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
        class="custom-modal"
        @ok="handleChapterFormOk"
        @cancel="handleChapterFormCancel"
    >
      <div class="modal-body">
        <a-form
            :model="chapterFormData"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            class="custom-form"
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
import { ref, reactive, onMounted } from 'vue'
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
const columns = [
  { title: '课程ID', dataIndex: 'id', key: 'id', width: 180 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  {
    title: '难度等级',
    key: 'level',
    width: 100,
    customRender: ({ record }) => getCourseLevelName(record.level)
  },
  { title: '封面', key: 'coverFileId', width: 100 },
  { title: '章节数', dataIndex: 'chapterCount', key: 'chapterCount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 240 }
]

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

const getStatusColor = (status) => {
  const colors = { 0: 'default', 1: 'green', 2: 'gray' }
  return colors[status] || 'default'
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
@text-main:      #1a2e22;
@text-sub:       #6b8270;
@text-hint:      #a5b8ab;
@radius-lg:      12px;
@radius-md:      8px;
@radius-sm:      6px;
@shadow-card:    0 2px 12px rgba(66, 102, 79, 0.08);

// ── 全局容器 ────────────────────────────────────────────────
.course-management {
  min-height: 100vh;
  background: @primary-bg;
  padding: 32px 36px 48px;
  font-family: var(--font-body, 'PingFang SC', sans-serif);
}

// ── 顶部装饰条 ──────────────────────────────────────────────
.top-stripe { display: none; }

// ── 页面标题栏 ──────────────────────────────────────────────
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px;
  background: transparent;
  border-bottom: 1px solid rgba(66,102,79,0.1);
  margin-bottom: 24px;

  .header-left { display: flex; align-items: baseline; gap: 12px; }
  .header-icon { display: none; }

  .header-text {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 10px;

    .header-label { display: none; }

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
    width: 3px; height: 20px;
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

  &:hover { border-color: @primary; color: @primary; }
  i { font-size: 12px; }
}

// ── 表格区域 ────────────────────────────────────────────────
.table-section {
  margin: 0 32px;
  background: @surface;
  border-radius: @radius-lg;
  border: 1px solid @border;
  box-shadow: @shadow-card;
  overflow: hidden;

  .table-header-bar {
    padding: 16px 24px;
    border-bottom: 1px solid @border;
    background: #fafafa;

    .table-count {
      font-size: 13px;
      color: @text-sub;
      font-weight: 500;

      em {
        font-style: normal;
        font-weight: 700;
        color: @primary;
        font-size: 15px;
      }
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
    background: #edf7f0;
    color: @primary;
    border: 1px solid @primary-muted;
  }
  &.status-2 {
    background: #f5f5f5;
    color: #aaa;
    border: 1px solid #e0e0e0;
  }
}

// ── 视频徽章 ────────────────────────────────────────────────
.video-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  &.has-video {
    background: #edf7f0;
    color: @primary;
    border: 1px solid @primary-muted;
    i { color: @primary-light; }
  }

  &.no-video {
    background: #f5f5f5;
    color: @text-hint;
    border: 1px solid #e0e0e0;
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

  &.act-chapter {
    background: #edf7f0;
    border-color: @primary-muted;
    color: @primary;
    &:hover { background: @primary; color: #fff; border-color: @primary; }
  }

  &.act-edit {
    background: #e8f4fd;
    border-color: #b8d9f0;
    color: #1a7fc1;
    &:hover { background: #1a7fc1; color: #fff; border-color: #1a7fc1; }
  }

  &.act-delete {
    background: #fef0f0;
    border-color: #f5b8b8;
    color: #d94040;
    &:hover { background: #d94040; color: #fff; border-color: #d94040; }
  }
}

// ── 章节管理弹窗内部 ────────────────────────────────────────
.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(90deg, #f0f8f2 0%, #f8fbf9 100%);
  border-radius: @radius-md;
  border: 1px solid @primary-muted;
  margin-bottom: 16px;

  .chapter-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .chapter-course-tag {
    width: 36px;
    height: 36px;
    background: @primary;
    border-radius: @radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    flex-shrink: 0;
  }

  .chapter-label {
    font-size: 11px;
    font-weight: 600;
    color: @text-hint;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .chapter-course-name {
    font-size: 15px;
    font-weight: 700;
    color: @text-main;
  }
}

.btn-add-chapter {
  height: 34px;
  padding: 0 16px;
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
  box-shadow: 0 2px 8px rgba(66, 102, 79, 0.25);

  &:hover { background: @primary-light; }
  i { font-size: 12px; }
}

.chapter-table {
  :deep(.ant-table-tbody > tr > td) {
    vertical-align: middle;
  }
}

// ── 表单弹窗 ────────────────────────────────────────────────
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

// ── Ant Design 覆写 ─────────────────────────────────────────
:deep(.ant-table) {
  font-size: 13px;

  .ant-table-thead > tr > th {
    background: #fafafa;
    color: @text-sub;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.5px;
    border-bottom: 2px solid @primary-muted;
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
:deep(.ant-input-number),
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

  &:hover { background: @primary-light; border-color: @primary-light; }
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

  &:hover { border-color: @primary; }
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