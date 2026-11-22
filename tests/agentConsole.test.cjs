const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const routes = { SKILL: 'skills', TOOL: 'tools', MCP: 'mcps', SANDBOX: 'sandbox-templates', KNOWLEDGE: 'knowledge' }
const clean = (value) => JSON.parse(JSON.stringify(value))
function apiWithMock(respond) {
  const calls = []
  const request = Object.fromEntries(['get', 'post', 'put', 'delete', 'download'].map((method) => [method, async (url, body, config) => {
    calls.push({ method, url, body: body && clean(body) })
    return respond(method, url, body, config)
  }]))
  const source = fs.readFileSync(path.join(__dirname, '../src/api/agentConsole.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { exports: {}, FormData, require: (name) => {
    assert.equal(name, '@/utils/request')
    return { request }
  } }
  vm.runInNewContext(compiled, context)
  return { api: context.exports.agentConsole, calls }
}
const resources = {
  SKILL: { content: 'analyze data', resources: { 'guide.txt': 'reference' }, toolIds: [8] },
  TOOL: { kind: 'HTTP', url: 'https://example.invalid', method: 'POST', headers: {}, inputSchema: { type: 'object' }, script: '', projectApi: false, permissionCode: '' },
  MCP: { url: 'https://example.invalid/mcp', headers: { Authorization: '********' }, allowedTools: ['search'] },
  SANDBOX: { templateId: 'python-template', timeoutSeconds: 600 },
  KNOWLEDGE: { kind: 'HTTP', url: 'https://example.invalid/retrieve', method: 'POST', headers: {}, inputSchema: { type: 'object' }, script: '', projectApi: false, permissionCode: '' },
}
const field = { SKILL: 'skill', TOOL: 'tool', MCP: 'mcp', SANDBOX: 'sandbox', KNOWLEDGE: 'tool' }
for (const [kind, route] of Object.entries(routes)) {
  test(`${kind} uses its typed list/create/update/delete endpoints`, async () => {
    const base = { id: 7, name: 'resource', code: 'resource', description: '', enabled: true }
    const flat = { ...base, ...resources[kind] }
    const { api, calls } = apiWithMock((method, url, body) => method === 'get' ? [flat] : body)
    const listed = await api.capabilities(kind)
    assert.equal(listed[0].kind, kind)
    assert.deepEqual(clean(listed[0][field[kind]]), resources[kind])
    await api.saveCapability(listed[0])
    assert.equal(calls.at(-1).method, 'put')
    assert.equal(calls.at(-1).url, `/api/v1/agent-console/${route}`)
    assert.deepEqual(calls.at(-1).body, flat)
    const creating = clean(listed[0])
    delete creating.id
    await api.saveCapability(creating)
    assert.equal(calls.at(-1).method, 'post')
    await api.deleteCapability(7, kind)
    assert.equal(calls.at(-1).method, 'delete')
    assert.equal(calls.at(-1).url, `/api/v1/agent-console/${route}/7`)
  })
}
test('agent bindings aggregate all five resource catalogs', async () => {
  const { api, calls } = apiWithMock((method, url) => {
    const kind = Object.keys(routes).find((key) => url.endsWith('/' + routes[key]))
    return [{ id: 1, name: kind, code: kind, description: '', enabled: true, ...resources[kind] }]
  })
  const result = await api.capabilities()
  assert.equal(result.length, 5)
  assert.deepEqual(clean(result.map((value) => value.kind)).sort(), Object.keys(routes).sort())
  assert.equal(calls.length, 5)
  assert.ok(calls.every((call) => !call.url.includes('/capabilities')))
})
test('model and agent edits use PUT while new records use POST', async () => {
  const { api, calls } = apiWithMock((method, url, body) => body)
  await api.saveModel({ id: 1, name: 'model' })
  assert.equal(calls.at(-1).method, 'put')
  await api.saveModel({ name: 'model' })
  assert.equal(calls.at(-1).method, 'post')
  await api.saveAgent({ id: 2, name: 'agent' })
  assert.equal(calls.at(-1).method, 'put')
  await api.saveAgent({ name: 'agent' })
  assert.equal(calls.at(-1).method, 'post')
})
test('legacy model records with null generation remain editable', async () => {
  const { api } = apiWithMock(() => [{ id: 1, generation: null }])
  const models = await api.models()
  assert.deepEqual(clean(models[0].generation), { extra: {} })
})

test('operations expose quota, cancellation and server-side secret rotation without accepting keys', async () => {
  const { api, calls } = apiWithMock(() => ({}))
  await api.quota()
  assert.equal(calls.at(-1).url, '/api/v1/agent-console/quota')
  assert.equal(calls.at(-1).method, 'get')
  await api.cancelRun('run/with space')
  assert.equal(calls.at(-1).url, '/api/v1/agent-console/runs/run%2Fwith%20space/cancel')
  assert.equal(calls.at(-1).method, 'post')
  await api.rotateSecrets()
  assert.equal(calls.at(-1).url, '/api/v1/agent-console/secrets/rotate')
  assert.equal(calls.at(-1).method, 'post')
  assert.equal(calls.at(-1).body, undefined)
})

