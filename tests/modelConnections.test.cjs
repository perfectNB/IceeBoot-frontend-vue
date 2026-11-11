const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')

const defaults = [
  ['GPT', 'https://api.openai.com/v1', 'OPENAI_CHAT'],
  ['CLAUDE', 'https://api.anthropic.com', 'ANTHROPIC'],
  ['GEMINI', 'https://generativelanguage.googleapis.com', 'GEMINI'],
  ['QWEN', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 'OPENAI_CHAT'],
  ['DEEPSEEK', 'https://api.deepseek.com', 'OPENAI_CHAT'],
  ['GLM', 'https://open.bigmodel.cn/api/paas/v4', 'OPENAI_CHAT'],
  ['KIMI', 'https://api.moonshot.cn/v1', 'OPENAI_CHAT'],
  ['MINIMAX', 'https://api.minimax.cn/v1', 'OPENAI_CHAT'],
]
function page() {
  const saved = [], cleared = []
  const source = fs.readFileSync(__dirname + '/../src/pages/admin/agent-console/ModelConnections.vue', 'utf8')
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1] +
    '\nexport const state = { form, formRef, edit, providerChanged, save }'
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const context = { exports: {}, require(name) {
    if (name === 'vue') return { ...vue, onMounted: () => {} }
    if (name === 'element-plus') return { ElMessage: { success: () => {} } }
    if (name === '@/api/agentConsole') return { providers: defaults.map(([provider]) => provider), agentConsole: {
      models: async () => [], saveModel: async (model) => saved.push(JSON.parse(JSON.stringify(model))),
    } }
    if (name === '@/utils/permission') return { hasPermission: () => true }
    if (name === '@element-plus/icons-vue' || name.endsWith('.vue') || name.endsWith('.scss')) return {}
    throw Error(name)
  } }
  vm.runInNewContext(compiled, context)
  const state = context.exports.state
  state.formRef.value = { validate: async () => true, clearValidate: (prop) => cleared.push(prop) }
  return { ...state, saved, cleared }
}

test('new connections start with the default provider official address', () => {
  const s = page()
  s.edit()
  assert.equal(s.form.value.provider, 'GPT')
  assert.equal(s.form.value.baseUrl, defaults[0][1])
  s.form.value.baseUrl = 'https://proxy.example/v1'
  s.edit()
  assert.equal(s.form.value.baseUrl, defaults[0][1])
})

test('changing providers replaces the previous address and matches the protocol', () => {
  const s = page()
  s.form.value.model = 'my-model'
  s.form.value.apiKey = '********'
  for (const [provider, baseUrl, protocol] of defaults) {
    s.form.value.baseUrl = 'https://previous.example/v1'
    s.form.value.provider = provider
    s.providerChanged(provider)
    assert.equal(s.form.value.baseUrl, baseUrl, provider)
    assert.equal(s.form.value.protocol, protocol, provider)
    assert.equal(s.form.value.model, 'my-model')
    assert.equal(s.form.value.apiKey, '********')
  }
  assert.equal(s.cleared.length, defaults.length)
  assert.ok(s.cleared.every((prop) => prop === 'baseUrl'))
})

test('opening an existing connection keeps its saved custom address and protocol', () => {
  const s = page()
  const row = { ...JSON.parse(JSON.stringify(s.form.value)), id: 7,
    baseUrl: 'https://proxy.example/v1', protocol: 'OPENAI_RESPONSES' }
  s.edit(row)
  assert.equal(s.form.value.baseUrl, row.baseUrl)
  assert.equal(s.form.value.protocol, 'OPENAI_RESPONSES')
  s.form.value.provider = 'DEEPSEEK'
  s.providerChanged('DEEPSEEK')
  assert.equal(row.baseUrl, 'https://proxy.example/v1')
  assert.equal(row.provider, 'GPT')
})

test('official defaults remain editable and custom URLs are saved unchanged', async () => {
  const s = page()
  s.form.value.provider = 'DEEPSEEK'
  s.providerChanged('DEEPSEEK')
  s.form.value.baseUrl = 'https://proxy.example/custom/v1'
  await s.save()
  assert.equal(s.saved.length, 1)
  assert.equal(s.saved[0].baseUrl, 'https://proxy.example/custom/v1')
  assert.equal(s.saved[0].provider, 'DEEPSEEK')
})
