<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { agentConsole, type Capability, type CapabilityKind } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
import JsonField from './components/JsonField.vue'
import KeyValueField from './components/KeyValueField.vue'
import './console.scss'
const route = useRoute()
const catalog: Record<string, { kind: CapabilityKind; title: string; description: string }> = {
  skills: {
    kind: 'SKILL',
    title: '技能',
    description: '管理 SKILL.md、配套脚本和资源，发布 Agent 时固定资源内容。',
  },
  tools: {
    kind: 'TOOL',
    title: '工具',
    description: '配置 HTTP 工具或沙箱脚本工具，运行时只向 Agent 开放已绑定能力。',
  },
  mcps: {
    kind: 'MCP',
    title: 'MCP 服务',
    description: '连接远程 MCP 服务，并明确允许 Agent 使用的工具名称。',
  },
  sandboxes: {
    kind: 'SANDBOX',
    title: '沙箱模板',
    description: '管理阿里云 E2B 模板；平台连接密钥由服务端 application 配置。',
  },
  knowledge: {
    kind: 'KNOWLEDGE',
    title: '知识库连接',
    description: '将已有知识库的 HTTP 检索接口注册为 Agent 可调用的检索工具。',
  },
}
const page = computed(() => catalog[route.path.split('/').pop() || ''] || catalog.skills!)
const all = ref<Capability[]>([]),
  loading = ref(false),
  visible = ref(false),
  saving = ref(false),
  validJson = ref(true)
const rows = computed(() => all.value.filter((c) => c.kind === page.value.kind)),
  tools = computed(() => all.value.filter((c) => c.kind === 'TOOL' && c.enabled))
