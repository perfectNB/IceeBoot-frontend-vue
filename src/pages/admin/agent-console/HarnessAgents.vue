<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { Cpu } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  agentConsole,
  type AgentSpec,
  type AgentView,
  type Capability,
  type CapabilityKind,
  type ModelConfig,
  type ReleaseView,
} from '@/api/agentConsole'
import { hasPermission, hasAnyPermission } from '@/utils/permission'
import AgentDirectory from './components/AgentDirectory.vue'
import AgentVersions from './components/AgentVersions.vue'
import AgentMemorySettings from './components/AgentMemorySettings.vue'
import AgentPreflightDialog from './components/AgentPreflightDialog.vue'
import JsonField from './components/JsonField.vue'
import KeyValueField from './components/KeyValueField.vue'
import BoundCapabilityPicker from './components/BoundCapabilityPicker.vue'
import './console.scss'

const AgentConversation = defineAsyncComponent(() => import('./components/AgentConversation.vue'))
const AgentSchedules = defineAsyncComponent(() => import('./components/AgentSchedules.vue'))
const schedulesVisible = ref(false)
const preflightVisible = ref(false)
const listFailed = ref(false)
const modelState = ref<'loading' | 'ready' | 'error'>('loading')
const agents = ref<AgentView[]>([]),
  models = ref<ModelConfig[]>([]),
  versions = ref<ReleaseView[]>([])
const loading = ref(false),
  saving = ref(false),
  publishing = ref(false),
  visible = ref(false),
  validSchema = ref(true),
  validExtra = ref(true),
  validEnvironment = ref(true),
  section = ref('basic'),
  savedSnapshot = ref('')
const formRef = ref<FormInstance>(),
  current = ref<AgentView>(),
  runVisible = ref(false),
  selected = ref<AgentView>()
