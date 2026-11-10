<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
  section = ref('basic'),
  keyword = ref('')
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
    `${a.draft.name} ${a.draft.code}`.toLowerCase().includes(keyword.value.toLowerCase()),
  ),
)
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
  versions.value = []
  visible.value = true
  if (value) versions.value = await agentConsole.releases(value.draft.id!)
}
async function save(close = true) {
  if (!validExtra.value || !validSchema.value) return false
  if (
    !form.value.name.trim() ||
    !form.value.code.match(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/) ||
    !form.value.modelConfigId ||
    !form.value.prompt.trim()
  ) {
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
  if (!(await save(false))) return
  publishing.value = true
  try {
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
      <div>
        <h1>智能体</h1>
        <p class="subtitle">配置职责、模型和能力。保存为草稿，发布后通过唯一 code 调用。</p>
      </div>
      <div class="console-actions">
        <el-button @click="load">刷新</el-button>
        <el-button v-if="hasPermission('ai:agent:write')" type="primary" @click="edit()">
          新建智能体
        </el-button>
      </div>
    </header>
    <el-input
      v-model="keyword"
      placeholder="搜索名称或编码"
      clearable
      aria-label="搜索智能体"
      class="agent-search"
    />
    <section v-loading="loading" class="agent-grid">
      <el-empty
        v-if="!filtered.length && !loading"
        description="还没有智能体，先创建模型连接，再配置第一个 Agent。"
      />
      <article v-for="agent in filtered" :key="agent.draft.id" class="agent-card">
        <div class="agent-card-top">
          <span class="agent-avatar" aria-hidden="true">{{ agent.draft.name.slice(0, 1) }}</span>
          <el-tag :type="agent.activeVersion ? 'success' : 'info'">
            {{ agent.activeVersion ? `已发布 v${agent.activeVersion}` : '未发布' }}
          </el-tag>
        </div>
        <h2>{{ agent.draft.name }}</h2>
        <p class="code">{{ agent.draft.code }}</p>
        <p class="agent-description">{{ agent.draft.description || '暂无说明' }}</p>
        <div class="agent-meta">
          <span>调用 {{ agent.callCount }} 次</span>
          <span>{{ agent.draft.sandboxEnabled ? 'E2B 沙箱' : '接口与工具' }}</span>
        </div>
        <footer>
          <el-button v-if="hasPermission('ai:agent:write')" @click="edit(agent)">配置</el-button>
          <el-button
            v-if="hasPermission('ai:agent:invoke')"
            type="primary"
            plain
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
      title="智能体设置"
      width="min(1120px,96vw)"
      class="agent-settings"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <p class="settings-subtitle">配置职责、模型和能力，保存后发布使用。</p>
      <div class="settings-layout">
        <nav class="settings-nav" role="tablist" aria-label="智能体设置分区">
          <button
            v-for="item in sections"
            :id="`agent-tab-${item[0]}`"
            :key="item[0]"
            role="tab"
            :aria-selected="section === item[0]"
            :aria-controls="`agent-panel-${item[0]}`"
            @click="section = item[0]!"
          >
            {{ item[1] }}
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
          <section v-show="section === 'basic'">
            <div class="form-grid">
              <el-form-item label="智能体名称" required>
                <el-input v-model="form.name" maxlength="120" />
              </el-form-item>
              <el-form-item label="智能体编码" required>
                <el-input v-model="form.code" :disabled="!!form.id" placeholder="创建后不可修改" />
              </el-form-item>
            </div>
            <el-form-item label="运行模型" required>
              <el-select v-model="form.modelConfigId" filterable placeholder="选择模型连接">
                <el-option
                  v-for="m in models.filter((m) => m.enabled)"
                  :key="m.id"
                  :label="`${m.name} · ${m.model}`"
                  :value="m.id!"
                />
              </el-select>
            </el-form-item>
            <el-collapse>
              <el-collapse-item title="模型参数（留空继承模型连接配置）">
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
            <div class="form-grid">
              <el-form-item label="最大执行轮次">
                <el-input-number v-model="form.maxRounds" :min="1" :max="100" />
              </el-form-item>
              <el-form-item label="头像地址"><el-input v-model="form.avatar" /></el-form-item>
            </div>
            <el-form-item label="说明">
              <el-input v-model="form.description" type="textarea" :rows="3" />
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
                <el-select v-model="form.sandboxTemplateId" placeholder="选择 E2B 模板">
                  <el-option
                    v-for="c in options('SANDBOX')"
                    :key="c.id"
                    :label="c.name"
                    :value="c.id!"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="计划模式">
                <el-switch v-model="form.planMode" />
                <p class="field-help">复杂任务先规划，再执行。</p>
              </el-form-item>
            </div>
          </section>
          <section v-show="section === 'prompt'">
            <el-form-item label="系统提示词" required>
              <el-input
                v-model="form.prompt"
                type="textarea"
                :rows="19"
                placeholder="描述 Agent 的职责、任务目标和能力使用规则。"
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
                :rows="17"
                @valid="validSchema = $event"
              />
            </el-form-item>
            <p class="field-help">结构化结果会校验，不符合配置的输出不会作为成功结果返回。</p>
          </section>
          <section v-show="section === 'skills'">
            <el-form-item label="挂载技能">
              <el-select v-model="form.skillIds" multiple filterable>
                <el-option
                  v-for="c in options('SKILL')"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id!"
                />
              </el-select>
            </el-form-item>
            <p class="field-help">
              Agent 按需读取技能说明。技能的脚本、资源和关联工具会一并固定到发布版本。
            </p>
          </section>
          <section v-show="section === 'tools'">
            <el-form-item label="挂载工具">
              <el-select v-model="form.toolIds" multiple filterable>
                <el-option
                  v-for="c in options('TOOL')"
                  :key="c.id"
                  :label="`${c.name} · ${c.tool?.kind === 'SCRIPT' ? '脚本' : 'HTTP'}`"
                  :value="c.id!"
                />
              </el-select>
            </el-form-item>
            <p class="field-help">只能调用已挂载或由已挂载 Skill 关联的工具；脚本工具需要 E2B。</p>
          </section>
          <section v-show="section === 'mcp'">
            <el-form-item label="挂载 MCP 服务">
              <el-select v-model="form.mcpIds" multiple filterable>
                <el-option v-for="c in options('MCP')" :key="c.id" :label="c.name" :value="c.id!" />
              </el-select>
            </el-form-item>
            <p class="field-help">每个服务仅开放能力配置中明确允许的远端工具。</p>
          </section>
          <section v-show="section === 'knowledge'">
            <el-form-item label="挂载知识库">
              <el-select v-model="form.knowledgeIds" multiple filterable>
                <el-option
                  v-for="c in options('KNOWLEDGE')"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id!"
                />
              </el-select>
            </el-form-item>
            <p class="field-help">Agent 按需调用知识库检索接口；不依赖百炼知识库。</p>
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
            <p class="field-help">
              发布时固定子智能体版本，最多 5 层，不允许循环关联。子智能体使用自己的模型与能力配置。
            </p>
          </section>
          <section v-show="section === 'env'">
            <el-form-item label="沙箱环境变量">
              <KeyValueField v-model="form.environment" label="环境变量" secret />
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
          <span class="spacer" />
          <el-button @click="visible = false">关闭</el-button>
          <el-button
            v-if="hasPermission('ai:agent:write')"
            :loading="saving"
            :disabled="publishing || !validSchema || !validExtra"
            @click="save()"
          >
            保存草稿
          </el-button>
          <el-button
            v-if="hasPermission('ai:agent:publish')"
            type="primary"
            :loading="publishing"
            :disabled="saving || !validSchema || !validExtra"
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
.agent-search {
  max-width: 360px;
  margin-bottom: 20px;
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
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}
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
