/**
 * 课程相关API接口
 * @author system
 */

import request from '@/utils/request'

// ========== 课程管理API ==========

/**
 * 创建课程
 * @param {object} params - 请求参数 { id: String, title: String, level: String, description: String, status: Number, coverFileId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function createCourse(params, callbacks) {
  return request.post('/course/create', params, callbacks)
}

/**
 * 获取课程详情
 * @param {object} params - 请求参数 { courseId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getCourseDetail(params, callbacks) {
  return request.get(`/course/${params.courseId}`, null, callbacks)
}

/**
 * 分页查询课程列表
 * @param {object} params - 请求参数 { current: Number, size: Number, title: String, level: String, status: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getCoursePage(params, callbacks) {
  return request.get('/course/page', params, callbacks)
}

/**
 * 更新课程信息
 * @param {object} params - 请求参数 { courseId: String, title: String, level: String, description: String, status: Number, coverFileId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function updateCourse(params, callbacks) {
  const { courseId, ...updateData } = params
  return request.put(`/course/${courseId}`, updateData, callbacks)
}

/**
 * 删除课程
 * @param {object} params - 请求参数 { courseId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function deleteCourse(params, callbacks) {
  return request.delete(`/course/${params.courseId}`, callbacks)
}

/**
 * 获取最新课程列表
 * @param {object} params - 请求参数 { limit: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getLatestCourses(params, callbacks) {
  return request.get('/course/latest', params, callbacks)
}

// ========== 课程章节API ==========

/**
 * 创建课程章节
 * @param {object} params - 请求参数 { courseId: String, title: String, content: String, videoFileId: Number, sort: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function createChapter(params, callbacks) {
  return request.post('/course/chapter/create', params, callbacks)
}

/**
 * 获取章节详情
 * @param {object} params - 请求参数 { chapterId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getChapterDetail(params, callbacks) {
  return request.get(`/course/chapter/${params.chapterId}`, null, callbacks)
}

/**
 * 获取课程的章节列表
 * @param {object} params - 请求参数 { courseId: String }
 * @param {object} callbacks - 回调函数 { onSuccess, onError }
 * @returns {Promise}
 */
export function getCourseChapters(params, callbacks) {
  return request.get(`/course/${params.courseId}/chapters`, null, callbacks)
}

/**
 * 更新章节信息
 * @param {object} params - 请求参数 { chapterId: Number, title: String, content: String, videoFileId: Number, sort: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg, errorMsg }
 * @returns {Promise}
 */
export function updateChapter(params, callbacks) {
  const { chapterId, ...updateData } = params
  return request.put(`/course/chapter/${chapterId}`, updateData, callbacks)
}

/**
 * 删除章节
 * @param {object} params - 请求参数 { chapterId: Number }
 * @param {object} callbacks - 回调函数 { onSuccess, onError, successMsg }
 * @returns {Promise}
 */
export function deleteChapter(params, callbacks) {
  return request.delete(`/course/chapter/${params.chapterId}`, callbacks)
}


