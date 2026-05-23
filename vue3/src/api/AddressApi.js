import request from "@/utils/request";

/**
 * @description 创建收货地址
 * @param {object} params - 地址创建参数
 * @param {string} params.receiver - 收货人
 * @param {string} params.phone - 手机号
 * @param {string} params.province - 省
 * @param {string} params.city - 市
 * @param {string} params.district - 区/县
 * @param {string} params.detail - 详细地址
 * @param {boolean} [params.isDefault] - 是否设为默认地址
 * @param {object} [callbacks={}] - 回调函数
 * @returns {Promise}
 */
export function createAddress(params, callbacks = {}) {
  return request.post('/user/address', params, callbacks);
}

/**
 * @description 更新收货地址
 * @param {number} addressId - 地址ID
 * @param {object} params - 地址更新参数
 * @param {string} params.receiver - 收货人
 * @param {string} params.phone - 手机号
 * @param {string} params.province - 省
 * @param {string} params.city - 市
 * @param {string} params.district - 区/县
 * @param {string} params.detail - 详细地址
 * @param {boolean} [params.isDefault] - 是否设为默认地址
 * @param {object} [callbacks={}] - 回调函数
 * @returns {Promise}
 */
export function updateAddress(addressId, params, callbacks = {}) {
  return request.put(`/user/address/${addressId}`, params, callbacks);
}

/**
 * @description 删除收货地址
 * @param {number} addressId - 地址ID
 * @param {object} [callbacks={}] - 回调函数
 * @returns {Promise}
 */
export function deleteAddress(addressId, callbacks = {}) {
  return request.delete(`/user/address/${addressId}`, callbacks);
}

/**
 * @description 设置默认地址
 * @param {number} addressId - 地址ID
 * @param {object} [callbacks={}] - 回调函数
 * @returns {Promise}
 */
export function setDefaultAddress(addressId, callbacks = {}) {
  return request.put(`/user/address/${addressId}/default`, null, callbacks);
}

/**
 * @description 获取用户所有收货地址
 * @param {object} [callbacks={}] - 回调函数
 * @returns {Promise}
 */
export function getUserAddressList(callbacks = {}) {
  return request.get('/user/address/list', null, callbacks);
}

/**
 * @description 获取用户默认收货地址
 * @param {object} [callbacks={}] - 回调函数
 * @returns {Promise}
 */
export function getUserDefaultAddress(callbacks = {}) {
  return request.get('/user/address/default', null, callbacks);
}

/**
 * @description 获取收货地址详情
 * @param {number} addressId - 地址ID
 * @param {object} [callbacks={}] - 回调函数
 * @returns {Promise}
 */
export function getAddressDetail(addressId, callbacks = {}) {
  return request.get(`/user/address/${addressId}`, null, callbacks);
}

