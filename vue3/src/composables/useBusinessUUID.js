/**
 * Vue3 组合式函数 - 业务UUID管理
 * @description 提供业务实体UUID的生成、管理和文件上传集成
 * @author system
 */

import { ref, computed, onUnmounted, readonly, watch } from 'vue';
import { 
  generateBusinessUUID, 
  isValidUUID, 
  BusinessUUIDManager,
  BUSINESS_TYPES,
  supportsUUIDStrategyB 
} from '@/utils/uuidUtils';

/**
 * @description 业务UUID管理组合式函数
 * @param {string} businessType - 业务类型
 * @param {Object} options - 配置选项
 * @param {boolean} options.autoGenerate - 是否自动生成UUID（默认true）
 * @param {string} options.initialUUID - 初始UUID值
 * @returns {Object} UUID管理相关的响应式数据和方法
 */
export function useBusinessUUID(businessType, options = {}) {
  const { autoGenerate = true, initialUUID = null } = options;

  // 验证业务类型
  if (!supportsUUIDStrategyB(businessType)) {
    console.warn(`Business type ${businessType} does not support UUID Strategy B`);
  }

  // 创建UUID管理器
  const manager = new BusinessUUIDManager(businessType);
  
  // 响应式数据
  const uuid = ref(initialUUID);
  const isGenerated = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  // 如果有初始UUID，设置到管理器
  if (initialUUID && isValidUUID(initialUUID)) {
    manager.set(initialUUID);
    uuid.value = initialUUID;
  } else if (autoGenerate) {
    // 自动生成UUID
    generateUUID();
  }

  // 计算属性
  const hasUUID = computed(() => !!uuid.value);
  const isUUIDValid = computed(() => isValidUUID(uuid.value));
  const businessId = computed(() => uuid.value);

  /**
   * 生成新的UUID
   * @returns {string} 生成的UUID
   */
  function generateUUID() {
    try {
      isLoading.value = true;
      error.value = null;
      
      const newUUID = manager.generate();
      uuid.value = newUUID;
      isGenerated.value = true;
      
      return newUUID;
    } catch (err) {
      error.value = err.message;
      console.error('Failed to generate UUID:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 设置UUID
   * @param {string} newUUID - 新的UUID值
   * @returns {boolean} 是否设置成功
   */
  function setUUID(newUUID) {
    try {
      error.value = null;
      
      if (!isValidUUID(newUUID)) {
        throw new Error('Invalid UUID format');
      }
      
      manager.set(newUUID);
      uuid.value = newUUID;
      isGenerated.value = false;
      
      return true;
    } catch (err) {
      error.value = err.message;
      console.error('Failed to set UUID:', err);
      return false;
    }
  }

  /**
   * 重置UUID
   */
  function resetUUID() {
    manager.reset();
    uuid.value = null;
    isGenerated.value = false;
    error.value = null;
  }

  /**
   * 获取UUID（如果不存在则生成）
   * @returns {string} UUID
   */
  function getOrGenerateUUID() {
    if (!uuid.value) {
      return generateUUID();
    }
    return uuid.value;
  }

  // 组件卸载时清理
  onUnmounted(() => {
    manager.reset();
  });

  return {
    // 响应式数据
    uuid: readonly(uuid),
    isGenerated: readonly(isGenerated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // 计算属性
    hasUUID,
    isUUIDValid,
    businessId,
    businessType,
    
    // 方法
    generateUUID,
    setUUID,
    resetUUID,
    getOrGenerateUUID,
    
    // 管理器实例（高级用法）
    manager
  };
}

/**
 * @description 文件上传UUID管理组合式函数
 * @param {string} businessType - 业务类型
 * @param {Object} options - 配置选项
 * @returns {Object} 文件上传相关的UUID管理
 */
export function useFileUploadUUID(businessType, options = {}) {
  const uuidManager = useBusinessUUID(businessType, options);
  
  // 上传相关状态
  const uploadedFiles = ref([]);
  const uploadProgress = ref(0);
  const isUploading = ref(false);

  /**
   * 准备文件上传（确保有UUID）
   * @returns {string} 用于上传的UUID
   */
  function prepareUpload() {
    return uuidManager.getOrGenerateUUID();
  }

  /**
   * 添加已上传的文件信息
   * @param {Object} fileInfo - 文件信息
   */
  function addUploadedFile(fileInfo) {
    uploadedFiles.value.push({
      ...fileInfo,
      businessId: uuidManager.businessId.value,
      businessType,
      uploadTime: new Date()
    });
  }

  /**
   * 移除已上传的文件
   * @param {string} fileId - 文件ID
   */
  function removeUploadedFile(fileId) {
    const index = uploadedFiles.value.findIndex(file => file.id === fileId);
    if (index > -1) {
      uploadedFiles.value.splice(index, 1);
    }
  }

  /**
   * 清空已上传的文件列表
   */
  function clearUploadedFiles() {
    uploadedFiles.value = [];
  }

  /**
   * 重置上传状态
   */
  function resetUploadState() {
    clearUploadedFiles();
    uploadProgress.value = 0;
    isUploading.value = false;
    uuidManager.resetUUID();
  }

  // 计算属性
  const hasUploadedFiles = computed(() => uploadedFiles.value.length > 0);
  const uploadedFileCount = computed(() => uploadedFiles.value.length);

  return {
    // 继承UUID管理功能
    ...uuidManager,
    
    // 文件上传相关
    uploadedFiles: readonly(uploadedFiles),
    uploadProgress: readonly(uploadProgress),
    isUploading: readonly(isUploading),
    hasUploadedFiles,
    uploadedFileCount,
    
    // 文件上传方法
    prepareUpload,
    addUploadedFile,
    removeUploadedFile,
    clearUploadedFiles,
    resetUploadState
  };
}

/**
 * @description 表单UUID管理组合式函数
 * @param {string} businessType - 业务类型
 * @param {Object} formData - 表单数据对象
 * @param {Object} options - 配置选项
 * @returns {Object} 表单相关的UUID管理
 */
export function useFormUUID(businessType, formData, options = {}) {
  const uuidManager = useBusinessUUID(businessType, options);
  
  // 监听UUID变化，自动更新表单数据
  watch(
    () => uuidManager.uuid.value,
    (newUUID) => {
      if (formData && typeof formData === 'object') {
        formData.id = newUUID;
      }
    },
    { immediate: true }
  );

  /**
   * 准备表单提交
   * @returns {Object} 包含UUID的表单数据
   */
  function prepareFormSubmit() {
    const uuid = uuidManager.getOrGenerateUUID();
    return {
      ...formData,
      id: uuid
    };
  }

  /**
   * 重置表单和UUID
   */
  function resetForm() {
    uuidManager.resetUUID();
    if (formData && typeof formData === 'object') {
      Object.keys(formData).forEach(key => {
        if (key !== 'id') {
          formData[key] = '';
        }
      });
    }
  }

  return {
    // 继承UUID管理功能
    ...uuidManager,
    
    // 表单相关方法
    prepareFormSubmit,
    resetForm
  };
}

// 导出独立的UUID生成函数（用于简单场景）
/**
 * @description 生成UUID的简单函数
 * @returns {string} 生成的UUID
 */
export function generateUUID() {
  return generateBusinessUUID();
}

// 导出业务类型常量
export { BUSINESS_TYPES };
