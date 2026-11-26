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

const vue = require('vue')
function settings(permissions = () => true) {
  const source = fs.readFileSync(__dirname + '/../src/pages/admin/agent-console/components/AgentMemorySettings.vue', 'utf8')
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1] + '\nexport const state = {scope,tab,scopeId,scopes,openedScopes,sharingOpened,editors,sharing,savePending,isDirty,busy,tabs}'
  const context = { exports: {}, defineProps: () => ({ agentId: 7 }), defineExpose() {}, require: name => {
    if (name === 'vue') return vue
    if (name === '@/utils/permission') return { hasPermission: permissions }
    if (name.endsWith('.vue')) return {}
    throw Error(name)
  } }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
  return context.exports.state
}

test('agent settings expose only agent-specific scopes, with the current agent fixed', async () => {
  const s = settings()
  assert.equal(s.scopeId.value, 7)
  assert.deepEqual(Array.from(s.scopes, item => item.value), ['AGENT_USER', 'AGENT'])
  s.scope.value = 'AGENT'; await vue.nextTick()
  assert.equal(s.scopeId.value, 7)
  assert.deepEqual([...s.openedScopes.value], ['AGENT_USER', 'AGENT'])
})

test('switching tabs keeps pending policies and saves all visited scopes before publishing', async () => {
  const calls = []
  const s = settings()
  const privateEditor = vue.reactive({ isDirty: true, busy: false, savePending: async () => { calls.push('private'); privateEditor.isDirty = false; return true } })
  s.editors.AGENT_USER = privateEditor
  s.scope.value = 'AGENT'; await vue.nextTick()
  const sharedEditor = vue.reactive({ isDirty: true, busy: false, savePending: async () => { calls.push('shared'); sharedEditor.isDirty = false; return true } })
  s.editors.AGENT = sharedEditor
  s.tab.value = 'profile'; await vue.nextTick()
  assert.equal(s.isDirty.value, true)
  assert.equal(await s.savePending(), true)
  assert.deepEqual(calls, ['private', 'shared'])
  assert.equal(s.isDirty.value, false)
})

test('invalid policy blocks publish and returns to the scope requiring correction', async () => {
  const s = settings()
  s.editors.AGENT_USER = { isDirty: true, busy: false, savePending: async () => false }
  s.scope.value = 'AGENT'; await vue.nextTick(); s.tab.value = 'sharing'; await vue.nextTick()
  assert.equal(await s.savePending(), false)
  assert.equal(s.scope.value, 'AGENT_USER'); assert.equal(s.tab.value, 'policy')
})

test('a loading policy blocks save; a revoked policy permission cannot expose its editor', async () => {
  const s = settings()
  s.editors.AGENT_USER = { isDirty: false, busy: true, savePending: async () => { throw Error('must not save while loading') } }
  assert.equal(s.busy.value, true); assert.equal(await s.savePending(), false)
  const restricted = settings(code => code === 'ai:memory:read:api')
  assert.equal(restricted.tab.value, 'profile')
  assert.deepEqual([...restricted.openedScopes.value], [])
  assert.deepEqual([...restricted.tabs.value], ['profile'])
})

test('pending sharing authorization is saved for the fixed agent and network failure blocks publish', async () => {
  const s = settings()
  let called = 0
  s.sharing.value = { isDirty: true, busy: false, savePending: async () => { called++; return true } }
  assert.equal(await s.savePending(), true); assert.equal(called, 1)
  s.editors.AGENT_USER = { isDirty: true, busy: false, savePending: async () => { throw Error('offline') } }
  await assert.rejects(s.savePending(), /offline/)
})

function policyEditor(respond) {
  const unmount = []
  const source = fs.readFileSync(__dirname + '/../src/pages/admin/agent-console/components/MemoryPolicyEditor.vue', 'utf8')
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1] + '\nexport const state={load,form,newName,add,isDirty,savePending,busy,error}'
  const context = { exports: {}, defineProps: () => ({ scope: 'AGENT_USER', agent: 7 }), defineExpose() {}, require: name => {
    if (name === 'vue') return { ...vue, onMounted() {}, onBeforeUnmount: fn => unmount.push(fn) }
    if (name === '@/utils/permission') return { hasPermission: () => true }
    if (name === 'element-plus') return { ElMessage: { success() {} } }
    if (name === '@/api/agentMemory') return { memoryApi: respond }
    throw Error(name)
  } }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
  return { s: context.exports.state, unmount: () => unmount.forEach(fn => fn()) }
}

