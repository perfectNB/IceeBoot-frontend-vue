<template>
  <section class="approval-shell" v-loading="busy">
    <AdminPageHeader title="审批流程设计" description="绘制审批路径，为每个节点指定办理角色。">
      <el-button @click="fresh">新建流程</el-button>
      <el-button v-if="can('save')" @click="save(false)">保存草稿</el-button>
      <el-button v-if="can('publish') && can('save')" type="primary" @click="save(true)">
        保存并发布
      </el-button>
    </AdminPageHeader>
    <div class="approval-panel">
      <div class="approval-toolbar">
        <el-select
          :model-value="current || undefined"
          placeholder="打开已保存的草稿"
          clearable
          @change="selectDraft"
        >
          <el-option
            v-for="b in drafts"
            :key="b.design.code"
            :label="b.design.name + ' · ' + b.design.code"
            :value="b.design.code"
          />
        </el-select>
        <el-tag effect="plain">{{ version ? '已发布 v' + version : '未发布' }}</el-tag>
      </div>
      <div class="approval-fields">
        <label>
          流程名称
          <el-input v-model="d.name" maxlength="120" />
        </label>
        <label>
          唯一流程码
          <el-input
            v-model="d.code"
            :disabled="!!revision"
            placeholder="例如 purchase_review"
            maxlength="64"
          />
        </label>
      </div>
    </div>
    <div class="approval-panel">
      <el-tabs v-model="tab">
        <el-tab-pane label="流程图" name="graph" />
        <el-tab-pane :label="'表单字段 · ' + d.fields.length" name="fields" />
      </el-tabs>
      <div v-if="tab === 'graph'" class="approval-studio">
        <div>
          <div class="approval-toolbar">
            <h3>审批路径</h3>
            <el-button size="small" @click="addNode">＋ 审批节点</el-button>
          </div>
          <ApprovalGraph :design="d" :roles="roles" :selected="selected" @select="selected = $event" />
        </div>
        <aside class="approval-inspector">
          <div class="approval-toolbar">
            <h3>{{ node ? '审批节点设置' : '开始节点设置' }}</h3>
            <el-button v-if="node" link type="danger" @click="removeNode">移除节点</el-button>
          </div>
          <template v-if="node">
            <label>
              节点名称
              <el-input v-model="node.name" maxlength="120" />
            </label>
            <label>
              办理角色
              <el-select v-model="node.role" filterable placeholder="选择能看到此待办的角色">
                <el-option v-for="r in roles" :key="r.code" :label="r.name" :value="r.code" />
              </el-select>
            </label>
          </template>
          <label>
            默认下一步
            <el-select v-model="exit.fallback" placeholder="无匹配时阻止提交" clearable>
              <el-option v-for="t in targets" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
          </label>
          <div class="approval-toolbar">
            <h3>条件分支</h3>
            <el-button link type="primary" @click="addBranch">添加分支</el-button>
          </div>
          <p class="approval-hint">同一分支的条件须全部满足。多条分支匹配时，按从上到下的顺序选择第一条。</p>
          <div v-for="(b, i) in exit.branches" :key="i" class="approval-rule">
            <div class="approval-toolbar">
              <strong>分支 {{ i + 1 }}</strong>
              <el-button link @click="exit.branches.splice(i, 1)">移除</el-button>
            </div>
            <div v-for="(c, k) in b.conditions" :key="k" class="approval-predicate">
              <el-select v-model="c.field" aria-label="判断字段" placeholder="字段">
                <el-option v-for="f in routingFields" :key="f.key" :label="f.label || f.key" :value="f.key" />
              </el-select>
              <span>=</span>
              <el-input v-model="c.value" aria-label="比较值" placeholder="值" />
              <el-button link aria-label="移除判断条件" @click="b.conditions.splice(k, 1)">×</el-button>
            </div>
            <el-button
              link
              type="primary"
              @click="b.conditions.push({ field: routingFields[0]?.key || '', value: '' })"
            >
              ＋ 且满足
            </el-button>
            <label>
              流转到
              <el-select v-model="b.target">
                <el-option v-for="t in targets" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </label>
            <el-button link type="primary" @click="addBranchNode(i)">在此分支新建审批节点</el-button>
          </div>
        </aside>
      </div>
      <template v-else>
        <div class="approval-toolbar">
          <h3>申请人填写的字段</h3>
          <el-button @click="addField">＋ 新增字段</el-button>
        </div>
        <p class="approval-hint">判断字段用于选择审批路径，业务字段随每次申请留档。</p>
        <el-empty v-if="!d.fields.length" description="还没有表单字段" :image-size="55" />
        <div v-for="(f, i) in d.fields" :key="i" class="approval-field-row">
          <label>
            显示名称
            <el-input v-model="f.label" placeholder="例如 公司名称" />
          </label>
          <label>
            唯一字段名
            <el-input v-model="f.key" placeholder="companyName" />
          </label>
          <label>
            用途
            <el-select v-model="f.kind" @change="f.kind === 'routing' && (f.required = true)">
              <el-option label="业务字段" value="business" />
              <el-option label="判断字段" value="routing" />
            </el-select>
          </label>
          <label>
            类型
            <el-select v-model="f.type">
              <el-option label="文本" value="text" />
              <el-option label="数字" value="number" />
            </el-select>
          </label>
          <el-checkbox v-model="f.required" :disabled="f.kind === 'routing'">必填</el-checkbox>
          <el-button link type="danger" @click="d.fields.splice(i, 1)">移除</el-button>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { approvalApi } from '@/api/approval'
