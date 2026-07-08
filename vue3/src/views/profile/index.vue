<template>
  <div class="shu-cosmic-layout">
    <!-- 顶部宏大星图虚化底衬 -->
    <div class="shu-nebula-bg"></div>

    <div class="shu-core-wrapper">
      <!-- 置顶洗炼头部 -->
      <header class="shu-brand-header">
        <div class="shu-brand-badge">数维中枢</div>
        <h1 class="shu-brand-title">古蜀数维 · 个人信息中枢</h1>
        <p class="shu-brand-subtitle">青铜铸魂 · 黄金掩面 · 纵目旷古</p>
        <div class="shu-brand-line"></div>
      </header>

      <!-- 双栏非对称异构布局：左侧信息档案，右侧密匙，上下错落 -->
      <div class="shu-twin-matrix">
        <!-- Ⅰ. 神树档案 (左侧沉浸卡) -->
        <section class="shu-matrix-cell cell-profile">
          <div class="shu-cell-head">
            <span class="shu-cell-num">01</span>
            <h3 class="shu-cell-title">神树档案 <small>BASIC INFO</small></h3>
          </div>

          <div class="shu-profile-flex">
            <div class="shu-avatar-sphere">
              <div class="shu-avatar-orbit">
                <a-avatar :size="100" :src="avatarUrl" class="shu-avatar-core">
                  {{ userForm.name?.charAt(0) || '蜀' }}
                </a-avatar>
                <div class="shu-orbit-ring"></div>
              </div>
              <a-upload
                  class="shu-avatar-action"
                  :action="uploadAction"
                  :show-upload-list="false"
                  :custom-request="customUploadAvatar"
                  :before-upload="beforeAvatarUpload"
              >
                <a-button class="shu-btn-relic" size="small">更换神树烙印</a-button>
              </a-upload>
            </div>

            <div class="shu-form-spine">
              <a-form ref="userFormRef" :model="userForm" :rules="rules" layout="vertical" class="shu-spine-flex-form">
                <div class="shu-spine-form-body">
                  <a-row :gutter="16">
                    <a-col :span="12">
                      <a-form-item label="通神巫号" name="username">
                        <a-input v-model:value="userForm.username" disabled class="shu-input-locked" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="12">
                      <a-form-item label="昵称" name="name">
                        <a-input v-model:value="userForm.name" placeholder="请输入昵称" class="shu-input-field" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="24">
                      <a-form-item label="性别" name="sex">
                        <a-radio-group v-model:value="userForm.sex" class="shu-custom-radio">
                          <a-radio-button value="男">巫尊 (男)</a-radio-button>
                          <a-radio-button value="女">巫祝 (女)</a-radio-button>
                        </a-radio-group>
                      </a-form-item>
                    </a-col>
                    <a-col :span="12">
                      <a-form-item label="联络神谕" name="phone">
                        <a-input v-model:value="userForm.phone" placeholder="请输入手机号" class="shu-input-field" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="12">
                      <a-form-item label="电子信鸽" name="email">
                        <a-input v-model:value="userForm.email" placeholder="请输入邮箱" class="shu-input-field" />
                      </a-form-item>
                    </a-col>
                  </a-row>
                </div>
                <div class="shu-action-trigger">
                  <a-button type="primary" class="shu-btn-prime" @click="submitUserInfo">刻录修改信息</a-button>
                </div>
              </a-form>
            </div>
          </div>
        </section>

        <!-- Ⅳ. 密匙守护 (右侧高御卡) -->
        <section class="shu-matrix-cell cell-secure">
          <div class="shu-cell-head">
            <span class="shu-cell-num">02</span>
            <h3 class="shu-cell-title">密匙守护 <small>SECURITY</small></h3>
          </div>
          <div class="shu-secure-inner">
            <a-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" layout="vertical" class="shu-secure-flex-form">
              <div class="shu-secure-form-body">
                <a-form-item label="原密印" name="oldPassword">
                  <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入旧密码" class="shu-input-field" />
                </a-form-item>
                <a-form-item label="新契约密印" name="newPassword">
                  <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" class="shu-input-field" />
                </a-form-item>
                <a-form-item label="校正新密印" name="confirmPassword">
                  <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" class="shu-input-field" />
                </a-form-item>
              </div>
              <div class="shu-action-trigger trigger-start">
                <a-button type="primary" class="shu-btn-prime" @click="submitPassword">重塑秘钥契约</a-button>
              </div>
            </a-form>
          </div>
        </section>
      </div>

      <!-- Ⅱ. 青铜造物 错落非对称宽幅展廊流 -->
      <section class="shu-gallery-block">
        <div class="shu-block-header">
          <div class="shu-header-left">
            <span class="shu-block-badge">HERITAGE</span>
            <h2 class="shu-block-main-title">Ⅱ. 青铜造物</h2>
          </div>

          <div class="shu-gallery-control">
            <a-button type="primary" class="shu-btn-prime-large" @click="showCreateModal = true">
            开炉铸造新器
            </a-button>
            <div class="shu-filter-combo">
              <a-select
                  v-model:value="heritageFilter.status"
                  placeholder="按造物状态"
                  style="width: 140px"
                  allow-clear
                  @change="fetchMyHeritage"
                  class="shu-select-flat"
              >
                <a-select-option :value="0">泥胎草稿</a-select-option>
                <a-select-option :value="1">入炉待审</a-select-option>
                <a-select-option :value="2">传世发布</a-select-option>
                <a-select-option :value="3">封仓下架</a-select-option>
              </a-select>
              <a-input-search
                  v-model:value="heritageFilter.keyword"
                  placeholder="搜寻器物名称..."
                  style="width: 220px"
                  @search="fetchMyHeritage"
                  class="shu-search-flat"
              />
            </div>
          </div>
        </div>

        <div class="shu-gallery-stream">
          <a-spin :spinning="heritageLoading">
            <div v-if="myHeritageList.length > 0" class="shu-strip-container">
              <div v-for="(item, index) in myHeritageList" :key="item.id" :class="['shu-strip-row', index % 2 === 0 ? 'row-normal' : 'row-reverse']">
                <div class="shu-strip-visual">
                  <div class="shu-visual-frame">
                    <img
                        v-if="getItemCoverUrl(item)"
                        :src="getItemCoverUrl(item)"
                        :alt="item.title"
                        @error="handleImageError"
                    />
                    <div v-else class="shu-visual-none">
                      <span class="shu-none-icon">🏺</span>
                      <span>暂无图腾</span>
                    </div>
                  </div>
                  <div class="shu-visual-badge">
                    <HeritageStatusTag :status="item.status" :status-name="item.statusName" />
                  </div>
                </div>

                <div class="shu-strip-content">
                  <div class="shu-strip-meta">
                    <span class="shu-meta-category">{{ item.category }}</span>
                    <span class="shu-meta-line"></span>
                    <span class="shu-meta-time">{{ formatDate(item.createTime) }}</span>
                  </div>
                  <h3 class="shu-strip-title" :title="item.title">{{ item.title }}</h3>

                  <div class="shu-strip-ops">
                    <a-space size="middle">
                      <a-button type="link" class="shu-link-btn" @click="handleViewItem(item)">
                        <span>鉴赏明细</span> <span class="arrow">→</span>
                      </a-button>
                      <a-button class="shu-btn-mini-bronze" @click="handleEditItem(item)" v-if="canEdit(item)">重铸</a-button>
                      <a-popconfirm title="确定销毁此造物？" @confirm="handleDeleteItem(item)" v-if="canDelete(item)">
                        <a-button danger type="text" class="shu-btn-mini-danger">销毁</a-button>
                      </a-popconfirm>
                    </a-space>
                  </div>
                </div>
                <div class="shu-strip-index-bg">0{{index + 1}}</div>
              </div>
            </div>
            <div v-else class="shu-void-state">
              <a-empty description="宝库空空如也，尚未开炉冶炼" />
            </div>
          </a-spin>
        </div>

        <div v-if="heritageTotal > 0" class="shu-pagination-universe">
          <a-pagination
              v-model:current="heritageFilter.currentPage"
              v-model:pageSize="heritageFilter.size"
              :total="heritageTotal"
              show-size-changer
              @change="fetchMyHeritage"
              @showSizeChange="fetchMyHeritage"
          />
        </div>
      </section>

      <!-- Ⅲ. 落脚驿站 纵向文书竹简流水线 -->
      <section class="shu-gallery-block" style="margin-bottom: 80px;">
        <div class="shu-block-header">
          <div class="shu-header-left">
            <span class="shu-block-badge">STATION</span>
            <h2 class="shu-block-main-title">Ⅲ. 落脚驿站</h2>
          </div>
          <div class="shu-header-right">
            <button class="shu-trigger-add-line" @click="handleAddAddress">
           开拓新落脚驿站
            </button>
          </div>
        </div>

        <div class="shu-chronicle-pipeline">
          <div v-for="(address, idx) in addressList" :key="address.id" :class="['shu-chronicle-row', { 'is-supreme': address.isDefault }]">
            <div class="shu-chronicle-left">
              <div class="shu-node-indicator">
                <span class="indicator-dot"></span>
              </div>
              <span class="shu-chronicle-num">驿站 {{ idx + 1 }}</span>
            </div>

            <div class="shu-chronicle-main">
              <div class="shu-chronicle-user">
                <span class="shu-user-name">{{ address.receiver }}</span>
                <span class="shu-user-phone">{{ address.phone }}</span>
                <span v-if="address.isDefault" class="shu-tag-supreme">至尊默认</span>
              </div>
              <div class="shu-chronicle-addr">
                <p class="shu-addr-text">{{ address.fullAddress }}</p>
              </div>
            </div>

            <div class="shu-chronicle-actions">
              <a-button type="text" class="shu-action-btn edit" @click="handleEditAddress(address)">修正文书</a-button>
              <a-button v-if="!address.isDefault" type="text" class="shu-action-btn default" @click="handleSetDefaultAddress(address.id)">设为首驿</a-button>
              <a-button type="text" danger class="shu-action-btn delete" @click="handleDeleteAddress(address.id)">抹去</a-button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 内嵌组件不变 -->
    <HeritageItemCreate v-model:open="showCreateModal" mode="user" @success="handleCreateSuccess" />
    <HeritageItemEdit v-model:open="showEditModal" :item-id="currentEditItemId" mode="user" @success="handleEditSuccess" />

    <a-modal
        v-model:open="addressModalVisible"
        :title="isEditAddress ? '修正驿站文书' : '册封新落脚驿站'"
        @ok="handleSubmitAddress"
        @cancel="handleCancelAddress"
        width="580px"
        class="shu-dialog-relic"
    >
      <a-form ref="addressFormRef" :model="addressFormData" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="收信尊长" name="receiver" :rules="[{ required: true, message: '请输入收货人姓名' }]">
              <a-input v-model:value="addressFormData.receiver" class="shu-input-field" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="通传火急（手机号）" name="phone" :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '格式不正确' }]">
              <a-input v-model:value="addressFormData.phone" class="shu-input-field" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item label="疆域/省" name="province" :rules="[{ required: true, message: '请输入省份' }]">
              <a-input v-model:value="addressFormData.province" class="shu-input-field" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="城池/市" name="city" :rules="[{ required: true, message: '请输入城市' }]">
              <a-input v-model:value="addressFormData.city" class="shu-input-field" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="聚落/区县" name="district" :rules="[{ required: true, message: '请输入区/县' }]">
              <a-input v-model:value="addressFormData.district" class="shu-input-field" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="里坊细址（详细地址）" name="detail" :rules="[{ required: true, message: '请输入详细地址' }]">
          <a-textarea v-model:value="addressFormData.detail" :rows="3" class="shu-input-field" />
        </a-form-item>
        <a-form-item label="设为常用落脚点" name="isDefault">
          <a-switch v-model:checked="addressFormData.isDefault" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { message, Modal } from "ant-design-vue";
