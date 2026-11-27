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
  assert.equal(result.history[1].actor,'用户管理员')
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

test('approval catalog pages and intake changes preserve the version of pending cases', async () => {
  const { load, login } = demo()
  const api = load('@/api/approval').approvalApi
  const { blankDesign } = load('@/utils/approval')
  await login('admin')
  const d = blankDesign()
  d.code = 'supply'
  d.nodes[0].role = 'admin'
  await api.save(d,0)
  await api.save({...d, code:'another'},0)
  await api.publish(d.code,1)
  const id = await api.submit(d.code,1,{})
  const page = await api.page(false,2,1)
  assert.equal(page.total,2)
  assert.equal(page.records[0].code,d.code)
  assert.equal((await api.page(true,2,1)).current,1)
  await api.setStopped(d.code,2,true)
  assert.equal((await api.published()).length,0)
  assert.equal((await api.page(true,1,10)).records[0].stopped,true)
  d.nodes[0].name = '新版复核'
  d.nodes[0].role = 'test'
  await api.save(d,3)
  assert.equal((await api.page(false,2,1)).records[0].changed,true)
  await api.publish(d.code,4)
  await assert.rejects(api.submit(d.code,2,{}),/停用/)
  await api.review(id,'approve',{revision:1})
  assert.equal((await api.detail(id)).version,1)
  assert.equal((await api.detail(id)).design.nodes[0].role,'admin')
  await assert.rejects(api.setStopped(d.code,2,false),/刷新/)
  await api.setStopped(d.code,5,false)
  await assert.rejects(api.submit(d.code,1,{}),/版本/)
  const fresh = await api.submit(d.code,2,{})
  assert.equal((await api.detail(fresh)).tasks[0].role,'test')
  await login('user_admin')
  await assert.rejects(api.setStopped(d.code,6,true),/权限/)
})

test('definition catalog filters the displayed name and lifecycle state before pagination', async () => {
  const { load, login } = demo()
  const api = load('@/api/approval').approvalApi
  await login('admin')
  const design = load('@/utils/approval').blankDesign()
  design.nodes[0].role = 'admin'
  for (const code of ['draft_a', 'draft_b', 'active', 'stopped', 'other']) {
    const name = (code === 'other' ? '差旅' : 'AI研发') + code
    await api.save({ ...design, code, name }, 0)
    if (['active', 'stopped'].includes(code)) await api.publish(code, 1)
  }
  await api.save({ ...design, code: 'active', name: '待发布新名称' }, 2)
  await api.setStopped('stopped', 2, true)
  const search = (status, page = 1) => api.page(false, page, 1, ' ai研 ', status)
  const drafts = await search('draft', 2)
  assert.equal(drafts.total, 2)
  assert.equal(drafts.records[0].code, 'draft_b')
  const published = await search('published', 2)
  assert.equal(published.current, 1)
  assert.equal(published.records[0].code, 'active')
  assert.equal(published.records[0].changed, true)
  assert.equal((await search('all')).total, 4)
  assert.equal((await search('stopped')).records[0].code, 'stopped')
  assert.equal((await api.page(false, 1, 10, '待发布新名称', 'all')).total, 0)
  assert.equal((await api.page(true, 1, 10, '研发', 'all')).total, 2)
  assert.equal((await api.page(true, 1, 10, '研发')).total, 1)
})

test('published visibility applies before pagination, detail and submission, independently of reviewer roles',async () => {
  const {load,login} = demo()
  const api = load('@/api/approval').approvalApi
  const d = load('@/utils/approval').blankDesign()
  Object.assign(d,{code:'team_supply',name:'部门申领',launchRole:'test'})
  d.nodes[0].role='admin'
  await login('admin')
  await api.save(d,0)
  await api.publish(d.code,1)
  assert.equal((await api.page(true,1,10,'申领')).total,0)
  assert.equal((await api.published()).length,0)
  await assert.rejects(api.template(true,d.code))
  await assert.rejects(api.submit(d.code,1,{}))
  assert.equal((await api.template(false,d.code,true)).version,1)
  await login('user_admin')
  assert.equal((await api.page(true,1,10,'申领')).total,1)
  assert.equal((await api.page(true,1,10,'合同')).total,0)
  const id = await api.submit(d.code,1,{})
  const detail = await api.detail(id)
  assert.ok(detail.candidates.admin.includes('超级管理员'))
  await assert.rejects(api.review(id,'approve',{revision:1,taskId:detail.tasks[0].id}))
  await login('admin')
  await api.review(id,'approve',{revision:1})
  assert.equal((await api.detail(id)).history.at(-1).actor,'超级管理员')
})

