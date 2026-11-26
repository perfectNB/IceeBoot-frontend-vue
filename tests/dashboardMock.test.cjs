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

test('demo user profiles keep owners isolated and reject unauthorized or stale changes', async () => {
  const { load, login } = demo()
  const { user } = await login('user')
  const target = String(user.id)
  const { memoryApi: memory } = load('@/api/agentMemory')
  await assert.rejects(memory.users({ pageNum: 1, pageSize: 20 }))
  await assert.rejects(memory.userProfile('1'))
  await login('admin')
  const page = await memory.users({ pageNum: 1, pageSize: 1, keyword: user.username })
  assert.ok(page.records.some(row => row.userId === target))
  assert.deepEqual(Object.keys(page.records[0]).sort(), ['nickname', 'status', 'userId', 'username'])
  await memory.editUserProfile(target, 'reply_style', '详细', 0)
  assert.equal((await memory.userProfile(target)).values.reply_style, '详细')
  assert.equal((await memory.profile('USER', 0)).values.reply_style, undefined)
  await assert.rejects(memory.editUserProfile(target, 'reply_style', 'stale', 0))
  await memory.forgetUserProfile(target, 'reply_style', 1)
  const [candidate] = await memory.userPending(target)
  assert.equal(await memory.reviewUserProfile(target, candidate.id, true), true)
  assert.equal((await memory.userProfile(target)).values.reply_style, undefined)
  assert.equal((await memory.userPending(target)).length, 0)
  await assert.rejects(memory.userProfile('missing'))
  await login('user')
  await assert.rejects(memory.editUserProfile(target, 'reply_style', 'denied', 3))
  await assert.rejects(memory.forgetUserProfile(target, 'reply_style', 3))
  await assert.rejects(memory.userPending(target))
  await assert.rejects(memory.reviewUserProfile(target, candidate.id, true))
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
  assert.equal((await api.getWorkflowRuns()).find(run => run.id === 'process-1').status, 'active')
  await api.endWorkflowProcess('process-1')
  assert.equal((await api.getWorkflowRuns()).find(run => run.id === 'process-1').status, 'completed')
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
  await workflow.getWorkflowRuns()
  assert.equal(calls.at(-1)[2].includeEnded, true)
  await workflow.myWorkflowTasks()
  await workflow.claimWorkflowTask('task 1')
  await workflow.claimWorkflowTask('task 1', true)
  await workflow.workflowInstanceDiagram('run 1')
  assert.deepEqual(calls.map(([method, url]) => method + ' ' + url), [
    'get /api/v1/pay/channels', 'post /api/v1/pay/orders/12?channel=ALIPAY',
    'get /api/v1/pay/records/34', 'put /api/v1/pay/records/34/retry-business',
    'put /api/v1/pay/configs/12/status?status=inactive', 'get /api/v1/workflow/process', 'get /api/v1/workflow/tasks/my',
    'post /api/v1/workflow/task/task%201/claim', 'post /api/v1/workflow/task/task%201/unclaim',
    'get /api/v1/workflow/process/run%201/diagram'
  ])
})

test('the starter approval survives a designer XML round trip with its assignee', async () => {
  const { default: BpmnModdle } = await import('bpmn-moddle')
  const activiti = require('../src/pages/admin/workflow/activitiAssignment.json')
  const model = new BpmnModdle({ activiti })
  const { approvalTemplate } = demo().load('@/pages/admin/workflow/approvalTemplate')
  const xml = approvalTemplate('7', ['Approval', 'Start', 'Review', 'End'])
  const { rootElement, warnings } = await model.fromXML(xml)
  assert.equal(warnings.length, 0)
  const serialized = await model.toXML(rootElement)
  assert.match(serialized.xml, /<bpmn:userTask /)
  const loaded = await model.fromXML(serialized.xml)
  assert.equal(loaded.elementsById.Review.get('activiti:assignee'), '7')
  assert.equal(loaded.elementsById.ToReview.targetRef, loaded.elementsById.Review)
  assert.equal(loaded.elementsById.ToEnd.targetRef, loaded.elementsById.End)
})

