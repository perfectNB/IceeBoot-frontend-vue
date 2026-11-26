<template>
  <div class="graph-scroll" aria-label="审批流程图">
    <div class="graph" :style="{ width: layout.width + 'px', height: layout.height + 'px' }">
      <svg :width="layout.width" :height="layout.height" aria-hidden="true">
        <path
          v-for="(edge, i) in edges"
          :key="i"
          :d="edge.path"
          :class="{ conditional: edge.conditional }"
          fill="none"
        />
      </svg>
      <button
        v-for="n in layout.boxes"
        :key="n.id"
        type="button"
        class="graph-node"
        :class="[n.kind, { selected: n.id === selected }]"
        :style="{ left: n.x + 'px', top: n.y + 'px', height: n.h + 'px' }"
        :disabled="n.id === end"
        :title="n.label"
        :aria-label="n.kind === 'rule' ? '分支条件 ' + n.label : n.label"
        @click="select(n)"
      >
        <span class="graph-icon" aria-hidden="true">
          <el-icon><component :is="icons[n.kind]" /></el-icon>
        </span>
        <span class="graph-copy">
          <strong>{{ n.label }}</strong>
          <small v-if="n.caption">{{ n.caption }}</small>
        </span>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { Position, CircleCheck, User, Switch } from '@element-plus/icons-vue'
import { end, branchLabel } from '@/utils/approval'
import type { ApprovalDesign, ApprovalRole, Exit } from '@/types/approval'
const props = defineProps<{ design: ApprovalDesign; roles: ApprovalRole[]; selected: string }>()
const emit = defineEmits<{ select: [id: string]; branch: [source: string, index: number] }>()
const icons = { start: Position, end: CircleCheck, review: User, rule: Switch }
interface Box {
  id: string
  kind: keyof typeof icons
  label: string
  caption?: string
  source?: string
  index?: number
}
interface Edge {
  from: string
  to: string
  conditional: boolean
}
const diagram = computed(() => {
  const boxes: Box[] = [{ id: '@start', kind: 'start', label: '提交申请' }]
  const links: Edge[] = []
  function connect(source: string, exit: Exit) {
    exit.branches.forEach((b, index) => {
      const id = source + '#' + index
      boxes.push({ id, kind: 'rule', label: branchLabel(props.design.fields, b), source, index })
      links.push({ from: source, to: id, conditional: true }, { from: id, to: b.target, conditional: true })
    })
    if (exit.fallback) links.push({ from: source, to: exit.fallback, conditional: false })
  }
  connect('@start', props.design.start)
  for (const n of props.design.nodes) {
    boxes.push({
      id: n.id,
      kind: 'review',
      label: n.name || '未命名节点',
      caption: props.roles.find((r) => r.code === n.role)?.name || n.role || '待选择角色'
    })
    connect(n.id, n.exit)
  }
  boxes.push({ id: end, kind: 'end', label: '审批通过' })
  return { boxes, links }
})
function select(n: Box) {
  if (n.kind === 'rule' && n.source !== undefined && n.index !== undefined) {
    emit('select', n.source)
    emit('branch', n.source, n.index)
  } else emit('select', n.id)
}
const layout = computed(() => {
  const { boxes, links } = diagram.value
  const levels = new Map<string, number>([['@start', 0]])
  const pending = boxes.filter((n) => n.id !== '@start')
  const parents = new Map<string, string[]>()
  for (const link of links) parents.set(link.to, [...(parents.get(link.to) || []), link.from])
  while (pending.length) {
    const index = pending.findIndex((n) => (parents.get(n.id) || []).every((id) => levels.has(id)))
    const n = pending.splice(Math.max(0, index), 1)[0]
    levels.set(n.id, 1 + Math.max(0, ...(parents.get(n.id) || []).map((id) => levels.get(id) || 0)))
  }
  const rows: Box[][] = []
  for (const n of boxes) (rows[levels.get(n.id) || 0] ??= []).push(n)
  const cols = Math.max(...rows.map((r) => r.length)),
    pitch = 182
  let top = 22
  const placed = rows.flatMap((row) => {
    const height = (n: Box) => (n.kind === 'review' ? 58 : n.kind === 'rule' ? 42 : 40)
    const h = Math.max(...row.map(height))
    const items = row.map((n, i) => ({
      ...n,
      x: 12 + (i + (cols - row.length) / 2) * pitch,
      y: top + (h - height(n)) / 2,
      h: height(n)
    }))
    top += h + 34
    return items
  })
  return { boxes: placed, width: cols * pitch + 8, height: top - 12 }
})
const edges = computed(() => {
  const positions = new Map(layout.value.boxes.map((n) => [n.id, n]))
  return diagram.value.links.flatMap((link) => {
    const a = positions.get(link.from),
      b = positions.get(link.to)
    if (!a || !b) return []
    const x = a.x + 81,
      y = a.y + a.h,
      tx = b.x + 81,
      mid = (y + b.y) / 2
    return [
      {
        conditional: link.conditional,
        path: `M ${x} ${y} C ${x} ${mid}, ${tx} ${mid}, ${tx} ${b.y} m -3 -5 l 3 5 3 -5`
      }
    ]
  })
})
</script>
<style scoped>
.graph-scroll {
  min-width: 0;
  min-height: 285px;
  max-height: 65vh;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-fill-color-lighter);
  background-image: radial-gradient(
    color-mix(in srgb, var(--el-text-color-placeholder) 45%, transparent) 0.8px,
    transparent 0.9px
  );
  background-size: 15px 15px;
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
  stroke-width: 1.6;
}
.graph path.conditional {
  stroke: var(--el-color-primary-light-3);
}
.graph-node {
  position: absolute;
  width: 162px;
  display: flex;
  align-items: center;
  gap: 9px;
  text-align: left;
  padding: 8px 10px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font: inherit;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgb(20 45 68 / 7%);
}
.graph-node.selected,
.graph-node:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}
.graph-node:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
.graph-icon {
  width: 29px;
  height: 29px;
  flex: none;
  display: grid;
  place-items: center;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 8px;
}
.graph-copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}
.graph-copy strong,
.graph-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.graph-copy strong {
  font-size: 13px;
  font-weight: 600;
}
.graph-copy small {
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.start,
.end {
  border-radius: 30px;
  width: 122px;
  margin-left: 20px;
  justify-content: center;
}
.start .graph-icon,
.end .graph-icon,
.rule .graph-icon {
  height: auto;
  width: auto;
  background: none;
}
.end .graph-icon {
  color: var(--el-color-success);
}
.end:disabled {
  opacity: 1;
  cursor: default;
}
.rule {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  border-color: var(--el-color-primary-light-7);
  box-shadow: none;
  border-radius: 20px;
  justify-content: center;
}
.rule .graph-copy strong {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow-wrap: anywhere;
  white-space: normal;
  line-height: 1.25;
  font-weight: 550;
  font-size: 12px;
}
</style>
