<template>
  <div class="cover-upload">
    <div v-if="coverImage" class="cover-preview">
      <img :src="coverImage" alt="封面" class="cover-preview__img" />
      <div class="cover-preview__actions">
        <button type="button" class="action-btn" @click="handlePreview">预览</button>
        <button v-if="!readonly" type="button" class="action-btn action-btn--danger" @click="handleRemove">
          删除
        </button>
      </div>
    </div>

    <a-upload-dragger
      v-else
      :action="uploadAction"
      :headers="uploadHeaders"
      :data="uploadData"
      :accept="acceptTypes"
      :show-upload-list="false"
      :before-upload="handleBeforeUpload"
      :custom-request="handleCustomRequest"
      :disabled="disabled || readonly"
      class="upload-zone"
    >
      <div class="upload-zone__inner">
        <span class="upload-zone__icon">↑</span>
        <p class="upload-zone__text">点击或拖拽上传封面</p>
        <p class="upload-zone__hint">{{ uploadHint }}</p>
      </div>
    </a-upload-dragger>

    <a-modal
      v-model:open="previewVisible"
      title="封面预览"
      width="80%"
      centered
      wrap-class-name="minimal-modal"
      :footer="null"
    >
      <div class="preview-wrap">
        <img :src="coverImage" class="preview-img" alt="封面预览" />
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
  modelValue: { type: Number, default: null },
  coverImage: { type: String, default: '' },
  businessType: { type: String, default: 'HERITAGE_ITEM' },
  businessId: { type: [String, Number], default: null },
  useStrategyC: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  maxSize: { type: Number, default: 10 }
})

const emit = defineEmits([
  'update:modelValue',
  'update:coverImage',
  'upload-success',
  'upload-error',
  'remove'
])

const previewVisible = ref(false)
const uploading = ref(false)

const uploadAction = computed(() => '/api/file/simple/upload')

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const uploadData = computed(() => ({
  type: 'IMG',
  businessType: props.businessType,
  businessField: 'cover'
}))

const acceptTypes = computed(() => 'image/*')

const uploadHint = computed(
  () => `支持 JPG、PNG、GIF，不超过 ${props.maxSize}MB`
)

function handleBeforeUpload(file) {
  if (!file.type.startsWith('image/')) {
    message.warning('只能上传图片文件')
    return false
  }
  const fileSizeMB = file.size / 1024 / 1024
  if (fileSizeMB > props.maxSize) {
    message.warning(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

function handleCustomRequest(options) {
  const { file, onSuccess, onError } = options

  if (!handleBeforeUpload(file)) return

  uploading.value = true

  let businessInfo

  if (props.useStrategyC && props.businessId) {
    businessInfo = {
      businessType: props.businessType,
      businessId: props.businessId,
      businessField: 'cover'
    }
  } else {
    const businessUUID = generateBusinessUUID(props.businessType)
    businessInfo = {
      businessType: props.businessType,
      businessId: businessUUID,
      businessField: 'cover'
    }
  }

  uploadBusinessFile(file, businessInfo, false, {
    onSuccess: (response) => {
      uploading.value = false
      handleUploadSuccess(response, file, businessInfo)
      onSuccess(response, file)
    },
    onError: (error) => {
      uploading.value = false
      handleUploadError(error)
      onError(error)
    }
  })
}

function handleUploadSuccess(response, file, businessInfo) {
  const data = response.data || response

  if (response.code === 200 || data.id) {
    emit('update:modelValue', data.id)
    emit('update:coverImage', data.filePath)
    emit('upload-success', {
      fileId: data.id,
      filePath: data.filePath,
      businessId: businessInfo.businessId
    })
    message.success('封面上传成功')
  } else {
    message.error(response.message || '上传失败')
    emit('upload-error', response)
  }
}

function handleUploadError(error) {
  message.error('上传失败，请重试')
  emit('upload-error', error)
}

function handlePreview() {
  previewVisible.value = true
}

function handleRemove() {
  Modal.confirm({
    title: '删除确认',
    content: '删除后无法恢复',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      if (props.modelValue) {
        deleteBusinessFile(
          { fileId: props.modelValue },
          {
            successMsg: '封面删除成功',
            onSuccess: () => {
              emit('update:modelValue', null)
              emit('update:coverImage', '')
              emit('remove')
            },
            onError: () => message.error('删除封面失败，请重试')
          }
        )
      } else {
        emit('update:modelValue', null)
        emit('update:coverImage', '')
        emit('remove')
        message.success('删除成功')
      }
    }
  })
}
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;

.cover-upload {
  width: 100%;
  max-width: 320px;
}

.cover-preview {
  border: 1px solid $border;

  &__img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }

  &__actions {
    display: flex;
    gap: 8px;
    padding: 8px;
    border-top: 1px solid $border;
    background: $bg;
  }
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
  padding: 32px 16px;
  text-align: center;
}

.upload-zone__icon {
  display: block;
  font-size: 22px;
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

.action-btn {
  flex: 1;
  padding: 4px 0;
  font-size: 12px;
  color: $accent;
  background: #fff;
  border: 1px solid $border;
  cursor: pointer;

  &:hover {
    border-color: $accent;
  }

  &--danger {
    color: $black;

    &:hover {
      border-color: $black;
    }
  }
}

.preview-wrap {
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

@media (max-width: 768px) {
  .cover-upload {
    max-width: 100%;
  }
}
</style>

<style lang="scss">
@import '@/styles/backend-minimal.scss';
</style>
