<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormItemRule, type FormRules } from 'element-plus'
import { Collection, Connection, Document, Files, Plus, Refresh, Search, Tools } from '@element-plus/icons-vue'
import { agentConsole, type Capability, type CapabilityKind } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
import SkillImportDialog from './components/SkillImportDialog.vue'
import JsonField from './components/JsonField.vue'
import KeyValueField from './components/KeyValueField.vue'
import './console.scss'

const route = useRoute()
const catalog = {
  skills: { kind: 'SKILL', title: '技能', icon: Collection, example: 'report_analysis', nameExample: '报告分析助手', description: '把使用说明、脚本和参考资料整理成可复用的 Skill。', hint: '说明 Agent 什么时候使用这项技能，以及如何完成任务。' },
  tools: { kind: 'TOOL', title: '工具', icon: Tools, example: 'search_orders', nameExample: '查询订单', description: '将 HTTP 接口或 E2B 执行命令开放为 Agent 可调用的工具。', hint: '工具的用途和参数越清楚，Agent 越容易正确调用。' },
  mcps: { kind: 'MCP', title: 'MCP 服务', icon: Connection, example: 'project_docs', nameExample: '项目文档服务', description: '接入远程 MCP 服务，按工具名称明确开放范围。', hint: '准备好服务地址，以及允许调用的远端工具名称。' },
  sandboxes: { kind: 'SANDBOX', title: '沙箱模板', icon: Files, example: 'python_workspace', nameExample: 'Python 数据分析环境', description: '登记阿里云 E2B 模板，为不同 Agent 选择合适的执行环境。', hint: '填写已有的 E2B 模板，不需要在这里填写平台密钥。' },
  knowledge: { kind: 'KNOWLEDGE', title: '知识库连接', icon: Document, example: 'product_knowledge', nameExample: '产品文档检索', description: '把已有知识库的 HTTP 检索接口挂载给 Agent 使用。', hint: '这里连接检索服务；文档上传和索引由知识库服务管理。' },
} satisfies Record<string, { kind: CapabilityKind; title: string; icon: unknown; example: string; nameExample: string; description: string; hint: string }>
const page = computed(() => catalog[route.path.split('/').pop() as keyof typeof catalog] || catalog.skills)
const all = ref<Capability[]>([])
const loading = ref(false)
const visible = ref(false)
const importVisible = ref(false)
const saving = ref(false)
const keyword = ref('')
const advanced = ref<string[]>([])
const mcpNames = ref('')
const validFields = reactive({ json: true, resources: true, headers: true })
const validForm = computed(() => {
  if (form.value.kind === 'SKILL') return validFields.resources
  if (form.value.kind === 'MCP') return validFields.headers
  if (form.value.kind === 'TOOL' || form.value.kind === 'KNOWLEDGE')
    return validFields.json && (form.value.tool?.kind === 'SCRIPT' || validFields.headers)
  return true
})
const rows = computed(() => all.value.filter((c) => c.kind === page.value.kind))
const filteredRows = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return rows.value.filter((c) => !query || `${c.name} ${c.code} ${c.description}`.toLowerCase().includes(query))
})
const tools = computed(() => all.value.filter((c) => c.kind === 'TOOL' && c.enabled))
const formRef = ref<FormInstance>()
const schemaExample = computed(() => ({
  type: 'object',
  properties: {
    [form.value.kind === 'KNOWLEDGE' ? 'query' : 'text']: {
      type: 'string',
      description: form.value.kind === 'KNOWLEDGE' ? '需要检索的问题或关键词' : '需要处理的文本',
    },
  },
  required: [form.value.kind === 'KNOWLEDGE' ? 'query' : 'text'],
}))
const resourcePathPattern = /^(?!\/)(?!.*\\)(?!.*(?:^|\/)\.\.(?:\/|$))(?!SKILL\.md$).+$/
function empty(): Capability {
  return {
    kind: page.value.kind, code: '', name: '', description: '', enabled: true,
    skill: { content: '# 使用说明\n\n## 何时使用\n说明适合处理的问题。\n\n## 执行步骤\n1. 理解用户需求。\n2. 按需使用工具或配套资源。\n3. 整理并返回结果。', resources: {}, toolIds: [] },
    tool: { kind: 'HTTP', url: '', method: 'POST', headers: {}, inputSchema: { type: 'object', properties: {} }, script: '', projectApi: false, permissionCode: '' },
    mcp: { url: '', headers: {}, allowedTools: [] },
    sandbox: { templateId: '', timeoutSeconds: 600 },
  }
}
const form = ref<Capability>(empty())
function endpointRule(projectPath = false): FormItemRule {
  return {
    trigger: 'blur',
    validator: (_rule, value, done) => {
      if (typeof value !== 'string' || !value.trim()) return done(new Error('请填写接口地址'))
      if (projectPath) {
        if (!value.startsWith('/') || value.startsWith('//') || value.includes('..') || value.includes('\\'))
          return done(new Error('填写以 / 开头的项目相对路径，不能包含 .. 或反斜线'))
      } else {
        try {
          const url = new URL(value)
          if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.hash)
            return done(new Error('请填写有效的 HTTP / HTTPS 地址，不在地址中填写凭据或片段'))
        } catch { return done(new Error('请填写完整地址，例如 https://example.com/api/search')) }
      }
      done()
    },
  }
}
const rules = computed<FormRules>(() => ({
  name: [{ required: true, whitespace: true, message: '请填写便于辨认的名称', trigger: 'blur' }],
  code: [{ required: true, pattern: /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/, message: '以字母开头，最多 64 位字母、数字、下划线或连字符', trigger: 'blur' }],
  'skill.content': [{ required: true, whitespace: true, message: '请填写技能的使用说明', trigger: 'blur' }],
  'tool.url': [{ required: true, message: '请填写接口地址', trigger: 'blur' }, endpointRule(!!form.value.tool?.projectApi)],
  'tool.inputSchema': [{
    required: true, trigger: 'change',
    validator: (_rule, value: unknown, done) => {
      if (!value || typeof value !== 'object' || Array.isArray(value) || (value as Record<string, unknown>).type !== 'object')
        return done(new Error('参数定义的顶层 type 必须为 object'))
      done()
    },
  }],
  'tool.permissionCode': [{ required: true, whitespace: true, message: '请填写目标接口的权限码', trigger: 'blur' }],
  'tool.script': [{ required: true, whitespace: true, message: '请填写在 E2B 中执行的命令', trigger: 'blur' }],
  'mcp.url': [{ required: true, message: '请填写 MCP 服务地址', trigger: 'blur' }, endpointRule()],
  'mcp.allowedTools': [{
    required: true, trigger: 'change',
    validator: (_rule, value: unknown, done) => {
      if (!Array.isArray(value) || !value.length) return done(new Error('至少填写一个允许使用的工具名称'))
      if (value.some((name) => typeof name !== 'string' || name.includes('*'))) return done(new Error('请填写完整工具名称，不支持通配符 *'))
      done()
    },
  }],
  'sandbox.templateId': [{ required: true, whitespace: true, message: '请填写已有的 E2B 模板 ID 或名称', trigger: 'blur' }],
  'sandbox.timeoutSeconds': [{ required: true, type: 'number', min: 60, max: 3600, message: '请选择 60–3600 秒的存活时间', trigger: 'change' }],
}))
let loadVersion = 0
async function load() {
  const version = ++loadVersion
  const kind = page.value.kind
  loading.value = true
  try {
    const [current, skillTools] = await Promise.all([
      agentConsole.capabilities(kind),
      kind === 'SKILL' ? agentConsole.capabilities('TOOL') : Promise.resolve([]),
    ])
    if (version === loadVersion) all.value = [...current, ...skillTools]
  } finally {
    if (version === loadVersion) loading.value = false
  }
}
async function edit(capability?: Capability) {
  form.value = capability ? JSON.parse(JSON.stringify(capability)) : empty()
  Object.assign(validFields, { json: true, resources: true, headers: true })
  mcpNames.value = form.value.mcp?.allowedTools.join('\n') || ''
  advanced.value = []
  visible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}
