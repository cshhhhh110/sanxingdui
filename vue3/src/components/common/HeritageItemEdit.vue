<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    width="720px"
    wrap-class-name="minimal-modal"
    :mask-closable="false"
    @cancel="handleCancel"
  >
    <div v-if="loading" class="state-loading">
      <a-skeleton :paragraph="{ rows: 8 }" active />
    </div>

    <div v-else-if="formData.id" class="minimal-form-shell">
      <div class="minimal-status-bar">
        <div class="minimal-status-bar__left">
          <HeritageStatusTag
            :status="formData.status"
            :status-name="formData.statusName"
            show-icon
          />
          <span class="minimal-status-bar__text">{{ statusBarText }}</span>
        </div>
        <div v-if="showMetaInfo" class="minimal-status-bar__meta">
          发布人：{{ formData.creatorName }} · {{ formatDate(formData.createTime) }}
        </div>
      </div>

      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <section class="form-section">
          <h4 class="form-section__title">基本信息</h4>
          <div class="form-section__body">
            <a-form-item label="瑰宝名称" name="title">
              <a-input
                v-model:value="formData.title"
                placeholder="请输入瑰宝名称"
                :maxlength="200"
                show-count
              />
            </a-form-item>

            <div class="form-row-2">
              <a-form-item label="瑰宝类别" name="category">
                <a-select v-model:value="formData.category" placeholder="请选择类别">
                  <a-select-option
                    v-for="category in HERITAGE_CATEGORIES"
                    :key="category"
                    :value="category"
                  >
                    {{ category }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="所属地区" name="region">
                <a-input
                  v-model:value="formData.region"
                  placeholder="请输入地区"
                  :maxlength="100"
                />
              </a-form-item>
            </div>

            <a-form-item label="瑰宝概要" name="summary">
              <a-textarea
                v-model:value="formData.summary"
                :rows="3"
                placeholder="500字以内"
                :maxlength="500"
                show-count
              />
            </a-form-item>

            <a-form-item label="详细描述" name="description">
              <a-textarea
                v-model:value="formData.description"
                :rows="5"
                placeholder="详细描述"
                :maxlength="5000"
                show-count
              />
            </a-form-item>
          </div>
        </section>

        <section v-if="canEditStatus" class="form-section">
          <h4 class="form-section__title">状态管理</h4>
          <div class="form-section__body">
            <a-form-item label="作品状态" name="status">
              <a-radio-group v-model:value="formData.status" :disabled="!canEditStatus">
                <a-radio :value="0">草稿</a-radio>
                <a-radio v-if="!isAdmin" :value="1">待审核</a-radio>
                <a-radio v-if="isAdmin" :value="2">已发布</a-radio>
                <a-radio v-if="isAdmin" :value="3">已下架</a-radio>
              </a-radio-group>
              <p class="form-tip">
                <template v-if="!canEditStatus">当前状态不允许修改</template>
                <template v-else-if="isAdmin">管理员可修改作品状态</template>
                <template v-else>当前状态：{{ formData.statusName }}</template>
              </p>
            </a-form-item>
          </div>
        </section>

        <section class="form-section">
          <h4 class="form-section__title">封面图片</h4>
          <div class="form-section__body">
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
            <p class="form-tip">建议 1:1 方形图片</p>
          </div>
        </section>

        <section class="form-section">
          <h4 class="form-section__title">媒体文件</h4>
          <div class="form-section__body">
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
          </div>
        </section>
      </a-form>
    </div>

    <div v-else class="state-empty">
      <a-empty description="未找到该作品信息" />
    </div>

    <template #footer>
      <div v-if="formData.id" class="modal-footer-row">
        <a-button class="btn-minimal-ghost" @click="handleCancel">取消</a-button>
        <div class="modal-footer-row__right">
          <a-button
            v-if="canSaveDraft"
            class="btn-minimal-ghost"
            :loading="submitting"
            @click="handleSaveDraft"
          >
            保存草稿
          </a-button>
          <a-button
            type="primary"
            class="btn-minimal-primary"
            :loading="submitting"
            @click="handleSubmit"
          >
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
import { getHeritageItemDetail, updateHeritageItem, HERITAGE_CATEGORIES } from '@/api/HeritageApi'
import HeritageStatusTag from '@/components/common/HeritageStatusTag.vue'
import HeritageMediaUpload from '@/components/common/HeritageMediaUpload.vue'
import HeritageCoverUpload from '@/components/common/HeritageCoverUpload.vue'
import { formatLocalDate } from '@/utils/dateUtils'
import { useUserStore } from '@/store/user'

const props = defineProps({
  open: { type: Boolean, default: false },
  itemId: { type: [String, Number], default: null },
  mode: {
    type: String,
    default: 'admin',
    validator: (v) => ['admin', 'user'].includes(v)
  }
})

const emit = defineEmits(['update:open', 'success'])

const userStore = useUserStore()
const visible = ref(false)
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)
const uploadedMedia = ref([])
const originalMediaIds = ref([])
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
  category: [{ required: true, message: '请选择作品类别', trigger: 'change' }],
  region: [{ max: 100, message: '地区长度不能超过 100 个字符', trigger: 'blur' }]
}

