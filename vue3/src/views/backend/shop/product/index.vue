<template>
  <div class="shop-product-page">
    <div class="page-header">
      <div class="title-wrapper">
        <span class="title-indicator"></span>
        <h2>商品管理</h2>
        <span class="sub-badge">基础商品资产库与上下架调配</span>
      </div>
      <a-button type="primary" class="btn-create" @click="showCreateModal">
        <template #icon>
          <PlusOutlined />
        </template>
        新增商品
      </a-button>
    </div>

    <div class="search-section">
      <a-form layout="inline" :model="searchForm" class="museum-search-form">
        <a-form-item label="商品标题">
          <a-input
              v-model:value="searchForm.title"
              placeholder="请输入商品标题"
              allow-clear
              style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="商品分类">
          <a-select
              v-model:value="searchForm.categoryId"
              placeholder="请选择分类"
              allow-clear
              style="width: 150px"
              class="museum-select"
          >
            <a-select-option
                v-for="category in categoryList"
                :key="category.id"
                :value="category.id"
            >
              {{ category.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              allow-clear
              style="width: 120px"
              class="museum-select"
          >
            <a-select-option :value="1">上架</a-select-option>
            <a-select-option :value="0">下架</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="库存">
          <a-select
              v-model:value="searchForm.hasStock"
              placeholder="请选择"
              allow-clear
              style="width: 120px"
              class="museum-select"
          >
            <a-select-option :value="true">有库存</a-select-option>
            <a-select-option :value="false">无库存</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item class="search-actions">
          <a-space :size="12">
            <a-button type="primary" class="btn-search" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button class="btn-reset" @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

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
        <template #coverImage="{ record }">
          <div class="cover-image-wrapper">
            <a-image
                v-if="record.coverFilePath"
                :src="record.coverFilePath"
                :width="54"
                :height="54"
                :preview="true"
                class="museum-table-img"
            />
            <div v-else class="no-img-placeholder">暂无图片</div>
          </div>
        </template>

        <template #price="{ record }">
          <span class="table-price-text">
            ¥{{ record.price }}
          </span>
        </template>

        <template #stock="{ record }">
          <span class="stock-badge" :class="record.stock > 0 ? 'stock-in' : 'stock-out'">
            {{ record.stock }}
          </span>
        </template>

        <template #status="{ record }">
          <div class="status-cell-wrapper">
            <a-switch
                :checked="record.status === 1"
                @change="(checked) => handleStatusChange(record.id, checked ? 1 : 0)"
                :loading="record.statusLoading"
                class="museum-switch"
            />
            <span class="status-text" :class="record.status === 1 ? 'status-active' : 'status-disabled'">
              {{ record.statusName }}
            </span>
          </div>
        </template>

        <template #action="{ record }">
          <div class="action-cell">
            <a-button type="link" size="small" class="link-btn detail-link" @click="showDetailModal(record)">详情</a-button>
            <a-divider type="vertical" class="action-divider" />
            <a-button type="link" size="small" class="link-btn edit-link" @click="showEditModal(record)">编辑</a-button>
            <a-divider type="vertical" class="action-divider" />

            <a-dropdown :align="{ overflow: { adjustX: true, adjustY: true } }" overlayClassName="museum-dropdown-menu">
              <a-button type="link" size="small" class="more-btn">
                更多 <DownOutlined class="down-arrow-icon" />
              </a-button>
              <template #overlay>
                <a-menu @click="({ key }) => handleAction(key, record)" class="museum-menu-items">
                  <a-menu-item key="stock" class="item-stock">库存管理</a-menu-item>
                  <a-menu-divider class="item-divider" />
                  <a-menu-item key="delete" danger class="item-delete">删除商品</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </template>
      </a-table>
    </div>

    <a-modal
        :title="modalTitle"
        :open="modalVisible"
        :mask-closable="false"
        @cancel="handleCancel"
        :confirm-loading="submitLoading"
        width="840px"
        wrapClassName="museum-custom-modal"
    >
      <div class="edit-form-container">
        <div class="status-bar" :class="isEdit ? 'status-edit' : 'status-create'">
          <div class="status-bar__left">
            <span class="status-dot"></span>
            <span class="status-bar__text">{{ isEdit ? '您正在对现有商品档案执行属性修订' : '您正在创建一份全新的核心物资与商品档案映射' }}</span>
          </div>
        </div>

        <a-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            :label-col="{ span: 4 }"
            :wrapper-col="{ span: 20 }"
            class="edit-form"
        >
          <div class="form-section-card">
            <div class="form-section__header">
              <span class="section-mark"></span>
              <h4>基本信息</h4>
            </div>
            <div class="form-section__content">
              <a-form-item label="商品标题" name="title">
                <a-input v-model:value="formData.title" placeholder="请输入核心商品主标题" :maxlength="200" class="museum-input" />
              </a-form-item>
              <a-form-item label="副标题" name="subtitle">
                <a-input v-model:value="formData.subtitle" placeholder="请输入辅助展示或卖点宣贯的副标题" :maxlength="255" class="museum-input" />
              </a-form-item>
              <a-form-item label="商品分类" name="categoryId">
                <a-select v-model:value="formData.categoryId" placeholder="请指派对应商品所属的规范目类" class="museum-select-input">
                  <a-select-option v-for="category in categoryList" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </div>
          </div>

          <div class="form-section-card">
            <div class="form-section__header">
              <span class="section-mark"></span>
              <h4>价格与库存</h4>
            </div>
            <div class="form-section__content grid-two-columns">
              <a-form-item label="商品价格" name="price">
                <a-input-number v-model:value="formData.price" placeholder="0.00" :min="0" :precision="2" :step="0.01" class="museum-number-input">
                  <template #addonBefore><span class="currency-prefix">¥</span></template>
                </a-input-number>
              </a-form-item>
              <a-form-item label="库存数量" name="stock">
                <a-input-number v-model:value="formData.stock" placeholder="请输入初始库存总额" :min="0" :precision="0" class="museum-number-input" />
              </a-form-item>
            </div>
          </div>

          <div class="form-section-card">
            <div class="form-section__header">
              <span class="section-mark"></span>
              <h4>图片管理</h4>
            </div>
            <div class="form-section__content upload-wrapper-box">
              <a-form-item label="封面图片" name="coverFileId">
                <a-upload v-model:file-list="coverFileList" list-type="picture-card" :before-upload="beforeImageUpload" :custom-request="handleCoverUpload" :max-count="1" @remove="handleCoverRemove" class="museum-uploader">
                  <div v-if="coverFileList.length < 1" class="upload-trigger-btn">
                    <PlusOutlined class="upload-icon" />
                    <div class="upload-text">上传封面</div>
                  </div>
                </a-upload>
                <div class="upload-tip">建议正方形 800×800px，支持 JPG、PNG 格式，单张上限 5MB 且主封面必须上传。</div>
              </a-form-item>
              <a-form-item label="商品图片" name="imageFiles">
                <a-upload v-model:file-list="imageFileList" list-type="picture-card" :before-upload="beforeImageUpload" :custom-request="handleImageUpload" :max-count="10" @remove="handleImageRemove" multiple class="museum-uploader">
                  <div v-if="imageFileList.length < 10" class="upload-trigger-btn">
                    <PlusOutlined class="upload-icon" />
                    <div class="upload-text">上传图片</div>
                  </div>
                </a-upload>
                <div class="upload-tip">最多支持上传 10 张画册轮播主图，建议尺寸 800×800px。</div>
              </a-form-item>
            </div>
          </div>

          <div class="form-section-card">
            <div class="form-section__header">
              <span class="section-mark"></span>
              <h4>商品详情</h4>
            </div>
            <div class="form-section__content rich-editor-container">
              <a-form-item label="商品详情" name="detail" :wrapper-col="{ span: 24 }" class="editor-full-item">
                <RichTextEditor v-model="formData.detail" placeholder="请在这里撰写深度详实、排版精美的富文本详情介绍" height="400px" />
              </a-form-item>
            </div>
          </div>

          <div class="form-section-card">
            <div class="form-section__header">
              <span class="section-mark"></span>
              <h4>状态管理</h4>
            </div>
            <div class="form-section__content">
              <a-form-item label="上架状态" name="status">
                <a-radio-group v-model:value="formData.status" class="museum-radio-group">
                  <a-radio :value="1" class="museum-radio">
                    <span class="radio-label-txt text-active">立即上架公示</span>
                  </a-radio>
                  <a-radio :value="0" class="museum-radio">
                    <span class="radio-label-txt text-disabled">暂存下架锁定</span>
                  </a-radio>
                </a-radio-group>
              </a-form-item>
            </div>
          </div>
        </a-form>
      </div>

      <template #footer>
        <div class="edit-footer">
          <a-button @click="handleCancel" class="cancel-btn">取消</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="submitLoading" class="submit-btn">
            {{ isEdit ? '保存更改' : '创建商品' }}
          </a-button>
        </div>
      </template>
    </a-modal>

    <a-modal
        title="商品档案详情"
        :open="detailVisible"
        @cancel="detailVisible = false"
        :footer="null"
        width="840px"
        wrapClassName="museum-custom-modal detail-modal-skin"
    >
      <div v-if="currentProduct" class="product-detail">
        <div class="detail-header-card">
          <div class="detail-header__cover">
            <a-image v-if="currentProduct.coverFilePath" :src="currentProduct.coverFilePath" :preview="true" class="header-cover-img" />
            <div v-else class="no-cover-icon">暂无封面</div>
          </div>
          <div class="detail-header__info">
            <h3 class="detail-header__title">{{ currentProduct.title }}</h3>
            <div v-if="currentProduct.subtitle" class="detail-header__subtitle">{{ currentProduct.subtitle }}</div>
            <div class="detail-header__meta">
              <span class="meta-tag-status" :class="currentProduct.status === 1 ? 'tag-on' : 'tag-off'">
                {{ currentProduct.statusName }}
              </span>
              <span class="meta-v-divider">|</span>
              <span class="meta-category-label">所属分类：<strong>{{ currentProduct.categoryName }}</strong></span>
            </div>
          </div>
        </div>

        <div class="info-data-grid">
          <div class="grid-data-cell price-highlight">
            <div class="cell-label">标准标价</div>
            <div class="cell-value">¥{{ currentProduct.price }}</div>
          </div>
          <div class="grid-data-cell">
            <div class="cell-label">现有库存</div>
            <div class="cell-value">
              <span class="stock-indicator" :class="currentProduct.stock > 0 ? 'has' : 'empty'">
                {{ currentProduct.stock }} 件
              </span>
            </div>
          </div>
          <div class="grid-data-cell">
            <div class="cell-label">初次录入时间</div>
            <div class="cell-value datetime-str">{{ currentProduct.createTime }}</div>
          </div>
          <div class="grid-data-cell">
            <div class="cell-label">末次更动时间</div>
            <div class="cell-value datetime-str">{{ currentProduct.updateTime }}</div>
          </div>
        </div>

        <div class="detail-rich-section">
          <div class="rich-section__title">
            <span class="title-dot"></span>
            <h5>深度详情描述</h5>
          </div>
          <div class="rich-section__content">
            <div v-if="currentProduct.detail" class="product-detail-content" v-html="currentProduct.detail"></div>
            <div v-else class="no-content-gray">暂未就该商品档案配置任何富文本图文详情</div>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal
        title="库存数额变更"
        :open="stockVisible"
        @ok="handleStockSubmit"
        @cancel="stockVisible = false"
        :confirm-loading="stockLoading"
        width="440px"
        wrapClassName="museum-custom-modal tiny-modal-skin"
    >
      <div class="stock-modify-container">
        <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 17 }" class="stock-form-inner">
          <a-form-item label="商品目标">
            <span class="stock-target-title">{{ currentProduct?.title }}</span>
          </a-form-item>
          <a-form-item label="当前存量">
            <span class="stock-current-badge" :class="(currentProduct?.stock || 0) > 0 ? 'ok' : 'warn'">
              {{ currentProduct?.stock }} 件
            </span>
          </a-form-item>
          <a-form-item label="修正数额">
            <a-input-number
                v-model:value="newStock"
                placeholder="请输入重置后的确切库存量"
                :min="0"
                :precision="0"
                class="museum-number-input"
                style="width: 100%"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import {message, Modal} from 'ant-design-vue';
import { PlusOutlined, SearchOutlined, ReloadOutlined, DownOutlined } from '@ant-design/icons-vue';
import {
  getProductPage,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  onShelfProduct,
  offShelfProduct,
  updateProductStock
} from '@/api/ShopProductApi';
import { getEnabledCategories } from '@/api/ShopCategoryApi';
import {uploadBusinessFile, getFilesByBusinessField, deleteBusinessFile} from '@/api/FileApi';
import { useBusinessUUID } from '@/composables/useBusinessUUID';
import RichTextEditor from '@/components/common/RichTextEditor.vue';

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const modalVisible = ref(false);
const detailVisible = ref(false);
const stockVisible = ref(false);
const submitLoading = ref(false);
const stockLoading = ref(false);
const formRef = ref();
const isEdit = ref(false);
const currentEditId = ref(null);
const currentProduct = ref(null);
const categoryList = ref([]);
const coverFileList = ref([]);
const imageFileList = ref([]); // 商品图片列表
const newStock = ref(0);
const businessUUID = ref('')
// ========== 组件属性 ==========
const props = defineProps({
  // 媒体列表
  modelValue: {
    type: Array,
    default: () => []
  },
  // 媒体类型
  mediaType: {
    type: String,
    default: 'ALL',
    validator: (value) => ['IMG', 'VIDEO', 'AUDIO', 'PDF', 'ALL'].includes(value)
  },
  // 业务类型
  businessType: {
    type: String,
    default: 'HERITAGE_ITEM'
  },
  // 业务字段
  businessField: {
    type: String,
    default: 'media'
  },
  // 业务ID（策略C使用）
  businessId: {
    type: [String, Number],
    default: null
  },
  // 是否使用策略C（直接业务绑定上传）
  useStrategyC: {
    type: Boolean,
    default: false
  },
  // 是否支持多选
  multiple: {
    type: Boolean,
    default: true
  },
  // 是否支持排序
  sortable: {
    type: Boolean,
    default: true
  },
  // 是否只读
  readonly: {
    type: Boolean,
    default: false
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 最大文件数量
  maxCount: {
    type: Number,
    default: 10
  },
  // 最大文件大小（MB）
  maxSize: {
    type: Number,
    default: 50
  }
})

// ========== 事件定义 ==========
const emit = defineEmits([
  'update:modelValue',
  'upload-success',
  'upload-error',
  'remove',
  'preview'
])

// ========== 响应式数据 ==========
const uploadRef = ref()
const previewVisible = ref(false)
const previewMedia = ref(null)
const mediaList = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})
// 搜索表单
const searchForm = reactive({
  title: '',
  categoryId: null,
  status: null,
  hasStock: null
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
  title: '',
  subtitle: '',
  categoryId: null,
  price: null,
  stock: 0,
  detail: '',
  status: 1
});

