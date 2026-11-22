const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
const clean = value => JSON.parse(JSON.stringify(value))
function panel(api = {}) {
  const unmount = []
  const source = fs.readFileSync(__dirname + '/../src/pages/admin/agent-console/components/AgentSchedules.vue', 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1] + `
  export const state = { load, edit, save, payload, history, showResult, draft, frequency, hourMinute, weekday, onceDate, formError, tasks, loading, editing, records, result, historyTask, historyLoading, historyError, toggle, remove, stop }`
  const context = { exports: {}, Intl, Date,
    defineModel: () => vue.ref(false),
    defineProps: () => ({ agents: [{ draft: { code: 'report', name: '报告助手' }, activeVersion: 1 }] }),
    require: name => {
      if (name === 'vue') return { ...vue, onBeforeUnmount: fn => unmount.push(fn) }
      if (name === '@element-plus/icons-vue') return {}
      if (name === 'element-plus') return { ElMessage: { success() {} }, ElMessageBox: { confirm: async () => {} } }
      if (name === '@/api/agentConsole') return { agentConsole: { schedules: async () => [], ...api } }
      if (name === '@/utils/permission') return { hasPermission: () => true }
      throw Error(name)
    },
  }
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(compiled, context)
  return { s: context.exports.state, unmount: () => unmount.forEach(fn => fn()) }
}

test('daily and weekly presets produce minute-level Quartz expressions and preserve selected timezone', () => {
  const { s } = panel()
  s.edit(); s.hourMinute.value = '14:35'; s.draft.value.zoneId = 'America/New_York'
  assert.equal(s.payload().cronExpression, '0 35 14 ? * *')
  assert.equal(s.payload().zoneId, 'America/New_York')
  s.frequency.value = 'weekly'; s.weekday.value = 'FRI'
  assert.equal(s.payload().cronExpression, '0 35 14 ? * FRI')
})

test('one-time payload saves absolute time and removes stale cron configuration', () => {
  const { s } = panel()
  s.edit(); s.frequency.value = 'once'; s.draft.value.cronExpression = '0 0 9 ? * *'
  s.onceDate.value = new Date('2026-12-10T08:00:00Z')
  const value = s.payload()
  assert.equal(value.scheduleType, 'ONCE')
  assert.equal(value.executeAt, Date.parse('2026-12-10T08:00:00Z'))
  assert.equal('cronExpression' in value, false)
})

test('invalid form does not submit and a failed save retains the entered task', async () => {
  let calls = 0
  const { s } = panel({ createSchedule: async () => { calls++; throw Error('offline') } })
  s.edit(); await s.save(); assert.equal(calls, 0); assert.ok(s.formError.value)
  s.draft.value.name = '日报'; s.draft.value.input = '整理日报'
  await assert.rejects(s.save())
  assert.equal(calls, 1); assert.equal(s.editing.value, true); assert.equal(s.draft.value.input, '整理日报')
})

test('editing sends only request fields and keeps published cron semantics', async () => {
  let submitted
  const { s } = panel({ updateSchedule: async (id, body) => { submitted = { id, body: clean(body) } } })
  const task = { id: 3, name: '日报', agentCode: 'report', input: '整理', scheduleType: 'CRON', cronExpression: '0 0 9 ? * MON-FRI', zoneId: 'UTC', enabled: true, running: false, nextFireAt: 123 }
  s.edit(task); await s.save()
  assert.equal(submitted.id, 3)
  assert.equal(submitted.body.cronExpression, task.cronExpression)
  assert.equal('running' in submitted.body, false); assert.equal('nextFireAt' in submitted.body, false)
  assert.equal('ownerId' in submitted.body, false)
})

test('late task and history responses cannot overwrite newer selections', async () => {
  let finishOld, finishTasks, loads = 0
  const { s } = panel({
    schedules: async () => ++loads === 1 ? new Promise(resolve => finishTasks = resolve) : [{ id: 2 }],
    scheduleExecutions: async id => id === 1 ? new Promise(resolve => finishOld = resolve) : [{ id: 'new' }],
  })
  const oldLoad = s.load(); await s.load(); finishTasks([{ id: 1 }]); await oldLoad
  assert.equal(s.tasks.value[0].id, 2)
  const oldHistory = s.history({ id: 1 }); await s.history({ id: 2 }); finishOld([{ id: 'old' }]); await oldHistory
  assert.equal(s.records.value[0].id, 'new')
})

test('unmounted panel ignores pending results', async () => {
  let finish
  const { s, unmount } = panel({ schedules: async () => new Promise(resolve => finish = resolve) })
  const pending = s.load(); unmount(); finish([{ id: 1 }]); await pending
  assert.equal(s.tasks.value.length, 0)
})


test('cancel targets the linked run and refreshes that schedule history', async () => {
  let cancelled, reloaded
  const { s } = panel({ cancelRun: async id => cancelled = id, scheduleExecutions: async id => { reloaded = id; return [] } })
  s.historyTask.value = { id: 12 }
  await s.stop({ id: 'occurrence', runId: 'root-run' })
  assert.equal(cancelled, 'root-run'); assert.equal(reloaded, 12)
})