test('approval forms route by multiple fields, isolate role inboxes and retain both submission rounds', async () => {
  const { load, login } = demo()
  const api = load('@/api/approval').approvalApi
  const { blankDesign, newExit } = load('@/utils/approval')
  const d = blankDesign()
  d.code = 'expense'
  d.fields = ['state','sex','companyName'].map((key,i) => ({ key, label:key,
    kind:i < 2 ? 'routing' : 'business', type:i < 2 ? 'number' : 'text', required:true }))
  d.nodes = ['A','B','C'].map((id,i) => ({ id, name:'审批 '+id, role:i===0?'test':'admin', exit:newExit() }))
  d.start = { fallback:'', branches:[['1','2','A'],['2','1','B'],['1','1','C']].map(([state,sex,target]) =>
    ({ conditions:[{field:'state',value:state},{field:'sex',value:sex}], target })) }
  await login('admin')
  await api.save(d,0)
  await assert.rejects(api.save(d,0))
  await assert.rejects(api.submit(d.code,1,{}))
  await api.publish(d.code,1)
  const form = { state:'1.00', sex:'2',companyName:'一厂' }
  const id = await api.submit(d.code,1,form)
  assert.equal((await api.list('inbox')).length,0)
  await assert.rejects(api.review(id,'approve',{revision:1}))
  await login('user')
  await assert.rejects(api.detail(id))
  await login('user_admin')
  assert.equal((await api.list('inbox'))[0].node,'A')
  await assert.rejects(api.review(id,'reject',{revision:1,reason:' '}))
  await api.review(id,'reject',{revision:1,reason:'请改正公司名称'})
  await assert.rejects(api.revise(id,'void',{revision:2}))
  await login('admin')
  assert.equal((await api.list('rejected'))[0].id,id)
  await api.revise(id,'resubmit',{revision:2,values:{...form,state:'2',sex:'1',companyName:'二厂'}})
  assert.equal((await api.list('inbox'))[0].node,'B')
  await api.review(id,'approve',{revision:3,reason:'已核对'})
  const result = await api.detail(id)
  assert.equal(result.item.status,'APPROVED')
  assert.equal(result.history[0].values.companyName,'一厂')
  assert.equal(result.history[2].values.companyName,'二厂')
  assert.equal(result.history[1].actor,'user_admin')
  assert.ok(result.history[1].time)
  await assert.rejects(api.revise(id,'resubmit',{revision:4,values:form}))
  await assert.rejects(api.submit(d.code,1,{...form,state:'2',sex:'2'}))
  const third = await api.submit(d.code,1,{...form,sex:'1'})
  assert.equal((await api.detail(third)).item.node,'C')
})

test('parallel sign-off enforces amount boundaries and cancels stale tasks across rounds', async () => {
  const { load, login } = demo()
  const api = load('@/api/approval').approvalApi
  const { blankDesign, newExit, approvalPath } = load('@/utils/approval')
  const d = blankDesign()
  d.code = 'budget'
  d.fields = [{key:'price', label:'金额', type:'number', kind:'business', required:true}]
  d.nodes = [
    {id:'joint', name:'联合会签', role:'admin', coRoles:['test'], exit:newExit()},
    {id:'ordinary', name:'主管审批', role:'test', exit:newExit()}
  ]
  d.start = { branches:[{ conditions:[{ field:'price', operator:'ge', value:'5000' },
    {field:'price', operator:'lt', value:'9007199254740993.01'}], target:'joint'}], fallback:'ordinary' }
  for (const [price, node] of [['4999.99','ordinary'], ['5e3','joint'],
    ['9007199254740993.009','joint'], ['9007199254740993.01','ordinary']]) {
    assert.equal(approvalPath(d,{price})[0].id,node)
  }
  await login('admin')
  await api.save(d,0)
  await api.publish(d.code,1)
  const id = await api.submit(d.code,1,{price:'5000'})
  const old = (await api.detail(id)).tasks
  assert.equal(old.length,2)
  await api.review(id,'reject',{revision:1,taskId:old[0].id,reason:'重新核价'})
  await login('user_admin')
  assert.equal((await api.list('inbox')).length,0)
  await login('admin')
  await api.revise(id,'resubmit',{revision:2,values:{price:'5100'}})
  const tasks = (await api.detail(id)).tasks
  await api.review(id,'approve',{revision:3,taskId:tasks[0].id})
  assert.equal((await api.detail(id)).item.status,'PENDING')
  await login('user_admin')
  await assert.rejects(api.review(id,'approve',{revision:1,taskId:old[1].id}))
  await api.review(id,'approve',{revision:3,taskId:tasks[1].id})
  const result = await api.detail(id)
  assert.equal(result.item.status,'APPROVED')
  assert.equal(result.history[1].reason,'重新核价')
  assert.equal(result.history[2].round,2)
  assert.equal(result.history[4].role,'test')
})

test('approval API uses the published version and sends the observed revision with review actions', async () => {
  const calls = []
  const { load } = demo(new Proxy({}, {get: (_,method) => async (url,data) => calls.push([method,url,data])}))
  const api = load('@/api/approval').approvalApi
  await api.submit('travel',3,{price:'80'})
  await api.review('id/1','reject',{revision:2,taskId:'t1',reason:'需凭证'})
  await api.revise('id/1','resubmit',{revision:3,values:{price:'60'}})
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ['post','/api/v1/workflow/approvals/cases',{code:'travel',version:3,values:{price:'80'}}],
    ['post','/api/v1/workflow/approvals/cases/id%2F1/review/reject',{revision:2,taskId:'t1',reason:'需凭证'}],
    ['post','/api/v1/workflow/approvals/cases/id%2F1/owner/resubmit',{revision:3,values:{price:'60'}}],
  ])
})
