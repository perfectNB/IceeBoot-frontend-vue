<script setup lang="ts">
import UsageOverviewPopover from './UsageOverviewPopover.vue'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { computed, ref } from 'vue'
import { ChatDotRound, Clock, Share, Plus, Refresh, Search, Setting } from '@element-plus/icons-vue'
import type { AgentView, ModelConfig } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'

const props = defineProps<{
  agents: AgentView[]
  models: ModelConfig[]
  loading: boolean
  failed: boolean
}>()
const emit = defineEmits<{
  refresh: []
  schedules: []
  edit: [agent?: AgentView]
  run: [agent: AgentView]
}>()
const keyword = ref('')
const status = ref('all')
const statuses = [
  { value: 'all', label: '全部' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '未发布' },
]
const modelNames = computed(() => new Map(props.models.map(model => [model.id, model.name + ' · ' + model.model])))
const rows = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return props.agents.filter(({ draft, activeVersion }) =>
    (status.value === 'all' || (activeVersion > 0) === (status.value === 'published')) &&
    ([draft.name, draft.code, draft.description].join(' ')).toLowerCase().includes(query),
  )
})
function clearFilters() {
  keyword.value = ''
  status.value = 'all'
}
</script>
<template>
  <AdminPageHeader title="智能体" :count="loading && !agents.length ? undefined : agents.length">
      <el-button v-if="hasPermission('ai:schedule:read:api')" :icon="Clock" @click="emit('schedules')">定时任务</el-button>
      <el-button v-if="hasPermission('ai:agent:write')" type="primary" :icon="Plus" @click="emit('edit')">新建智能体</el-button>
      <UsageOverviewPopover v-if="hasPermission('ai:run:usage:api')" />
    </AdminPageHeader>
  <section class="directory" aria-label="智能体列表" :aria-busy="loading">
    <div class="directory-tools">
      <el-radio-group v-model="status" aria-label="按发布状态筛选" size="small">
        <el-radio-button v-for="item in statuses" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
      </el-radio-group>
      <div class="search-tools">
        <el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索名称、编码或职责" aria-label="搜索智能体" />
        <el-button :icon="Refresh" :loading="loading" aria-label="刷新智能体列表" title="刷新" @click="emit('refresh')" />
      </div>
    </div>
    <div v-if="failed" role="alert" class="load-error">
      智能体列表加载失败。<el-button link type="primary" @click="emit('refresh')">重试</el-button>
    </div>
    <p v-if="loading && !agents.length" class="directory-state" role="status">正在加载智能体…</p>
    <ul v-else-if="rows.length" class="directory-list">
      <li v-for="agent in rows" :key="agent.draft.id" class="agent-card admin-lift">
        <div class="identity">
          <el-avatar shape="square" :size="42" :src="agent.draft.avatar || undefined">{{ agent.draft.name.slice(0, 1) }}</el-avatar>
          <div class="identity-text">
            <h2>{{ agent.draft.name }}</h2>
            <span class="agent-code">{{ agent.draft.code }}</span>
          </div>
        </div>
        <p v-if="agent.draft.description" class="description" :title="agent.draft.description">{{ agent.draft.description }}</p>
        <div class="runtime">
          <span class="model">{{ modelNames.get(agent.draft.modelConfigId) || (agent.draft.modelConfigId ? '模型 #' + agent.draft.modelConfigId : '未选择模型') }}</span>
          <span class="metadata">{{ agent.draft.sandboxEnabled ? 'E2B 沙箱' : '接口与工具' }} · 调用 {{ agent.callCount }} 次</span>
          <span v-if="agent.draft.childAgentIds?.length" class="children"><el-icon aria-hidden="true"><Share /></el-icon>含 {{ agent.draft.childAgentIds.length }} 个子智能体</span>
        </div>
        <section class="token-totals" aria-label="已记录的累计模型用量">
          <h3>累计 Token</h3>
          <dl>
            <div><dt>输入</dt><dd>{{ agent.totalInputTokens?.toLocaleString() ?? '—' }}</dd></div>
            <div><dt>输出</dt><dd>{{ agent.totalOutputTokens?.toLocaleString() ?? '—' }}</dd></div>
            <div title="只合计可确认的缓存读取量"><dt>已确认命中</dt><dd>{{ agent.totalCachedTokens?.toLocaleString() ?? '—' }}</dd></div>
          </dl>
        </section>
        <footer class="card-footer">
          <span class="release" :class="{ published: agent.activeVersion > 0 }">{{ agent.activeVersion ? '已发布 v' + agent.activeVersion : '未发布' }}</span>
          <div class="card-actions">
            <el-button v-if="hasPermission('ai:agent:write')" :icon="Setting" @click="emit('edit', agent)">配置</el-button>
            <el-button v-if="hasPermission('ai:agent:invoke')" class="chat-button" type="primary" :icon="ChatDotRound"
              :disabled="!agent.activeVersion" @click="emit('run', agent)">开始对话</el-button>
          </div>
        </footer>
      </li>
    </ul>
    <el-empty v-else-if="!failed" :image-size="64" :description="agents.length ? '没有匹配的智能体' : '尚未创建智能体'">
      <el-button v-if="agents.length" @click="clearFilters">清除筛选</el-button>
      <el-button v-else-if="hasPermission('ai:agent:write')" type="primary" @click="emit('edit')">新建智能体</el-button>
    </el-empty>
  </section>
