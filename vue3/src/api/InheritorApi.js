import request from "@/utils/request";

/**
 * 创建传承人
 * @param {object} params - 创建参数 { id, name, title, region, bio, avatarFileId }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function createInheritor(params, callbacks = {}) {
  return request.post('/inheritor/create', params, callbacks);
}

/**
 * 获取传承人详情
 * @param {string} inheritorId - 传承人ID
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getInheritorById(inheritorId, callbacks = {}) {
  return request.get(`/inheritor/${inheritorId}`, null, callbacks);
}

/**
 * 分页查询传承人列表
 * @param {object} params - 查询参数 { current, size, name, title, region }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getInheritorPage(params, callbacks = {}) {
  return request.get('/inheritor/page', params, callbacks);
}

/**
 * 更新传承人
 * @param {string} inheritorId - 传承人ID
 * @param {object} params - 更新参数 { name, title, region, bio, avatarFileId }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function updateInheritor(inheritorId, params, callbacks = {}) {
  return request.put(`/inheritor/${inheritorId}`, params, callbacks);
}

/**
 * 删除传承人
 * @param {string} inheritorId - 传承人ID
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function deleteInheritor(inheritorId, callbacks = {}) {
  return request.delete(`/inheritor/${inheritorId}`, callbacks);
}

/**
 * 添加传承人与作品关联
 * @param {string} inheritorId - 传承人ID
 * @param {string} itemId - 作品ID
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function addItemRelation(inheritorId, itemId, callbacks = {}) {
  return request.post(`/inheritor/${inheritorId}/items/${itemId}`, null, callbacks);
}

/**
 * 移除传承人与作品关联
 * @param {string} inheritorId - 传承人ID
 * @param {string} itemId - 作品ID
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function removeItemRelation(inheritorId, itemId, callbacks = {}) {
  return request.delete(`/inheritor/${inheritorId}/items/${itemId}`, callbacks);
}