// 表单验证规则
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
};

// 表格列定义
const columns = [
  {
    title: '商品ID',
    dataIndex: 'id',
    key: 'id',
    width: 120,
    ellipsis: true
  },
  {
    title: '封面',
    key: 'coverImage',
    slots: { customRender: 'coverImage' },
    width: 100
  },
  {
    title: '商品标题',
    dataIndex: 'title',
    key: 'title',
    width: 200,
    ellipsis: true
  },
  {
    title: '分类',
    dataIndex: 'categoryName',
    key: 'categoryName',
    width: 120
  },
  {
    title: '价格',
    key: 'price',
    slots: { customRender: 'price' },
    width: 100
  },
  {
    title: '库存',
    key: 'stock',
    slots: { customRender: 'stock' },
    width: 80
  },
  {
    title: '状态',
    key: 'status',
    slots: { customRender: 'status' },
    width: 120
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
    width: 240,
    fixed: 'right'
  }
];

// 计算属性
const modalTitle = computed(() => {
  return isEdit.value ? '编辑商品' : '新增商品';
});

// 生命周期
onMounted(() => {
  fetchCategoryList();
  fetchProductList();
});

// 方法
const fetchCategoryList = () => {
  getEnabledCategories({
    onSuccess: (res) => {
      categoryList.value = res || [];
    },
    onError: (error) => {
      message.error('获取分类列表失败：' + error.message);
    }
  });
};

