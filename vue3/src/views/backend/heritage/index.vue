<template>
  <div class="heritage-management">
    <!-- 顶栏页面标题区 -->
    <div class="page-header">
      <div class="title">
        <span class="brand-bar"></span>
        <h2>古蜀瑰宝管理</h2>
        <span class="sub-title">三星堆与金沙文明数字化档案</span>
      </div>

      <a-button type="primary" class="create-btn" @click="showCreateModal = true">
        <template #icon>
          <i class="fas fa-plus"></i>
        </template>
        新增瑰宝
      </a-button>
    </div>

    <!-- 搜索区 -->
    <div class="search-section">
      <a-form :model="searchForm" class="search-form">
        <div class="form-row">
          <a-form-item label="标题">
            <a-input v-model:value="searchForm.title" placeholder="请输入瑰宝名称" allow-clear />
          </a-form-item>

          <a-form-item label="类别">
            <a-select v-model:value="searchForm.category" placeholder="请选择类别" allow-clear>
              <a-select-option
                  v-for="category in HERITAGE_CATEGORIES"
                  :key="category"
                  :value="category"
              >
                {{ category }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="地区">
            <a-input v-model:value="searchForm.region" placeholder="请输入地区" allow-clear />
          </a-form-item>

          <a-form-item label="状态">
            <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear>
              <a-select-option
                  v-for="(status, key) in HERITAGE_ITEM_STATUS"
                  :key="key"
                  :value="status.code"
              >
                {{ status.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="创建时间" class="range-item">
            <a-range-picker v-model:value="dateRange" />
          </a-form-item>

          <!-- 按钮 -->
          <a-form-item class="btns">
            <a-space>
              <a-button type="primary" class="btn-search" @click="handleSearch">
                <i class="fas fa-search"></i> 搜索
              </a-button>
              <a-button class="btn-reset" @click="handleReset">
                <i class="fas fa-redo"></i> 重置
              </a-button>
            </a-space>
          </a-form-item>
        </div>
      </a-form>
    </div>

    <!-- 表格 -->
    <div class="table-section">
      <a-table
          :columns="columns"
          :data-source="heritageStore.heritageList"
          :loading="heritageStore.loading"
          :pagination="pagination"
          :row-key="record => record.id"
          class="sanxingdui-theme-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <span class="title-text" @click="handleView(record)">
              {{ record.title }}
            </span>
          </template>

          <template v-else-if="column.key === 'status'">
            <HeritageStatusTag :status="record.status" :status-name="record.statusName" />
          </template>

          <template v-else-if="column.key === 'createTime'">
            <span class="row-time-text">{{ formatDate(record.createTime) }}</span>
          </template>

          <template v-else-if="column.key === 'publishTime'">
            <span class="row-time-text">{{ record.publishTime ? formatDate(record.publishTime) : '-' }}</span>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'action'">
            <a-space size="small" class="table-actions-group">
              <a-button type="link" size="small" class="action-link-btn" @click="handleView(record)">查看</a-button>
              <a-divider type="vertical" class="action-divider" />
              <a-button type="link" size="small" class="action-link-btn" @click="handleEdit(record)">编辑</a-button>
              <a-divider type="vertical" class="action-divider" />

              <a-dropdown>
                <a-button type="link" size="small" class="action-link-btn dropdown-toggle">
                  更多 <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="({ key }) => handleAction(key, record)" class="sanxingdui-dropdown-menu">
                    <a-menu-item v-if="canPublish(record)" key="publish">发布</a-menu-item>
                    <a-menu-item v-if="canOffline(record)" key="offline">下架</a-menu-item>
                    <a-menu-divider v-if="canDelete(record)" class="menu-danger-divider" />
                    <a-menu-item v-if="canDelete(record)" key="delete" danger>删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 弹窗（沿用你的传参逻辑，注入全局覆盖样式） -->
    <HeritageItemCreate v-model:open="showCreateModal" mode="admin" @success="handleModalSuccess" />
    <HeritageDetailModal v-model:open="showDetailModal" :item-id="currentItemId" />
    <HeritageItemEdit v-model:open="showEditModal" :item-id="currentItemId" mode="admin" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'
import { useHeritageStore } from '@/store/heritage'
import {
  getHeritageItemPage,
  HERITAGE_ITEM_STATUS,
  HERITAGE_CATEGORIES
} from '@/api/HeritageApi'
import HeritageStatusTag from '@/components/common/HeritageStatusTag.vue'
import HeritageItemCreate from '@/components/common/HeritageItemCreate.vue'
import HeritageDetailModal from './detail.vue'
import HeritageItemEdit from '@/components/common/HeritageItemEdit.vue'

const heritageStore = useHeritageStore()

const searchForm = reactive({
  title: '',
  category: '',
  region: '',
  status: null
})

const dateRange = ref([])
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showEditModal = ref(false)
const currentItemId = ref(null)

const columns = [
  { title: '标题', key: 'title', minWidth: 180 },
  { title: '类别', dataIndex: 'category', width: 120 },
  { title: '地区', dataIndex: 'region', width: 140 },
  { title: '状态', key: 'status', width: 110, align: 'center' },
  { title: '创建时间', key: 'createTime', width: 160 },
  { title: '发布时间', key: 'publishTime', width: 160 },
  { title: '操作', key: 'action', width: 180, fixed: 'right', align: 'center' }
]

const pagination = computed(() => ({
  current: heritageStore.searchParams.currentPage,
  pageSize: heritageStore.searchParams.size,
  total: heritageStore.total,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 件瑰宝`
}))

const fetchHeritageList = async () => {
  heritageStore.setLoading(true)
  const res = await getHeritageItemPage({ ...searchForm })
  heritageStore.setHeritageList(res.records || [], res.total || 0)
  heritageStore.setLoading(false)
}

const handleSearch = () => fetchHeritageList()

const handleReset = () => {
  Object.assign(searchForm, { title: '', category: '', region: '', status: null })
  dateRange.value = []
  fetchHeritageList()
}

const handleView = (r) => {
  currentItemId.value = r.id
  showDetailModal.value = true
}

const handleEdit = (r) => {
  currentItemId.value = r.id
  showEditModal.value = true
}

const handleAction = (key) => {
  message.info(key)
}

const canPublish = () => true
const canOffline = () => true
const canDelete = () => true

const formatDate = (d) => d || '-'

const handleModalSuccess = () => fetchHeritageList()

onMounted(fetchHeritageList)
</script>

<style scoped>
/* ========== 画布 ========== */
.heritage-management {
  padding: 32px 36px 48px;
  background: #fafafa;
  min-height: 100vh;
  font-family: var(--font-body, -apple-system, BlinkMacSystemFont, sans-serif);
  color: #1f2937;
}

/* ========== 页头 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(66,102,79,0.1);
}

.title {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.brand-bar {
  width: 3px;
  height: 20px;
  background: #42664f;
  border-radius: 0;
  flex-shrink: 0;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 1px;
}

.sub-title {
  font-size: 12px;
  color: #657b6f;
  background: rgba(66,102,79,0.06);
  padding: 3px 12px;
  border-radius: 2px;
  font-weight: 500;
}

.create-btn {
  background: #42664f !important;
  border-color: #42664f !important;
  color: #fff !important;
  border-radius: 6px !important;
  height: 36px !important;
  padding: 0 18px !important;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.create-btn:hover { background: #333 !important; border-color: #333 !important; }

/* ========== 搜索卡 ========== */
.search-section {
  background: #fff;
  padding: 18px 22px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e5e5e5;
}

.search-form .form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.search-form :deep(.ant-form-item) {
  margin-bottom: 0;
  flex: 1 1 180px;
}

.search-form :deep(.ant-form-item-label > label) {
  color: #516357 !important;
  font-weight: 500;
  font-size: 12px;
}

.search-form :deep(.ant-input),
.search-form :deep(.ant-select-selector),
.search-form :deep(.ant-picker) {
  border-radius: 6px !important;
  border-color: #d9dfdb !important;
  height: 36px !important;
}

.search-form :deep(.ant-input:hover),
.search-form :deep(.ant-select-selector:hover),
.search-form :deep(.ant-picker:hover) { border-color: #42664f !important; }

.search-form :deep(.ant-input-focused),
.search-form :deep(.ant-select-focused .ant-select-selector),
.search-form :deep(.ant-picker-focused) {
  border-color: #42664f !important;
  box-shadow: 0 0 0 2px rgba(66,102,79,0.1) !important;
}

.range-item { flex: 1 1 280px !important; }
.btns { flex: 0 0 auto !important; margin-left: auto; }

.btn-search {
  background: #111 !important; border-color: #111 !important; color: #fff !important;
  border-radius: 6px !important; height: 36px !important; padding: 0 18px !important; font-weight: 500;
}
.btn-search:hover { background: #333 !important; border-color: #333 !important; }

.btn-reset {
  background: #fafafa !important; border-color: transparent !important; color: #42664f !important;
  border-radius: 6px !important; height: 36px !important; padding: 0 18px !important; font-weight: 500;
}
.btn-reset:hover { background: #fafafa !important; }

/* ========== 表格 ========== */
.table-section {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
}

.sanxingdui-theme-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa !important;
  color: #3e5246 !important;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-bottom: 2px solid #e9eee9;
  padding: 12px 16px;
}

.sanxingdui-theme-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f2f4f2;
  padding: 12px 16px;
  font-size: 13px;
}

.sanxingdui-theme-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #fafafa !important;
}

.title-text { color: #111; font-weight: 600; cursor: pointer; }
.title-text:hover { color: #42664f; text-decoration: underline; }
.row-time-text { color: #6a7e72; font-size: 13px; font-family: monospace; }
.action-link-btn { color: #42664f !important; font-weight: 600; font-size: 13px; }
.action-link-btn:hover { color: #111 !important; }
.action-divider { border-color: #dbe2dd !important; }
</style>

<style lang="scss">
.sanxingdui-dropdown-menu {
  border-radius: 8px !important; padding: 4px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
  .ant-dropdown-menu-item {
    border-radius: 4px !important; padding: 8px 14px !important; color: #3e5246; font-weight: 500; font-size: 13px;
    &:hover { background-color: #f2f5f3 !important; color: #42664f !important; }
  }
  .ant-dropdown-menu-item-danger { color: #ff4d4f !important;
    &:hover { background-color: #fff1f0 !important; color: #ff4d4f !important; }
  }
}
.sanxingdui-theme-table {
  .ant-pagination-item-active { border-color: #111 !important; background: #111 !important; a { color: #fff !important; } }
  .ant-pagination-item:hover, .ant-pagination-next:hover, .ant-pagination-prev:hover { border-color: #42664f !important; a { color: #42664f !important; } }
}
</style>