/**
 * 文件管理相关API接口
 * @author system
 */

import request from '@/utils/request'

// ========== 简单文件上传API ==========

/**
 * 简单图片上传
 * @param {File} file - 图片文件
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function uploadImage(file, callbacks) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post('/file/simple/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...callbacks
  })
}

/**
 * 简单文件上传
 * @param {File} file - 文件
 * @param {string} fileType - 文件类型 (COMMON, IMG, VIDEO, AUDIO, PDF)
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function uploadSimpleFile(file, fileType = 'COMMON', callbacks) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', fileType)
  
  return request.post('/file/simple/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...callbacks
  })
}

/**
 * 多文件上传
 * @param {FileList|Array} files - 文件列表
 * @param {string} fileType - 文件类型
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function uploadMultipleFiles(files, fileType = 'COMMON', callbacks) {
  const formData = new FormData()
  Array.from(files).forEach(file => {
    formData.append('files', file)
  })
  formData.append('fileType', fileType)
  
  return request.post('/file/simple/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...callbacks
  })
}

/**
 * 删除简单文件
 * @param {string} filename - 文件名
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function deleteSimpleFile(filename, callbacks) {
  return request.delete(`/file/simple/delete/${filename}`, callbacks)
}

/**
 * 获取文件信息
 * @param {string} filename - 文件名
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getSimpleFileInfo(filename, callbacks) {
  return request.get(`/file/simple/info/${filename}`, {}, callbacks)
}

/**
 * 获取文件下载路径
 * @param {string} filename - 文件名
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getDownloadPath(filename, callbacks) {
  return request.get(`/file/simple/download/${filename}`, {}, callbacks)
}

// ========== 业务文件上传API ==========

/**
 * 业务文件上传
 * @param {File} file - 文件
 * @param {object} businessInfo - 业务信息
 * @param {string} businessInfo.businessType - 业务类型
 * @param {string} businessInfo.businessId - 业务ID
 * @param {string} businessInfo.businessField - 业务字段
 * @param {boolean} replaceOld - 是否替换旧文件
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function uploadBusinessFile(file, businessInfo, replaceOld = false, callbacks) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('businessType', businessInfo.businessType)
  formData.append('businessId', businessInfo.businessId)
  if (businessInfo.businessField) {
    formData.append('businessField', businessInfo.businessField)
  }
  formData.append('replaceOld', replaceOld)
  
  return request.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...callbacks
  })
}

/**
 * 策略B：前端UUID预生成业务文件上传（使用标准业务文件上传接口）
 * @param {File} file - 文件
 * @param {object} businessInfo - 业务信息
 * @param {string} businessInfo.businessType - 业务类型
 * @param {string} businessInfo.businessId - 预生成的UUID
 * @param {string} businessInfo.businessField - 业务字段
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function uploadBusinessFileWithUUID(file, businessInfo, callbacks) {
  // 直接使用标准的业务文件上传接口，后端已支持UUID格式的businessId
  return uploadBusinessFile(file, businessInfo, false, callbacks)
}

/**
 * 临时文件上传
 * @param {File} file - 文件
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function uploadTempFile(file, callbacks) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post('/file/upload/temp', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...callbacks
  })
}

/**
 * 临时业务文件上传
 * @param {File} file - 文件
 * @param {object} businessInfo - 业务信息
 * @param {string} businessInfo.businessType - 业务类型
 * @param {string} businessInfo.businessField - 业务字段
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function uploadTempBusinessFile(file, businessInfo, callbacks) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('businessType', businessInfo.businessType)
  if (businessInfo.businessField) {
    formData.append('businessField', businessInfo.businessField)
  }
  
  return request.post('/file/upload/temp-business', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...callbacks
  })
}

/**
 * 确认临时文件
 * @param {number} tempFileId - 临时文件ID
 * @param {object} uploadDTO - 上传信息
 * @param {string} uploadDTO.businessType - 业务类型
 * @param {string} uploadDTO.businessId - 业务ID
 * @param {string} uploadDTO.businessField - 业务字段
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function confirmTempFile(tempFileId, uploadDTO, callbacks) {
  return request.put(`/file/confirm/${tempFileId}`, uploadDTO, callbacks)
}

// ========== 文件查询API ==========

/**
 * 根据业务信息获取文件列表
 * @param {string} businessType - 业务类型
 * @param {string} businessId - 业务ID
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getFilesByBusiness(businessType, businessId, callbacks) {
  return request.get(`/file/business/${businessType}/${businessId}`, {}, callbacks)
}

/**
 * 根据业务字段获取文件列表
 * @param {string} businessType - 业务类型
 * @param {string} businessId - 业务ID
 * @param {string} businessField - 业务字段
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getFilesByBusinessField(businessType, businessId, businessField, callbacks) {
  return request.get(`/file/business/${businessType}/${businessId}/${businessField}`, {}, callbacks)
}

// ========== 文件删除API ==========

/**
 * 删除业务文件
 * @param {object} params - 参数对象
 * @param {number} params.fileId - 文件ID
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function deleteBusinessFile(params, callbacks) {
  return request.delete(`/file/${params.fileId}`, callbacks)
}

/**
 * 删除文件（deleteBusinessFile的别名）
 * @param {object} params - 参数对象
 * @param {number} params.fileId - 文件ID
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function deleteFile(params, callbacks) {
  return deleteBusinessFile(params, callbacks)
}

/**
 * 批量删除业务文件
 * @param {string} businessType - 业务类型
 * @param {string} businessId - 业务ID
 * @param {string} businessField - 业务字段（可选）
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function deleteFilesByBusiness(businessType, businessId, businessField, callbacks) {
  const params = businessField ? { businessField } : {}
  return request.delete(`/file/business/${businessType}/${businessId}`, {
    params,
    ...callbacks
  })
}

// ========== 文件配置API ==========

/**
 * 获取文件上传配置
 * @param {string} businessType - 业务类型
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getUploadConfig(businessType, callbacks) {
  return request.get('/file/upload/config', { businessType }, callbacks)
}

/**
 * 清理过期临时文件
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function cleanupExpiredTempFiles(callbacks) {
  return request.post('/file/cleanup/temp', {}, callbacks)
}

// ========== 文件类型常量 ==========

/**
 * 文件类型枚举
 */
export const FILE_TYPES = {
  COMMON: { code: 'COMMON', name: '通用文件' },
  IMG: { code: 'IMG', name: '图片', accept: 'image/*' },
  VIDEO: { code: 'VIDEO', name: '视频', accept: 'video/*' },
  AUDIO: { code: 'AUDIO', name: '音频', accept: 'audio/*' },
  PDF: { code: 'PDF', name: 'PDF文档', accept: '.pdf' }
}

/**
 * 业务类型枚举
 */
export const BUSINESS_TYPES = {
  HERITAGE_ITEM: 'HERITAGE_ITEM',
  USER_AVATAR: 'USER_AVATAR',
  ACTIVITY: 'ACTIVITY',
  COURSE: 'COURSE',
  SHOP_PRODUCT: 'SHOP_PRODUCT',
  INHERITOR: 'INHERITOR'
}

/**
 * 文件大小限制（MB）
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 10,
  VIDEO: 100,
  AUDIO: 50,
  PDF: 20,
  COMMON: 50
}
