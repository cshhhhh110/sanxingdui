<template>
  <div class="order-manage-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="header-left">
        <span class="header-indicator"></span>
        <h2>订单管理</h2>
      </div>
      <div class="header-right">
        <a-tag color="#42664f">系统后台</a-tag>
      </div>
    </div>

    <!-- 查询条件卡片 -->
    <div class="elegant-card search-card">
      <a-form layout="inline" class="responsive-form">
        <a-form-item label="订单状态">
          <a-select v-model:value="searchParams.status" class="custom-select" placeholder="全部状态">
            <a-select-option :value="null">全部状态</a-select-option>
            <a-select-option :value="0">待支付</a-select-option>
            <a-select-option :value="1">已支付</a-select-option>
            <a-select-option :value="2">已发货</a-select-option>
            <a-select-option :value="3">已完成</a-select-option>
            <a-select-option :value="4">已关闭</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="订单号">
          <a-input v-model:value="searchParams.orderNo" class="custom-input" placeholder="请输入订单号" />
        </a-form-item>

        <a-form-item class="form-actions">
          <a-button type="primary" class="btn-primary" @click="handleSearch">查询</a-button>
          <a-button class="btn-secondary" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 订单列表卡片 -->
    <div class="elegant-card table-card">
      <a-table
          :dataSource="orderList"
          :columns="columns"
          :loading="loading"
          :pagination="{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }"
          @change="handleTableChange"
          row-key="id"
          class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'orderNo'">
            <span class="order-no-link" @click="viewOrderDetail(record.id)">{{ record.orderNo }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <span class="status-dot-badge" :class="'status-' + record.status">
              <span class="dot"></span>
              <span class="text">{{ record.statusName }}</span>
            </span>
          </template>

          <template v-else-if="column.key === 'payAmount'">
            <span class="table-price">¥{{ record.payAmount }}</span>
          </template>

          <template v-else-if="column.key === 'createTime'">
            <span class="table-time">{{ formatDate(record.createTime) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-cell">
              <span class="action-link" @click="viewOrderDetail(record.id)">详情</span>
              <a-dropdown v-if="record.status === 1" :align="{ overflow: { adjustX: true, adjustY: true } }">
                <span class="action-link more">
                  更多 <DownOutlined class="icon-down" />
                </span>
                <template #overlay>
                  <a-menu class="custom-menu" @click="({ key }) => key === 'ship' && handleShip(record)">
                    <a-menu-item key="ship">发货</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 发货对话框 -->
    <a-modal
        v-model:open="shipModalVisible"
        title="订单发货"
        @ok="handleShipSubmit"
        @cancel="shipModalVisible = false"
        wrapClassName="custom-modal"
        :okButtonProps="{ class: 'btn-primary' }"
        :cancelButtonProps="{ class: 'btn-secondary' }"
    >
      <div class="modal-form-wrapper">
        <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }">
          <a-form-item label="订单号">
            <span class="static-text">{{ currentOrder?.orderNo }}</span>
          </a-form-item>
          <a-form-item label="物流单号" required>
            <a-input v-model:value="logisticsNo" class="custom-input" placeholder="请输入快递/物流单号" />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 订单详情对话框 -->
    <a-modal
        v-model:open="detailModalVisible"
        title="订单详情面板"
        width="840px"
        centered
        :footer="null"
        wrapClassName="custom-modal detail-modal"
    >
      <div v-if="orderDetail" class="order-detail-panel">
        <!-- 头部主看板 -->
        <div class="detail-hero-banner">
          <div class="hero-left">
            <div class="hero-icon-box">
              <i class="fas fa-file-invoice"></i>
            </div>
            <div class="hero-meta">
              <div class="hero-sub">订单编号</div>
              <h3 class="hero-title">{{ orderDetail.orderNo }}</h3>
              <div class="hero-tags">
                <span class="status-dot-badge" :class="'status-' + orderDetail.status">
                  <span class="dot"></span>
                  <span class="text">{{ orderDetail.statusName }}</span>
                </span>
                <span class="pay-type-tag" v-if="orderDetail.payTypeName">
                  <i class="fas fa-credit-card"></i> {{ orderDetail.payTypeName }}
                </span>
              </div>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-price-label">实付金额</div>
            <div class="hero-price-value"><span>¥</span>{{ orderDetail.payAmount }}</div>
          </div>
        </div>

        <!-- 备注提示栏 -->
        <div class="remark-bar" :class="{ 'has-remark': orderDetail.remark }">
          <i class="fas fa-comment-dots"></i>
          <span class="remark-content"><strong>订单备注：</strong>{{ orderDetail.remark || '暂无客户备注信息' }}</span>
        </div>

        <!-- 数据网格卡片群 -->
        <div class="grid-section-title">基本财务与时间</div>
        <div class="info-modern-grid columns-4">
          <div class="modern-cell">
            <span class="cell-label">订单总额</span>
            <span class="cell-value emphasis">¥{{ orderDetail.totalAmount }}</span>
          </div>
          <div class="modern-cell">
            <span class="cell-label">实付金额</span>
            <span class="cell-value price">¥{{ orderDetail.payAmount }}</span>
          </div>
          <div class="modern-cell">
            <span class="cell-label">下单时间</span>
            <span class="cell-value timeline">{{ formatDate(orderDetail.createTime) }}</span>
          </div>
          <div class="modern-cell">
            <span class="cell-label">支付时间</span>
            <span class="cell-value timeline">{{ orderDetail.payTime ? formatDate(orderDetail.payTime) : '未支付' }}</span>
          </div>
        </div>

        <!-- 收货人信息卡片群 -->
        <div v-if="orderDetail.address" style="margin-top: 24px;">
          <div class="grid-section-title">物流及收货信息</div>
          <div class="info-modern-grid columns-3">
            <div class="modern-cell">
              <span class="cell-label">收货人姓名</span>
              <span class="cell-value user-name"><i class="fas fa-user"></i> {{ orderDetail.address.receiver }}</span>
            </div>
            <div class="modern-cell">
              <span class="cell-label">联系电话</span>
              <span class="cell-value phone-no"><i class="fas fa-phone-alt"></i> {{ orderDetail.address.phone }}</span>
            </div>
            <div class="modern-cell span-all">
              <span class="cell-label">收货地址</span>
              <span class="cell-value address-text"><i class="fas fa-map-marker-alt"></i> {{ orderDetail.address.fullAddress }}</span>
            </div>
          </div>
        </div>

        <!-- 商品清单表格区 -->
        <div class="detail-list-section">
          <div class="section-header-title">
            <span class="title-decorator"></span>
            商品清单
          </div>
          <div class="table-wrapper-mini">
            <a-table
                :dataSource="orderDetail.items"
                :columns="itemColumns"
                :pagination="false"
                row-key="id"
                size="middle"
                class="custom-table item-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'title'">
                  <span class="product-title-bold">{{ record.title }}</span>
                </template>
                <template v-if="column.key === 'price'">
                  <span class="text-muted">¥{{ record.price }}</span>
                </template>
                <template v-if="column.key === 'subtotal'">
                  <span class="item-subtotal">¥{{ record.subtotal }}</span>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { DownOutlined } from '@ant-design/icons-vue';
import { getAdminOrderPage, shipOrder, getOrderDetail } from '@/api/OrderApi';

const router = useRouter();

// 数据
const orderList = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const searchParams = reactive({
  status: null,
  orderNo: ''
});

const shipModalVisible = ref(false);
const currentOrder = ref(null);
const logisticsNo = ref('');

// 订单详情相关
const detailModalVisible = ref(false);
const orderDetail = ref(null);

// 表格列定义
const columns = [
  {
    title: '订单号',
    key: 'orderNo',
    dataIndex: 'orderNo',
    width: 200
  },
  {
    title: '商品信息',
    key: 'mainProductTitle',
    dataIndex: 'mainProductTitle'
  },
  {
    title: '数量',
    key: 'itemCount',
    dataIndex: 'itemCount',
    width: 80
  },
  {
    title: '实付金额',
    key: 'payAmount',
    dataIndex: 'payAmount',
    width: 120
  },
  {
    title: '订单状态',
    key: 'status',
    dataIndex: 'status',
    width: 110
  },
  {
    title: '下单时间',
    key: 'createTime',
    dataIndex: 'createTime',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
    fixed: 'right'
  }
];

// 订单明细表格列定义
const itemColumns = [
  {
    title: '商品名称',
    key: 'title',
    dataIndex: 'title'
  },
  {
    title: '单价',
    key: 'price',
    dataIndex: 'price',
    width: 120
  },
  {
    title: '数量',
    key: 'quantity',
    dataIndex: 'quantity',
    width: 100
  },
  {
    title: '小计',
    key: 'subtotal',
    dataIndex: 'subtotal',
    width: 140
  }
];

// 加载订单列表
const loadOrderList = () => {
  loading.value = true;

  const params = {
    current: currentPage.value,
    size: pageSize.value
  };

  if (searchParams.status !== null) {
    params.status = searchParams.status;
  }

  if (searchParams.orderNo) {
    params.orderNo = searchParams.orderNo;
  }

  getAdminOrderPage(params, {
    onSuccess: (res) => {
      orderList.value = res.records || [];
      total.value = res.total || 0;
      loading.value = false;
    },
    onError: () => {
      loading.value = false;
    }
  });
};

// 查询
const handleSearch = () => {
  currentPage.value = 1;
  loadOrderList();
};

// 重置
const handleReset = () => {
  searchParams.status = null;
  searchParams.orderNo = '';
  currentPage.value = 1;
  loadOrderList();
};

// 表格变化
const handleTableChange = (pagination) => {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
  loadOrderList();
};

// 查看详情
const viewOrderDetail = (orderId) => {
  getOrderDetail(orderId, {
    onSuccess: (data) => {
      orderDetail.value = data;
      detailModalVisible.value = true;
    },
    onError: (error) => {
      message.error('获取订单详情失败：' + error.message);
    }
  });
};

// 发货
const handleShip = (order) => {
  currentOrder.value = order;
  logisticsNo.value = '';
  shipModalVisible.value = true;
};

// 发货提交
const handleShipSubmit = () => {
  if (!logisticsNo.value) {
    message.error('请输入物流单号');
    return;
  }

  shipOrder(currentOrder.value.id, logisticsNo.value, {
    successMsg: '发货成功',
    onSuccess: () => {
      shipModalVisible.value = false;
      loadOrderList();
    }
  });
};

// 获取状态颜色 (样式重构后此逻辑依旧保留作为兼容，但视图层改为了更优雅的特定状态类名控制)
const getStatusColor = (status) => {
  const colorMap = {
    0: 'orange',
    1: 'blue',
    2: 'cyan',
    3: 'green',
    4: 'default'
  };
  return colorMap[status] || 'default';
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
};

// 页面加载
onMounted(() => {
  loadOrderList();
});
</script>

<style scoped>
/* ==========================================================================
   全局变量替代与基础容器布局
   ========================================================================== */
.order-manage-container {
  padding: 32px 36px 48px;
  background: #fafafa;
  min-height: 100vh;
  font-family: var(--font-body, -apple-system, BlinkMacSystemFont, sans-serif);
  color: #1f2937;
}

/* 页面顶部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(66,102,79,0.1);
}
.header-left { display: flex; align-items: baseline; gap: 12px; }
.header-indicator { width: 3px; height: 20px; background: #42664f; border-radius: 0; flex-shrink: 0; }
h2 { margin: 0; font-size: 22px; font-weight: 700; color: #1f2937; letter-spacing: 1px; }

/* 卡片 */
.elegant-card {
  background: #fff; border-radius: 8px; padding: 20px 24px; margin-bottom: 20px;
  border: 1px solid #e5e5e5; box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

/* ==========================================================================
   表单与输入组件定制样式 (Ant Design Override)
   ========================================================================== */
.responsive-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 0;
}

:deep(.ant-form-item) {
  margin-right: 28px !important;
  margin-bottom: 0 !important;
  display: flex;
  align-items: center;
}

:deep(.ant-form-item-label > label) {
  color: #5c6f64 !important;
  font-weight: 500;
}

.custom-select :deep(.ant-select-selector),
.custom-input {
  border-radius: 8px !important;
  border-color: #d1dad5 !important;
  height: 38px !important;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.custom-select :deep(.ant-select-selector) .ant-select-selection-item {
  line-height: 36px !important;
}

.custom-select:hover :deep(.ant-select-selector),
.custom-input:hover {
  border-color: #42664f !important;
}

.custom-select.ant-select-focused :deep(.ant-select-selector),
.custom-input:focus {
  border-color: #42664f !important;
  box-shadow: 0 0 0 3px rgba(66, 102, 79, 0.15) !important;
}

/* 按钮交互 */
.btn-primary {
  background: #42664f !important;
  border-color: #42664f !important;
  color: #fff !important;
  border-radius: 8px !important;
  height: 38px !important;
  padding: 0 20px !important;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(66, 102, 79, 0.2) !important;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #33503e !important;
  border-color: #33503e !important;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f0f3f1 !important;
  border-color: transparent !important;
  color: #42664f !important;
  border-radius: 8px !important;
  height: 38px !important;
  padding: 0 20px !important;
  font-weight: 500;
  margin-left: 10px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e1e7e3 !important;
  color: #2c3e35 !important;
}

/* ==========================================================================
   高级数据表格与高级行列样式
   ========================================================================== */
.custom-table :deep(.ant-table) {
  background: transparent;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa !important; color: #3e5246 !important; font-weight: 600;
  font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;
  border-bottom: 2px solid #e9eee9; padding: 12px 16px;
}
.custom-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f2f4f2; padding: 12px 16px; font-size: 13px;
}
.custom-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #fafafa !important;
}

/* 表格内字段深度定制 */
.order-no-link {
  color: #42664f;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
  border-bottom: 1px dashed rgba(66, 102, 79, 0.4);
}

.order-no-link:hover {
  color: #111;
  border-bottom-color: #111;
}

.table-price {
  color: #c85a53; /* 精细调整的高级深红/红茶色 */
  font-weight: 700;
  font-size: 15px;
}

.table-time {
  color: #6d8276;
  font-size: 13px;
}

/* 点状状态标签系统 (替换传统的粗糙块状Tag) */
.status-dot-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.status-dot-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

/* 状态色彩映射 */
.status-0 { background: #fff6ed; color: #c2410c; } .status-0 .dot { background: #f97316; } /* 待支付 */
.status-1 { background: #eff6ff; color: #1d4ed8; } .status-1 .dot { background: #3b82f6; } /* 已支付 */
.status-2 { background: #ecfeff; color: #0e7490; } .status-2 .dot { background: #06b6d4; } /* 已发货 */
.status-3 { background: #f0fdf4; color: #15803d; } .status-3 .dot { background: #22c55e; } /* 已完成 */
.status-4 { background: #f9fafb; color: #4b5563; } .status-4 .dot { background: #9ca3af; } /* 已关闭 */

/* 操作格布局 */
.action-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-link {
  color: #42664f;
  font-weight: 500;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.action-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.action-link.more {
  color: #71877a;
  display: flex;
  align-items: center;
}

.icon-down {
  font-size: 10px;
  margin-left: 2px;
}

/* 分页统一样式 */
.custom-table :deep(.ant-pagination-item-active) {
  border-color: #111 !important; background: #111 !important;
  a { color: #fff !important; }
}
.custom-table :deep(.ant-pagination-item:hover),
.custom-table :deep(.ant-pagination-next:hover),
.custom-table :deep(.ant-pagination-prev:hover) {
  border-color: #42664f !important; a { color: #42664f !important; }
}

/* ==========================================================================
   全局弹窗与右键/下拉菜单重塑
   ========================================================================== */
.custom-modal :deep(.ant-modal-content) {
  border-radius: 16px !important;
  overflow: hidden;
  padding: 0 !important;
}

.custom-modal :deep(.ant-modal-header) {
  padding: 20px 24px !important;
  background: #ffffff !important;
  border-bottom: 1px solid #edf1ee !important;
  margin-bottom: 0 !important;
}

.custom-modal :deep(.ant-modal-title) {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #1a2e22 !important;
}

.custom-modal :deep(.ant-modal-body) {
  padding: 24px !important;
}

.custom-modal :deep(.ant-modal-footer) {
  padding: 16px 24px !important;
  border-top: 1px solid #edf1ee !important;
  margin-top: 0 !important;
}

.modal-form-wrapper {
  padding: 8px 0;
}

.static-text {
  font-weight: 600;
  color: #1a2e22;
}

.custom-menu {
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
}

/* ==========================================================================
   极客现代风: 一体化订单详情大面板
   ========================================================================== */
.detail-modal :deep(.ant-modal-close) {
  top: 18px !important;
}

.order-detail-panel {
  display: flex;
  flex-direction: column;
}

/* 顶部一体化英雄背景板 */
.detail-hero-banner {
  background: linear-gradient(135deg, #eef3f0 0%, #e1e9e4 100%);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(66, 102, 79, 0.08);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-icon-box {
  width: 64px;
  height: 64px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(66, 102, 79, 0.08);
}

.hero-icon-box i {
  font-size: 28px;
  color: #42664f;
}

.hero-meta {
  display: flex;
  flex-direction: column;
}

.hero-sub {
  font-size: 12px;
  color: #71877a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a2e22;
  margin: 2px 0 8px 0;
}

.hero-tags {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pay-type-tag {
  font-size: 12px;
  background: rgba(66, 102, 79, 0.08);
  color: #42664f;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.hero-right {
  text-align: right;
}

.hero-price-label {
  font-size: 13px;
  color: #71877a;
  margin-bottom: 2px;
}

.hero-price-value {
  font-size: 28px;
  font-weight: 800;
  color: #c85a53;
  line-height: 1;
}

.hero-price-value span {
  font-size: 18px;
  margin-right: 2px;
}

/* 优雅备注通知栏 */
.remark-bar {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f7faf8;
  border-left: 4px solid #d1dad5;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #5c6f64;
}

.remark-bar i {
  color: #9cb1a5;
  font-size: 15px;
}

.remark-bar.has-remark {
  background: #fdfcea;
  border-left-color: #e6c229;
  color: #7d6b07;
}

.remark-bar.has-remark i {
  color: #e6c229;
}

/* 扁平网格数据看板群 (Modern Grid) */
.grid-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #71877a;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 24px 0 10px 0;
}

.info-modern-grid {
  display: grid;
  gap: 12px;
}

.info-modern-grid.columns-4 {
  grid-template-columns: repeat(4, 1fr);
}

.info-modern-grid.columns-3 {
  grid-template-columns: repeat(3, 1fr);
}

.modern-cell {
  background: #f8faf9;
  border: 1px solid #eef2f0;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modern-cell.span-all {
  grid-column: 1 / -1;
}

.cell-label {
  font-size: 12px;
  color: #83988c;
}

.cell-value {
  font-size: 14px;
  color: #2c3e35;
  font-weight: 600;
}

.cell-value.emphasis {
  color: #1a2e22;
}

.cell-value.price {
  color: #c85a53;
}

.cell-value.timeline {
  font-family: monospace;
  font-size: 13px;
  color: #4b5563;
}

.cell-value i {
  margin-right: 6px;
  color: #83988c;
}

/* 商品清单二级表格区 */
.detail-list-section {
  margin-top: 28px;
}

.section-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a2e22;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-decorator {
  width: 3px;
  height: 14px;
  background: #42664f;
  border-radius: 2px;
}

.table-wrapper-mini {
  border: 1px solid #eef2f0;
  border-radius: 8px;
  overflow: hidden;
}

.item-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa !important;
  padding: 12px 16px;
  font-size: 13px;
}

.item-table :deep(.ant-table-tbody > tr > td) {
  padding: 12px 16px;
  font-size: 13px;
}

.product-title-bold {
  font-weight: 500;
  color: #1a2e22;
}

.text-muted {
  color: #71877a;
}

.item-subtotal {
  font-weight: 600;
  color: #2c3e35;
}

/* ==========================================================================
   响应式断点深度适配 (Responsive Design)
   ========================================================================== */
@media (max-width: 992px) {
  .info-modern-grid.columns-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .order-manage-container {
    padding: 16px;
  }

  .responsive-form {
    flex-direction: column;
    align-items: stretch;
  }

  :deep(.ant-form-item) {
    margin-right: 0 !important;
    margin-bottom: 12px !important;
  }

  .form-actions {
    margin-bottom: 0 !important;
    display: flex;
    justify-content: flex-end;
  }

  .info-modern-grid.columns-3 {
    grid-template-columns: 1fr;
  }

  .detail-hero-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .hero-right {
    text-align: left;
    width: 100%;
    padding-top: 12px;
    border-top: 1px dashed rgba(66, 102, 79, 0.15);
  }
}
</style>