const isAdmin = computed(() => props.mode === 'admin' || userStore.isAdmin)
const isOwner = computed(() => formData.creatorId === userStore.userInfo?.id?.toString())
const canEdit = computed(() => isAdmin.value || isOwner.value)
const canEditStatus = computed(() => {
  if (isAdmin.value) return true
  return canEdit.value && (formData.status === 0 || formData.status === 1)
})
const canSaveDraft = computed(() => canEdit.value && formData.status !== 0)
const showMetaInfo = computed(() => props.mode === 'admin')
const modalTitle = computed(() => (isAdmin.value ? '编辑瑰宝' : '编辑我的瑰宝'))
const submitButtonText = computed(() => {
  if (formData.status === 0) return '保存'
  if (isAdmin.value) return '保存更改'
  return '提交审核'
})

const statusBarText = computed(() => {
  const map = {
    0: '草稿状态，仅自己可见',
    1: '已提交审核，等待管理员处理',
    2: '已发布，前台可见',
    3: '已下架，前台不可见'
  }
  return map[formData.status] || ''
})

watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal
    if (newVal && props.itemId) fetchItemDetail()
  }
)

watch(visible, (newVal) => {
  emit('update:open', newVal)
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return formatLocalDate(new Date(dateStr))
  } catch {
    return ''
  }
}

function fetchItemDetail() {
  if (!props.itemId) {
    message.error('作品ID不能为空')
    handleCancel()
    return
  }

  loading.value = true

  getHeritageItemDetail(
    { itemId: props.itemId },
    {
      onSuccess: (res) => {
        if (!isAdmin.value && res.creatorId !== userStore.userInfo?.id?.toString()) {
          message.error('您没有权限编辑此作品')
          handleCancel()
          return
        }

        Object.assign(formData, res)
        loading.value = false

        if (res.coverFileId && res.coverImage) {
          coverFileId.value = res.coverFileId
          coverImage.value = res.coverImage
        } else {
          coverFileId.value = null
          coverImage.value = ''
        }

        if (res.mediaList?.length) {
          uploadedMedia.value = convertMediaListFormat(res.mediaList)
          originalMediaIds.value = res.mediaList.map((m) => m.id)
        } else {
          uploadedMedia.value = []
          originalMediaIds.value = []
        }
      },
      onError: () => {
        message.error('获取作品详情失败')
        loading.value = false
      }
    }
  )
}

function convertMediaListFormat(backendMediaList) {
  return backendMediaList.map((media, index) => ({
    id: media.id,
    fileId: media.id,
    filePath: media.filePath,
    originalName: media.originalName,
    fileSize: media.fileSize,
    type: media.fileType || media.type,
    sort: index,
    businessId: media.businessId || formData.id,
    businessType: media.businessType || 'HERITAGE_ITEM'
  }))
}

function handleCancel() {
  visible.value = false
  resetForm()
}

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
  formRef.value?.resetFields()
}

function handleSaveDraft() {
  formData.status = 0
  handleSubmit()
}

function handleSubmit() {
  if (!canEdit.value) {
    message.error('您没有权限编辑此作品')
    return
  }

  formRef.value
    .validate()
    .then(() => submitForm())
    .catch(() => message.warning('请填写完整的表单信息'))
}

function submitForm() {
  submitting.value = true

  updateHeritageItem(
    {
      itemId: formData.id,
      title: formData.title,
      category: formData.category,
      region: formData.region,
      summary: formData.summary,
      description: formData.description,
      status: formData.status,
      coverFileId: coverFileId.value
    },
    {
      successMsg: getSuccessMessage(),
      onSuccess: () => {
        submitting.value = false
        visible.value = false
        emit('success')
      },
      onError: () => {
        submitting.value = false
      }
    }
  )
}

function getSuccessMessage() {
  if (formData.status === 0) return '草稿保存成功'
  if (isAdmin.value) return '作品更新成功'
  return '作品提交成功，等待审核'
}

function handleCoverUploadSuccess() {}
function handleCoverRemove() {}
function handleMediaUploadSuccess() {}

function handleMediaRemove(media, index) {
  if (index >= 0 && index < uploadedMedia.value.length) {
    uploadedMedia.value.splice(index, 1)
  }
  if (media.id && originalMediaIds.value.includes(media.id)) {
    const i = originalMediaIds.value.indexOf(media.id)
    if (i > -1) originalMediaIds.value.splice(i, 1)
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/backend-minimal.scss' as *;

.state-loading,
.state-empty {
  padding: 24px;
}

.modal-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  &__right {
    display: flex;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }

  .modal-footer-row {
    flex-direction: column;
    gap: 10px;

    &__right {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>

<style lang="scss">
@use '@/styles/backend-minimal.scss' as *;
</style>