</template>
<style scoped>
.token-totals { padding: 10px 12px; margin-bottom: 12px; background: var(--el-fill-color-light); border-radius: 8px; }
.token-totals h3 { margin: 0 0 7px; font-size: 12px; font-weight: 600; color: var(--el-text-color-regular); }
.token-totals dl { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.token-totals dt { font-size: 11px; color: var(--el-text-color-secondary); }
.token-totals dd { margin: 2px 0 0; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.directory { container-type: inline-size; }
.directory-tools, .search-tools, .identity, .card-footer, .card-actions { display: flex; align-items: center; }
.directory-tools { justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.search-tools { gap: 8px; width: min(100%, 340px); }
.search-tools .el-input { min-width: 0; }
.directory-list {
  list-style: none; margin: 0; padding: 0; display: grid; gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 285px), 1fr));
}
.agent-card {
  display: flex; flex-direction: column; min-width: 0; padding: 17px;
  border: 1px solid var(--admin-line); border-radius: var(--admin-radius);
  background: var(--admin-surface); box-shadow: var(--admin-shadow);
}
.agent-card:focus-within { border-color: var(--el-color-primary-light-5); }
.identity { gap: 10px; min-width: 0; }
.identity .el-avatar {
  flex: none; border-radius: 11px; background: var(--el-color-primary-light-9);
  color: var(--el-color-primary); font-weight: 650;
}
.identity-text, .runtime { min-width: 0; overflow-wrap: anywhere; }
.identity h2 { margin: 0 0 3px; color: var(--el-text-color-primary); font-size: 16px; line-height: 1.4; font-weight: 650; }
.agent-code { color: var(--el-text-color-regular); font: 12px/1.4 ui-monospace, monospace; }
.description { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 10px 0 0; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
.runtime { display: grid; gap: 3px; padding: 12px 0; margin-top: auto; }
.model { font-size: 13px; }
.metadata, .children { color: var(--el-text-color-regular); font-size: 12px; line-height: 1.6; }
.children { display: inline-flex; align-items: center; gap: 4px; }
.card-footer { gap: 8px; flex-wrap: wrap; justify-content: space-between; border-top: 1px solid var(--el-border-color-lighter); padding-top: 12px; }
.release { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--el-text-color-regular); }
.release::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--el-text-color-placeholder); }
.published::before { background: var(--el-color-success); }
.card-actions { gap: 6px; }
.card-actions .el-button + .el-button { margin-left: 0; }
.chat-button:not(:disabled) { --el-button-bg-color: #245dda; --el-button-border-color: #245dda; --el-button-hover-bg-color: #194fc2; --el-button-hover-border-color: #194fc2; }
.directory-state, .load-error { padding: 20px; color: var(--el-text-color-regular); }
@container (max-width: 500px) {
  .search-tools { width: 100%; }
}
</style>
