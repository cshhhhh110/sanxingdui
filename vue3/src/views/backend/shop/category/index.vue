<template>
  <div class="shop-category-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="title-wrapper">
        <span class="title-indicator"></span>
        <h2>商品分类管理</h2>
        <span class="sub-badge">类目层级与状态控制</span>
      </div>
      <a-button type="primary" class="btn-create" @click="showCreateModal">
        <template #icon>
          <PlusOutlined />
        </template>
        新增分类
      </a-button>
    </div>

    <!-- 搜索筛选区域（无边框轻量卡片） -->
    <div class="search-section">
      <a-form layout="inline" :model="searchForm" class="museum-search-form">
        <a-form-item label="分类名称">
          <a-input
              v-model:value="searchForm.name"
              placeholder="请输入分类名称"
              allow-clear
              style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              allow-clear
              style="width: 140px"
              class="museum-select"
          >
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item class="search-actions">
          <a-space :size="12">
            <a-button type="primary" class="btn-search" @click="handleSearch">
              <template #icon>
                <SearchOutlined />
              </template>
              查询
            </a-button>
            <a-button class="btn-reset" @click="handleReset">
              <template #icon>
                <ReloadOutlined />
              </template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <!-- 分类列表表格区域 -->
    <div class="table-section">
      <a-table
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          :loading="loading"
          row-key="id"
          @change="handleTableChange"
          class="museum-theme-table"
      >
        <!-- 状态列定制渲染 -->
        <template #status="{ record }">
          <div class="status-cell-wrapper">
            <a-switch
                :checked="record.status === 1"
                @change="(checked) => handleStatusChange(record.id, checked ? 1 : 0)"
                :loading="record.statusLoading"
                class="museum-switch"
            />
            <span class="status-text" :class="record.status === 1 ? 'status-active' : 'status-disabled'">
              {{ record.statusDesc }}
            </span>
          </div>
        </template>

        <!-- 操作列定制渲染 -->
        <template #action="{ record }">
          <div class="action-cell">
            <a-button
                type="link"
                size="small"
                class="link-btn edit-link"
                @click="showEditModal(record)"
            >
              编辑
            </a-button>
            <a-divider type="vertical" class="action-divider" />
            <a-popconfirm
                title="确定要删除这个分类吗？"
                @confirm="handleDelete(record.id)"
                ok-text="确定"
                cancel-text="取消"
                overlayClassName="museum-popconfirm"
            >
              <a-button
                  type="link"
                  size="small"
                  danger
                  class="link-btn delete-link"
              >
                删除
              </a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑分类弹窗 -->
    <a-modal
        :title="modalTitle"
        :open="modalVisible"
        @ok="handleSubmit"
        @cancel="handleCancel"
        :confirm-loading="submitLoading"
        width="540px"
        wrapClassName="museum-custom-modal"
    >
      <div class="edit-form-container">
        <!-- 顶部温润提示状态条 -->
        <div class="status-bar" :class="isEdit ? 'status-edit' : 'status-create'">
          <div class="status-bar__left">
            <span class="status-dot"></span>
            <span class="status-bar__text">
              {{ isEdit ? '您正在编辑当前类目资产的属性配置' : '正在创建全新的一级/二级商品分类映射' }}
            </span>
          </div>
        </div>

        <a-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 19 }"
            class="edit-form"
        >
          <div class="form-card-box">
            <a-form-item label="分类名称" name="name">
              <a-input
                  v-model:value="formData.name"
                  placeholder="请输入精致合规的分类名称"
                  :maxlength="100"
                  class="museum-input"
              />
            </a-form-item>

            <a-form-item label="状态" name="status">
              <a-radio-group v-model:value="formData.status" class="museum-radio-group">
                <a-radio :value="1" class="museum-radio">
                  <span class="radio-label-txt">启用</span>
                </a-radio>
                <a-radio :value="0" class="museum-radio">
                  <span class="radio-label-txt text-danger">禁用</span>
                </a-radio>
              </a-radio-group>
            </a-form-item>
          </div>
        </a-form>
      </div>

      <!-- 固化底部按钮外观 -->
      <template #footer>
        <div class="edit-footer">
          <a-button @click="handleCancel" class="cancel-btn">取消</a-button>
          <a-button type="primary" :loading="submitLoading" @click="handleSubmit" class="submit-btn">
            确定
          </a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import {
  getCategoryPage,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus
} from '@/api/ShopCategoryApi';

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const modalVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const isEdit = ref(false);
const currentEditId = ref(null);

