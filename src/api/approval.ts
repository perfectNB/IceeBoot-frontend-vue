import type { PageResult } from '@/types'
import { hasPermission } from '@/utils/permission'
import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { mockApproval } from '@/mock/services/approval'
import type {
  ApprovalDesign,
  ApprovalDetail,
  ApprovalItem,
  ApprovalRole,
  Blueprint,
  Change,
  Decision,
  OwnerAction,
  Scope,
  TemplateRow,
  Values
} from '@/types/approval'

const base = '/api/v1/workflow/approvals'
export const approvalApi = {
  async page(
    published: boolean,
    page: number,
    size: number,
    keyword?: string
  ): Promise<PageResult<TemplateRow>> {
    if (isMockEnabled()) return mockApproval.page(published, page, size, keyword)
    const path = base + (published ? '/published' : '/drafts')
    const result = await request.get<PageResult<TemplateRow> | Blueprint[]>(path, {
      page,
      size,
      ...(keyword !== undefined ? { keyword } : {})
    })
    if (!Array.isArray(result)) return result
    // Older servers return the complete list while the backend is being upgraded.
    const released =
      !published && hasPermission('workflow:approval:published:api')
        ? await request.get<Blueprint[]>(base + '/published')
        : []
    const live = new Map(released.map((b) => [b.design.code, b.design]))
    const filtered =
      keyword === undefined
        ? result
        : result.filter(
            (b) =>
              !b.stopped && b.design.name.toLocaleLowerCase().includes(keyword.trim().toLocaleLowerCase())
          )
    const total = filtered.length
    const pages = Math.ceil(total / size)
    const current = Math.min(page, Math.max(1, pages))
    const records = filtered.slice((current - 1) * size, current * size).map((b) => {
      const snapshot = live.get(b.design.code)
      return {
        code: b.design.code,
        name: snapshot?.name || b.design.name,
        version: b.version,
        revision: b.revision,
        stopped: false,
        changed: !!snapshot && JSON.stringify(snapshot) !== JSON.stringify(b.design)
      }
    })
    return { records, total, current, size, pages, hasPrevious: current > 1, hasNext: current < pages }
  },
  async template(published: boolean, code: string, released = false): Promise<Blueprint> {
    if (isMockEnabled()) return mockApproval.template(published, code, released)
    const result = await request.get<Blueprint | Blueprint[]>(base + (published ? '/published' : '/drafts'), {
      code,
      ...(released ? { released: true } : {})
    })
    if (!Array.isArray(result)) return result
    const template = result.find((b) => b.design.code === code)
    if (!template) throw Error('流程模板不存在，请刷新')
    return template
  },
  setStopped: (code: string, revision: number, stopped: boolean) =>
    isMockEnabled()
      ? mockApproval.setStopped(code, revision, stopped)
      : request.put<void>(base + '/drafts/' + encodeURIComponent(code) + '/intake', { revision, stopped }),
  drafts: () => (isMockEnabled() ? mockApproval.drafts() : request.get<Blueprint[]>(base + '/drafts')),
  roles: () => (isMockEnabled() ? mockApproval.roles() : request.get<ApprovalRole[]>(base + '/roles')),
  published: () =>
    isMockEnabled() ? mockApproval.published() : request.get<Blueprint[]>(base + '/published'),
  save(design: ApprovalDesign, revision: number) {
    if (isMockEnabled()) return mockApproval.save(design, revision)
    // An older backend must reject an audience it cannot represent.
    const field = design.additionalLaunchRoles?.length
      ? 'multiRoleDesign'
      : design.launchRole
        ? 'scopedDesign'
        : 'design'
    return request.put<void>(base + '/drafts', { [field]: design, revision })
  },
  publish: (code: string, revision: number) =>
    isMockEnabled()
      ? mockApproval.publish(code, revision)
      : request.post<void>(base + '/drafts/' + encodeURIComponent(code) + '/publish', { revision }),
  submit: (code: string, version: number, values: Values) =>
    isMockEnabled()
      ? mockApproval.submit(code, version, values)
      : request.post<string>(base + '/cases', { code, version, values }),
  list: (scope: Scope) =>
    isMockEnabled() ? mockApproval.list(scope) : request.get<ApprovalItem[]>(base + '/cases', { scope }),
  detail: (id: string) =>
    isMockEnabled()
      ? mockApproval.detail(id)
      : request.get<ApprovalDetail>(base + '/cases/' + encodeURIComponent(id)),
  review: (id: string, action: Decision, change: Change) =>
    isMockEnabled()
      ? mockApproval.review(id, action, change)
      : request.post<void>(base + '/cases/' + encodeURIComponent(id) + '/review/' + action, { ...change }),
  revise: (id: string, action: OwnerAction, change: Change) =>
    isMockEnabled()
      ? mockApproval.revise(id, action, change)
      : request.post<void>(base + '/cases/' + encodeURIComponent(id) + '/owner/' + action, { ...change })
}
