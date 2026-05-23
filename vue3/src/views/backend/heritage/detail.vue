<template>
  <a-modal
      v-model:open="visible"
      title="古蜀瑰宝详情"
      width="1000px"
      @cancel="handleCancel"
  >
    <template #title>
      <div class="modal-header">
        <span>古蜀瑰宝详情</span>
        <a-space v-if="currentItem">
          <a-button
              v-if="canEdit"
              type="primary"
              size="small"
              @click="handleEdit"
          >
            <i class="fas fa-edit"></i>
            编辑
          </a-button>
          <a-button
              v-if="canPublish"
              type="primary"
              size="small"
              @click="handlePublish"
          >
            <i class="fas fa-upload"></i>
            发布
          </a-button>
          <a-button
              v-if="canOffline"
              type="default"
              size="small"
              @click="handleOffline"
          >
            <i class="fas fa-download"></i>
            下架
          </a-button>
          <a-button
              v-if="canDelete"
              danger
              size="small"
              @click="handleDelete"
          >
            <i class="fas fa-trash"></i>
            删除
          </a-button>
        </a-space>
      </div>
    </template>

    <template #footer>
      <a-button @click="handleCancel">关闭</a-button>
    </template>

    <!-- 加载状态 -->
    <div v-if="itemLoading" class="loading-container">
      <a-skeleton :rows="8" active />
    </div>

    <!-- 作品内容 -->
    <div v-else-if="currentItem" class="content-container">
      <!-- 标题区 -->
      <div class="detail-header">
        <div class="detail-header__left">
          <div class="detail-header__cover" v-if="currentItem.coverImage">
            <img :src="currentItem.coverImage" :alt="currentItem.title" />
          </div>
          <div class="detail-header__cover no-cover" v-else>
            <i class="fas fa-image"></i>
          </div>
          <div class="detail-header__info">
            <h3 class="detail-header__title">{{ currentItem.title }}</h3>
            <div class="detail-header__meta">
              <HeritageStatusTag
                  :status="currentItem.status"
                  :status-name="currentItem.statusName"
                  show-icon
              />
              <span class="meta-divider">·</span>
              <span class="meta-text">{{ currentItem.category }}</span>
              <span class="meta-divider">·</span>
              <span class="meta-text">{{ currentItem.region || '未知地区' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 信息网格 -->
      <div class="info-grid">
        <div class="info-cell">
          <div class="info-cell__label">发布人</div>
          <div class="info-cell__value">{{ currentItem.creatorName || '-' }}</div>
        </div>

        <div class="info-cell">
          <div class="info-cell__label">发布时间</div>
          <div class="info-cell__value">{{ currentItem.publishTime ? formatDate(currentItem.publishTime) : '-' }}</div>
        </div>
        <div class="info-cell">
          <div class="info-cell__label">瑰宝类别</div>
          <div class="info-cell__value">
            <a-tag color="blue">{{ currentItem.category }}</a-tag>
          </div>
        </div>
      </div>

      <!-- 摘要区 -->
      <div class="detail-section" v-if="currentItem.summary">
        <div class="detail-section__title">瑰宝概要</div>
        <div class="detail-section__content summary-text">
          {{ currentItem.summary }}
        </div>
      </div>

      <!-- 详细描述 -->
      <div class="detail-section" v-if="currentItem.description">
        <div class="detail-section__title">详细描述</div>
        <div class="detail-section__content description-text">
          <div v-html="formatDescription(currentItem.description)"></div>
        </div>
      </div>

      <!-- 媒体文件 -->
      <div class="detail-section">
        <div class="detail-section__title">
          媒体文件
          <span class="file-count">{{ mediaList.length }} 个</span>
          <a-button
              v-if="canEdit"
              type="primary"
              size="small"
              class="manage-btn"
              @click="showMediaManager = true"
          >
            管理媒体
          </a-button>
        </div>

        <div v-if="mediaList.length > 0" class="media-grid">
          <div
              v-for="media in mediaList"
              :key="media.id"
              class="media-item"
              @click="handlePreviewMedia(media)"
          >
            <div v-if="media.type === 'IMG'" class="media-preview">
              <img :src="media.filePath" :alt="media.originalName" />
            </div>
            <div v-else-if="media.type === 'VIDEO'" class="media-preview video">
              <i class="fas fa-play-circle"></i>
              <span>{{ media.originalName }}</span>
            </div>
            <div v-else-if="media.type === 'AUDIO'" class="media-preview audio">
              <i class="fas fa-music"></i>
              <span>{{ media.originalName }}</span>
            </div>
            <div v-else-if="media.type === 'PDF'" class="media-preview pdf">
              <i class="fas fa-file-pdf"></i>
              <span>{{ media.originalName }}</span>
            </div>
            <div v-else class="media-preview file">
              <i class="fas fa-file"></i>
              <span>{{ media.originalName }}</span>
            </div>

            <div class="media-info">
              <div class="media-name" :title="media.originalName">
                {{ media.originalName }}
              </div>
              <div class="media-meta">
                <span class="media-type">{{ getMediaTypeName(media.type) }}</span>
                <span class="media-size">{{ formatFileSize(media.fileSize) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-media">
          <i class="fas fa-image"></i>
          <p>暂无媒体文件</p>
        </div>
      </div>

      <!-- 传承人信息 -->
      <div v-if="currentItem.inheritorList && currentItem.inheritorList.length > 0" class="detail-section">
        <div class="detail-section__title">
          关联传承人
          <span class="file-count">{{ currentItem.inheritorList.length }} 位</span>
        </div>

        <div class="inheritor-list">
          <div
              v-for="inheritor in currentItem.inheritorList"
              :key="inheritor.id"
              class="inheritor-item"
          >
            <div class="inheritor-avatar">
              <img v-if="inheritor.avatarPath" :src="inheritor.avatarPath" :alt="inheritor.name" />
              <i v-else class="fas fa-user"></i>
            </div>
            <div class="inheritor-info">
              <div class="inheritor-name">{{ inheritor.name }}</div>
              <div class="inheritor-title">{{ inheritor.title || '-' }}</div>
              <div class="inheritor-region">{{ inheritor.region || '-' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 未找到内容 -->
    <div v-else class="not-found">
      <a-empty description="未找到该作品信息" />
    </div>

    <!-- 媒体管理对话框 -->
    <a-modal
        v-model:open="showMediaManager"
        title="媒体文件管理"
        width="80%"
        :mask-closable="false"
    >
      <HeritageMediaUpload
          v-model="mediaList"
          media-type="ALL"
          :readonly="!canEdit"
          @upload-success="handleMediaUploadSuccess"
          @remove="handleMediaRemove"
      />

      <template #footer>
        <a-space>
          <a-button @click="showMediaManager = false">关闭</a-button>
          <a-button v-if="canEdit" type="primary" @click="handleSaveMedia">
            保存更改
          </a-button>
        </a-space>
      </template>
    </a-modal>

    <!-- 媒体预览对话框 -->
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
            class="preview-image"
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

// ========== 组件属性 ==========
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  itemId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:open', 'edit', 'success'])

// ========== 响应式数据 ==========
const visible = ref(false)
const itemLoading = ref(false)
const currentItem = ref(null)
const showMediaManager = ref(false)
const previewVisible = ref(false)
const previewMedia = ref(null)
const mediaList = ref([])

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

// ========== 计算属性 ==========
// 判断当前用户是否为管理员
const isAdmin = computed(() => {
  return userStore.userInfo?.userType === 'ADMIN'
})

// 管理员可以编辑任何状态的作品，普通用户只能编辑草稿和待审
const canEdit = computed(() => {
  if (!currentItem.value) return false
  if (isAdmin.value) return true
  return currentItem.value.status === 0 || currentItem.value.status === 1
})

// 管理员可以发布任何非发布状态的作品，普通用户只能发布草稿和待审
const canPublish = computed(() => {
  if (!currentItem.value) return false
  if (isAdmin.value) {
    return currentItem.value.status !== 2 // 管理员可以发布除了已发布外的任何状态
  }
  return currentItem.value.status === 0 || currentItem.value.status === 1
})

// 管理员可以下架已发布的作品
const canOffline = computed(() => {
  if (!currentItem.value) return false
  if (isAdmin.value) {
    return currentItem.value.status === 2
  }
  return false // 普通用户不能下架
})

// 管理员可以删除草稿和下架状态的作品
const canDelete = computed(() => {
  if (!currentItem.value) return false
  if (isAdmin.value) {
    return currentItem.value.status === 0 || currentItem.value.status === 3
  }
  return currentItem.value.status === 0 // 普通用户只能删除自己的草稿
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
 * 格式化描述内容
 */
function formatDescription(description) {
  if (!description) return ''
  // 简单的换行处理
  return description.replace(/\n/g, '<br>')
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

/**
 * 获取作品详情
 */
function fetchItemDetail() {
  if (!props.itemId) {
    message.error('作品ID不能为空')
    handleCancel()
    return
  }

  itemLoading.value = true

  getHeritageItemDetail({ itemId: props.itemId }, {
    onSuccess: (res) => {
      currentItem.value = res
      itemLoading.value = false

      // 直接从作品详情中获取媒体文件列表
      if (res.mediaList && res.mediaList.length > 0) {
        mediaList.value = res.mediaList
        console.log(`成功加载 ${res.mediaList.length} 个媒体文件`)
      } else {
        mediaList.value = []
      }
    },
    onError: (error) => {
      message.error('获取作品详情失败')
      itemLoading.value = false
    }
  })
}

// fetchMediaList 函数已移除，直接从作品详情中获取媒体文件

/**
 * 取消操作
 */
function handleCancel() {
  visible.value = false
  currentItem.value = null
  mediaList.value = []
}

/**
 * 编辑
 */
function handleEdit() {
  emit('edit', currentItem.value)
}

/**
 * 发布
 */
function handlePublish() {
  Modal.confirm({
    title: '提示',
    content: `确定要发布作品"${currentItem.value.title}"吗？`,
    onOk() {
      publishHeritageItem({ itemId: currentItem.value.id }, {
        successMsg: '发布成功',
        onSuccess: () => {
          // 更新当前项状态
          currentItem.value.status = 2
          currentItem.value.statusName = '已发布'
          emit('success')
        }
      })
    }
  })
}

/**
 * 下架
 */
function handleOffline() {
  Modal.confirm({
    title: '提示',
    content: `确定要下架作品"${currentItem.value.title}"吗？`,
    onOk() {
      offlineHeritageItem({ itemId: currentItem.value.id }, {
        successMsg: '下架成功',
        onSuccess: () => {
          // 更新当前项状态
          currentItem.value.status = 3
          currentItem.value.statusName = '下架'
          emit('success')
        }
      })
    }
  })
}

/**
 * 删除
 */
function handleDelete() {
  Modal.confirm({
    title: '危险操作',
    content: `确定要删除作品"${currentItem.value.title}"吗？此操作不可恢复！`,
    okText: '确定删除',
    cancelText: '取消',
    okType: 'danger',
    onOk() {
      deleteHeritageItem({ itemId: currentItem.value.id }, {
        successMsg: '删除成功',
        onSuccess: () => {
          visible.value = false
          emit('success')
        }
      })
    }
  })
}

/**
 * 预览媒体
 */
function handlePreviewMedia(media) {
  previewMedia.value = media
  previewVisible.value = true
}

/**
 * 媒体上传成功
 */
function handleMediaUploadSuccess(media) {
  message.success('媒体上传成功')
}

/**
 * 媒体移除
 */
function handleMediaRemove(media) {
  message.success('媒体移除成功')
}

/**
 * 保存媒体更改
 */
function handleSaveMedia() {
  // 这里可以调用API保存媒体关联关系
  showMediaManager.value = false
  message.success('媒体更改已保存')
}

</script>

<style scoped>
/* 对话框头部样式 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 对话框内容样式 */
:deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 16px;
}

.loading-container {
  padding: 20px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header {
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f4fd 100%);
  border-radius: 8px;
  border: 1px solid #bae0ff;
}

.detail-header__left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.detail-header__cover {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-header__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-header__cover.no-cover {
  color: #c0c4cc;
  font-size: 24px;
}

.detail-header__info {
  flex: 1;
  min-width: 0;
}

.detail-header__title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.detail-header__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-divider {
  color: #c0c4cc;
}

.meta-text {
  color: #606266;
  font-size: 14px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.info-cell {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.info-cell__label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-cell__value {
  font-size: 14px;
  color: #212529;
  font-weight: 500;
}

.detail-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 20px;
}

.detail-section__title {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.file-count {
  font-size: 12px;
  color: #6c757d;
  font-weight: normal;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.manage-btn {
  margin-left: auto;
}

.detail-section__content {
  line-height: 1.8;
  color: #495057;
}

.summary-text {
  font-size: 14px;
  color: #6c757d;
  font-style: italic;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.description-text {
  font-size: 14px;
}

.no-media {
  text-align: center;
  padding: 40px;
  color: #c0c4cc;
}

.no-media i {
  font-size: 48px;
  margin-bottom: 16px;
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
  cursor: pointer;
  transition: all 0.3s ease;
}

.media-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.media-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  flex-direction: column;
  gap: 8px;
}

.media-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-preview.video,
.media-preview.audio,
.media-preview.pdf,
.media-preview.file {
  color: #606266;
}

.media-preview i {
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

.no-media {
  text-align: center;
  padding: 40px;
  color: #c0c4cc;
}

.no-media i {
  font-size: 48px;
  margin-bottom: 16px;
}

.inheritor-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.inheritor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.inheritor-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.inheritor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inheritor-avatar i {
  font-size: 24px;
  color: #c0c4cc;
}

.inheritor-info {
  flex: 1;
}

.inheritor-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.inheritor-title,
.inheritor-region {
  font-size: 14px;
  color: #606266;
  margin-bottom: 2px;
}

.not-found {
  text-align: center;
  padding: 40px 20px;
}

/* 预览样式 */
.preview-content {
  text-align: center;
}

.preview-image {
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

  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .media-grid,
  .inheritor-list {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-item label {
    min-width: auto;
  }
}
</style>

