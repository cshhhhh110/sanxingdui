<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    width="800px"
    :mask-closable="false"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <!-- 基本信息 -->
      <a-divider orientation="left">基本信息</a-divider>

      <a-form-item label="瑰宝名称" name="title">
        <a-input
          v-model:value="formData.title"
          placeholder="请输入瑰宝名称"
          :maxlength="200"
          show-count
        />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="瑰宝类别" name="category" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <a-select
              v-model:value="formData.category"
              placeholder="请选择瑰宝类别"
            >
              <a-select-option
                v-for="category in HERITAGE_CATEGORIES"
                :key="category"
                :value="category"
              >
                {{ category }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="所属地区" name="region" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
            <a-input
              v-model:value="formData.region"
              placeholder="请输入所属地区"
              :maxlength="100"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="瑰宝概要" name="summary">
        <a-textarea
          v-model:value="formData.summary"
          :rows="3"
          placeholder="请输入瑰宝摘要（500字以内）"
          :maxlength="500"
          show-count
        />
      </a-form-item>

      <a-form-item label="详细描述" name="description">
        <a-textarea
          v-model:value="formData.description"
          :rows="6"
          placeholder="请输入瑰宝的详细描述"
          :maxlength="5000"
          show-count
        />
      </a-form-item>

      <a-form-item label="状态" name="status">
        <a-radio-group v-model:value="formData.status">
          <a-radio :value="0">保存为草稿</a-radio>
          <a-radio :value="1" v-if="!isAdmin">提交审核</a-radio>
          <a-radio :value="2" v-if="isAdmin">直接发布</a-radio>
        </a-radio-group>
        <div v-if="isAdmin" class="form-tip">
          <i class="fas fa-info-circle"></i>
          管理员创建的作品可以直接发布，无需审核
        </div>
      </a-form-item>

      <!-- 封面图片 -->
      <a-divider orientation="left">封面图片</a-divider>
      
      <a-form-item label="封面上传" name="cover">
        <HeritageCoverUpload
          v-model="coverFileId"
          v-model:cover-image="coverImage"
          business-type="HERITAGE_ITEM"
          :business-id="businessUUID"
          :use-strategy-c="false"
          :max-size="10"
          @upload-success="handleCoverUploadSuccess"
          @remove="handleCoverRemove"
        />
        <div class="form-tip" style="margin-top: 8px;">
          <i class="fas fa-info-circle"></i>
          建议上传1:1比例（方形）的图片，以获得最佳显示效果
        </div>
      </a-form-item>

      <!-- 媒体文件 -->
      <a-divider orientation="left">媒体文件</a-divider>
      
      <a-form-item label="文件上传" name="media">
        <HeritageMediaUpload
          v-model="uploadedMedia"
          media-type="ALL"
          :business-id="businessUUID"
          business-type="HERITAGE_ITEM"
          business-field="media"
          :use-strategy-c="true"
          :max-count="20"
          :max-size="100"
          @upload-success="handleMediaUploadSuccess"
          @remove="handleMediaRemove"
        />
      </a-form-item>
    </a-form>

    <!-- 底部按钮 -->
    <template #footer>
      <a-space>
        <a-button @click="handleCancel">取消</a-button>
        <a-button @click="handleSaveDraft" :loading="submitting">
          保存草稿
        </a-button>
        <a-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ submitButtonText }}
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { 
  createHeritageItem, 
  HERITAGE_CATEGORIES 
} from '@/api/HeritageApi'
import HeritageMediaUpload from '@/components/common/HeritageMediaUpload.vue'
import HeritageCoverUpload from '@/components/common/HeritageCoverUpload.vue'
import { generateBusinessUUID, BUSINESS_TYPES } from '@/utils/uuidUtils'
import { useUserStore } from '@/store/user'

// ========== 组件属性 ==========
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'admin', // 'admin' 或 'user'
    validator: (value) => ['admin', 'user'].includes(value)
  }
})

const emit = defineEmits(['update:open', 'success'])

// ========== 响应式数据 ==========
const userStore = useUserStore()
const visible = ref(false)
const formRef = ref()
const submitting = ref(false)
const uploadedMedia = ref([])
const coverFileId = ref(null)
const coverImage = ref('')
const businessUUID = ref('') // 用于策略B的业务UUID

const formData = reactive({
  title: '',
  category: '',
  region: '',
  summary: '',
  description: '',
  status: 0 // 默认草稿
})

