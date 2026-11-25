<script setup lang="ts">
import { computed, ref, shallowReactive, watch } from 'vue'
import { hasPermission } from '@/utils/permission'
import type { MemoryScope } from '@/api/agentMemory'
import MemoryPolicyEditor from './MemoryPolicyEditor.vue'
import MemoryProfile from './MemoryProfile.vue'
import MemorySharing from './MemorySharing.vue'

const props = defineProps<{ agentId: number; disabled?: boolean }>()
type AgentMemoryScope = Exclude<MemoryScope, 'USER'>
const scope = ref<AgentMemoryScope>('AGENT_USER')
const tab = ref('policy')
const openedScopes = ref<AgentMemoryScope[]>([])
const sharingOpened = ref(false)
interface EditorHandle { isDirty: boolean; busy: boolean; savePending: () => Promise<boolean> }
const editors = shallowReactive<Partial<Record<AgentMemoryScope, EditorHandle>>>({})
const sharing = ref<EditorHandle>()
const scopes: { value: AgentMemoryScope; label: string; description: string }[] = [
  { value: 'AGENT_USER', label: '专属画像', description: '当前智能体与当前用户之间的记忆，按用户隔离。' },
  { value: 'AGENT', label: '公共经验', description: '当前智能体的共享经验，经人工审核后供其他用户使用。' },
]
const scopeId = computed(() => props.agentId)
const description = computed(() => scopes.find(item => item.value === scope.value)?.description)
const canReadPolicy = computed(() => hasPermission('ai:memory:policy-read:api'))
const tabs = computed(() => [
  ...(canReadPolicy.value ? ['policy'] : []),
  ...(hasPermission('ai:memory:read:api') ? ['profile'] : []),
  ...(hasPermission('ai:memory:grant-read:api') ? ['sharing'] : []),
])
watch(tabs, available => { if (!available.includes(tab.value)) tab.value = available[0] || '' }, { immediate: true })
watch([tab, scope], () => {
  if (tab.value === 'policy' && canReadPolicy.value && !openedScopes.value.includes(scope.value)) openedScopes.value.push(scope.value)
  if (tab.value === 'sharing') sharingOpened.value = true
}, { immediate: true })
function remember(key: AgentMemoryScope, instance: unknown) { if (instance) editors[key] = instance as EditorHandle }
const isDirty = computed(() => Object.values(editors).some(editor => editor?.isDirty) || !!sharing.value?.isDirty)
const busy = computed(() => Object.values(editors).some(editor => editor?.busy) || !!sharing.value?.busy)
async function savePending() {
  for (const key of openedScopes.value) {
    const editor = editors[key]
    if (editor?.busy) { scope.value = key; tab.value = 'policy'; return false }
    if (editor?.isDirty && !await editor.savePending()) { scope.value = key; tab.value = 'policy'; return false }
  }
  if (sharing.value?.busy) return false
  if (sharing.value?.isDirty && !await sharing.value.savePending()) { tab.value = 'sharing'; return false }
  return true
}
defineExpose({ isDirty, busy, savePending })
</script>

<template>
  <div class="agent-memory-settings" :inert="disabled || undefined">
    <div class="memory-scope-control"><span class="scope-label">记忆范围</span><el-radio-group v-model="scope" aria-label="记忆范围"><el-radio-button v-for="item in scopes" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button></el-radio-group></div>
    <p class="memory-scope-help">{{ description }}</p>
    <el-tabs v-model="tab" class="embedded-memory-tabs">
      <el-tab-pane v-if="canReadPolicy" label="画像策略" name="policy" />
      <el-tab-pane v-if="hasPermission('ai:memory:read:api')" label="记忆内容" name="profile" />
      <el-tab-pane v-if="hasPermission('ai:memory:grant-read:api')" label="当前用户的画像授权" name="sharing" />
    </el-tabs>
    <div v-show="tab === 'policy'">
      <template v-for="item in scopes" :key="item.value">
        <MemoryPolicyEditor v-if="openedScopes.includes(item.value)" v-show="scope === item.value" :ref="instance => remember(item.value, instance)" :scope="item.value" :agent="agentId" compact />
      </template>
    </div>
    <MemoryProfile v-if="tab === 'profile' && hasPermission('ai:memory:read:api')" :key="scope + agentId" :scope="scope" :agent="scopeId" />
    <MemorySharing v-if="sharingOpened" v-show="tab === 'sharing'" ref="sharing" :agent="agentId" />
    <el-empty v-if="!tabs.length" description="当前账号没有此范围的记忆查看权限" />
  </div>
</template>

<style scoped>
.agent-memory-settings { min-width: 0; }
.memory-scope-control { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.scope-label { font-size: 12px; color: var(--el-text-color-regular); }
.memory-scope-help { margin: 12px 0 20px; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.8; }
.embedded-memory-tabs { margin-bottom: 20px; }
.embedded-memory-tabs :deep(.el-tabs__item) { font-size: 13px; }
.embedded-memory-tabs :deep(.el-tabs__header) { margin-bottom: 0; }
@media(max-width:600px) { .memory-scope-control { gap: 10px; }.memory-scope-control .el-radio-group { display: flex; flex-wrap: wrap; row-gap: 8px; } }
</style>
