<template>
  <div class="order-confirm-wrapper">
    <main class="order-confirm-page">
      <section class="order-hero" :style="heroStyle">
        <button class="back-link" type="button" @click="router.push('/shop')">
          <i class="fas fa-arrow-left"></i>
          返回商城
        </button>
        <div class="hero-copy">
          <span>Checkout</span>
          <h1>确认订单</h1>
          <p>确认收货地址、商品数量与备注信息后，即可提交这件来自古蜀灵感的文创订单。</p>
        </div>
      </section>

      <div v-if="loading" class="loading-container">
        <a-skeleton :loading="true" active :paragraph="{ rows: 8 }" />
      </div>

      <div v-else class="order-layout">
        <div class="order-main">
          <section class="section-panel address-panel">
            <div class="section-heading">
              <div>
                <span>Delivery</span>
                <h2>收货地址</h2>
              </div>
              <button class="text-action" type="button" @click="showAddressModal = true">
                <i class="fas fa-plus"></i>
                新增地址
              </button>
            </div>

            <div v-if="addressList.length === 0" class="empty-state">
              <i class="fas fa-map-marker-alt"></i>
              <p>暂无收货地址，请先添加地址</p>
              <a-button type="primary" @click="showAddressModal = true">
                添加收货地址
              </a-button>
            </div>

            <a-radio-group v-else v-model:value="selectedAddressId" class="address-list">
              <div
                  v-for="addr in addressList"
                  :key="addr.id"
                  class="address-item"
                  :class="{ selected: selectedAddressId === addr.id }"
                  @click="selectedAddressId = addr.id"
              >
                <a-radio :value="addr.id">
                  <div class="address-info">
                    <div class="address-header">
                      <span class="receiver-name">{{ addr.receiver }}</span>
                      <span class="receiver-phone">{{ addr.phone }}</span>
                      <a-tag v-if="addr.isDefault" color="green">默认地址</a-tag>
                    </div>
                    <div class="address-detail">
                      {{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}
                    </div>
                  </div>
                </a-radio>
              </div>
            </a-radio-group>
          </section>

          <section class="section-panel">
            <div class="section-heading">
              <div>
                <span>Selected Item</span>
                <h2>商品信息</h2>
              </div>
            </div>

            <div v-if="product" class="product-info">
              <div class="product-image">
                <img v-if="product.coverFilePath" :src="product.coverFilePath" :alt="product.title" />
                <div v-else class="no-image">
                  <i class="fas fa-image"></i>
                </div>
              </div>
              <div class="product-details">
                <span class="product-category">{{ product.categoryName || '文创精选' }}</span>
                <h3>{{ product.title }}</h3>
                <div class="product-meta">
                  <span>单价 ¥{{ product.price }}</span>
                  <span>数量 {{ orderQuantity }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="section-panel">
            <div class="section-heading">
              <div>
                <span>Message</span>
                <h2>订单备注</h2>
              </div>
            </div>
            <a-textarea
                v-model:value="orderRemark"
                placeholder="选填，请输入订单备注信息"
                :rows="4"
                :maxlength="200"
                show-count
            />
          </section>
        </div>

        <aside class="summary-panel">
          <div class="summary-title">
            <span>Order Summary</span>
            <h2>订单金额</h2>
          </div>

          <div class="summary-lines">
            <div class="amount-row">
              <span>商品金额</span>
              <strong>¥{{ totalAmount }}</strong>
            </div>
            <div class="amount-row">
              <span>配送服务</span>
              <strong>待确认</strong>
            </div>
            <div class="amount-row total-row">
              <span>应付总额</span>
              <strong>¥{{ totalAmount }}</strong>
            </div>
          </div>

          <a-button
              type="primary"
              size="large"
              block
              :loading="submitting"
              :disabled="!selectedAddressId"
              @click="handleSubmitOrder"
          >
            提交订单
            <i class="fas fa-arrow-right"></i>
          </a-button>

          <p class="summary-tip">提交后可在“我的订单”中查看订单状态。</p>
        </aside>
      </div>

      <a-modal
          v-model:open="showAddressModal"
          title="新增收货地址"
          :width="600"
          @ok="handleAddAddress"
          @cancel="resetAddressForm"
      >
        <a-form
            :model="addressForm"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 19 }"
        >
          <a-form-item label="收货人" required>
            <a-input v-model:value="addressForm.receiver" placeholder="请输入收货人姓名" />
          </a-form-item>
          <a-form-item label="联系电话" required>
            <a-input v-model:value="addressForm.phone" placeholder="请输入联系电话" />
          </a-form-item>
          <a-form-item label="省份" required>
            <a-input v-model:value="addressForm.province" placeholder="请输入省份" />
          </a-form-item>
          <a-form-item label="城市" required>
            <a-input v-model:value="addressForm.city" placeholder="请输入城市" />
          </a-form-item>
          <a-form-item label="区/县" required>
            <a-input v-model:value="addressForm.district" placeholder="请输入区/县" />
          </a-form-item>
          <a-form-item label="详细地址" required>
            <a-textarea
                v-model:value="addressForm.detail"
                placeholder="请输入详细地址"
                :rows="3"
            />
          </a-form-item>
          <a-form-item label="设为默认">
            <a-switch v-model:checked="addressForm.isDefault" />
          </a-form-item>
        </a-form>
      </a-modal>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getProductById } from '@/api/ShopProductApi'
