import request from '@/utils/request'

export function submitQuizRecord(params, callbacks) {
  return request.post('/quiz/submit', params, callbacks)
}

export function getQuizRanking(params, callbacks) {
  return request.get('/quiz/ranking', params, { enableCache: false, ...callbacks })
}

export function getQuizHistory(callbacks) {
  return request.get('/quiz/history', null, { enableCache: false, ...callbacks })
}
