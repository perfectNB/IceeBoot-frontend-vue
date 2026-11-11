<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Connection, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { agentConsole, providers, type ModelConfig, type Provider } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
import JsonField from './components/JsonField.vue'
import './console.scss'

const providerBaseUrls: Record<Provider, string> = {
  GPT: 'https://api.openai.com/v1',
  CLAUDE: 'https://api.anthropic.com',
  GEMINI: 'https://generativelanguage.googleapis.com',
  QWEN: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  DEEPSEEK: 'https://api.deepseek.com',
  GLM: 'https://open.bigmodel.cn/api/paas/v4',
  KIMI: 'https://api.moonshot.cn/v1',
  MINIMAX: 'https://api.minimax.cn/v1',
}
const rows = ref<ModelConfig[]>([]),
  loading = ref(false),
  saving = ref(false),
  visible = ref(false),
  testVisible = ref(false),
  testing = ref(false),
  jsonValid = ref(true),
  keyword = ref(''),
  providerFilter = ref('all'),
  advanced = ref<string[]>([])
const formRef = ref<FormInstance>(),
  input = ref(''),
  output = ref(''),
  selected = ref<ModelConfig>()
function empty(): ModelConfig {
  return {
    name: '',
    provider: 'GPT',
    protocol: 'OPENAI_CHAT',
    baseUrl: providerBaseUrls.GPT,
    apiKey: '',
    model: '',
    enabled: true,
    contextWindow: 128000,
    generation: { maxTokens: 8192, thinking: false, extra: {} },
  }
}
const form = ref<ModelConfig>(empty())
const filtered = computed(() => rows.value.filter((row) =>
  `${row.name} ${row.model} ${row.provider}`.toLowerCase().includes(keyword.value.toLowerCase()) &&
  (providerFilter.value === 'all' || row.provider === providerFilter.value)))
const enabledCount = computed(() => rows.value.filter((row) => row.enabled).length)
const providerCount = computed(() => new Set(rows.value.map((row) => row.provider)).size)
const protocolLabels: Record<string, string> = {
  OPENAI_CHAT: 'Chat Completions / 兼容接口', OPENAI_RESPONSES: 'OpenAI Responses', ANTHROPIC: 'Anthropic', GEMINI: 'Gemini',
}

