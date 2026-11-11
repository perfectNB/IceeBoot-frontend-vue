const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')

const clean = (value) => JSON.parse(JSON.stringify(value))
const deferred = () => {
  let resolve, reject
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}
const role = (id) => ({ id, name: `Role ${id}`, code: `role_${id}` })
const detail = (id) => ({
  ...role(id),
  permissionTree: [{ id, name: `Permission ${id}`, hasPermission: true }],
  menuTree: [{ id, title: `Menu ${id}`, hasPermission: true }],
})

function pageWithApi(overrides = {}) {
  const calls = []
  const mounted = []
  const messages = []
  const api = {
    getRoles: async () => ({ records: [], total: 0, pages: 0, current: 1, size: 20 }),
    getRoleById: async (id) => detail(id),
    getAllPermissions: async () => [],
    getAllMenus: async () => [],
    saveRolePermissions: async () => {},
    saveRoleMenus: async () => {},
    ...overrides,
  }
  const trackedApi = Object.fromEntries(Object.entries(api).map(([name, action]) => [name, (...args) => {
    calls.push({ name, args: clean(args) })
    return action(...args)
  }]))
  const file = fs.readFileSync(path.join(__dirname, '../src/pages/admin/system/RoleManagement.vue'), 'utf8')
  const source = file.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1] + `
export const __test = {
  handlePermissions, handleMenus, handleSavePermissions, handleSaveMenus,
  permissionTreeRef, menuTreeRef,
  get beforePermissionClose() { return typeof beforePermissionClose === 'undefined' ? undefined : beforePermissionClose },
  get beforeMenuClose() { return typeof beforeMenuClose === 'undefined' ? undefined : beforeMenuClose },
  get retryPermissionLoad() { return typeof retryPermissionLoad === 'undefined' ? undefined : retryPermissionLoad },
  get retryMenuLoad() { return typeof retryMenuLoad === 'undefined' ? undefined : retryMenuLoad },
  read: () => ({
    permissionVisible: permissionDialogVisible.value, menuVisible: menuDialogVisible.value,
    permissions: permissions.value, menus: menus.value,
    permissionLoading: typeof permissionLoading !== 'undefined' && permissionLoading.value,
    menuLoading: typeof menuLoading !== 'undefined' && menuLoading.value,
    permissionLoaded: typeof permissionLoaded !== 'undefined' && permissionLoaded.value,
    menuLoaded: typeof menuLoaded !== 'undefined' && menuLoaded.value,
    permissionLoadError: typeof permissionLoadError !== 'undefined' && permissionLoadError.value,
    menuLoadError: typeof menuLoadError !== 'undefined' && menuLoadError.value,
    permissionsSaving: typeof permissionsSaving !== 'undefined' && permissionsSaving.value,
    menusSaving: typeof menusSaving !== 'undefined' && menusSaving.value,
  }),
}`
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = {
    exports: {},
    console: { log() {}, error() {} },
    require(name) {
      if (name === 'vue') return { ...vue, onMounted: (fn) => mounted.push(fn), onBeforeUnmount() {} }
      if (name === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) }
      if (name === 'element-plus') return { ElMessage: Object.fromEntries(['success', 'error'].map((kind) => [kind, (text) => messages.push({ kind, text })])), ElMessageBox: {} }
      if (name === '@element-plus/icons-vue') return {}
      if (name.startsWith('@/api/')) return trackedApi
      if (name === '@/utils/permission') return { hasPermission: () => true }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  }
  vm.runInNewContext(compiled, context)
  return { page: context.exports.__test, calls, mounted, messages }
}

test('role page loads only the list before an authorization dialog is opened', async () => {
  const { mounted, calls } = pageWithApi()
  mounted.forEach((fn) => fn())
  await Promise.resolve()
  assert.deepEqual(calls.map((call) => call.name), ['getRoles'])
})

test('permission dialog opens immediately and requests only its own tree', async () => {
  const pending = deferred()
  const { page, calls } = pageWithApi({ getRoleById: () => pending.promise })
  const opening = page.handlePermissions(role(7))
  assert.equal(page.read().permissionVisible, true)
  assert.equal(page.read().permissionLoading, true)
  assert.equal(page.read().permissionLoaded, false)
  assert.deepEqual(calls[0], { name: 'getRoleById', args: [7, 'permissions'] })
  pending.resolve(detail(7))
  await opening
  assert.equal(page.read().permissionLoading, false)
  assert.equal(page.read().permissionLoaded, true)
})

test('a slower previous role response cannot replace the current permission tree', async () => {
  const first = deferred()
  const second = deferred()
  const { page } = pageWithApi({ getRoleById: (id) => id === 1 ? first.promise : second.promise })
  const oldOpening = page.handlePermissions(role(1))
  const newOpening = page.handlePermissions(role(2))
  second.resolve(detail(2))
  await newOpening
  first.resolve(detail(1))
  await oldOpening
  assert.equal(page.read().permissions[0].id, 2)
})

test('failed menu loading cannot submit stale selections and can be retried', async () => {
  let fail = false
  const { page, calls } = pageWithApi({ getRoleById: async (id) => { if (fail) throw new Error('unavailable'); return detail(id) } })
  await page.handleMenus(role(1))
  fail = true
  await page.handleMenus(role(2))
  page.menuTreeRef.value = { getCheckedKeys: () => [1], getHalfCheckedKeys: () => [] }
  await page.handleSaveMenus()
  assert.equal(calls.filter((call) => call.name === 'saveRoleMenus').length, 0)
  assert.equal(page.read().menuLoadError, true)
  assert.equal(page.read().menuLoaded, false)
  fail = false
  await page.retryMenuLoad()
  assert.equal(page.read().menus[0].id, 2)
  assert.equal(page.read().menuLoaded, true)
})