import { getUserAddressList, createAddress } from '@/api/AddressApi'
import { createOrder } from '@/api/OrderApi'

// ========== 路由 ==========
const route = useRoute()
const router = useRouter()

// ========== 响应式数据 ==========
const loading = ref(true)
const submitting = ref(false)
const product = ref(null)
const orderQuantity = ref(1)
const addressList = ref([])
const selectedAddressId = ref(null)
const orderRemark = ref('')
const showAddressModal = ref(false)

// 新增地址表单
const addressForm = ref({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

// ========== 计算属性 ==========
const totalAmount = computed(() => {
  if (!product.value) return '0.00'
  return (product.value.price * orderQuantity.value).toFixed(2)
})

const heroStyle = computed(() => {
  if (!product.value?.coverFilePath) return {}
  return {
    '--hero-image': `url("${product.value.coverFilePath}")`
  }
})

// ========== 生命周期 ==========
onMounted(() => {
  const productId = route.query.productId
  const quantity = route.query.quantity

  if (!productId || !quantity) {
    message.error('订单信息不完整')
    router.push('/shop')
    return
  }

  orderQuantity.value = parseInt(quantity)
  fetchProductDetail(productId)
  fetchAddressList()
})

// ========== 方法 ==========
const fetchProductDetail = (productId) => {
  getProductById(productId, {
    onSuccess: (res) => {
      product.value = res
      loading.value = false
    },
    onError: (error) => {
      message.error('获取商品信息失败：' + error.message)
      loading.value = false
    }
  })
}

const fetchAddressList = () => {
  getUserAddressList({
    onSuccess: (res) => {
      addressList.value = res || []
      // 自动选择默认地址
      const defaultAddr = addressList.value.find(addr => addr.isDefault)
      if (defaultAddr) {
        selectedAddressId.value = defaultAddr.id
      } else if (addressList.value.length > 0) {
        selectedAddressId.value = addressList.value[0].id
      }
    },
    onError: (error) => {
      message.error('获取地址列表失败：' + error.message)
    }
  })
}

const handleAddAddress = () => {
  // 验证表单
  if (!addressForm.value.receiver || !addressForm.value.phone ||
      !addressForm.value.province || !addressForm.value.city ||
      !addressForm.value.district || !addressForm.value.detail) {
    message.warning('请填写完整的地址信息')
    return
  }

  createAddress(addressForm.value, {
    successMsg: '地址添加成功',
    onSuccess: (res) => {
      showAddressModal.value = false
      resetAddressForm()
      fetchAddressList()
    },
    onError: (error) => {
      message.error('添加地址失败：' + error.message)
    }
  })
}

const resetAddressForm = () => {
  addressForm.value = {
    receiver: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false
  }
}

const handleSubmitOrder = () => {
  if (!selectedAddressId.value) {
    message.warning('请选择收货地址')
    return
  }

  submitting.value = true

  const orderData = {
    productId: product.value.id,
    quantity: orderQuantity.value,
    addressId: selectedAddressId.value,
    remark: orderRemark.value || null
  }

  createOrder(orderData, {
    successMsg: '订单提交成功',
    onSuccess: (res) => {
      submitting.value = false
      // 跳转到订单详情页
      router.push(`/orders/${res.id}`)
    },
    onError: (error) => {
      message.error('订单提交失败：' + error.message)
      submitting.value = false
    }
  })
}
</script>

<style scoped lang="less">
.order-confirm-wrapper {
  --shop-primary: #42664f;
  --shop-primary-deep: #2f4b3a;
  --shop-ink: #1f2f25;
  --shop-muted: #6f7d73;
  --shop-line: #dfe8e2;
  --shop-soft: #f6f9f7;
  --shop-price: #b84a3a;

  min-height: 100vh;
  color: var(--shop-ink);
  background:
      radial-gradient(circle at 80% 12%, rgba(66, 102, 79, 0.1), transparent 24%),
      linear-gradient(180deg, #ffffff 0%, #f7faf8 48%, #ffffff 100%);
}

.order-confirm-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.order-hero {
  position: relative;
  overflow: hidden;
  padding: 28px;
  border: 1px solid var(--shop-line);
  background:
      linear-gradient(105deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.82) 46%, rgba(255, 255, 255, 0.58) 100%),
      var(--hero-image, url('@/assets/sanxingdui_06_qingtong_liren.png')) center / cover;
  box-shadow: 0 24px 70px rgba(31, 47, 37, 0.08);
  animation: riseIn 0.62s ease both;

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background: linear-gradient(180deg, transparent 58%, rgba(255, 255, 255, 0.22));
  }
}

.back-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  color: var(--shop-primary);
  cursor: pointer;
  border: 1px solid rgba(66, 102, 79, 0.22);
  background: rgba(255, 255, 255, 0.78);
  transition: transform 0.25s ease, border-color 0.25s ease;

  &:hover {
    border-color: var(--shop-primary);
    transform: translateX(-2px);
  }
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin-top: 44px;

  span {
    color: var(--shop-primary);
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
  }

  h1 {
    margin: 14px 0 0;
    color: var(--shop-ink);
    font-size: clamp(36px, 5vw, 62px);
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: 0;
  }

  p {
    max-width: 620px;
    margin: 16px 0 0;
    color: var(--shop-muted);
    font-size: 16px;
    line-height: 1.9;
  }
}

