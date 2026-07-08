export const AgentRoute = Object.freeze({
  TOOL_CALL: 'TOOL_CALL',
  RAG: 'RAG',
  DIRECT_ANSWER: 'DIRECT_ANSWER',
  UNSUPPORTED: 'UNSUPPORTED'
})

export function normalizeAgentRoute(route) {
  return Object.values(AgentRoute).includes(route)
    ? route
    : AgentRoute.DIRECT_ANSWER
}