import { hasPermission } from '@/utils/permission'
import { blankDesign, end, newExit, validateDesign } from '@/utils/approval'
import type { ApprovalRole, Blueprint } from '@/types/approval'
import ApprovalGraph from './ApprovalGraph.vue'
const can = (p: string) => hasPermission('workflow:approval:' + p + ':api')
const drafts = ref<Blueprint[]>([]),
  roles = ref<ApprovalRole[]>([])
const d = ref(blankDesign()),
  current = ref(''),
  revision = ref(0),
  version = ref(0),
  selected = ref('@start'),
  tab = ref('graph'),
  busy = ref(false)
let saved = JSON.stringify(d.value)
const node = computed(() => d.value.nodes.find((n) => n.id === selected.value))
const exit = computed(() => node.value?.exit || d.value.start)
const targets = computed(() => [
  ...d.value.nodes.filter((n) => n.id !== selected.value),
  ...(node.value ? [{ id: end, name: '结束 · 审批通过' }] : [])
])
const routingFields = computed(() => d.value.fields.filter((f) => f.kind === 'routing'))
async function discard() {
  if (JSON.stringify(d.value) === saved) return true
  try {
    await ElMessageBox.confirm('当前修改尚未保存，确定切换流程？', '未保存的草稿')
    return true
  } catch {
    return false
  }
}
function open(b?: Blueprint) {
  d.value = b ? JSON.parse(JSON.stringify(b.design)) : blankDesign()
  current.value = b?.design.code || ''
  revision.value = b?.revision || 0
  version.value = b?.version || 0
  selected.value = '@start'
  saved = JSON.stringify(d.value)
}
onBeforeRouteLeave(discard)
async function fresh() {
  if (await discard()) open()
}
async function selectDraft(code: string) {
  if (await discard()) open(drafts.value.find((b) => b.design.code === code))
}
function createNode(next: string) {
  const id = 'node_' + crypto.randomUUID().slice(0, 8)
  d.value.nodes.push({ id, name: '新审批节点', role: '', exit: newExit(next || end) })
  return id
}
function addNode() {
  const from = exit.value
  const id = createNode(from.fallback)
  from.fallback = id
  selected.value = id
}
function addBranchNode(index: number) {
  const branch = exit.value.branches[index]
  const id = createNode(branch.target)
  branch.target = id
  selected.value = id
}
function removeNode() {
  const id = selected.value
  for (const e of [d.value.start, ...d.value.nodes.map((n) => n.exit)]) {
    if (e.fallback === id) e.fallback = ''
    e.branches = e.branches.filter((b) => b.target !== id)
  }
  d.value.nodes = d.value.nodes.filter((n) => n.id !== id)
  selected.value = '@start'
}
function addField() {
  d.value.fields.push({ key: '', label: '', kind: 'business', type: 'text', required: true })
}
function addBranch() {
  if (!routingFields.value.length) {
    tab.value = 'fields'
    ElMessage.info('请先添加一个判断字段')
    return
  }
  exit.value.branches.push({ conditions: [{ field: routingFields.value[0].key, value: '' }], target: '' })
}
async function save(publish: boolean) {
  if (busy.value) return
  busy.value = true
  try {
    if (publish)
      validateDesign(
        d.value,
        roles.value.map((r) => r.code)
      )
    if (!revision.value || JSON.stringify(d.value) !== saved) {
      await approvalApi.save(d.value, revision.value)
      revision.value++
      current.value = d.value.code
      saved = JSON.stringify(d.value)
    }
    if (publish) {
      await approvalApi.publish(d.value.code, revision.value)
      revision.value++
      version.value++
    }
    ElMessage.success(publish ? '已发布，可在发起审批时选择' : '草稿已保存')
    drafts.value = await approvalApi.drafts()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  busy.value = true
  try {
    ;[drafts.value, roles.value] = await Promise.all([
      can('drafts') ? approvalApi.drafts() : [],
      can('roles') ? approvalApi.roles() : []
    ])
  } finally {
    busy.value = false
  }
})
</script>
