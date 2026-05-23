<template>
  <div class="heritage-media-upload">
    <!-- 上传区域 -->
    <div class="upload-section">
      <a-upload-dragger
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="uploadData"
        :multiple="multiple"
        :accept="acceptTypes"
        :show-upload-list="false"
        :before-upload="handleBeforeUpload"
        :custom-request="handleCustomRequest"
        :disabled="disabled"
      >
        <div class="upload-content">
          <i class="fas fa-cloud-upload-alt upload-icon"></i>
          <div class="upload-text">
            <p>点击或拖拽文件到此区域上传，注意一定先上传封面后再上传媒体</p>
            <p class="upload-hint">{{ uploadHint }}</p>
          </div>
        </div>
      </a-upload-dragger>
    </div>

    <!-- 媒体列表 -->
    <div v-if="mediaList.length > 0" class="media-list">
      <h4>已上传媒体 ({{ mediaList.length }})</h4>

      <div class="media-grid">
        <div
          v-for="(media, index) in mediaList"
          :key="media.id || index"
          class="media-item"
          :class="{ 'sortable': sortable }"
        >
          <!-- 媒体预览 -->
          <div class="media-preview">
            <!-- 图片预览 -->
            <img
              v-if="media.type === 'IMG'"
              :src="media.filePath"
              :alt="media.originalName"
              class="preview-image"
              @click="handlePreview(media)"
            />

            <!-- 视频预览 -->
            <div v-else-if="media.type === 'VIDEO'" class="video-preview" @click="handlePreview(media)">
              <i class="fas fa-play-circle"></i>
              <span>{{ media.originalName }}</span>
            </div>

            <!-- 音频预览 -->
            <div v-else-if="media.type === 'AUDIO'" class="audio-preview" @click="handlePreview(media)">
              <i class="fas fa-music"></i>
              <span>{{ media.originalName }}</span>
            </div>

            <!-- PDF预览 -->
            <div v-else-if="media.type === 'PDF'" class="pdf-preview" @click="handlePreview(media)">
              <i class="fas fa-file-pdf"></i>
              <span>{{ media.originalName }}</span>
            </div>

            <!-- 其他文件 -->
            <div v-else class="file-preview" @click="handlePreview(media)">
              <i class="fas fa-file"></i>
              <span>{{ media.originalName }}</span>
            </div>
          </div>

          <!-- 媒体信息 -->
          <div class="media-info">
            <div class="media-name" :title="media.originalName">
              {{ media.originalName }}
            </div>
            <div class="media-meta">
              <span class="media-type">{{ getMediaTypeName(media.type) }}</span>
              <span class="media-size">{{ formatFileSize(media.fileSize) }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="media-actions">
            <a-button
              v-if="sortable"
              type="text"
              size="small"
              @click="handleMoveUp(index)"
              :disabled="index === 0"
            >
              <i class="fas fa-arrow-up"></i>
            </a-button>
            <a-button
              v-if="sortable"
              type="text"
              size="small"
              @click="handleMoveDown(index)"
              :disabled="index === mediaList.length - 1"
            >
              <i class="fas fa-arrow-down"></i>
            </a-button>
            <a-button
              type="text"
              size="small"
              @click="handlePreview(media)"
            >
              <i class="fas fa-eye"></i>
            </a-button>
            <a-button
              v-if="!readonly"
              type="text"
              size="small"
              @click="handleRemove(media, index)"
            >
              <i class="fas fa-trash text-danger"></i>
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览对话框 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewMedia?.originalName"
      width="80%"
      centered
      :footer="null"
    >
      <div class="preview-content">
        <!-- 图片预览 -->
        <img
          v-if="previewMedia?.type === 'IMG'"
          :src="previewMedia.filePath"
          class="preview-full-image"
        />

        <!-- 视频预览 -->
        <video
          v-else-if="previewMedia?.type === 'VIDEO'"
          :src="previewMedia.filePath"
          controls
          class="preview-video"
        >
          您的浏览器不支持视频播放
        </video>

        <!-- 音频预览 -->
        <audio
          v-else-if="previewMedia?.type === 'AUDIO'"
          :src="previewMedia.filePath"
          controls
          class="preview-audio"
        >
          您的浏览器不支持音频播放
        </audio>

        <!-- PDF预览 -->
        <iframe
          v-else-if="previewMedia?.type === 'PDF'"
          :src="previewMedia.filePath"
          class="preview-pdf"
        ></iframe>

        <!-- 其他文件 -->
        <div v-else class="preview-file">
          <i class="fas fa-file fa-3x"></i>
          <p>{{ previewMedia?.originalName }}</p>
          <a-button type="primary" @click="handleDownload(previewMedia)">
            <i class="fas fa-download"></i>
            下载文件
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { generateBusinessUUID, BUSINESS_TYPES } from '@/utils/uuidUtils'
import { uploadBusinessFile, deleteBusinessFile } from '@/api/FileApi'

// ========== 组件属性 ==========
const props = defineProps({
  // 媒体列表
  modelValue: {
    type: Array,
    default: () => []
  },
  // 媒体类型
  mediaType: {
    type: String,
    default: 'ALL',
    validator: (value) => ['IMG', 'VIDEO', 'AUDIO', 'PDF', 'ALL'].includes(value)
  },
  // 业务类型
  businessType: {
    type: String,
    default: 'HERITAGE_ITEM'
  },
  // 业务字段
  businessField: {
    type: String,
    default: 'media'
  },
  // 业务ID（策略C使用）
  businessId: {
    type: [String, Number],
    default: null
  },
  // 是否使用策略C（直接业务绑定上传）
  useStrategyC: {
    type: Boolean,
    default: false
  },
  // 是否支持多选
  multiple: {
    type: Boolean,
    default: true
  },
  // 是否支持排序
  sortable: {
    type: Boolean,
    default: true
  },
  // 是否只读
  readonly: {
    type: Boolean,
    default: false
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 最大文件数量
  maxCount: {
    type: Number,
    default: 10
  },
  // 最大文件大小（MB）
  maxSize: {
    type: Number,
    default: 50
  }
})

// ========== 事件定义 ==========
const emit = defineEmits([
  'update:modelValue',
  'upload-success',
  'upload-error',
  'remove',
  'preview'
])

// ========== 响应式数据 ==========
const uploadRef = ref()
const previewVisible = ref(false)
const previewMedia = ref(null)

// ========== 计算属性 ==========

// 媒体列表
const mediaList = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})