test('a catalog opened during a server upgrade can page and open the selected legacy template', async () => {
  const templates = ['a','b'].map(code => ({design:{code,name:code},revision:2,version:1}))
  const {load} = demo({get:async () => templates})
  const api = load('@/api/approval').approvalApi
  assert.equal((await api.page(false,2,1)).records[0].code,'b')
  templates[0].stopped = true
  assert.equal((await api.page(false,2,1,'A','stopped')).records[0].stopped,true)
  assert.equal((await api.page(false,1,1,'a','published')).total,0)
  assert.equal((await api.template(true,'b')).design.code,'b')
  await assert.rejects(api.template(true,'missing'),/不存在/)
})

test('approval API uses the published version and sends the observed revision with review actions', async () => {
  const calls = []
  const { load } = demo(new Proxy({}, {get: (_,method) => async (url,data) => calls.push([method,url,data])}))
  const api = load('@/api/approval').approvalApi
  await api.page(false,2,20)
  await api.page(true,1,10)
  await api.page(false,1,10,'经费','stopped')
  await api.template(true,'travel')
  await api.setStopped('travel',4,true)
  await api.submit('travel',3,{price:'80'})
  await api.review('id/1','reject',{revision:2,taskId:'t1',reason:'需凭证'})
  await api.revise('id/1','resubmit',{revision:3,values:{price:'60'}})
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ['get','/api/v1/workflow/approvals/drafts',{page:2,size:20}],
    ['get','/api/v1/workflow/approvals/published',{page:1,size:10}],
    ['get','/api/v1/workflow/approvals/drafts',{page:1,size:10,keyword:'经费',status:'stopped'}],
    ['get','/api/v1/workflow/approvals/published',{code:'travel'}],
    ['put','/api/v1/workflow/approvals/drafts/travel/intake',{revision:4,stopped:true}],
    ['post','/api/v1/workflow/approvals/cases',{code:'travel',version:3,values:{price:'80'}}],
    ['post','/api/v1/workflow/approvals/cases/id%2F1/review/reject',{revision:2,taskId:'t1',reason:'需凭证'}],
    ['post','/api/v1/workflow/approvals/cases/id%2F1/owner/resubmit',{revision:3,values:{price:'60'}}],
  ])
})

test('research budget can be found and started by any published launch role', async () => {
  const { load, login } = demo()
  const api = load('@/api/approval').approvalApi
  const design = load('@/utils/approval').blankDesign()
  load('@/mock/data/role').mockRoles.push({ id: 99, code: 'ai_researcher', name: 'AI研究员', status: 'active' })
  const researcher = load('@/mock/data/user').mockUsers.find(user => user.username === 'user_admin')
  researcher.roles.push('ai_researcher')
  Object.assign(design, { code: 'research_budget', name: '研发经费审批', launchRole: 'ai_researcher' })
  design.nodes[0].role = 'admin'
  await login('admin')
  await api.save(design, 0)
  await api.publish(design.code, 1)
  assert.equal((await api.page(true, 1, 10, '研发')).total, 0)
  await assert.rejects(api.template(true, design.code))
  await assert.rejects(api.submit(design.code, 1, {}))
  await login('user_admin')
  assert.equal((await api.page(true, 1, 10, '研发')).total, 1)
  assert.ok(await api.submit(design.code, 1, {}))
  await login('admin')
  design.additionalLaunchRoles = ['admin']
  await api.save(design, 2)
  assert.equal((await api.page(true, 1, 10, '研发')).total, 0)
  await api.publish(design.code, 3)
  assert.equal((await api.page(true, 1, 10, '研发')).total, 1)
  assert.ok(await api.submit(design.code, 2, {}))
})

test('personal workflow menus can load while the database menu cache is upgraded', async () => {
  const { load } = demo({ get: async () => [
    { component: 'WorkflowInstances', path: '/admin/workflow/instance', permissions: 'workflow:instance' },
    { component: 'WorkflowTasks', path: '/admin/workflow/task', permissions: 'workflow:task' }
  ] })
  const menus = await load('@/api/menu').getUserMenus()
  assert.deepEqual(Array.from(menus, m => [m.title, m.name, m.component, m.path, ...m.permissions]), [
    ['我的申请', 'MyApplications', 'MyApplications', '/admin/workflow/instance', 'workflow:instance'],
    ['我的审批', 'MyApprovals', 'MyApprovals', '/admin/workflow/task', 'workflow:task']
  ])
})

