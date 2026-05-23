<template>
  <div class="inheritor-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="title-wrapper">
        <span class="title-indicator"></span>
        <h2>文博专家管理</h2>
        <span class="sub-badge">专家智库与协同管理</span>
      </div>
      <a-button type="primary" class="btn-create" @click="showCreateModal">
        <template #icon>
          <i class="fas fa-plus"></i>
        </template>
        新增专家
      </a-button>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <a-form :model="searchForm" layout="inline" class="museum-search-form">
        <a-form-item label="姓名">
          <a-input
              v-model:value="searchForm.name"
              placeholder="请输入姓名"
              allow-clear
              style="width: 200px"
          />
        </a-form-item>

        <a-form-item label="称号">
          <a-input
              v-model:value="searchForm.title"
              placeholder="请输入称号"
              allow-clear
              style="width: 200px"
          />
        </a-form-item>

        <a-form-item label="地区">
          <a-input
              v-model:value="searchForm.region"
              placeholder="请输入地区"
              allow-clear
              style="width: 150px"
          />
        </a-form-item>

        <a-form-item class="search-actions">
          <a-space>
            <a-button type="primary" class="btn-search" @click="handleSearch">
              <template #icon>
                <i class="fas fa-search"></i>
              </template>
              搜索
            </a-button>
            <a-button class="btn-reset" @click="handleReset">
              <template #icon>
                <i class="fas fa-redo"></i>
              </template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <a-table
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          :row-key="record => record.id"
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

const columns = [
  { title: '头像', key: 'avatar', width: 90, align: 'center' },
  { title: '姓名', dataIndex: 'name', key: 'name', width: 130 },
  { title: '称号', dataIndex: 'title', key: 'title', width: 190 },
  { title: '地区', dataIndex: 'region', key: 'region', width: 130 },
  {
    title: '简介',
    dataIndex: 'bio',
    key: 'bio',
    ellipsis: true,
    customRender: ({ text }) => text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : '暂无'
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 170,
    customRender: ({ text }) => formatDate(text)
  },
  { title: '操作', key: 'action', width: 180, fixed: 'right' }
];

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

<style scoped>
/* ==========================================================================
   全局环境：轻量化古蜀文化灰绿底色
   ========================================================================== */
.inheritor-management {
  padding: 32px 36px 48px;
  background: #fafafa;
  min-height: 100vh;
  color: #1f2937;
  font-family: var(--font-body, -apple-system, BlinkMacSystemFont, sans-serif);
}

/* 页头 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(66,102,79,0.1);
}
.title-wrapper { display: flex; align-items: baseline; gap: 14px; }
.title-indicator { width: 3px; height: 20px; background: #42664f; border-radius: 0; flex-shrink: 0; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; color: #1f2937; letter-spacing: 1px; }
.sub-badge { font-size: 12px; color: #657b6f; background: rgba(66,102,79,0.06); padding: 3px 12px; border-radius: 2px; font-weight: 500; }
.btn-create {
  background: #111 !important; border-color: #111 !important; color: #fff !important;
  border-radius: 6px !important; height: 36px !important; padding: 0 18px !important; font-weight: 500; display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-create:hover { background: #34523f !important; }
.search-section {
  background: #fff; padding: 18px 22px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e5e5;
}

.museum-search-form :deep(.ant-form-item) {
  margin-right: 24px !important;
  margin-bottom: 0 !important;
  display: inline-flex;
  align-items: center;
}

.museum-search-form :deep(.ant-form-item-label > label) {
  color: #4e5e54 !important;
  font-weight: 500;
}

.museum-search-form :deep(.ant-input) {
  border-radius: 8px !important;
  border-color: #ced6d1 !important;
  height: 36px !important;
}

.museum-search-form :deep(.ant-input:hover),
.museum-search-form :deep(.ant-input:focus) {
  border-color: #42664f !important;
  box-shadow: 0 0 0 2px rgba(66, 102, 79, 0.1) !important;
}

.search-actions {
  margin-right: 0 !important;
  margin-left: auto;
}

.btn-search {
  background: #42664f !important;
  border-color: #42664f !important;
  border-radius: 8px !important;
  height: 36px !important;
  padding: 0 16px !important;
}

.btn-search:hover {
  background: #33503d !important;
}

.btn-reset {
  background: #edf1ee !important;
  border-color: transparent !important;
  color: #42664f !important;
  border-radius: 8px !important;
  height: 36px !important;
}

.btn-reset:hover {
  background: #dee5e1 !important;
  color: #263d2f !important;
}

/* ==========================================================================
   玉石墨绿高级感数据表
   ========================================================================== */
