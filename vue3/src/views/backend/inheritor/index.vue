<template>
  <div class="inheritor-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="title-wrapper">
        <h2>文博专家管理</h2>
      </div>
      <a-button type="primary" class="btn-create" @click="showCreateModal">
        新增专家
      </a-button>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <a-input
        v-model:value="searchForm.name"
        placeholder="姓名"
        allow-clear
        class="filter-input"
        @pressEnter="handleSearch"
      />
      <a-input
        v-model:value="searchForm.title"
        placeholder="称号"
        allow-clear
        class="filter-input"
        @pressEnter="handleSearch"
      />
      <a-input
        v-model:value="searchForm.region"
        placeholder="地区"
        allow-clear
        class="filter-input"
        @pressEnter="handleSearch"
      />
      <div class="filter-bar__btns">
        <a-button type="primary" class="btn-search" @click="handleSearch">查询</a-button>
        <a-button class="btn-reset" @click="handleReset">重置</a-button>
      </div>
    </div>

    <!-- 列顺序调节 -->
    <section class="column-bar">
      <span class="column-bar__label">列顺序</span>
      <span class="column-bar__hint">拖拽标签可调换位置</span>
      <div class="column-chips">
        <span
          v-for="(key, index) in draggableColumnKeys"
          :key="key"
          class="column-chip"
          :class="{
            'column-chip--dragging': dragState.dragKey === key,
            'column-chip--over': dragState.overKey === key && dragState.dragKey !== key
          }"
          draggable="true"
          @dragstart="onColumnDragStart($event, key, index)"
          @dragend="onColumnDragEnd"
          @dragover.prevent="onColumnDragOver(key)"
          @dragleave="onColumnDragLeave(key)"
          @drop.prevent="onColumnDrop(key)"
        >
          <span class="column-chip__grip">⋮⋮</span>
          {{ getColumnTitle(key) }}
        </span>
        <span class="column-chip column-chip--fixed">操作</span>
      </div>
      <button type="button" class="column-reset" @click="resetColumnOrder">恢复默认</button>
    </section>

    <!-- 数据表格 -->
    <div class="table-section">
      <a-table
          :columns="orderedColumns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          :row-key="record => record.id"
          :scroll="{ x: tableScrollX }"
          size="middle"
          class="museum-theme-table"
      >
        <!-- 头像列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <a-avatar
                v-if="record.avatarPath"
                :src="record.avatarPath"
                :size="48"
                class="expert-avatar"
            />
            <a-avatar v-else :size="48" class="expert-avatar default-avatar">
              {{ record.name ? record.name.charAt(0) : '?' }}
            </a-avatar>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'action'">
            <div class="action-cell">
              <a-button type="link" size="small" class="link-btn" @click="handleView(record)">查看</a-button>
              <a-divider type="vertical" class="action-divider" />
              <a-button type="link" size="small" class="link-btn" @click="handleEdit(record)">编辑</a-button>
              <a-divider type="vertical" class="action-divider" />
              <a-dropdown :align="{ overflow: { adjustX: true, adjustY: true } }">
                <a-button type="link" size="small" class="more-btn">
                  更多 <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="({ key }) => handleAction(key, record)" class="museum-dropdown-menu">
                    <a-menu-item key="viewWorks">关联作品</a-menu-item>
                    <a-menu-divider class="menu-danger-divider" />
                    <a-menu-item key="delete" danger>删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <a-modal
        v-model:open="modalVisible"
        :title="modalTitle"
        :width="720"
        :mask-closable="false"
        @cancel="handleModalCancel"
        wrapClassName="museum-custom-modal"
    >
      <div class="edit-form-container">
        <!-- 状态提示条 -->
        <div class="status-bar" :class="isEdit ? 'status-edit' : 'status-create'">
          <div class="status-bar__left">
            <i :class="isEdit ? 'fas fa-edit' : 'fas fa-plus-circle'"></i>
            <span class="status-bar__text">{{ isEdit ? '正在编辑专家档案资料' : '正在录入新专家智库学者' }}</span>
          </div>
        </div>

        <a-form
            :model="formData"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            class="edit-form"
        >
          <!-- 基本信息 -->
          <div class="form-section">
            <div class="form-section__title">
              <i class="fas fa-id-card"></i>
              基本学者信息
            </div>
            <div class="form-section__content">
              <a-form-item label="姓名" required>
                <a-input
                    v-model:value="formData.name"
                    placeholder="请输入姓名"
                    :maxlength="100"
                />
              </a-form-item>

              <a-form-item label="职务">
                <a-input
                    v-model:value="formData.title"
                    placeholder="请输入职务或研究称号"
                    :maxlength="100"
                />
              </a-form-item>

              <a-form-item label="地区">
                <a-input
                    v-model:value="formData.region"
                    placeholder="请输入地区行政归属"
                    :maxlength="100"
                />
              </a-form-item>

              <a-form-item label="简介">
                <a-textarea
                    v-model:value="formData.bio"
                    placeholder="请详细描述该学者的个人科研成就、考古历程或文博专长..."
                    :rows="6"
                    :maxlength="5000"
                    show-count
                />
              </a-form-item>
            </div>
          </div>

          <!-- 头像上传 -->
          <div class="form-section">
            <div class="form-section__title">
              <i class="fas fa-camera"></i>
              肖像资料设置
            </div>
            <div class="form-section__content">
              <a-form-item label="头像">
                <a-upload
                    list-type="picture-card"
                    :show-upload-list="false"
                    :before-upload="beforeAvatarUpload"
                    :custom-request="handleAvatarUpload"
                    class="museum-uploader"
                >
                  <img
                      v-if="avatarUrl"
                      :src="avatarUrl"
                      alt="avatar"
                      style="width: 100%; height: 100%; object-fit: cover;"
                  />
                  <div v-else class="upload-trigger">
                    <i class="fas fa-plus"></i>
                    <div>上传肖像</div>
                  </div>
                </a-upload>
                <div class="form-tip">
                  <i class="fas fa-info-circle"></i>
                  支持 JPG、PNG 格式的高清图像，文件大小请控制在 5MB 以内
                </div>
              </a-form-item>
            </div>
          </div>
        </a-form>
      </div>

      <template #footer>
        <div class="edit-footer">
          <a-button @click="handleModalCancel" class="cancel-btn">
            返回
          </a-button>
          <div class="footer-right">
            <a-button type="primary" @click="handleModalOk" class="submit-btn">
              {{ isEdit ? '保存更改' : '录入智库' }}
            </a-button>
          </div>
        </div>
      </template>
    </a-modal>

    <!-- 查看详情对话框 -->
    <a-modal
        v-model:open="detailVisible"
        title="文博专家数字化详情"
        :width="800"
        :footer="null"
        wrapClassName="museum-custom-modal detail-modal"
    >
      <div v-if="currentRecord" class="inheritor-detail">
        <!-- 头部信息区 -->
        <div class="detail-header">
          <div class="detail-header__left">
            <div class="detail-header__avatar">
              <a-avatar v-if="currentRecord.avatarPath" :src="currentRecord.avatarPath" :size="84" />
              <a-avatar v-else :size="84" class="default-avatar">
                {{ currentRecord.name ? currentRecord.name.charAt(0) : '?' }}
              </a-avatar>
            </div>
            <div class="detail-header__info">
              <h3 class="detail-header__name">{{ currentRecord.name }}</h3>
              <div class="detail-header__meta">
                <span class="meta-badge" v-if="currentRecord.title">{{ currentRecord.title }}</span>
                <span class="meta-text" v-if="currentRecord.region">
                  <i class="fas fa-map-marker-alt"></i> {{ currentRecord.region }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 信息网格 -->
        <div class="info-grid">
          <div class="info-cell">
            <div class="info-cell__label">学者姓名</div>
            <div class="info-cell__value">{{ currentRecord.name }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__label">核心职务</div>
            <div class="info-cell__value">{{ currentRecord.title || '-' }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__label">所属区域</div>
            <div class="info-cell__value">{{ currentRecord.region || '-' }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell__label">建档时间</div>
            <div class="info-cell__value">{{ formatDate(currentRecord.createTime) }}</div>
          </div>
        </div>

        <!-- 简介 -->
        <div class="detail-section" v-if="currentRecord.bio">
          <div class="detail-section__title">学术成果与简介</div>
          <div class="detail-section__content bio-text">
            {{ currentRecord.bio }}
          </div>
        </div>

        <!-- 关联作品 -->
        <div class="detail-section">
          <div class="detail-section__title">
            <div class="title-left">
              <span>学术指导/研究成果</span>
              <span class="file-count">{{ currentRecord.heritageItems?.length || 0 }} 件</span>
            </div>
            <a-button type="primary" size="small" class="manage-btn" @click="showItemRelationModal">
              配置科研关联
            </a-button>
          </div>

          <div v-if="currentRecord.heritageItems && currentRecord.heritageItems.length > 0" class="works-grid">
            <div v-for="item in currentRecord.heritageItems" :key="item.id" class="work-item">
              <div class="work-item__title">{{ item.title }}</div>
              <div class="work-item__meta">
                <span class="work-tag">{{ item.category }}</span>
                <span v-if="item.region" class="work-region">
                  <i class="fas fa-landmark"></i> {{ item.region }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="no-works">
            <i class="fas fa-cube"></i>
            <p>暂无指导或关联的古蜀瑰宝作品档案</p>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 作品关联管理对话框 -->
    <a-modal
        v-model:open="itemRelationVisible"
        title="配置专家学术成果映射"
        :width="750"
        @ok="handleItemRelationOk"
        @cancel="handleItemRelationCancel"
        wrapClassName="museum-custom-modal relation-modal"
    >
      <a-tabs v-model:activeKey="relationTab" class="museum-tabs">
        <!-- 添加关联 -->
        <a-tab-pane key="add" tab="添加指导映射">
          <a-form layout="vertical" class="relation-tab-form">
            <a-form-item label="筛选待关联的古蜀瑰宝">
              <a-select
                  v-model:value="selectedItemId"
                  placeholder="请输入关键词检索发布的馆藏瑰宝"
                  show-search
                  :filter-option="filterItemOption"
                  style="width: 100%"
                  class="museum-select"
              >
                <a-select-option
                    v-for="item in availableItems"
                    :key="item.id"
                    :value="item.id"
                >
                  {{ item.title }} - {{ item.category }} ({{ item.region }})
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-button type="primary" class="btn-add-relation" @click="handleAddRelation" :disabled="!selectedItemId">
              <i class="fas fa-link"></i> 确立映射关联
            </a-button>
          </a-form>
        </a-tab-pane>

        <!-- 已关联作品 -->
        <a-tab-pane key="list" tab="查看已有映射">
          <div class="relation-list-container">
            <a-list
                v-if="currentRecord && currentRecord.heritageItems && currentRecord.heritageItems.length > 0"
                :data-source="currentRecord.heritageItems"
                item-layout="horizontal"
                class="museum-relation-list"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                      :title="item.title"
                      :description="`展出/发掘类别：${item.category}   |   考古归属地：${item.region}`"
                  />
                  <template #actions>
                    <a-popconfirm
                        title="确定要断开此专家的成果映射吗？"
                        ok-text="确定解除"
                        cancel-text="取消"
                        @confirm="handleRemoveRelation(item.id)"
                    >
                      <a-button type="link" danger size="small" class="btn-unlink">
                        <i class="fas fa-unlink"></i> 移除关联
                      </a-button>
                    </a-popconfirm>
                  </template>
                </a-list-item>
              </template>
            </a-list>
            <a-empty v-else description="暂无关联成果，请在前项标签中添加" />
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup>
// 同原代码，不发生任何改动
import { ref, reactive, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { DownOutlined } from '@ant-design/icons-vue';
import {
  getInheritorPage,
  createInheritor,
  updateInheritor,
  deleteInheritor,
  getInheritorById,
  addItemRelation,
  removeItemRelation
} from '@/api/InheritorApi';
import { getHeritageItemPage } from '@/api/HeritageApi';
import { uploadBusinessFile } from '@/api/FileApi';
import { generateBusinessUUID, BUSINESS_TYPES } from '@/utils/uuidUtils';

const COLUMN_STORAGE_KEY = 'backend-inheritor-column-order'

/** 列定义 */
const COLUMN_DEF_MAP = {
  avatar: { title: '头像', key: 'avatar', width: 90, align: 'center' },
  name: { title: '姓名', dataIndex: 'name', key: 'name', width: 130 },
  title: { title: '称号', dataIndex: 'title', key: 'title', width: 190 },
  region: { title: '地区', dataIndex: 'region', key: 'region', width: 130 },
  bio: { title: '简介', dataIndex: 'bio', key: 'bio', ellipsis: true },
  createTime: { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 }
};

const DEFAULT_COLUMN_ORDER = ['avatar', 'name', 'title', 'region', 'bio', 'createTime'];

const ACTION_COLUMN = {
  title: '操作',
  key: 'action',
  width: 180,
  fixed: 'right',
  align: 'center'
};

function loadColumnOrder() {
  try {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!saved) return [...DEFAULT_COLUMN_ORDER];
    const parsed = JSON.parse(saved);
    const valid = parsed.filter((k) => DEFAULT_COLUMN_ORDER.includes(k));
    const missing = DEFAULT_COLUMN_ORDER.filter((k) => !valid.includes(k));
    return valid.length ? [...valid, ...missing] : [...DEFAULT_COLUMN_ORDER];
  } catch {
    return [...DEFAULT_COLUMN_ORDER];
  }
}

const columnOrder = ref(loadColumnOrder());
const draggableColumnKeys = computed(() => columnOrder.value);

const orderedColumns = computed(() => {
  const cols = columnOrder.value
    .map((key) => COLUMN_DEF_MAP[key])
    .filter(Boolean);
  return [...cols, ACTION_COLUMN];
});

const tableScrollX = computed(() =>
  orderedColumns.value.reduce((sum, col) => sum + (col.width || 120), 0)
);

function getColumnTitle(key) {
  return COLUMN_DEF_MAP[key]?.title || key;
}

function saveColumnOrder() {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnOrder.value));
}

function resetColumnOrder() {
  columnOrder.value = [...DEFAULT_COLUMN_ORDER];
  localStorage.removeItem(COLUMN_STORAGE_KEY);
  message.success('列顺序已恢复默认');
}

const dragState = reactive({
  dragKey: null,
  dragIndex: -1,
  overKey: null
});

function onColumnDragStart(e, key, index) {
  dragState.dragKey = key;
  dragState.dragIndex = index;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', key);
}

function onColumnDragEnd() {
  dragState.dragKey = null;
  dragState.dragIndex = -1;
  dragState.overKey = null;
}

function onColumnDragOver(key) {
  dragState.overKey = key;
}

function onColumnDragLeave(key) {
  if (dragState.overKey === key) dragState.overKey = null;
}

function onColumnDrop(targetKey) {
  const fromKey = dragState.dragKey;
  if (!fromKey || fromKey === targetKey) return;

  const list = [...columnOrder.value];
  const fromIdx = list.indexOf(fromKey);
  const toIdx = list.indexOf(targetKey);
  if (fromIdx < 0 || toIdx < 0) return;

  list.splice(fromIdx, 1);
  list.splice(toIdx, 0, fromKey);
  columnOrder.value = list;
  saveColumnOrder();
  dragState.overKey = null;
}

const searchForm = reactive({ name: '', title: '', region: '' });
const tableData = ref([]);
const loading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 名文博专家`
});

const modalVisible = ref(false);
const detailVisible = ref(false);
const isEdit = ref(false);
const currentRecord = ref(null);
const itemRelationVisible = ref(false);
const relationTab = ref('add');
const selectedItemId = ref(null);
const availableItems = ref([]);

const formData = reactive({ id: '', name: '', title: '', region: '', bio: '', avatarFileId: null });
const avatarUrl = ref('');
const modalTitle = computed(() => isEdit.value ? '编辑专家档案资料' : '建立专家人才智库');

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const fetchInheritors = () => {
  loading.value = true;
  const params = { current: pagination.current, size: pagination.pageSize, ...searchForm };
  getInheritorPage(params, {
    onSuccess: (res) => {
      tableData.value = res.records || [];
      pagination.total = res.total || 0;
      loading.value = false;
    },
    onError: () => { loading.value = false; }
  });
};

const handleSearch = () => { pagination.current = 1; fetchInheritors(); };
const handleReset = () => {
  Object.assign(searchForm, { name: '', title: '', region: '' });
  pagination.current = 1;
  fetchInheritors();
};
const handleTableChange = (pag) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchInheritors();
};
const showCreateModal = () => { isEdit.value = false; resetForm(); modalVisible.value = true; };
const handleView = (record) => {
  getInheritorById(record.id, {
    onSuccess: (res) => { currentRecord.value = res; detailVisible.value = true; }
  });
};
const handleEdit = (record) => {
  isEdit.value = true;
  currentRecord.value = record;
  Object.assign(formData, {
    id: record.id,
    name: record.name,
    title: record.title,
    region: record.region,
    bio: record.bio,
    avatarFileId: record.avatarFileId
  });
  avatarUrl.value = record.avatarPath || '';
  modalVisible.value = true;
};
const handleDelete = (record) => {
  Modal.confirm({
    title: '确认注销',
    content: `确定要从系统智库中移除专家学者"${record.name}"吗？相关关联资产将一并脱钩。`,
    okText: '确认移除',
    cancelText: '取消',
    okType: 'danger',
    onOk() {
      deleteInheritor(record.id, {
        successMsg: '专家资料成功移出智库',
        onSuccess: () => { fetchInheritors(); }
      });
    }
  });
};
const handleAction = (key, record) => {
  if (key === 'delete') { handleDelete(record); }
  else if (key === 'viewWorks') { handleView(record); }
};
const handleModalOk = () => {
  if (!formData.name || !formData.name.trim()) { message.warning('请输入姓名'); return; }
  if (isEdit.value) {
    updateInheritor(formData.id, formData, {
      successMsg: '档案更新成功',
      onSuccess: () => { modalVisible.value = false; fetchInheritors(); }
    });
  } else {
    formData.id = generateBusinessUUID(BUSINESS_TYPES.INHERITOR);
    createInheritor(formData, {
      successMsg: '专家成功入库',
      onSuccess: () => { modalVisible.value = false; fetchInheritors(); }
    });
  }
};
const handleModalCancel = () => { modalVisible.value = false; resetForm(); };
const resetForm = () => {
  Object.assign(formData, { id: '', name: '', title: '', region: '', bio: '', avatarFileId: null });
  avatarUrl.value = '';
};
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) { message.error('只能上传图片文件!'); return false; }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) { message.error('图片大不能超过 5MB!'); return false; }
  return true;
};
const handleAvatarUpload = ({ file }) => {
  if (!formData.id) { formData.id = generateBusinessUUID(BUSINESS_TYPES.INHERITOR); }
  const businessInfo = { businessType: BUSINESS_TYPES.INHERITOR, businessId: formData.id, businessField: 'avatar' };
  uploadBusinessFile(file, businessInfo, true, {
    onSuccess: (res) => {
      if (res && res.id) {
        formData.avatarFileId = res.id;
        avatarUrl.value = res.filePath;
        message.success('图像文件解析成功');
      }
    },
    onError: () => { message.error('文件服务器响应失败'); }
  });
};
const showItemRelationModal = () => { itemRelationVisible.value = true; relationTab.value = 'add'; selectedItemId.value = null; fetchAvailableItems(); };
const fetchAvailableItems = () => {
  getHeritageItemPage({ current: 1, size: 100, status: 2 }, {
    onSuccess: (res) => { availableItems.value = res.records || []; }
  });
};
const filterItemOption = (input, option) => option.children[0].children.toLowerCase().includes(input.toLowerCase());
const handleAddRelation = () => {
  if (!selectedItemId.value) return;
  addItemRelation(currentRecord.value.id, selectedItemId.value, {
    successMsg: '学术指导成果构建成功',
    onSuccess: () => { selectedItemId.value = null; refreshCurrentRecord(); }
  });
};
const handleRemoveRelation = (itemId) => {
  removeItemRelation(currentRecord.value.id, itemId, {
    successMsg: '映射链路已安全断开',
    onSuccess: () => { refreshCurrentRecord(); }
  });
};
const refreshCurrentRecord = () => {
  if (currentRecord.value && currentRecord.value.id) {
    getInheritorById(currentRecord.value.id, { onSuccess: (res) => { currentRecord.value = res; } });
  }
};
const handleItemRelationOk = () => { itemRelationVisible.value = false; };
const handleItemRelationCancel = () => { itemRelationVisible.value = false; selectedItemId.value = null; };
onMounted(() => { fetchInheritors(); });
</script>

<style lang="scss" scoped>
/* ==========================================================================
   全局环境：统一为 user 页面风格
   ========================================================================== */
$user-accent: #42664f;
$user-black: #111111;
$user-muted: #6b6b6b;
$user-border: #e8e8e8;
$user-bg: #fafafa;
$user-white: #ffffff;

.inheritor-management {
  min-height: 100%;
  padding: 28px 32px 40px;
  background: $user-white;
  color: $user-black;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ==========================================================================
   页面顶栏
   ========================================================================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid $user-black;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-indicator {
  width: 4px;
  height: 22px;
  background: $user-accent;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: $user-black;
  letter-spacing: -0.02em;
}

.sub-badge {
  font-size: 12px;
  color: $user-accent;
  background: rgba($user-accent, 0.08);
  padding: 2px 10px;
  border: 1px solid $user-accent;
  font-weight: 500;
}

.btn-create {
  background: $user-accent !important;
  border-color: $user-accent !important;
  color: $user-white !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;
  padding: 0 16px !important;

  &:hover {
    background: darken($user-accent, 6%) !important;
    border-color: darken($user-accent, 6%) !important;
  }
}

/* ==========================================================================
   筛选区域
   ========================================================================== */
.search-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: $user-bg;
  border: 1px solid $user-border;
}

.filter-input {
  width: 160px;
}

.search-section :deep(.ant-input),
.search-section :deep(.ant-select-selector) {
  border-radius: 0 !important;
  border-color: $user-border !important;
  font-size: 13px !important;
}

.search-section :deep(.ant-input:focus),
.search-section :deep(.ant-input-affix-wrapper-focused),
.search-section :deep(.ant-select-focused .ant-select-selector) {
  border-color: $user-accent !important;
  box-shadow: none !important;
}

.filter-bar__btns {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-search {
  background: $user-accent !important;
  border-color: $user-accent !important;
  color: $user-white !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;

  &:hover {
    background: darken($user-accent, 6%) !important;
    border-color: darken($user-accent, 6%) !important;
  }
}

.btn-reset {
  background: $user-white !important;
  border: 1px solid $user-black !important;
  color: $user-black !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;

  &:hover {
    border-color: $user-accent !important;
    color: $user-accent !important;
  }
}

/* ==========================================================================
   列顺序条
   ========================================================================== */
.column-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  margin-bottom: 0;
  padding: 12px 16px;
  border: 1px solid $user-border;
  border-bottom: none;
  background: $user-white;
}

.column-bar__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $user-black;
}

.column-bar__hint {
  font-size: 11px;
  color: $user-muted;
}

.column-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.column-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  color: $user-black;
  background: $user-white;
  border: 1px solid $user-black;
  cursor: grab;
  user-select: none;
  transition: background 0.15s, border-color 0.15s;

  &:active {
    cursor: grabbing;
  }

  &--dragging {
    opacity: 0.45;
    border-style: dashed;
  }

  &--over {
    background: rgba($user-accent, 0.12);
    border-color: $user-accent;
  }

  &--fixed {
    cursor: default;
    color: $user-muted;
    border-color: $user-border;
    background: $user-bg;
  }
}

.column-chip__grip {
  font-size: 10px;
  color: $user-muted;
  letter-spacing: -2px;
}

.column-reset {
  margin-left: auto;
  padding: 0;
  font-size: 12px;
  color: $user-muted;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: $user-accent;
  }
}

/* ==========================================================================
   表格区域
   ========================================================================== */
.table-section {
  border: 1px solid $user-border;
}

.museum-theme-table {
  :deep(.ant-table) {
    background: $user-white;
    color: $user-black;
  }

  :deep(.ant-table-thead > tr > th) {
    background: $user-black !important;
    color: $user-white !important;
    font-weight: 500;
    font-size: 12px;
    border-bottom: none !important;
    padding: 12px 14px !important;
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid $user-border !important;
    padding: 12px 14px !important;
    font-size: 13px;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: $user-bg !important;
  }

  :deep(.ant-pagination-item-active) {
    border-color: $user-accent !important;

    a {
      color: $user-accent !important;
    }
  }

  :deep(.ant-pagination-item:hover),
  :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
  :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
    border-color: $user-accent !important;
    color: $user-accent !important;
  }
}

/* 头像样式 */
.expert-avatar {
  background: $user-bg !important;
  color: $user-accent !important;
  border: 1px solid $user-border !important;
  font-weight: 600;
}

.default-avatar {
  background: $user-bg !important;
  color: $user-accent !important;
  border: 1px solid $user-border !important;
  font-weight: 600;
}

/* 操作列区域 */
.action-cell {
  display: flex;
  align-items: center;
}

.link-btn {
  padding: 0 !important;
  font-size: 12px;
  font-weight: 500;
  color: $user-accent !important;
  background: none !important;
  border: none !important;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: $user-black !important;
  }
}

.more-btn {
  color: $user-muted !important;
  padding: 0 !important;
  background: none !important;
  border: none !important;
  font-size: 12px;

  &:hover {
    color: $user-accent !important;
  }
}

.action-divider {
  border-color: $user-border !important;
}

/* ==========================================================================
   内置表单容器样式
   ========================================================================== */
.edit-form-container {
  padding: 20px;
}

.status-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 0;
  margin-bottom: 24px;
  border: 1px solid;
}
.status-bar__left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-bar__left i { font-size: 15px; }
.status-bar__text { font-size: 13px; font-weight: 500; }

.status-create {
  background: $user-bg;
  border-color: $user-border;
  color: $user-accent;
}
.status-edit {
  background: $user-bg;
  border-color: $user-border;
  color: $user-accent;
}

.form-section {
  margin-bottom: 24px;
  border: 1px solid $user-border;
  border-radius: 0;
  overflow: hidden;
  background: $user-white;
}

.form-section__title {
  font-size: 14px;
  font-weight: 600;
  color: $user-black;
  padding: 12px 16px;
  background: $user-bg;
  border-bottom: 1px solid $user-border;
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-section__title i {
  color: $user-accent;
}

.form-section__content {
  padding: 20px 20px 4px;
}

.edit-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: $user-muted;
  font-size: 12px;
}

.edit-form :deep(.ant-input),
.edit-form :deep(.ant-input-affine-wrapper) {
  border-radius: 0 !important;
  border-color: $user-border;
}

.edit-form :deep(.ant-input:hover),
.edit-form :deep(.ant-input:focus) {
  border-color: $user-accent !important;
}

/* 头像上传美化 */
.museum-uploader :deep(.ant-upload-select-picture-card) {
  border-radius: 0 !important;
  background: $user-bg;
}
.museum-uploader :deep(.ant-upload-select-picture-card:hover) {
  border-color: $user-accent !important;
}

.upload-trigger {
  color: $user-muted;
}
.upload-trigger i {
  font-size: 20px;
  margin-bottom: 6px;
  color: $user-accent;
}

.form-tip {
  font-size: 12px;
  color: $user-muted;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-tip i {
  color: $user-accent;
}

/* 底部控制栏区 */
.edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.cancel-btn {
  border-radius: 0 !important;
}

.submit-btn {
  background: $user-accent !important;
  border-color: $user-accent !important;
  border-radius: 0 !important;

  &:hover {
    background: darken($user-accent, 6%) !important;
    border-color: darken($user-accent, 6%) !important;
  }
}

/* ==========================================================================
   深度详情面板排版
   ========================================================================== */
.inheritor-detail {
  padding: 12px 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid $user-border;
}

.detail-header__left {
  display: flex;
  gap: 14px;
  align-items: center;
}

.detail-header__avatar :deep(.ant-avatar) {
  border: 1px solid $user-border;
  background: $user-bg;
  color: $user-accent;
}

.detail-header__info {
  flex: 1;
}

.detail-header__name {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 600;
  color: $user-black;
}

.detail-header__meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-badge {
  background: $user-white;
  color: $user-black;
  font-size: 12px;
  padding: 2px 10px;
  border: 1px solid $user-black;
  font-weight: 500;
}

.meta-text {
  color: $user-muted;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 详情网格数 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.info-cell {
  padding: 14px 16px;
  background: $user-bg;
  border: 1px solid $user-border;
}

.info-cell__label {
  font-size: 12px;
  color: $user-muted;
  margin-bottom: 6px;
  font-weight: 500;
}

.info-cell__value {
  font-size: 14px;
  color: $user-black;
  font-weight: 600;
}

.detail-section {
  background: $user-white;
  border: 1px solid $user-border;
  padding: 20px;
  margin-bottom: 20px;
}

.detail-section__title {
  font-size: 15px;
  font-weight: 600;
  color: $user-black;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid $user-border;
}

.detail-section__title .title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-count {
  font-size: 11px;
  color: $user-accent;
  background: rgba($user-accent, 0.08);
  padding: 2px 8px;
  border: 1px solid $user-accent;
  font-weight: 600;
}

.manage-btn {
  background: $user-white !important;
  border: 1px solid $user-black !important;
  color: $user-black !important;
  border-radius: 0 !important;
  font-weight: 500;

  &:hover {
    border-color: $user-accent !important;
    color: $user-accent !important;
  }
}

.bio-text {
  font-size: 14px;
  line-height: 1.7;
  color: $user-muted;
  white-space: pre-wrap;
  padding: 14px 16px;
  background: $user-bg;
  border-left: 4px solid $user-accent;
}

/* 作品网格卡片 */
.works-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.work-item {
  padding: 14px 16px;
  border: 1px solid $user-border;
  background: $user-white;
  transition: all 0.2s;

  &:hover {
    border-color: $user-accent;
  }
}

.work-item__title {
  font-size: 14px;
  font-weight: 600;
  color: $user-black;
  margin-bottom: 8px;
}

.work-item__meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.work-tag {
  background: rgba($user-accent, 0.08);
  color: $user-accent;
  font-size: 11px;
  padding: 1px 6px;
  border: 1px solid $user-accent;
  font-weight: 500;
}

.work-region {
  font-size: 12px;
  color: $user-muted;
}

.no-works {
  text-align: center;
  padding: 32px;
  color: $user-muted;
}

.no-works i {
  font-size: 40px;
  margin-bottom: 12px;
  color: $user-border;
}

/* ==========================================================================
   关联配置模态表单美化
   ========================================================================= */
.relation-tab-form {
  padding: 12px 4px;
}

.museum-select :deep(.ant-select-selector) {
  border-radius: 0 !important;
  border-color: $user-border !important;
}

.btn-add-relation {
  background: $user-accent !important;
  border-color: $user-accent !important;
  border-radius: 0 !important;
  margin-top: 8px;
}

.btn-unlink {
  color: $user-black !important;
}

.relation-list-container {
  padding: 0 24px 24px;
}

/* 底部控制栏区 */
.edit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.footer-right {
  display: flex;
  gap: 8px;
}
.cancel-btn {
  border-radius: 0 !important;
}

.submit-btn {
  background: $user-accent !important;
  border-color: $user-accent !important;
  border-radius: 0 !important;

  &:hover {
    background: darken($user-accent, 6%) !important;
    border-color: darken($user-accent, 6%) !important;
  }
}

/* 响应式断点兼容 */
@media (max-width: 768px) {
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .works-grid { grid-template-columns: 1fr; }
}
</style>

<!-- 全局深层样式穿透处理 -->
<style lang="scss">
$user-accent: #42664f;
$user-black: #111111;
$user-muted: #6b6b6b;
$user-border: #e8e8e8;
$user-bg: #fafafa;
$user-white: #ffffff;

.minimal-modal {
  .ant-modal-content {
    border-radius: 0 !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  }

  .ant-modal-header {
    border-bottom: 1px solid #e8e8e8 !important;
    padding: 16px 20px !important;
  }

  .ant-modal-title {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #111 !important;
  }

  .ant-modal-body {
    padding: 20px !important;
  }

  .ant-modal-footer {
    padding: 14px 20px !important;
    border-top: 1px solid #e8e8e8 !important;
  }
}

.museum-custom-modal {
  .ant-modal-content {
    border-radius: 0 !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  }

  .ant-modal-header {
    border-bottom: 1px solid #e8e8e8 !important;
    padding: 16px 20px !important;

    .ant-modal-title {
      color: #111 !important;
      font-weight: 600 !important;
      font-size: 15px;
    }
  }

  .ant-modal-body {
    padding: 0 !important;
  }

  .ant-modal-footer {
    padding: 14px 20px !important;
    border-top: 1px solid #e8e8e8 !important;
  }
}

/* Tabs 美化 */
.museum-tabs {
  padding: 0 20px;

  .ant-tabs-nav {
    margin-bottom: 16px !important;
    padding: 0;
    background: transparent;
  }

  .ant-tabs-tab-active {
    .ant-tabs-tab-btn {
      color: $user-accent !important;
      font-weight: 600;
    }
  }

  .ant-tabs-ink-bar {
    background: $user-accent !important;
  }
}

.relation-list-container {
  padding: 0 20px 20px;
}

/* 下拉操作卡片美化 */
.museum-dropdown-menu {
  border-radius: 0 !important;
  padding: 5px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;

  .ant-dropdown-menu-item {
    border-radius: 0 !important;
    padding: 7px 14px !important;
    color: $user-black;
    font-size: 13px;

    &:hover {
      background-color: $user-bg !important;
      color: $user-accent !important;
    }
  }

  .ant-dropdown-menu-item-danger {
    color: $user-black !important;

    &:hover {
      background-color: $user-bg !important;
      color: $user-accent !important;
    }
  }
}

/* 分页组件 */
.museum-theme-table {
  .ant-pagination-item-active {
    border-color: $user-accent !important;

    a {
      color: $user-accent !important;
    }
  }

  .ant-pagination-item:hover,
  .ant-pagination-next:hover,
  .ant-pagination-prev:hover {
    border-color: $user-accent !important;

    a {
      color: $user-accent !important;
    }
  }
}
</style>