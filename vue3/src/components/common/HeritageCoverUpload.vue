<template>
  <div class="heritage-cover-upload">
    <!-- 已上传的封面 -->
    <div v-if="coverImage" class="cover-preview">
      <img :src="coverImage" :alt="'封面图片'" class="cover-image" />
      <div class="cover-actions">
        <a-button type="text" size="small" @click="handlePreview">
          <i class="fas fa-eye"></i>
          预览
        </a-button>
        <a-button v-if="!readonly" type="text" size="small" danger @click="handleRemove">
          <i class="fas fa-trash"></i>
          删除
        </a-button>
      </div>
    </div>

    <!-- 上传区域 -->
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
      class="upload-dragger"
    >
      <div class="upload-content">
        <i class="fas fa-cloud-upload-alt upload-icon"></i>
        <div class="upload-text">
          <p>点击或拖拽图片到此区域上传封面</p>
          <p class="upload-hint">{{ uploadHint }}</p>
        </div>
      </div>
    </a-upload-dragger>

    <!-- 预览对话框 -->
    <a-modal
      v-model:open="previewVisible"
      title="封面预览"
      width="80%"
      centered
      :footer="null"
    >
      <div class="preview-content">
        <img :src="coverImage" class="preview-full-image" alt="封面预览" />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { generateBusinessUUID } from '@/utils/uuidUtils'
import { uploadBusinessFile, deleteBusinessFile } from '@/api/FileApi'

// ========== 组件属性 ==========
const props = defineProps({
  // 封面文件ID
  modelValue: {
    type: Number,
    default: null
  },
  // 封面图片路径
  coverImage: {
    type: String,
    default: ''
  },
  // 业务类型
  businessType: {
    type: String,
    default: 'HERITAGE_ITEM'
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
  // 最大文件大小（MB）
  maxSize: {
    type: Number,
    default: 10
  }
})

// ========== 事件定义 ==========
const emit = defineEmits([
  'update:modelValue',
  'update:coverImage',
  'upload-success',
  'upload-error',
  'remove'
])

// ========== 响应式数据 ==========
const previewVisible = ref(false)
const uploading = ref(false)

// ========== 计算属性 ==========

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
    type: 'IMG',
    businessType: props.businessType,
    businessField: 'cover'
  }
})

// 接受的文件类型
const acceptTypes = computed(() => {
  return 'image/*'
})

// 上传提示文本
const uploadHint = computed(() => {
  return `支持 JPG、PNG、GIF 等图片格式，文件不超过 ${props.maxSize}MB`
})

// ========== 方法 ==========

/**
 * 上传前检查
 */
function handleBeforeUpload(file) {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.warning('只能上传图片文件')
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
 * 自定义上传处理 - 支持策略B和策略C
 */
function handleCustomRequest(options) {
  const { file, onSuccess, onError } = options
  
  // 检查文件
  if (!handleBeforeUpload(file)) {
    return
  }
  
  uploading.value = true
  
  let businessInfo
  
  console.log('HeritageCoverUpload - props检查:', {
    useStrategyC: props.useStrategyC,
    businessId: props.businessId,
    businessType: props.businessType
  })
  
  if (props.useStrategyC && props.businessId) {
    // 策略C：直接业务绑定上传（用于编辑已存在的业务实体）
    businessInfo = {
      businessType: props.businessType,
      businessId: props.businessId,
      businessField: 'cover'
    }
    console.log('使用策略C（直接业务绑定上传）:', businessInfo)
  } else {
    // 策略B：前端UUID预生成上传（用于创建新业务实体）
    const businessUUID = generateBusinessUUID(props.businessType)
    businessInfo = {
      businessType: props.businessType,
      businessId: businessUUID,
      businessField: 'cover'
    }
    console.log('使用策略B（UUID预生成上传）:', businessInfo)
  }
  
  // 使用FileApi进行上传
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

/**
 * 上传成功处理
 */
function handleUploadSuccess(response, file, businessInfo) {
  // 处理API响应格式
  const data = response.data || response
  
  if (response.code === 200 || data.id) {
    const fileId = data.id
    const filePath = data.filePath
    
    emit('update:modelValue', fileId)
    emit('update:coverImage', filePath)
    emit('upload-success', {
      fileId,
      filePath,
      businessId: businessInfo.businessId
    })

    message.success('封面上传成功')
  } else {
    message.error(response.message || '上传失败')
    emit('upload-error', response)
  }
}

/**
 * 上传失败处理
 */
function handleUploadError(error) {
  message.error('上传失败，请重试')
  emit('upload-error', error)
}

/**
 * 预览封面
 */
function handlePreview() {
  previewVisible.value = true
}

/**
 * 删除封面
 */
function handleRemove() {
  Modal.confirm({
    title: '确定要删除封面吗？',
    content: '删除后无法恢复',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      if (props.modelValue) {
        deleteBusinessFile({fileId:props.modelValue}, {
          successMsg: '封面删除成功',
          onSuccess: () => {
            emit('update:modelValue', null)
            emit('update:coverImage', '')
            emit('remove')
          },
          onError: (error) => {
            console.error('删除封面失败:', error)
            message.error('删除封面失败，请重试')
          }
        })
      } else {
        // 如果没有文件ID，只清空本地状态
        emit('update:modelValue', null)
        emit('update:coverImage', '')
        emit('remove')
        message.success('删除成功')
      }
    }
  })
}
</script>

<style scoped>
.heritage-cover-upload {
  width: 100%;
}

.cover-preview {
  position: relative;
  width: 100%;
  max-width: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
}

.cover-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
}

.cover-actions {
  padding: 8px;
  display: flex;
  justify-content: center;
  gap: 8px;
  background: #fff;
  border-top: 1px solid #f0f2f5;
}

.upload-dragger {
  max-width: 400px;
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

/* 预览样式 */
.preview-content {
  text-align: center;
}

.preview-full-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cover-preview,
  .upload-dragger {
    max-width: 100%;
  }
  
  .cover-image {
    height: 300px;
  }
}
</style>

