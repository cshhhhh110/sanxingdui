import request from '@/utils/request'

export function routeAgentRequest({ message, attachments = [], context = {} }) {
  return request.post('/agent/route', { message, attachments, context }, {
    showDefaultMsg: false,
    enableRetry: false
  })
}

export function getAgentTools() {
  return request.get('/agent/tools', null, {
    showDefaultMsg: false,
    enableRetry: false
  })
}

export function getAgentWeather(city) {
  return request.get('/agent/tools/weather', { city }, {
    showDefaultMsg: false,
    enableRetry: false
  })
}

export function getAgentCurrentDateTime() {
  return request.get('/agent/tools/datetime', null, {
    showDefaultMsg: false,
    enableRetry: false
  })
}

export function searchAgentKnowledge(query, limit = 3) {
  return request.get('/agent/knowledge/search', { query, limit }, {
    showDefaultMsg: false,
    enableRetry: false
  })
}

export function getAgentKnowledgeStatus() {
  return request.get('/agent/knowledge/status', null, {
    showDefaultMsg: false,
    enableRetry: false
  })
}

export function syncAgentKnowledge() {
  return request.post('/agent/knowledge/sync', null, {
    showDefaultMsg: false,
    enableRetry: false
  })
}

// 兼容尚未迁移的调用方，新代码应使用 routeAgentRequest。
export function classifyAgentIntent(userMessage) {
  return request.post('/agent/intent', { userMessage }, {
    showDefaultMsg: false,
    enableRetry: false
  })
}
