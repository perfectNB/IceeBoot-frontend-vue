<template>
  <section class="approval-shell designer" v-loading="busy">
    <AdminPageHeader title="审批流程设计" description="绘制审批路径，为每个节点指定办理角色。">
      <el-button @click="fresh">新建流程</el-button>
      <el-button v-if="can('save')" @click="save(false)">保存草稿</el-button>
      <el-button v-if="can('publish') && can('save')" type="primary" @click="save(true)">
        保存并发布
      </el-button>
    </AdminPageHeader>
    <div class="approval-panel design-basics">
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
        <div class="diagram-pane">
          <div class="approval-toolbar">
            <h3>审批路径</h3>
            <el-button :icon="Plus" @click="addNode">插入审批节点</el-button>
          </div>
          <ApprovalGraph
            :design="d"
            :roles="roles"
            :selected="selected"
            @select="selectNode"
            @branch="editBranch"
          />
        </div>
        <aside ref="inspector" class="node-inspector">
          <header class="inspector-head">
            <span class="node-glyph">
              <el-icon><component :is="node ? User : Position" /></el-icon>
            </span>
            <div>
              <small>{{ node ? '审批节点' : '开始节点' }}</small>
              <h3>{{ node?.name || '提交申请' }}</h3>
            </div>
            <el-popconfirm v-if="node" title="移除此节点及关联连线？" @confirm="removeNode">
              <template #reference><el-button text :icon="Delete" aria-label="移除当前节点" /></template>
            </el-popconfirm>
          </header>
          <div v-if="node" class="node-properties">
            <label>
              节点名称
              <el-input v-model="node.name" maxlength="120" />
            </label>
            <label>
              办理角色 · 多选会签
              <el-select
                :model-value="reviewerRoles(node)"
                multiple
                filterable
                :multiple-limit="50"
                placeholder="选择一个或多个角色"
                @update:model-value="setReviewers"
              >
                <el-option v-for="r in roles" :key="r.code" :label="r.name" :value="r.code" />
              </el-select>
            </label>
            <p v-if="node.coRoles?.length" class="routing-note">
              每个角色各派一份待办。全部通过后继续，任一方驳回即结束本轮。
            </p>
          </div>
          <div class="rules-heading">
            <h3>条件分支</h3>
            <el-button link type="primary" :icon="Plus" @click="editorIndex = -1">添加分支</el-button>
          </div>
          <p class="routing-note">
            {{
              exit.branches.length
                ? '从上往下判断，命中第一条即流转。'
                : '需要按表单内容分流时，添加条件分支。'
            }}
          </p>
          <ol class="branch-list">
            <li v-for="(branch, i) in exit.branches" :key="i">
              <button type="button" class="branch-row" @click="editorIndex = i">
                <span class="rank">{{ i + 1 }}</span>
                <span class="branch-copy">
                  <strong>{{ branchLabel(d.fields, branch) }}</strong>
                  <small>转到 {{ targetName(branch.target) }}</small>
                </span>
                <el-icon><EditPen /></el-icon>
              </button>
              <el-dropdown trigger="click" @command="branchAction(i, $event)">
                <el-button text :icon="MoreFilled" :aria-label="'分支 ' + (i + 1) + ' 更多操作'" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="up" :disabled="i === 0">提高优先级</el-dropdown-item>
                    <el-dropdown-item command="down" :disabled="i === exit.branches.length - 1">
                      降低优先级
                    </el-dropdown-item>
                    <el-dropdown-item command="remove" divided>移除分支</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </li>
          </ol>
          <label class="fallback">
            {{ exit.branches.length ? '都不匹配时' : '下一步' }}
            <el-select v-model="exit.fallback" clearable placeholder="阻止提交">
              <el-option v-for="t in targets" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
          </label>
        </aside>
      </div>
      <template v-else>
        <div class="approval-toolbar">
          <h3>申请人填写的字段</h3>
          <el-button @click="addField">＋ 新增字段</el-button>
        </div>
        <p class="approval-hint">判断字段用于选择审批路径。金额等数字业务字段也可以直接用于分支判断。</p>
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
    <ApprovalBranchEditor
      v-if="editorIndex !== null"
      :branch="exit.branches[editorIndex]"
      :all-fields="d.fields"
      :roles="roles"
      :targets="targets"
      @close="editorIndex = null"
      @save="applyBranch"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { approvalApi } from '@/api/approval'