const formRules = {
  title: [
    { required: true, message: '请输入作品标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择作品类别', trigger: 'change' }
  ],
  region: [
    { max: 100, message: '地区长度不能超过 100 个字符', trigger: 'blur' }
  ]
}

// ========== 计算属性 ==========
const isAdmin = computed(() => {
  return props.mode === 'admin' || userStore.isAdmin
})

const modalTitle = computed(() => {
  return isAdmin.value ? '新增瑰宝' : '发布我的瑰宝'
})

const submitButtonText = computed(() => {
  if (formData.status === 0) return '保存'
  if (isAdmin.value) return '发布作品'
  return '提交审核'
})

// ========== 监听器 ==========
watch(() => props.open, (newVal) => {
  visible.value = newVal
  if (newVal) {
    resetForm()
  }
})

watch(visible, (newVal) => {
  emit('update:open', newVal)
})

// ========== 方法 ==========

/**
 * 重置表单
 */
function resetForm() {
  Object.assign(formData, {
    title: '',
    category: '',
    region: '',
    summary: '',
    description: '',
    status: 0
  })
  uploadedMedia.value = []
  coverFileId.value = null
  coverImage.value = ''

  if (formRef.value) {
    formRef.value.resetFields()
  }
}

/**
 * 取消操作
 */
function handleCancel() {
  visible.value = false
}

/**
 * 保存草稿
 */
function handleSaveDraft() {
  formData.status = 0
  handleSubmit()
}

/**
 * 提交表单
 */
function handleSubmit() {
  formRef.value.validate().then(() => {
    submitForm()
  }).catch(() => {
    message.warning('请填写完整的表单信息')
  })
}

/**
 * 提交表单数据 - 策略B实现
 */
function submitForm() {
  submitting.value = true
  
  // 策略B：优先使用businessUUID，确保所有上传文件关联同一个ID
  let businessId = businessUUID.value || generateBusinessUUID(BUSINESS_TYPES.HERITAGE_ITEM)

  // 如果有上传的封面或媒体文件，使用它们的businessId
  if (coverImage.value && uploadedMedia.value.length > 0) {
    // 两者都有，使用第一个媒体文件的businessId（它们应该相同）
    businessId = uploadedMedia.value[0].businessId
  } else if (coverImage.value) {
    // 只有封面，从封面上传事件中获取
    businessId = businessUUID.value
  } else if (uploadedMedia.value.length > 0) {
    // 只有媒体文件
    businessId = uploadedMedia.value[0].businessId
  }

  // 策略B：创建时携带预生成的UUID
  const createData = {
    ...formData,
    id: businessId, // 使用UUID作为业务ID
    coverFileId: coverFileId.value // 添加封面文件ID
  }

  const successMessage = getSuccessMessage()
  
  createHeritageItem(createData, {
    successMsg: successMessage,
    onSuccess: (res) => {
      submitting.value = false
      visible.value = false
      emit('success')
      window.location.reload()
      // 策略B：文件已经在上传时关联，无需额外关联步骤
      console.log('策略B创建成功，业务ID:', businessId)
    },
    onError: (error) => {
      submitting.value = false
    }
  })
}

/**
 * 获取成功提示消息
 */
function getSuccessMessage() {
  if (formData.status === 0) {
    return '草稿保存成功'
  }
  
  if (isAdmin.value) {
    return formData.status === 2 ? '作品发布成功' : '作品创建成功'
  }
  
  return '作品提交成功，等待审核'
}

/**
 * 封面上传成功
 */
function handleCoverUploadSuccess(data) {
  console.log('封面上传成功:', data)
  // 更新businessUUID，确保媒体文件也使用相同的UUID
  if (data.businessId && !businessUUID.value) {
    businessUUID.value = data.businessId
  }
}

/**
 * 封面移除
 */
function handleCoverRemove() {
  console.log('封面已移除')
}

/**
 * 媒体上传成功
 */
function handleMediaUploadSuccess(media) {
  console.log('媒体上传成功:', media)
}

/**
 * 媒体移除
 */
function handleMediaRemove(media, index) {
  console.log('媒体移除:', media, index)
}
</script>

<style scoped>
/* 对话框内容样式 */
:deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-divider) {
  margin: 16px 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-tip .fas {
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.ant-modal) {
    margin: 0;
    max-width: 100vw;
    top: 0;
  }
  
  :deep(.ant-modal-content) {
    border-radius: 0;
  }
}
</style>
