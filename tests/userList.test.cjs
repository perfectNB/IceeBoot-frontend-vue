const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')

const clean = value => JSON.parse(JSON.stringify(value))
const roles = [
  { id: 42, name: '读取角色', code: 'reader', status: 'active' },
  { id: 43, name: '暂停角色', code: 'paused', status: 'inactive' },
]
const rows = [
  { id: 1, username: 'alice', status: 'active', roleList: roles },
  { id: 2, username: 'bob', status: 'active', roleList: [] },
]

function execute(source, dependencies) {
  const context = {
    exports: {},
    console: { log() {}, error() {} },
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name]
      throw new Error(`Unexpected dependency: ${name}`)
    },
  }
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(compiled, context)
  return context.exports
}

function setup(records = rows) {
  const calls = []
  const messages = []
  const result = { records, total: records.length, pages: 1, current: 1, size: 20 }
  const api = execute(fs.readFileSync(path.join(__dirname, '../src/api/user.ts'), 'utf8'), {
    '@/utils/request': { request: { get: async (url, params) => {
      calls.push({ method: 'GET', url, params: clean(params) })
      return result
    } } },
    '@/config/mock': { isMockEnabled: () => false },
    '@/mock/services/user': { MockUserService: {} },
  })
  const component = fs.readFileSync(path.join(__dirname, '../src/pages/admin/system/UserManagement.vue'), 'utf8')
  const script = component.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const page = execute(script + '\nexport const probe = { loadUsers, handleEdit, tableData, userForm, dialogVisible }', {
    vue: { ...vue, onMounted() {} },
    'vue-i18n': { useI18n: () => ({ t: key => key }) },
    'element-plus': { ElMessage: { error: message => messages.push(message) }, ElMessageBox: {} },
    '@element-plus/icons-vue': {},
    '@/api': api,
    '@/api/user': api,
    '@/api/role': { getAllRoles: async () => roles },
    '@/utils/permission.ts': { hasPermission: () => true },
  }).probe
  return { api, page, calls, result, messages }
}

test('user list keeps the GET route, pagination and role summaries without authorization trees', async () => {
  const { api, calls, result } = setup()
  assert.equal(await api.getUserList({ pageNum: 1, pageSize: 20 }), result)
  assert.deepEqual(calls, [{ method: 'GET', url: '/api/v1/users', params: { pageNum: 1, pageSize: 20 } }])
  assert.equal(Object.hasOwn(result.records[0], 'menus'), false)
  assert.equal(Object.hasOwn(result.records[0], 'permissions'), false)
})

test('user page displays and edits summarized roles without fetching each user authorization', async () => {
  const { page, calls, messages } = setup()
  await page.loadUsers()
  assert.deepEqual(clean(page.tableData.value), rows)
  await page.handleEdit(page.tableData.value[0])
  assert.deepEqual(clean(page.userForm.roles), ['reader', 'paused'])
  assert.equal(page.dialogVisible.value, true)
  assert.equal(calls.length, 1)
  assert.deepEqual(messages, [])
})

test('empty summarized user page does not start detail or permission requests', async () => {
  const { page, calls, messages } = setup([])
  await page.loadUsers()
  assert.deepEqual(clean(page.tableData.value), [])
  assert.equal(calls.length, 1)
  assert.deepEqual(messages, [])
})
