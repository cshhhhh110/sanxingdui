<template>
  <div class="order-management-view">
    <div v-if="orderDetail" class="split-layout-container">

      <!-- 左侧主面板：明细与商品 -->
      <main class="main-content-panel">
        <!-- 页面新头部导航 -->
        <header class="view-navigation">
          <button class="minimal-back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回订单列表
          </button>
        </header>

        <!-- 商品明细区块 -->
        <section class="details-section">
          <h3 class="section-minimal-title">商品明细</h3>
          <a-table
              :dataSource="orderDetail.items"
              :columns="itemColumns"
              :pagination="false"
              row-key="id"
              class="minimalist-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'title'">
                <div class="product-meta-cell">
                  <div class="product-name">{{ record.title }}</div>
                  <div class="product-sku" v-if="record.skuTitle">
                    {{ record.skuTitle }}
                  </div>
                </div>
              </template>
              <template v-else-if="column.key === 'price'">
                <span class="currency-cell">¥{{ record.price }}</span>
              </template>
              <template v-else-if="column.key === 'subtotal'">
                <span class="currency-cell subtotal">¥{{ record.subtotal }}</span>
              </template>
            </template>
          </a-table>
        </section>

        <!-- 财务结算展示区 -->
        <section class="financial-invoice-zone">
          <div class="invoice-row">
            <span class="invoice-label">商品总额</span>
            <span class="invoice-value">¥{{ orderDetail.totalAmount }}</span>
          </div>
          <div class="invoice-row grand-total">
            <span class="invoice-label">实付金额</span>
            <span class="invoice-value">¥{{ orderDetail.payAmount }}</span>
          </div>
        </section>

        <!-- 订单备注 -->
        <section class="memo-card-section" v-if="orderDetail.remark">
          <h3 class="section-minimal-title">买家备注</h3>
          <div class="memo-bubble">
            <p>{{ orderDetail.remark }}</p>
          </div>
        </section>
      </main>

      <!-- 右侧侧边栏：状态流转与订单信息 -->
      <aside class="sidebar-status-panel">
        <!-- 核心状态卡片 -->
        <div class="status-summary-tile">
          <div class="status-indicator" :class="'status-' + orderDetail.status"></div>
          <div class="status-text-group">
            <span class="meta-caption">当前订单状态</span>
            <h2 class="status-main-heading">{{ orderDetail.statusName }}</h2>
          </div>
        </div>

        <!-- 操作行为区 (按钮组) -->
        <div class="action-trigger-hub">
          <a-button
              v-if="orderDetail.status === 0"
              type="primary"
              block
              size="large"
              class="forest-btn-primary"
              @click="handlePayOrder"
          >
            <i class="fas fa-credit-card"></i> 立即履行支付
          </a-button>

          <a-button
              v-if="orderDetail.status === 2"
              type="primary"
              block
              size="large"
              class="forest-btn-primary"
              @click="handleConfirmOrder"
          >
            确认签收商品
          </a-button>

          <a-button
              v-if="orderDetail.status === 0 || orderDetail.status === 1"
              danger
              block
              ghost
              class="forest-btn-danger"
              @click="handleCancelOrder"
          >
            取消当前订单
          </a-button>
        </div>

        <!-- 核心摘要 -->
        <div class="metadata-profile-box">
          <h4 class="profile-block-title">核心摘要</h4>
          <div class="profile-data-list">
            <div class="profile-row">
              <span class="p-label">订单编号</span>
              <span class="p-value selectable">{{ orderDetail.orderNo }}</span>
            </div>
            <div class="profile-row">
              <span class="p-label">创建时间</span>
              <span class="p-value">{{ formatDate(orderDetail.createTime) }}</span>
            </div>
            <div class="profile-row">
              <span class="p-label">支付时间</span>
              <span class="p-value">{{ orderDetail.payTime ? formatDate(orderDetail.payTime) : '未触发支付' }}</span>
            </div>
            <div class="profile-row">
              <span class="p-label">结算通道</span>
              <span class="p-value">{{ orderDetail.payTypeName || '暂无代号' }}</span>
            </div>
            <div class="profile-row">
              <span class="p-label">物流单号</span>
              <span class="p-value">{{ orderDetail.logisticsNo || '尚未配载' }}</span>
            </div>
          </div>
        </div>

        <!-- 物流交付地址 -->
        <div class="metadata-profile-box" v-if="orderDetail.address">
          <h4 class="profile-block-title">配送资产</h4>
          <div class="shipping-address-widget">
            <div class="receiver-identity">
              <span class="r-name">{{ orderDetail.address.receiver }}</span>
              <span class="r-phone">{{ orderDetail.address.phone }}</span>
            </div>
            <div class="receiver-geo">
              {{ orderDetail.address.fullAddress }}
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 全局极致简约加载状态 -->
    <div v-else class="minimal-spinner-container">
      <a-spin size="large" />
    </div>

    <!-- ==========================================================================
       高级重构 1：高定艺术级支付模态弹窗
       ========================================================================== -->
    <Transition name="fade">
      <div v-if="isPayModalVisible" class="premium-modal-overlay" @click.self="closePayModal">
        <Transition name="slide-up">
          <div v-if="isPayModalVisible" class="premium-modal-card">
            <header class="p-modal-header">
              <div class="p-modal-title-group">
                <span class="p-modal-subtitle">CHECKOUT</span>
                <h3 class="p-modal-title">选择结算方式</h3>
              </div>
              <button class="p-modal-close-btn" @click="closePayModal">✕</button>
            </header>

            <div class="p-modal-bill-board">
              <span class="bill-label">应付总额 (CNY)</span>
              <span class="bill-amount">¥{{ orderDetail?.payAmount }}</span>
              <span class="bill-order-no">订单号: {{ orderDetail?.orderNo }}</span>
            </div>

            <div class="pay-channels-grid">
              <div
                  class="channel-option-card alipay-style"
                  :class="{ active: selectedChannel === 'ALI' }"
                  @click="selectedChannel = 'ALI'"
              >
                <div class="channel-icon-wrapper"><i class="fab fa-alipay"></i></div>
                <div class="channel-info">
                  <span class="channel-name">支付宝支付</span>
                  <span class="channel-desc">支持储蓄卡、信用卡、花呗</span>
                </div>
                <div class="channel-checker"></div>
              </div>

              <div
                  class="channel-option-card wechat-style"
                  :class="{ active: selectedChannel === 'WECHAT' }"
                  @click="selectedChannel = 'WECHAT'"
              >
                <div class="channel-icon-wrapper"><i class="fab fa-weixin"></i></div>
                <div class="channel-info">
                  <span class="channel-name">微信支付</span>
                  <span class="channel-desc">亿万用户的无感安全结算选择</span>
                </div>
                <div class="channel-checker"></div>
              </div>
            </div>

            <footer class="p-modal-footer">
              <a-button class="p-modal-cancel-btn" @click="closePayModal">取消</a-button>
              <a-button type="primary" class="p-modal-confirm-btn" :loading="isSubmittingPay" @click="executePayment">
                安全加签支付
              </a-button>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ==========================================================================
       高级重构 2：全新克制交互——取消订单挽留弹窗
       ========================================================================== -->
    <Transition name="fade">
      <div v-if="isCancelModalVisible" class="premium-modal-overlay" @click.self="closeCancelModal">
        <Transition name="slide-up">
          <div v-if="isCancelModalVisible" class="premium-modal-card alert-layout">
            <!-- 顶部情绪轻提示：克制的警示插图/图标 -->
            <div class="alert-icon-graphic">
              <div class="graphic-pulse-ring"></div>
              <i class="fas fa-exclamation-circle"></i>
            </div>

            <!-- 核心文案引导 -->
            <div class="alert-text-center">
              <h3 class="alert-heading">确定要放弃该订单吗？</h3>
              <p class="alert-paragraph">
                取消后，本订单内的优惠锁定、库存配额将同步失效，精挑细选的商品可能无法再次以此价格购入。
              </p>
            </div>

            <!-- 精巧的轻量级关联资产摘要 -->
            <div class="alert-mini-spec">
              <div class="spec-inline">
                <span>锁价金额：</span>
                <strong style="color: #42664f;">¥{{ orderDetail?.payAmount }}</strong>
              </div>
              <div class="spec-inline">
                <span>商品总数：</span>
                <span>{{ orderDetail?.items?.length || 0 }} 件商品</span>
              </div>
            </div>

            <!-- 操作按钮矩阵（反向心智设计：主色留给挽留按钮，取消按钮弱化，防止误触） -->
            <div class="alert-action-vertical">
              <a-button
                  type="primary"
                  class="forest-btn-primary alert-keep-btn"
                  @click="closeCancelModal"
              >
                保留订单，我再想想
              </a-button>
              <a-button
                  type="link"
                  class="alert-confirm-cancel-btn"
                  :loading="isSubmittingCancel"
                  @click="executeCancelOrder"
              >
                坚持取消当前订单
              </a-button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Modal, message } from 'ant-design-vue';
