import request from "@/utils/request";

/**
 * 分页查询商品分类列表
 * @param {object} params - 查询参数
 * @param {number} params.current - 当前页码
 * @param {number} params.size - 每页大小
 * @param {string} [params.name] - 分类名称
 * @param {number} [params.status] - 状态
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function getCategoryPage(params, callbacks = {}) {
  return request.get('/shop/category/page', params, callbacks);
}

/**
 * 获取所有商品分类列表
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function getAllCategories(callbacks = {}) {
  return request.get('/shop/category/list', null, callbacks);
}

/**
 * 获取启用的商品分类列表
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function getEnabledCategories(callbacks = {}) {
  return request.get('/shop/category/list/enabled', null, callbacks);
}

/**
 * 根据ID获取分类详情
 * @param {number} id - 分类ID
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function getCategoryById(id, callbacks = {}) {
  return request.get(`/shop/category/${id}`, null, callbacks);
}

/**
 * 创建商品分类
 * @param {object} params - 分类创建参数
 * @param {string} params.name - 分类名称
 * @param {number} [params.status] - 状态 0禁用 1启用
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function createCategory(params, callbacks = {}) {
  return request.post('/shop/category', params, callbacks);
}

/**
 * 更新商品分类
 * @param {object} params - 分类更新参数
 * @param {number} params.id - 分类ID
 * @param {string} params.name - 分类名称
 * @param {number} [params.status] - 状态 0禁用 1启用
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function updateCategory(params, callbacks = {}) {
  return request.put('/shop/category', params, callbacks);
}

/**
 * 删除商品分类
 * @param {number} id - 分类ID
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function deleteCategory(id, callbacks = {}) {
  return request.delete(`/shop/category/${id}`, callbacks);
}

/**
 * 更新分类状态
 * @param {number} id - 分类ID
 * @param {number} status - 状态 0禁用 1启用
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function updateCategoryStatus(id, status, callbacks = {}) {
  return request.put(`/shop/category/${id}/status?status=${status}`, null, callbacks);
}

/**
 * 批量更新分类状态
 * @param {number[]} ids - 分类ID列表
 * @param {number} status - 状态 0禁用 1启用
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function batchUpdateCategoryStatus(ids, status, callbacks = {}) {
  const params = new URLSearchParams();
  ids.forEach(id => params.append('ids', id));
  params.append('status', status);
  
  return request.put(`/shop/category/batch/status?${params.toString()}`, null, callbacks);
}