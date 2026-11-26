const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Run the public API facades with transport disabled, as on a standalone demo site.
function demo(transport) {
  let token = ''
  const cache = new Map()
  const root = path.resolve(__dirname, '../src')
  const fixtures = {
    '@/config/mock': { isMockEnabled: () => !transport, mockDelay: async () => {}, mockLog() {} },
    '@/stores/user': { useUserStore: () => ({ getToken: () => token }) },
    '@/utils/request': { normalizeApiResponse: value => value, request: transport || new Proxy({}, { get() { throw Error('Unexpected network request') } }) },
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
      exports, Blob, crypto: require('node:crypto').webcrypto, require: next => load(next, path.dirname(filename)), structuredClone, setTimeout, console,
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

test('mock usage uses the same local calendar day for totals and daily trends at a month boundary', async () => {
  const { load } = demo()
  const { mockUsageOverview } = load('@/mock/services/agentUsage')
  const previousTimezone = process.env.TZ
  try {
    process.env.TZ = 'Asia/Shanghai'
    const now = new Date('2026-10-31T16:05:00Z')
    for (const period of ['TODAY', 'MONTH']) {
      const overview = await mockUsageOverview(period, now)
      assert.equal(overview.updatedAt.slice(0, 10), '2026-11-01')
      assert.deepEqual(Array.from(overview.days, row => row.label), ['2026-11-01'])
    }
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ
    else process.env.TZ = previousTimezone
  }
})

test('checkout preserves orders, restricts detail to the buyer and retries paid benefits', async () => {
  const { load, login } = demo()
  await login('admin')
  const api = load('@/api/pay')
  const methods = await api.paymentChannels()
  assert.deepEqual(Array.from(methods), ['YUNGOUOS', 'WECHAT_NATIVE', 'ALIPAY'])
  for (const method of methods) assert.match(await api.createPaymentOrder(1, method), /^iceeboot-demo:/)
  const orders = (await api.getPayRecords({})).records
  const fresh = orders.find(row => row.outTradeNo.startsWith('DEMO-'))
  assert.equal(await api.retryPaymentBusiness(fresh.id), false)
  assert.equal(await api.retryPaymentBusiness(1), true)
  assert.equal((await api.getPayRecordDetail(1)).businessStatus, 'SUCCESS')
  await api.updatePaymentConfigStatus(1, 'inactive')
  await assert.rejects(api.createPaymentOrder(1, 'WECHAT_NATIVE'))
  await login('user')
  await assert.rejects(api.getPayRecordDetail(fresh.id))
  assert.equal((await api.getPayRecords({})).records.some(row => row.id === fresh.id), false)
  assert.equal(await api.retryPaymentBusiness(1), false)
})

test('workflow candidates claim and release tasks and terminated instances remain accessible', async () => {
  const { load, login } = demo()
  await login('user')
  const api = load('@/api/workflow')
  await assert.rejects(api.claimWorkflowTask('task-3'))
  await login('admin')
  assert.ok((await api.myWorkflowTasks()).some(task => task.id === 'task-3'))
  await api.claimWorkflowTask('task-3')
  await api.claimWorkflowTask('task-3', true)
  await assert.rejects(api.completeTask('task-3'))
  await api.claimWorkflowTask('task-3')
  await api.completeTask('task-3')
  assert.ok(!(await api.myWorkflowTasks()).some(task => task.id === 'task-3'))
  assert.match((await api.workflowInstanceDiagram('process-1')).content, /<svg/)
  await api.endWorkflowProcess('process-1')
  assert.equal((await api.getWorkflowProcess('process-1')).ended, true)
  await assert.rejects(api.endWorkflowProcess('process-1'))
  await assert.rejects(api.checkWorkflowProcessEnded('missing'))
})

test('live checkout and task actions use the corresponding server routes', async () => {
  const calls = []
  const transport = Object.fromEntries(['get', 'put', 'post'].map(method => [
    method, async (url, body) => { calls.push([method, url, body]) }
  ]))
  const { load } = demo(transport)
  const pay = load('@/api/pay')
  const workflow = load('@/api/workflow')
  await pay.paymentChannels()
  await pay.createPaymentOrder(12, 'ALIPAY')
  await pay.getPayRecordDetail(34)
  await pay.retryPaymentBusiness(34)
  await pay.updatePaymentConfigStatus(12, 'inactive')
  await workflow.myWorkflowTasks()
  await workflow.claimWorkflowTask('task 1')
  await workflow.claimWorkflowTask('task 1', true)
  await workflow.workflowInstanceDiagram('run 1')
  assert.deepEqual(calls.map(([method, url]) => method + ' ' + url), [
    'get /api/v1/pay/channels', 'post /api/v1/pay/orders/12?channel=ALIPAY',
    'get /api/v1/pay/records/34', 'put /api/v1/pay/records/34/retry-business',
    'put /api/v1/pay/configs/12/status?status=inactive', 'get /api/v1/workflow/tasks/my',
    'post /api/v1/workflow/task/task%201/claim', 'post /api/v1/workflow/task/task%201/unclaim',
    'get /api/v1/workflow/process/run%201/diagram'
  ])
})