// 搜索表单
const searchForm = reactive({
  name: '',
  status: null
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`
});

// 表单数据
const formData = reactive({
  name: '',
  status: 1
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 100, message: '分类名称长度不能超过100个字符', trigger: 'blur' }
  ]
};

// 表格列定义
const columns = [
  {
    title: '分类ID',
    dataIndex: 'id',
    key: 'id',
    width: 100
  },
  {
    title: '分类名称',
    dataIndex: 'name',
    key: 'name',
    width: 240
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    slots: { customRender: 'status' },
    width: 140
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 200
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
    width: 200
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
    width: 160,
    fixed: 'right'
  }
];

// 计算属性
const modalTitle = computed(() => {
  return isEdit.value ? '编辑分类' : '新增分类';
});

// 生命周期
onMounted(() => {
  fetchCategoryList();
});

// 方法
const fetchCategoryList = () => {
  loading.value = true;

  const params = {
    current: pagination.current,
    size: pagination.pageSize,
    name: searchForm.name || null,
    status: searchForm.status
  };

  getCategoryPage(params, {
    onSuccess: (res) => {
      tableData.value = res.records || [];
      pagination.total = res.total || 0;
      pagination.current = res.current || 1;
      loading.value = false;
    },
    onError: (error) => {
      message.error('获取分类列表失败：' + error.message);
      loading.value = false;
    }
  });
};

const handleSearch = () => {
  pagination.current = 1;
  fetchCategoryList();
};

const handleReset = () => {
  searchForm.name = '';
  searchForm.status = null;
  pagination.current = 1;
  fetchCategoryList();
};

const handleTableChange = (pag) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchCategoryList();
};

const showCreateModal = () => {
  isEdit.value = false;
  currentEditId.value = null;
  modalVisible.value = true;
  // 使用 nextTick 确保 DOM 更新后再重置表单
  nextTick(() => {
    resetForm();
  });
};

const showEditModal = (record) => {
  isEdit.value = true;
  currentEditId.value = record.id;
  modalVisible.value = true;
  // 使用 nextTick 确保 DOM 更新后再设置表单数据
  nextTick(() => {
    Object.assign(formData, {
      name: record.name,
      status: record.status
    });
    // 清除表单验证状态
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  });
};

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    status: 1
  });
  // 清除表单验证状态
  if (formRef.value) {
    formRef.value.resetFields();
    formRef.value.clearValidate();
  }
};

const handleSubmit = () => {
  formRef.value.validate().then(() => {
    submitLoading.value = true;

    const params = isEdit.value ?
        { ...formData, id: currentEditId.value } :
        formData;

    const apiCall = isEdit.value ? updateCategory : createCategory;

    apiCall(params, {
      successMsg: isEdit.value ? '更新分类成功' : '创建分类成功',
      onSuccess: () => {
        submitLoading.value = false;
        modalVisible.value = false;
        fetchCategoryList();
        // 成功后重置表单
        nextTick(() => {
          resetForm();
        });
      },
      onError: (error) => {
        message.error((isEdit.value ? '更新' : '创建') + '分类失败：' + error.message);
        submitLoading.value = false;
      }
    });
  });
};

const handleCancel = () => {
  modalVisible.value = false;
  // 延迟重置表单，确保模态框完全关闭后再重置
  nextTick(() => {
    resetForm();
  });
};

const handleStatusChange = (id, status) => {
  const record = tableData.value.find(item => item.id === id);
  if (record) {
    record.statusLoading = true;
  }

  updateCategoryStatus(id, status, {
    successMsg: status === 1 ? '启用分类成功' : '禁用分类成功',
    onSuccess: () => {
      if (record) {
        record.status = status;
        record.statusDesc = status === 1 ? '启用' : '禁用';
        record.statusLoading = false;
      }
    },
    onError: (error) => {
      message.error('更新状态失败：' + error.message);
      if (record) {
        record.statusLoading = false;
      }
    }
  });
};

const handleDelete = (id) => {
  deleteCategory(id, {
    successMsg: '删除分类成功',
    onSuccess: () => {
      fetchCategoryList();
    },
    onError: (error) => {
      message.error('删除分类失败：' + error.message);
    }
  });
};
</script>

<style scoped>
/* ==========================================================================
   全局环境：轻卡片流式青葱绿底色
   ========================================================================== */
.shop-category-page {
  padding: 32px 36px 48px;
  background: #fafafa;
  min-height: 100vh;
  color: #1f2937;
  font-family: var(--font-body, -apple-system, BlinkMacSystemFont, sans-serif);
}
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(66,102,79,0.1); }
.title-wrapper { display: flex; align-items: baseline; gap: 14px; }
.title-indicator { width: 3px; height: 20px; background: #42664f; border-radius: 0; flex-shrink: 0; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; color: #1f2937; letter-spacing: 1px; }
.sub-badge { font-size: 12px; color: #657b6f; background: rgba(66,102,79,0.06); padding: 3px 12px; border-radius: 2px; font-weight: 500; }
.btn-create {
  background: #111 !important; border-color: #111 !important; color: #fff !important;
  border-radius: 6px !important; height: 36px !important; padding: 0 18px !important; font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-create:hover {
  background: #33503d !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(66, 102, 79, 0.25) !important;
}

/* ==========================================================================
   无边框轻量卡片化搜索区
   ========================================================================== */
.search-section { background: #fff; padding: 18px 22px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e5e5; }

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

.museum-search-form :deep(.ant-input),
.museum-search-form :deep(.ant-select-selector) {
  border-radius: 8px !important;
  border-color: #ced6d1 !important;
  height: 36px !important;
}

.museum-search-form :deep(.ant-select-selector) {
  display: flex;
  align-items: center;
}

.museum-search-form :deep(.ant-input:hover),
.museum-search-form :deep(.ant-input:focus),
.museum-search-form :deep(.ant-select-focused .ant-select-selector),
.museum-search-form :deep(.ant-select-selector:hover) {
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
   古蜀墨绿质感数据表格
   ========================================================================== */
.table-section { background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e5e5e5; }
.museum-theme-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa !important; color: #3e5246 !important; font-weight: 600;
  font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;
  border-bottom: 2px solid #e9eee9; padding: 12px 16px;
}
.museum-theme-table :deep(.ant-table-tbody > tr > td) { border-bottom: 1px solid #f2f4f2; padding: 12px 16px; font-size: 13px; }
.museum-theme-table :deep(.ant-table-tbody > tr:hover > td) { background: #fafafa !important; }

/* 状态单元格定制外观 */
.status-cell-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.museum-switch :deep(.ant-switch-checked) {
  background-color: #42664f !important;
}

.status-text {
  font-size: 13px;
  font-weight: 500;
}
.status-active {
  color: #42664f;
}
.status-disabled {
  color: #929e96;
}

/* 操作区域样式 */
.action-cell {
  display: flex;
  align-items: center;
}

.link-btn {
  font-weight: 600;
  padding: 0 !important;
}

.edit-link {
  color: #42664f !important;
}
.edit-link:hover {
  color: #283f31 !important;
}

.delete-link {
  color: #d9534f !important;
}

.action-divider {
  border-color: #d1dad4 !important;
  margin: 0 10px;
}

/* ==========================================================================
   内置表单及弹窗内部卡片美化
   ========================================================================== */
.edit-form-container {
  padding: 24px 24px 8px;
}

.status-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border-left: 4px solid;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.status-bar__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-bar__text {
  font-size: 13px;
  font-weight: 500;
}

.status-create {
  background: #f0f6f2;
  border-color: #d2e4d8;
  color: #42664f;
  .status-dot { background: #42664f; }
}

.status-edit {
  background: #fdfaf5;
  border-color: #faebd7;
  color: #c29147;
  .status-dot { background: #c29147; }
}

.form-card-box {
  background: #fafbfc;
  border: 1px solid #e9ecea;
  border-radius: 10px;
  padding: 24px 16px 4px;
}

.edit-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #3b4a40;
}

.museum-input {
  border-radius: 6px !important;
  border-color: #ced6d1 !important;
  height: 38px !important;
}
.museum-input:hover, .museum-input:focus {
  border-color: #42664f !important;
  box-shadow: 0 0 0 2px rgba(66, 102, 79, 0.1) !important;
}

/* 单选框美化 */
.museum-radio-group {
  display: inline-flex;
  gap: 16px;
}

.museum-radio :deep(.ant-radio-checked .ant-radio-inner) {
  border-color: #42664f !important;
  background-color: #42664f !important;
}
.museum-radio :deep(.ant-radio:hover .ant-radio-inner) {
  border-color: #42664f !important;
}

.radio-label-txt {
  font-weight: 500;
  color: #42664f;
}
.text-danger {
  color: #929e96;
}

/* 弹出框底部按钮区 */
.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.cancel-btn {
  border-radius: 6px !important;
  border-color: #ced6d1 !important;
  color: #55635a !important;
}

.submit-btn {
  background: #42664f !important;
  border-color: #42664f !important;
  border-radius: 6px !important;
}
.submit-btn:hover {
  background: #33503d !important;
}
</style>

<!-- 全局层级深层样式穿透处理：覆盖独立图层渲染的 AntD 模态框头尾及分页系统 -->
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
}

/* 全局弹窗二次确认气泡美化 */
.museum-popconfirm {
  .ant-popover-inner-content {
    padding: 14px 16px !important;
  }
  .ant-btn-primary {
    background: #42664f !important;
    border-color: #42664f !important;
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

/* Switch 开关底色深层覆盖 */
.museum-switch.ant-switch-checked {
  background-color: #42664f !important;
}
</style>