test('approval case pages count, sort and clamp within each personal scope', async () => {
  const { load, login } = demo()
  const api = load('@/api/approval').approvalApi
  await login('admin')
  const design = load('@/utils/approval').blankDesign()
  Object.assign(design, { name: '分页审批', code: 'paged_cases' })
  design.nodes[0].role = 'admin'
  await api.save(design, 0)
  await api.publish(design.code, 1)
  await api.submit(design.code, 1, {})
  await api.submit(design.code, 1, {})
  await login('user_admin')
  await api.submit(design.code, 1, {})
  assert.equal((await api.casePage('mine', 1, 1)).total, 1)
  assert.equal((await api.casePage('inbox', 2, 1)).total, 0)
  await login('admin')
  const first = await api.casePage('inbox', 1, 2)
  const last = await api.casePage('inbox', 2, 2)
  assert.equal(first.total, 3)
  assert.equal(first.records.length, 2)
  assert.equal(last.records.length, 1)
  const id = last.records[0].id
  assert.ok(!first.records.some(item => item.id === id))
  await api.review(id, 'reject', { revision: 1, reason: '请补充' })
  const remaining = await api.casePage('inbox', 2, 2)
  assert.equal(remaining.current, 1)
  assert.equal(remaining.total, 2)
  assert.equal((await api.casePage('handled', 1, 1)).records[0].id, id)
  for (const user of ['admin', 'user_admin']) {
    await login(user)
    const mine = await api.list('mine')
    assert.equal((await api.casePage('rejected', 1, 10)).total, Number(mine.some(item => item.id === id)))
  }
  await assert.rejects(api.casePage('mine', 1, 101), /分页参数/)
})

test('approval case page requests support paginated and legacy list responses', async () => {
  const calls = []
  const page = { current: 2, size: 1, total: 2, pages: 2, records: [{ id: 'b' }], hasNext: false, hasPrevious: true }
  const responses = [page, [{ id: 'a', title: '采购' }, { id: 'b', title: '研发一期', status: 'APPROVED' }, { id: 'c', title: '研发二期', status: 'REJECTED' }]]
  const { load } = demo({ get: async (path, params) => {
    calls.push([path, { ...params }])
    return responses.shift()
  } })
  const api = load('@/api/approval').approvalApi
  assert.equal(await api.casePage('mine', 2, 1), page)
  const legacy = await api.casePage('mine', 9, 1, '研发', 'REJECTED')
  assert.equal(legacy.current, 1)
  assert.equal(legacy.records[0].id, 'c')
  assert.equal(legacy.total, 1)
  assert.deepEqual(calls, [
    ['/api/v1/workflow/approvals/cases', { scope: 'mine', page: 2, size: 1 }],
    ['/api/v1/workflow/approvals/cases', { scope: 'mine', page: 9, size: 1, keyword: '研发', status: 'REJECTED' }]
  ])
})

test('personal approval search filters the case title before paging each authorized scope', async () => {
  const { load, login } = demo()
  const api = load('@/api/approval').approvalApi
  await login('admin')
  for (const [code, name] of [['budget', 'AI研发_经费'], ['purchase', '采购审批']]) {
    const design = load('@/utils/approval').blankDesign()
    Object.assign(design, { code, name })
    design.nodes[0].role = 'admin'
    await api.save(design, 0)
    await api.publish(code, 1)
  }
  await api.submit('purchase', 1, {})
  await login('user_admin')
  const rejected = await api.submit('budget', 1, {})
  await api.submit('budget', 1, {})
  const mine = await api.casePage('mine', 2, 1, ' ai研发_ ')
  assert.equal(mine.total, 2)
  assert.equal(mine.records[0].title, 'AI研发_经费')
  assert.equal((await api.casePage('inbox', 1, 10, '研发')).total, 0)
  await login('admin')
  assert.equal((await api.casePage('mine', 1, 10, '研发')).total, 0)
  assert.equal((await api.casePage('inbox', 1, 10, '研发')).total, 2)
  await api.review(rejected, 'reject', { revision: 1, reason: '请补充' })
  assert.equal((await api.casePage('handled', 1, 10, '研发')).total, 1)
  assert.equal((await api.casePage('handled', 1, 10, '采购')).total, 0)
  await login('user_admin')
  assert.equal((await api.casePage('rejected', 1, 10, '经费')).total, 1)
  assert.equal((await api.casePage('rejected', 1, 10, '%')).total, 0)
  const filtered = await api.casePage('mine', 2, 1, '经费', 'REJECTED')
  assert.equal(filtered.total, 1)
  assert.equal(filtered.current, 1)
  assert.equal(filtered.records[0].id, rejected)
  assert.equal((await api.casePage('mine', 1, 10, '采购', 'REJECTED')).total, 0)
  assert.equal((await api.casePage('mine', 1, 10, '', 'PENDING')).total, 1)
  assert.equal((await api.casePage('rejected', 1, 10, '', 'PENDING')).total, 0)
  await api.revise(rejected, 'void', { revision: 2 })
  assert.equal((await api.casePage('mine', 1, 10, '经费', 'VOID')).total, 1)
  await login('admin')
  assert.equal((await api.casePage('mine', 1, 10, '', 'VOID')).total, 0)
})
