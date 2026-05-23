<template>
  <a-modal
      v-model:open="visible"
      :title="modalTitle"
      width="800px"
      :mask-closable="false"
      @cancel="handleCancel"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-skeleton :rows="8" active />
    </div>

    <!-- 表单区域 -->
    <div v-else-if="formData.id" class="edit-form-container">
      <a-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
          class="edit-form"
      >
        <!-- 状态提示条 -->
        <div class="status-bar" :class="statusBarClass">
          <div class="status-bar__left">
            <HeritageStatusTag
                :status="formData.status"
                :status-name="formData.statusName"
                show-icon
            />
            <span class="status-bar__text">{{ statusBarText }}</span>
          </div>
          <div class="status-bar__right" v-if="showMetaInfo">
            <span>发布人：{{ formData.creatorName }}</span>
            <span class="meta-divider">·</span>
            <span>发布时间：{{ formatDate(formData.createTime) }}</span>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="form-section">
          <div class="form-section__title">
            <i class="fas fa-file-alt"></i>
            基本信息
          </div>
          <div class="form-section__content">
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
                  placeholder="请输入瑰宝概要（500字以内）"
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
          </div>
        </div>

        <!-- 状态管理 -->
        <div class="form-section" v-if="canEditStatus">
          <div class="form-section__title">
            <i class="fas fa-cog"></i>
            状态管理
          </div>
          <div class="form-section__content">
            <a-form-item label="作品状态" name="status">
              <a-radio-group v-model:value="formData.status" :disabled="!canEditStatus">
                <a-radio :value="0">草稿</a-radio>
                <a-radio :value="1" v-if="!isAdmin">待审核</a-radio>
                <a-radio :value="2" v-if="isAdmin">已发布</a-radio>
                <a-radio :value="3" v-if="isAdmin">已下架</a-radio>
              </a-radio-group>
              <div class="form-tip">
                <i class="fas fa-info-circle"></i>
                <span v-if="!canEditStatus">当前状态不允许修改</span>
                <span v-else-if="isAdmin">管理员可以修改作品状态（草稿/已发布/下架）</span>
                <span v-else>当前状态：{{ formData.statusName }}</span>
              </div>
            </a-form-item>
          </div>
        </div>

        <!-- 封面图片 -->
        <div class="form-section">
          <div class="form-section__title">
            <i class="fas fa-image"></i>
            封面图片
          </div>
          <div class="form-section__content">
            <a-form-item label="封面上传" name="cover">
              <HeritageCoverUpload
                  v-model="coverFileId"
                  v-model:cover-image="coverImage"
                  business-type="HERITAGE_ITEM"
                  :business-id="formData.id"
                  :use-strategy-c="!!formData.id"
                  :max-size="10"
                  @upload-success="handleCoverUploadSuccess"
                  @remove="handleCoverRemove"
              />
              <div class="form-tip" style="margin-top: 8px;">
                <i class="fas fa-info-circle"></i>
                建议上传1:1比例（方形）的图片，以获得最佳显示效果
              </div>
            </a-form-item>
          </div>
        </div>

        <!-- 媒体文件 -->
        <div class="form-section">
          <div class="form-section__title">
            <i class="fas fa-photo-video"></i>
            媒体文件
          </div>
          <div class="form-section__content">
            <a-form-item label="文件上传" name="media">
              <HeritageMediaUpload
                  v-model="uploadedMedia"
                  media-type="ALL"
                  business-type="HERITAGE_ITEM"
                  business-field="media"
                  :business-id="formData.id"
                  :max-count="20"
                  :max-size="100"
                  :readonly="false"
                  :use-strategy-c="!!formData.id"
                  @upload-success="handleMediaUploadSuccess"
                  @remove="handleMediaRemove"
              />
            </a-form-item>
          </div>
        </div>
      </a-form>
    </div>

    <!-- 未找到 -->
    <div v-else class="not-found">
      <a-empty description="未找到该作品信息" />
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="edit-footer">
        <a-button @click="handleCancel" class="cancel-btn">
          取消
        </a-button>
        <div class="footer-right">
          <a-button @click="handleSaveDraft" :loading="submitting" v-if="canSaveDraft" class="draft-btn">
            保存草稿
          </a-button>
          <a-button type="primary" @click="handleSubmit" :loading="submitting" class="submit-btn">
            {{ submitButtonText }}
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  getHeritageItemDetail,
  updateHeritageItem,
  HERITAGE_CATEGORIES
} from '@/api/HeritageApi'
import HeritageStatusTag from '@/components/common/HeritageStatusTag.vue'
import HeritageMediaUpload from '@/components/common/HeritageMediaUpload.vue'
import HeritageCoverUpload from '@/components/common/HeritageCoverUpload.vue'
import { formatLocalDate } from '@/utils/dateUtils'
import { useUserStore } from '@/store/user'

