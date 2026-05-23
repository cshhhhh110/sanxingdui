<template>
  <div class="heritage-item-card" @click="handleCardClick">
    <!-- 封面图片 -->
    <div class="card-cover">
      <img 
        v-if="item.coverImage" 
        :src="item.coverImage" 
        :alt="item.title"
        class="cover-image"
      />
      <div v-else class="no-image">
        <i class="fas fa-image"></i>
        <span>暂无封面</span>
      </div>
      
      <!-- 状态标签 -->
      <div class="status-tag" :class="statusClass">
        {{ item.statusName || getStatusName(item.status) }}
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="card-content">
      <!-- 标题 -->
      <h3 class="item-title" :title="item.title">{{ item.title }}</h3>
      
      <!-- 类别和地区 -->
      <div class="item-meta">
        <span v-if="item.category" class="meta-tag category">
          <i class="fas fa-tag"></i>
          {{ item.category }}
        </span>
        <span v-if="item.region" class="meta-tag region">
          <i class="fas fa-map-marker-alt"></i>
          {{ item.region }}
        </span>
      </div>
      
      <!-- 摘要 -->
      <p v-if="item.summary" class="item-summary">{{ item.summary }}</p>
      
      <!-- 底部信息 -->
      <div class="card-footer">
   
        <div class="time-info">
          <i class="fas fa-clock"></i>
          <span>{{ formatDate(item.createTime) }}</span>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div v-if="showActions" class="card-actions">
        <a-space>
          <a-button 
            v-if="canEdit" 
            type="primary" 
            size="small" 
            @click.stop="handleEdit"
          >
            编辑
          </a-button>
          <a-button 
            v-if="canPublish" 
            type="primary"
            size="small" 
            @click.stop="handlePublish"
          >
            发布
          </a-button>
          <a-button 
            v-if="canOffline" 
            type="default"
            size="small" 
            @click.stop="handleOffline"
          >
            下架
          </a-button>
          <a-button 
            v-if="canDelete" 
            danger
            size="small" 
            @click.stop="handleDelete"
          >
            删除
          </a-button>
        </a-space>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DateUtils from '@/utils/dateUtils'

// ========== 组件属性 ==========
const props = defineProps({
  // 作品数据
  item: {
    type: Object,
    required: true
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: false
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: true
  }
})

// ========== 事件定义 ==========
const emit = defineEmits([
  'click',
  'edit',
  'publish',
  'offline',
  'delete'
])

// ========== 计算属性 ==========

// 状态样式类
const statusClass = computed(() => {
  const statusMap = {
    0: 'draft',     // 草稿
    1: 'pending',   // 待审
    2: 'published', // 已发布
    3: 'offline'    // 下架
  }
  return statusMap[props.item.status] || 'draft'
})

// 是否可以编辑
const canEdit = computed(() => {
  return props.item.status === 0 || props.item.status === 1 // 草稿或待审
})

// 是否可以发布
const canPublish = computed(() => {
  return props.item.status === 0 || props.item.status === 1 // 草稿或待审
})

// 是否可以下架
const canOffline = computed(() => {
  return props.item.status === 2 // 已发布
})

// 是否可以删除
const canDelete = computed(() => {
  return props.item.status === 0 || props.item.status === 3 // 草稿或下架
})

// ========== 方法 ==========

/**
 * 获取状态名称
 */
function getStatusName(status) {
  const statusMap = {
    0: '草稿',
    1: '待审',
    2: '已发布',
    3: '下架'
  }
  return statusMap[status] || '未知'
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return DateUtils.formatDate(dateStr)
  } catch (error) {
    return ''
  }
}

/**
 * 处理卡片点击
 */
function handleCardClick() {
  if (props.clickable) {
    emit('click', props.item)
  }
}

/**
 * 处理编辑
 */
function handleEdit() {
  emit('edit', props.item)
}

/**
 * 处理发布
 */
function handlePublish() {
  emit('publish', props.item)
}

/**
 * 处理下架
 */
function handleOffline() {
  emit('offline', props.item)
}

/**
 * 处理删除
 */
function handleDelete() {
  emit('delete', props.item)
}
</script>

<style scoped>
.heritage-item-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
  cursor: pointer;
}

.heritage-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-cover {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
}

.no-image i {
  font-size: 48px;
  margin-bottom: 8px;
}

.status-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.status-tag.draft {
  background: #909399;
}

.status-tag.pending {
  background: #E6A23C;
}

.status-tag.published {
  background: #67C23A;
}

.status-tag.offline {
  background: #F56C6C;
}

.card-content {
  padding: 12px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 12px;
  font-size: 12px;
  color: #606266;
}

.meta-tag i {
  font-size: 10px;
}

.meta-tag.category {
  background: #e1f3ff;
  color: #409eff;
}

.meta-tag.region {
  background: #f0f9ff;
  color: #67c23a;
}

.item-summary {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-bottom: 3px;
}

.creator-info,
.time-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Ant Design Vue 按钮样式已通过 a-space 组件处理 */

/* 响应式设计 */
@media (max-width: 768px) {
  .card-content {
    padding: 12px;
  }
  
  .item-title {
    font-size: 14px;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>

