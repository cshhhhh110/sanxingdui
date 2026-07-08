<template>
  <a-modal
    v-model:open="visible"
    width="880px"
    wrap-class-name="minimal-modal"
    :footer="null"
    @cancel="handleCancel"
  >
    <template #title>
      <div class="modal-top">
        <span class="modal-top__title">瑰宝详情</span>
        <div v-if="currentItem" class="modal-top__actions">
          <a-button v-if="canEdit" size="small" class="btn-minimal-ghost" @click="handleEdit">编辑</a-button>
          <a-button v-if="canPublish" size="small" class="btn-minimal-primary" @click="handlePublish">发布</a-button>
          <a-button v-if="canOffline" size="small" class="btn-minimal-ghost" @click="handleOffline">下架</a-button>
          <a-button v-if="canDelete" size="small" danger @click="handleDelete">删除</a-button>
        </div>
      </div>
    </template>

    <div v-if="itemLoading" class="state-block">
      <a-skeleton :paragraph="{ rows: 8 }" active />
    </div>

    <div v-else-if="currentItem" class="detail-body">
      <header class="detail-hero">
        <div class="detail-hero__cover">
          <img v-if="currentItem.coverImage" :src="currentItem.coverImage" :alt="currentItem.title" />
          <span v-else class="detail-hero__placeholder">无封面</span>
        </div>
        <div class="detail-hero__info">
          <h2 class="detail-hero__name">{{ currentItem.title }}</h2>
          <div class="detail-hero__meta">
            <HeritageStatusTag
              :status="currentItem.status"
              :status-name="currentItem.statusName"
              show-icon
            />
            <span class="meta-sep">/</span>
            <span>{{ currentItem.category }}</span>
            <span class="meta-sep">/</span>
            <span>{{ currentItem.region || '未知地区' }}</span>
          </div>
        </div>
      </header>

      <dl class="meta-grid">
        <div class="meta-grid__item">
          <dt>发布人</dt>
          <dd>{{ currentItem.creatorName || '—' }}</dd>
        </div>
        <div class="meta-grid__item">
          <dt>发布时间</dt>
          <dd class="mono">{{ currentItem.publishTime ? formatDate(currentItem.publishTime) : '—' }}</dd>
        </div>
        <div class="meta-grid__item">
          <dt>瑰宝类别</dt>
          <dd>
            <span class="cell-tag">{{ currentItem.category }}</span>
          </dd>
        </div>
      </dl>

      <section v-if="currentItem.summary" class="detail-block">
        <h3 class="detail-block__title">概要</h3>
        <p class="detail-block__text detail-block__text--muted">{{ currentItem.summary }}</p>
      </section>

      <section v-if="currentItem.description" class="detail-block">
        <h3 class="detail-block__title">详细描述</h3>
        <div class="detail-block__text" v-html="formatDescription(currentItem.description)" />
      </section>

      <section class="detail-block">
        <div class="detail-block__head">
          <h3 class="detail-block__title">
            媒体文件
            <span class="count-badge">{{ mediaList.length }}</span>
          </h3>
          <a-button v-if="canEdit" size="small" class="btn-minimal-ghost" @click="showMediaManager = true">
            管理媒体
          </a-button>
        </div>

        <div v-if="mediaList.length > 0" class="media-grid">
          <article
            v-for="media in mediaList"
            :key="media.id"
            class="media-card"
            @click="handlePreviewMedia(media)"
          >
            <div class="media-card__preview">
              <img
                v-if="media.type === 'IMG'"
                :src="media.filePath"
                :alt="media.originalName"
              />
              <span v-else class="media-card__type">{{ getMediaTypeName(media.type) }}</span>
            </div>
            <div class="media-card__info">
              <div class="media-card__name" :title="media.originalName">{{ media.originalName }}</div>
              <div class="media-card__meta">
                <span>{{ getMediaTypeName(media.type) }}</span>
                <span>{{ formatFileSize(media.fileSize) }}</span>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="state-empty">暂无媒体文件</div>
      </section>

      <section
        v-if="currentItem.inheritorList && currentItem.inheritorList.length > 0"
        class="detail-block"
      >
        <h3 class="detail-block__title">
          关联传承人
          <span class="count-badge">{{ currentItem.inheritorList.length }}</span>
        </h3>
        <div class="inheritor-grid">
          <article
            v-for="inheritor in currentItem.inheritorList"
            :key="inheritor.id"
            class="inheritor-card"
          >
            <div class="inheritor-card__avatar">
              <img v-if="inheritor.avatarPath" :src="inheritor.avatarPath" :alt="inheritor.name" />
              <span v-else>{{ inheritor.name?.charAt(0) || '?' }}</span>
            </div>
            <div>
              <div class="inheritor-card__name">{{ inheritor.name }}</div>
              <div class="inheritor-card__sub">{{ inheritor.title || '—' }}</div>
              <div class="inheritor-card__sub">{{ inheritor.region || '—' }}</div>
            </div>
          </article>
        </div>
      </section>

      <footer class="detail-footer">
        <a-button class="btn-minimal-ghost" @click="handleCancel">关闭</a-button>
      </footer>
    </div>

    <div v-else class="state-block">
      <a-empty description="未找到该作品信息" />
    </div>

    <a-modal
      v-model:open="showMediaManager"
      title="媒体文件管理"
      width="80%"
      wrap-class-name="minimal-modal"
      :mask-closable="false"
      ok-text="保存"
      cancel-text="关闭"
      @ok="handleSaveMedia"
      @cancel="showMediaManager = false"
    >
      <HeritageMediaUpload
        v-model="mediaList"
        media-type="ALL"
        :readonly="!canEdit"
        @upload-success="handleMediaUploadSuccess"
        @remove="handleMediaRemove"
      />
    </a-modal>

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
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  getHeritageItemDetail,
  publishHeritageItem,
  offlineHeritageItem,
  deleteHeritageItem
} from '@/api/HeritageApi'
import HeritageStatusTag from '@/components/common/HeritageStatusTag.vue'
import HeritageMediaUpload from '@/components/common/HeritageMediaUpload.vue'
import { formatLocalDate } from '@/utils/dateUtils'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const props = defineProps({
  open: { type: Boolean, default: false },
  itemId: { type: [String, Number], default: null }
})