import { getOrderDetail, cancelOrder, confirmOrder, payOrder } from '@/api/OrderApi';

const router = useRouter();
const route = useRoute();

// 数据层
const orderDetail = ref(null);

// 支付弹窗响应式流
const isPayModalVisible = ref(false);
const selectedChannel = ref('ALI');
const isSubmittingPay = ref(false);

// 【新增】取消订单弹窗响应式流
const isCancelModalVisible = ref(false);
const isSubmittingCancel = ref(false);

const itemColumns = [
  { title: '商品名称', key: 'title', dataIndex: 'title' },
  { title: '单价', key: 'price', dataIndex: 'price', width: 120 },
  { title: '数量', key: 'quantity', dataIndex: 'quantity', width: 100 },
  { title: '小计', key: 'subtotal', dataIndex: 'subtotal', width: 120 }
];

const loadOrderDetail = () => {
  const orderId = route.params.id;
  getOrderDetail(orderId, {
    onSuccess: (res) => { orderDetail.value = res; },
    onError: () => { router.push('/orders'); }
  });
};

// 支付模块动作
const handlePayOrder = () => { selectedChannel.value = 'ALI'; isPayModalVisible.value = true; };
const closePayModal = () => { if (!isSubmittingPay.value) isPayModalVisible.value = false; };
const executePayment = () => {
  isSubmittingPay.value = true;
  payOrder(orderDetail.value.id, selectedChannel.value, {
    successMsg: '支付成功',
    onSuccess: () => { isSubmittingPay.value = false; isPayModalVisible.value = false; loadOrderDetail(); },
    onError: (error) => { isSubmittingPay.value = false; message.error('支付失败：' + error.message); }
  });
};

