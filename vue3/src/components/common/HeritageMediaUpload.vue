<template>
  <div class="media-upload">
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
      class="upload-zone"
    >
      <div class="upload-zone__inner">
        <span class="upload-zone__icon">↑</span>
        <p class="upload-zone__text">点击或拖拽文件到此处上传</p>
        <p class="upload-zone__hint">{{ uploadHint }}</p>
      </div>
    </a-upload-dragger>

    <div v-if="mediaList.length > 0" class="media-list">
      <p class="media-list__title">已上传 {{ mediaList.length }} 个文件</p>
      <div class="media-grid">
        <article
          v-for="(media, index) in mediaList"
          :key="media.id || index"
          class="media-card"
        >
          <div class="media-card__preview" @click="handlePreview(media)">
            <img
              v-if="media.type === 'IMG'"
              :src="media.filePath"
              :alt="media.originalName"
            />
            <span v-else class="media-card__type">{{ getMediaTypeName(media.type) }}</span>
          </div>
          <div class="media-card__body">
            <div class="media-card__name" :title="media.originalName">{{ media.originalName }}</div>
            <div class="media-card__meta">
              <span>{{ getMediaTypeName(media.type) }}</span>
              <span>{{ formatFileSize(media.fileSize) }}</span>
            </div>
          </div>
          <div class="media-card__actions">
            <button
              v-if="sortable"
              type="button"
              class="action-btn"
              :disabled="index === 0"
              @click="handleMoveUp(index)"
            >
              上
            </button>
            <button
              v-if="sortable"
              type="button"
              class="action-btn"
              :disabled="index === mediaList.length - 1"
              @click="handleMoveDown(index)"
            >
              下
            </button>
            <button type="button" class="action-btn" @click="handlePreview(media)">预览</button>
            <button
              v-if="!readonly"
              type="button"
              class="action-btn action-btn--danger"
              @click="handleRemove(media, index)"
            >
              删
            </button>
          </div>
        </article>
      </div>
    </div>

    <a-modal
      v-model:open="previewVisible"
      :title="previewMedia?.originalName"
      width="80%"
      centered
      wrap-class-name="minimal-modal"
      :footer="null"
    >
      <div class="preview-wrap">
        <img
          v-if="previewMedia?.type === 'IMG'"
          :src="previewMedia.filePath"
          class="preview-img"
          alt=""
        />
        <video
          v-else-if="previewMedia?.type === 'VIDEO'"
          :src="previewMedia.filePath"
          controls
          class="preview-video"
        />
        <audio
          v-else-if="previewMedia?.type === 'AUDIO'"
          :src="previewMedia.filePath"
          controls
          class="preview-audio"
        />
        <iframe
          v-else-if="previewMedia?.type === 'PDF'"
          :src="previewMedia.filePath"
          class="preview-pdf"
        />
        <div v-else class="preview-file">
          <p>{{ previewMedia?.originalName }}</p>
          <a-button type="primary" class="btn-minimal-primary" @click="handleDownload(previewMedia)">
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
import { generateBusinessUUID } from '@/utils/uuidUtils'
import { uploadBusinessFile, deleteBusinessFile } from '@/api/FileApi'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  mediaType: {
    type: String,
    default: 'ALL',
    validator: (v) => ['IMG', 'VIDEO', 'AUDIO', 'PDF', 'ALL'].includes(v)
  },
  businessType: { type: String, default: 'HERITAGE_ITEM' },
  businessField: { type: String, default: 'media' },
  businessId: { type: [String, Number], default: null },
  useStrategyC: { type: Boolean, default: false },
  multiple: { type: Boolean, default: true },
  sortable: { type: Boolean, default: true },
  readonly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  maxCount: { type: Number, default: 10 },
  maxSize: { type: Number, default: 50 }
})

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error', 'remove', 'preview'])

const previewVisible = ref(false)
const previewMedia = ref(null)

const mediaList = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})

const uploadAction = computed(() => '/api/file/simple/upload')

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const uploadData = computed(() => ({
  type: props.mediaType === 'ALL' ? 'COMMON' : props.mediaType,
  businessType: props.businessType,
  businessField: props.businessField
}))

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

const uploadHint = computed(() => {
  const typeMap = {
    IMG: '支持 JPG、PNG、GIF 等图片',
    VIDEO: '支持 MP4、AVI、MOV 等视频',
    AUDIO: '支持 MP3、WAV、AAC 等音频',
    PDF: '支持 PDF 文档',
    ALL: '支持图片、视频、音频、PDF'
  }
  return `${typeMap[props.mediaType] || typeMap.ALL}，单文件不超过 ${props.maxSize}MB`
})

