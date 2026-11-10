<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { agentConsole, providers, type ModelConfig, type Provider } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
import JsonField from './components/JsonField.vue'
import './console.scss'
const rows = ref<ModelConfig[]>([]),
  loading = ref(false),
  saving = ref(false),
  visible = ref(false),
  testVisible = ref(false),
  testing = ref(false),
  jsonValid = ref(true)
const formRef = ref<FormInstance>(),
  input = ref(''),
  output = ref(''),
  selected = ref<ModelConfig>()
function empty(): ModelConfig {
  return {
    name: '',
    provider: 'GPT',
    protocol: 'OPENAI_CHAT',
    baseUrl: '',
    apiKey: '',
    model: '',
    enabled: true,
    contextWindow: 128000,
    generation: { maxTokens: 8192, thinking: false, extra: {} },
  }
}
const form = ref<ModelConfig>(empty())
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
  jsonValid.value = true
  visible.value = true
}
function providerChanged(value: Provider) {
  form.value.protocol =
    value === 'CLAUDE' ? 'ANTHROPIC' : value === 'GEMINI' ? 'GEMINI' : 'OPENAI_CHAT'
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
  <main class="agent-console">
    <header class="console-heading">
      <div>
        <h1>模型连接</h1>
        <p class="subtitle">统一配置供应商、模型和接入地址，供业务接口与智能体共同使用。</p>
      </div>
      <div class="console-actions">
        <el-button v-if="hasPermission('ai:secret:rotate')" :loading="rotating" @click="rotateSecrets">轮换存储密文</el-button>
        <el-button @click="load">刷新</el-button>
        <el-button v-if="hasPermission('ai:model:write')" type="primary" @click="edit()">
          新建连接
        </el-button>
      </div>
    </header>
    <section class="console-panel">
      <el-table
        v-loading="loading"
        :data="rows"
        empty-text="尚未配置模型连接，点击“新建连接”开始。"
      >
        <el-table-column prop="name" label="连接名称" min-width="160" />
        <el-table-column prop="provider" label="供应商" width="130" />
        <el-table-column prop="model" label="模型" min-width="170" />
        <el-table-column prop="baseUrl" label="接入地址" min-width="230" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210">
          <template #default="{ row }">
            <el-button
              v-if="hasPermission('ai:model:invoke')"
              link
              type="primary"
              @click="test(row)"
            >
              测试
            </el-button>
            <el-button
              v-if="hasPermission('ai:model:write')"
              link
              type="primary"
              @click="edit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasPermission('ai:model:write')"
              link
              type="danger"
              @click="remove(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <el-dialog
      v-model="visible"
      :title="form.id ? '编辑模型连接' : '新建模型连接'"
      width="min(760px, 94vw)"
      class="agent-settings"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-position="top">
        <div class="form-grid">
          <el-form-item
            label="连接名称"
            prop="name"
            :rules="[{ required: true, message: '请填写连接名称' }]"
          >
            <el-input v-model="form.name" maxlength="120" />
          </el-form-item>
          <el-form-item label="供应商">
            <el-select v-model="form.provider" @change="providerChanged">
              <el-option v-for="p in providers" :key="p" :value="p" :label="p" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="接口协议">
          <el-select v-model="form.protocol">
            <el-option v-if="form.provider === 'CLAUDE'" label="Anthropic" value="ANTHROPIC" />
            <el-option v-else-if="form.provider === 'GEMINI'" label="Gemini" value="GEMINI" />
            <template v-else>
              <el-option label="OpenAI Chat Completions / 兼容接口" value="OPENAI_CHAT" />
              <el-option
                v-if="form.provider === 'GPT'"
                label="OpenAI Responses"
                value="OPENAI_RESPONSES"
              />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item
          label="Base URL"
          prop="baseUrl"
          :rules="[{ required: true, message: '请填写服务地址' }]"
        >
          <el-input v-model="form.baseUrl" placeholder="填写服务提供方的 API Base URL" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item
            label="模型名称"
            prop="model"
            :rules="[{ required: true, message: '请填写实际模型名称' }]"
          >
            <el-input v-model="form.model" />
          </el-form-item>
          <el-form-item
            label="API Key"
            prop="apiKey"
            :rules="[{ required: true, message: '请填写 API Key' }]"
          >
            <el-input
              v-model="form.apiKey"
              type="password"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
          <el-form-item label="上下文窗口">
            <el-input-number v-model="form.contextWindow" :min="1024" :step="1024" />
          </el-form-item>
          <el-form-item label="最大输出 Token">
            <el-input-number v-model="form.generation.maxTokens" :min="1" :max="1048576" />
          </el-form-item>
          <el-form-item label="思考模式">
            <el-switch v-model="form.generation.thinking" />
            <p class="field-help">须由实际模型支持；不保证返回思考过程。</p>
          </el-form-item>
          <el-form-item label="思考强度">
            <el-select
              v-model="form.generation.reasoningEffort"
              clearable
              placeholder="使用模型默认值"
            >
              <el-option v-for="v in ['low', 'medium', 'high']" :key="v" :label="v" :value="v" />
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
          <el-form-item label="启用连接"><el-switch v-model="form.enabled" /></el-form-item>
        </div>
        <el-form-item label="供应商扩展参数">
          <JsonField
            :model-value="form.generation.extra || {}"
            @update:model-value="form.generation.extra = $event"
            label="供应商扩展参数"
            :rows="4"
            @valid="jsonValid = $event"
          />
        </el-form-item>
        <p class="field-help">
          Key 加密保存，编辑时保留 ******** 表示不修改。模型配置变更后，需要重新发布 Agent
          才会用于该 Agent。
        </p>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="!jsonValid" @click="save">
          保存连接
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="testVisible"
      :title="`测试连接 · ${selected?.name || ''}`"
      width="min(760px,94vw)"
      :close-on-click-modal="!testing"
    >
      <el-form label-position="top">
        <el-form-item label="输入">
          <el-input v-model="input" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <el-button type="primary" :loading="testing" :disabled="!input.trim()" @click="invoke">
        调用模型
      </el-button>
      <pre v-if="output" class="agent-output">{{ output }}</pre>
    </el-dialog>
  </main>
</template>