.table-section {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(66, 102, 79, 0.03);
  border: 1px solid rgba(66, 102, 79, 0.04);
}

.museum-theme-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa !important; color: #3e5246 !important; font-weight: 600;
  font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;
  border-bottom: 2px solid #e9eee9; padding: 12px 16px;
}
.museum-theme-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f2f4f2; padding: 12px 16px; font-size: 13px;
}
.museum-theme-table :deep(.ant-table-tbody > tr:hover > td) { background: #fafafa !important; }

/* 头像高级框处理 */
.expert-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(66, 102, 79, 0.12);
  object-fit: cover;
}
.default-avatar {
  background: #42664f !important;
  color: #ffffff !important;
  font-weight: bold;
}

/* 操作列区域 */
.action-cell {
  display: flex;
  align-items: center;
}

.link-btn {
  color: #42664f !important;
  font-weight: 600;
  padding: 0 !important;
}
.link-btn:hover {
  color: #283f31 !important;
}

.more-btn {
  color: #617267 !important;
  padding: 0 !important;
}
.more-btn:hover {
  color: #42664f !important;
}

.action-divider {
  border-color: #d1dad4 !important;
}

/* ==========================================================================
   内置表单容器样式美化
   ========================================================================== */
.edit-form-container {
  padding: 24px;
}

.status-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
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
  background: #f0f6f2;
  border-color: #d2e4d8;
  color: #42664f;
}
.status-edit {
  background: #fdfaf5;
  border-color: #faebd7;
  color: #c29147;
}

.form-section {
  margin-bottom: 24px;
  border: 1px solid #e1e8e4;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.form-section__title {
  font-size: 14px;
  font-weight: 600;
  color: #213026;
  padding: 12px 16px;
  background: #f5f8f6;
  border-bottom: 1px solid #e1e8e4;
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-section__title i {
  color: #42664f;
}

.form-section__content {
  padding: 20px 20px 4px;
}

.edit-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #3b4a40;
}

.edit-form :deep(.ant-input),
.edit-form :deep(.ant-input-affine-wrapper) {
  border-radius: 6px !important;
  border-color: #ced6d1;
}
.edit-form :deep(.ant-input:hover),
.edit-form :deep(.ant-input:focus) {
  border-color: #42664f !important;
}

/* 头像上传美化 */
.museum-uploader :deep(.ant-upload-select-picture-card) {
  border-radius: 8px !important;
  border-dash-array: 4px;
  background: #fafbfc;
}
.museum-uploader :deep(.ant-upload-select-picture-card:hover) {
  border-color: #42664f !important;
}
.upload-trigger {
  color: #728479;
}
.upload-trigger i {
  font-size: 20px;
  margin-bottom: 6px;
  color: #42664f;
}

.form-tip {
  font-size: 12px;
  color: #728479;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-tip i {
  color: #42664f;
}

/* ==========================================================================
   深度详情面板排版
   ========================================================================== */
.inheritor-detail {
  padding: 12px 16px;
}

.detail-header {
  padding: 24px;
  background: linear-gradient(135deg, #eef3f0 0%, #e3eae5 100%);
  border-radius: 12px;
  border: 1px solid #cbd6cf;
  margin-bottom: 24px;
}

.detail-header__left {
  display: flex;
  gap: 20px;
  align-items: center;
}

.detail-header__avatar :deep(.ant-avatar) {
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(66, 102, 79, 0.15);
}

.detail-header__info {
  flex: 1;
}

.detail-header__name {
  margin: 0 0 10px 0;
  font-size: 22px;
  font-weight: 600;
  color: #16241c;
}

.detail-header__meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-badge {
  background: #42664f;
  color: #fff;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.meta-text {
  color: #55665c;
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
  background: #f6f8f7;
  border-radius: 8px;
  border: 1px solid #e4eae6;
}

.info-cell__label {
  font-size: 12px;
  color: #728479;
  margin-bottom: 6px;
  font-weight: 500;
}

.info-cell__value {
  font-size: 14px;
  color: #1a2620;
  font-weight: 600;
}

.detail-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e4eae6;
  padding: 20px;
  margin-bottom: 20px;
}

.detail-section__title {
  font-size: 15px;
  font-weight: 600;
  color: #1a2620;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f3f1;
}