const memoryMounted = ref(false)
const memorySettings = ref<InstanceType<typeof AgentMemorySettings>>()
const canReadMemory = computed(() => hasAnyPermission(['ai:memory:policy-read:api', 'ai:memory:read:api', 'ai:memory:grant-read:api']))
watch(section, value => { if (value === 'memory') memoryMounted.value = true })
const sections = computed(() => [
  ['basic', '基础信息'],
  ['prompt', '提示词'],
  ['output', '输出格式'],
  ['skills', '技能'],
  ['tools', '工具'],
  ['mcp', 'MCP'],
  ['knowledge', '知识库'],
  ['children', '子智能体'],
  ['env', '环境变量'],
  ...(canReadMemory.value ? [['memory', '长期记忆']] : []),
  ['versions', '版本'],
])
const activeModels = computed(() => models.value.filter((model) => model.enabled))
const selectedModel = computed(() => models.value.find((model) => model.id === form.value.modelConfigId))
const selectedChildren = computed(() => agents.value.filter((agent) => form.value.childAgentIds.includes(agent.draft.id!)))
const boundCount = computed(() => form.value.skillIds.length + form.value.toolIds.length + form.value.mcpIds.length + form.value.knowledgeIds.length)
const isDirty = computed(() => JSON.stringify(form.value) !== savedSnapshot.value || !!memorySettings.value?.isDirty)
const validationMessage = computed(() => !validEnvironment.value ? '环境变量名称有误，请到「环境变量」修正。' : !validSchema.value ? '输出 JSON 格式有误，请到「输出格式」修正。' : !validExtra.value ? '模型扩展参数格式有误，请在基础信息中修正。' : '')
const sectionDescription: Record<string, string> = {
  basic: '先定义名称、编码和运行模型，再按需开启执行能力。',
  prompt: '描述智能体的职责、目标，以及使用能力时需要遵循的规则。',
  output: '选择自然语言回答，或用于业务接口消费的结构化结果。',
  skills: '挂载可复用的任务说明、脚本资源和关联工具。',
  tools: '只开放完成任务所需的接口或脚本工具。',
  mcp: '连接外部 MCP 服务，并使用服务中已配置的工具白名单。',
  knowledge: '通过已有检索接口，为回答提供资料和来源。',
  children: '将专门的任务交给其他已发布的智能体。',
  env: '为当前智能体的沙箱提供运行时变量与凭据。',
  memory: '配置当前智能体的专属记忆与公共经验；通用画像在独立菜单中统一管理。',
  versions: '查看当前生效版本；后续编辑保留为草稿，发布后才会生效。',
}
function sectionCount(key: string) {
  return ({ skills: form.value.skillIds.length, tools: form.value.toolIds.length, mcp: form.value.mcpIds.length,
    knowledge: form.value.knowledgeIds.length, children: form.value.childAgentIds.length,
    env: Object.keys(form.value.environment).length, versions: versions.value.length } as Record<string, number>)[key]
}
function moveSection(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % sections.value.length
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + sections.value.length - 1) % sections.value.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = sections.value.length - 1
  else return
  event.preventDefault()
  section.value = sections.value[next]![0]!
  const button = event.currentTarget as HTMLButtonElement
  button.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
}
function empty(): AgentSpec {
  return {
    code: '',
    name: '',
    description: '',
    avatar: '',
    prompt: '',
    modelConfigId: undefined,
    maxRounds: 30,
    enabled: true,
    sandboxEnabled: false,
    sandboxTemplateId: undefined,
    planMode: false,
    outputFormat: 'TEXT',
    outputSchema: { type: 'object', properties: {}, required: [] },
    generation: { extra: {} },
    skillIds: [],
    toolIds: [],
    mcpIds: [],
    knowledgeIds: [],
    childAgentIds: [],
    environment: {},
  }
}
const form = ref<AgentSpec>(empty())
const capabilitySections: Record<string, CapabilityKind> = {
  skills: 'SKILL', tools: 'TOOL', mcp: 'MCP', knowledge: 'KNOWLEDGE',
}
const activeKind = computed(() => {
  if (!visible.value) return undefined
  if (section.value === 'basic' && form.value.sandboxEnabled) return 'SANDBOX'
  return capabilitySections[section.value]
})
type OptionsEntry = { state: 'loading' | 'ready' | 'error'; values: Capability[] }
const catalogs = ref<Partial<Record<CapabilityKind, OptionsEntry>>>({})
function options(kind: CapabilityKind) {
  return catalogs.value[kind]?.values ?? []
}
async function loadOptions(kind: CapabilityKind) {
  const catalog = catalogs.value
  if (catalog[kind] && catalog[kind]?.state !== 'error') return
  catalog[kind] = { state: 'loading', values: [] }
  try {
    const values = await agentConsole.capabilities(kind)
    catalog[kind] = { state: 'ready', values: values.filter(item => item.enabled) }
  } catch {
    catalog[kind] = { state: 'error', values: [] }
  }
}
watch(activeKind, kind => { if (kind) void loadOptions(kind) })

