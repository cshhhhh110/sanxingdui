/**
 * 活动相关API接口
 * @author system
 */

import request from '@/utils/request'

// ========== 活动管理API ==========

/**
 * 创建活动
 * @param {object} params - 请求参数 { id: String, title: String, type: String, startTime: String, endTime: String, location: String, description: String, status: Number, coverFileId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function createActivity(params, callbacks) {
  return request.post('/activity/create', params, callbacks)
}

/**
 * 获取活动详情
 * @param {object} params - 请求参数 { activityId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getActivityDetail(params, callbacks) {
  return request.get(`/activity/${params.activityId}`, null, callbacks)
}

/**
 * 分页查询活动列表
 * @param {object} params - 请求参数 { current: Number, size: Number, title: String, type: String, status: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getActivityPage(params, callbacks) {
  return request.get('/activity/page', params, callbacks)
}

/**
 * 更新活动信息
 * @param {object} params - 请求参数 { activityId: String, title: String, type: String, startTime: String, endTime: String, location: String, description: String, status: Number, coverFileId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function updateActivity(params, callbacks) {
  const { activityId, ...updateData } = params
  return request.put(`/activity/${activityId}`, updateData, callbacks)
}

/**
 * 删除活动
 * @param {object} params - 请求参数 { activityId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function deleteActivity(params, callbacks) {
  return request.delete(`/activity/${params.activityId}`, callbacks)
}

/**
 * 获取最新活动列表
 * @param {object} params - 请求参数 { limit: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getLatestActivities(params, callbacks) {
  return request.get('/activity/latest', params, callbacks)
}

// ========== 活动报名API ==========

/**
 * 报名活动
 * @param {object} params - 请求参数 { activityId: Number, userId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function signupActivity(params, callbacks) {
  return request.post('/activity/signup', params, callbacks)
}

/**
 * 获取活动的报名列表
 * @param {object} params - 请求参数 { activityId: Number, current: Number, size: Number, status: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getActivitySignups(params, callbacks) {
  const { activityId, ...queryParams } = params
  return request.get(`/activity/${activityId}/signups`, queryParams, callbacks)
}

/**
 * 审核通过报名
 * @param {object} params - 请求参数 { signupId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function approveSignup(params, callbacks) {
  return request.put(`/activity/signup/${params.signupId}/approve`, {}, callbacks)
}

/**
 * 审核拒绝报名
 * @param {object} params - 请求参数 { signupId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function rejectSignup(params, callbacks) {
  return request.put(`/activity/signup/${params.signupId}/reject`, {}, callbacks)
}

/**
 * 活动签到
 * @param {object} params - 请求参数 { signupId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function checkInSignup(params, callbacks) {
  return request.put(`/activity/signup/${params.signupId}/checkin`, {}, callbacks)
}

/**
 * 获取报名详情
 * @param {object} params - 请求参数 { signupId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getSignupDetail(params, callbacks) {
  return request.get(`/activity/signup/${params.signupId}`, null, callbacks)
}


