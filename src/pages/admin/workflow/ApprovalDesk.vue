<template>
  <section class="approval-shell">
    <AdminPageHeader
      :title="inbox ? '审批工作台' : '我的申请'"
      :description="
        inbox ? '处理分配到你当前角色的任务，查看经手的审批。' : '从已发布的流程发起申请，在这里跟进结果。'
      "
    >
      <el-button @click="load">刷新</el-button>
      <el-button v-if="can('start') && can('published')" type="primary" @click="openStart()">
        发起审批
      </el-button>
    </AdminPageHeader>
    <div class="approval-panel">
      <el-tabs v-model="scope" @tab-change="load">
        <el-tab-pane v-if="inbox" label="我的待办" name="inbox" />
        <el-tab-pane v-if="inbox" label="我已处理" name="handled" />
        <el-tab-pane label="我发起的" name="mine" />
        <el-tab-pane label="被驳回的申请" name="rejected" />
      </el-tabs>
      <div v-loading="loading" class="approval-list">
        <div v-for="r in items" :key="r.id" class="approval-list-item">
          <span class="approval-mark">
            <el-icon><Document /></el-icon>
          </span>
          <div class="approval-list-name">
            <strong>{{ r.title }}</strong>
            <small>第 {{ r.round }} 轮 · {{ date(r.updatedAt) }}</small>
          </div>
          <el-tag :type="tone(r.status)" effect="light">{{ status[r.status] }}</el-tag>
          <el-button
            v-if="can('detail')"
            :type="scope === 'inbox' ? 'primary' : 'default'"
            @click="show(r.id)"
          >
            {{ scope === 'inbox' ? '办理' : '查看详情' }}
          </el-button>
        </div>
        <el-empty v-if="!loading && !items.length" :image-size="68" :description="empty[scope]" />
      </div>
    </div>
    <el-dialog
      v-model="starting"
      destroy-on-close
      title="发起审批"
      width="min(570px,94vw)"
      :close-on-click-modal="false"
    >
      <div v-if="fixedTemplate && chosen" class="start-template">
        <el-icon><Position /></el-icon>
        <div>
          <strong>{{ chosen.design.name }}</strong>
        </div>
        <el-tag size="small">v{{ chosen.version }}</el-tag>
      </div>
      <label v-else class="approval-label">
        已发布流程
        <el-select v-model="code" placeholder="选择审批流程" filterable @change="values = {}">
          <el-option
            v-for="b in published"
            :key="b.design.code"
            :value="b.design.code"
            :label="b.design.name + ' · v' + b.version"
          />
        </el-select>
      </label>
      <el-empty
        v-if="!published.length"
        description="暂无可发起的流程，请先在流程设计中发布"
        :image-size="55"
      />
      <ApprovalForm v-if="chosen" v-model="values" :fields="chosen.design.fields" />
      <p v-if="chosen" class="approval-hint">提交后本轮表单将锁定。被驳回后可修改并重新发起。</p>
      <template #footer>
        <el-button @click="starting = false">取消</el-button>
        <el-button type="primary" :disabled="!chosen" :loading="busy" @click="submit">提交申请</el-button>
      </template>
    </el-dialog>
    <el-drawer
      v-model="opened"
      :title="detail?.item.title || '审批详情'"
      size="min(660px,100vw)"
      destroy-on-close
    >
      <div v-if="detail" class="approval-detail">
        <div class="approval-toolbar">
          <strong>第 {{ detail.item.round }} 轮申请</strong>
          <el-tag :type="tone(detail.item.status)">{{ status[detail.item.status] }}</el-tag>
        </div>
        <p class="approval-hint">{{ detail.design.code }} · 模板 v{{ detail.version }}</p>
        <h3>本轮审批路径</h3>
        <div class="approval-path">
          <span
            >发起<small>{{ roundStarter }}</small></span
          >
          <span v-for="step in routeSteps" :key="step.id" :class="{ active: step.id === detail.item.node }">
            {{ step.name }}<small v-for="line in step.reviewers" :key="line">{{ line }}</small>
          </span>
          <span>{{ detail.item.status === 'REJECTED' ? '本轮驳回' : '结束' }}</span>
        </div>
        <template v-if="detail.tasks?.length">
          <h3>当前待办</h3>
          <div class="approval-path">
            <span v-for="t in detail.tasks" :key="t.id"
              >{{ nodeName(t.node) }} · {{ detail.roleNames?.[t.role] || t.role }}</span
            >
          </div>
        </template>
        <h3>申请信息</h3>
        <ApprovalForm v-if="editing" v-model="values" :fields="detail.design.fields" />
        <dl v-else class="approval-data">
          <template v-for="f in detail.design.fields" :key="f.key">
            <dt>{{ f.label }}</dt>
            <dd>{{ formValue(detail.values, f.key) || '—' }}</dd>
          </template>
        </dl>
        <p v-if="!detail.design.fields.length" class="approval-hint">此流程无需填写表单。</p>
        <h3>审批记录</h3>
        <ol class="approval-history">
          <li v-for="(e, i) in detail.history" :key="i">
            <div class="approval-toolbar">
              <strong>{{ e.node }} · {{ actions[e.action] }}</strong>
              <time>{{ date(e.time) }}</time>
            </div>
            <small
              >第 {{ e.round }} 轮 ·
              {{ e.action === 'APPROVE' || e.action === 'REJECT' ? '审批人' : '操作人' }} {{ e.actor
              }}{{ e.role ? ' · ' + (detail.roleNames?.[e.role] || e.role) : '' }}</small
            >
            <p v-if="e.reason">{{ e.reason }}</p>
            <details v-if="e.values && detail.design.fields.length">
              <summary>查看本轮提交的表单</summary>
              <dl class="approval-data">
                <template v-for="f in detail.design.fields" :key="f.key">
                  <dt>{{ f.label }}</dt>
                  <dd>{{ formValue(e.values, f.key) || '—' }}</dd>
                </template>
              </dl>
            </details>
          </li>
        </ol>
        <div v-if="detail.canReview && can('review')" class="approval-decision">
          <label v-if="myTasks.length > 1" class="approval-label">
            以哪个角色办理
            <el-select v-model="taskId" placeholder="请选择本次办理角色">
              <el-option
                v-for="t in myTasks"
                :key="t.id"
                :label="detail.roleNames?.[t.role] || t.role"
                :value="t.id"
              />
            </el-select>
          </label>
          <label class="approval-label">
            审批意见
            <el-input
              v-model="reason"
              type="textarea"
              :rows="3"
              maxlength="2000"
              placeholder="请填写处理依据，驳回时必填"
            />
          </label>
          <div class="approval-actions">
            <el-button type="danger" plain :loading="busy" @click="review('reject')">驳回申请</el-button>
            <el-button type="primary" :loading="busy" @click="review('approve')">审批通过</el-button>
          </div>
        </div>
        <div
          v-if="detail.mine && detail.item.status === 'REJECTED' && can('revise')"
          class="approval-actions"
        >
          <el-button v-if="editing" @click="editing = false">取消修改</el-button>
          <el-button v-else type="danger" plain @click="voidCase">作废申请</el-button>
          <el-button type="primary" :loading="busy" @click="resubmit">
            {{ editing ? '提交新一轮' : '修改并重新发起' }}
          </el-button>
        </div>
      </div>
    </el-drawer>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { Position, Document } from '@element-plus/icons-vue'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import ApprovalForm from './ApprovalForm.vue'
