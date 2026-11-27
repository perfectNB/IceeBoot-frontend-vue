import type {
  ApprovalDesign,
  ApprovalDetail,
  ApprovalEvent,
  Blueprint,
  Change,
  Decision,
  OwnerAction,
  Scope,
  Values
} from '@/types/approval'
import { approvalPath, launchRoles, reviewerRoles, pageApprovalCases, validateDesign } from '@/utils/approval'
import { mockRoles } from '../data/role'
import { mockUsers } from '../data/user'
import { demoUserId } from './auth'

const drafts = new Map<string, Blueprint>()
const stoppedCodes = new Set<string>()
const published = new Map<string, Blueprint>()
interface Case extends ApprovalDetail {
  owner: number
}
const cases = new Map<string, Case>()
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v))
const time = () => new Date().toISOString()
function actor() {
  const u = mockUsers.find((u) => Number(u.id) === demoUserId())
  if (!u) throw Error('请先登录')
  return u
}
function requireAccess(action: string) {
  if (!actor().permissions?.includes('workflow:approval:' + action + ':api')) throw Error('缺少审批权限')
}
function canHandle(role: string) {
  return !!actor().roles?.includes(role) && mockRoles.some((r) => r.code === role && r.status === 'active')
}
function visible(b: Blueprint) {
  const audience = launchRoles(b.design)
  return !audience.length || audience.some(canHandle)
}
function allowed(c: Case) {
  return c.item.status === 'PENDING' && c.tasks?.some((t) => canHandle(t.role))
}
function application(id: string, revision?: number) {
  const c = cases.get(id)
  if (!c) throw Error('找不到申请')
  if (revision !== undefined && c.item.revision !== revision) throw Error('申请已更新，请刷新后处理')
  return c
}
function event(
  c: Case,
  action: ApprovalEvent['action'],
  node: string,
  reason = '',
  values: Values | null = null,
  role?: string,
  nodeId?: string
) {
  const u = actor()
  c.item.updatedAt = time()
  c.history.push({
    round: c.item.round,
    action,
    node,
    reason,
    time: c.item.updatedAt,
    actor: u.nickname || u.username,
    nodeId,
    role,
    actorId: Number(u.id),
    values: copy(values)
  })
}
function move(c: Case, node?: string) {
  const next = c.design.nodes.find((n) => n.id === node)
  c.tasks = next
    ? reviewerRoles(next).map((role) => ({ id: crypto.randomUUID(), role, node: next.id, actionable: false }))
    : []
  c.item.node = node || ''
  c.item.status = node ? 'PENDING' : 'APPROVED'
}

function scopedItems(scope: Scope) {
  requireAccess('list')
  const userId = Number(actor().id)
  return [...cases.values()]
    .filter((c) => {
      if (scope === 'inbox') return allowed(c)
      if (scope === 'handled') {
        return c.history.some((e) => e.actorId === userId && ['REJECT', 'APPROVE'].includes(e.action))
      }
      return c.owner === userId && (scope === 'mine' || c.item.status === 'REJECTED')
    })
    .map((c) => c.item)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))
}

