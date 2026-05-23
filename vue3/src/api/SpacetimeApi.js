import request from '@/utils/request'

export function searchSpacetimeArtifacts(params, callbacks) {
  return request.post('/spacetime/search', params, callbacks)
}

export function getSpacetimeArtifactDetail(params, callbacks) {
  return request.get(`/spacetime/artifacts/${params.entityId}`, null, callbacks)
}

export function getArtifactGraph(params, callbacks) {
  return request.get(`/graph/artifacts/${params.entityId}`, null, callbacks)
}

export function getArtifactGraphNeighbors(params, callbacks) {
  const query = new URLSearchParams({
    entityId: params.entityId,
    depth: String(params.depth || 1)
  })
  return request.get(`/graph/nodes/${encodeURIComponent(params.nodeId)}/neighbors?${query.toString()}`, null, callbacks)
}
