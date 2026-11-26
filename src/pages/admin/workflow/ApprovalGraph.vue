<template>
  <div class="graph-scroll" aria-label="审批流程图">
    <div class="graph" :style="{ width: width + 'px', height: height + 'px' }">
      <svg :width="width" :height="height" aria-hidden="true">
        <path
          v-for="(edge, i) in edges"
          :key="i"
          :d="edge.path"
          :class="{ conditional: edge.label }"
          fill="none"
        >
          <title>{{ edge.label || '默认流转' }}</title>
        </path>
      </svg>
      <button
        v-for="n in boxes"
        :key="n.id"
        type="button"
        class="graph-node"
        :class="{ selected: n.id === selected, endpoint: n.id.startsWith('@') }"
        :aria-pressed="n.id === selected"
        :style="{ left: n.x + 'px', top: n.y + 'px' }"
        :disabled="n.id === end"
        @click="$emit('select', n.id)"
      >
        <span class="graph-kind">{{ n.id === '@start' ? '开始' : n.id === end ? '结束' : '角色审批' }}</span>
        <strong>{{ n.name }}</strong>
        <small v-if="n.role">{{ roles.find((r) => r.code === n.role)?.name || n.role }}</small>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { end } from '@/utils/approval'
import type { ApprovalDesign, ApprovalRole } from '@/types/approval'
const props = defineProps<{ design: ApprovalDesign; roles: ApprovalRole[]; selected: string }>()
defineEmits<{ select: [id: string] }>()
const nodes = computed(() => [
  { id: '@start', name: '提交申请', role: '', exit: props.design.start },
  ...props.design.nodes,
  { id: end, name: '审批通过', role: '', exit: { branches: [], fallback: '' } }
])
const connections = computed(() =>
  nodes.value.flatMap((n) => [
    ...n.exit.branches.map((b) => ({
      from: n.id,
      to: b.target,
      label: b.conditions.map((c) => c.field + ' = ' + c.value).join(' 且 ')
    })),
    ...(n.exit.fallback ? [{ from: n.id, to: n.exit.fallback, label: '' }] : [])
  ])
)
const layout = computed(() => {
  const levels = new Map<string, number>([['@start', 0]])
  const pending = nodes.value.filter((n) => n.id !== '@start')
  while (pending.length) {
    const index = pending.findIndex((n) =>
      connections.value.filter((e) => e.to === n.id).every((e) => levels.has(e.from))
    )
    const node = pending.splice(index < 0 ? 0 : index, 1)[0]
    const parents = connections.value.filter((e) => e.to === node.id).map((e) => levels.get(e.from) || 0)
    levels.set(node.id, Math.max(0, ...parents) + 1)
  }
  const rows = new Map<number, typeof nodes.value>()
  for (const n of nodes.value) {
    const level = levels.get(n.id) || 0
    rows.set(level, [...(rows.get(level) || []), n])
  }
  const cols = Math.max(...Array.from(rows.values(), (r) => r.length))
  const boxes = [...rows].flatMap(([level, row]) =>
    row.map((n, i) => ({ ...n, x: 20 + (i + (cols - row.length) / 2) * 170, y: 22 + level * 108 }))
  )
  return { boxes, width: cols * 170 + 22, height: Math.max(...boxes.map((n) => n.y)) + 95 }
})
const boxes = computed(() => layout.value.boxes)
const width = computed(() => layout.value.width)
const height = computed(() => layout.value.height)
const edges = computed(() =>
  connections.value.flatMap((e) => {
    const a = boxes.value.find((n) => n.id === e.from),
      b = boxes.value.find((n) => n.id === e.to)
    if (!a || !b) return []
    const x = a.x + 74,
      y = a.y + 66,
      tx = b.x + 74,
      mid = (y + b.y) / 2
    return [
      { label: e.label, path: `M ${x} ${y} C ${x} ${mid}, ${tx} ${mid}, ${tx} ${b.y} m -3 -5 l 3 5 3 -5` }
    ]
  })
)
</script>

<style scoped>
.graph-scroll {
  background-color: var(--el-fill-color-lighter);
  background-image: radial-gradient(var(--el-border-color) 1px, transparent 1px);
  background-size: 16px 16px;
  overflow: auto;
  min-height: 320px;
  max-height: 65vh;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.graph {
  position: relative;
  margin: auto;
}
.graph svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.graph path {
  stroke: var(--el-text-color-placeholder);
  stroke-width: 1.8;
}
.graph path.conditional {
  stroke: var(--el-color-primary);
  stroke-dasharray: 5 3;
}
.graph-node {
  position: absolute;
  width: 148px;
  height: 66px;
  border: 1px solid var(--el-border-color);
  border-left: 3px solid var(--el-color-primary);
  border-radius: 10px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  display: grid;
  align-content: center;
  text-align: left;
  padding: 6px 12px;
  cursor: pointer;
  box-shadow: 0 3px 8px #182d4610;
}
.graph-node.endpoint {
  border-left-color: var(--el-color-success);
}
.graph-node.selected,
.graph-node:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
.graph-node:disabled {
  opacity: 1;
  cursor: default;
}
.graph-kind,
.graph-node small {
  color: var(--el-text-color-regular);
  font-size: 11px;
}
.graph-node strong,
.graph-node small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