async function load() {
  loading.value = true
  try {
    rows.value = await agentConsole.models()
  } finally {
    loading.value = false
  }
}
function edit(row?: ModelConfig) {
  form.value = row ? JSON.parse(JSON.stringify(row)) : empty()
  form.value.generation ||= { extra: {} }
  jsonValid.value = true
  advanced.value = []
  visible.value = true
}
function providerChanged(value: Provider) {
  form.value.baseUrl = providerBaseUrls[value]
  form.value.protocol =
    value === 'CLAUDE' ? 'ANTHROPIC' : value === 'GEMINI' ? 'GEMINI' : 'OPENAI_CHAT'
  formRef.value?.clearValidate('baseUrl')
}
async function save() {
  if (!jsonValid.value || !(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    await agentConsole.saveModel(form.value)
    visible.value = false
    ElMessage.success('模型连接已保存')
    await load()
  } finally {
    saving.value = false
  }
}
async function remove(row: ModelConfig) {
  await ElMessageBox.confirm(
    `删除模型连接“${row.name}”？已发布版本仍保留原配置。`,
    '删除模型连接',
    { type: 'warning' },
  )
  await agentConsole.deleteModel(row.id!)
  await load()
}
function test(row: ModelConfig) {
  selected.value = row
  input.value = ''
  output.value = ''
  testVisible.value = true
}
async function invoke() {
  if (!input.value.trim() || !selected.value) return
  testing.value = true
  output.value = ''
  try {
    output.value = await agentConsole.invokeModel(selected.value.id!, input.value)
  } finally {
    testing.value = false
  }
}
const rotating = ref(false)
async function rotateSecrets() {
  const confirmed = await ElMessageBox.confirm(
    '请先配置当前主密钥、独立的密钥标识和历史解密密钥，并备份数据库。本操作会重加密存量凭据及发布快照。',
    '轮换存储密文',
    { type: 'warning', confirmButtonText: '开始轮换' },
  ).then(() => true).catch(() => false)
  if (!confirmed) return
  rotating.value = true
  try {
    const result = await agentConsole.rotateSecrets()
    ElMessage.success(`已处理 ${result.updatedRows} 条记录，当前密钥标识：${result.activeKeyId}`)
    await load()
  } finally {
    rotating.value = false
  }
}
onMounted(load)
</script>
<template>
  <main class="agent-console model-workbench">
    <header class="console-heading">
      <div class="console-title-block"><span class="console-title-icon"><el-icon><Connection /></el-icon></span><div>
        <p class="console-eyebrow">统一模型接入</p><h1>模型连接 <span class="console-count">{{ rows.length }}</span></h1>
        <p class="subtitle">管理供应商、模型和自定义接入地址，供智能体与业务接口复用。</p>
      </div></div>
      <div class="console-actions">
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
        <el-button v-if="hasPermission('ai:model:write')" type="primary" :icon="Plus" @click="edit()">新建连接</el-button>
      </div>
    </header>
    <div class="console-stats">
      <div><span>已配置连接</span><strong>{{ rows.length }}</strong></div>
      <div><span>启用连接</span><strong>{{ enabledCount }}</strong></div>
      <div><span>接入供应商</span><strong>{{ providerCount }}</strong></div>
      <p>连接可重复使用；每个智能体都可以选择自己的运行模型。</p>
    </div>
    <section class="console-panel model-list-panel">
      <div class="console-toolbar">
        <el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索连接名称、模型或供应商" aria-label="搜索模型连接" class="model-search" />
        <el-select v-model="providerFilter" aria-label="按供应商筛选" class="provider-filter"><el-option label="全部供应商" value="all" /><el-option v-for="provider in providers" :key="provider" :label="provider" :value="provider" /></el-select>
        <span class="toolbar-caption">{{ filtered.length }} 个连接</span>
      </div>
      <el-table v-loading="loading" :data="filtered" class="console-resource-table">
        <template #empty>
          <el-empty :description="rows.length ? '没有匹配的模型连接' : '连接你的第一个模型'" :image-size="90">
            <p class="field-help">{{ rows.length ? '尝试其他关键词或供应商。' : '准备接入地址、实际模型名称和 API Key，即可开始配置。' }}</p>
            <el-button v-if="!rows.length && hasPermission('ai:model:write')" type="primary" :icon="Plus" @click="edit()">新建连接</el-button>
          </el-empty>
        </template>
        <el-table-column label="连接 / 模型" min-width="220"><template #default="{ row }"><div class="model-identity"><span class="provider-mark">{{ row.provider.slice(0, 2) }}</span><div><strong>{{ row.name }}</strong><span>{{ row.model }}</span></div></div></template></el-table-column>
        <el-table-column prop="provider" label="供应商" width="130" />
        <el-table-column label="接入地址" min-width="220" show-overflow-tooltip><template #default="{ row }"><span class="model-endpoint">{{ row.baseUrl }}</span></template></el-table-column>
        <el-table-column label="协议" min-width="150"><template #default="{ row }"><span class="protocol-caption">{{ protocolLabels[row.protocol] || row.protocol }}</span></template></el-table-column>
        <el-table-column label="状态" width="95"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'" effect="light">{{ row.enabled ? '已启用' : '已禁用' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="175" fixed="right"><template #default="{ row }">
          <el-button v-if="hasPermission('ai:model:invoke')" link type="primary" :disabled="!row.enabled" @click="test(row)">测试</el-button>
          <el-button v-if="hasPermission('ai:model:write')" link type="primary" @click="edit(row)">编辑</el-button>
          <el-button v-if="hasPermission('ai:model:write')" link type="danger" @click="remove(row)">删除</el-button>
        </template></el-table-column>
      </el-table>
      <div class="table-maintenance"><p>API Key 加密存储，列表不会展示真实密钥。</p><el-button v-if="hasPermission('ai:secret:rotate')" link :loading="rotating" @click="rotateSecrets">轮换存储密文</el-button></div>
    </section>
    <el-dialog v-model="visible" :title="form.id ? '编辑模型连接' : '新建模型连接'" width="min(820px,94vw)" class="agent-settings model-settings" :close-on-click-modal="false" destroy-on-close>
      <div class="settings-overview compact-overview"><div><span class="overview-kicker">模型接入配置</span><h2>{{ form.name || '连接你的模型' }}</h2><p>填好连接信息即可使用，模型参数可按需调整。</p></div><el-tag type="info">{{ form.provider }}</el-tag></div>
      <el-form ref="formRef" :model="form" label-position="top">
        <div class="form-section-label"><span>01</span><div><h3>连接信息</h3><p>为连接起一个容易辨认的名称，并选择实际使用的协议。</p></div></div>
        <div class="form-grid">
          <el-form-item label="连接名称" prop="name" :rules="[{ required: true, whitespace: true, message: '请填写连接名称', trigger: 'blur' }]"><el-input v-model="form.name" maxlength="120" placeholder="例如：开发环境 · 主模型" /></el-form-item>
          <el-form-item label="供应商" required><el-select v-model="form.provider" @change="providerChanged"><el-option v-for="provider in providers" :key="provider" :value="provider" :label="provider" /></el-select></el-form-item>
        </div>
        <el-form-item label="接口协议" required><el-select v-model="form.protocol">
          <el-option v-if="form.provider === 'CLAUDE'" label="Anthropic" value="ANTHROPIC" /><el-option v-else-if="form.provider === 'GEMINI'" label="Gemini" value="GEMINI" />
          <template v-else><el-option label="OpenAI Chat Completions / 兼容接口" value="OPENAI_CHAT" /><el-option v-if="form.provider === 'GPT'" label="OpenAI Responses" value="OPENAI_RESPONSES" /></template>
        </el-select><p class="field-help">按服务提供方的接口协议选择；兼容接口也可以填写自己的代理地址。</p></el-form-item>
        <el-form-item label="接入地址 · Base URL" prop="baseUrl" :rules="[{ required: true, message: '请填写接入地址', trigger: 'blur' }, { pattern: /^https?:\/\//, message: '请填写以 https:// 或 http:// 开头的地址', trigger: 'blur' }]"><el-input v-model="form.baseUrl" type="url" placeholder="选择供应商后自动填入，也可填写自定义地址" /><p class="field-help">选择供应商后自动填入官方地址，可修改为代理或其他地域地址；不要填写单次请求的完整接口地址。</p></el-form-item>
        <div class="form-section-label"><span>02</span><div><h3>模型与凭据</h3><p>使用接入服务提供的模型标识和 API Key。</p></div></div>
        <div class="form-grid">
          <el-form-item label="模型名称" prop="model" :rules="[{ required: true, whitespace: true, message: '请填写实际模型名称', trigger: 'blur' }]"><el-input v-model="form.model" placeholder="填写服务提供方的实际模型名称" /><p class="field-help">这是请求中的模型标识，不是上方的连接名称。</p></el-form-item>
          <el-form-item label="API Key" prop="apiKey" :rules="[{ required: true, message: '请填写 API Key', trigger: 'blur' }]"><el-input v-model="form.apiKey" type="password" show-password autocomplete="new-password" :placeholder="form.id ? '保留星号表示不修改' : '填写此连接使用的 API Key'" /><p class="field-help">{{ form.id ? '保留 ******** 表示继续使用原密钥；输入新值会替换。' : '保存后加密存储，后续编辑只显示脱敏占位符。' }}</p></el-form-item>
        </div>
        <div class="setting-switch-row"><div><strong>启用连接</strong><p>启用后，智能体可以选择此连接作为运行模型。</p></div><el-switch v-model="form.enabled" aria-label="启用模型连接" /></div>
        <el-collapse v-model="advanced" class="advanced-settings">
          <el-collapse-item title="默认模型参数 · 可选" name="generation">
            <p class="field-help advanced-intro">智能体默认继承这里的参数，也可以在智能体设置中单独覆盖。思考能力取决于实际模型，不保证返回思考过程。</p>
            <div class="form-grid">
              <el-form-item label="上下文窗口"><el-input-number v-model="form.contextWindow" :min="1024" :step="1024" /><p class="field-help">填写模型实际支持的上下文 Token 数。</p></el-form-item>
              <el-form-item label="最大输出 Token"><el-input-number v-model="form.generation.maxTokens" :min="1" :max="1048576" /></el-form-item>
              <el-form-item label="温度"><el-input-number :model-value="form.generation.temperature" :min="0" :max="2" :step="0.1" placeholder="模型默认值" @change="form.generation.temperature = $event" /></el-form-item>
              <el-form-item label="思考模式"><el-switch v-model="form.generation.thinking" aria-label="默认开启思考模式" /></el-form-item>
              <el-form-item label="思考强度"><el-select v-model="form.generation.reasoningEffort" clearable placeholder="模型默认值"><el-option v-for="effort in ['low', 'medium', 'high']" :key="effort" :label="effort" :value="effort" /></el-select></el-form-item>
              <el-form-item label="思考预算"><el-input-number :model-value="form.generation.thinkingBudget" :min="1024" :step="1024" placeholder="可选" @change="form.generation.thinkingBudget = $event" /></el-form-item>
            </div>
          </el-collapse-item>
          <el-collapse-item title="供应商扩展参数 · 高级" name="extra">
            <p class="field-help advanced-intro">仅在接入服务明确要求时填写，通常保留空对象即可。</p>
            <el-form-item label="扩展参数 JSON"><JsonField :model-value="form.generation.extra || {}" label="供应商扩展参数" :rows="5" @update:model-value="form.generation.extra = $event" @valid="jsonValid = $event" /></el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer><div class="settings-footer"><div class="footer-state"><strong>保存连接后可进行测试</strong><span>已有智能体需重新发布才会使用修改后的配置</span></div><span class="spacer" /><el-button @click="visible = false">取消</el-button><el-button type="primary" :loading="saving" :disabled="!jsonValid" @click="save">保存连接</el-button></div></template>
    </el-dialog>
    <el-dialog v-model="testVisible" :title="`测试连接 · ${selected?.name || ''}`" width="min(760px,94vw)" class="agent-settings" :close-on-click-modal="!testing">
      <div class="test-context"><el-tag type="info">{{ selected?.provider }}</el-tag><span>{{ selected?.model }}</span></div>
      <p class="field-help">这会发起一次真实模型调用。测试只使用当前连接，不装配智能体工具。</p>
      <el-form label-position="top"><el-form-item label="测试输入"><el-input v-model="input" type="textarea" :rows="4" :disabled="testing" placeholder="输入一段简单的问题，检查接入配置是否可用。" /></el-form-item></el-form>
      <el-button type="primary" :loading="testing" :disabled="!input.trim()" @click="invoke">{{ testing ? '模型响应中' : '发送测试请求' }}</el-button>
      <p v-if="testing" role="status" class="field-help">正在等待模型返回，请保持窗口开启。</p>
      <pre v-if="output" class="agent-output">{{ output }}</pre>
    </el-dialog>
  </main>
</template>
<style scoped>
.model-list-panel { padding: 0; overflow: hidden; }
.model-list-panel .console-toolbar { padding: 20px 22px; margin: 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.model-search { max-width: 360px; }
.provider-filter { width: 160px; }
.model-identity { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
.provider-mark { flex-shrink: 0; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 12px; font-weight: 700; letter-spacing: .5px; }
.model-identity div { display: flex; flex-direction: column; min-width: 0; gap: 3px; }
.model-identity strong { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); overflow-wrap: anywhere; }
.model-identity div > span, .protocol-caption { font-size: 12px; color: var(--el-text-color-regular); }
.model-endpoint { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; color: var(--el-text-color-regular); }
.table-maintenance { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 22px; background: var(--el-fill-color-lighter); }
.table-maintenance p { margin: 0; font-size: 12px; color: var(--el-text-color-regular); }
.test-context { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
@media (max-width: 640px) { .model-search { max-width: none; } .provider-filter { width: 100%; } .table-maintenance { flex-wrap: wrap; } }
</style>
