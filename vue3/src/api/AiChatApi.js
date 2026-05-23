import request from '@/utils/request';

/**
 * 创建AI聊天会话
 * @param {string} title - 会话标题
 * @param {Object} config - 请求配置
 * @returns {Promise}
 */
export function createSession(title = '新对话', config = {}) {
  return request.post('/ai-chat/session/start', null, {
    params: { title },
    ...config
  });
}

/**
 * 获取会话列表
 * @returns {Promise}
 */
export function getSessionList() {
  return request.get('/ai-chat/session/list');
}

/**
 * 获取会话消息历史
 * @param {string} sessionId - 会话ID
 * @param {Object} config - 请求配置
 * @returns {Promise}
 */
export function getSessionMessages(sessionId, config = {}) {
  return request.get(`/ai-chat/session/${sessionId}/messages`, null, config);
}

/**
 * 更新会话标题
 * @param {string} sessionId - 会话ID
 * @param {string} title - 新标题
 * @returns {Promise}
 */
export function updateSessionTitle(sessionId, title) {
  return request.put(`/ai-chat/session/${sessionId}/title`, null, {
    params: { title }
  });
}

/**
 * 删除会话
 * @param {string} sessionId - 会话ID
 * @returns {Promise}
 */
export function deleteSession(sessionId) {
  return request.delete(`/ai-chat/session/${sessionId}`);
}

/**
 * 非流式聊天
 * @param {string} sessionId - 会话ID
 * @param {string} userMessage - 用户消息
 * @param {Object} config - 请求配置
 * @returns {Promise}
 */
export function chat(sessionId, userMessage, config = {}) {
  return request.post('/ai-chat/chat', {
    sessionId,
    userMessage
  }, config);
}

/**
 * 构建SSE流式对话URL
 * @returns {string} SSE流式对话的完整URL
 */
export function getChatStreamUrl() {
  const baseURL = import.meta.env.VITE_APP_BASE_API || '/api';
  return `${baseURL}/ai-chat/stream`;
}