const fetchProductList = () => {
  loading.value = true;

  const params = {
    page: pagination.current,
    pageSize: pagination.pageSize,
    title: searchForm.title || null,
    categoryId: searchForm.categoryId,
    status: searchForm.status,
    hasStock: searchForm.hasStock
  };

  getProductPage(params, {
    onSuccess: (res) => {
      tableData.value = res.records || [];
      pagination.total = res.total || 0;
      pagination.current = res.current || 1;
      loading.value = false;
    },
    onError: (error) => {
      message.error('获取商品列表失败：' + error.message);
      loading.value = false;
    }
  });
};

const handleSearch = () => {
  pagination.current = 1;
  fetchProductList();
};

const handleReset = () => {
  searchForm.title = '';
  searchForm.categoryId = null;
  searchForm.status = null;
  searchForm.hasStock = null;
  pagination.current = 1;
  fetchProductList();
};

const handleTableChange = (pag) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchProductList();
};

const showCreateModal = () => {
  isEdit.value = false;
  currentEditId.value = null;
  modalVisible.value = true;
  nextTick(() => {
    resetForm();
  });
};

const showEditModal = (record) => {
  isEdit.value = true;
  currentEditId.value = record.id;
  modalVisible.value = true;

  // 获取商品详情
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
        });

        // 设置封面图片
        if (res.coverFilePath) {
          coverFileList.value = [{
            uid: '-1',
            name: 'cover.jpg',
            status: 'done',
            url: res.coverFilePath
          }];
        } else {
          coverFileList.value = [];
        }

        // 加载商品图片列表
        loadProductImages(record.id);

        if (formRef.value) {
          formRef.value.clearValidate();
        }
      });
    },
    onError: (error) => {
      message.error('获取商品详情失败：' + error.message);
    }
  });
};

