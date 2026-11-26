<template>
  <el-dialog
    :model-value="true"
    :title="branch ? '编辑条件分支' : '添加条件分支'"
    width="min(560px, 94vw)"
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <div class="branch-editor">
      <h3>当以下条件全部满足</h3>
      <div v-for="(c, i) in conditions" :key="i" class="condition">
        <el-select v-model="c.field" aria-label="判断字段" placeholder="选择字段">
          <el-option
            v-for="f in fields"
            :key="f.key"
            :label="f.label || f.key"
            :value="f.key"
            :disabled="conditions.some((other, j) => j !== i && other.field === f.key)"
          />
        </el-select>
        <span>等于</span>
        <el-input v-model="c.value" aria-label="比较值" placeholder="填写值" maxlength="2000" />
        <el-button
          text
          :icon="Close"
          aria-label="移除条件"
          :disabled="conditions.length === 1"
          @click="conditions.splice(i, 1)"
        />
      </div>
      <div class="inline-actions">
        <el-button
          link
          type="primary"
          :disabled="!unused"
          @click="conditions.push({ field: unused!.key, value: '' })"
        >
          ＋ 添加且条件
        </el-button>
        <el-button link @click="addingField = true">新建判断字段</el-button>
      </div>
      <div v-if="addingField" class="new-field">
        <label>
          显示名称
          <el-input v-model="fieldLabel" placeholder="例如 状态" maxlength="120" />
        </label>
        <label>
          字段名
          <el-input v-model="fieldKey" placeholder="例如 state" maxlength="64" />
        </label>
        <label>
          字段类型
          <el-select v-model="fieldType">
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
          </el-select>
        </label>
        <el-button @click="addField">使用此字段</el-button>
      </div>
      <h3>交给谁审批</h3>
      <el-radio-group v-model="destination">
        <el-radio-button value="existing">已有节点</el-radio-button>
        <el-radio-button value="new">新建节点</el-radio-button>
      </el-radio-group>
      <el-select
        v-if="destination === 'existing'"
        v-model="target"
        aria-label="目标节点"
        placeholder="选择目标节点"
      >
        <el-option v-for="n in targets" :key="n.id" :label="n.name" :value="n.id" />
      </el-select>
      <div v-else class="node-fields">
        <label>
          节点名称
          <el-input v-model="nodeName" maxlength="120" placeholder="例如 财务复核" />
        </label>
        <label>
          办理角色
          <el-select v-model="nodeRole" filterable placeholder="选择角色">
            <el-option v-for="r in roles" :key="r.code" :label="r.name" :value="r.code" />
          </el-select>
        </label>
      </div>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
    </div>
    <template #footer>
      <el-button @click="emit('close')">取消</el-button>
      <el-button type="primary" @click="confirm">保存分支</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { isApprovalNumber, newExit } from '@/utils/approval'
import type { ApprovalField, ApprovalNode, ApprovalRole, Exit } from '@/types/approval'
const props = defineProps<{
  branch?: Exit['branches'][number]
  allFields: ApprovalField[]
  roles: ApprovalRole[]
  targets: { id: string; name: string }[]
}>()
const emit = defineEmits<{
  close: []
  save: [branch: Exit['branches'][number], fields: ApprovalField[], node?: ApprovalNode]
}>()
const pendingFields = ref<ApprovalField[]>([])
const fields = computed(() => [
  ...props.allFields.filter((f) => f.kind === 'routing'),
  ...pendingFields.value
])
const conditions = ref(
  props.branch?.conditions.length
    ? props.branch.conditions.map((c) => ({ ...c }))
    : [{ field: fields.value[0]?.key || '', value: '' }]
)
const unused = computed(() => fields.value.find((f) => !conditions.value.some((c) => c.field === f.key)))
const target = ref(props.branch?.target || '')
const destination = ref(props.branch?.target || props.targets.length ? 'existing' : 'new')
const nodeName = ref(''),
  nodeRole = ref(''),
  error = ref('')
const addingField = ref(!fields.value.length),
  fieldLabel = ref(''),
  fieldKey = ref(''),
  fieldType = ref<ApprovalField['type']>('text')
function addField() {
  const key = fieldKey.value.trim(),
    label = fieldLabel.value.trim()
  if (!label || !/^[\p{L}_][\p{L}\p{N}_]{0,63}$/u.test(key)) {
    error.value = '请输入显示名称和有效的字段名'
    return
  }
  if ([...props.allFields, ...pendingFields.value].some((f) => f.key === key)) {
    error.value = '字段名已被使用'
    return
  }
  pendingFields.value.push({ key, label, kind: 'routing', type: fieldType.value, required: true })
  const empty = conditions.value.find((c) => !c.field)
  if (empty) empty.field = key
  else conditions.value.push({ field: key, value: '' })
  fieldKey.value = ''
  fieldLabel.value = ''
  addingField.value = false
  error.value = ''
}
function confirm() {
  error.value = ''
  if (addingField.value && (fieldLabel.value || fieldKey.value)) {
    error.value = '请先点「使用此字段」'
    return
  }
  const used = new Set<string>()
  for (const c of conditions.value) {
    const f = fields.value.find((f) => f.key === c.field)
    if (!f || !c.value.trim() || used.has(c.field)) {
      error.value = '请为每项条件选择不同的字段并填写比较值'
      return
    }
    if (f.type === 'number' && !isApprovalNumber(c.value)) {
      error.value = f.label + ' 的比较值需要填写数字'
      return
    }
    used.add(c.field)
  }
  let next: ApprovalNode | undefined
  if (destination.value === 'new') {
    if (!nodeName.value.trim() || !nodeRole.value) {
      error.value = '请填写新节点名称并选择办理角色'
      return
    }
    next = {
      id: 'node_' + crypto.randomUUID().slice(0, 8),
      name: nodeName.value.trim(),
      role: nodeRole.value,
      exit: newExit()
    }
  } else if (!props.targets.some((n) => n.id === target.value)) {
    error.value = '请选择目标节点'
    return
  }
  emit(
    'save',
    { conditions: conditions.value.map((c) => ({ ...c })), target: next?.id || target.value },
    pendingFields.value,
    next
  )
}
</script>
<style scoped>
.branch-editor,
.branch-editor label {
  display: grid;
  gap: 10px;
}
.branch-editor h3 {
  margin: 6px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.branch-editor h3:not(:first-child) {
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.condition {
  display: grid;
  grid-template-columns: minmax(80px, 1fr) auto minmax(70px, 1fr) 32px;
  gap: 8px;
  align-items: center;
}
.condition span,
.node-fields label,
.new-field label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.inline-actions {
  display: flex;
  gap: 12px;
}
.new-field,
.node-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.new-field {
  background: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 10px;
  align-items: end;
}
.error {
  margin: 0;
  color: var(--el-color-danger);
}
@media (max-width: 480px) {
  .node-fields {
    grid-template-columns: 1fr;
  }
  .condition {
    gap: 4px;
  }
}
</style>
