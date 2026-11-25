<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
  { value: 'AGENT_USER', label: '我的专属画像' },
  { value: 'USER', label: '我的通用画像' },
  { value: 'AGENT', label: '智能体公共经验' },
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
    <header class="console-heading"><div><h1>长期记忆</h1><p class="subtitle">管理对话中保留的画像，以及每个智能体可以使用的字段。</p></div></header>
    <el-card shadow="never">
      <el-form inline label-position="top" class="memory-filter">
        <el-form-item label="智能体">
          <el-select v-model="agent" :loading="loading" placeholder="选择智能体" filterable>
            <el-option v-for="item in agents" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="tab !== 'sharing'" label="记忆范围">
          <el-select v-model="scope"><el-option v-for="item in scopeLabels" :key="item.value" :label="item.label" :value="item.value" /></el-select>
        </el-form-item>
      </el-form>
      <el-tabs v-model="tab">
        <el-tab-pane label="记忆内容" name="profile" />
        <el-tab-pane v-if="canReadPolicy" label="画像策略" name="policy" />
        <el-tab-pane v-if="hasPermission('ai:memory:grant-read:api')" label="共享授权" name="sharing" />
      </el-tabs>
      <MemorySharing v-if="tab === 'sharing' && agent" :key="agent" :agent="agent" />
      <MemoryProfile v-else-if="tab === 'profile' && scopeId !== undefined" :key="scope + scopeId" :scope="scope" :agent="scopeId" />
      <MemoryPolicyEditor v-else-if="tab === 'policy' && scopeId !== undefined" :key="scope + scopeId" :scope="scope" :agent="scopeId" />
      <el-empty v-else description="请选择智能体" />
    </el-card>
  </main>
</template>

<style scoped>
.memory-page { max-width: 1120px; margin-inline: auto; }
.memory-filter .el-select { width: min(220px, 70vw); }
</style>
