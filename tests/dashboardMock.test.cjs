const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Run the public API facades with transport disabled, as on a standalone demo site.
function demo() {
  let token = ''
  const cache = new Map()
  const root = path.resolve(__dirname, '../src')
  const fixtures = {
    '@/config/mock': { isMockEnabled: () => true, mockDelay: async () => {}, mockLog() {} },
    '@/stores/user': { useUserStore: () => ({ getToken: () => token }) },
    '@/utils/request': { request: new Proxy({}, { get() { throw Error('Unexpected network request') } }) },
  }
  function load(id, base = root) {
    if (fixtures[id]) return fixtures[id]
    const filename = path.resolve(id.startsWith('@/') ? root : base, id.replace(/^@\//, '')) + '.ts'
    if (cache.has(filename)) return cache.get(filename)
    const exports = {}
    cache.set(filename, exports)
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    })
    vm.runInNewContext(compiled.outputText, {
      exports, Blob, require: next => load(next, path.dirname(filename)), structuredClone, setTimeout, console,
    })
    return exports
  }
  const auth = load('@/api/auth')
  async function login(username) {
    const response = await auth.login({ username, password: '111111' })
    token = response.accessToken
    return response
  }
  return { load, login, auth }
}

test('dashboard counts agree with user management and daily trend after a mutation', async () => {
  const { load } = demo()
  const dash = load('@/api/dashboard')
  const user = load('@/api/user')
  const initial = await dash.getDashboardStats()
  await user.createUser({ username: 'dashboard-test' })
  const updated = await dash.getDashboardStats()
  assert.equal(updated.totalUsers, initial.totalUsers + 1)
  assert.equal(updated.newUsers, initial.newUsers + 1)
  for (const [period, days] of [['week', 7], ['month', 30]]) {
    const rows = await dash.getVisitTrend(period)
    assert.equal(rows.length, days)
    assert.equal(rows.at(-1).logCount, updated.logCount)
    assert.equal(rows.at(-1).errorCount, updated.errorCount)
  }
  assert.equal((await dash.getUserDistribution()).reduce((sum, row) => sum + row.value, 0), updated.totalUsers)
})

test('demo menus, credentials, messages and private memory follow the signed-in account', async () => {
  const { load, login, auth } = demo()
  const { agentConsole: api } = load('@/api/agentConsole')
  const { memoryApi: memory } = load('@/api/agentMemory')
  const { getUserMenus } = load('@/api/menu')
  await login('admin')
  const session = await api.createSession(1)
  const events = []
  await api.invokeStream('ops-demo', 'hello', session.sessionId, e => events.push(e))
  assert.equal(events.at(-1).type, 'RUN_FINISHED')
  const [artifact] = await api.files(1, session.sessionId, events[0].runId)
  assert.equal(artifact.kind, 'ARTIFACT')
  assert.match(await (await api.downloadFile(1, session.sessionId, artifact.id)).text(), /hello/)
  assert.equal((await api.messages(1, session.sessionId)).length, 2)
  await memory.edit('AGENT_USER', 1, 'reply_style', 'concise', 0)
  await assert.rejects(memory.edit('AGENT_USER', 1, 'reply_style', 'stale', 0))
  const consoleMenu = (await getUserMenus()).find(row => row.name === 'AgentConsoleRoot')
  const profileMenu = consoleMenu.children.find(row => row.name === 'AgentMemory')
  assert.equal(profileMenu.title, '通用画像')
  assert.deepEqual(Array.from(profileMenu.permissions), ['ai:memory:user-list:api', 'ai:memory:platform-policy-read:api'])
  const admin = await auth.getUserInfo()
  assert.ok(profileMenu.permissions.every(code => admin.permissions.includes(code)))
  const ordinary = await login('user')
  assert.equal((await auth.refreshToken(ordinary.refreshToken)).user.username, 'user')
  assert.equal((await auth.getUserInfo()).username, 'user')
  assert.deepEqual(Array.from(await getUserMenus(), row => row.name), ['Dashboard'])
  assert.equal((await api.sessions(1)).length, 0)
  await assert.rejects(api.messages(1, session.sessionId))
  assert.equal((await memory.profile('AGENT_USER', 1)).values.reply_style, undefined)
})

test('demo publishes immutable versions, uploads files and supports reversible schedule edits', async () => {
  const { load, login } = demo()
  await login('admin')
  const { agentConsole: api } = load('@/api/agentConsole')
  const [agent] = await api.agents()
  const oldId = agent.activeReleaseId
  await api.saveAgent({ ...agent.draft, prompt: 'new instructions' })
  const release = await api.publish(1)
  const diff = await api.releaseDiff(1, oldId, release.id)
  assert.ok(diff.changes.some(row => row.path === 'prompt'))
  assert.equal((await api.rollback(1, oldId)).version, release.version + 1)
  const session = await api.createSession(1)
  const file = new File(['test'], 'input.txt')
  const info = await api.uploadFile(1, session.sessionId, file)
  assert.equal(await (await api.downloadFile(1, session.sessionId, info.id)).text(), 'test')
  await api.deleteFile(1, session.sessionId, info.id)
  await assert.rejects(api.downloadFile(1, session.sessionId, info.id))
  const task = await api.createSchedule({ name: 'demo', agentCode: 'ops-demo', input: 'report', scheduleType: 'ONCE', enabled: true, zoneId: 'UTC', executeAt: Date.now() })
  await api.setScheduleEnabled(task.id, false)
  assert.equal((await api.schedules()).find(row => row.id === task.id).enabled, false)
  await api.deleteSchedule(task.id)
  assert.equal((await api.schedules()).some(row => row.id === task.id), false)
})

test('role dialogs receive trees and reload the saved leaf selections', async () => {
  const { load } = demo()
  const roles = load('@/api/role')
  const permissions = load('@/api/permission')
  const original = await permissions.getPermissionById(1)
  assert.equal(original.code, 'dashboard:view')
  await roles.saveRolePermissions(3, ['1'])
  const detail = await roles.getRoleById(3, 'permissions')
  assert.equal(detail.permissionTree.find(row => String(row.id) === '1').hasPermission, true)
  await roles.saveRoleMenus(3, ['108'])
  const menus = (await roles.getRoleById(3, 'menus')).menuTree
  assert.equal(menus.find(row => row.name === 'AgentConsoleRoot').children.find(row => row.name === 'AgentMemory').hasPermission, true)
})
