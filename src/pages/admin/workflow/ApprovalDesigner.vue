<template>
  <Teleport to="body" :disabled="!fullscreen"
    ><section class="approval-shell designer" :class="{ 'designer-fullscreen': fullscreen }" v-loading="busy">
      <AdminPageHeader
        :title="blueprint ? '修改流程' : '新建审批流程'"
        :description="
          blueprint
            ? '保存草稿后可继续修改，发布后供新申请使用。'
            : '设置申请表单和审批路径，保存后可在流程定义中继续修改。'
        "
      >
        <el-button :icon="FullScreen" :aria-pressed="fullscreen" @click="fullscreen = !fullscreen">{{
          fullscreen ? '退出全屏' : '全屏画图'
        }}</el-button>
        <el-popconfirm
          v-if="blueprint?.version && can('intake')"
          :title="stopped ? '恢复接收新申请？' : '停止接收新申请？在途审批仍可继续。'"
          @confirm="toggleIntake"
        >
          <template #reference
            ><el-button>{{ stopped ? '恢复使用' : '停用模板' }}</el-button></template
          >
        </el-popconfirm>
        <el-button v-if="blueprint" @click="cancel">返回流程定义</el-button>
        <el-button v-if="can('save')" @click="openSave(false)">保存草稿</el-button>
        <el-button v-if="can('publish') && can('save')" type="primary" @click="openSave(true)">
          保存并发布
        </el-button>
      </AdminPageHeader>
      <section class="approval-panel launch-scope" aria-label="可见与发起范围">
        <header class="scope-heading">
          <span class="scope-icon" aria-hidden="true"><el-icon><User /></el-icon></span>
          <div class="scope-title">
            <h3>可见与发起范围</h3>
            <p>{{ restricted ? '拥有任一所选角色的用户可以查找并发起此流程。' : '所有用户都可以查找并发起此流程。' }}</p>
          </div>
          <el-radio-group
            v-model="restricted"
            aria-label="可见与发起范围"
            @change="changeAudience"
          >
            <el-radio-button :value="false">全部用户</el-radio-button>
            <el-radio-button :value="true">指定角色</el-radio-button>
          </el-radio-group>
        </header>
        <div v-if="restricted" class="scope-roles">
          <div class="role-toolbar">
            <span>可发起角色 <small>已选 {{ selectedRoles.length }}</small></span>
            <el-input
              v-if="roleChoices.length > 6"
              v-model="roleSearch"
              clearable
              :prefix-icon="Search"
              placeholder="搜索角色"
              aria-label="搜索可发起角色"
            />
          </div>
          <el-checkbox-group v-model="selectedRoles" class="role-choices" aria-label="可发起角色">
            <el-checkbox v-for="role in visibleRoles" :key="role.code" :value="role.code" border>
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
          <p v-if="!visibleRoles.length">{{ roleSearch ? '没有匹配的角色' : '暂无可选角色' }}</p>
        </div>
      </section>
      <el-dialog
        v-model="saveDialog"
        :title="publishing ? '发布审批流程' : '保存流程草稿'"
        append-to-body
        width="min(480px,94vw)"
        :close-on-click-modal="false"
      >
        <el-form label-position="top" @submit.prevent="save">
          <el-form-item label="流程名称" required
            ><el-input v-model="metadata.name" maxlength="120" placeholder="例如 办公用品申领"
          /></el-form-item>
          <el-form-item label="流程码" required
            ><el-input
              v-model="metadata.code"
              :disabled="!!revision"
              maxlength="64"
              placeholder="例如 purchase_review"
          /></el-form-item>
          <el-form-item label="可见与发起范围">
            <div class="scope-summary">{{ audienceLabel }}</div>
          </el-form-item>
        </el-form>
        <template #footer
          ><el-button @click="saveDialog = false">取消</el-button
          ><el-button type="primary" :loading="busy" @click="save">{{
            publishing ? '确认发布' : '确认保存'
          }}</el-button></template
        >
      </el-dialog>
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
      /></section
  ></Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { canOpenWorkflowPage } from './approvalNavigation'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { approvalApi } from '@/api/approval'
