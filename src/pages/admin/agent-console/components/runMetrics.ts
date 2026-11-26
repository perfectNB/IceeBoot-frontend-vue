import type { AgentProgress } from '@/api/agentConsole'
export function formatDuration(milliseconds: number) {
  return milliseconds < 1000 ? `${Math.round(milliseconds)}ms` : `${(milliseconds / 1000).toFixed(1)}秒`
}
export function cacheSummary(calls: { cachedTokens?: number | null; inputTokens?: number | null }[]) {
  const reported = calls.filter(call => call.cachedTokens != null)
  const hits = reported.reduce((total, call) => total + (call.cachedTokens ?? 0), 0)
  const input = reported.reduce((total, call) => total + (call.inputTokens ?? 0), 0)
  return {
    hits: reported.length ? hits : null,
    coverage: `${reported.length}/${calls.length}`,
    rate: reported.length === calls.length && input > 0 ? Math.round(hits / input * 100) : null,
  }
}

export function runMetrics(events: AgentProgress[]) {
  const unique = [...new Map(events.map(event => [`${event.runId}:${event.sequence}`, event])).values()]
  const models = unique.filter(event => event.type === 'MODEL_FINISHED')
  const root = unique.filter(event => !event.parentRunId)
  const environment = root.find(event => event.type === 'PHASE_FINISHED' && event.callId === 'ENVIRONMENT')
  const tools = unique.filter(event => event.type === 'PHASE_FINISHED' && event.callId.startsWith('tool:'))
  const preparationPhases = root.filter(event => event.type === 'PHASE_FINISHED'
    && !event.callId.startsWith('tool:') && event.callId !== 'ENVIRONMENT')
  const phaseTotals = new Map<string, { key: string; title: string; durationMs: number; status: string }>()
  for (const event of preparationPhases) {
    const previous = phaseTotals.get(event.callId)
    phaseTotals.set(event.callId, { key: event.callId, title: event.title,
      durationMs: (previous?.durationMs || 0) + (event.durationMs || 0),
      status: previous && previous.status !== 'SUCCEEDED' ? previous.status : event.status })
  }
  const start = root.find(event => event.type === 'RUN_STARTED')?.timestamp
  const end = [...root].reverse().find(event => ['RUN_FINISHED', 'AGENT_FINISHED', 'ERROR'].includes(event.type))?.timestamp
  const firstContent = root.find(event => event.type === 'MODEL_FIRST_TOKEN')?.timestamp
  return {
    environmentMs: environment?.durationMs,
    phases: [...phaseTotals.values()],
    totalMs: start != null && end != null ? Math.max(0, end - start) : undefined,
    firstResponseMs: start != null && firstContent != null ? Math.max(0, firstContent - start) : undefined,
    modelMs: models.reduce((total, event) => total + (event.durationMs || 0), 0),
    toolMs: tools.reduce((total, event) => total + (event.durationMs || 0), 0),
    modelCalls: models.length,
    cache: cacheSummary(models),
    toolCalls: tools.length,
    inputTokens: models.reduce((total, event) => total + (event.inputTokens || 0), 0),
    outputTokens: models.reduce((total, event) => total + (event.outputTokens || 0), 0),
    usageKnown: models.length > 0 && models.every(event => event.usageKnown === true),
    firstTokenMs: root.find(event => event.type === 'MODEL_FIRST_TOKEN')?.durationMs,
  }
}