for (const kind of ['permissions', 'menus']) {
  test(`missing or malformed ${kind} tree blocks saving instead of clearing authorization`, async () => {
    for (const payload of [undefined, null, {}, { permissionTree: null, menuTree: null }, { permissionTree: 'invalid', menuTree: {} }]) {
      const { page, calls } = pageWithApi({ getRoleById: async () => payload })
      const permission = kind === 'permissions'
      await (permission ? page.handlePermissions : page.handleMenus)(role(7))
      const treeRef = permission ? page.permissionTreeRef : page.menuTreeRef
      treeRef.value = { getCheckedKeys: () => [], getHalfCheckedKeys: () => [] }
      await (permission ? page.handleSavePermissions : page.handleSaveMenus)()
      assert.equal(page.read()[permission ? 'permissionLoadError' : 'menuLoadError'], true)
      assert.equal(page.read()[permission ? 'permissionLoaded' : 'menuLoaded'], false)
      assert.equal(calls.filter((call) => call.name === 'saveRolePermissions' || call.name === 'saveRoleMenus').length, 0)
    }
  })
}

test('a valid empty tree can still be intentionally saved', async () => {
  const { page, calls } = pageWithApi({ getRoleById: async () => ({ permissionTree: [], menuTree: [] }) })
  await page.handlePermissions(role(7))
  page.permissionTreeRef.value = { getCheckedKeys: () => [], getHalfCheckedKeys: () => [] }
  await page.handleSavePermissions()
  await page.handleMenus(role(7))
  page.menuTreeRef.value = { getCheckedKeys: () => [], getHalfCheckedKeys: () => [] }
  await page.handleSaveMenus()
  assert.deepEqual(calls.filter((call) => call.name === 'saveRolePermissions' || call.name === 'saveRoleMenus'), [
    { name: 'saveRolePermissions', args: [7, []] },
    { name: 'saveRoleMenus', args: [7, []] },
  ])
})

test('permission save is single-flight, keeps half-checked parents and avoids a list reload', async () => {
  const pending = deferred()
  const { page, calls } = pageWithApi({ saveRolePermissions: () => pending.promise })
  await page.handlePermissions(role(7))
  page.permissionTreeRef.value = { getCheckedKeys: () => [6], getHalfCheckedKeys: () => [2] }
  const saving = page.handleSavePermissions()
  const repeated = page.handleSavePermissions()
  await page.handleMenus(role(8))
  assert.deepEqual(calls.filter((call) => call.name === 'getRoleById'), [{ name: 'getRoleById', args: [7, 'permissions'] }])
  assert.equal(page.read().permissionsSaving, true)
  assert.deepEqual(calls.filter((call) => call.name === 'saveRolePermissions'), [{ name: 'saveRolePermissions', args: [7, ['6', '2']] }])
  let closed = false
  page.beforePermissionClose?.(() => { closed = true })
  assert.equal(closed, false)
  pending.resolve()
  await Promise.all([saving, repeated])
  assert.equal(page.read().permissionVisible, false)
  assert.equal(page.read().permissionsSaving, false)
  assert.equal(calls.filter((call) => call.name === 'getRoles').length, 0)
  await page.handleSavePermissions()
  assert.equal(calls.filter((call) => call.name === 'saveRolePermissions').length, 1)
})

test('failed menu save keeps the dialog editable and allows a second save', async () => {
  let fail = true
  const { page, calls } = pageWithApi({ saveRoleMenus: async () => { if (fail) throw new Error('unavailable') } })
  await page.handleMenus(role(5))
  page.menuTreeRef.value = { getCheckedKeys: () => [5], getHalfCheckedKeys: () => [1] }
  await page.handleSaveMenus()
  assert.equal(page.read().menuVisible, true)
  assert.equal(page.read().menusSaving, false)
  fail = false
  await page.handleSaveMenus()
  assert.equal(page.read().menuVisible, false)
  assert.equal(calls.filter((call) => call.name === 'saveRoleMenus').length, 2)
  assert.deepEqual(calls.filter((call) => call.name === 'saveRoleMenus').map((call) => call.args), [[5, ['5', '1']], [5, ['5', '1']]])
  assert.equal(calls.filter((call) => call.name === 'getRoles').length, 0)
})

test('closing a pending permission dialog ignores the late response', async () => {
  const pending = deferred()
  const { page } = pageWithApi({ getRoleById: () => pending.promise })
  const opening = page.handlePermissions(role(3))
  assert.equal(typeof page.beforePermissionClose, 'function')
  page.beforePermissionClose(() => {})
  pending.resolve(detail(3))
  await opening
  assert.equal(page.read().permissions.length, 0)
  assert.equal(page.read().permissionLoading, false)
  assert.equal(page.read().permissionLoaded, false)
})

test('role detail API scopes the requested tree and keeps the unfiltered call compatible', async () => {
  const calls = []
  const source = fs.readFileSync(path.join(__dirname, '../src/api/role.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { exports: {}, require: (name) => {
    if (name === '@/utils/request') return { request: { get: async (...args) => { calls.push(clean(args)); return detail(7) } } }
    if (name === '@/config/mock') return { isMockEnabled: () => false }
    if (name === '@/mock/services/role') return { MockRoleService: {} }
    throw new Error(`Unexpected dependency: ${name}`)
  } }
  vm.runInNewContext(compiled, context)
  await context.exports.getRoleById(7, 'permissions')
  await context.exports.getRoleById(7, 'menus')
  await context.exports.getRoleById(7)
  assert.deepEqual(calls, [
    ['/api/v1/roles/7', { include: 'permissions' }],
    ['/api/v1/roles/7', { include: 'menus' }],
    ['/api/v1/roles/7', null],
  ])
})