export const mockApproval = {
  async page(live: boolean, page: number, size: number, keyword?: string) {
    requireAccess(live ? 'published' : 'drafts')
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1 || size > 100)
      throw Error('分页参数无效')
    const source = live ? published : drafts
    const codes = [...source.keys()]
      .filter((code) => {
        const b = source.get(code)!
        return (
          !live ||
          (visible(b) &&
            (keyword === undefined ||
              (!stoppedCodes.has(code) &&
                b.design.name.toLocaleLowerCase().includes(keyword.trim().toLocaleLowerCase()))))
        )
      })
      .sort()
    const total = codes.length
    const pages = Math.ceil(total / size)
    const current = Math.min(page, Math.max(1, pages))
    const records = codes.slice((current - 1) * size, current * size).map((code) => {
      const b = source.get(code)!
      return {
        code,
        name: published.get(code)?.design.name || b.design.name,
        version: b.version,
        revision: drafts.get(code)!.revision,
        stopped: stoppedCodes.has(code),
        changed:
          !live && !!b.version && JSON.stringify(b.design) !== JSON.stringify(published.get(code)?.design)
      }
    })
    return { records, total, current, size, pages, hasPrevious: current > 1, hasNext: current < pages }
  },
  async template(live: boolean, code: string, released = false) {
    requireAccess(live ? 'published' : 'drafts')
    const b = (live || released ? published : drafts).get(code)
    if (!b || (live && !visible(b))) throw Error('流程模板不存在，请刷新')
    return copy({ ...b, revision: drafts.get(code)!.revision, stopped: stoppedCodes.has(code) })
  },
  async setStopped(code: string, revision: number, stopped: boolean) {
    requireAccess('intake')
    const b = drafts.get(code)
    if (!b?.version || b.revision !== revision) throw Error('记录已更新，请刷新后重试')
    if (stopped) stoppedCodes.add(code)
    else stoppedCodes.delete(code)
    b.revision++
  },
  async drafts() {
    requireAccess('drafts')
    return copy([...drafts.values()])
  },
  async published() {
    requireAccess('published')
    return copy([...published.values()].filter((b) => visible(b) && !stoppedCodes.has(b.design.code)))
  },
  async roles() {
    requireAccess('roles')
    return mockRoles.filter((r) => r.status === 'active').map((r) => ({ code: r.code, name: r.name }))
  },
  async save(design: ApprovalDesign, revision: number) {
    requireAccess('save')
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(design.code) || !design.name.trim()) throw Error('请检查流程码和名称')
    if (design.additionalLaunchRoles?.length && !design.launchRole) throw Error('请选择可见与发起角色')
    const old = drafts.get(design.code)
    if ((old?.revision || 0) !== revision) throw Error('流程码已存在或草稿已更新')
    drafts.set(design.code, { design: copy(design), revision: revision + 1, version: old?.version || 0 })
  },
  async publish(code: string, revision: number) {
    requireAccess('publish')
    const b = drafts.get(code)
    if (!b || b.revision !== revision) throw Error('草稿已更新')
    if (
      launchRoles(b.design).some((code) => !mockRoles.some((r) => r.code === code && r.status === 'active'))
    )
      throw Error('请选择有效的流程可见角色')
    validateDesign(
      b.design,
      mockRoles.filter((r) => r.status === 'active').map((r) => r.code)
    )
    b.version++
    b.revision++
    published.set(code, copy(b))
  },
  async submit(code: string, version: number, values: Values) {
    requireAccess('start')
    const b = published.get(code)
    if (!b || b.version !== version) throw Error('流程发布版本已变化')
    if (!visible(b)) throw Error('无权发起该流程')
    if (stoppedCodes.has(code)) throw Error('流程已停用，无法发起新申请')
    const route = approvalPath(b.design, values).map((n) => n.id)
    const id = crypto.randomUUID()
    const c: Case = {
      item: {
        id,
        title: b.design.name,
        round: 1,
        revision: 1,
        node: '',
        status: 'PENDING',
        updatedAt: time()
      },
      owner: Number(actor().id),
      mine: true,
      canReview: false,
      version,
      design: copy(b.design),
      history: [],
      route,
      values: copy(values)
    }
    move(c, route[0])
    event(c, 'SUBMIT', '发起申请', '', values)
    cases.set(id, c)
    return id
  },
  async list(scope: Scope) {
    return copy(scopedItems(scope))
  },
  async casePage(scope: Scope, page: number, size: number, keyword = '') {
    return copy(pageApprovalCases(scopedItems(scope), page, size, keyword))
  },
  async detail(id: string): Promise<ApprovalDetail> {
    requireAccess('detail')
    const c = application(id)
    const mine = c.owner === Number(actor().id)
    if (!mine && !allowed(c) && !c.history.some((e) => e.actorId === Number(actor().id)))
      throw Error('无权查看该申请')
    return copy({
      ...c,
      mine,
      canReview: !!allowed(c),
      candidates: Object.fromEntries(
        (c.tasks || []).map((t) => [
          t.role,
          mockUsers
            .filter(
              (u) =>
                u.status === 'active' &&
                u.roles?.includes(t.role) &&
                mockRoles.some((r) => r.code === t.role && r.status === 'active')
            )
            .map((u) => u.nickname || u.username)
        ])
      ),
      roleNames: Object.fromEntries(
        mockRoles
          .filter((r) => c.design.nodes.some((n) => reviewerRoles(n).includes(r.code)))
          .map((r) => [r.code, r.name])
      ),
      tasks: c.tasks?.map((t) => ({ ...t, actionable: canHandle(t.role) }))
    })
  },
  async review(id: string, action: Decision, change: Change) {
    requireAccess('review')
    const c = application(id, change.taskId ? undefined : change.revision)
    const choices =
      c.tasks?.filter((t) => canHandle(t.role) && (!change.taskId || change.taskId === t.id)) || []
    if (choices.length !== 1 || !allowed(c) || change.values) throw Error('无法处理该任务')
    const reason = change.reason?.trim() || ''
    if ((action === 'reject' && !reason) || reason.length > 2000) throw Error('请检查审批意见')
    const node = c.design.nodes.find((n) => n.id === c.item.node)!
    c.tasks = c.tasks!.filter((t) => t.id !== choices[0].id)
    if (action === 'approve') {
      if (!c.tasks.length) move(c, c.route[c.route.indexOf(node.id) + 1])
    } else {
      c.tasks = []
      c.item.status = 'REJECTED'
      c.item.node = ''
    }
    c.item.revision++
    event(c, action === 'approve' ? 'APPROVE' : 'REJECT', node.name, reason, null, choices[0].role, node.id)
  },
  async revise(id: string, action: OwnerAction, change: Change) {
    requireAccess('revise')
    const c = application(id, change.revision)
    if (c.owner !== Number(actor().id) || c.item.status !== 'REJECTED')
      throw Error('只有发起人可以处理驳回申请')
    if (action === 'resubmit') {
      const values = change.values || {}
      c.route = approvalPath(c.design, values).map((n) => n.id)
      c.values = copy(values)
      c.item.round++
      move(c, c.route[0])
      event(c, 'RESUBMIT', '重新发起', '', values)
    } else {
      c.item.status = 'VOID'
      event(c, 'VOID', '作废申请')
    }
    c.item.revision++
  }
}