const emit = defineEmits(['update:open', 'edit', 'success'])

const visible = ref(false)
const itemLoading = ref(false)
const currentItem = ref(null)
const showMediaManager = ref(false)
const previewVisible = ref(false)
const previewMedia = ref(null)
const mediaList = ref([])

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

const isAdmin = computed(() => userStore.userInfo?.userType === 'ADMIN')

const canEdit = computed(() => {
  if (!currentItem.value) return false
  if (isAdmin.value) return true
  return currentItem.value.status === 0 || currentItem.value.status === 1
})

const canPublish = computed(() => {
  if (!currentItem.value) return false
  if (isAdmin.value) return currentItem.value.status !== 2
  return currentItem.value.status === 0 || currentItem.value.status === 1
})

const canOffline = computed(() => {
  if (!currentItem.value) return false
  if (isAdmin.value) return currentItem.value.status === 2
  return false
})

const canDelete = computed(() => {
  if (!currentItem.value) return false
  if (isAdmin.value) return currentItem.value.status === 0 || currentItem.value.status === 3
  return currentItem.value.status === 0
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return formatLocalDate(new Date(dateStr))
  } catch {
    return ''
  }
}

function formatDescription(description) {
  if (!description) return ''
  return description.replace(/\n/g, '<br>')
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

function fetchItemDetail() {
  if (!props.itemId) {
    message.error('作品ID不能为空')
    handleCancel()
    return
  }

  itemLoading.value = true

  getHeritageItemDetail(
    { itemId: props.itemId },
    {
      onSuccess: (res) => {
        currentItem.value = res
        itemLoading.value = false
        mediaList.value = res.mediaList?.length ? res.mediaList : []
      },
      onError: () => {
        message.error('获取作品详情失败')
        itemLoading.value = false
      }
    }
  )
}

function handleCancel() {
  visible.value = false
  currentItem.value = null
  mediaList.value = []
}

function handleEdit() {
  emit('edit', currentItem.value)
}

function handlePublish() {
  Modal.confirm({
    title: '发布确认',
    content: `确定要发布「${currentItem.value.title}」？`,
    onOk() {
      publishHeritageItem(
        { itemId: currentItem.value.id },
        {
          successMsg: '发布成功',
          onSuccess: () => {
            currentItem.value.status = 2
            currentItem.value.statusName = '已发布'
            emit('success')
          }
        }
      )
    }
  })
}

function handleOffline() {
  Modal.confirm({
    title: '下架确认',
    content: `确定要下架「${currentItem.value.title}」？`,
    onOk() {
      offlineHeritageItem(
        { itemId: currentItem.value.id },
        {
          successMsg: '下架成功',
          onSuccess: () => {
            currentItem.value.status = 3
            currentItem.value.statusName = '下架'
            emit('success')
          }
        }
      )
    }
  })
}

function handleDelete() {
  Modal.confirm({
    title: '删除确认',
    content: `确定要删除「${currentItem.value.title}」？此操作不可恢复。`,
    okType: 'danger',
    onOk() {
      deleteHeritageItem(
        { itemId: currentItem.value.id },
        {
          successMsg: '删除成功',
          onSuccess: () => {
            visible.value = false
            emit('success')
          }
        }
      )
    }
  })
}

function handlePreviewMedia(media) {
  previewMedia.value = media
  previewVisible.value = true
}

function handleMediaUploadSuccess() {
  message.success('媒体上传成功')
}

function handleMediaRemove() {
  message.success('媒体移除成功')
}

function handleSaveMedia() {
  showMediaManager.value = false
  message.success('媒体更改已保存')
}
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

.modal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
  padding-right: 24px;
}