.loading-container,
.section-panel,
.summary-panel {
  border: 1px solid var(--shop-line);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 42px rgba(31, 47, 37, 0.06);
}

.loading-container {
  margin-top: 22px;
  padding: 36px;
}

.order-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 22px;
  margin-top: 22px;
}

.order-main {
  display: grid;
  gap: 18px;
}

.section-panel,
.summary-panel {
  padding: 26px;
  animation: riseIn 0.58s ease both;
}

.section-heading,
.summary-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  span {
    color: var(--shop-primary);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  h2 {
    margin: 8px 0 0;
    color: var(--shop-ink);
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 0;
  }
}

.text-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  color: var(--shop-primary);
  cursor: pointer;
  border: 1px solid rgba(66, 102, 79, 0.22);
  background: #ffffff;
  transition: transform 0.24s ease, background 0.24s ease, color 0.24s ease;

  &:hover {
    color: #ffffff;
    background: var(--shop-primary);
    transform: translateY(-1px);
  }
}

.empty-state {
  display: grid;
  min-height: 240px;
  place-items: center;
  color: var(--shop-muted);
  text-align: center;
  border: 1px dashed rgba(66, 102, 79, 0.26);
  background: var(--shop-soft);

  i {
    display: block;
    margin-bottom: 14px;
    color: rgba(66, 102, 79, 0.42);
    font-size: 50px;
  }

  p {
    margin-bottom: 18px;
  }

  :deep(.ant-btn-primary) {
    border: none;
    border-radius: 0;
    background: var(--shop-primary);
  }
}

.address-list {
  display: grid;
  width: 100%;
  gap: 12px;
}

