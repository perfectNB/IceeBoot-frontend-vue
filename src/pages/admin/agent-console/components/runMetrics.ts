import type { AgentProgress } from '@/api/agentConsole'
export function formatDuration(milliseconds: number) {
  return milliseconds < 1000 ? `${Math.round(milliseconds)}ms` : `${(milliseconds / 1000).toFixed(1)}秒`
}
export function runMetrics(events: AgentProgress[]) {
  const unique = [...new Map(events.map(event => [`${event.runId}:${event.sequence}`, event])).values()]
  const models = unique.filter(event => event.type === 'MODEL_FINISHED')
  const root = unique.filter(event => !event.parentRunId)
  const environment = root.find(event => event.type === 'PHASE_FINISHED' && event.callId === 'ENVIRONMENT')
  const tools = unique.filter(event => event.type === 'PHASE_FINISHED' && event.callId.startsWith('tool:'))
  return {
    environmentMs: environment?.durationMs,
    modelMs: models.reduce((total, event) => total + (event.durationMs || 0), 0),
    toolMs: tools.reduce((total, event) => total + (event.durationMs || 0), 0),
    modelCalls: models.length,
    toolCalls: tools.length,
    inputTokens: models.reduce((total, event) => total + (event.inputTokens || 0), 0),
    outputTokens: models.reduce((total, event) => total + (event.outputTokens || 0), 0),
    usageKnown: models.length > 0 && models.every(event => event.usageKnown === true),
    firstTokenMs: root.find(event => event.type === 'MODEL_FIRST_TOKEN')?.durationMs,
  }
}