test('conversation endpoints scope histories by agent/session and retain sessionId on invoke', async () => {
  const { api, calls } = apiWithMock(() => [])
  await api.sessions(7, 50)
  await api.createSession(7, 'hello')
  await api.messages(7, 'thread_1', 30)
  await api.invoke('chat', 'next question', 'thread_1')
  assert.deepEqual(clean(calls), [
    {method:'get',url:'/api/v1/agent-console/agents/7/sessions',body:{offset:50}},
    {method:'post',url:'/api/v1/agent-console/agents/7/sessions',body:{title:'hello'}},
    {method:'get',url:'/api/v1/agent-console/agents/7/sessions/thread_1/messages',body:{beforeId:30}},
    {method:'post',url:'/api/v1/agent-console/agents/by-code/chat/invoke',body:{input:'next question',sessionId:'thread_1'}},
  ])
})

test('skill import uses multipart upload and JSON preview/commit contracts', async () => {
  const requests = []
  const { api } = apiWithMock((method, url, body, config) => { requests.push({ method, url, body, config }); return [] })
  const file = new File(['zip'], 'skills.zip', { type: 'application/zip' })
  await api.previewSkillArchive(file)
  assert.equal(requests[0].body.get('file').name, 'skills.zip')
  assert.equal(requests[0].config.headers['Content-Type'], undefined)
  assert.equal(requests[0].config.skipErrorMessage, true)
  assert.equal(requests[0].url, '/api/v1/agent-console/skills/import/archive')
  await api.previewGithubSkills({ url: 'https://github.com/owner/repo', ref: 'v1', path: 'skills/pdf' })
  assert.equal(requests[1].url, '/api/v1/agent-console/skills/import/github')
  assert.deepEqual(clean(requests[1].body), { url: 'https://github.com/owner/repo', ref: 'v1', path: 'skills/pdf' })
  await api.importSkills([{ code: 'pdf', content: '# PDF', resources: {} }])
  assert.equal(requests[2].url, '/api/v1/agent-console/skills/import')
  assert.equal(requests[2].body.skills[0].code, 'pdf')
})

test('workbench APIs preserve method, session scope and encoded identifiers', async () => {
  const { api, calls } = apiWithMock(() => ({}))
  await api.preflight(7)
  assert.equal(calls.at(-1).method, 'post')
  assert.equal(calls.at(-1).url, '/api/v1/agent-console/agents/7/preflight')
  await api.releaseDiff(7, 'old', 'new')
  assert.equal(calls.at(-1).method, 'get')
  assert.deepEqual(calls.at(-1).body, { from: 'old', to: 'new' })
  await api.rollback(7, 'release/a')
  assert.equal(calls.at(-1).url, '/api/v1/agent-console/agents/7/releases/release%2Fa/rollback')
  await api.files(7, 'session/a', 'run')
  assert.equal(calls.at(-1).url, '/api/v1/agent-console/agents/7/sessions/session%2Fa/files')
  assert.deepEqual(calls.at(-1).body, { runId: 'run' })
  await api.downloadFile(7, 'session', 'file/a')
  assert.equal(calls.at(-1).method, 'download')
  assert.equal(calls.at(-1).url, '/api/v1/agent-console/agents/7/sessions/session/files/file%2Fa')
  await api.recover(7, 'session', 'failed/a')
  assert.equal(calls.at(-1).method, 'post')
  assert.equal(calls.at(-1).url, '/api/v1/agent-console/agents/7/sessions/session/runs/failed%2Fa/recovery')
})

test('schedule APIs preserve request methods, task identifiers and pagination contracts', async () => {
  const { api, calls } = apiWithMock(() => [])
  const value = { name: 'daily', agentCode: 'report', input: 'summarize', scheduleType: 'CRON', cronExpression: '0 0 9 ? * *', zoneId: 'Asia/Shanghai', enabled: true }
  await api.schedules()
  await api.createSchedule(value)
  await api.updateSchedule(12, value)
  await api.setScheduleEnabled(12, false)
  await api.scheduleExecutions(12, 50)
  await api.deleteSchedule(12)
  assert.deepEqual(clean(calls), [
    { method: 'get', url: '/api/v1/agent-console/schedules' },
    { method: 'post', url: '/api/v1/agent-console/schedules', body: value },
    { method: 'put', url: '/api/v1/agent-console/schedules', body: { ...value, id: 12 } },
    { method: 'put', url: '/api/v1/agent-console/schedules/12/enabled', body: { enabled: false } },
    { method: 'get', url: '/api/v1/agent-console/schedules/12/executions', body: { offset: 50 } },
    { method: 'delete', url: '/api/v1/agent-console/schedules/12' },
  ])
})
