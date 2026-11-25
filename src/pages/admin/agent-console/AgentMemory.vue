<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Notebook, User, Connection, Collection } from '@element-plus/icons-vue'
import { hasPermission } from '@/utils/permission'
import { memoryApi, type MemoryScope } from '@/api/agentMemory'
import MemoryProfile from './components/MemoryProfile.vue'
import MemoryPolicyEditor from './components/MemoryPolicyEditor.vue'
import MemorySharing from './components/MemorySharing.vue'
import './console.scss'

const agents = ref<{ id: number; name: string }[]>([])
const agent = ref<number>()
const scope = ref<MemoryScope>('AGENT_USER')
const tab = ref('profile')
const loading = ref(false)
const scopeId = computed(() => scope.value === 'USER' ? 0 : agent.value)
const canReadPolicy = computed(() => hasPermission(scope.value === 'USER' ? 'ai:memory:platform-policy-read:api' : 'ai:memory:policy-read:api'))
watch(canReadPolicy, allowed => { if (!allowed && tab.value === 'policy') tab.value = 'profile' })
const scopeLabels = [
  { value: 'AGENT_USER', label: '我的专属画像', icon: User, description: '只在你与当前智能体之间使用' },
  { value: 'USER', label: '我的通用画像', icon: Connection, description: '由你决定哪些智能体可以使用' },
  { value: 'AGENT', label: '智能体公共经验', icon: Collection, description: '经审核后，为该智能体的用户共享' },
]
async function load() {
  if (!hasPermission('ai:memory:read-agents:api')) { scope.value = 'USER'; return }
  loading.value = true
  try {
    agents.value = await memoryApi.agents()
    agent.value = agents.value[0]?.id
    if (!agent.value) scope.value = 'USER'
  } finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <main class="agent-console memory-page">
    <header class="console-heading memory-heading">
      <div class="console-title-block"><span class="console-title-icon"><el-icon><Notebook /></el-icon></span><div><p class="console-eyebrow">智能体的持续上下文</p><h1>长期记忆</h1><p class="subtitle">留下有用的信息，让下一次对话从了解你开始。</p></div></div>
    </header>
    <section v-if="tab !== 'sharing'" class="memory-scopes" aria-label="记忆范围">
      <button v-for="item in scopeLabels" :key="item.value" type="button" :aria-pressed="scope === item.value" class="memory-scope" @click="scope = item.value as MemoryScope">
        <span class="scope-icon"><el-icon><component :is="item.icon" /></el-icon></span><span class="scope-copy"><strong>{{ item.label }}</strong><span>{{ item.description }}</span></span><span class="scope-indicator" aria-hidden="true" />
      </button>
    </section>
    <section class="memory-workspace">
      <div class="memory-workspace-bar">
        <el-tabs v-model="tab" class="memory-tabs">
          <el-tab-pane label="记忆内容" name="profile" />
          <el-tab-pane v-if="canReadPolicy" label="画像策略" name="policy" />
          <el-tab-pane v-if="hasPermission('ai:memory:grant-read:api')" label="共享授权" name="sharing" />
        </el-tabs>
        <div class="memory-agent-picker"><label for="memory-agent">当前智能体</label><el-select id="memory-agent" v-model="agent" :loading="loading" :disabled="scope === 'USER' && tab !== 'sharing'" placeholder="选择智能体" filterable aria-label="当前智能体"><el-option v-for="item in agents" :key="item.id" :label="item.name" :value="item.id" /></el-select></div>
      </div>
      <div class="memory-workspace-body">
        <MemorySharing v-if="tab === 'sharing' && agent" :key="agent" :agent="agent" />
        <MemoryProfile v-else-if="tab === 'profile' && scopeId !== undefined" :key="scope + scopeId" :scope="scope" :agent="scopeId" />
        <MemoryPolicyEditor v-else-if="tab === 'policy' && scopeId !== undefined" :key="scope + scopeId" :scope="scope" :agent="scopeId" />
        <el-empty v-else :description="loading ? '正在加载智能体…' : '选择一个智能体，开始管理它的记忆'" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.memory-page { max-width: 1480px; padding: 14px 16px 28px; }
.memory-heading { margin-bottom: 24px; }
.memory-scopes { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; margin-bottom: 24px; }
.memory-scope { display: flex; align-items: center; gap: 14px; padding: 19px 20px; border: 1px solid var(--el-border-color-light); background: var(--el-bg-color); border-radius: 12px; text-align: left; cursor: pointer; color: var(--el-text-color-primary); font: inherit; transition: border-color .18s, background-color .18s; }
.memory-scope:hover { border-color: var(--el-color-primary-light-5); }
.memory-scope[aria-pressed='true'] { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.memory-scope:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
.scope-icon { display: grid; place-items: center; width: 40px; height: 40px; flex-shrink: 0; border-radius: 10px; color: var(--el-text-color-regular); background: var(--el-fill-color-light); font-size: 19px; }
.memory-scope[aria-pressed='true'] .scope-icon { color: var(--el-color-primary); background: var(--el-bg-color); }
.scope-copy { display: grid; gap: 7px; min-width: 0; }
.scope-copy strong { font-size: 14px; font-weight: 600; }
.scope-copy > span { font-size: 12px; line-height: 1.5; color: var(--el-text-color-regular); }
.scope-indicator { width: 12px; height: 12px; margin-left: auto; flex-shrink: 0; border: 1px solid var(--el-border-color); border-radius: 50%; }
.memory-scope[aria-pressed='true'] .scope-indicator { background: var(--el-color-primary); border-color: var(--el-color-primary); box-shadow: inset 0 0 0 3px var(--el-bg-color); }
.memory-workspace { border: 1px solid var(--el-border-color-light); background: var(--el-bg-color); border-radius: 14px; overflow: hidden; }
.memory-workspace-bar { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 0 26px; border-bottom: 1px solid var(--el-border-color-lighter); }
.memory-tabs { min-width: 0; }
.memory-tabs :deep(.el-tabs__header) { margin: 0; }
.memory-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.memory-tabs :deep(.el-tabs__item) { height: 66px; font-size: 14px; }
.memory-agent-picker { display: flex; gap: 12px; align-items: center; flex-shrink: 0; }
.memory-agent-picker label { font-size: 12px; color: var(--el-text-color-secondary); }
.memory-agent-picker .el-select { width: 190px; }
.memory-workspace-body { padding: 28px; min-height: 350px; }
@media(max-width:1100px) { .memory-scope { padding: 16px 14px; gap: 10px; } .scope-indicator { display: none; } }
@media(max-width:760px) { .memory-page { padding: 6px 0 20px; } .memory-scopes { grid-template-columns: 1fr; gap: 8px; margin-bottom: 16px; } .memory-scope { padding: 12px 14px; } .scope-copy { gap: 3px; } .memory-workspace-bar { padding: 0 16px; flex-direction: column-reverse; align-items: stretch; gap: 0; } .memory-agent-picker { padding-top: 16px; } .memory-agent-picker .el-select { flex: 1; } .memory-tabs :deep(.el-tabs__item) { height: 54px; } .memory-workspace-body { padding: 20px 16px; } }
@media(prefers-reduced-motion:reduce) { .memory-scope { transition: none; } }
</style>