import { useUserStore } from "@/store/user";
import { useRouter } from "vue-router";
import request from "@/utils/request";
import { getCurrentUser, updateUser, updatePassword } from '@/api/user';
import { getHeritageItemPage, deleteHeritageItem } from '@/api/HeritageApi';
import { getUserAddressList, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/api/AddressApi';
import { formatLocalDate } from '@/utils/dateUtils';
import HeritageItemCreate from '@/components/common/HeritageItemCreate.vue';
import HeritageItemEdit from '@/components/common/HeritageItemEdit.vue';
import HeritageStatusTag from '@/components/common/HeritageStatusTag.vue';

const uploadAction = "#";
const userStore = useUserStore();
const router = useRouter();

const showCreateModal = ref(false);
const showEditModal = ref(false);
const currentEditItemId = ref(null);
const heritageLoading = ref(false);
const myHeritageList = ref([]);
const heritageTotal = ref(0);

const heritageFilter = reactive({
  currentPage: 1,
  size: 6,
  status: null,
  keyword: '',
  creatorId: null
});

const addressList = ref([]);
const addressModalVisible = ref(false);
const isEditAddress = ref(false);
const addressFormRef = ref(null);
const addressFormData = reactive({
  id: null, receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false
});

const userFormRef = ref(null);
const passwordFormRef = ref(null);

const userForm = reactive({
  id: "", username: "", name: "", email: "", phone: "", sex: "", avatar: "",
});
const avatarUrl = computed(() => userForm.avatar);

const passwordForm = reactive({ oldPassword: "", newPassword: "", confirmPassword: "" });

const rules = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] },
  ],
  phone: [
    { required: false, trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: ["blur", "change"] },
  ],
};

