<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Cpu, Plus, Refresh, Search, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  agentConsole,
  type AgentSpec,
  type AgentView,
  type Capability,
  type CapabilityKind,
  type ModelConfig,
  type ReleaseView,
  type InvokeResult,
} from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
import JsonField from './components/JsonField.vue'
import KeyValueField from './components/KeyValueField.vue'
import BoundCapabilityPicker from './components/BoundCapabilityPicker.vue'
import './console.scss'
const agents = ref<AgentView[]>([]),
  models = ref<ModelConfig[]>([]),
  capabilities = ref<Capability[]>([]),
  versions = ref<ReleaseView[]>([])
const loading = ref(false),
  saving = ref(false),
  publishing = ref(false),
  visible = ref(false),
  validSchema = ref(true),
  validExtra = ref(true),
  validEnvironment = ref(true),
  section = ref('basic'),
  keyword = ref(''),
  statusFilter = ref('all'),
  savedSnapshot = ref('')
const formRef = ref<FormInstance>(),
  current = ref<AgentView>(),
  runVisible = ref(false),
  running = ref(false),
  selected = ref<AgentView>(),
  input = ref(''),
  result = ref<InvokeResult>()
const sections = [
  ['basic', '基础信息'],
  ['prompt', '提示词'],
  ['output', '输出格式'],
  ['skills', '技能'],
  ['tools', '工具'],
  ['mcp', 'MCP'],
  ['knowledge', '知识库'],
  ['children', '子智能体'],
  ['env', '环境变量'],
  ['versions', '版本'],
]
const filtered = computed(() =>
  agents.value.filter((a) =>
    `${a.draft.name} ${a.draft.code}`.toLowerCase().includes(keyword.value.toLowerCase()) &&
    (statusFilter.value === 'all' || (statusFilter.value === 'published' ? a.activeVersion > 0 : !a.activeVersion)),
  ),
)
const activeModels = computed(() => models.value.filter((model) => model.enabled))
const selectedModel = computed(() => models.value.find((model) => model.id === form.value.modelConfigId))
const selectedChildren = computed(() => agents.value.filter((agent) => form.value.childAgentIds.includes(agent.draft.id!)))
const boundCount = computed(() => form.value.skillIds.length + form.value.toolIds.length + form.value.mcpIds.length + form.value.knowledgeIds.length)
const isDirty = computed(() => JSON.stringify(form.value) !== savedSnapshot.value)
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
  versions: '查看当前生效版本；后续编辑保留为草稿，发布后才会生效。',
}
function modelName(id?: number) {
  const model = models.value.find((item) => item.id === id)
  return model ? `${model.name} · ${model.model}` : '未选择模型'
}
function sectionCount(key: string) {
  return ({ skills: form.value.skillIds.length, tools: form.value.toolIds.length, mcp: form.value.mcpIds.length,
    knowledge: form.value.knowledgeIds.length, children: form.value.childAgentIds.length,
    env: Object.keys(form.value.environment).length, versions: versions.value.length } as Record<string, number>)[key]
}
function moveSection(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % sections.length
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + sections.length - 1) % sections.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = sections.length - 1
  else return
  event.preventDefault()
  section.value = sections[next]![0]!
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
function options(kind: CapabilityKind) {
  return capabilities.value.filter((c) => c.kind === kind && c.enabled)
}
async function load() {
  loading.value = true
  try {
    ;[agents.value, models.value, capabilities.value] = await Promise.all([
      agentConsole.agents(),
      agentConsole.models(),
      agentConsole.capabilities(),
    ])
  } finally {
    loading.value = false
  }
}
async function edit(value?: AgentView) {
  current.value = value
  form.value = value ? JSON.parse(JSON.stringify(value.draft)) : empty()
  form.value.generation ||= { extra: {} }
  form.value.outputSchema ||= { type: 'object', properties: {} }
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
function openRun(value: AgentView) {
  selected.value = value
  input.value = ''
  result.value = undefined
  runVisible.value = true
}
async function invoke() {
  if (!selected.value || !input.value.trim()) return
  running.value = true
  result.value = undefined
  try {
    result.value = await agentConsole.invoke(selected.value.draft.code, input.value)
    await load()
  } finally {
    running.value = false
  }
}
onMounted(load)
</script>
<template>
  <main class="agent-console">
    <header class="console-heading">
      <div class="console-title-block">
        <span class="console-title-icon"><el-icon><Cpu /></el-icon></span>
        <div><p class="console-eyebrow">执行与能力编排</p><h1>智能体 <span class="console-count">{{ agents.length }}</span></h1>
          <p class="subtitle">从一个模型和一段提示词开始，按需挂载技能、工具与知识库。</p></div>
      </div>
      <div class="console-actions">
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
        <el-button v-if="hasPermission('ai:agent:write')" type="primary" :icon="Plus" @click="edit()">
          新建智能体
        </el-button>
      </div>
    </header>
    <div class="console-toolbar">
      <el-input v-model="keyword" placeholder="搜索智能体名称或编码" clearable aria-label="搜索智能体" :prefix-icon="Search" class="agent-search" />
      <el-radio-group v-model="statusFilter" aria-label="按发布状态筛选">
        <el-radio-button value="all">全部</el-radio-button><el-radio-button value="published">已发布</el-radio-button><el-radio-button value="draft">未发布</el-radio-button>
      </el-radio-group>
      <span class="toolbar-caption">{{ filtered.length }} 个智能体</span>
    </div>
    <section v-loading="loading" class="agent-grid">
      <div v-if="!filtered.length && !loading" class="console-empty">
        <el-empty :description="agents.length ? '没有匹配的智能体' : '创建你的第一个智能体'">
          <p class="field-help">{{ agents.length ? '尝试其他关键词或发布状态。' : '先在「模型连接」配置并启用模型，再填写智能体职责并发布。' }}</p>
          <el-button v-if="!agents.length && hasPermission('ai:agent:write')" type="primary" :icon="Plus" @click="edit()">新建智能体</el-button>
        </el-empty>
      </div>
      <article v-for="agent in filtered" :key="agent.draft.id" class="agent-card">
        <div class="agent-card-top">
          <el-avatar class="agent-avatar" shape="square" :size="44" :src="agent.draft.avatar || undefined">{{ agent.draft.name.slice(0, 1) }}</el-avatar>
          <el-tag :type="agent.activeVersion ? 'success' : 'info'">
            {{ agent.activeVersion ? `已发布 v${agent.activeVersion}` : '未发布' }}
          </el-tag>
        </div>
        <h2>{{ agent.draft.name }}</h2>
        <p class="code">{{ agent.draft.code }}</p>
        <p class="agent-description">{{ agent.draft.description || '暂无说明' }}</p>
        <p class="agent-model"><el-icon><Cpu /></el-icon><span>{{ modelName(agent.draft.modelConfigId) }}</span></p>
        <div class="agent-meta">
          <span>调用 <strong>{{ agent.callCount }}</strong> 次</span>
          <span>{{ agent.draft.sandboxEnabled ? 'E2B 沙箱' : '接口与工具' }}</span>
        </div>
        <footer>
          <el-button v-if="hasPermission('ai:agent:write')" @click="edit(agent)">配置</el-button>
          <el-button
            v-if="hasPermission('ai:agent:invoke')"
            type="primary"
            plain
            :icon="VideoPlay"
            :disabled="!agent.activeVersion"
            @click="openRun(agent)"
          >
            运行已发布版本
          </el-button>
        </footer>
      </article>
    </section>
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
        <el-form
          ref="formRef"
          :model="form"
          label-position="top"
          class="settings-section"
          role="tabpanel"
          :id="`agent-panel-${section}`"
          :aria-labelledby="`agent-tab-${section}`"
        >
          <div class="settings-section-heading"><div><h3>{{ sections.find((item) => item[0] === section)?.[1] }}</h3><p>{{ sectionDescription[section] }}</p></div></div>
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
              <el-select v-model="form.modelConfigId" filterable placeholder="选择模型连接">
                <el-option
                  v-for="m in models.filter((m) => m.enabled)"
                  :key="m.id"
                  :label="`${m.name} · ${m.model}`"
                  :value="m.id!"
                />
              </el-select>
              <p v-if="!activeModels.length" class="field-help">暂无可用模型，请先在「模型连接」新增并启用一个连接，再刷新此页。</p>
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
                <el-select v-model="form.sandboxTemplateId" filterable placeholder="搜索并选择 E2B 模板">
                  <el-option
                    v-for="c in options('SANDBOX')"
                    :key="c.id"
                    :label="c.name"
                    :value="c.id!"
                  />
                </el-select>
                <p v-if="!options('SANDBOX').length" class="field-help">暂无沙箱模板，请先在「沙箱模板」配置 E2B 模板。</p>
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
            <BoundCapabilityPicker v-model="form.skillIds" :options="options('SKILL')" title="技能" hint="按需读取技能说明，技能内的脚本、资源和关联工具会一起固定到发布版本。" empty-text="请先在「技能」创建并启用资源，再回到此处挂载。" />
          </section>
          <section v-show="section === 'tools'">
            <BoundCapabilityPicker v-model="form.toolIds" :options="options('TOOL')" title="工具" hint="可调用已挂载工具或 Skill 关联工具；脚本工具必须为此智能体开启 E2B。" empty-text="请先在「工具」配置 HTTP 接口或沙箱脚本，再回到此处挂载。" />
          </section>
          <section v-show="section === 'mcp'">
            <BoundCapabilityPicker v-model="form.mcpIds" :options="options('MCP')" title="MCP 服务" hint="只开放每个服务配置中明确允许的远端工具。" empty-text="请先在「MCP 服务」配置连接地址与工具白名单。" />
          </section>
          <section v-show="section === 'knowledge'">
            <BoundCapabilityPicker v-model="form.knowledgeIds" :options="options('KNOWLEDGE')" title="知识库连接" hint="智能体按需调用已有知识库的 HTTP 检索接口。" empty-text="请先在「知识库连接」配置检索接口，再回到此处挂载。" />
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
            <el-table :data="versions" empty-text="保存草稿后点击发布，生成第一个不可变版本。">
              <el-table-column prop="version" label="版本" width="80" />
              <el-table-column prop="createdAt" label="发布时间" min-width="180" />
              <el-table-column prop="createdBy" label="发布人" width="100" />
            </el-table>
            <p class="field-help">
              模型配置、能力内容、环境变量和子智能体版本均保存为快照。再次修改不会改变已发布版本。
            </p>
          </section>
        </el-form>
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
          <div class="footer-state"><strong>{{ !form.id ? '尚未保存' : isDirty ? '草稿有未保存的更改' : '草稿已保存' }}</strong><span v-if="validationMessage" role="alert" class="footer-validation">{{ validationMessage }}</span><span v-else>发布后通过唯一编码调用</span></div>
          <span class="spacer" />
          <el-button @click="visible = false">关闭</el-button>
          <el-button
            v-if="hasPermission('ai:agent:write')"
            :loading="saving"
            :disabled="publishing || !validSchema || !validExtra || !validEnvironment"
            @click="save()"
          >
            保存草稿
          </el-button>
          <el-button
            v-if="hasPermission('ai:agent:publish')"
            type="primary"
            :loading="publishing"
            :disabled="saving || !validSchema || !validExtra || !validEnvironment"
            @click="publish"
          >
            保存并发布
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      v-model="runVisible"
      :title="`运行 · ${selected?.draft.name || ''} · v${selected?.activeVersion || 0}`"
      width="min(860px,94vw)"
      :close-on-click-modal="!running"
    >
      <el-form label-position="top">
        <el-form-item label="输入">
          <el-input v-model="input" type="textarea" :rows="5" :disabled="running" />
        </el-form-item>
      </el-form>
      <el-button type="primary" :loading="running" :disabled="!input.trim()" @click="invoke">
        开始执行
      </el-button>
      <p v-if="running" role="status">正在执行，工具调用与模型消耗将记录到执行记录中。</p>
      <template v-if="result">
        <p class="run-summary">
          输入 {{ result.inputTokens }} / 输出 {{ result.outputTokens }} Token ·
          {{ result.usageKnown ? '包含父子智能体合计' : '部分模型未返回用量' }} · 记录
          {{ result.runId }}
        </p>
        <pre class="agent-output">{{ result.output }}</pre>
      </template>
    </el-dialog>
  </main>
</template>
<style scoped>
.agent-grid .console-empty { grid-column: 1 / -1; }
.agent-model { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-regular); font-size: 13px; margin: 4px 0; }
.agent-model span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agent-meta strong { color: var(--el-text-color-primary); font-weight: 600; }
.agent-search {
  max-width: 360px;
  margin-bottom: 0;
}
.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 20px;
  min-height: 180px;
}
.agent-card {
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 3px 12px color-mix(in srgb, var(--el-color-primary) 3%, transparent);
  transition: border-color .18s ease, box-shadow .18s ease;
  display: flex;
  flex-direction: column;
}
.agent-card:hover { border-color: var(--el-color-primary-light-5); box-shadow: 0 8px 22px color-mix(in srgb, var(--el-color-primary) 7%, transparent); }
.agent-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.agent-avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 10px;
  font-weight: 600;
}
.agent-card h2 {
  font-size: 18px;
  margin: 18px 0 6px;
}
.agent-card .code {
  margin: 0;
}
.agent-description {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.7;
  min-height: 44px;
  flex: 1;
}
.agent-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin: 12px 0 20px;
}
.agent-card footer {
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
}
.agent-card footer .el-button + .el-button {
  margin: 0;
}
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
