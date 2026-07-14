import request from '@/utils/request'

export function createVisualAidProposal(data, config = {}) {
  return request.post('/visual-aid/proposals', data, { showDefaultMsg: false, ...config })
}

export function getVisualAidProposal(proposalId, config = {}) {
  return request.get(`/visual-aid/proposals/${proposalId}`, null, { showDefaultMsg: false, ...config })
}

export function confirmVisualAidProposal(proposalId, clientRequestId, config = {}) {
  return request.post(`/visual-aid/proposals/${proposalId}/confirm`, { clientRequestId }, {
    showDefaultMsg: false,
    ...config
  })
}

export function dismissVisualAidProposal(proposalId, config = {}) {
  return request.delete(`/visual-aid/proposals/${proposalId}`, { showDefaultMsg: false, ...config })
}
