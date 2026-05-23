<template>
  <div class="user-management-container">
    <!-- 顶栏页面标题区 -->
    <div class="page-header-zone">
      <div class="header-left-cluster">
        <span class="brand-bar"></span>
        <h2 class="page-title">用户资源管理</h2>
      </div>
      <div class="header-right-cluster">
        <span class="live-counter">实时用户系统</span>
      </div>
    </div>

    <!-- 顶层轻量级过滤容器 -->
    <div class="elegant-filter-card">
      <div class="search-grid-flow">
        <a-input
            v-model:value="searchForm.username"
            placeholder="用户名"
            class="forest-input"
            allow-clear
            @pressEnter="handleSearch"
        >
          <template #prefix>
            <i class="fas fa-user icon-prefix"></i>
          </template>
        </a-input>

        <a-input
            v-model:value="searchForm.email"
            placeholder="邮箱"
            class="forest-input"
            allow-clear
            @pressEnter="handleSearch"
        >
          <template #prefix>
            <i class="fas fa-envelope icon-prefix"></i>
          </template>
        </a-input>

        <a-select
            v-model:value="searchForm.userType"
            placeholder="用户类型"
            class="forest-select"
            allow-clear
        >
          <a-select-option value="ADMIN">管理员</a-select-option>
          <a-select-option value="USER">普通用户</a-select-option>
        </a-select>

        <a-select
            v-model:value="searchForm.status"
            placeholder="状态"
            class="forest-select"
            allow-clear
        >
          <a-select-option value="ACTIVE">正常</a-select-option>
          <a-select-option value="INACTIVE">未激活</a-select-option>
          <a-select-option value="BANNED">已封禁</a-select-option>
        </a-select>

        <div class="filter-buttons-group">
          <a-button type="primary" class="btn-forest-primary" @click="handleSearch">
            <template #icon><i class="fas fa-search"></i></template>
            搜索
          </a-button>
          <a-button class="btn-forest-secondary" @click="handleReset">
            <template #icon><i class="fas fa-redo"></i></template>
            重置
          </a-button>
        </div>
      </div>
    </div>

    <!-- 主数据表格容器 -->
    <div class="elegant-table-card">
      <!-- 列表操作栏 -->
      <div class="table-action-header">
        <div class="action-left">
          <a-button type="primary" class="btn-forest-add" @click="handleAdd">
            <template #icon><i class="fas fa-plus"></i></template>
            新增用户
          </a-button>
        </div>
        <div class="action-right">
          <span class="selection-notice" v-if="selectedRowKeys.length > 0">
            已选中 <b>{{ selectedRowKeys.length }}</b> 项
          </span>
        </div>
      </div>

      <!-- 数据表现层（彻底退回经典渲染，杜绝任何 Vue3 渲染器异常） -->
      <a-table
          :columns="columns"
          :data-source="userList"
          :loading="loading"
          :pagination="pagination"
          :row-selection="rowSelection"
          :row-key="record => record.id"
          @change="handleTableChange"
          class="forest-theme-table"
      >
        <template #bodyCell="{ column, record }">
          <!-- 完全对齐原始条件的底层节点 -->
          <template v-if="column.key === 'avatar'">
            <div class="avatar-cell-wrapper">
              <a-avatar :src="getAvatarUrl(record.avatar)" :size="38" class="custom-forest-avatar">
                {{ record.name?.charAt(0) || record.username?.charAt(0) }}
              </a-avatar>
            </div>
          </template>

          <template v-else-if="column.key === 'sex'">
            <span class="gender-pill" :class="record.sex === '女' ? 'female' : 'male'">
              {{ record.sex || '未知' }}
            </span>
          </template>

          <template v-else-if="column.key === 'userType'">
            <span class="role-badge" :class="record.userType === 'ADMIN' ? 'role-admin' : 'role-user'">
              {{ getUserTypeLabel(record.userType) }}
            </span>
          </template>

          <template v-else-if="column.key === 'status'">
            <span class="status-dot-indicator" :class="'status-' + record.status">
              <span class="core-dot"></span>
              <span class="status-label">{{ getStatusLabel(record.status) }}</span>
            </span>
          </template>

          <template v-else-if="column.key === 'createdAt'">
            <span class="row-time-text">{{ formatDate(record.createdAt) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="row-operational-links">
              <span class="op-link-view" @click="handleView(record)">
                <i class="fas fa-eye"></i> 查看
              </span>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 用户详情高级视窗 -->
    <a-modal
        v-model:open="detailVisible"
        title="用户详情"
        :footer="null"
        centered
        width="440px"
        wrapClassName="forest-modal-wrapper detail-modal-container"
    >
      <div class="modern-detail-panel" v-if="detailUser">
        <!-- 头部用户氛围视窗 -->
        <div class="user-profile-hero">
          <div class="hero-avatar-ring">
            <a-avatar :size="64" :src="detailUser.avatarUrl" class="hero-avatar">
              {{ detailUser.name?.charAt(0) || detailUser.username?.charAt(0) }}
            </a-avatar>
          </div>
          <div class="hero-profile-meta">
            <h3>{{ detailUser.name || '-' }}</h3>
            <p>@{{ detailUser.username || '-' }}</p>
          </div>
          <div class="hero-profile-badges">
            <span class="profile-tag role">{{ detailUser.roleLabel }}</span>
            <span class="profile-tag status">{{ detailUser.statusLabel }}</span>
          </div>
        </div>

        <!-- 详细元数据表格体 -->
        <div class="user-meta-body">
          <div class="meta-item-row">
            <span class="meta-label"><i class="fas fa-envelope-open"></i> 邮箱</span>
            <span class="meta-value">{{ detailUser.email || '-' }}</span>
          </div>
          <div class="meta-item-row">
            <span class="meta-label"><i class="fas fa-phone-alt"></i> 手机号</span>
            <span class="meta-value">{{ detailUser.phone || '-' }}</span>
          </div>
          <div class="meta-item-row">
            <span class="meta-label"><i class="fas fa-venus-mars"></i> 性别</span>
            <span class="meta-value">{{ detailUser.sex || '未知' }}</span>
          </div>
          <div class="meta-item-row">
            <span class="meta-label"><i class="fas fa-calendar-check"></i> 创建时间</span>
            <span class="meta-value date-code">{{ detailUser.createdAt }}</span>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 编辑/新增林系配置对话框 -->
    <a-modal
        v-model:open="modalVisible"
        :title="modalTitle"
        :width="540"
        @ok="handleSubmit"
        @cancel="handleCancel"
        wrapClassName="forest-modal-wrapper form-modal-container"
        :okButtonProps="{ class: 'btn-forest-primary' }"
        :cancelButtonProps="{ class: 'btn-forest-secondary' }"
    >
      <div class="modal-form-scroller">
        <a-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            layout="vertical"
            class="forest-vertical-form"
        >
          <div class="form-grid-2-col">
            <a-form-item label="用户名" name="username">
              <a-input
                  v-model:value="formData.username"
                  placeholder="请输入用户名"
                  :disabled="isEdit"
                  class="forest-form-input"
              />
            </a-form-item>

            <a-form-item label="邮箱" name="email">
              <a-input v-model:value="formData.email" placeholder="请输入邮箱" class="forest-form-input" />
            </a-form-item>
          </div>

          <div class="form-grid-2-col">
            <a-form-item label="手机号" name="phone">
              <a-input v-model:value="formData.phone" placeholder="请输入手机号" class="forest-form-input" />
            </a-form-item>

            <a-form-item label="性别" name="sex">
              <a-select v-model:value="formData.sex" placeholder="请选择性别" class="forest-form-select">
                <a-select-option value="男">男</a-select-option>
                <a-select-option value="女">女</a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <a-form-item label="用户类型" name="userType">
            <a-select v-model:value="formData.userType" placeholder="请选择用户类型" class="forest-form-select">
              <a-select-option value="ADMIN">管理员</a-select-option>
              <a-select-option value="USER">普通用户</a-select-option>
            </a-select>
          </a-form-item>

          <div class="form-grid-2-col">
            <a-form-item label="密码" name="password">
              <a-input-password
                  v-model:value="formData.password"
                  placeholder="请输入密码"
                  class="forest-form-input"
              />
            </a-form-item>

            <a-form-item label="确认密码" name="confirmPassword">
              <a-input-password
                  v-model:value="formData.confirmPassword"
                  placeholder="请再次输入密码"
                  class="forest-form-input"
              />
            </a-form-item>
          </div>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/store/user'
import { getUserPage, register } from '@/api/user'

const userStore = useUserStore()
const baseAPI = import.meta.env.VITE_BASE_API || '/api'

// 当前登录用户ID
const currentUserId = computed(() => userStore.userId)

// 搜索表单
const searchForm = reactive({
  username: '',
  email: '',
  userType: undefined,
  status: undefined
})

// 表格数据
const userList = ref([])
const loading = ref(false)
const selectedRowKeys = ref([])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`
})

// 表格列配置
const columns = [
  {
    title: '头像',
    key: 'avatar',
    width: 90,
    align: 'center'
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    width: 110
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 180
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    key: 'phone',
    width: 140
  },
  {
    title: '性别',
    key: 'sex',
    width: 80,
    align: 'center'
  },
  {
    title: '用户类型',
    key: 'userType',
    width: 130,
    align: 'center'
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
    align: 'center'
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right',
    align: 'center'
  }
]

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = keys
  },
  getCheckboxProps: (record) => ({
    disabled: record.id === currentUserId.value
  })
}))

// 对话框相关
const modalVisible = ref(false)
const modalTitle = ref('新增用户')
const isEdit = ref(false)
const formRef = ref()
const formData = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  sex: undefined,
  userType: undefined,
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  userType: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' }
  ]
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const params = {
      currentPage: pagination.current,
      size: pagination.pageSize,
      username: searchForm.username || undefined,
      email: searchForm.email || undefined,
      userType: searchForm.userType || undefined,
      status: searchForm.status || undefined
    }

    const res = await getUserPage(params)
    userList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    message.error(error.message || '获取用户列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchUserList()
}

// 重置
const handleReset = () => {
  searchForm.username = ''
  searchForm.email = ''
  searchForm.userType = undefined
  searchForm.status = undefined
  pagination.current = 1
  fetchUserList()
}

// 表格变化
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchUserList()
}

// 新增
const handleAdd = () => {
  modalTitle.value = '新增用户'
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

// 用户详情抽屉
const detailVisible = ref(false)
const detailUser = ref({})

// 查看用户详情
const handleView = (record) => {
  detailUser.value = {
    ...record,
    avatarUrl: getAvatarUrl(record.avatar),
    roleLabel: getUserTypeLabel(record.userType),
    statusLabel: getStatusLabel(record.status),
    createdAt: formatDate(record.createdAt)
  }
  detailVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    // 验证两次密码是否一致
    if (formData.password !== formData.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    // 新增用户
    await register(formData)
    message.success('新增成功')

    modalVisible.value = false
    fetchUserList()
  } catch (error) {
    if (error.errorFields) {
      // 表单验证错误
      return
    }
    message.error(error.message || '新增失败')
    console.error(error)
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  formData.username = ''
  formData.nickname = ''
  formData.email = ''
  formData.phone = ''
  formData.sex = undefined
  formData.userType = undefined
  formData.password = ''
  formData.confirmPassword = ''
  formRef.value?.clearValidate()
}

// 获取头像URL
const getAvatarUrl = (avatar) => {
  return avatar ? baseAPI + avatar : ''
}

// 获取用户类型标签
const getUserTypeLabel = (userType) => {
  const typeMap = {
    'ADMIN': '管理员',
    'USER': '普通用户'
  }
  return typeMap[userType] || '未知'
}

// 获取状态标签
const getStatusLabel = (status) => {
  const statusMap = {
    'ACTIVE': '正常',
    'INACTIVE': '未激活',
    'BANNED': '已封禁'
  }
  return statusMap[status] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'ACTIVE': 'green',
    'INACTIVE': 'orange',
    'BANNED': 'red'
  }
  return colorMap[status] || 'default'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化
onMounted(() => {
  fetchUserList()
})
</script>

<style lang="scss" scoped>
$line: #42664f;
$bg: #fafafa;
$card: #fff;
$border: #e5e5e5;
$text: #111;
$muted: #666;
$faint: #999;

.user-management-container {
  padding: 32px 36px 48px; background: $bg; min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: $text;
}

// ========== 页头 ==========
.page-header-zone {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 28px; padding-bottom: 18px; border-bottom: 1px solid $border;
}
.header-left-cluster { display: flex; align-items: baseline; gap: 14px; }
.brand-bar { width: 3px; height: 20px; background: $line; border-radius: 0; flex-shrink: 0; }
.page-title { margin: 0; font-size: 22px; font-weight: 700; color: $text; letter-spacing: -0.5px; }
.live-counter { font-size: 12px; background: $bg; color: $muted; padding: 4px 12px; border-radius: 3px; border: 1px solid $border; }

// ========== 卡片 ==========
.elegant-filter-card {
  background: $card; border: 1px solid $border; border-radius: 6px; padding: 18px 22px; margin-bottom: 20px;
}
.elegant-table-card {
  background: $card; border: 1px solid $border; border-radius: 6px; padding: 24px;
}

// ========== 搜索 ==========
.search-grid-flow { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.forest-input, .forest-select { min-width: 160px; flex: 1; max-width: 220px; }
.forest-input :deep(.ant-input-affinity-wrapper),
:deep(.ant-input),
.forest-select :deep(.ant-select-selector) {
  border-radius: 4px !important; border-color: $border !important; height: 36px !important;
}
.forest-input:hover :deep(.ant-input),
.forest-input:hover :deep(.ant-input-affinity-wrapper),
.forest-select:hover :deep(.ant-select-selector) { border-color: $muted !important; }
.forest-input :deep(.ant-input-affinity-wrapper-focused),
.forest-select.ant-select-focused :deep(.ant-select-selector) {
  border-color: $line !important; box-shadow: 0 0 0 2px rgba(66,102,79,0.1) !important;
}
.icon-prefix { color: $faint; font-size: 14px; }
.filter-buttons-group { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; }

// ========== 按钮 ==========
.btn-forest-primary {
  background: $text !important; border-color: $text !important; color: #fff !important;
  border-radius: 5px !important; height: 36px !important; padding: 0 18px !important; font-weight: 500;
  &:hover { background: #333 !important; border-color: #333 !important; }
}
.btn-forest-secondary {
  background: $card !important; border: 1px solid $border !important; color: $text !important;
  border-radius: 5px !important; height: 36px !important; padding: 0 18px !important; font-weight: 500;
  &:hover { background: $bg !important; }
}
.btn-forest-add {
  background: $text !important; border-color: $text !important; color: #fff !important;
  border-radius: 5px !important; height: 36px !important; padding: 0 18px !important; font-weight: 500;
  &:hover { background: #333 !important; }
}

// ========== 表格操作栏 ==========
.table-action-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.selection-notice { font-size: 13px; color: $muted; background: $bg; padding: 5px 14px; border-radius: 4px; b { color: $text; } }

// ========== 表格 ==========
.forest-theme-table :deep(.ant-table-thead > tr > th) {
  background: $bg !important; color: $muted !important; font-weight: 600;
  font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase;
  border-bottom: 1px solid $line; padding: 12px 16px;
}
.forest-theme-table :deep(.ant-table-tbody > tr > td) { border-bottom: 1px solid #f5f5f5; padding: 12px 16px; font-size: 13px; }
.forest-theme-table :deep(.ant-table-tbody > tr:hover > td) { background: $bg !important; }
.forest-theme-table :deep(.ant-pagination-item-active) { border-color: $line !important; background: $line !important; a { color: #fff !important; } }

/* 内置组件样式修饰 */
.custom-forest-avatar {
  border: 1px solid rgba(66, 102, 79, 0.15);
  background: #e2e9e4;
  color: #42664f;
  font-weight: 600;
}

.gender-pill {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &.male { background: #eef6ff; color: #2563eb; }
  &.female { background: #fff1f2; color: #e11d48; }
}

.role-badge {
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;

  &.role-admin { background: rgba(197, 62, 53, 0.08); color: #c53e35; border: 1px solid rgba(197, 62, 53, 0.15); }
  &.role-user { background: rgba(66, 102, 79, 0.08); color: #42664f; border: 1px solid rgba(66, 102, 79, 0.15); }
}

/* 极简动态状态点 */
.status-dot-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .core-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .status-label {
    font-size: 13px;
    font-weight: 500;
  }

  &.status-ACTIVE {
    color: #2e7d32; .core-dot { background: #4caf50; box-shadow: 0 0 8px #4caf50; }
  }
  &.status-INACTIVE {
    color: #ed6c02; .core-dot { background: #ff9800; }
  }
  &.status-BANNED {
    color: #d32f2f; .core-dot { background: #f44336; box-shadow: 0 0 8px #f44336; }
  }
}

.row-time-text {
  color: #6a7e72;
  font-size: 13px;
  font-family: monospace;
}

.op-link-view {
  color: #42664f;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
  font-size: 13px;

  i { margin-right: 4px; }
  &:hover { color: #1e3325; text-decoration: underline; }
}

.forest-theme-table :deep(.ant-pagination-item-active) {
  border-color: #42664f !important;
  background: #42664f !important;
  a { color: #ffffff !important; }
}

/* ==========================================================================
   全局弹窗机制及详情控制看板
   ========================================================================== */
.forest-modal-wrapper :deep(.ant-modal-content) {
  border-radius: 16px !important;
  overflow: hidden;
  padding: 0 !important;
  box-shadow: 0 12px 40px rgba(22, 36, 27, 0.15) !important;
}

.forest-modal-wrapper :deep(.ant-modal-header) {
  padding: 20px 24px !important;
  border-bottom: 1px solid #edf1ee !important;
  margin-bottom: 0 !important;
}

.forest-modal-wrapper :deep(.ant-modal-title) {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #16241b !important;
}

.modern-detail-panel {
  display: flex;
  flex-direction: column;
}

.user-profile-hero {
  padding: 28px 24px;
  background: linear-gradient(135deg, #eef3f0 0%, #dfede4 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid #e1e9e4;

  .hero-avatar-ring {
    padding: 4px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 4px 14px rgba(66, 102, 79, 0.1);
    margin-bottom: 12px;
  }

  .hero-avatar {
    border: 2px solid #fff;
    background: #42664f;
    color: #fff;
    font-weight: 600;
  }
}

.hero-profile-meta {
  h3 { margin: 0; font-size: 18px; font-weight: 700; color: #16241b; }
  p { margin: 4px 0 0; font-size: 13px; color: #6a7e72; }
}

.hero-profile-badges {
  display: flex;
  gap: 8px;
  margin-top: 12px;

  .profile-tag {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;

    &.role { background: rgba(66, 102, 79, 0.1); color: #42664f; }
    &.status { background: #ffffff; color: #2e7d32; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
  }
}

.user-meta-body {
  padding: 12px 24px 28px;
}

.meta-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f2f5f3;

  &:last-child { border-bottom: none; }

  .meta-label {
    color: #788c80;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    i { width: 14px; color: #9cb0a4; }
  }

  .meta-value {
    color: #16241b;
    font-weight: 600;
    font-size: 14px;

    &.date-code {
      font-family: monospace;
      color: #4b5563;
      font-size: 13px;
    }
  }
}

/* 表单结构布局 */
.form-modal-container {
  :deep(.ant-modal-body) { padding: 24px !important; }
}

.modal-form-scroller {
  max-height: 70vh;
  overflow-y: auto;
  padding: 4px;
}

.forest-vertical-form {
  :deep(.ant-form-item) {
    margin-bottom: 18px !important;
    flex-direction: column !important;
    display: flex !important;
  }

  :deep(.ant-form-item-label) {
    text-align: left !important;
    padding-bottom: 6px !important;

    label {
      color: #3e5246 !important;
      font-weight: 600 !important;
      font-size: 13px;
      &::after { display: none !important; }
    }
  }
}

.form-grid-2-col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.forest-form-input,
.forest-form-select :deep(.ant-select-selector) {
  border-radius: 8px !important;
  height: 38px !important;
}

/* ==========================================================================
   响应式断点控制
   ========================================================================== */
@media (max-width: 992px) {
  .search-grid-flow {
    .forest-input, .forest-select { max-width: 48%; }
  }
}

@media (max-width: 768px) {
  .user-management-container { padding: 16px; }
  .search-grid-flow {
    .forest-input, .forest-select { max-width: 100% !important; width: 100% !important; }
  }
  .filter-buttons-group {
    width: 100%; margin-top: 4px;
    .btn-forest-primary, .btn-forest-secondary { flex: 1; justify-content: center; }
  }
  .form-grid-2-col { grid-template-columns: 1fr; gap: 0; }
}
</style>