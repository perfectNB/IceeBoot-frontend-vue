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
  Values
} from '@/types/approval'

const base = '/api/v1/workflow/approvals'
export const approvalApi = {
  drafts: () => (isMockEnabled() ? mockApproval.drafts() : request.get<Blueprint[]>(base + '/drafts')),
  roles: () => (isMockEnabled() ? mockApproval.roles() : request.get<ApprovalRole[]>(base + '/roles')),
  published: () =>
    isMockEnabled() ? mockApproval.published() : request.get<Blueprint[]>(base + '/published'),
  save: (design: ApprovalDesign, revision: number) =>
    isMockEnabled()
      ? mockApproval.save(design, revision)
      : request.put<void>(base + '/drafts', { design, revision }),
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