const showDetailModal = (record) => {
  getProductById(record.id, {
    onSuccess: (res) => {
      currentProduct.value = res;
      detailVisible.value = true;
    },
    onError: (error) => {
      message.error('获取商品详情失败：' + error.message);
    }
  });
};

const showStockModal = (record) => {
  currentProduct.value = record;
  newStock.value = record.stock;
  stockVisible.value = true;
};

const resetForm = () => {
  Object.assign(formData, {
    title: '',
    subtitle: '',
    categoryId: null,
    price: null,
    stock: 0,
    detail: '',
    status: 1,
    tempProductId: null
  });
  coverFileList.value = [];
  imageFileList.value = [];

  if (formRef.value) {
    formRef.value.resetFields();
    formRef.value.clearValidate();
  }
};

// 加载商品图片列表
const loadProductImages = (productId) => {
  getFilesByBusinessField('SHOP_PRODUCT', productId, 'images', {
    onSuccess: (res) => {
      if (res && res.length > 0) {
        imageFileList.value = res.map((file, index) => ({
          uid: `-${index + 2}`,
          name: file.originalName || `image-${index + 1}.jpg`,
          status: 'done',
          url: file.filePath,
          fileId: file.id
        }));
      } else {
        imageFileList.value = [];
      }
    },
    onError: () => {
      imageFileList.value = [];
    }
  });
};

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB！');
    return false;
  }
  return true;
};

