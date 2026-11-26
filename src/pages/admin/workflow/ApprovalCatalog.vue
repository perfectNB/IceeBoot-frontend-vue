<template>
  <section class="approval-shell" v-loading="busy">
    <AdminPageHeader
      :title="diagram ? '审批流程图' : '已发布审批模板'"
      description="选择流程查看表单和审批路径。"
    />
    <div class="approval-panel">
      <div class="approval-toolbar">
        <h3>已发布流程</h3>
        <el-button @click="load">刷新</el-button>
      </div>
      <el-empty v-if="!items.length" description="暂无已发布的审批流程" :image-size="64" />
      <div v-for="b in items" :key="b.design.code" class="approval-list-item">
        <span class="approval-mark">
          <el-icon><Share /></el-icon>
        </span>
        <div class="approval-list-name">
          <strong>{{ b.design.name }}</strong>
          <small>{{ b.design.code }} · v{{ b.version }} · {{ b.design.nodes.length }} 个审批节点</small>
        </div>
        <el-button @click="selected = b">查看流程图</el-button>
        <router-link
          v-if="canStart"
          :to="{ path: '/admin/workflow/instance', query: { approval: b.design.code } }"
        >
          发起审批
        </router-link>
      </div>
    </div>
    <el-drawer
      :model-value="!!selected"
      size="min(700px,100vw)"
      title="审批流程图"
      @close="selected = undefined"
    >
      <template v-if="selected">
        <h3>{{ selected.design.name }}</h3>
        <ApprovalGraph :design="selected.design" :roles="[]" :selected="nodeId" @select="nodeId = $event" />
        <div v-if="exit" class="approval-rule">
          <strong>流转条件</strong>
          <p v-for="(b, i) in exit.branches" :key="i">
            {{ b.conditions.map((c) => c.field + ' = ' + c.value).join(' 且 ') }} → {{ target(b.target) }}
          </p>
          <p>默认 → {{ target(exit.fallback) }}</p>
        </div>
        <h3>申请表单</h3>
        <p v-for="f in selected.design.fields" :key="f.key">
          {{ f.label }} · {{ f.kind === 'routing' ? '判断字段' : '业务字段' }}
        </p>
      </template>
    </el-drawer>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Share } from '@element-plus/icons-vue'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import ApprovalGraph from './ApprovalGraph.vue'
import { approvalApi } from '@/api/approval'
import { hasPermission } from '@/utils/permission'
import type { Blueprint } from '@/types/approval'
defineProps<{ diagram?: boolean }>()
const busy = ref(false),
  items = ref<Blueprint[]>([]),
  selected = ref<Blueprint>(),
  nodeId = ref('@start')
const canStart = computed(
  () => hasPermission('workflow:approval:start:api') && hasPermission('workflow:instance')
)
const exit = computed(() =>
  nodeId.value === '@start'
    ? selected.value?.design.start
    : selected.value?.design.nodes.find((n) => n.id === nodeId.value)?.exit
)
const target = (id: string) =>
  selected.value?.design.nodes.find((n) => n.id === id)?.name || (id === '@end' ? '结束' : '阻止提交')
watch(selected, () => {
  nodeId.value = '@start'
})
async function load() {
  busy.value = true
  try {
    items.value = await approvalApi.published()
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