// 上传地址
const uploadAction = computed(() => {
  return '/api/file/simple/upload'
})

// 上传请求头
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 上传数据
const uploadData = computed(() => {
  return {
    type: props.mediaType === 'ALL' ? 'COMMON' : props.mediaType,
    businessType: props.businessType,
    businessField: props.businessField
  }
})

// 接受的文件类型
const acceptTypes = computed(() => {
  const typeMap = {
    IMG: 'image/*',
    VIDEO: 'video/*',
    AUDIO: 'audio/*',
    PDF: '.pdf',
    ALL: 'image/*,video/*,audio/*,.pdf'
  }
  return typeMap[props.mediaType] || typeMap.ALL
})

// 上传提示文本
const uploadHint = computed(() => {
  const typeMap = {
    IMG: '支持 JPG、PNG、GIF 等图片格式',
    VIDEO: '支持 MP4、AVI、MOV 等视频格式',
    AUDIO: '支持 MP3、WAV、AAC 等音频格式',
    PDF: '支持 PDF 文档格式',
    ALL: '支持图片、视频、音频、PDF 等格式'
  }
  return `${typeMap[props.mediaType] || typeMap.ALL}，单个文件不超过 ${props.maxSize}MB`
})

// ========== 方法 ==========

/**
 * 上传前检查
 */