const handleCoverUpload = async (options) => {
  const { file, onSuccess, onError } = options;

  const businessInfo = {
    businessType: 'SHOP_PRODUCT',
    businessId: currentEditId.value || useBusinessUUID().generateUUID(),
    businessField: 'cover'
  };

  uploadBusinessFile(file, businessInfo, false, {
    onSuccess: (res) => {
      coverFileList.value = [{
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: res.filePath
      }];
      onSuccess(res, file);
      message.success('封面上传成功');
      if (businessInfo.businessId && !businessUUID.value) {
        businessUUID.value = businessInfo.businessId
      }
    },
    onError: (error) => {
      onError(error);
      message.error('封面上传失败：' + error.message);
    }
  });
};

const handleCoverRemove = () => {
  coverFileList.value = [];
};

const handleImageUpload = async (options) => {
  const { file, onSuccess, onError } = options;

  // 确保有商品ID（新增时生成UUID，编辑时使用现有ID）
  let productId = currentEditId.value;
  if (!productId) {
    // 如果是新增商品，需要先生成一个UUID
    if (!formData.tempProductId) {
      formData.tempProductId = businessUUID;
    }
    productId = formData.tempProductId;
  }

  const businessInfo = {
    businessType: 'SHOP_PRODUCT',
    businessId: productId,
    businessField: 'images' // 使用 'images' 字段区分商品图片列表
  };

  uploadBusinessFile(file, businessInfo, false, {
    onSuccess: (res) => {
      imageFileList.value.push({
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: res.filePath,
        fileId: res.id
      });
      onSuccess(res, file);
      message.success('图片上传成功');
    },
    onError: (error) => {
      onError(error);
      message.error('图片上传失败：' + error.message);
    }
  });
};

function handleImageRemove (media, index) {
  Modal.confirm({
    title: '确定要删除这个文件吗？',
    content: '删除后无法恢复',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      // 如果有文件ID，调用后端API删除
      if (media.id || media.fileId) {
        const fileId = media.id || media.fileId
        console.log('删除文件，文件ID:', fileId)
        console.log('删除文件，完整媒体对象:', media)

        deleteBusinessFile({fileId:media.fileId}, {
          successMsg: '文件删除成功',
          onSuccess: () => {
            // 从前端列表中移除
            const newList = [...mediaList.value]
            newList.splice(index, 1)
            mediaList.value = newList

            emit('remove', media, index)
          },
          onError: (error) => {
            console.error('删除文件失败:', error)
            message.error('删除文件失败，请重试')
          }
        })
      } else {
        // 如果没有文件ID，只从前端列表中移除（可能是刚上传但未保存的文件）
        console.log('删除本地文件（无ID）:', media)
        const newList = [...mediaList.value]
        newList.splice(index, 1)
        mediaList.value = newList

        message.success('删除成功')
        emit('remove', media, index)
      }
    }
  })
}

const handleSubmit = () => {
  formRef.value.validate().then(() => {
    submitLoading.value = true;

    const params = { ...formData };

    const callbacks = {
      successMsg: isEdit.value ? '更新商品成功' : '创建商品成功',
      onSuccess: () => {
        submitLoading.value = false;
        modalVisible.value = false;
        fetchProductList();
        nextTick(() => {
          resetForm();
        });
      },
      onError: (error) => {
        message.error((isEdit.value ? '更新' : '创建') + '商品失败：' + error.message);
        submitLoading.value = false;
      }
    };

    // 根据是否编辑调用不同的API
    if (isEdit.value) {
      updateProduct(currentEditId.value, params, callbacks);
    } else {
      // 如果是新增，使用已生成的UUID（上传图片时生成）或生成新的UUID
      params.id = formData.tempProductId || useBusinessUUID().generateUUID();
      createProduct(params, callbacks);
    }
  });
};