function syncMcpNames(value: string) {
  if (form.value.mcp)
    form.value.mcp.allowedTools = [...new Set(value.split(/[\r\n,]+/).map((name) => name.trim()).filter(Boolean))]
  void formRef.value?.validateField('mcp.allowedTools').catch(() => undefined)
}
function removeMcpName(name: string) {
  if (!form.value.mcp) return
  form.value.mcp.allowedTools = form.value.mcp.allowedTools.filter((value) => value !== name)
  mcpNames.value = form.value.mcp.allowedTools.join('\n')
}
async function save() {
  if (!validForm.value || !(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    await agentConsole.saveCapability(form.value)
    visible.value = false
    ElMessage.success('能力配置已保存，重新发布挂载它的 Agent 后生效')
    await load()
  } finally { saving.value = false }
}
async function remove(capability: Capability) {
  const confirmed = await ElMessageBox.confirm(`删除“${capability.name}”？已发布 Agent 的快照仍保留原配置。`, '删除能力', { type: 'warning' }).then(() => true).catch(() => false)
  if (!confirmed) return
  await agentConsole.deleteCapability(capability.id!, capability.kind)
  await load()
}
watch(() => page.value.kind, () => {
  visible.value = false
  importVisible.value = false
  keyword.value = ''
  return load()
}, { immediate: true })
</script>
<template>
  <main class="agent-console capability-page admin-page">
    <AdminPageHeader :title="page.title" :description="page.description">
      <el-button v-if="page.kind === 'SKILL' && (hasPermission('ai:skill:import:archive:api') || hasPermission('ai:skill:import:github:api'))" @click="importVisible = true">导入技能</el-button><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button><el-button v-if="hasPermission('ai:capability:write')" type="primary" :icon="Plus" @click="edit()">新建{{ page.title }}</el-button>
    </AdminPageHeader>
    <section class="console-panel capability-panel" :aria-label="`${page.title}列表`">
      <div class="list-toolbar"><span class="list-count">全部{{ page.title }} <strong>{{ rows.length }}</strong></span><el-input v-model="keyword" :prefix-icon="Search" placeholder="搜索名称、编码或说明" clearable aria-label="搜索能力配置" /></div>
      <el-table v-loading="loading" :data="filteredRows">
        <el-table-column label="名称" min-width="190"><template #default="{ row }"><div class="resource-name"><strong>{{ row.name }}</strong><span>{{ row.code }}</span></div></template></el-table-column>
        <el-table-column prop="description" label="说明" min-width="270" show-overflow-tooltip />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">{{ row.enabled ? '已启用' : '已停用' }}</el-tag></template></el-table-column>
        <el-table-column v-if="hasPermission('ai:capability:write')" label="操作" width="136" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="edit(row)">编辑</el-button><el-button link type="danger" @click="remove(row)">删除</el-button></template></el-table-column>
        <template #empty><div class="resource-empty"><el-icon aria-hidden="true"><component :is="page.icon" /></el-icon><strong>{{ keyword ? '没有找到匹配的配置' : `还没有${page.title}` }}</strong><p>{{ keyword ? '试试其他名称或编码。' : page.hint }}</p><el-button v-if="!keyword && hasPermission('ai:capability:write')" :icon="Plus" plain @click="edit()">新建{{ page.title }}</el-button></div></template>
      </el-table>
    </section>

    <SkillImportDialog v-if="page.kind === 'SKILL' && importVisible" :existing-codes="rows.map(row => row.code)"
      @close="importVisible = false" @imported="load" />
    <el-dialog v-model="visible" :title="`${form.id ? '编辑' : '新建'}${page.title}`" width="min(920px,94vw)" class="agent-settings capability-settings" :close-on-click-modal="false" destroy-on-close>
      <template #header><div class="dialog-heading"><span class="dialog-symbol" aria-hidden="true"><el-icon><component :is="page.icon" /></el-icon></span><div><h2>{{ form.id ? '编辑' : '新建' }}{{ page.title }}</h2><p>{{ page.hint }}</p></div></div></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="capability-form" :disabled="saving" @submit.prevent="save">
        <section class="form-section">
          <header class="section-title"><span>01</span><div><h3>基础信息</h3><p>为这项能力设置清楚的名称和用途。</p></div></header>
          <div class="form-grid"><el-form-item label="名称" prop="name"><el-input v-model="form.name" maxlength="120" :placeholder="`例如：${page.nameExample}`" show-word-limit /></el-form-item><el-form-item label="唯一编码" prop="code"><el-input v-model="form.code" :disabled="!!form.id" :placeholder="`例如 ${page.example}`" spellcheck="false" /><p class="field-help">字母开头，创建后不可修改。</p></el-form-item></div>
          <el-form-item label="用途说明"><el-input v-model="form.description" type="textarea" :rows="2" maxlength="2000" show-word-limit :placeholder="form.kind === 'SANDBOX' ? '例如：预装 Python 和常用数据分析依赖，适合处理 CSV 报表。' : '描述适合解决什么问题、何时使用，以及需要注意的限制。'" /><p class="field-help">{{ form.kind === 'SANDBOX' ? '帮助你为智能体选择合适的运行环境。' : '这段说明帮助 Agent 判断何时调用这项能力。' }}</p></el-form-item>
          <div class="enable-row"><div><strong>启用{{ page.title }}</strong><p>新发布的 Agent 只能挂载已启用的能力。</p></div><el-switch v-model="form.enabled" :aria-label="`启用${page.title}`" /></div>
        </section>

        <template v-if="form.kind === 'SKILL' && form.skill">
          <section class="form-section"><header class="section-title"><span>02</span><div><h3>技能说明</h3><p>使用 Markdown 描述触发条件、执行步骤和预期结果。</p></div></header><el-form-item label="SKILL.md" prop="skill.content"><el-input v-model="form.skill.content" type="textarea" :rows="12" maxlength="100000" class="monospace-input" aria-label="Skill 使用说明" placeholder="# 技能名称&#10;&#10;## 何时使用&#10;说明适合处理的问题。&#10;&#10;## 执行步骤&#10;1. ..." /><p class="field-help">SKILL.md 是技能入口，配套资源可通过下方相对路径引用。</p></el-form-item></section>
          <section class="form-section"><header class="section-title"><span>03</span><div><h3>配套资源 <small>可选</small></h3><p>逐个添加脚本和参考文档，无需维护整块 JSON。</p></div></header><KeyValueField v-model="form.skill.resources" label="资源" multiline key-label="相对路径" value-label="文件内容" key-placeholder="scripts/analyze.py 或 references/guide.md" value-placeholder="填写脚本或参考文档的完整内容" empty-text="还没有配套资源；仅有使用说明的 Skill 也可以保存。" :key-pattern="resourcePathPattern" invalid-key-message="请使用相对路径，不含 .. 或反斜线；SKILL.md 在上方填写。" :max-entries="500" @valid="validFields.resources = $event" /><p class="section-note">最多 500 个配套资源，UTF-8 内容总量不超过 20MB。执行 Python、Shell 等脚本时，需要给使用本技能的 Agent 启用 E2B 沙箱。</p>
            <el-collapse v-model="advanced" class="advanced-options"><el-collapse-item name="tools" :title="`关联工具（可选，已选 ${form.skill.toolIds.length} 项）`"><el-form-item label="随技能一起挂载的工具"><el-select v-model="form.skill.toolIds" multiple filterable placeholder="选择技能需要调用的工具"><el-option v-for="tool in tools" :key="tool.id" :label="`${tool.name} · ${tool.code}`" :value="tool.id!" /></el-select><p class="field-help">只显示已启用的工具。关联关系会随 Agent 发布固定为快照。</p></el-form-item></el-collapse-item></el-collapse>
          </section>
        </template>

        <template v-if="(form.kind === 'TOOL' || form.kind === 'KNOWLEDGE') && form.tool">
          <section class="form-section"><header class="section-title"><span>02</span><div><h3>{{ form.kind === 'KNOWLEDGE' ? '检索接口' : '执行配置' }}</h3><p>{{ form.kind === 'KNOWLEDGE' ? '接入已有服务，Agent 会在需要资料时发起检索。' : '选择调用 HTTP 接口，或在 Agent 的 E2B 沙箱中运行命令。' }}</p></div></header>
            <el-form-item v-if="form.kind === 'TOOL'" label="执行方式"><el-radio-group v-model="form.tool.kind" class="execution-kind"><el-radio-button value="HTTP">HTTP 接口</el-radio-button><el-radio-button value="SCRIPT">E2B 脚本</el-radio-button></el-radio-group></el-form-item>
            <template v-if="form.tool.kind === 'HTTP'">
              <div class="identity-row"><div><strong>使用本项目登录身份</strong><p>打开后只请求本项目接口，并检查当前用户的目标接口权限。</p></div><el-switch v-model="form.tool.projectApi" aria-label="使用本项目登录身份" /></div>
              <div class="request-grid"><el-form-item label="请求方法"><el-select v-model="form.tool.method"><el-option v-for="method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']" :key="method" :label="method" :value="method" /></el-select></el-form-item><el-form-item :label="form.tool.projectApi ? '项目接口相对路径' : form.kind === 'KNOWLEDGE' ? '知识库检索地址' : 'HTTP 接口地址'" prop="tool.url"><el-input v-model="form.tool.url" :placeholder="form.tool.projectApi ? '/v1/example/search' : form.kind === 'KNOWLEDGE' ? 'https://knowledge.example.com/search' : 'https://api.example.com/orders/search'" spellcheck="false" /></el-form-item></div>
              <el-form-item v-if="form.tool.projectApi" label="目标接口权限码" prop="tool.permissionCode"><el-input v-model="form.tool.permissionCode" placeholder="例如 system:user:list:api" /><p class="field-help">填写目标接口实际使用的权限码。用户身份由后端传递，不需要模型填写 Token。</p></el-form-item>
              <p class="section-note">{{ form.tool.method === 'GET' ? '工具参数作为查询参数发送。' : '工具参数作为 JSON 请求体发送。' }}地址固定在配置中，由 Agent 生成符合参数定义的输入。</p>
              <el-collapse v-model="advanced" class="advanced-options"><el-collapse-item name="headers" :title="`认证与固定请求头（可选，${Object.keys(form.tool.headers).length} 项）`"><KeyValueField v-model="form.tool.headers" label="请求头" key-placeholder="Authorization 或 X-API-Key" value-placeholder="填写凭据；已有值保留占位符即可" empty-text="无需额外认证时，可不填写请求头。" secret @valid="validFields.headers = $event" /></el-collapse-item></el-collapse>
            </template>
            <template v-else><el-form-item label="沙箱执行命令" prop="tool.script"><el-input v-model="form.tool.script" type="textarea" :rows="5" maxlength="100000" class="monospace-input" placeholder="python3 scripts/analyze.py" aria-label="沙箱执行命令" /></el-form-item><p class="section-note">参数以 JSON 从标准输入传入。命令在使用此工具的 Agent 所配置的 E2B 中执行，请确保模板内具备所需依赖和脚本。</p></template>
          </section>
          <section class="form-section"><header class="section-title"><span>03</span><div><h3>输入参数</h3><p>描述 Agent 调用时需要填写的字段，不需要参数时保留默认对象。</p></div></header><el-form-item label="参数定义（JSON Schema）" prop="tool.inputSchema"><JsonField v-model="form.tool.inputSchema" label="工具输入参数定义" :rows="6" :example="schemaExample" hint="顶层 type 使用 object" @valid="validFields.json = $event" /></el-form-item></section>
        </template>

        <template v-if="form.kind === 'MCP' && form.mcp">
          <section class="form-section"><header class="section-title"><span>02</span><div><h3>连接服务</h3><p>当前使用 Streamable HTTP 连接远程 MCP 服务。</p></div></header><el-form-item label="Streamable HTTP 地址" prop="mcp.url"><el-input v-model="form.mcp.url" placeholder="https://mcp.example.com/mcp" spellcheck="false" /></el-form-item><el-collapse v-model="advanced" class="advanced-options"><el-collapse-item name="headers" :title="`认证请求头（可选，${Object.keys(form.mcp.headers).length} 项）`"><KeyValueField v-model="form.mcp.headers" label="请求头" key-placeholder="Authorization 或 X-API-Key" value-placeholder="填写服务要求的凭据" empty-text="服务无需认证时，可不填写。" secret @valid="validFields.headers = $event" /></el-collapse-item></el-collapse></section>
          <section class="form-section"><header class="section-title"><span>03</span><div><h3>工具白名单</h3><p>只开放明确列出的工具，不会自动开放服务内的全部工具。</p></div></header><el-form-item label="允许使用的远端工具名称" prop="mcp.allowedTools"><el-input v-model="mcpNames" type="textarea" :rows="4" placeholder="search_documents&#10;read_document" aria-label="MCP 工具白名单，每行一个工具名" spellcheck="false" @update:model-value="syncMcpNames" /><p class="field-help">每行一个名称，也支持逗号分隔。填写服务真实的工具名，不支持 *。</p></el-form-item><div v-if="form.mcp.allowedTools.length" class="tool-tags"><el-tag v-for="name in form.mcp.allowedTools" :key="name" :closable="!saving" effect="plain" @close="removeMcpName(name)">{{ name }}</el-tag></div><p class="section-note">注册后，工具名称会带上当前 MCP 服务编码的前缀，以区分不同服务。</p></section>
        </template>

        <section v-if="form.kind === 'SANDBOX' && form.sandbox" class="form-section"><header class="section-title"><span>02</span><div><h3>E2B 模板</h3><p>登记已有模板，随后在 Agent 的沙箱设置中选择使用。</p></div></header><el-form-item label="阿里云 E2B 模板 ID / 名称" prop="sandbox.templateId"><el-input v-model="form.sandbox.templateId" placeholder="填写已发布的 E2B 模板 ID 或名称" spellcheck="false" /><p class="field-help">模板决定预装的软件、运行时和系统依赖。这里的唯一编码仅用于管理，不是 E2B 模板 ID。</p></el-form-item><el-form-item label="沙箱存活时间" prop="sandbox.timeoutSeconds"><div class="timeout-control"><el-input-number v-model="form.sandbox.timeoutSeconds" :min="60" :max="3600" :step="60" controls-position="right" /><span>秒 <span class="timeout-note">默认 600 秒（10 分钟）</span></span></div><p class="field-help">可配置 60–3600 秒。为任务预留足够的执行时间。</p></el-form-item><div class="template-note"><el-icon aria-hidden="true"><Files /></el-icon><div><strong>平台连接由服务端统一配置</strong><p>E2B 的 API 地址、Domain 和 Key 不在这里填写。不同 Agent 可以选择不同模板，并配置各自的环境变量。</p></div></div></section>
      </el-form>
      <template #footer><div class="capability-footer"><span class="save-note">保存配置后，重新发布挂载它的 Agent 生效。</span><div><el-button :disabled="saving" @click="visible = false">取消</el-button><el-button type="primary" :loading="saving" :disabled="!validForm" @click="save">保存{{ page.title }}</el-button></div></div></template>
    </el-dialog>
  </main>
</template>
<style scoped lang="scss">
.dialog-symbol { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; border: 1px solid var(--el-border-color-light); border-radius: 11px; background: var(--el-bg-color); color: var(--el-color-primary); font-size: 23px; }
.capability-panel { padding: 0; overflow: hidden; }
.list-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; padding: 18px 20px; border-bottom: 1px solid var(--el-border-color-lighter); }
.list-toolbar :deep(.el-input) { max-width: 280px; }
.list-count { font-size: 13px; color: var(--el-text-color-regular); strong { margin-left: 6px; font-size: 12px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); border-radius: 5px; padding: 2px 7px; } }
.resource-name { display: flex; flex-direction: column; gap: 3px; padding-block: 7px; strong { font-weight: 550; } span { color: var(--el-text-color-secondary); font-size: 11px; font-family: 'SFMono-Regular', Consolas, monospace; overflow-wrap: anywhere; } }
.resource-empty { padding: 44px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; white-space: normal; line-height: 1.7; > .el-icon { font-size: 30px; color: var(--el-text-color-placeholder); margin-bottom: 3px; } strong { color: var(--el-text-color-regular); font-size: 14px; } p { font-size: 12px; margin: 0 0 7px; color: var(--el-text-color-secondary); } }
:global(.el-dialog.capability-settings) { display: flex; flex-direction: column; max-height: calc(100dvh - 48px); margin-block: 24px; padding: 0; border-radius: 12px; overflow: hidden; }
:global(.capability-settings .el-dialog__header) { margin: 0; padding: 22px 28px; border-bottom: 1px solid var(--el-border-color-lighter); flex-shrink: 0; }
:global(.capability-settings .el-dialog__body) { padding: 0; overflow-y: auto; min-height: 0; }
:global(.capability-settings .el-dialog__footer) { padding: 16px 28px; border-top: 1px solid var(--el-border-color-lighter); flex-shrink: 0; }
:global(.capability-settings .el-dialog__headerbtn) { top: 16px; right: 12px; width: 44px; height: 44px; }
.dialog-heading { display: flex; gap: 12px; align-items: center; padding-right: 30px; h2 { font-size: 19px; font-weight: 650; margin: 0 0 5px; } p { font-size: 12px; line-height: 1.7; color: var(--el-text-color-secondary); margin: 0; } }
.dialog-symbol { width: 40px; height: 40px; font-size: 21px; background: var(--el-fill-color-light); }
.form-section { padding: 24px 28px; border-bottom: 1px solid var(--el-border-color-lighter); &:last-child { border-bottom: 0; } }
.section-title { display: flex; gap: 12px; margin-bottom: 22px; > span { font-size: 10px; font-family: 'SFMono-Regular', Consolas, monospace; color: var(--el-text-color-secondary); padding-top: 4px; } h3 { font-size: 14px; font-weight: 650; margin: 0 0 6px; small { margin-left: 5px; color: var(--el-text-color-secondary); font-size: 11px; font-weight: 400; } } p { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.7; margin: 0; } }
.capability-form :deep(.el-form-item__label) { font-size: 12px; font-weight: 550; margin-bottom: 7px; }
.capability-form :deep(.el-form-item__content) { align-items: stretch; }
.capability-form :deep(.el-input__wrapper) { min-height: 38px; }
.capability-form :deep(.el-textarea__inner) { line-height: 1.8; }
.capability-form :deep(.el-form-item:last-child) { margin-bottom: 0; }
.capability-form .field-help { width: 100%; margin-bottom: 0; font-size: 11px; }
.monospace-input :deep(textarea) { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; }
.enable-row, .identity-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; strong { font-size: 12px; font-weight: 550; } p { margin: 4px 0 0; font-size: 11px; color: var(--el-text-color-secondary); line-height: 1.7; } }
.enable-row { padding-top: 8px; }
.identity-row { padding: 12px 16px; border-radius: 8px; background: var(--el-fill-color-lighter); border: 1px solid var(--el-border-color-lighter); margin-bottom: 22px; }
.request-grid { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 20px; }
.section-note { font-size: 11px; line-height: 1.8; color: var(--el-text-color-secondary); margin: 12px 0 0; }
.advanced-options { margin-top: 18px; border: 0; :deep(.el-collapse-item__header) { font-size: 12px; color: var(--el-text-color-regular); border-bottom: 1px solid var(--el-border-color-lighter); } :deep(.el-collapse-item__content) { padding: 16px 0 0; } :deep(.el-collapse-item__wrap) { border: 0; } }
.tool-tags { display: flex; flex-wrap: wrap; gap: 8px; :deep(.el-tag) { max-width: 100%; height: auto; min-height: 24px; padding-block: 3px; } :deep(.el-tag__content) { overflow-wrap: anywhere; white-space: normal; } }
.timeout-control { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; :deep(.el-input-number) { width: 160px; } > span { color: var(--el-text-color-regular); font-size: 12px; } .timeout-note { margin-left: 8px; color: var(--el-text-color-secondary); font-size: 11px; } }
.template-note { display: flex; gap: 12px; padding: 16px; background: var(--el-fill-color-lighter); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; > .el-icon { color: var(--el-color-primary); margin-top: 2px; font-size: 20px; flex-shrink: 0; } strong { font-size: 12px; font-weight: 550; } p { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.8; } }
.capability-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; .save-note { font-size: 11px; color: var(--el-text-color-secondary); line-height: 1.7; } > div { display: flex; gap: 8px; } :deep(.el-button + .el-button) { margin-left: 0; } }
@media (max-width: 600px) { .list-toolbar { padding: 14px; } .list-toolbar :deep(.el-input) { max-width: none; } :global(.capability-settings .el-dialog__header) { padding: 18px; } :global(.capability-settings .el-dialog__footer) { padding: 14px 18px; } .form-section { padding: 20px 18px; } .dialog-symbol { display: none; } .request-grid { grid-template-columns: 1fr; gap: 0; } .capability-footer { justify-content: flex-end; } .capability-footer .save-note { width: 100%; } }
</style>