let listRequest = 0
async function load() {
  const request = ++listRequest
  loading.value = true
  listFailed.value = false
  try {
    const result = await agentConsole.agents()
    if (request === listRequest) agents.value = result
  } catch {
    if (request === listRequest) listFailed.value = true
  } finally {
    if (request === listRequest) loading.value = false
  }
}
let modelRequest = 0
async function loadModels() {
  const request = ++modelRequest
  modelState.value = 'loading'
  try {
    const result = await agentConsole.models()
    if (request === modelRequest) {
      models.value = result
      modelState.value = 'ready'
    }
  } catch {
    if (request === modelRequest) modelState.value = 'error'
  }
}
function refreshDirectory() {
  void load()
  void loadModels()
}
async function edit(value?: AgentView) {
  catalogs.value = {}
  current.value = value
  form.value = value ? JSON.parse(JSON.stringify(value.draft)) : empty()
  form.value.generation ||= { extra: {} }
  form.value.outputSchema ||= { type: 'object', properties: {} }
  memoryMounted.value = false
  section.value = 'basic'
  validSchema.value = true
  validExtra.value = true
  validEnvironment.value = true
  savedSnapshot.value = JSON.stringify(form.value)
  versions.value = []
  visible.value = true
  if (value) {
    const releases = await agentConsole.releases(value.draft.id!)
    if (visible.value && form.value.id === value.draft.id) versions.value = releases
  }
}
async function save(close = true) {
  if (!validExtra.value || !validSchema.value || !validEnvironment.value) return false
  if (
    !form.value.name.trim() ||
    !form.value.code.match(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/) ||
    !form.value.modelConfigId ||
    !form.value.prompt.trim()
  ) {
    section.value = !form.value.prompt.trim() && form.value.name.trim() && form.value.code && form.value.modelConfigId ? 'prompt' : 'basic'
    ElMessage.warning('请填写名称、有效编码、运行模型和提示词')
    return false
  }
  if (form.value.sandboxEnabled && !form.value.sandboxTemplateId) {
    section.value = 'basic'
    ElMessage.warning('请选择沙箱模板')
    return false
  }
  saving.value = true
  try {
    if (memorySettings.value && !await memorySettings.value.savePending()) { section.value = 'memory'; return false }
    current.value = await agentConsole.saveAgent(form.value)
    form.value = JSON.parse(JSON.stringify(current.value.draft))
    savedSnapshot.value = JSON.stringify(form.value)
    await load()
    if (close) {
      visible.value = false
      ElMessage.success('草稿已保存，发布后生效')
    }
    return true
  } finally {
    saving.value = false
  }
}
async function publish() {
  publishing.value = true
  try {
    if (!(await save(false))) return
    await agentConsole.publish(form.value.id!)
    versions.value = await agentConsole.releases(form.value.id!)
    await load()
    current.value = agents.value.find((a) => a.draft.id === form.value.id)
    ElMessage.success('新版本已发布')
    section.value = 'versions'
  } finally {
    publishing.value = false
  }
}
async function remove() {
  if (!form.value.id) return
  await ElMessageBox.confirm(`删除智能体“${form.value.name}”？历史执行记录会保留。`, '删除智能体', {
    type: 'warning',
  })
  await agentConsole.deleteAgent(form.value.id)
  visible.value = false
  await load()
}
async function refreshVersions() {
  if (!form.value.id) return
  versions.value = await agentConsole.releases(form.value.id)
  await load()
  current.value = agents.value.find(agent => agent.draft.id === form.value.id)
}
function openRun(value: AgentView) {
  selected.value = value
  runVisible.value = true
}
onMounted(refreshDirectory)
</script>
<template>
  <main class="agent-console admin-page">
    <AgentDirectory :agents="agents" :models="models" :loading="loading" :failed="listFailed"
      @refresh="refreshDirectory" @schedules="schedulesVisible = true" @edit="edit" @run="openRun" />
    <el-dialog
      v-model="visible"
      :title="form.id ? '配置智能体' : '新建智能体'"
      width="min(1180px,96vw)"
      class="agent-settings"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="settings-overview">
        <div><span class="overview-kicker">{{ form.id ? '编辑草稿' : '从基础配置开始' }}</span><h2>{{ form.name || '新的智能体' }}</h2>
          <p>{{ form.code || '名称、编码、运行模型和提示词为必填项' }}</p></div>
        <div class="overview-status"><el-tag :type="current?.activeVersion ? 'success' : 'info'">{{ current?.activeVersion ? `当前生效 v${current.activeVersion}` : '尚未发布' }}</el-tag>
          <span>修改后保存为草稿，发布后生效</span></div>
      </div>
      <div class="draft-summary"><span><strong>模型</strong>{{ selectedModel?.name || '待选择' }}</span><span><strong>挂载能力</strong>{{ boundCount }} 项</span><span><strong>子智能体</strong>{{ form.childAgentIds.length }} 个</span><span><strong>输出</strong>{{ form.outputFormat === 'TEXT' ? '文本' : 'JSON' }}</span></div>
      <div class="settings-layout">
        <nav class="settings-nav" role="tablist" aria-label="智能体设置分区">
          <button
            v-for="(item, index) in sections"
            :id="`agent-tab-${item[0]}`"
            :key="item[0]"
            role="tab"
            :aria-selected="section === item[0]"
            :aria-controls="`agent-panel-${item[0]}`"
            :tabindex="section === item[0] ? 0 : -1"
            @keydown="moveSection($event, index)"
            @click="section = item[0]!"
          >
            <span class="nav-step">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ item[1] }}</span>
            <span v-if="sectionCount(item[0]!)" class="nav-count">{{ sectionCount(item[0]!) }}</span>
          </button>
        </nav>
        <div class="settings-content">
        <el-form
          v-show="section !== 'memory'"
          ref="formRef"
          :model="form"
          label-position="top"
          class="settings-section"
          role="tabpanel"
          :id="section === 'memory' ? undefined : `agent-panel-${section}`"
          :aria-labelledby="`agent-tab-${section}`"
        >
          <div class="settings-section-heading"><div><h3>{{ sections.find((item) => item[0] === section)?.[1] }}</h3><p>{{ sectionDescription[section] }}</p></div></div>
          <div v-if="activeKind && catalogs[activeKind]?.state === 'error'" role="alert" class="catalog-feedback">
            资源列表加载失败。<el-button link type="primary" @click="loadOptions(activeKind)">重试</el-button>
          </div>
          <p v-else-if="activeKind && catalogs[activeKind]?.state !== 'ready'" class="catalog-feedback" role="status">正在加载资源…</p>
          <section v-show="section === 'basic'">
            <div class="form-grid">
              <el-form-item label="智能体名称" prop="name" :rules="[{ required: true, whitespace: true, message: '请填写智能体名称', trigger: 'blur' }]">
                <el-input v-model="form.name" maxlength="120" placeholder="例如：产品资料助手" />
              </el-form-item>
              <el-form-item label="智能体编码" prop="code" :rules="[{ required: true, message: '请填写智能体编码', trigger: 'blur' }, { pattern: /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/, message: '编码需以字母开头，且最多 64 字符', trigger: 'blur' }]">
                <el-input v-model="form.code" :disabled="!!form.id" placeholder="例如：product_assistant" />
                <p class="field-help">字母开头，可含数字、下划线或短横线，最多 64 字符；创建后不可修改。</p>
              </el-form-item>
            </div>
            <el-form-item label="运行模型" prop="modelConfigId" :rules="[{ required: true, message: '请选择运行模型', trigger: 'change' }]">
              <el-select v-model="form.modelConfigId" :loading="modelState === 'loading'" filterable placeholder="选择模型连接">
                <el-option
                  v-for="m in activeModels"
                  :key="m.id"
                  :label="`${m.name} · ${m.model}`"
                  :value="m.id!"
                />
              </el-select>
              <p v-if="modelState === 'loading'" class="field-help">正在加载模型…</p>
              <p v-else-if="modelState === 'error'" class="field-help">模型加载失败。<el-button link type="primary" @click="loadModels">重试</el-button></p>
              <p v-else-if="!activeModels.length" class="field-help">暂无可用模型，请先在「模型连接」新增并启用一个连接，再刷新此页。</p>
              <p v-else class="field-help">{{ selectedModel ? `${selectedModel.provider} · ${selectedModel.model}` : '选择后台已配置的模型连接，无需重复填写密钥。' }}</p>
            </el-form-item>
            <div v-if="selectedModel" class="selection-summary"><el-icon><Cpu /></el-icon><div><strong>{{ selectedModel.name }}</strong><span>{{ selectedModel.model }} · 模型参数默认继承此连接</span></div></div>
            <el-collapse class="advanced-settings">
              <el-collapse-item title="模型参数（留空继承模型连接配置）">
                <p class="field-help">这里只填写需要覆盖的参数，留空会使用「模型连接」的默认值。思考参数需实际模型支持。</p>
                <div class="form-grid">
                  <el-form-item label="温度">
                    <el-input-number
                      :model-value="form.generation.temperature"
                      @change="form.generation.temperature = $event"
                      :min="0"
                      :max="2"
                      :step="0.1"
                    />
                  </el-form-item>
                  <el-form-item label="最大输出 Token">
                    <el-input-number
                      :model-value="form.generation.maxTokens"
                      @change="form.generation.maxTokens = $event"
                      :min="1"
                      :max="1048576"
                    />
                  </el-form-item>
                  <el-form-item label="思考模式">
                    <el-select
                      v-model="form.generation.thinking"
                      clearable
                      placeholder="继承模型配置"
                    >
                      <el-option label="开启" :value="true" />
                      <el-option label="关闭" :value="false" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="思考强度">
                    <el-select
                      v-model="form.generation.reasoningEffort"
                      clearable
                      placeholder="继承模型配置"
                    >
                      <el-option
                        v-for="effort in ['low', 'medium', 'high']"
                        :key="effort"
                        :label="effort"
                        :value="effort"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="思考预算">
                    <el-input-number
                      :model-value="form.generation.thinkingBudget"
                      @change="form.generation.thinkingBudget = $event"
                      :min="1024"
                      :step="1024"
                    />
                  </el-form-item>
                </div>
                <el-form-item label="扩展参数">
                  <JsonField
                    :model-value="form.generation.extra || {}"
                    @update:model-value="form.generation.extra = $event"
                    label="Agent 模型扩展参数"
                    :rows="4"
                    @valid="validExtra = $event"
                  />
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
            <h4 class="form-subheading">执行设置</h4>
            <div class="form-grid">
              <el-form-item label="最大执行轮次">
                <el-input-number v-model="form.maxRounds" :min="1" :max="100" />
              </el-form-item>
              <el-form-item label="头像地址"><el-input v-model="form.avatar" placeholder="可选，填写图片 URL" /></el-form-item>
            </div>
            <el-form-item label="说明">
              <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简要说明这个智能体负责什么，便于后续查找和分工。" />
            </el-form-item>
            <div class="form-grid">
              <el-form-item label="启用智能体">
                <el-switch v-model="form.enabled" />
                <p class="field-help">发布后生效。</p>
              </el-form-item>
              <el-form-item label="E2B 沙箱">
                <el-switch v-model="form.sandboxEnabled" />
                <p class="field-help">执行代码、curl 和命令时必须开启。</p>
              </el-form-item>
              <el-form-item v-if="form.sandboxEnabled" label="沙箱模板" required>
                <el-select v-model="form.sandboxTemplateId" :disabled="catalogs.SANDBOX?.state !== 'ready'" filterable placeholder="搜索并选择 E2B 模板">
                  <el-option
                    v-for="c in options('SANDBOX')"
                    :key="c.id"
                    :label="c.name"
                    :value="c.id!"
                  />
                </el-select>
                <p v-if="catalogs.SANDBOX?.state === 'ready' && !options('SANDBOX').length" class="field-help">暂无沙箱模板，请先在「沙箱模板」配置 E2B 模板。</p>
              </el-form-item>
              <el-form-item label="计划模式">
                <el-switch v-model="form.planMode" />
                <p class="field-help">复杂任务先规划，再执行。</p>
              </el-form-item>
            </div>
          </section>
          <section v-show="section === 'prompt'">
            <el-form-item label="系统提示词" prop="prompt" :rules="[{ required: true, whitespace: true, message: '请填写智能体的职责与任务规则', trigger: 'blur' }]">
              <el-input
                v-model="form.prompt"
                type="textarea"
                :rows="13"
                placeholder="描述智能体的职责、任务目标和使用规则。例如：负责解答产品问题；优先检索已挂载资料；资料不足时明确说明。"
              />
            </el-form-item>
          </section>
          <section v-show="section === 'output'">
            <el-form-item label="输出格式">
              <el-radio-group v-model="form.outputFormat">
                <el-radio-button value="TEXT">文本</el-radio-button>
                <el-radio-button value="JSON_SCHEMA">JSON Schema</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="form.outputFormat === 'JSON_SCHEMA'" label="输出结构">
              <JsonField
                v-model="form.outputSchema"
                label="输出 JSON Schema"
                :rows="10"
                hint="描述结果对象的字段与类型；可从示例开始，再按业务需求调整。"
                :example="{ type: 'object', properties: { result: { type: 'string', description: '处理结果' } }, required: ['result'] }"
                @valid="validSchema = $event"
              />
            </el-form-item>
            <p class="field-help">结构化结果会校验，不符合配置的输出不会作为成功结果返回。</p>
          </section>
          <section v-show="section === 'skills'">
            <BoundCapabilityPicker v-if="catalogs.SKILL?.state === 'ready'" v-model="form.skillIds" :options="options('SKILL')" title="技能" hint="按需读取技能说明，技能内的脚本、资源和关联工具会一起固定到发布版本。" empty-text="请先在「技能」创建并启用资源，再回到此处挂载。" />
          </section>
          <section v-show="section === 'tools'">
            <BoundCapabilityPicker v-if="catalogs.TOOL?.state === 'ready'" v-model="form.toolIds" :options="options('TOOL')" title="工具" hint="可调用已挂载工具或 Skill 关联工具；脚本工具必须为此智能体开启 E2B。" empty-text="请先在「工具」配置 HTTP 接口或沙箱脚本，再回到此处挂载。" />
          </section>
          <section v-show="section === 'mcp'">
            <BoundCapabilityPicker v-if="catalogs.MCP?.state === 'ready'" v-model="form.mcpIds" :options="options('MCP')" title="MCP 服务" hint="只开放每个服务配置中明确允许的远端工具。" empty-text="请先在「MCP 服务」配置连接地址与工具白名单。" />
          </section>
          <section v-show="section === 'knowledge'">
            <BoundCapabilityPicker v-if="catalogs.KNOWLEDGE?.state === 'ready'" v-model="form.knowledgeIds" :options="options('KNOWLEDGE')" title="知识库连接" hint="智能体按需调用已有知识库的 HTTP 检索接口。" empty-text="请先在「知识库连接」配置检索接口，再回到此处挂载。" />
          </section>
          <section v-show="section === 'children'">
            <el-form-item label="允许调用的子智能体">
              <el-select v-model="form.childAgentIds" multiple filterable>
                <el-option
                  v-for="a in agents.filter((a) => a.draft.id !== form.id && a.activeVersion > 0)"
                  :key="a.draft.id"
                  :label="`${a.draft.name} · v${a.activeVersion}`"
                  :value="a.draft.id!"
                />
              </el-select>
            </el-form-item>
            <div v-if="selectedChildren.length" class="binding-preview-list"><div v-for="child in selectedChildren" :key="child.draft.id" class="binding-preview"><span class="binding-preview-icon"><el-icon><Cpu /></el-icon></span><div><strong>{{ child.draft.name }}</strong><span>{{ child.draft.code }} · v{{ child.activeVersion }}</span></div></div></div>
            <p v-if="!agents.some((agent) => agent.draft.id !== form.id && agent.activeVersion > 0)" class="field-help">暂无可用子智能体。请先创建并发布另一个智能体。</p>
            <p class="field-help">
              发布时固定子智能体版本，最多 5 层，不允许循环关联。子智能体使用自己的模型与能力配置。
            </p>
          </section>
          <section v-show="section === 'env'">
            <el-alert v-if="!form.sandboxEnabled" title="当前未开启 E2B 沙箱" description="环境变量只在沙箱内使用。需要执行脚本时，请先在基础信息中开启沙箱并选择模板。" type="info" :closable="false" show-icon class="section-notice" />
            <el-form-item label="沙箱环境变量">
              <KeyValueField v-model="form.environment" label="环境变量" key-label="变量名" value-label="变量值" key-placeholder="例如：API_TOKEN" value-placeholder="填写变量值，保存后加密" :key-pattern="/^[a-zA-Z_][a-zA-Z0-9_]*$/" invalid-key-message="变量名需以字母或下划线开头，仅包含字母、数字或下划线" secret @valid="validEnvironment = $event" />
            </el-form-item>
            <p class="field-help">
              只注入当前 Agent 的 E2B 环境，不放入提示词，不向其他 Agent 自动继承。
            </p>
          </section>
          <section v-show="section === 'versions'">
            <el-alert
              :title="
                current?.activeVersion
                  ? `当前生效版本 v${current.activeVersion}`
                  : '尚未发布，业务接口暂不可调用'
              "
              :type="current?.activeVersion ? 'success' : 'info'"
              :closable="false"
            />
            <AgentVersions v-if="form.id" :agent-id="form.id" :versions="versions" :active-release-id="current?.activeReleaseId" @changed="refreshVersions" />
            <p class="field-help">
              模型配置、能力内容、环境变量和子智能体版本均保存为快照。再次修改不会改变已发布版本。
            </p>
          </section>
        </el-form>
        <section v-if="memoryMounted" v-show="section === 'memory'" id="agent-panel-memory" class="settings-section" role="tabpanel" aria-labelledby="agent-tab-memory">
          <div class="settings-section-heading"><h3>长期记忆</h3><p>{{ sectionDescription.memory }}</p></div>
          <AgentMemorySettings v-if="form.id" :key="form.id" ref="memorySettings" :agent-id="form.id" :disabled="saving || publishing" />
          <el-empty v-else description="请先保存智能体草稿，再配置长期记忆"><el-button v-if="hasPermission('ai:agent:write')" type="primary" :loading="saving" @click="save(false)">保存草稿</el-button></el-empty>
        </section>
        </div>
      </div>
      <template #footer>
        <div class="settings-footer">
          <el-button
            v-if="form.id && hasPermission('ai:agent:write')"
            type="danger"
            plain
            @click="remove"
          >
            删除
          </el-button>
          <div class="footer-state"><strong>{{ !form.id ? '尚未保存' : isDirty ? '有未保存的更改' : '草稿已保存' }}</strong><span v-if="validationMessage" role="alert" class="footer-validation">{{ validationMessage }}</span><span v-else>发布后通过唯一编码调用</span></div>
          <span class="spacer" />
          <el-button v-if="form.id && hasPermission('ai:agent:preflight:api')" :disabled="saving || publishing" @click="preflightVisible = true">技能与环境预检</el-button>
          <el-button @click="visible = false">关闭</el-button>
          <el-button
            v-if="hasPermission('ai:agent:write')"
            :loading="saving"
            :disabled="publishing || memorySettings?.busy || !validSchema || !validExtra || !validEnvironment"
            @click="save()"
          >
            保存草稿
          </el-button>
          <el-button
            v-if="hasPermission('ai:agent:publish')"
            type="primary"
            :loading="publishing"
            :disabled="saving || memorySettings?.busy || !validSchema || !validExtra || !validEnvironment"
            @click="publish"
          >
            保存并发布
          </el-button>
        </div>
      </template>
    </el-dialog>
    <AgentPreflightDialog v-if="form.id && preflightVisible" v-model="preflightVisible" :key="form.id" :agent-id="form.id" :dirty="isDirty" />
    <el-dialog v-model="runVisible" :title="`与 ${selected?.draft.name || '智能体'} 对话`"
      class="agent-conversation-dialog" fullscreen destroy-on-close :close-on-click-modal="false">
      <template #header="{ titleId, titleClass }">
        <div class="conversation-dialog-heading">
          <span class="conversation-dialog-avatar"><el-icon aria-hidden="true"><Cpu /></el-icon></span>
          <div><h2 :id="titleId" :class="titleClass">{{ selected?.draft.name || '智能体' }}</h2><p>智能体工作区</p></div>
        </div>
      </template>
      <AgentConversation v-if="selected && runVisible" :key="selected.draft.id" :agent="selected" />
    </el-dialog>
    <AgentSchedules v-if="schedulesVisible" v-model="schedulesVisible" :agents="agents" />
  </main>
</template>
<style scoped>
.settings-content { min-width: 0; }
.catalog-feedback { margin: 12px 0; color: var(--el-text-color-regular); font-size: 13px; }
.settings-subtitle {
  margin: 0 0 24px;
  color: var(--el-text-color-regular);
}
.run-summary {
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow-wrap: anywhere;
}
</style>
