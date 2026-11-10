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
  const request = Object.fromEntries(['get', 'post', 'put', 'delete'].map((method) => [method, async (url, body) => {
    calls.push({ method, url, body: body && clean(body) })
    return respond(method, url, body)
  }]))
  const source = fs.readFileSync(path.join(__dirname, '../src/api/agentConsole.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { exports: {}, require: (name) => {
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