.modal-top__title {
  font-size: 15px;
  font-weight: 600;
  color: $black;
}

.modal-top__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-hero {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid $black;
}

.detail-hero__cover {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  border: 1px solid $border;
  background: $bg;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.detail-hero__placeholder {
  font-size: 11px;
  color: $muted;
}

.detail-hero__name {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: $black;
  line-height: 1.3;
}

.detail-hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: $muted;
}

.meta-sep {
  color: $border;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: $border;
  border: 1px solid $border;
  margin: 0;
}

.meta-grid__item {
  background: $white;
  padding: 14px 16px;

  dt {
    margin: 0 0 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $muted;
  }

  dd {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: $black;
  }
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
}

.cell-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  color: $accent;
  border: 1px solid $accent;
  background: rgba($accent, 0.08);
}

.detail-block {
  border-top: 1px solid $border;
  padding-top: 16px;
}

.detail-block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-block__title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $black;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  font-size: 11px;
  font-weight: 500;
  color: $muted;
  border: 1px solid $border;
  padding: 1px 8px;
}

.detail-block__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: $black;

  &--muted {
    color: $muted;
    padding: 12px 14px;
    background: $bg;
    border-left: 2px solid $accent;
  }
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.media-card {
  border: 1px solid $border;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: $accent;
  }
}

.media-card__preview {
  height: 100px;
  background: $bg;
  display: flex;
  align-items: center;
  justify-content: center;
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

.media-card__info {
  padding: 10px;
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
  font-size: 11px;
  color: $muted;
}

.inheritor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.inheritor-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid $border;
}

.inheritor-card__avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border: 1px solid $border;
  background: $bg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: $accent;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.inheritor-card__name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.inheritor-card__sub {
  font-size: 12px;
  color: $muted;
}

.detail-footer {
  padding-top: 8px;
  border-top: 1px solid $border;
  display: flex;
  justify-content: flex-end;
}

.state-block,
.state-empty {
  padding: 24px;
  text-align: center;
  color: $muted;
  font-size: 13px;
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

@media (max-width: 768px) {
  .modal-top {
    flex-direction: column;
    align-items: flex-start;
    padding-right: 0;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .detail-hero {
    flex-direction: column;
  }
}
</style>

<style lang="scss">
@use '@/styles/backend-minimal.scss' as *;

.detail-body {
  .btn-minimal-primary,
  .btn-minimal-ghost {
    height: 28px;
    padding: 0 12px;
    font-size: 12px;
  }
}
</style>