const handleCancel = () => {
  modalVisible.value = false;
  nextTick(() => {
    resetForm();
  });
};

const handleStatusChange = (id, status) => {
  const record = tableData.value.find(item => item.id === id);
  if (record) {
    record.statusLoading = true;
  }

  const apiCall = status === 1 ? onShelfProduct : offShelfProduct;

  apiCall(id, {
    successMsg: status === 1 ? '上架商品成功' : '下架商品成功',
    onSuccess: () => {
      if (record) {
        record.status = status;
        record.statusName = status === 1 ? '上架' : '下架';
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

const handleStockSubmit = () => {
  if (newStock.value === null || newStock.value === undefined) {
    message.error('请输入库存数量');
    return;
  }

  stockLoading.value = true;

  updateProductStock(currentProduct.value.id, newStock.value, {
    successMsg: '更新库存成功',
    onSuccess: () => {
      stockLoading.value = false;
      stockVisible.value = false;
      fetchProductList();
    },
    onError: (error) => {
      message.error('更新库存失败：' + error.message);
      stockLoading.value = false;
    }
  });
};

const handleDelete = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个商品吗？此操作不可恢复！',
    okText: '确定删除',
    cancelText: '取消',
    okType: 'danger',
    onOk() {
      deleteProduct(id, {
        successMsg: '删除商品成功',
        onSuccess: () => {
          fetchProductList();
        },
        onError: (error) => {
          message.error('删除商品失败：' + error.message);
        }
      });
    }
  });
};

const handleAction = (key, record) => {
  if (key === 'delete') {
    handleDelete(record.id);
  } else if (key === 'stock') {
    showStockModal(record);
  }
};
</script>

<style scoped>
/* ==========================================================================
   全局画布与流式网格底色
   ========================================================================== */
.shop-product-page { padding: 32px 36px 48px; background: #fafafa; min-height: 100vh; color: #1f2937; font-family: var(--font-body, -apple-system, BlinkMacSystemFont, sans-serif); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(66,102,79,0.1); }
.title-wrapper { display: flex; align-items: baseline; gap: 14px; }
.title-indicator { width: 3px; height: 20px; background: #42664f; border-radius: 0; flex-shrink: 0; }
.page-header h2 { margin: 0; font-size: 22px; font-weight: 700; color: #1f2937; letter-spacing: 1px; }
.sub-badge { font-size: 12px; color: #657b6f; background: rgba(66,102,79,0.06); padding: 3px 12px; border-radius: 2px; font-weight: 500; }
.btn-create { background: #111 !important; border-color: #111 !important; color: #fff !important; border-radius: 6px !important; height: 36px !important; padding: 0 18px !important; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.2s ease;
}

.btn-create:hover {
  background: #33503d !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(66, 102, 79, 0.25) !important;
}

/* ==========================================================================
   无边框轻卡片化筛选区
   ========================================================================== */
.search-section { background: #fff; padding: 18px 22px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e5e5; }

.museum-search-form :deep(.ant-form-item) {
  margin-right: 20px !important;
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
}
.btn-search:hover { background: #33503d !important; }

.btn-reset {
  background: #edf1ee !important;
  border-color: transparent !important;
  color: #42664f !important;
  border-radius: 8px !important;
  height: 36px !important;
}
.btn-reset:hover { background: #dee5e1 !important; color: #263d2f !important; }

/* ==========================================================================
   古蜀墨绿质感表格面板
   ========================================================================== */
.table-section { background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e5e5e5; }
.museum-theme-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa !important; color: #3e5246 !important; font-weight: 600;
  font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;
  border-bottom: 2px solid #e9eee9; padding: 12px 16px;
}
.museum-theme-table :deep(.ant-table-tbody > tr > td) { border-bottom: 1px solid #f2f4f2; padding: 12px 16px; font-size: 13px; }
.museum-theme-table :deep(.ant-table-tbody > tr:hover > td) { background: #fafafa !important; }

/* 单元格微雕美化 */
.cover-image-wrapper {
  display: inline-flex;
  border: 1px solid #e1e6e2;
  padding: 2px;
  border-radius: 6px;
  background: #fff;
}
.museum-table-img {
  border-radius: 4px;
  object-fit: cover;
}
.no-img-placeholder {
  width: 54px;
  height: 54px;
  background: #f5f7f6;
  color: #9aa79e;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.table-price-text {
  color: #d9534f;
  font-weight: 600;
  font-size: 15px;
  font-family: 'Courier New', Courier, monospace;
}

.stock-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
}
.stock-in { background: rgba(66, 102, 79, 0.1); color: #42664f; }
.stock-out { background: rgba(217, 83, 79, 0.1); color: #d9534f; }

/* 状态单元格 */
.status-cell-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status-text { font-size: 13px; font-weight: 500; }
.status-active { color: #42664f; }
.status-disabled { color: #929e96; }

/* 操作面板 */
.action-cell { display: flex; align-items: center; }
.link-btn { font-weight: 600; padding: 0 !important; }
.detail-link { color: #5a7564 !important; }
.detail-link:hover { color: #35473c !important; }
.edit-link { color: #42664f !important; }
.edit-link:hover { color: #111 !important; }
.action-divider { border-color: #d1dad4 !important; margin: 0 8px; }

.more-btn {
  color: #66756c !important;
  font-weight: 500;
  padding: 0 !important;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.more-btn:hover { color: #42664f !important; }
.down-arrow-icon { font-size: 10px; transition: transform 0.2s; }

/* ==========================================================================
   新增/编辑表单弹窗内部美化
   ========================================================================== */
.edit-form-container {
  padding: 24px 32px;
}

/* 状态提示横幅 */
.status-bar {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  border-radius: 8px;
  margin-bottom: 24px;
  border-left: 4px solid;
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.status-bar__left { display: flex; align-items: center; gap: 10px; }
.status-bar__text { font-size: 13px; font-weight: 500; }

.status-create {
  background: #f0f6f2; border-color: #42664f; color: #42664f;
  .status-dot { background: #42664f; }
}
.status-edit {
  background: #fdfaf5; border-color: #c29147; color: #c29147;
  .status-dot { background: #c29147; }
}

/* 表单分栏卡片解构 */
.form-section-card {
  background: #fafbfc;
  border: 1px solid #e6eae7;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  transition: all 0.3s;
}
.form-section-card:hover {
  border-color: #ced6d1;
  background: #fdfdfd;
}

.form-section__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #edf1ee;
}
.section-mark {
  width: 3px;
  height: 14px;
  background: #42664f;
  border-radius: 1px;
}
.form-section__header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1c2a20;
}

/* 表单内部组件样式重塑 */
.edit-form :deep(.ant-form-item) {
  margin-bottom: 18px;
}
.edit-form :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}
.edit-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #3b4a40;
}

.museum-input,
.edit-form :deep(.ant-select-selector),
.museum-number-input {
  border-radius: 6px !important;
  border-color: #ced6d1 !important;
}
.museum-input { height: 38px !important; }
.edit-form :deep(.ant-select-selector) { height: 38px !important; display: flex; align-items: center; }

.museum-number-input :deep(.ant-input-number-input) { height: 36px !important; }
.currency-prefix { font-weight: 600; color: #42664f; padding: 0 4px; }

.grid-two-columns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 20px;
}

/* 上传模块重构 */
.upload-wrapper-box :deep(.ant-form-item) {
  display: block;
}
.upload-wrapper-box :deep(.ant-form-item-label) {
  text-align: left;
  margin-bottom: 6px;
}
.upload-trigger-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #617367;
}
.upload-icon { font-size: 18px; margin-bottom: 6px; color: #42664f; }
.upload-text { font-size: 12px; font-weight: 500; }
.upload-tip { font-size: 12px; color: #7f9285; margin-top: 8px; line-height: 1.4; }

.museum-uploader :deep(.ant-upload-select-picture-card) {
  border-radius: 8px !important;
  border-style: dashed !important;
  background: #fafafa !important;
  border-color: #ced6d1 !important;
}
.museum-uploader :deep(.ant-upload-select-picture-card:hover) {
  border-color: #42664f !important;
}

/* 富文本单独适配 */
.editor-full-item :deep(.ant-form-item-control) {
  width: 100% !important;
  max-width: 100% !important;
}

/* 单选组 */
.museum-radio-group { display: flex; gap: 24px; }
.radio-label-txt { font-weight: 500; font-size: 13px; }
.text-active { color: #42664f; }
.text-disabled { color: #8a968f; }

/* 底部操作 */
.edit-footer { display: flex; justify-content: flex-end; gap: 12px; width: 100%; }
.cancel-btn { border-radius: 6px !important; border-color: #ced6d1 !important; color: #55635a !important; }
.submit-btn { background: #42664f !important; border-color: #42664f !important; border-radius: 6px !important; }
.submit-btn:hover { background: #33503d !important; }

/* ==========================================================================
   商品详情弹窗美化样式
   ========================================================================== */
.detail-header-card {
  display: flex;
  gap: 20px;
  align-items: center;
  background: linear-gradient(135deg, #f4f7f5 0%, #e9efe0 100%);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid rgba(66, 102, 79, 0.08);
}
.detail-header__cover {
  width: 84px;
  height: 84px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  background: #fff;
  border: 2px solid #fff;
  flex-shrink: 0;
}
.header-cover-img { width: 100%; height: 100%; object-fit: cover; }
.no-cover-icon { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #9aa79e; background: #fafbfc; }

.detail-header__info { flex: 1; }
.detail-header__title { margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: #16241c; }
.detail-header__subtitle { font-size: 13px; color: #5a6e61; margin-bottom: 8px; line-height: 1.4; }

.detail-header__meta { display: flex; align-items: center; gap: 10px; }
.meta-tag-status { font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 4px; }
.tag-on { background: #42664f; color: #fff; }
.tag-off { background: #929e96; color: #fff; }
.meta-v-divider { color: #ced6d1; font-size: 12px; }
.meta-category-label { font-size: 13px; color: #4e5e54; strong { color: #223328; font-weight: 600; } }

/* 数据矩阵 */
.info-data-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.grid-data-cell {
  background: #fafbfc;
  border: 1px solid #edf1ee;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
}
.cell-label { font-size: 12px; color: #738578; margin-bottom: 6px; font-weight: 500; }
.cell-value { font-size: 14px; color: #212c24; font-weight: 600; }
.price-highlight {
  background: #fffdfb; border-color: #fceddb;
  .cell-value { color: #d9534f; font-size: 18px; font-family: Georgia, 'Times New Roman', Times, serif; }
}
.stock-indicator.has { color: #42664f; }
.stock-indicator.empty { color: #d9534f; }
.datetime-str { font-size: 12px !important; font-weight: 500; color: #515f55; }

/* 富文本显示面板 */
.detail-rich-section {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 20px;
}
.rich-section__title { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f0f2f1; }
.title-dot { width: 5px; height: 5px; background: #42664f; border-radius: 50%; }
.rich-section__title h5 { margin: 0; font-size: 14px; font-weight: 600; color: #212c24; }
.product-detail-content { background: #fafbfa; border-radius: 6px; padding: 16px; max-height: 380px; overflow-y: auto; color: #313d35; line-height: 1.7; }
.no-content-gray { text-align: center; color: #a1ae02; font-size: 13px; padding: 32px 0; color: #9aa79e; }

/* ==========================================================================
   库存变更微弹窗
   ========================================================================== */
.stock-modify-container { padding: 20px 12px 4px; }
.stock-target-title { font-weight: 600; color: #16241c; display: inline-block; line-height: 1.4; }
.stock-current-badge { font-weight: 600; padding: 2px 10px; border-radius: 6px; font-size: 12px; }
.stock-current-badge.ok { background: rgba(66,102,79,0.08); color: #42664f; }
.stock-current-badge.warn { background: rgba(217,83,79,0.08); color: #d9534f; }

@media (max-width: 768px) {
  .grid-two-columns, .info-data-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
</style>

<style lang="scss">
.museum-custom-modal {
  .ant-modal-content { border-radius: 8px !important; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
  .ant-modal-header {
    background: #f5f8f6 !important;
    padding: 16px 24px !important;
    border-bottom: 1px solid #e1e8e4 !important;
    .ant-modal-title { color: #1a2620 !important; font-weight: 600 !important; font-size: 16px; }
  }
  .ant-modal-body { padding: 0 !important; }
  .ant-modal-footer { padding: 14px 24px !important; background: #fafbfc !important; border-top: 1px solid #edf1ee !important; }
}

/* 详情弹窗皮肤独立微调（去除尾部） */
.detail-modal-skin .ant-modal-body { padding: 24px 32px 32px !important; }

/* 更多项菜单重组 */
.museum-dropdown-menu {
  .ant-dropdown-menu {
    border-radius: 8px !important;
    padding: 4px !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
  }
  .ant-dropdown-menu-item {
    font-size: 13px !important;
    padding: 7px 14px !important;
    border-radius: 4px !important;
    font-weight: 500;
  }
  .item-stock { color: #42664f !important; }
  .item-stock:hover { background-color: #f2f6f3 !important; }
  .item-delete { color: #d9534f !important; }
  .item-delete:hover { background-color: #fff1f0 !important; }
  .item-divider { margin: 4px 0 !important; border-color: #f0f2f1 !important; }
}

/* 表格全局基础组件着色系统注入 */
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
.museum-switch.ant-switch-checked {
  background-color: #42664f !important;
}

/* InputNumber 及 Select 激活态微雕 */
.museum-number-input:hover, .museum-number-input-focused,
.edit-form .ant-select-focused:not(.ant-select-disabled) .ant-select-selector {
  border-color: #42664f !important;
  box-shadow: 0 0 0 2px rgba(66, 102, 79, 0.1) !important;
}
</style>