const passwordRules = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }, { min: 6, message: "长度不够", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) callback(new Error("两次输入的密码不一致"));
        else callback();
      },
      trigger: ["blur", "change"],
    },
  ],
};

const getUserInfo = async () => {
  try {
    const data = await getCurrentUser();
    userStore.updateUserInfo(data);
    userForm.id = data.id || "";
    userForm.username = data.username || "";
    userForm.name = data.nickname || data.name || "";
    userForm.email = data.email || "";
    userForm.phone = data.phone || "";
    userForm.sex = data.sex || "男";
    userForm.avatar = data.avatar || "";

    heritageFilter.creatorId = data.id;
    fetchMyHeritage();
    loadAddressList();
  } catch (error) {
    message.error("获取用户信息失败");
  }
};

const beforeAvatarUpload = (file) => {
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) message.error("头像大小不能超过 2MB!");
  return isLt2M;
};

const customUploadAvatar = async (options) => {
  try {
    const { file } = options;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("businessType", "USER_AVATAR");
    formData.append("businessId", userForm.id.toString());
    formData.append("businessField", "avatar");
    formData.append("replaceOld", "true");

    const response = await request.post("/file/upload", formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userStore.token}` }
    });
    const avatarPath = response.filePath || response.path;
    userForm.avatar = avatarPath;
    await updateUser(userForm.id, { avatar: avatarPath });
    message.success("头像更新完成");
  } catch (error) {
    message.error("头像上传失败");
  }
};

const submitUserInfo = async () => {
  try {
    await userFormRef.value.validate();
    await updateUser(userForm.id, { name: userForm.name, email: userForm.email, phone: userForm.phone, sex: userForm.sex });
    message.success("古蜀档案刻录成功!");
  } catch (error) {
    console.debug("用户资料校验未通过:", error);
  }
};

const submitPassword = async () => {
  try {
    await passwordFormRef.value.validate();
    await updatePassword(userForm.id, { oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword });
    Modal.info({
      title: "契约变动", content: "密码已重塑，请重新登录。", okText: "谨遵神谕",
      onOk: async () => { await userStore.logout(); window.location.href = "/auth/login"; }
    });
  } catch (error) {
    console.debug("密码表单校验未通过:", error);
  }
};

const fetchMyHeritage = () => {
  if (!heritageFilter.creatorId) return;
  heritageLoading.value = true;
  getHeritageItemPage({
    currentPage: heritageFilter.currentPage, size: heritageFilter.size,
    creatorId: heritageFilter.creatorId, title: heritageFilter.keyword || undefined,
    status: heritageFilter.status !== null ? heritageFilter.status : undefined,
  }, {
    onSuccess: (res) => { myHeritageList.value = res.records || []; heritageTotal.value = res.total || 0; heritageLoading.value = false; },
    onError: () => { heritageLoading.value = false; }
  });
};

const loadAddressList = () => { getUserAddressList({ onSuccess: (res) => { addressList.value = res || []; } }); };
const formatDate = (d) => d ? formatLocalDate(new Date(d)) : '';
const getItemCoverUrl = (i) => i.coverImage || (i.coverFileId ? `/api/file/preview/${i.coverFileId}` : null);
const handleImageError = (e) => { e.target.style.display = 'none'; };
const canEdit = (i) => i.status === 0 || i.status === 1;
const canDelete = (i) => i.status === 0 || i.status === 3;
const handleViewItem = (i) => router.push(`/heritage/${i.id}`);
const handleEditItem = (i) => { currentEditItemId.value = i.id; showEditModal.value = true; };
const handleDeleteItem = (i) => deleteHeritageItem({ itemId: i.id }, { onSuccess: () => fetchMyHeritage() });
const handleCreateSuccess = () => fetchMyHeritage();
const handleEditSuccess = () => fetchMyHeritage();

const handleAddAddress = () => { isEditAddress.value = false; resetAddressForm(); addressModalVisible.value = true; };
const handleEditAddress = (a) => {
  isEditAddress.value = true; addressFormData.id = a.id; addressFormData.receiver = a.receiver;
  addressFormData.phone = a.phone; addressFormData.province = a.province; addressFormData.city = a.city;
  addressFormData.district = a.district; addressFormData.detail = a.detail; addressFormData.isDefault = a.isDefault;
  addressModalVisible.value = true;
};
const handleDeleteAddress = (id) => deleteAddress(id, { onSuccess: () => loadAddressList() });
const handleSetDefaultAddress = (id) => setDefaultAddress(id, { onSuccess: () => loadAddressList() });
const handleSubmitAddress = () => {
  addressFormRef.value.validate().then(() => {
    if (isEditAddress.value) updateAddress(addressFormData.id, addressFormData, { onSuccess: () => { addressModalVisible.value = false; loadAddressList(); } });
    else createAddress(addressFormData, { onSuccess: () => { addressModalVisible.value = false; loadAddressList(); } });
  });
};
const handleCancelAddress = () => { addressModalVisible.value = false; resetAddressForm(); };
const resetAddressForm = () => {
  addressFormData.id = null; addressFormData.receiver = ''; addressFormData.phone = '';
  addressFormData.province = ''; addressFormData.city = ''; addressFormData.district = ''; addressFormData.detail = ''; addressFormData.isDefault = false;
};

onMounted(() => {
  getUserInfo();
});
</script>

<style scoped>
/* ================= 全局时空底衬 ================= */
.shu-cosmic-layout {
  min-height: 100vh;
  background-color: #fafbfc;
  color: #2c3e35;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  position: relative;
  overflow-x: hidden;
  padding-bottom: 100px;
}

.shu-nebula-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 480px;
  background: radial-gradient(circle at 50% -10%, rgba(66, 102, 79, 0.08) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
  z-index: 1;
}

.shu-core-wrapper {
  position: relative;
  z-index: 2;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ================= 头部 ================= */
.shu-brand-header {
  text-align: center;
  padding: 60px 0 40px 0;
}
.shu-brand-badge {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 2px;
  color: #42664f;
  background: rgba(66, 102, 79, 0.06);
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  margin-bottom: 14px;
}
.shu-brand-title {
  color: #1e3526;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 0 0 8px 0;
}
.shu-brand-subtitle {
  color: #7f9488;
  font-size: 14px;
  letter-spacing: 4px;
  margin: 0;
}
.shu-brand-line {
  width: 40px;
  height: 3px;
  background: #42664f;
  margin: 24px auto 0 auto;
  border-radius: 2px;
}

/* ================= 双栏非对称矩阵与对齐改造 ================= */
.shu-twin-matrix {
  display: flex;
  gap: 32px;
  margin-top: 20px;
  margin-bottom: 50px;
  align-items: stretch;
}
.shu-matrix-cell {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(66, 102, 79, 0.03);
  border: 1px solid rgba(66, 102, 79, 0.06);
  padding: 32px;
  display: flex;
  flex-direction: column;
}
.cell-profile { flex: 1.4; }
.cell-secure { flex: 1; }

.shu-cell-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 30px;
  flex-shrink: 0;
}
.shu-cell-num {
  font-size: 20px;
  font-weight: 700;
  color: #42664f;
  font-family: monospace;
}
.shu-cell-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e3526;
  margin: 0;
}
.shu-cell-title small {
  font-size: 11px;
  color: #a3b8ad;
  margin-left: 6px;
  letter-spacing: 1px;
}

/* 档案及密码块的 Flex 排版高度对齐延伸 */
.shu-profile-flex {
  display: flex;
  gap: 32px;
  flex: 1;
}
.shu-form-spine {
  flex: 1;
}
.shu-secure-inner {
  flex: 1;
}

.shu-spine-flex-form,
.shu-secure-flex-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.shu-spine-form-body,
.shu-secure-form-body {
  flex: 1;
}

/* 统一底部对齐线 */
.shu-action-trigger {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 24px;
}
.shu-action-trigger.trigger-start {
  justify-content: flex-start;
}

/* 头像外圈 */
.shu-avatar-sphere {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.shu-avatar-orbit {
  position: relative;
  padding: 6px;
}
.shu-avatar-core {
  background: #42664f;
  color: #ffffff;
  font-size: 32px;
  font-weight: bold;
}
.shu-orbit-ring {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border: 1px dashed rgba(66, 102, 79, 0.3);
  border-radius: 50%;
  animation: spin 20s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

.shu-avatar-action { margin-top: 16px; }
.shu-btn-relic {
  background: transparent; border: 1px solid rgba(66, 102, 79, 0.3);
  color: #42664f; border-radius: 6px; font-size: 12px;
}
.shu-btn-relic:hover { background: rgba(66, 102, 79, 0.04); border-color: #42664f; }

/* ================= 业务展示大区块框架 ================= */
.shu-gallery-block {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(66, 102, 79, 0.03);
  border: 1px solid rgba(66, 102, 79, 0.05);
  padding: 40px;
  margin-bottom: 48px;
}
.shu-block-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid #f0f4f1;
  padding-bottom: 24px;
  margin-bottom: 32px;
}
.shu-block-badge {
  font-size: 11px;
  color: #a3b8ad;
  letter-spacing: 2px;
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}
.shu-block-main-title {
  font-size: 22px;
  font-weight: 800;
  color: #1e3526;
  margin: 0;
}

/* ================= 青铜造物展廊 ================= */
.shu-gallery-control { display: flex; align-items: center; gap: 20px; }
.shu-filter-combo {
  display: flex; background: #f4f6f5; padding: 4px; border-radius: 8px; align-items: center;
}
.shu-select-flat :deep(.ant-select-selector) {
  background: transparent !important; border: none !important; box-shadow: none !important;
}
.shu-search-flat :deep(.ant-input) {
  background: #ffffff !important; border: none !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02); border-radius: 6px;
}

.shu-gallery-stream { margin-top: 10px; }
.shu-strip-container { display: flex; flex-direction: column; gap: 24px; }
.shu-strip-row {
  position: relative; display: flex; align-items: center; background: #ffffff;
  border: 1px solid rgba(66, 102, 79, 0.08); border-radius: 12px; padding: 20px;
  transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1); overflow: hidden;
}
.shu-strip-row:hover {
  transform: translateY(-3px); box-shadow: 0 12px 30px rgba(66, 102, 79, 0.06); border-color: #42664f;
}
.shu-strip-row.row-normal { flex-direction: row; }
.shu-strip-row.row-reverse { flex-direction: row-reverse; }

.shu-strip-visual {
  position: relative; width: 220px; height: 130px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: #f7faf8;
}
.shu-visual-frame { width: 100%; height: 100%; }
.shu-visual-frame img { width: 100%; height: 100%; object-fit: cover; }
.shu-visual-none {
  height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a4b5ab; gap: 6px;
}
.shu-none-icon { font-size: 20px; }
.shu-visual-badge { position: absolute; top: 10px; left: 10px; }

.shu-strip-content { flex: 1; padding: 0 30px; z-index: 2; }
.shu-strip-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #798c80; margin-bottom: 8px; }
.shu-meta-category { color: #42664f; font-weight: 600; }
.shu-meta-line { width: 4px; height: 4px; background: #c2cdc6; border-radius: 50%; }
.shu-strip-title { font-size: 18px; font-weight: 700; color: #1e3526; margin: 0 0 16px 0; }

.shu-link-btn { color: #42664f; font-weight: 600; padding: 0; display: flex; align-items: center; gap: 4px; }
.shu-link-btn .arrow { transition: transform 0.2s; }
.shu-link-btn:hover .arrow { transform: translateX(3px); }
.shu-btn-mini-bronze { background: rgba(66, 102, 79, 0.05); color: #42664f; border: none; font-size: 12px; border-radius: 4px; }
.shu-btn-mini-bronze:hover { background: #42664f !important; color: #ffffff !important; }
.shu-btn-mini-danger { font-size: 12px; padding: 0 8px; }

.shu-strip-index-bg {
  position: absolute; right: 20px; bottom: -10px; font-size: 80px; font-weight: 900;
  color: rgba(66, 102, 79, 0.03); font-family: monospace; pointer-events: none; z-index: 1; line-height: 1;
}
.shu-strip-row.row-reverse .shu-strip-index-bg { left: 20px; right: auto; }
.shu-void-state { padding: 60px 0; }

/* 分页包裹容器 */
.shu-pagination-universe { margin-top: 32px; display: flex; justify-content: flex-end; }

/* ================= 重点改造：深度拦截覆盖分页标签颜色为 #42664f ================= */
.shu-pagination-universe :deep(.ant-pagination-item-active) {
  border-color: #42664f !important;
  background-color: #ffffff !important;
}
.shu-pagination-universe :deep(.ant-pagination-item-active a) {
  color: #42664f !important;
}
.shu-pagination-universe :deep(.ant-pagination-item:hover) {
  border-color: #42664f !important;
}
.shu-pagination-universe :deep(.ant-pagination-item:hover a) {
  color: #42664f !important;
}
.shu-pagination-universe :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
.shu-pagination-universe :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
  border-color: #42664f !important;
  color: #42664f !important;
}
.shu-pagination-universe :deep(.ant-select-focused .ant-select-selector),
.shu-pagination-universe :deep(.ant-select-selector:hover) {
  border-color: #42664f !important;
}
.shu-pagination-universe :deep(.ant-select-item-option-selected:not(.ant-select-item-option-disabled)) {
  background-color: rgba(66, 102, 79, 0.08) !important;
  color: #42664f !important;
}

/* ================= 落脚驿站流水线 ================= */
.shu-trigger-add-line {
  background: transparent; border: 1px dashed #42664f; color: #42664f; padding: 8px 18px;
  border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.shu-trigger-add-line:hover { background: rgba(66, 102, 79, 0.04); transform: translateY(-1px); }

.shu-chronicle-pipeline { display: flex; flex-direction: column; position: relative; }
.shu-chronicle-pipeline::before { content: ''; position: absolute; top: 0; bottom: 0; left: 90px; width: 1px; background: #e2e8e5; }
.shu-chronicle-row { display: flex; align-items: center; padding: 24px 0; border-bottom: 1px solid #f4f6f5; transition: all 0.3s; }
.shu-chronicle-row:last-child { border-bottom: none; }
.shu-chronicle-row:hover { background: rgba(66, 102, 79, 0.01); }

.shu-chronicle-left { width: 120px; flex-shrink: 0; display: flex; align-items: center; gap: 14px; }
.shu-node-indicator {
  width: 13px; height: 13px; background: #ffffff; border: 2px solid #c2cdc6; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; left: 24px;
}
.indicator-dot { width: 5px; height: 5px; background: transparent; border-radius: 50%; }
.shu-chronicle-num { font-size: 13px; font-weight: 600; color: #798c80; padding-left: 24px;}

.shu-chronicle-main { flex: 1; padding-left: 20px; }
.shu-chronicle-user { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.shu-user-name { font-size: 16px; font-weight: 700; color: #1e3526; }
.shu-user-phone { font-size: 13px; color: #617367; }
.shu-tag-supreme { background: #42664f; color: #ffffff; font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 4px; letter-spacing: 1px; }
.shu-addr-text { font-size: 14px; color: #4a574e; margin: 0; line-height: 1.5; }

.shu-chronicle-actions { display: flex; align-items: center; gap: 8px; padding-left: 20px; }
.shu-action-btn { font-size: 13px; font-weight: 500; color: #5c7064; }
.shu-action-btn:hover { color: #42664f; background: rgba(66, 102, 79, 0.05); }
.shu-action-btn.delete:hover { color: #ff4d4f; background: rgba(255,77,79,0.05); }

.shu-chronicle-row.is-supreme .shu-node-indicator { border-color: #42664f; background: #42664f; }
.shu-chronicle-row.is-supreme .shu-node-indicator .indicator-dot { background: #ffffff; }
.shu-chronicle-row.is-supreme .shu-chronicle-num { color: #42664f; }

/* ================= 基础通用规范 ================= */
:deep(.ant-form-item-label > label) { color: #4a5a50; font-weight: 600; font-size: 13px; }
.shu-input-field { border-radius: 6px; border: 1px solid #d1dad4; padding: 6px 12px; }
.shu-input-field:focus, :deep(.ant-input-affix-wrapper-focused) {
  border-color: #42664f !important; box-shadow: 0 0 0 2px rgba(66, 102, 79, 0.08) !important;
}
.shu-input-locked { background: #f4f6f5 !important; border-color: #d1dad4 !important; color: #86968d !important; border-radius: 6px; }

.shu-btn-prime { background: #42664f; border-color: #42664f; border-radius: 6px; font-weight: 600; }
.shu-btn-prime:hover { background: #2b4434 !important; border-color: #2b4434 !important; }
.shu-btn-prime-large { background: #42664f; border-color: #42664f; border-radius: 8px; height: 38px; font-weight: 600; }
.shu-btn-prime-large:hover { background: #2b4434 !important; border-color: #2b4434 !important; }

/* 性别单选 */
.shu-custom-radio { display: block; width: 100%; }
:deep(.ant-radio-button-wrapper) { border-color: #d1dad4; color: #5c7064; text-align: center; width: 50%; height: 36px; line-height: 34px; }
:deep(.ant-radio-button-wrapper-checked) { background-color: #42664f !important; border-color: #42664f !important; color: #ffffff !important; }
:deep(.ant-radio-button-wrapper:hover) { color: #42664f; border-color: #42664f; }
:deep(.ant-radio-button-wrapper-checked:hover) { color: #ffffff !important; border-color: #42664f !important; }

.shu-dialog-relic :deep(.ant-modal-content) { border-radius: 16px; padding: 24px; }
.shu-dialog-relic :deep(.ant-modal-title) { font-size: 18px; font-weight: 700; color: #1e3526; }

/* ================= 移动端断点 ================= */
@media (max-width: 992px) {
  .shu-twin-matrix { flex-direction: column; }
  .shu-matrix-cell { height: auto !important; }
  .shu-profile-flex { flex-direction: column; align-items: center; }
  .shu-block-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .shu-gallery-control { width: 100%; flex-direction: column; align-items: stretch; }
  .shu-filter-combo { flex-direction: column; width: 100%; }
  .shu-select-flat, .shu-search-flat { width: 100% !important; }
  .shu-strip-row { flex-direction: column !important; align-items: stretch; }
  .shu-strip-visual { width: 100%; height: 160px; }
  .shu-strip-content { padding: 16px 0 0 0; }
  .shu-chronicle-pipeline::before { left: 20px; }
  .shu-chronicle-left { width: auto; position: absolute; left: 0; }
  .shu-chronicle-num { display: none; }
  .shu-chronicle-main { padding-left: 44px; }
  .shu-chronicle-actions { padding-left: 44px; flex-wrap: wrap; margin-top: 10px; }
}
</style>