import { approvalApi } from '@/api/approval'
import { formValue, validateForm } from '@/utils/approval'
import { hasPermission } from '@/utils/permission'
import type {
  ApprovalDetail,
  ApprovalItem,
  ApprovalStatus,
  Blueprint,
  Decision,
  Scope,
  Values
} from '@/types/approval'
const props = defineProps<{ inbox: boolean }>()
const can = (p: string) => hasPermission('workflow:approval:' + p + ':api')
const scope = ref<Scope>(props.inbox ? 'inbox' : 'mine'),
  items = ref<ApprovalItem[]>([]),
  published = ref<Blueprint[]>([])
const detail = ref<ApprovalDetail>(),
  values = ref<Values>({}),
  reason = ref(''),
  code = ref('')
const loading = ref(false),
  busy = ref(false),
  starting = ref(false),
  opened = ref(false),
  editing = ref(false)
const chosen = computed(() => published.value.find((b) => b.design.code === code.value))
const taskId = ref('')
const myTasks = computed(() => detail.value?.tasks?.filter((t) => t.actionable) || [])
const status = { PENDING: '审批中', APPROVED: '已通过', REJECTED: '已驳回', VOID: '已作废' }
const empty = {
  inbox: '当前没有待你审批的任务',
  handled: '暂无你处理过的审批',
  mine: '还没有发起过申请',
  rejected: '暂无被驳回的申请'
}
const actions = { SUBMIT: '已提交', RESUBMIT: '已重新提交', REJECT: '驳回', APPROVE: '通过', VOID: '已作废' }
const tone = (s: ApprovalStatus) =>
  (({ PENDING: 'primary', REJECTED: 'danger', APPROVED: 'success', VOID: 'info' }) as const)[s]