const formRef = ref<FormInstance>()
function empty(): Capability {
  return {
    kind: page.value.kind,
    code: '',
    name: '',
    description: '',
    enabled: true,
    skill: {
      content: '# 使用说明\n\n说明何时使用本技能，以及执行步骤。',
      resources: {},
      toolIds: [],
    },
    tool: {
      kind: 'HTTP',
      url: '',
      method: 'POST',
      headers: {},
      inputSchema: { type: 'object', properties: {} },
      script: '',
      projectApi: false,
      permissionCode: '',
    },
    mcp: { url: '', headers: {}, allowedTools: [] },
    sandbox: { templateId: '', timeoutSeconds: 600 },
  }
}
const form = ref<Capability>(empty())
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
function edit(c?: Capability) {
  form.value = c ? JSON.parse(JSON.stringify(c)) : empty()
  validJson.value = true
  visible.value = true
}
async function save() {
  if (!validJson.value || !(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    await agentConsole.saveCapability(form.value)
    visible.value = false
    ElMessage.success('能力配置已保存')
    await load()
  } finally {
    saving.value = false
  }
}
async function remove(c: Capability) {
  await ElMessageBox.confirm(`删除“${c.name}”？已发布 Agent 的快照仍保留原配置。`, '删除能力', {
    type: 'warning',
  })
  await agentConsole.deleteCapability(c.id!, c.kind)
  await load()
}
watch(() => page.value.kind, () => {
  visible.value = false
  return load()
}, { immediate: true })
</script>
<template>
  <main class="agent-console">
    <header class="console-heading">
      <div>
        <h1>{{ page.title }}</h1>
        <p class="subtitle">{{ page.description }}</p>
      </div>
      <div class="console-actions">
        <el-button @click="load">刷新</el-button>
        <el-button v-if="hasPermission('ai:capability:write')" type="primary" @click="edit()">
          新建{{ page.title }}
        </el-button>
      </div>
    </header>
    <section class="console-panel">
      <el-table v-loading="loading" :data="rows" :empty-text="`尚未配置${page.title}。`">
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="code" label="唯一编码" min-width="180" />
        <el-table-column prop="description" label="说明" min-width="250" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="hasPermission('ai:capability:write')" label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="edit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <el-dialog
      v-model="visible"
      :title="`${form.id ? '编辑' : '新建'}${page.title}`"
      width="min(900px,94vw)"
      class="agent-settings"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-position="top">
        <div class="form-grid">
          <el-form-item
            label="名称"
            prop="name"
            :rules="[{ required: true, message: '请填写名称' }]"
          >
            <el-input v-model="form.name" maxlength="120" />
          </el-form-item>
          <el-form-item
            label="唯一编码"
            prop="code"
            :rules="[
              {
                required: true,
                pattern: /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/,
                message: '字母开头，最多64位字母、数字、下划线或连字符',
              },
            ]"
          >
            <el-input v-model="form.code" :disabled="!!form.id" />
          </el-form-item>
        </div>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="2000" />
        </el-form-item>
        <template v-if="form.kind === 'SKILL' && form.skill">
          <el-form-item label="SKILL.md">
            <el-input
              v-model="form.skill.content"
              type="textarea"
              :rows="12"
              aria-label="Skill 操作说明"
            />
          </el-form-item>
          <el-form-item label="关联工具">
            <el-select
              v-model="form.skill.toolIds"
              multiple
              filterable
              placeholder="随此技能一起挂载的工具"
            >
              <el-option
                v-for="tool in tools"
                :key="tool.id"
                :label="`${tool.name} · ${tool.code}`"
                :value="tool.id!"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="脚本与配套资源">
            <KeyValueField v-model="form.skill.resources" label="资源" multiline />
          </el-form-item>
          <p class="field-help">
            使用 scripts/analyze.py、references/guide.md 等相对路径。执行脚本需要给 Agent 配置 E2B。
          </p>
        </template>
        <template v-if="(form.kind === 'TOOL' || form.kind === 'KNOWLEDGE') && form.tool">
          <el-form-item v-if="form.kind === 'TOOL'" label="执行方式">
            <el-radio-group v-model="form.tool.kind">
              <el-radio-button value="HTTP">HTTP 接口</el-radio-button>
              <el-radio-button value="SCRIPT">E2B 脚本</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <template v-if="form.tool.kind === 'HTTP'">
            <div class="form-grid">
              <el-form-item label="请求方法">
                <el-select v-model="form.tool.method">
                  <el-option
                    v-for="m in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
                    :key="m"
                    :label="m"
                    :value="m"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="使用本项目登录身份">
                <el-switch v-model="form.tool.projectApi" />
                <p class="field-help">仅向本项目接口传递当前用户身份，并校验目标接口权限。</p>
              </el-form-item>
            </div>
            <el-form-item :label="form.tool.projectApi ? '项目接口相对路径' : 'HTTP 接口地址'">
              <el-input
                v-model="form.tool.url"
                :placeholder="form.tool.projectApi ? '/v1/example' : 'https://...'"
              />
            </el-form-item>
            <el-form-item v-if="form.tool.projectApi" label="目标接口权限码">
              <el-input v-model="form.tool.permissionCode" placeholder="例如 system:user:list" />
            </el-form-item>
            <el-form-item label="固定请求头">
              <KeyValueField v-model="form.tool.headers" label="请求头" secret />
            </el-form-item>
          </template>
          <el-form-item v-else label="沙箱执行命令">
            <el-input
              v-model="form.tool.script"
              type="textarea"
              :rows="5"
              placeholder="python3 scripts/analyze.py"
            />
            <p class="field-help">
              工具参数以 JSON 从标准输入传入；命令始终在 Agent 配置的 E2B 中运行。
            </p>
          </el-form-item>
          <el-form-item label="输入参数 JSON Schema">
            <JsonField
              v-model="form.tool.inputSchema"
              label="工具输入参数"
              @valid="validJson = $event"
            />
          </el-form-item>
        </template>
        <template v-if="form.kind === 'MCP' && form.mcp">
          <el-form-item label="Streamable HTTP 地址">
            <el-input v-model="form.mcp.url" placeholder="https://.../mcp" />
          </el-form-item>
          <el-form-item label="允许使用的远端工具名称">
            <el-select
              v-model="form.mcp.allowedTools"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="输入远端工具名并按回车确认"
            />
          </el-form-item>
          <el-form-item label="认证请求头">
            <KeyValueField v-model="form.mcp.headers" label="请求头" secret />
          </el-form-item>
          <p class="field-help">
            只注册这里指定的工具，不支持 *。模型看到的工具名称会加上该服务的编码前缀。
          </p>
        </template>
        <template v-if="form.kind === 'SANDBOX' && form.sandbox">
          <el-form-item label="阿里云 E2B 模板 ID / 名称">
            <el-input v-model="form.sandbox.templateId" />
          </el-form-item>
          <el-form-item label="沙箱存活时间（秒）">
            <el-input-number
              v-model="form.sandbox.timeoutSeconds"
              :min="60"
              :max="3600"
              :step="60"
            />
          </el-form-item>
          <p class="field-help">
            不同 Agent 可以选择不同模板。E2B 的 API 地址、Domain 和 Key 在服务端配置。
          </p>
        </template>
        <el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="!validJson" @click="save">
          保存配置
        </el-button>
      </template>
    </el-dialog>
  </main>
</template>