import { hasPermission } from '@/utils/permission'
import { Delete, EditPen, MoreFilled, Plus, Position, User } from '@element-plus/icons-vue'
import ApprovalBranchEditor from './ApprovalBranchEditor.vue'
import { branchLabel, reviewerRoles, blankDesign, end, newExit, validateDesign } from '@/utils/approval'
import type { ApprovalField, ApprovalNode, ApprovalRole, Blueprint, Exit } from '@/types/approval'
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
const editorIndex = ref<number | null>(null)
const inspector = ref<HTMLElement>()
function targetName(id: string) {
  return id === end ? '审批通过' : d.value.nodes.find((n) => n.id === id)?.name || '待选择节点'
}
function selectNode(id: string) {
  selected.value = id
  if (window.matchMedia('(max-width:800px)').matches)
    nextTick(() => inspector.value?.scrollIntoView({ block: 'start' }))
}
function setReviewers(roles: string[]) {
  if (!node.value) return
  node.value.role = roles[0] || ''
  node.value.coRoles = roles.slice(1)
}
function editBranch(source: string, index: number) {
  selected.value = source
  editorIndex.value = index
}
function applyBranch(branch: Exit['branches'][number], fields: ApprovalField[], newNode?: ApprovalNode) {
  if (editorIndex.value === null) return
  d.value.fields.push(...fields)
  if (newNode) d.value.nodes.push(newNode)
  if (editorIndex.value === -1) exit.value.branches.push(branch)
  else exit.value.branches.splice(editorIndex.value, 1, branch)
  editorIndex.value = null
}
async function branchAction(i: number, action: string) {
  const list = exit.value.branches
  if (action === 'remove') {
    try {
      await ElMessageBox.confirm('移除这条分支？目标审批节点会保留在画布上。', '移除分支')
    } catch {
      return
    }
    list.splice(i, 1)
  } else {
    const to = i + (action === 'up' ? -1 : 1)
    if (to >= 0 && to < list.length) list.splice(to, 0, list.splice(i, 1)[0])
  }
}
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

<style scoped>
.designer .design-basics {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 24px;
  padding: 16px 20px;
}
.design-basics .approval-toolbar {
  order: 2;
  flex: 1 1 240px;
  margin: 0;
  justify-content: flex-end;
}
.design-basics .approval-fields {
  flex: 2 1 325px;
  margin: 0;
}
.diagram-pane,
.node-inspector {
  min-width: 0;
}
.designer .approval-studio {
  grid-template-columns: minmax(0, 1fr) minmax(290px, 34%);
  gap: 18px;
}
.node-inspector {
  align-self: start;
  padding: 16px;
  display: grid;
  gap: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color);
  scroll-margin-top: 74px;
}
.node-inspector h3 {
  margin: 0;
  font-size: 15px;
}
.inspector-head,
.rules-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.inspector-head > div {
  min-width: 0;
  flex: 1;
}
.inspector-head h3 {
  overflow-wrap: anywhere;
}
.inspector-head small,
.routing-note,
.branch-copy small {
  color: var(--el-text-color-regular);
  font-size: 12px;
}
.node-glyph {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.node-properties {
  display: grid;
  gap: 12px;
}
.node-properties label,
.fallback {
  display: grid;
  gap: 5px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.rules-heading {
  justify-content: space-between;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}
.routing-note {
  line-height: 1.5;
  margin: -6px 0 0;
}
.branch-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.branch-list:empty {
  display: none;
}
.branch-list li {
  display: flex;
  align-items: center;
  border: 1px solid var(--el-border-color-light);
  border-radius: 9px;
  padding-right: 3px;
}
.branch-list li:hover {
  border-color: var(--el-color-primary-light-5);
}
.branch-row {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
  padding: 10px;
  background: transparent;
  font: inherit;
  color: inherit;
  border: 0;
  text-align: left;
  cursor: pointer;
}
.rank {
  padding: 2px 6px;
  border-radius: 6px;
  color: var(--el-color-primary-dark-2);
  background: var(--el-color-primary-light-9);
  font-size: 12px;
}
.branch-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
  flex: 1;
}
.branch-copy strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.branch-row > .el-icon {
  color: var(--el-text-color-secondary);
}
.fallback {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}
@media (max-width: 800px) {
  .designer .approval-studio {
    grid-template-columns: 1fr;
  }
  .design-basics .approval-toolbar {
    justify-content: space-between;
  }
  .node-properties {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
