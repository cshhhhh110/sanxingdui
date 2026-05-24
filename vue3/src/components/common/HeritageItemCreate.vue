<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    width="720px"
    wrap-class-name="minimal-modal"
    :mask-closable="false"
    @cancel="handleCancel"
  >
    <div class="minimal-form-shell">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
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

            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status">
                <a-radio :value="0">保存为草稿</a-radio>
                <a-radio v-if="!isAdmin" :value="1">提交审核</a-radio>
                <a-radio v-if="isAdmin" :value="2">直接发布</a-radio>
              </a-radio-group>
              <p v-if="isAdmin" class="form-tip">管理员创建的作品可直接发布，无需审核</p>
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
              :business-id="businessUUID"
              :use-strategy-c="false"
              :max-size="10"
              @upload-success="handleCoverUploadSuccess"
              @remove="handleCoverRemove"
            />
            <p class="form-tip">建议 1:1 方形图片，展示效果更佳</p>
          </div>
        </section>

        <section class="form-section">
          <h4 class="form-section__title">媒体文件</h4>
          <div class="form-section__body">
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
          </div>
        </section>
      </a-form>
    </div>

    <template #footer>
      <div class="modal-footer-row">
        <a-button class="btn-minimal-ghost" @click="handleCancel">取消</a-button>
        <div class="modal-footer-row__right">
          <a-button class="btn-minimal-ghost" :loading="submitting" @click="handleSaveDraft">
            保存草稿
          </a-button>
          <a-button type="primary" class="btn-minimal-primary" :loading="submitting" @click="handleSubmit">
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
import { createHeritageItem, HERITAGE_CATEGORIES } from '@/api/HeritageApi'
import HeritageMediaUpload from '@/components/common/HeritageMediaUpload.vue'
import HeritageCoverUpload from '@/components/common/HeritageCoverUpload.vue'
import { generateBusinessUUID, BUSINESS_TYPES } from '@/utils/uuidUtils'
import { useUserStore } from '@/store/user'

const props = defineProps({
  open: { type: Boolean, default: false },
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
const submitting = ref(false)
const uploadedMedia = ref([])
const coverFileId = ref(null)
const coverImage = ref('')
const businessUUID = ref('')

const formData = reactive({
  title: '',
  category: '',
  region: '',
  summary: '',
  description: '',
  status: 0
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

const modalTitle = computed(() => (isAdmin.value ? '新增瑰宝' : '发布我的瑰宝'))

const submitButtonText = computed(() => {
  if (formData.status === 0) return '保存'
  if (isAdmin.value) return '发布作品'
  return '提交审核'
})

watch(
  () => props.open,
  (newVal) => {
    visible.value = newVal
    if (newVal) resetForm()
  }
)

watch(visible, (newVal) => {
  emit('update:open', newVal)
})

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
  formRef.value?.resetFields()
}

function handleCancel() {
  visible.value = false
}

function handleSaveDraft() {
  formData.status = 0
  handleSubmit()
}

function handleSubmit() {
  formRef.value
    .validate()
    .then(() => submitForm())
    .catch(() => message.warning('请填写完整的表单信息'))
}

function submitForm() {
  submitting.value = true

  let businessId = businessUUID.value || generateBusinessUUID(BUSINESS_TYPES.HERITAGE_ITEM)

  if (coverImage.value && uploadedMedia.value.length > 0) {
    businessId = uploadedMedia.value[0].businessId
  } else if (coverImage.value) {
    businessId = businessUUID.value
  } else if (uploadedMedia.value.length > 0) {
    businessId = uploadedMedia.value[0].businessId
  }

  const createData = {
    ...formData,
    id: businessId,
    coverFileId: coverFileId.value
  }

  createHeritageItem(createData, {
    successMsg: getSuccessMessage(),
    onSuccess: () => {
      submitting.value = false
      visible.value = false
      emit('success')
      window.location.reload()
    },
    onError: () => {
      submitting.value = false
    }
  })
}

function getSuccessMessage() {
  if (formData.status === 0) return '草稿保存成功'
  if (isAdmin.value) return formData.status === 2 ? '作品发布成功' : '作品创建成功'
  return '作品提交成功，等待审核'
}

function handleCoverUploadSuccess(data) {
  if (data.businessId && !businessUUID.value) {
    businessUUID.value = data.businessId
  }
}

function handleCoverRemove() {}

function handleMediaUploadSuccess() {}

function handleMediaRemove() {}
</script>

<style lang="scss" scoped>
@import '@/styles/backend-minimal.scss';

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
@import '@/styles/backend-minimal.scss';
</style>