// 【重构完善】取消订单模块动作
const handleCancelOrder = () => {
  isCancelModalVisible.value = true;
};

const closeCancelModal = () => {
  if (!isSubmittingCancel.value) isCancelModalVisible.value = false;
};

const executeCancelOrder = () => {
  isSubmittingCancel.value = true;
  cancelOrder(orderDetail.value.id, {
    successMsg: '订单已取消',
    onSuccess: () => {
      isSubmittingCancel.value = false;
      isCancelModalVisible.value = false;
      loadOrderDetail();
    },
    onError: (error) => {
      isSubmittingCancel.value = false;
      message.error('取消失败：' + error.message);
    }
  });
};

// 确认收货与返回（未改动底层）
const handleConfirmOrder = () => {
  Modal.confirm({
    title: '确认收货',
    content: '确定已收到商品吗？',
    onOk: () => {
      confirmOrder(orderDetail.value.id, {
        successMsg: '已确认收货',
        onSuccess: () => { loadOrderDetail(); }
      });
    }
  });
};

const goBack = () => { router.back(); };
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
};

onMounted(() => { loadOrderDetail(); });
</script>

<style scoped>
/* ==========================================================================
   原框架及支付高定样式 (保持森林绿设计连续性)
   ========================================================================== */
.order-management-view { min-height: 100vh; background-color: #f8faf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
.split-layout-container { display: flex; max-width: 1440px; margin: 0 auto; padding: 40px; gap: 40px; }
.main-content-panel { flex: 1; background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #eef2f0; }
.sidebar-status-panel { width: 380px; display: flex; flex-direction: column; gap: 24px; }
.view-navigation { margin-bottom: 32px; }
.minimal-back-btn { background: transparent; border: none; color: #627d6c; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 0; }
.minimal-back-btn:hover { color: #42664f; }
.section-minimal-title { font-size: 18px; font-weight: 600; color: #1a2b20; margin-bottom: 24px; position: relative; padding-left: 12px; }
.section-minimal-title::before { content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px; background-color: #42664f; border-radius: 2px; }
.minimalist-table :deep(.ant-table) { background: transparent; }
.minimalist-table :deep(.ant-table-thead > tr > th) { background-color: #f1f5f3; color: #4a5d51; font-weight: 500; border-bottom: none; padding: 16px; }
.minimalist-table :deep(.ant-table-tbody > tr > td) { border-bottom: 1px solid #f1f5f3; padding: 24px 16px; }
.product-meta-cell { display: flex; flex-direction: column; gap: 4px; }
.product-name { font-size: 15px; font-weight: 500; color: #1a2b20; }
.product-sku { font-size: 12px; color: #7a8f82; background-color: #f1f5f3; padding: 2px 6px; border-radius: 4px; width: max-content; }
.currency-cell { font-family: sans-serif; color: #2c3e35; font-size: 15px; }
.currency-cell.subtotal { font-weight: 600; color: #1a2b20; }
.financial-invoice-zone { margin-top: 32px; border-top: 1px dashed #dbe3df; padding-top: 24px; display: flex; flex-direction: column; align-items: flex-end; gap: 16px; }
.invoice-row { display: flex; justify-content: space-between; width: 280px; font-size: 14px; color: #627d6c; }
.invoice-row.grand-total { font-size: 22px; color: #1a2b20; font-weight: 700; border-top: 1px solid #eef2f0; padding-top: 16px; margin-top: 4px; }
.invoice-row.grand-total .invoice-value { color: #42664f; }
.memo-bubble { background-color: #f8faf9; border-radius: 8px; padding: 20px; border-left: 4px solid #ccd6d0; }
.memo-bubble p { margin: 0; font-size: 14px; color: #4a5d51; line-height: 1.6; }
.status-summary-tile { background: #ffffff; border-radius: 14px; padding: 24px; border: 1px solid #eef2f0; display: flex; align-items: center; gap: 18px; }
.status-indicator { width: 12px; height: 12px; border-radius: 50%; position: relative; }
.status-indicator::after { content: ''; position: absolute; width: 100%; height: 100%; border-radius: 50%; background: inherit; animation: pulse-ring 2s infinite; opacity: 0.4; }
.status-0 { background-color: #ff9900; }
.status-1 { background-color: #3388ff; }
.status-2 { background-color: #00ccbb; }
.status-3 { background-color: #42664f; }
.status-4 { background-color: #99aab0; }
@keyframes pulse-ring { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.6); opacity: 0; } 100% { transform: scale(0.95); opacity: 0; } }
.status-text-group { display: flex; flex-direction: column; }
.meta-caption { font-size: 12px; color: #8fa396; letter-spacing: 1px; }
.status-main-heading { margin: 2px 0 0 0; font-size: 24px; font-weight: 700; color: #1a2b20; }
.action-trigger-hub { display: flex; flex-direction: column; gap: 12px; }
.forest-btn-primary { background-color: #42664f !important; border-color: #42664f !important; color: #ffffff !important; border-radius: 10px !important; font-weight: 500 !important; height: 48px !important; font-size: 15px !important; box-shadow: 0 4px 12px rgba(66, 102, 79, 0.15) !important; transition: all 0.2s ease !important; }
.forest-btn-primary:hover { background-color: #35523f !important; transform: translateY(-1px); }
.forest-btn-danger { border-radius: 10px !important; height: 44px !important; font-size: 14px !important; border-color: #d1dad4 !important; color: #829488 !important; }
.metadata-profile-box { background: #ffffff; border-radius: 14px; padding: 24px; border: 1px solid #eef2f0; }
.profile-block-title { font-size: 13px; font-weight: 600; color: #8fa396; margin-bottom: 16px; }
.profile-data-list { display: flex; flex-direction: column; gap: 14px; }
.profile-row { display: flex; justify-content: space-between; font-size: 13px; align-items: center; }
.p-label { color: #627d6c; }
.p-value { color: #1a2b20; font-weight: 500; }
.p-value.selectable { font-family: monospace; background-color: #f1f5f3; padding: 2px 6px; border-radius: 4px; }
.shipping-address-widget { display: flex; flex-direction: column; gap: 8px; }
.receiver-identity { display: flex; gap: 12px; align-items: baseline; }
.r-name { font-size: 15px; font-weight: 600; color: #1a2b20; }
.r-phone { font-size: 13px; color: #627d6c; }
.receiver-geo { font-size: 13px; color: #4a5d51; line-height: 1.5; }
.minimal-spinner-container { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 80px); }

/* 公用弹窗基础遮罩 */
.premium-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(26, 43, 32, 0.45); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.premium-modal-card { background: #ffffff; width: 480px; border-radius: 20px; padding: 32px; box-shadow: 0 20px 50px rgba(26, 43, 32, 0.15); border: 1px solid rgba(255, 255, 255, 0.8); }

/* 支付专有内部样式 */
.p-modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.p-modal-title-group { display: flex; flex-direction: column; }
.p-modal-subtitle { font-size: 11px; font-weight: 700; color: #8fa396; letter-spacing: 1.5px; }
.p-modal-title { margin: 4px 0 0 0; font-size: 20px; font-weight: 600; color: #1a2b20; }
.p-modal-close-btn { background: #f1f5f3; border: none; width: 28px; height: 28px; border-radius: 50%; color: #627d6c; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.p-modal-close-btn:hover { background: #42664f; color: #ffffff; }
.p-modal-bill-board { background: linear-gradient(135deg, #f8faf9 0%, #edf2f0 100%); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; border: 1px solid #e4ece8; }
.bill-label { font-size: 12px; color: #627d6c; }
.bill-amount { font-size: 32px; font-weight: 700; color: #42664f; margin: 4px 0; }
.bill-order-no { font-size: 11px; color: #99aab0; }
.pay-channels-grid { display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px; }
.channel-option-card { display: flex; align-items: center; padding: 16px 20px; border: 2px solid #edf2f0; border-radius: 12px; cursor: pointer; position: relative; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.channel-icon-wrapper { font-size: 26px; margin-right: 16px; display: flex; align-items: center; }
.alipay-style .channel-icon-wrapper { color: #1677ff; }
.wechat-style .channel-icon-wrapper { color: #07c160; }
.channel-info { display: flex; flex-direction: column; flex: 1; }
.channel-name { font-size: 15px; font-weight: 600; color: #1a2b20; }
.channel-desc { font-size: 12px; color: #8fa396; margin-top: 2px; }
.channel-checker { width: 20px; height: 20px; border: 2px solid #dcdfdc; border-radius: 50%; position: relative; transition: all 0.2s; }
.channel-option-card.active { border-color: #42664f; background-color: #f5f8f6; }
.channel-option-card.active .channel-checker { border-color: #42664f; background-color: #42664f; }
.channel-option-card.active .channel-checker::after { content: ''; position: absolute; left: 6px; top: 3px; width: 5px; height: 9px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.p-modal-footer { display: flex; gap: 12px; }
.p-modal-cancel-btn { flex: 1; height: 46px !important; border-radius: 10px !important; border-color: #edf2f0 !important; background: #f8faf9 !important; color: #627d6c !important; }
.p-modal-cancel-btn:hover { background: #edf2f0 !important; color: #1a2b20 !important; }
.p-modal-confirm-btn { flex: 2; height: 46px !important; border-radius: 10px !important; background-color: #42664f !important; border-color: #42664f !important; font-weight: 600 !important; box-shadow: 0 4px 14px rgba(66, 102, 79, 0.2) !important; }

/* ==========================================================================
   新重构扩充 2：取消订单专属轻量级“挽留”弹窗样式
   ========================================================================== */
.premium-modal-card.alert-layout {
  width: 440px;
  padding: 40px 32px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 顶部警告视觉艺术 */
.alert-icon-graphic {
  position: relative;
  width: 56px;
  height: 56px;
  background-color: #fff1f0; /* 轻微且柔和的警示红底色 */
  color: #ff4d4f;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-bottom: 24px;
}

.graphic-pulse-ring {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  border-radius: 50%;
  border: 2px solid #ff4d4f;
  animation: alert-pulse-ring 2.5s infinite ease-out;
  opacity: 0;
}

@keyframes alert-pulse-ring {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* 文案排版 */
.alert-text-center {
  text-align: center;
  margin-bottom: 20px;
}

.alert-heading {
  font-size: 18px;
  font-weight: 600;
  color: #1a2b20;
  margin-bottom: 8px;
}

.alert-paragraph {
  font-size: 13px;
  color: #627d6c;
  line-height: 1.6;
  margin: 0;
}

/* 挽留资产卡片小部件 */
.alert-mini-spec {
  background-color: #f8faf9;
  border: 1px solid #edf2f0;
  border-radius: 8px;
  padding: 12px 18px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
}

.spec-inline {
  font-size: 12px;
  color: #4a5d51;
}
.spec-inline strong {
  font-size: 14px;
  font-family: sans-serif;
}

/* 反向交互心智设计：引导用户保留 */
.alert-action-vertical {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
}

.alert-keep-btn {
  height: 46px !important;
  font-size: 14px !important;
  letter-spacing: 0.5px;
}

.alert-confirm-cancel-btn {
  color: #829488 !important;
  font-size: 12px !important;
  height: 36px !important;
  transition: color 0.2s;
}

.alert-confirm-cancel-btn:hover {
  color: #ff4d4f !important; /* 鼠标移入变红色，代表坚持破坏 */
}

/* Vue 动效过渡器 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(20px); opacity: 0; }

@media (max-width: 1024px) {
  .split-layout-container { flex-direction: column; padding: 20px; }
  .sidebar-status-panel { width: 100%; }
  .premium-modal-card { width: calc(100% - 40px); margin: 20px; padding: 24px; }
}
</style>