function handleBeforeUpload(file) {
  if (mediaList.value.length >= props.maxCount) {
    message.warning(`最多只能上传 ${props.maxCount} 个文件`)
    return false
  }
  const fileSizeMB = file.size / 1024 / 1024
  if (fileSizeMB > props.maxSize) {
    message.warning(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

function handleUploadSuccess(response, file) {
  const data = response.data || response

  if (response.code === 200 || data.id) {
    const newMedia = {
      id: data.id || Date.now(),
      fileId: data.id,
      filePath: data.filePath,
      originalName: data.originalName || file.name,
      fileSize: data.fileSize || file.size,
      type: data.fileType || getFileType(file.name),
      sort: mediaList.value.length,
      businessId: data.businessId || response.businessId,
      businessType: data.businessType || props.businessType
    }

    mediaList.value = [...mediaList.value, newMedia]
    message.success('文件上传成功')
    emit('upload-success', newMedia)
  } else {
    message.error(response.message || '上传失败')
    emit('upload-error', response)
  }
}

function handleCustomRequest(options) {
  const { file, onSuccess, onError } = options

  if (!handleBeforeUpload(file)) return

  let businessInfo

  if (props.useStrategyC && props.businessId) {
    businessInfo = {
      businessType: props.businessType,
      businessId: props.businessId,
      businessField: props.businessField
    }
  } else {
    const businessUUID = generateBusinessUUID(props.businessType)
    businessInfo = {
      businessType: props.businessType,
      businessId: businessUUID,
      businessField: props.businessField
    }
  }

  uploadBusinessFile(file, businessInfo, false, {
    onSuccess: (response) => {
      const enhancedData = { ...response, businessId: businessInfo.businessId }
      handleUploadSuccess(enhancedData, file)
      onSuccess(enhancedData, file)
    },
    onError: (error) => {
      handleUploadError(error)
      onError(error)
    }
  })
}

function handleUploadError(error) {
  message.error('上传失败，请重试')
  emit('upload-error', error)
}

function handleRemove(media, index) {
  Modal.confirm({
    title: '删除确认',
    content: '删除后无法恢复',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      if (media.id || media.fileId) {
        deleteBusinessFile(
          { fileId: media.fileId },
          {
            successMsg: '文件删除成功',
            onSuccess: () => {
              const newList = [...mediaList.value]
              newList.splice(index, 1)
              mediaList.value = newList
              emit('remove', media, index)
            },
            onError: () => message.error('删除文件失败，请重试')
          }
        )
      } else {
        const newList = [...mediaList.value]
        newList.splice(index, 1)
        mediaList.value = newList
        message.success('删除成功')
        emit('remove', media, index)
      }
    }
  })
}

function handlePreview(media) {
  previewMedia.value = media
  previewVisible.value = true
  emit('preview', media)
}

function handleDownload(media) {
  if (media?.filePath) window.open(media.filePath, '_blank')
}

function handleMoveUp(index) {
  if (index > 0) {
    const newList = [...mediaList.value]
    ;[newList[index], newList[index - 1]] = [newList[index - 1], newList[index]]
    newList.forEach((item, idx) => {
      item.sort = idx
    })
    mediaList.value = newList
  }
}

function handleMoveDown(index) {
  if (index < mediaList.value.length - 1) {
    const newList = [...mediaList.value]
    ;[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    newList.forEach((item, idx) => {
      item.sort = idx
    })
    mediaList.value = newList
  }
}

function getFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'IMG'
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return 'VIDEO'
  if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(ext)) return 'AUDIO'
  if (ext === 'pdf') return 'PDF'
  return 'FILE'
}

function getMediaTypeName(type) {
  const typeMap = { IMG: '图片', VIDEO: '视频', AUDIO: '音频', PDF: 'PDF', FILE: '文件' }
  return typeMap[type] || '文件'
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;

.media-upload {
  width: 100%;
}

.upload-zone {
  :deep(.ant-upload-drag) {
    border: 1px dashed $black !important;
    border-radius: 0 !important;
    background: $bg !important;

    &:hover {
      border-color: $accent !important;
    }
  }
}

.upload-zone__inner {
  padding: 28px 16px;
  text-align: center;
}

.upload-zone__icon {
  display: block;
  font-size: 24px;
  font-weight: 300;
  color: $muted;
  margin-bottom: 8px;
}

.upload-zone__text {
  margin: 0;
  font-size: 13px;
  color: $black;
}

.upload-zone__hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: $muted;
}

.media-list__title {
  margin: 16px 0 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $muted;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.media-card {
  border: 1px solid $border;
  background: #fff;
}

.media-card__preview {
  height: 96px;
  background: $bg;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.media-card__type {
  font-size: 12px;
  color: $muted;
}

.media-card__body {
  padding: 8px 10px;
  border-top: 1px solid $border;
}

.media-card__name {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.media-card__meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: $muted;
}

.media-card__actions {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  border-top: 1px solid $border;
  background: $bg;
}

.action-btn {
  flex: 1;
  padding: 2px 0;
  font-size: 11px;
  color: $accent;
  background: none;
  border: 1px solid $border;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: $accent;
    color: $black;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &--danger {
    color: $black;

    &:hover:not(:disabled) {
      border-color: $black;
    }
  }
}

.preview-wrap {
  text-align: center;
}

.preview-img {
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
  padding: 32px;
  color: $muted;
}
</style>

<style lang="scss">
@use '@/styles/backend-minimal.scss' as *;
</style>
