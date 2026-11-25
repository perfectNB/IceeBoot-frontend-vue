const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function api() {
  const calls = []
  const request = Object.fromEntries(['get', 'put', 'delete'].map(method =>
    [method, (path, body) => calls.push([method, path.replace('/api/v1/agent-console/memory', ''), body])]))
  const source = fs.readFileSync(__dirname + '/../src/api/agentMemory.ts', 'utf8')
  const ctx = { exports: {}, require: () => ({ request, isMockEnabled: () => false }) }
  vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), ctx)
  return { memory: ctx.exports.memoryApi, calls }
}

test('private and public memory changes use separate permissions and carry the displayed revision', () => {
  const { memory, calls } = api()
  memory.edit('AGENT_USER', 7, 'language', 'Java', 2)
  memory.forget('AGENT', 7, 'lesson', 3)
  memory.review('USER', 0, 42, false)
  memory.review('AGENT', 7, 42, true)
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ['put', '/profiles/AGENT_USER/7/fields/language', { value: 'Java', revision: 2 }],
    ['delete', '/shared/7/fields/lesson', { revision: 3 }],
    ['put', '/reviews/USER/0/42', { approve: false }],
    ['put', '/shared/7/reviews/42', { approve: true }],
  ])
})

test('revocation sends empty allowlists and the selected agent only', () => {
  const { memory, calls } = api()
  memory.share(5, { revision: 8, readFields: [], writeFields: [] })
  assert.deepEqual(calls, [['put', '/grants/5', { revision: 8, readFields: [], writeFields: [] }]])
})

test('the platform policy uses a separate endpoint from agent policy changes', () => {
  const { memory, calls } = api()
  const body = { enabled: true, revision: 0, fields: { city: 'TEXT' }, reviewRequired: true, prompt: '提取城市' }
  memory.savePolicy('USER', 5, body)
  memory.savePolicy('AGENT_USER', 5, body)
  assert.deepEqual(calls, [
    ['put', '/platform-policy', body],
    ['put', '/policies/AGENT_USER/5', body],
  ])
})
