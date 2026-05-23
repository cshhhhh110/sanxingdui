import request from "@/utils/request";

/**
 * 分页查询商品列表
 * @param {object} params - 查询参数
 * @param {number} [params.page] - 页码
 * @param {number} [params.pageSize] - 每页大小
 * @param {string} [params.title] - 商品标题（模糊搜索）
 * @param {number} [params.categoryId] - 类目ID
 * @param {number} [params.status] - 状态 0下架 1上架
 * @param {number} [params.minPrice] - 最低价格
 * @param {number} [params.maxPrice] - 最高价格
 * @param {boolean} [params.hasStock] - 是否有库存
 * @param {string} [params.sortField] - 排序字段
 * @param {string} [params.sortOrder] - 排序方式
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function getProductPage(params, callbacks = {}) {
  return request.get('/shop/product/page', params, callbacks);
}

/**
 * 根据ID获取商品详情
 * @param {string} id - 商品ID
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function getProductById(id, callbacks = {}) {
  return request.get(`/shop/product/${id}`, null, callbacks);
}

/**
 * 创建商品
 * @param {object} params - 商品创建参数
 * @param {string} [params.id] - 商品ID（前端UUID预生成）
 * @param {string} params.title - 商品标题
 * @param {string} [params.subtitle] - 副标题
 * @param {number} params.categoryId - 类目ID
 * @param {number} params.price - 商品价格
 * @param {number} params.stock - 库存数量
 * @param {number} [params.coverFileId] - 封面文件ID
 * @param {string} [params.detail] - 商品详情
 * @param {number} [params.status] - 状态 0下架 1上架
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function createProduct(params, callbacks = {}) {
  return request.post('/shop/product', params, callbacks);
}

/**
 * 更新商品
 * @param {string} id - 商品ID
 * @param {object} params - 商品更新参数
 * @param {string} params.title - 商品标题
 * @param {string} [params.subtitle] - 副标题
 * @param {number} params.categoryId - 类目ID
 * @param {number} params.price - 商品价格
 * @param {number} params.stock - 库存数量
 * @param {number} [params.coverFileId] - 封面文件ID
 * @param {string} [params.detail] - 商品详情
 * @param {number} [params.status] - 状态 0下架 1上架
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function updateProduct(id, params, callbacks = {}) {
  return request.put(`/shop/product/${id}`, params, callbacks);
}

/**
 * 删除商品
 * @param {string} id - 商品ID
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function deleteProduct(id, callbacks = {}) {
  return request.delete(`/shop/product/${id}`, callbacks);
}

/**
 * 上架商品
 * @param {string} id - 商品ID
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function onShelfProduct(id, callbacks = {}) {
  return request.put(`/shop/product/${id}/on-shelf`, null, callbacks);
}

/**
 * 下架商品
 * @param {string} id - 商品ID
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function offShelfProduct(id, callbacks = {}) {
  return request.put(`/shop/product/${id}/off-shelf`, null, callbacks);
}

/**
 * 更新商品库存
 * @param {string} id - 商品ID
 * @param {number} quantity - 库存数量
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function updateProductStock(id, quantity, callbacks = {}) {
  return request.put(`/shop/product/${id}/stock?quantity=${quantity}`, null, callbacks);
}

/**
 * 获取商品推荐（基于协同过滤）
 * @param {string} id - 商品ID
 * @param {number} [limit=4] - 推荐数量
 * @param {object} callbacks - 回调函数对象
 * @returns {Promise}
 */
export function getProductRecommendations(id, limit = 4, callbacks = {}) {
  return request.get(`/shop/product/${id}/recommendations?limit=${limit}`, null, callbacks);
}