.detail-section__title .title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-count {
  font-size: 11px;
  color: #42664f;
  background: rgba(66, 102, 79, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.manage-btn {
  background: #edf1ee !important;
  border-color: #42664f !important;
  color: #42664f !important;
  border-radius: 6px !important;
  font-weight: 500;
}
.manage-btn:hover {
  background: #42664f !important;
  color: #fff !important;
}

.bio-text {
  font-size: 14px;
  line-height: 1.7;
  color: #425247;
  white-space: pre-wrap;
  padding: 14px 16px;
  background: #f8faf9;
  border-radius: 8px;
  border-left: 4px solid #42664f;
}

/* 作品网格卡片 */
.works-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.work-item {
  padding: 14px 16px;
  border: 1px solid #e4eae6;
  border-radius: 8px;
  background: #fcfdfe;
  transition: all 0.2s;
}
.work-item:hover {
  border-color: #42664f;
  box-shadow: 0 4px 12px rgba(66, 102, 79, 0.06);
  transform: translateY(-1px);
}

.work-item__title {
  font-size: 14px;
  font-weight: 600;
  color: #213026;
  margin-bottom: 8px;
}

.work-item__meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.work-tag {
  background: #fafafa;
  color: #42664f;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.work-region {
  font-size: 12px;
  color: #728479;
}

.no-works {
  text-align: center;
  padding: 32px;
  color: #a1b2a7;
}
.no-works i {
  font-size: 40px;
  margin-bottom: 12px;
  color: #cbd6cf;
}

/* ==========================================================================
   关联配置模态表单美化
   ========================================================================= */
.relation-tab-form {
  padding: 12px 4px;
}
.museum-select :deep(.ant-select-selector) {
  border-radius: 8px !important;
  border-color: #ced6d1 !important;
}
.btn-add-relation {
  background: #42664f !important;
  border-color: #42664f !important;
  border-radius: 8px !important;
  margin-top: 8px;
}
.btn-unlink {
  color: #ff4d4f !important;
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
  border-radius: 6px !important;
}
.submit-btn {
  background: #42664f !important;
  border-color: #42664f !important;
  border-radius: 6px !important;
}
.submit-btn:hover {
  background: #33503d !important;
}

/* 响应式断点兼容 */
@media (max-width: 768px) {
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .works-grid { grid-template-columns: 1fr; }
}
</style>

<!-- 全局深层样式穿透处理：覆盖独立图层渲染的 AndD 对话框头尾及分页核心 -->
<style lang="scss">
.museum-custom-modal {
  .ant-modal-content { border-radius: 8px !important; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
  .ant-modal-header {
    background: #f5f8f6 !important;
    padding: 16px 24px !important;
    border-bottom: 1px solid #e1e8e4 !important;

    .ant-modal-title {
      color: #1a2620 !important;
      font-weight: 600 !important;
      font-size: 16px;
    }
  }
  .ant-modal-body {
    padding: 0 !important;
  }
  .ant-modal-footer {
    padding: 14px 24px !important;
    background: #fafbfc !important;
    border-top: 1px solid #edf1ee !important;
  }

  // Tabs 美化
  .museum-tabs {
    .ant-tabs-nav {
      margin-bottom: 16px !important;
      padding: 0 24px;
      background: #f5f8f6;
    }
    .ant-tabs-tab-active {
      .ant-tabs-tab-btn {
        color: #42664f !important;
        font-weight: 600;
      }
    }
    .ant-tabs-ink-bar {
      background: #42664f !important;
    }
  }

  .relation-list-container {
    padding: 0 24px 24px;
  }
}

/* 下拉操作卡片美化 */
.museum-dropdown-menu {
  border-radius: 8px !important;
  padding: 5px !important;
  box-shadow: 0 6px 20px rgba(66, 102, 79, 0.08) !important;

  .ant-dropdown-menu-item {
    border-radius: 5px !important;
    padding: 7px 14px !important;
    color: #3b4a40;
    font-size: 13px;

    &:hover {
      background-color: #f0f4f1 !important;
      color: #42664f !important;
    }
  }
  .ant-dropdown-menu-item-danger {
    color: #ff4d4f !important;
    &:hover {
      background-color: #fff1f0 !important;
      color: #ff4d4f !important;
    }
  }
}

/* 分页组件注入主色 */
.museum-theme-table {
  .ant-pagination-item-active {
    border-color: #42664f !important;
    background: #42664f !important;
    a { color: #ffffff !important; }
  }
  .ant-pagination-item:hover, .ant-pagination-next:hover, .ant-pagination-prev:hover {
    border-color: #42664f !important;
    a { color: #42664f !important; }
  }
}
</style>