function handleBeforeUpload(file) {
  // 检查文件数量
  if (mediaList.value.length >= props.maxCount) {
    message.warning(`最多只能上传 ${props.maxCount} 个文件`)
    return false
  }

  // 检查文件大小
  const fileSizeMB = file.size / 1024 / 1024
  if (fileSizeMB > props.maxSize) {
    message.warning(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }

  return true
}

/**
 * 上传成功处理 - 策略B
 */
function handleUploadSuccess(response, file) {
  // 处理API响应格式
  const data = response.data || response

  if (response.code === 200 || data.id) {
    const newMedia = {
      id: data.id || Date.now(), // 使用后端返回的文件ID
      fileId: data.id,
      filePath: data.filePath,
      originalName: data.originalName || file.name,
      fileSize: data.fileSize || file.size,
      type: data.fileType || getFileType(file.name),
      sort: mediaList.value.length,
      businessId: data.businessId || response.businessId, // 策略B：保存业务UUID
      businessType: data.businessType || props.businessType
    }

    //const newList = [...mediaList.value, newMedia]
    mediaList.value = [...mediaList.value, newMedia]

    message.success('文件上传成功')
    emit('upload-success', newMedia)
  } else {
    message.error(response.message || '上传失败')
    emit('upload-error', response)
  }
}

/**
 * 自定义上传处理 - 支持策略B和策略C
 */
function handleCustomRequest(options) {
  const { file, onSuccess, onError, onProgress } = options

  // 检查文件
  if (!handleBeforeUpload(file)) {
    return
  }

  let businessInfo

  console.log('HeritageMediaUpload - props检查:', {
    useStrategyC: props.useStrategyC,
    businessId: props.businessId,
    businessType: props.businessType,
    businessField: props.businessField
  })

  if (props.useStrategyC && props.businessId) {
    // 策略C：直接业务绑定上传（用于编辑已存在的业务实体）
    businessInfo = {
      businessType: props.businessType,
      businessId: props.businessId, // 使用已存在的业务ID
      businessField: props.businessField
    }
    console.log('使用策略C（直接业务绑定上传）:', businessInfo)
  } else {
    // 策略B：前端UUID预生成上传（用于创建新业务实体）
    const businessUUID = generateBusinessUUID(props.businessType)
    businessInfo = {
      businessType: props.businessType,
      businessId: businessUUID,
      businessField: props.businessField
    }
    console.log('使用策略B（UUID预生成上传）:', businessInfo)
  }

  // 使用FileApi进行上传
  uploadBusinessFile(file, businessInfo, false, {
    onSuccess: (response) => {
      const enhancedData = {
        ...response,
        businessId: businessInfo.businessId
      }
      handleUploadSuccess(enhancedData, file)
      onSuccess(enhancedData, file)
    },
    onError: (error) => {
      handleUploadError(error)
      onError(error)
    }
  })
}

/**
 * 上传失败处理
 */
function handleUploadError(error) {
  message.error('上传失败，请重试')
  emit('upload-error', error)
}

/**
 * 移除媒体
 */
function handleRemove(media, index) {

  Modal.confirm({
    title: '确定要删除这个文件吗？',
    content: '删除后无法恢复',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      // 如果有文件ID，调用后端API删除
      if (media.id || media.fileId) {
        const fileId = media.id || media.fileId
        console.log('删除文件，文件ID:', fileId)
        console.log('删除文件，完整媒体对象:', media)

        deleteBusinessFile({fileId:media.fileId}, {
          successMsg: '文件删除成功',
          onSuccess: () => {
            // 从前端列表中移除
            const newList = [...mediaList.value]
            newList.splice(index, 1)
            mediaList.value = newList

            emit('remove', media, index)
          },
          onError: (error) => {
            console.error('删除文件失败:', error)
            message.error('删除文件失败，请重试')
          }
        })
      } else {
        // 如果没有文件ID，只从前端列表中移除（可能是刚上传但未保存的文件）
        console.log('删除本地文件（无ID）:', media)
        const newList = [...mediaList.value]
        newList.splice(index, 1)
        mediaList.value = newList

        message.success('删除成功')
        emit('remove', media, index)
      }
    }
  })
}

/**
 * 预览媒体
 */
function handlePreview(media) {
  previewMedia.value = media
  previewVisible.value = true
  emit('preview', media)
}

/**
 * 下载文件
 */
function handleDownload(media) {
  if (media?.filePath) {
    window.open(media.filePath, '_blank')
  }
}

/**
 * 向上移动
 */
function handleMoveUp(index) {
  if (index > 0) {
    const newList = [...mediaList.value]
    const temp = newList[index]
    newList[index] = newList[index - 1]
    newList[index - 1] = temp

    // 更新排序
    newList.forEach((item, idx) => {
      item.sort = idx
    })

    mediaList.value = newList
  }
}

/**
 * 向下移动
 */
function handleMoveDown(index) {
  if (index < mediaList.value.length - 1) {
    const newList = [...mediaList.value]
    const temp = newList[index]
    newList[index] = newList[index + 1]
    newList[index + 1] = temp

    // 更新排序
    newList.forEach((item, idx) => {
      item.sort = idx
    })

    mediaList.value = newList
  }
}

/**
 * 获取文件类型
 */
function getFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase()

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
    return 'IMG'
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return 'VIDEO'
  } else if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(ext)) {
    return 'AUDIO'
  } else if (ext === 'pdf') {
    return 'PDF'
  }

  return 'FILE'
}

/**
 * 获取媒体类型名称
 */
function getMediaTypeName(type) {
  const typeMap = {
    IMG: '图片',
    VIDEO: '视频',
    AUDIO: '音频',
    PDF: 'PDF',
    FILE: '文件'
  }
  return typeMap[type] || '文件'
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (!bytes) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.heritage-media-upload {
  width: 100%;
}

.upload-section {
  margin-bottom: 20px;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 0;
  color: #606266;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.media-list h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.media-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s ease;
}

.media-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.media-item.sortable {
  cursor: move;
}

.media-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  cursor: pointer;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-preview,
.audio-preview,
.pdf-preview,
.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.video-preview i,
.audio-preview i,
.pdf-preview i,
.file-preview i {
  font-size: 32px;
}

.media-info {
  padding: 12px;
}

.media-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.media-actions {
  padding: 8px 12px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.text-danger {
  color: #f56c6c;
}

/* 预览样式 */
.preview-content {
  text-align: center;
}

.preview-full-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}

.preview-video {
  width: 100%;
  max-height: 60vh;
}

.preview-audio {
  width: 100%;
}

.preview-pdf {
  width: 100%;
  height: 60vh;
  border: none;
}

.preview-file {
  padding: 40px;
  color: #606266;
}

.preview-file i {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.preview-file p {
  margin: 16px 0;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .media-preview {
    height: 100px;
  }

  .media-info {
    padding: 8px;
  }
}
</style>