.address-item {
  padding: 17px;
  cursor: pointer;
  border: 1px solid var(--shop-line);
  background: #ffffff;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover,
  &.selected {
    border-color: rgba(66, 102, 79, 0.48);
    box-shadow: 0 16px 32px rgba(31, 47, 37, 0.08);
    transform: translateY(-2px);
  }

  &.selected {
    box-shadow: inset 3px 0 0 var(--shop-primary), 0 16px 32px rgba(31, 47, 37, 0.08);
  }

  :deep(.ant-radio-wrapper) {
    width: 100%;
  }

  :deep(.ant-radio-checked .ant-radio-inner) {
    border-color: var(--shop-primary);
    background-color: var(--shop-primary);
  }
}

.address-info {
  width: 100%;
}

.address-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  margin-bottom: 8px;
}

.receiver-name {
  color: var(--shop-ink);
  font-size: 17px;
  font-weight: 800;
}

.receiver-phone,
.address-detail {
  color: var(--shop-muted);
}

.address-detail {
  line-height: 1.8;
}

.product-info {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
}

.product-image {
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--shop-line);
  background: var(--shop-soft);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.45s ease;
  }

  &:hover img {
    transform: scale(1.06);
  }
}

.no-image {
  display: grid;
  height: 100%;
  place-items: center;
  color: #a8b3ac;

  i {
    font-size: 42px;
  }
}

.product-category {
  color: var(--shop-primary);
  font-size: 13px;
  font-weight: 800;
}

.product-details h3 {
  margin: 8px 0 14px;
  color: var(--shop-ink);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.45;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: var(--shop-muted);
  font-weight: 700;
}

.section-panel :deep(.ant-input),
.section-panel :deep(.ant-input-affix-wrapper),
.section-panel :deep(.ant-input-number),
.section-panel :deep(textarea.ant-input) {
  border-color: var(--shop-line);
  border-radius: 0;
  box-shadow: none;
}

.section-panel :deep(.ant-input:focus),
.section-panel :deep(textarea.ant-input:focus),
.section-panel :deep(.ant-input:hover),
.section-panel :deep(textarea.ant-input:hover) {
  border-color: var(--shop-primary);
}

.summary-panel {
  position: sticky;
  top: 18px;
  align-self: start;

  :deep(.ant-btn[disabled]),
  :deep(.ant-btn[disabled]:hover),
  :deep(.ant-btn[disabled]:focus) {
    color: #ffffff;
    border-color: var(--shop-primary-deep);
    background: var(--shop-primary-deep);
    text-shadow: none;
    box-shadow: none;
    opacity: 1;
  }
}

.summary-title {
  display: block;
}

.summary-lines {
  display: grid;
  gap: 14px;
  margin: 24px 0;
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: #4e6758;
  font-weight: 800;

  strong {
    color: #263b2d;
    font-weight: 900;
  }
}

.total-row {
  margin-top: 6px;
  padding-top: 18px;
  border-top: 1px solid var(--shop-line);

  strong {
    color: var(--shop-price);
    font-size: 30px;
    line-height: 1;
  }
}

.summary-panel :deep(.ant-btn-primary) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 50px;
  border: none;
  border-radius: 0;
  background: var(--shop-primary-deep);
  box-shadow: 0 14px 30px rgba(66, 102, 79, 0.22);
  color: #ffffff;
  font-weight: 900;
  letter-spacing: 0;
  transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;

  &:hover:not(:disabled) {
    background: var(--shop-primary-deep);
    box-shadow: 0 18px 36px rgba(66, 102, 79, 0.28);
    transform: translateY(-2px);
  }
}

.summary-tip {
  margin: 16px 0 0;
  color: var(--shop-muted);
  font-size: 13px;
  line-height: 1.7;
}

:deep(.ant-modal-content),
:deep(.ant-modal-header) {
  border-radius: 0;
}

:deep(.ant-modal .ant-btn-primary),
:deep(.ant-switch-checked) {
  background: var(--shop-primary);
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .order-layout {
    grid-template-columns: 1fr;
  }

  .summary-panel {
    position: static;
  }
}

@media (max-width: 768px) {
  .order-confirm-page {
    padding: 18px 16px 44px;
  }

  .order-hero,
  .section-panel,
  .summary-panel {
    padding: 20px;
  }

  .hero-copy {
    margin-top: 34px;
  }

  .product-info {
    grid-template-columns: 1fr;
  }

  .product-image {
    width: 100%;
  }

  .section-heading {
    display: grid;
  }
}
</style>
