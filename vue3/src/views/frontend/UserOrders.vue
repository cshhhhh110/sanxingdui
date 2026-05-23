<template>
  <div class="orders-page">
    <!-- 标题区 -->
    <header class="page-title">
      <h2>我的订单</h2>
      <div class="line"></div>
    </header>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <a-radio-group v-model:value="currentStatus" button-style="outline" @change="handleStatusChange">
        <a-radio-button :value="null">全部</a-radio-button>
        <a-radio-button :value="0">待付款</a-radio-button>
        <a-radio-button :value="1">已支付</a-radio-button>
        <a-radio-button :value="2">待收货</a-radio-button>
        <a-radio-button :value="3">已完成</a-radio-button>
        <a-radio-button :value="4">已关闭</a-radio-button>
      </a-radio-group>
    </div>

    <!-- 订单列表区域 -->
    <div class="orders-table-wrapper">
      <div class="table-header">
        <span>商品信息</span>
        <span>支付金额</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      <div v-for="order in orderList" :key="order.id" class="order-row">
        <div class="order-info">
          <div class="product-name">{{ order.mainProductTitle }}</div>
          <div class="order-meta">订单号: {{ order.orderNo }} | {{ formatDate(order.createTime) }}</div>
        </div>
        <div class="order-amount">¥{{ order.payAmount }}</div>
        <div class="order-status">
          <a-tag :color="getStatusColor(order.status)">{{ order.statusName }}</a-tag>
        </div>
        <div class="order-actions">
          <a-button type="link" size="small" @click="viewOrderDetail(order.id)">查看</a-button>
          <a-button v-if="order.status === 0 || order.status === 1" type="link" danger size="small" @click="handleCancelOrder(order.id)">取消</a-button>
          <a-button v-if="order.status === 2" type="primary" size="small" @click="handleConfirmOrder(order.id)">确认收货</a-button>
        </div>
      </div>

      <a-empty v-if="orderList.length === 0" style="padding: 100px 0" description="暂无订单" />
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="total > 0">
      <a-pagination v-model:current="currentPage" v-model:page-size="pageSize" :total="total" @change="loadOrderList" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Modal } from 'ant-design-vue';
import { getUserOrderPage, cancelOrder, confirmOrder } from '@/api/OrderApi';

const router = useRouter();

const orderList = ref([]);
const currentStatus = ref(null);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const loadOrderList = () => {
  const params = { current: currentPage.value, size: pageSize.value };
  if (currentStatus.value !== null) params.status = currentStatus.value;

  getUserOrderPage(params, {
    onSuccess: (res) => {
      orderList.value = res.records || [];
      total.value = res.total || 0;
    }
  });
};

const handleStatusChange = () => {
  currentPage.value = 1;
  loadOrderList();
};

const viewOrderDetail = (orderId) => {
  router.push(`/orders/${orderId}`);
};

const handleCancelOrder = (orderId) => {
  Modal.confirm({
    title: '确认取消',
    content: '确定要取消该订单吗？',
    okButtonProps: { style: { background: '#42664f', borderColor: '#42664f' } },
    onOk: () => {
      cancelOrder(orderId, {
        successMsg: '订单已取消',
        onSuccess: () => loadOrderList()
      });
    }
  });
};

const handleConfirmOrder = (orderId) => {
  Modal.confirm({
    title: '确认收货',
    content: '确定已收到商品吗？',
    okButtonProps: { style: { background: '#42664f', borderColor: '#42664f' } },
    onOk: () => {
      confirmOrder(orderId, {
        successMsg: '已确认收货',
        onSuccess: () => loadOrderList()
      });
    }
  });
};

const getStatusColor = (status) => {
  const colorMap = { 0: 'orange', 1: 'green', 2: 'cyan', 3: 'green', 4: 'default' };
  return colorMap[status] || 'default';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
};

onMounted(() => {
  loadOrderList();
});
</script>

<style scoped>
.orders-page { padding: 40px 80px; background: #f8faf9; min-height: 100vh; }
.page-title h2 { font-size: 28px; color: #42664f; margin-bottom: 8px; }
.line { width: 50px; height: 4px; background: #42664f; margin-bottom: 30px; }
.filter-bar { margin-bottom: 30px; }

:deep(.ant-radio-button-wrapper) { border: none !important; background: transparent !important; color: #888; padding: 0 20px; font-size: 15px; }
:deep(.ant-radio-button-wrapper-checked) { color: #42664f !important; font-weight: bold; border-bottom: 2px solid #42664f !important; box-shadow: none !important; }

.orders-table-wrapper { background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); overflow: hidden; }
.table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 20px; background: #f4f7f5; color: #42664f; font-weight: 600; }
.order-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 25px 20px; border-top: 1px solid #edf0ed; align-items: center; transition: 0.2s; }
.order-row:hover { background: #fcfdfe; }

.product-name { font-weight: 600; font-size: 16px; color: #333; }
.order-meta { font-size: 12px; color: #999; margin-top: 4px; }
.order-amount { font-size: 18px; font-weight: bold; color: #42664f; }

.order-actions :deep(.ant-btn-link) { color: #42664f; }
.order-actions :deep(.ant-btn-primary) { background: #42664f; border-color: #42664f; }

.pagination-wrap { margin-top: 40px; display: flex; justify-content: center; }
:deep(.ant-pagination-item-active) { border-color: #42664f !important; }
:deep(.ant-pagination-item-active a) { color: #42664f !important; }
</style>