test('policy draft validation, revision and dirty state stay consistent with the settings save flow', async () => {
  let saved
  const policy = { revision: 4, enabled: true, prompt: 'only stable facts', fields: { language: 'TEXT' }, reviewRequired: true }
  const { s } = policyEditor({ policy: async () => saved || policy, savePolicy: async (scope, agent, body) => { saved = { ...JSON.parse(JSON.stringify(body)), revision: 5 } } })
  await s.load(); assert.equal(s.isDirty.value, false)
  s.form.value.prompt = ''; assert.equal(await s.savePending(), false); assert.equal(saved, undefined)
  s.form.value.prompt = 'explicit user facts'; s.newName.value = 'occupation'
  assert.equal(await s.savePending(), false)
  s.add(); assert.equal(await s.savePending(), true)
  assert.equal(saved.fields.occupation, 'TEXT'); assert.equal(s.form.value.revision, 5); assert.equal(s.isDirty.value, false)
})

test('a late policy response cannot write into an unmounted agent editor', async () => {
  let finish
  const { s, unmount } = policyEditor({ policy: () => new Promise(resolve => finish = resolve) })
  const pending = s.load(); unmount(); finish({ revision: 1, fields: {}, prompt: '', enabled: false }); await pending
  assert.equal(s.form.value, undefined)
})

test('cross-user profile management uses separate endpoints, selected user, revision and encoded fields', () => {
  const { memory, calls } = api()
  memory.users({ pageNum: 2, pageSize: 20, keyword: 'test' })
  memory.userProfile('9007199254740993')
  memory.editUserProfile('7', 'field/a', 'Java', 4)
  memory.forgetUserProfile('8', 'language', 9)
  memory.userPending('7')
  memory.reviewUserProfile('7', 42, true)
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ['get', '/users', { pageNum: 2, pageSize: 20, keyword: 'test' }],
    ['get', '/users/9007199254740993/profile', null],
    ['put', '/users/7/fields/field%2Fa', { value: 'Java', revision: 4 }],
    ['delete', '/users/8/fields/language', { revision: 9 }],
    ['get', '/users/7/reviews', null],
    ['put', '/users/7/reviews/42', { approve: true }],
  ])
})

function generalPage(apiMock) {
  const unmount = []
  const source = fs.readFileSync(__dirname + '/../src/pages/admin/agent-console/AgentMemory.vue', 'utf8')
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1] + '\nexport const state={load,search,changePage,users,selected,page,total,keyword,loading,error}'
  const context = { exports: {}, require: name => {
    if (name === 'vue') return { ...vue, onMounted() {}, onBeforeUnmount: fn => unmount.push(fn) }
    if (name === '@/utils/permission') return { hasPermission: () => true }
    if (name === '@/api/agentMemory') return { memoryApi: apiMock }
    if (name.endsWith('.vue') || name.endsWith('.scss') || name === '@element-plus/icons-vue') return {}
    throw Error(name)
  } }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
  return { s: context.exports.state, unmount: () => unmount.forEach(fn => fn()) }
}

test('general profile user search ignores stale results and does not auto-open another user data', async () => {
  let finish, count = 0
  const { s } = generalPage({ users: () => ++count === 1 ? new Promise(resolve => finish = resolve) : Promise.resolve({ records: [{ userId: '8' }], total: 1 }) })
  const first = s.load(); await s.load(); finish({ records: [{ userId: '7' }], total: 1 }); await first
  assert.equal(s.users.value[0].userId, '8'); assert.equal(s.selected.value, undefined)
  s.selected.value = { userId: '8' }; s.changePage(2)
  assert.equal(s.selected.value, undefined)
})

function managedProfile(apiMock) {
  const source = fs.readFileSync(__dirname + '/../src/pages/admin/agent-console/components/MemoryProfile.vue', 'utf8')
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1] + '\nexport const state={load,profile,field,value,save,forget,review,can,candidates}'
  const context = { exports: {}, defineProps: () => ({ scope: 'USER', agent: 0, userId: '7' }), require: name => {
    if (name === 'vue') return { ...vue, onMounted() {}, onBeforeUnmount() {} }
    if (name === '@/utils/permission') return { hasPermission: code => code.startsWith('ai:memory:user-') }
    if (name === '@/api/agentMemory') return { memoryApi: apiMock }
    if (name === 'element-plus') return { ElMessage: { warning() {} }, ElMessageBox: { confirm: async () => {} } }
    throw Error(name)
  } }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
  return context.exports.state
}

test('managed profile never falls back to current-user APIs when editing another user', async () => {
  const calls = []
  const s = managedProfile({
    userProfile: async user => { calls.push(['read', user]); return { revision: 3, fields: { language: 'TEXT' }, values: {}, forgottenFields: [] } },
    userPending: async () => [],
    editUserProfile: async (...args) => calls.push(['edit', ...args]),
    forgetUserProfile: async (...args) => calls.push(['forget', ...args]),
    reviewUserProfile: async (...args) => { calls.push(['review', ...args]); return true },
  })
  await s.load(); s.field.value = 'language'; s.value.value = 'Java'; await s.save(); await s.forget('language'); await s.review(9, true)
  assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify(['edit', '7', 'language', 'Java', 3])))
  assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify(['forget', '7', 'language', 3])))
  assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify(['review', '7', 9, true])))
  assert.equal(s.can('edit'), true)
})
