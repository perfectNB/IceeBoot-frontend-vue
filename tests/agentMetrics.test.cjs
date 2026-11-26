const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const source = fs.readFileSync(__dirname + '/../src/pages/admin/agent-console/components/runMetrics.ts', 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const context = { exports: {} }; vm.runInNewContext(js, context)
const { runMetrics, formatDuration } = context.exports
const event = (sequence, type, extra = {}) => ({ sequence, type, runId: 'root', callId: '', parentRunId: '', ...extra })
test('metrics add each model call once across parent and child without adding first-token duration', () => {
 const root = event(3, 'MODEL_FINISHED', { durationMs: 900, inputTokens: 100, outputTokens: 20, usageKnown: true })
 const child = event(6, 'MODEL_FINISHED', { runId: 'child', parentRunId: 'root', durationMs: 400, inputTokens: 40, outputTokens: 10, usageKnown: true })
 const result = runMetrics([event(1, 'PHASE_FINISHED', { callId: 'ENVIRONMENT', durationMs: 2300 }), event(2, 'MODEL_FIRST_TOKEN', { durationMs: 500 }), root, root, child])
 assert.equal(result.environmentMs, 2300)
 assert.equal(result.modelMs, 1300)
 assert.equal(result.modelCalls, 2)
 assert.equal(result.inputTokens, 140)
 assert.equal(result.outputTokens, 30)
 assert.equal(result.usageKnown, true)
 assert.equal(result.firstTokenMs, 500)
})
test('missing provider usage and old histories remain unknown instead of zero usage', () => {
 assert.equal(runMetrics([]).usageKnown, false)
 assert.equal(runMetrics([event(1, 'MODEL_FINISHED', { usageKnown: false })]).usageKnown, false)
 assert.equal(runMetrics([event(1, 'MODEL_FINISHED', { usageKnown: true }), event(2, 'MODEL_FINISHED', { usageKnown: false })]).usageKnown, false)
 assert.equal(formatDuration(2300), '2.3秒')
})

test('preparation distinguishes nested repeated restores from total and provider first token', () => {
 const result=runMetrics([
  event(1,'RUN_STARTED',{timestamp:1000}),
  event(2,'PHASE_FINISHED',{callId:'ENVIRONMENT',durationMs:20000}),
  event(3,'PHASE_FINISHED',{callId:'ASSEMBLY',title:'装配',durationMs:4000,status:'SUCCEEDED'}),
  event(4,'PHASE_FINISHED',{callId:'CONTEXT_RESTORE',title:'恢复',durationMs:2000,status:'SUCCEEDED'}),
  event(5,'PHASE_FINISHED',{callId:'CONTEXT_RESTORE',title:'恢复',durationMs:9000,status:'SUCCEEDED'}),
  event(6,'MODEL_FIRST_TOKEN',{timestamp:22500,durationMs:1500}),
  event(7,'RUN_FINISHED',{timestamp:25000}),
 ])
 assert.equal(result.environmentMs,20000)
 assert.equal(result.phases.find(row=>row.key==='CONTEXT_RESTORE').durationMs,11000)
 assert.equal(result.totalMs,24000)
 assert.equal(result.firstResponseMs,21500)
 assert.equal(result.firstTokenMs,1500)
})

test('缓存命中按模型请求去重，部分上报时保留已知值并隐藏比例', () => {
 const hit = event(1, 'MODEL_FINISHED', { inputTokens: 100, cachedTokens: 60 })
 const unknown = event(2, 'MODEL_FINISHED', { inputTokens: 200 })
 assert.equal(runMetrics([hit, hit]).cache.rate, 60)
 const cache = runMetrics([hit, unknown]).cache
 assert.equal(cache.hits, 60)
 assert.equal(cache.coverage, '1/2')
 assert.equal(cache.rate, null)
 assert.equal(runMetrics([unknown]).cache.hits, null)
})