const date = (s: string) => new Date(s.replace(' ', 'T')).toLocaleString('zh-CN', { hour12: false })
const nodeName = (id: string) => detail.value?.design.nodes.find((n) => n.id === id)?.name || id
const roundEvents = computed(
  () => detail.value?.history.filter((e) => e.round === detail.value?.item.round) || []
)
const roundStarter = computed(
  () => roundEvents.value.find((e) => ['SUBMIT', 'RESUBMIT'].includes(e.action))?.actor
)
const routeSteps = computed(() => {
  const item = detail.value
  if (!item) return []
  return item.route.map((id) => {
    const node = item.design.nodes.find((n) => n.id === id)!
    const uniqueName = item.design.nodes.filter((n) => n.name === node.name).length === 1
    const reviewers = roundEvents.value
      .filter(
        (e) =>
          (e.action === 'APPROVE' || e.action === 'REJECT') &&
          (e.nodeId ? e.nodeId === id : uniqueName && e.node === node.name)
      )
      .map((e) => e.actor + ' · ' + actions[e.action])
    if (item.item.status === 'PENDING' && item.item.node === id) {
      const pending = item.tasks?.length
        ? item.tasks.filter((t) => t.node === id).map((t) => t.role)
        : [node.role]
      for (const role of pending) {
        const names = item.candidates?.[role]?.join('、')
        reviewers.push((item.roleNames?.[role] || role) + '待办' + (names ? ' · ' + names : ''))
      }
    }
    return { id, name: node.name, reviewers }
  })
})
let listRequest = 0,
  detailRequest = 0
async function load() {
  if (!can('list')) return
  const seq = ++listRequest
  loading.value = true
  items.value = []
  try {
    const result = await approvalApi.list(scope.value)
    if (seq === listRequest) items.value = result
  } finally {
    if (seq === listRequest) loading.value = false
  }
}
async function show(id: string) {
  const seq = ++detailRequest
  const result = await approvalApi.detail(id)
  if (seq !== detailRequest) return
  detail.value = result
  taskId.value = myTasks.value.length === 1 ? myTasks.value[0].id : ''
  reason.value = ''
  editing.value = false
  opened.value = true
}
const fixedTemplate = ref(false)
async function openStart(preselected?: string, version?: string) {
  if (preselected) {
    const match = await approvalApi.template(true, preselected)
    if (match.stopped || (version && String(match.version) !== version)) {
      ElMessage.warning(match.stopped ? '流程已停用，无法发起新申请' : '模板已发布新版，请重新选择流程')
      return
    }
    published.value = [match]
  } else {
    published.value = await approvalApi.published()
  }
  fixedTemplate.value = !!preselected
  code.value = preselected || ''
  values.value = {}
  starting.value = true
}
async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  try {
    await action()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败，请刷新后重试')
  } finally {
    busy.value = false
  }
}
async function submit() {
  const b = chosen.value
  if (!b) return
  await run(async () => {
    validateForm(b.design, values.value)
    const id = await approvalApi.submit(b.design.code, b.version, values.value)
    starting.value = false
    scope.value = 'mine'
    ElMessage.success('申请已提交')
    await load()
    if (can('detail')) await show(id)
  })
}
async function review(action: Decision) {
  const d = detail.value
  if (!d) return
  if (myTasks.value.length && !taskId.value) {
    ElMessage.warning('请选择本次办理角色')
    return
  }
  if (action === 'reject' && !reason.value.trim()) {
    ElMessage.warning('请填写驳回理由')
    return
  }
  await run(async () => {
    await approvalApi.review(d.item.id, action, {
      revision: d.item.revision,
      taskId: taskId.value || undefined,
      reason: reason.value
    })
    ElMessage.success(action === 'reject' ? '本轮已驳回' : '已提交通过意见')
    await show(d.item.id)
    await load()
  })
}
async function resubmit() {
  const d = detail.value
  if (!d) return
  if (!editing.value) {
    values.value = { ...d.values }
    editing.value = true
    return
  }
  await run(async () => {
    validateForm(d.design, values.value)
    await approvalApi.revise(d.item.id, 'resubmit', { revision: d.item.revision, values: values.value })
    ElMessage.success('新一轮审批已发起')
    await show(d.item.id)
    await load()
  })
}
async function voidCase() {
  const d = detail.value
  if (!d) return
  try {
    await ElMessageBox.confirm('作废后将结束这份申请，所有审批记录会保留。', '作废申请', { type: 'warning' })
  } catch {
    return
  }
  await run(async () => {
    await approvalApi.revise(d.item.id, 'void', { revision: d.item.revision })
    await show(d.item.id)
    await load()
  })
}
const route = useRoute()
onMounted(async () => {
  await load()
  if (typeof route.query.approval === 'string' && can('start') && can('published')) {
    await openStart(
      route.query.approval,
      typeof route.query.version === 'string' ? route.query.version : undefined
    )
  }
})
</script>

<style scoped>
.approval-path small {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.start-template {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: 10px;
  background: var(--el-color-primary-light-9);
}
.start-template > .el-icon {
  color: var(--el-color-primary);
  font-size: 19px;
}
.start-template > div {
  flex: 1;
  display: grid;
  gap: 3px;
  overflow-wrap: anywhere;
}
.start-template small {
  color: var(--el-text-color-regular);
}
</style>
