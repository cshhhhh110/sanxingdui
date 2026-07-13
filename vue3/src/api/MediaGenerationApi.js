import request from '@/utils/request'

export function createImageGeneration(data, config = {}) {
  return request.post('/media-generation/image', data, { showDefaultMsg: false, ...config })
}

export function createVideoGeneration(data, config = {}) {
  return request.post('/media-generation/video', data, { showDefaultMsg: false, ...config })
}

export function getGenerationTask(taskId, config = {}) {
  return request.get(`/media-generation/tasks/${taskId}`, null, {
    enableCache: false,
    showDefaultMsg: false,
    ...config
  })
}

export function getGenerationHistory(params = {}, config = {}) {
  return request.get('/media-generation/history', params, {
    enableCache: false,
    showDefaultMsg: false,
    ...config
  })
}

export function retryGenerationTask(taskId, config = {}) {
  return request.post(`/media-generation/tasks/${taskId}/retry`, null, { showDefaultMsg: false, ...config })
}

export function cancelGenerationTask(taskId, config = {}) {
  return request.post(`/media-generation/tasks/${taskId}/cancel`, null, { showDefaultMsg: false, ...config })
}

export function getGenerationTemplates(config = {}) {
  return request.get('/media-generation/templates', null, { showDefaultMsg: false, ...config })
}

export function setGenerationFavorite(taskId, favorite, config = {}) {
  return request.put(`/media-generation/tasks/${taskId}/favorite`, null, {
    params: { favorite }, showDefaultMsg: false, ...config
  })
}

export function enableGenerationShare(taskId, config = {}) {
  return request.post(`/media-generation/tasks/${taskId}/share`, null, { showDefaultMsg: false, ...config })
}

export function disableGenerationShare(taskId, config = {}) {
  return request.delete(`/media-generation/tasks/${taskId}/share`, { showDefaultMsg: false, ...config })
}

export function getSharedGeneration(shareToken, config = {}) {
  return request.get(`/media-generation/shared/${shareToken}`, null, {
    enableCache: false, showDefaultMsg: false, ...config
  })
}
