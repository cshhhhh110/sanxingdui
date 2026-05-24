<template>
  <div class="product-page">
    <header class="page-top">
      <div class="page-top__main">
        <h1 class="page-top__title">商品管理</h1>
      </div>
      <a-button type="primary" class="btn-primary" @click="showCreateModal">
        新增商品
      </a-button>
    </header>

    <section class="filter-bar">
      <a-input
        v-model:value="searchForm.title"
        placeholder="商品标题"
        allow-clear
        class="filter-input filter-input--wide"
        @pressEnter="handleSearch"
      />
      <a-select
        v-model:value="searchForm.categoryId"
        placeholder="商品分类"
        allow-clear
        class="filter-select"
      >
        <a-select-option v-for="category in categoryList" :key="category.id" :value="category.id">
          {{ category.name }}
        </a-select-option>
      </a-select>
      <a-select
        v-model:value="searchForm.status"
        placeholder="状态"
        allow-clear
        class="filter-select"
      >
        <a-select-option :value="1">上架</a-select-option>
        <a-select-option :value="0">下架</a-select-option>
      </a-select>
      <a-select
        v-model:value="searchForm.hasStock"
        placeholder="库存"
        allow-clear
        class="filter-select"
      >
        <a-select-option :value="true">有库存</a-select-option>
        <a-select-option :value="false">无库存</a-select-option>
      </a-select>
      <div class="filter-bar__btns">
        <a-button type="primary" class="btn-primary" @click="handleSearch">查询</a-button>
        <a-button class="btn-ghost" @click="handleReset">重置</a-button>
      </div>
    </section>

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

    <section class="table-wrap">
      <a-table
        :columns="orderedColumns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: tableScrollX }"
        @change="handleTableChange"
        row-key="id"
        size="middle"
        class="minimal-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'coverImage'">
            <a-image
              v-if="record.coverFilePath"
              :src="record.coverFilePath"
              :width="48"
              :height="48"
              :preview="true"
              class="cover-thumb"
            />
            <span v-else class="no-cover">—</span>
          </template>

          <template v-else-if="column.key === 'title'">
            <button type="button" class="cell-link cell-link--title" @click="showDetailModal(record)">
              {{ record.title }}
            </button>
          </template>

          <template v-else-if="column.key === 'categoryName'">
            <span class="cell-tag">{{ record.categoryName || '—' }}</span>
          </template>

          <template v-else-if="column.key === 'price'">
            <span class="cell-price">¥{{ record.price }}</span>
          </template>

          <template v-else-if="column.key === 'stock'">
            <span :class="['cell-stock', record.stock > 0 ? 'cell-stock--has' : 'cell-stock--empty']">
              {{ record.stock }}
            </span>
          </template>

          <template v-else-if="column.key === 'status'">
            <span :class="['cell-status', record.status === 1 ? 'cell-status--on' : 'cell-status--off']">
              {{ record.statusName }}
            </span>
          </template>

          <template v-else-if="column.key === 'createTime'">
            <span class="cell-mono">{{ formatDate(record.createTime) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="action-group">
              <button type="button" class="cell-link" @click="showDetailModal(record)">详情</button>
              <span class="action-sep">|</span>
              <button type="button" class="cell-link" @click="showEditModal(record)">编辑</button>
              <span class="action-sep">|</span>
              <a-dropdown>
                <button type="button" class="cell-link cell-link--more">
                  更多 <DownOutlined />
                </button>
                <template #overlay>
                  <a-menu class="minimal-dropdown" @click="({ key }) => handleAction(key, record)">
                    <a-menu-item key="stock">库存管理</a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" danger>删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="840px"
      class="minimal-modal"
      :mask-closable="false"
      @cancel="handleCancel"
    >
      <div class="modal-body">
        <a-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 20 }"
          class="minimal-form"
        >
          <a-form-item label="商品标题" name="title">
            <a-input v-model:value="formData.title" placeholder="请输入商品标题" :maxlength="200" />
          </a-form-item>

          <a-form-item label="副标题" name="subtitle">
            <a-input v-model:value="formData.subtitle" placeholder="请输入副标题" :maxlength="255" />
          </a-form-item>

          <a-form-item label="商品分类" name="categoryId">
            <a-select v-model:value="formData.categoryId" placeholder="请选择分类">
              <a-select-option v-for="category in categoryList" :key="category.id" :value="category.id">
                {{ category.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <div class="form-row">
            <a-form-item label="商品价格" name="price">
              <a-input-number v-model:value="formData.price" :min="0" :precision="2" placeholder="0.00" style="width: 100%" />
            </a-form-item>
            <a-form-item label="库存数量" name="stock">
              <a-input-number v-model:value="formData.stock" :min="0" :precision="0" placeholder="0" style="width: 100%" />
            </a-form-item>
          </div>

          <a-form-item label="封面图片" name="coverFileId">
            <a-upload
              v-model:file-list="coverFileList"
              list-type="picture-card"
              :before-upload="beforeImageUpload"
              :custom-request="handleCoverUpload"
              :max-count="1"
              @remove="handleCoverRemove"
            >
              <div v-if="coverFileList.length < 1" class="upload-trigger">
                <PlusOutlined />
                <div>上传封面</div>
              </div>
            </a-upload>
          </a-form-item>

          <a-form-item label="商品图片" name="imageFiles">
            <a-upload
              v-model:file-list="imageFileList"
              list-type="picture-card"
              :before-upload="beforeImageUpload"
              :custom-request="handleImageUpload"
              :max-count="10"
              @remove="handleImageRemove"
              multiple
            >
              <div v-if="imageFileList.length < 10" class="upload-trigger">
                <PlusOutlined />
                <div>上传图片</div>
              </div>
            </a-upload>
          </a-form-item>

          <a-form-item label="商品详情" name="detail">
            <RichTextEditor v-model="formData.detail" placeholder="请输入商品详情" height="300px" />
          </a-form-item>

          <a-form-item label="上架状态" name="status">
            <a-radio-group v-model:value="formData.status">
              <a-radio :value="1">上架</a-radio>
              <a-radio :value="0">下架</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-form>
      </div>
      <template #footer>
        <div class="modal-footer">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="submitLoading">
            {{ isEdit ? '保存更改' : '创建商品' }}
          </a-button>
        </div>
      </template>
    </a-modal>

    <a-modal
      title="商品详情"
      v-model:open="detailVisible"
      :footer="null"
      width="840px"
      class="minimal-modal"
    >
      <div v-if="currentProduct" class="detail-content">
        <div class="detail-header">
          <a-image v-if="currentProduct.coverFilePath" :src="currentProduct.coverFilePath" :width="120" :preview="true" />
          <div v-else class="detail-no-cover">暂无封面</div>
          <div class="detail-info">
            <h3>{{ currentProduct.title }}</h3>
            <p v-if="currentProduct.subtitle">{{ currentProduct.subtitle }}</p>
            <div class="detail-meta">
              <span :class="['detail-status', currentProduct.status === 1 ? 'on' : 'off']">
                {{ currentProduct.statusName }}
              </span>
              <span class="detail-category">{{ currentProduct.categoryName }}</span>
            </div>
          </div>
        </div>
        <div class="detail-stats">
          <div class="stat-item">
            <span class="stat-label">价格</span>
            <span class="stat-value price">¥{{ currentProduct.price }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">库存</span>
            <span class="stat-value">{{ currentProduct.stock }} 件</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">创建时间</span>
            <span class="stat-value">{{ formatDate(currentProduct.createTime) }}</span>
          </div>
        </div>
        <div v-if="currentProduct.detail" class="detail-rich" v-html="currentProduct.detail"></div>
        <div v-else class="detail-no-content">暂无商品详情</div>
      </div>
    </a-modal>

    <a-modal
      title="库存管理"
      v-model:open="stockVisible"
      width="440px"
      class="minimal-modal"
      @ok="handleStockSubmit"
    >
      <div class="stock-form">
        <p class="stock-product">{{ currentProduct?.title }}</p>
        <p class="stock-current">当前库存：{{ currentProduct?.stock }} 件</p>
        <a-form-item label="新库存">
          <a-input-number v-model:value="newStock" :min="0" :precision="0" style="width: 100%" />
        </a-form-item>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DownOutlined } from '@ant-design/icons-vue'
import {
  getProductPage,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  onShelfProduct,
  offShelfProduct,
  updateProductStock
} from '@/api/ShopProductApi'
import { getEnabledCategories } from '@/api/ShopCategoryApi'
import { uploadBusinessFile, getFilesByBusinessField, deleteBusinessFile } from '@/api/FileApi'
import RichTextEditor from '@/components/common/RichTextEditor.vue'

const COLUMN_STORAGE_KEY = 'backend-product-column-order'

const loading = ref(false)
const tableData = ref([])
const modalVisible = ref(false)
const detailVisible = ref(false)
const stockVisible = ref(false)
const submitLoading = ref(false)
const stockLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)
const currentEditId = ref(null)
const currentProduct = ref(null)
const categoryList = ref([])
const coverFileList = ref([])
const imageFileList = ref([])
const newStock = ref(0)

const searchForm = reactive({
  title: '',
  categoryId: null,
  status: null,
  hasStock: null
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 条`
})

const formData = reactive({
  title: '',
  subtitle: '',
  categoryId: null,
  price: null,
  stock: 0,
  detail: '',
  status: 1
})

const formRules = {
  title: [
    { required: true, message: '请输入商品标题', trigger: 'blur' },
    { max: 200, message: '商品标题长度不能超过200个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '商品价格不能小于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存数量不能小于0', trigger: 'blur' }
  ]
}

const COLUMN_DEF_MAP = {
  id: { title: '商品ID', dataIndex: 'id', key: 'id', width: 200 },
  coverImage: { title: '封面', key: 'coverImage', width: 80, align: 'center' },
  title: { title: '商品标题', dataIndex: 'title', key: 'title', ellipsis: true },
  categoryName: { title: '分类', key: 'categoryName', width: 120 },
  price: { title: '价格', key: 'price', width: 90, align: 'right' },
  stock: { title: '库存', key: 'stock', width: 80, align: 'center' },
  status: { title: '状态', key: 'status', width: 90, align: 'center' },
  createTime: { title: '创建时间', key: 'createTime', width: 168 }
}

const DEFAULT_COLUMN_ORDER = ['id', 'coverImage', 'title', 'categoryName', 'price', 'stock', 'status', 'createTime']

const ACTION_COLUMN = {
  title: '操作',
  key: 'action',
  width: 160,
  fixed: 'right',
  align: 'center'
}

function loadColumnOrder() {
  try {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY)
    if (!saved) return [...DEFAULT_COLUMN_ORDER]
    const parsed = JSON.parse(saved)
    const valid = parsed.filter((k) => DEFAULT_COLUMN_ORDER.includes(k))
    const missing = DEFAULT_COLUMN_ORDER.filter((k) => !valid.includes(k))
    return valid.length ? [...valid, ...missing] : [...DEFAULT_COLUMN_ORDER]
  } catch {
    return [...DEFAULT_COLUMN_ORDER]
  }
}

const columnOrder = ref(loadColumnOrder())
const draggableColumnKeys = computed(() => columnOrder.value)

const orderedColumns = computed(() => {
  const cols = columnOrder.value.map((key) => COLUMN_DEF_MAP[key]).filter(Boolean)
  return [...cols, ACTION_COLUMN]
})

const tableScrollX = computed(() =>
  orderedColumns.value.reduce((sum, col) => sum + (col.width || 120), 0)
)

function getColumnTitle(key) {
  return COLUMN_DEF_MAP[key]?.title || key
}

function saveColumnOrder() {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnOrder.value))
}

function resetColumnOrder() {
  columnOrder.value = [...DEFAULT_COLUMN_ORDER]
  localStorage.removeItem(COLUMN_STORAGE_KEY)
  message.success('列顺序已恢复默认')
}

const dragState = reactive({ dragKey: null, dragIndex: -1, overKey: null })

function onColumnDragStart(e, key, index) {
  dragState.dragKey = key
  dragState.dragIndex = index
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', key)
}

function onColumnDragEnd() {
  dragState.dragKey = null
  dragState.dragIndex = -1
  dragState.overKey = null
}

function onColumnDragOver(key) { dragState.overKey = key }
function onColumnDragLeave(key) { if (dragState.overKey === key) dragState.overKey = null }

function onColumnDrop(targetKey) {
  const fromKey = dragState.dragKey
  if (!fromKey || fromKey === targetKey) return
  const list = [...columnOrder.value]
  const fromIdx = list.indexOf(fromKey)
  const toIdx = list.indexOf(targetKey)
  if (fromIdx < 0 || toIdx < 0) return
  list.splice(fromIdx, 1)
  list.splice(toIdx, 0, fromKey)
  columnOrder.value = list
  saveColumnOrder()
  dragState.overKey = null
}

const modalTitle = computed(() => isEdit.value ? '编辑商品' : '新增商品')

const formatDate = (d) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch { return d }
}

const fetchCategoryList = () => {
  getEnabledCategories({
    onSuccess: (res) => { categoryList.value = res || [] },
    onError: () => {}
  })
}

const fetchProductList = () => {
  loading.value = true
  const params = {
    page: pagination.current,
    pageSize: pagination.pageSize,
    title: searchForm.title || null,
    categoryId: searchForm.categoryId,
    status: searchForm.status,
    hasStock: searchForm.hasStock
  }
  getProductPage(params, {
    onSuccess: (res) => {
      tableData.value = res.records || []
      pagination.total = res.total || 0
      pagination.current = res.current || 1
      loading.value = false
    },
    onError: () => { loading.value = false }
  })
}

const handleSearch = () => {
  pagination.current = 1
  fetchProductList()
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.categoryId = null
  searchForm.status = null
  searchForm.hasStock = null
  pagination.current = 1
  fetchProductList()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchProductList()
}

const showCreateModal = () => {
  isEdit.value = false
  currentEditId.value = null
  modalVisible.value = true
  nextTick(() => resetForm())
}

const showEditModal = (record) => {
  isEdit.value = true
  currentEditId.value = record.id
  modalVisible.value = true
  getProductById(record.id, {
    onSuccess: (res) => {
      nextTick(() => {
        Object.assign(formData, {
          title: res.title,
          subtitle: res.subtitle,
          categoryId: res.categoryId,
          price: res.price,
          stock: res.stock,
          detail: res.detail,
          status: res.status
        })
        coverFileList.value = res.coverFilePath ? [{ uid: '-1', name: 'cover.jpg', status: 'done', url: res.coverFilePath }] : []
        loadProductImages(record.id)
        formRef.value?.clearValidate()
      })
    },
    onError: () => {}
  })
}

const showDetailModal = (record) => {
  getProductById(record.id, {
    onSuccess: (res) => {
      currentProduct.value = res
      detailVisible.value = true
    },
    onError: () => {}
  })
}

const showStockModal = (record) => {
  currentProduct.value = record
  newStock.value = record.stock
  stockVisible.value = true
}

const loadProductImages = (productId) => {
  getFilesByBusinessField('SHOP_PRODUCT', productId, 'images', {
    onSuccess: (res) => {
      imageFileList.value = res?.map((file, index) => ({
        uid: `-${index + 2}`,
        name: file.originalName || `image-${index + 1}.jpg`,
        status: 'done',
        url: file.filePath,
        fileId: file.id
      })) || []
    },
    onError: () => { imageFileList.value = [] }
  })
}

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) { message.error('只能上传图片文件') }
  return isImage
}

const handleCoverUpload = ({ file, onSuccess, onError }) => {
  uploadBusinessFile(file, 'SHOP_PRODUCT', currentEditId.value, 'cover', {
    onSuccess: (res) => {
      coverFileList.value = [{ uid: '-1', name: file.name, status: 'done', url: res.filePath }]
      message.success('封面上传成功')
      onSuccess()
    },
    onError: () => {
      message.error('封面上传失败')
      onError()
    }
  })
}

const handleCoverRemove = () => {
  coverFileList.value = []
  return true
}

const handleImageUpload = ({ file, onSuccess, onError }) => {
  uploadBusinessFile(file, 'SHOP_PRODUCT', currentEditId.value, 'images', {
    onSuccess: (res) => {
      imageFileList.value.push({ uid: file.uid, name: file.name, status: 'done', url: res.filePath })
      message.success('图片上传成功')
      onSuccess()
    },
    onError: () => {
      message.error('图片上传失败')
      onError()
    }
  })
}

const handleImageRemove = (file) => {
  imageFileList.value = imageFileList.value.filter(item => item.uid !== file.uid)
  if (file.fileId) {
    deleteBusinessFile(file.fileId, {
      onSuccess: () => {},
      onError: () => {}
    })
  }
  return true
}

const resetForm = () => {
  Object.assign(formData, {
    title: '',
    subtitle: '',
    categoryId: null,
    price: null,
    stock: 0,
    detail: '',
    status: 1
  })
  coverFileList.value = []
  imageFileList.value = []
  formRef.value?.resetFields()
  formRef.value?.clearValidate()
}

const handleSubmit = () => {
  formRef.value?.validate().then(() => {
    submitLoading.value = true
    const params = { ...formData }
    const apiCall = isEdit.value ? updateProduct : createProduct
    if (isEdit.value) params.id = currentEditId.value
    apiCall(params, {
      successMsg: isEdit.value ? '更新商品成功' : '创建商品成功',
      onSuccess: () => {
        submitLoading.value = false
        modalVisible.value = false
        fetchProductList()
        nextTick(() => resetForm())
      },
      onError: () => { submitLoading.value = false }
    })
  })
}

const handleCancel = () => {
  modalVisible.value = false
  nextTick(() => resetForm())
}

const handleStockSubmit = () => {
  stockLoading.value = true
  updateProductStock(currentProduct.value.id, newStock.value, {
    successMsg: '库存更新成功',
    onSuccess: () => {
      stockLoading.value = false
      stockVisible.value = false
      fetchProductList()
    },
    onError: () => { stockLoading.value = false }
  })
}

const handleAction = (key, record) => {
  if (key === 'stock') {
    showStockModal(record)
  } else if (key === 'delete') {
    message.error('删除功能暂未实现')
  }
}

onMounted(() => {
  fetchCategoryList()
  fetchProductList()
})
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

.product-page {
  min-height: 100%;
  padding: 28px 32px 40px;
  background: $white;
  color: $black;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.page-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid $black;
}

.page-top__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: $bg;
  border: 1px solid $border;
}

.filter-input { width: 140px; &--wide { width: 180px; } }
.filter-select { width: 120px; }

.filter-bar__btns {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.column-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  padding: 12px 16px;
  border: 1px solid $border;
  border-bottom: none;
  background: $white;
}

.column-bar__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.column-bar__hint {
  font-size: 11px;
  color: $muted;
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
  background: $white;
  border: 1px solid $black;
  cursor: grab;
  user-select: none;

  &--dragging { opacity: 0.45; border-style: dashed; }
  &--over { background: rgba($accent, 0.12); border-color: $accent; }
  &--fixed { cursor: default; color: $muted; border-color: $border; background: $bg; }
}

.column-chip__grip {
  font-size: 10px;
  color: $muted;
  letter-spacing: -2px;
}

.column-reset {
  margin-left: auto;
  padding: 0;
  font-size: 12px;
  color: $muted;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover { color: $accent; }
}

.table-wrap {
  border: 1px solid $border;
  border-top: none;
}

.minimal-table {
  :deep(.ant-table) {
    background: $white;
    color: $black;
  }

  :deep(.ant-table-thead > tr > th) {
    background: $black !important;
    color: $white !important;
    font-weight: 500;
    font-size: 12px;
    border-bottom: none !important;
    padding: 12px 14px !important;
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid $border !important;
    padding: 12px 14px !important;
    font-size: 13px;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: $bg !important;
  }

  :deep(.ant-pagination-item-active) {
    border-color: $accent !important;
    a { color: $accent !important; }
  }

  :deep(.ant-pagination-item:hover),
  :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
  :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
    border-color: $accent !important;
    color: $accent !important;
  }
}

.cover-thumb {
  border-radius: 4px;
  object-fit: cover;
}

.no-cover {
  color: $muted;
  font-size: 12px;
}

.cell-link {
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  color: $accent;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  &:hover { color: $black; }
  &--title { font-weight: 600; font-size: 13px; }
  &--more { display: inline-flex; align-items: center; gap: 2px; }
}

.cell-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba($accent, 0.08);
  color: $accent;
  border-radius: 2px;
}

.cell-price {
  font-weight: 600;
  color: $accent;
  font-size: 13px;
}

.cell-stock {
  font-size: 12px;
  font-weight: 500;
  &--has { color: $accent; }
  &--empty { color: $muted; }
}

.cell-status {
  font-size: 12px;
  font-weight: 500;
  &--on { color: $accent; }
  &--off { color: $muted; }
}

.cell-mono {
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: $muted;
}

.action-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.action-sep {
  color: $border;
  font-size: 11px;
  user-select: none;
}

.btn-primary {
  background: $accent !important;
  border-color: $accent !important;
  color: $white !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;
  &:hover { background: darken($accent, 6%) !important; border-color: darken($accent, 6%) !important; }
}

.btn-ghost {
  background: $white !important;
  border: 1px solid $black !important;
  color: $black !important;
  border-radius: 0 !important;
  height: 34px !important;
  font-size: 13px !important;
  box-shadow: none !important;
  &:hover { border-color: $accent !important; color: $accent !important; }
}

.filter-input :deep(.ant-input),
.filter-select :deep(.ant-select-selector) {
  border-radius: 0 !important;
  border-color: $border !important;
  font-size: 13px !important;
}

.filter-input :deep(.ant-input:focus),
.filter-input :deep(.ant-input-affix-wrapper-focused),
.filter-select :deep(.ant-select-focused .ant-select-selector) {
  border-color: $accent !important;
  box-shadow: none !important;
}

.modal-body { padding: 8px 0; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.minimal-form :deep(.ant-form-item-label > label) {
  font-size: 12px;
  color: $muted !important;
}

.minimal-form :deep(.ant-input),
.minimal-form :deep(.ant-select-selector),
.minimal-form :deep(.ant-radio-wrapper) {
  border-radius: 0 !important;
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: $muted;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.detail-header {
  display: flex;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid $border;
  margin-bottom: 16px;
}

.detail-no-cover {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg;
  color: $muted;
  font-size: 12px;
}

.detail-info {
  flex: 1;
  h3 { margin: 0 0 8px; font-size: 18px; font-weight: 600; }
  p { margin: 0 0 8px; color: $muted; font-size: 13px; }
}

.detail-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.detail-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 2px;
  &.on { background: rgba($accent, 0.1); color: $accent; }
  &.off { background: rgba($muted, 0.1); color: $muted; }
}

.detail-category {
  font-size: 12px;
  color: $muted;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: $bg;
  border-radius: 4px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: $muted;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  &.price { color: $accent; }
}

.detail-rich {
  padding-top: 16px;
  border-top: 1px solid $border;
}

.detail-no-content {
  padding: 32px;
  text-align: center;
  color: $muted;
  font-size: 13px;
  background: $bg;
}

.stock-form {
  .stock-product { font-weight: 600; margin-bottom: 4px; }
  .stock-current { color: $muted; font-size: 13px; margin-bottom: 16px; }
}
</style>

<style lang="scss">
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$white: #ffffff;

.minimal-modal {
  .ant-modal-content { border-radius: 0 !important; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important; }
  .ant-modal-header { border-bottom: 1px solid $border !important; padding: 16px 20px !important; }
  .ant-modal-title { font-size: 15px !important; font-weight: 600 !important; color: $black !important; }
  .ant-modal-body { padding: 20px !important; }
  .ant-modal-footer { padding: 14px 20px !important; border-top: 1px solid $border !important; }
}

.minimal-modal .ant-btn-primary {
  background: $accent !important;
  border-color: $accent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.minimal-dropdown {
  .ant-dropdown-menu-item { font-size: 13px !important; }
  .ant-dropdown-menu-item-danger { color: #ff4d4f !important; }
}
</style>