// ========== 组件属性 ==========
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  itemId: {
    type: [String, Number],
    default: null
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
const loading = ref(false)
const submitting = ref(false)
const uploadedMedia = ref([])
const originalMediaIds = ref([]) // 原始的媒体ID列表
const coverFileId = ref(null)
const coverImage = ref('')

const formData = reactive({
  id: '',
  title: '',
  category: '',
  region: '',
  summary: '',
  description: '',
  status: 0,
  statusName: '',
  creatorName: '',
  creatorId: '',
  createTime: ''
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

const isOwner = computed(() => {
  return formData.creatorId === userStore.userInfo?.id?.toString()
})

const canEdit = computed(() => {
  return isAdmin.value || isOwner.value
})

const canEditStatus = computed(() => {
  // 管理员可以修改任何状态，普通用户只能修改草稿和待审状态
  if (isAdmin.value) {
    return true
  }
  return canEdit.value && (formData.status === 0 || formData.status === 1)
})

const canSaveDraft = computed(() => {
  return canEdit.value && formData.status !== 0
})

const showMetaInfo = computed(() => {
  return props.mode === 'admin'
})

const modalTitle = computed(() => {
  return isAdmin.value ? '编辑古蜀瑰宝' : '编辑我的瑰宝'
})

const submitButtonText = computed(() => {
  if (formData.status === 0) return '保存'
  if (isAdmin.value) return '保存更改'
  return '提交审核'
})

const statusBarClass = computed(() => {
  const classMap = {
    0: 'status-draft',
    1: 'status-pending',
    2: 'status-published',
    3: 'status-offline'
  }
  return classMap[formData.status] || ''
})

const statusBarText = computed(() => {
  const textMap = {
    0: '当前为草稿状态，保存后仅自己可见',
    1: '已提交审核，等待管理员审核',
    2: '作品已发布，前台用户可见',
    3: '作品已下架，前台用户不可见'
  }
  return textMap[formData.status] || ''
})

// ========== 监听器 ==========
watch(() => props.open, (newVal) => {
  visible.value = newVal
  if (newVal && props.itemId) {
    fetchItemDetail()
  }
})

watch(visible, (newVal) => {
  emit('update:open', newVal)
})

// ========== 方法 ==========

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return formatLocalDate(new Date(dateStr))
  } catch (error) {
    return ''
  }
}

/**
 * 获取作品详情
 */
function fetchItemDetail() {
  if (!props.itemId) {
    message.error('作品ID不能为空')
    handleCancel()
    return
  }

  loading.value = true

  getHeritageItemDetail({ itemId: props.itemId }, {
    onSuccess: (res) => {
      // 权限检查
      if (!isAdmin.value && res.creatorId !== userStore.userInfo?.id?.toString()) {
        message.error('您没有权限编辑此作品')
        handleCancel()
        return
      }

      Object.assign(formData, res)
      loading.value = false

      console.log('编辑页面 - 获取到的作品详情:', res)
      console.log('编辑页面 - formData.id:', formData.id)

      // 加载封面信息
      if (res.coverFileId && res.coverImage) {
        coverFileId.value = res.coverFileId
        coverImage.value = res.coverImage
        console.log('成功加载封面文件:', res.coverImage)
      } else {
        coverFileId.value = null
        coverImage.value = ''
      }

      // 直接从作品详情中获取媒体文件列表
      if (res.mediaList && res.mediaList.length > 0) {
        uploadedMedia.value = convertMediaListFormat(res.mediaList)
        originalMediaIds.value = res.mediaList.map(m => m.id)
        console.log(`成功加载 ${res.mediaList.length} 个媒体文件`)
      } else {
        uploadedMedia.value = []
        originalMediaIds.value = []
      }
    },
    onError: (error) => {
      message.error('获取作品详情失败')
      loading.value = false
    }
  })
}

/**
 * 转换媒体数据格式
 * 将后端的文件信息转换为 HeritageMediaUpload 组件期望的格式
 * 现在直接从 sys_file_info 表获取数据
 */
function convertMediaListFormat(backendMediaList) {
  console.log('原始媒体数据:', backendMediaList)

  const convertedList = backendMediaList.map((media, index) => ({
    id: media.id, // 文件ID
    fileId: media.id, // 文件ID
    filePath: media.filePath, // 文件路径
    originalName: media.originalName, // 原始文件名
    fileSize: media.fileSize, // 文件大小
    type: media.fileType || media.type, // 媒体类型 (IMG, VIDEO, AUDIO, PDF)
    sort: index, // 使用索引作为排序
    businessId: media.businessId || formData.id, // 业务ID（作品ID）
    businessType: media.businessType || 'HERITAGE_ITEM' // 业务类型
  }))

  console.log('转换后的媒体数据:', convertedList)
  return convertedList
}

/**
 * 取消操作
 */
function handleCancel() {
  visible.value = false
  resetForm()
}

/**
 * 重置表单
 */
function resetForm() {
  Object.assign(formData, {
    id: '',
    title: '',
    category: '',
    region: '',
    summary: '',
    description: '',
    status: 0,
    statusName: '',
    creatorName: '',
    creatorId: '',
    createTime: ''
  })
  uploadedMedia.value = []
  originalMediaIds.value = []
  coverFileId.value = null
  coverImage.value = ''
  if (formRef.value) {
    formRef.value.resetFields()
  }
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
  if (!canEdit.value) {
    message.error('您没有权限编辑此作品')
    return
  }

  formRef.value.validate().then(() => {
    submitForm()
  }).catch(() => {
    message.warning('请填写完整的表单信息')
  })
}

/**
 * 提交表单数据
 */
function submitForm() {
  submitting.value = true

  const updateData = {
    itemId: formData.id,
    title: formData.title,
    category: formData.category,
    region: formData.region,
    summary: formData.summary,
    description: formData.description,
    status: formData.status,
    coverFileId: coverFileId.value // 添加封面文件ID
  }

  const successMessage = getSuccessMessage()

  updateHeritageItem(updateData, {
    successMsg: successMessage,
    onSuccess: (res) => {
      // 由于媒体文件直接通过 sys_file_info 表关联，不需要额外处理
      submitting.value = false
      visible.value = false
      emit('success')
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
    return '作品更新成功'
  }

  return '作品提交成功，等待审核'
}

/**
 * 封面上传成功
 */
function handleCoverUploadSuccess(cover) {
  console.log('封面上传成功:', cover)
}

/**
 * 封面移除
 */
function handleCoverRemove(cover) {
  console.log('封面已移除', cover)
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
  console.log('编辑页面 - 媒体移除:', media, index)

  // 从 uploadedMedia 列表中移除对应的文件
  if (index >= 0 && index < uploadedMedia.value.length) {
    uploadedMedia.value.splice(index, 1)
    console.log('编辑页面 - 文件已从列表中移除，剩余文件数:', uploadedMedia.value.length)
  }

  // 如果需要，也可以从 originalMediaIds 中移除
  if (media.id && originalMediaIds.value.includes(media.id)) {
    const originalIndex = originalMediaIds.value.indexOf(media.id)
    if (originalIndex > -1) {
      originalMediaIds.value.splice(originalIndex, 1)
      console.log('编辑页面 - 文件已从原始列表中移除')
    }
  }
}

</script>

<style scoped>
:deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0;
}

:deep(.ant-modal-footer) {
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
}

.loading-container {
  padding: 24px;
}

.edit-form-container {
  padding: 20px 24px;
}

.edit-form {
  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
}

/* 状态提示条 */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid;
}

.status-bar__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-bar__text {
  font-size: 13px;
  color: #606266;
}

.status-bar__right {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-divider {
  color: #dcdfe6;
}

.status-draft {
  background: #fafafa;
  border-color: #ebeef5;
}

.status-pending {
  background: #fdf6ec;
  border-color: #faecd8;
}

.status-published {
  background: #f0f9eb;
  border-color: #e1f3d8;
}

.status-offline {
  background: #fef0f0;
  border-color: #fde2e2;
}

/* 表单分区 */
.form-section {
  margin-bottom: 24px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.form-section__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-section__title i {
  color: #409eff;
  font-size: 14px;
}

.form-section__content {
  padding: 20px 24px 4px;
}

/* 表单提示 */
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

/* 底部按钮 */
.edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.cancel-btn {
  min-width: 72px;
}

.draft-btn {
  min-width: 88px;
}

.submit-btn {
  min-width: 100px;
}

.not-found {
  text-align: center;
  padding: 40px 20px;
}

@media (max-width: 768px) {
  :deep(.ant-modal) {
    margin: 0;
    max-width: 100vw;
    top: 0;
  }

  :deep(.ant-modal-content) {
    border-radius: 0;
  }

  .status-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .status-bar__right {
    flex-wrap: wrap;
  }
}
</style>