import { hasPermission } from '@/utils/permission'
import { Delete, EditPen, FullScreen, MoreFilled, Plus, Position, Search, User } from '@element-plus/icons-vue'
import ApprovalBranchEditor from './ApprovalBranchEditor.vue'
import {
  branchLabel,
  launchRoles,
  reviewerRoles,
  blankDesign,
  end,
  newExit,
  validateDesign
} from '@/utils/approval'
import type {
  ApprovalDesign,
  ApprovalField,
  ApprovalNode,
  ApprovalRole,
  Blueprint,
  Exit
} from '@/types/approval'
import ApprovalGraph from './ApprovalGraph.vue'
const can = (p: string) => hasPermission('workflow:approval:' + p + ':api')
const props = defineProps<{ blueprint?: Blueprint }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const roles = ref<ApprovalRole[]>([])
const d = ref<ApprovalDesign>(
    props.blueprint ? JSON.parse(JSON.stringify(props.blueprint.design)) : blankDesign()
  ),
  revision = ref(props.blueprint?.revision || 0),
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
onBeforeRouteLeave(discard)
async function cancel() {
  if (await discard()) emit('close')
}
async function finish() {
  if (props.blueprint) emit('close')
  else if (canOpenWorkflowPage(router, 'WorkflowDefinitions'))
    await router.push({ name: 'WorkflowDefinitions' })
  else {
    d.value = blankDesign()
    restricted.value = false
    revision.value = 0
    selected.value = '@start'
    tab.value = 'graph'
    saved = JSON.stringify(d.value)
  }
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
const fullscreen = ref(false)
const stopped = ref(!!props.blueprint?.stopped)
const saveDialog = ref(false)
const publishing = ref(false)
const restricted = ref(launchRoles(d.value).length > 0)
const selectedRoles = computed({
  get: () => launchRoles(d.value),
  set: (codes: string[]) => {
    d.value.launchRole = codes[0] || ''
    d.value.additionalLaunchRoles = codes.slice(1)
  }
})
const roleSearch = ref('')
const roleChoices = computed(() => {
  const known = new Set(roles.value.map((role) => role.code))
  const missing = selectedRoles.value.filter((code) => !known.has(code))
  return [...roles.value, ...missing.map((code) => ({ code, name: code }))]
})
const visibleRoles = computed(() => {
  const query = roleChoices.value.length > 6 ? roleSearch.value.trim().toLowerCase() : ''
  return roleChoices.value.filter((role) =>
    role.name.toLowerCase().includes(query) || role.code.toLowerCase().includes(query)
  )
})
function changeAudience() {
  roleSearch.value = ''
  if (!restricted.value) selectedRoles.value = []
}
const audienceLabel = computed(() =>
  restricted.value
    ? selectedRoles.value
        .map((code) => roles.value.find((role) => role.code === code)?.name || code)
        .join('、')
    : '全部用户'
)
const metadata = ref({ name: '', code: '' })
function openSave(publish: boolean) {
  if (restricted.value && !selectedRoles.value.length) {
    ElMessage.warning('请先选择至少一个可发起角色')
    return
  }
  publishing.value = publish
  metadata.value = { name: d.value.name, code: d.value.code }
  saveDialog.value = true
}
async function toggleIntake() {
  if (busy.value) return
  busy.value = true
  try {
    await approvalApi.setStopped(d.value.code, revision.value, !stopped.value)
    stopped.value = !stopped.value
    revision.value++
    ElMessage.success(stopped.value ? '已停用模板' : '已恢复使用')
  } finally {
    busy.value = false
  }
}
function escapeFullscreen(event: KeyboardEvent) {
  if (
    event.key === 'Escape' &&
    fullscreen.value &&
    !saveDialog.value &&
    editorIndex.value === null &&
    !document.querySelector(
      '.el-popper:not([aria-hidden="true"]):not([style*="display: none"]), .el-message-box'
    )
  )
    fullscreen.value = false
}
onMounted(() => window.addEventListener('keydown', escapeFullscreen))
onBeforeUnmount(() => window.removeEventListener('keydown', escapeFullscreen))
async function save() {
  const publish = publishing.value
  if (busy.value) return
  busy.value = true
  try {
    if (!metadata.value.name.trim()) throw Error('请填写流程名称')
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(metadata.value.code.trim()))
      throw Error('流程码须以小写字母开头，可包含小写字母、数字和下划线')
    Object.assign(d.value, {
      name: metadata.value.name.trim(),
      code: metadata.value.code.trim()
    })
    if (publish)
      validateDesign(
        d.value,
        roles.value.map((r) => r.code)
      )
    if (!revision.value || JSON.stringify(d.value) !== saved) {
      await approvalApi.save(d.value, revision.value)
      revision.value++
      saved = JSON.stringify(d.value)
    }
    if (publish) {
      await approvalApi.publish(d.value.code, revision.value)
      revision.value++
    }
    saveDialog.value = false
    fullscreen.value = false
    ElMessage.success(
      publish
        ? stopped.value
          ? '新版已发布，模板仍处于停用状态'
          : '已发布，可在发起审批时选择'
        : '草稿已保存'
    )
    await finish()
  } catch (e) {
    const message = e instanceof Error ? e.message : '保存失败'
    if (publish && !props.blueprint && revision.value) {
      ElMessage.warning('草稿已保存，发布失败：' + message)
      await finish()
    } else ElMessage.error(message)
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  busy.value = true
  try {
    if (can('roles')) roles.value = await approvalApi.roles()
  } finally {
    busy.value = false
  }
})
</script>

<style scoped>
.launch-scope {
  padding: 16px 20px;
}
.scope-heading, .role-toolbar, .role-choices {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.scope-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.scope-title {
  flex: 1 1 220px;
}
.launch-scope h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}
.launch-scope p {
  margin: 3px 0 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.scope-roles {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.role-toolbar {
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}
.role-toolbar small {
  margin-left: 6px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.role-toolbar .el-input {
  width: min(100%, 220px);
}
.role-choices {
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
  padding: 2px;
}
.role-choices :deep(.el-checkbox) {
  max-width: 100%;
  min-height: 30px;
  height: auto;
  margin: 0;
  padding: 5px 10px;
  border-radius: 7px;
}
.role-choices :deep(.el-checkbox.is-checked) {
  background: var(--el-color-primary-light-9);
}
.role-choices :deep(.el-checkbox__label) {
  white-space: normal;
  overflow-wrap: anywhere;
  font-size: 13px;
}
.scope-summary {
  color: var(--el-text-color-primary);
}

.designer-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1999;
  overflow: auto;
  align-content: start;
  padding: clamp(16px, 3vw, 40px);
  background: var(--el-bg-color-page);
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
  .node-properties {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
