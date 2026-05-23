/**
 * 非遗作品相关API接口
 * @author system
 */

import request from '@/utils/request'

// ========== 作品管理API ==========

/**
 * 创建非遗作品
 * @param {object} params - 请求参数 { id: String, title: String, category: String, region: String, summary: String, description: String, status: Number, coverFileId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function createHeritageItem(params, callbacks) {
  return request.post('/heritage-item/create', params, callbacks)
}

/**
 * 获取作品详情
 * @param {object} params - 请求参数 { itemId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getHeritageItemDetail(params, callbacks) {
  return request.get(`/heritage-item/${params.itemId}`, null, callbacks)
}

/**
 * 分页查询作品列表
 * @param {object} params - 请求参数 { currentPage: Number, size: Number, title: String, category: String, region: String, status: Number, creatorId: String, startDate: String, endDate: String, orderBy: String, orderDirection: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getHeritageItemPage(params, callbacks) {
  return request.get('/heritage-item/page', params, callbacks)
}

/**
 * 更新作品信息
 * @param {object} params - 请求参数 { itemId: String, title: String, category: String, region: String, summary: String, description: String, status: Number, coverFileId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function updateHeritageItem(params, callbacks) {
  const { itemId, ...updateData } = params
  return request.put(`/heritage-item/${itemId}`, updateData, callbacks)
}

/**
 * 删除作品
 * @param {object} params - 请求参数 { itemId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function deleteHeritageItem(params, callbacks) {
  return request.delete(`/heritage-item/${params.itemId}`, callbacks)
}

/**
 * 发布作品
 * @param {object} params - 请求参数 { itemId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function publishHeritageItem(params, callbacks) {
  return request.post(`/heritage-item/${params.itemId}/publish`, {}, callbacks)
}

/**
 * 下架作品
 * @param {object} params - 请求参数 { itemId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function offlineHeritageItem(params, callbacks) {
  return request.post(`/heritage-item/${params.itemId}/offline`, {}, callbacks)
}

/**
 * 获取热门作品
 * @param {object} params - 请求参数 { limit: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getPopularItems(params, callbacks) {
  return request.get('/heritage-item/popular', params, callbacks)
}

/**
 * 搜索作品
 * @param {object} params - 请求参数 { keyword: String, limit: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function searchHeritageItems(params, callbacks) {
  return request.get('/heritage-item/search', params, callbacks)
}

/**
 * 获取最新作品
 * @param {object} params - 请求参数 { limit: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getLatestItems(params, callbacks) {
  return request.get('/heritage-item/latest', params, callbacks)
}

// ========== 媒体管理API ==========
// 注意：媒体管理API已移除，现在直接使用 sys_file_info 表管理文件
// 媒体文件通过文件上传API (FileApi.js) 进行管理
// 通过 business_type='HERITAGE_ITEM' 和 business_id=作品ID 进行关联

// ========== 常量定义 ==========

/**
 * 作品状态常量
 */
export const HERITAGE_ITEM_STATUS = {
  DRAFT: { code: 0, name: '草稿', color: '#909399' },
  PENDING: { code: 1, name: '待审', color: '#E6A23C' },
  PUBLISHED: { code: 2, name: '已发布', color: '#67C23A' },
  OFFLINE: { code: 3, name: '下架', color: '#F56C6C' }
}

/**
 * 媒体类型常量
 */
export const MEDIA_TYPES = {
  IMG: { code: 'IMG', name: '图片', accept: 'image/*' },
  VIDEO: { code: 'VIDEO', name: '视频', accept: 'video/*' },
  AUDIO: { code: 'AUDIO', name: '音频', accept: 'audio/*' },
  PDF: { code: 'PDF', name: 'PDF文档', accept: '.pdf' }
}

/**
 * 瑰宝类别常量（可根据实际需求调整）
 */

export const HERITAGE_CATEGORIES = [
  "青铜器",
  "金器",
  "玉器",
  "陶器",
  "石器",
  "古蜀文明",
  "其他"
];

