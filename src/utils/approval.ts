import type { ApprovalDesign, ApprovalNode, Exit, Values } from '@/types/approval'

export const end = '@end'
export const newExit = (fallback = end): Exit => ({ branches: [], fallback })
export const blankDesign = (): ApprovalDesign => ({
  code: '',
  name: '新审批流程',
  fields: [],
  start: newExit('review'),
  nodes: [{ id: 'review', name: '负责人审批', role: '', exit: newExit() }]
})

const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i
export const isApprovalNumber = (value: string) => numeric.test(value)

export function branchLabel(fields: ApprovalDesign['fields'], branch: Exit['branches'][number]) {
  return (
    branch.conditions
      .map(
        (c) =>
          (fields.find((f) => f.key === c.field)?.label || c.field || '未选字段') + ' = ' + (c.value || '…')
      )
      .join(' 且 ') || '待填写条件'
  )
}

export const formValue = (values: Values, key: string) => (typeof values[key] === 'string' ? values[key] : '')

export function validateForm(d: ApprovalDesign, values: Values) {
  for (const f of d.fields) {
    const value = formValue(values, f.key)
    if ((f.required || f.kind === 'routing') && !value.trim()) throw Error('请填写' + f.label)
    if (value.length > 2000 || (value.trim() && f.type === 'number' && !isApprovalNumber(value)))
      throw Error('请检查' + f.label)
  }
  if (Object.keys(values).some((key) => !d.fields.some((f) => f.key === key)))
    throw Error('包含未定义的表单字段')
}

export function validateDesign(d: ApprovalDesign, roles: string[]) {
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(d.code) || !d.name.trim() || d.name.length > 120)
    throw Error('请检查流程名称和流程码')
  const identifier = /^[\p{L}_][\p{L}\p{N}_]{0,63}$/u
  const keys = new Set<string>()
  for (const f of d.fields) {
    if (!identifier.test(f.key) || !f.label.trim() || f.label.length > 120 || keys.has(f.key))
      throw Error('请检查字段名称和唯一标识')
    keys.add(f.key)
  }
  if (d.fields.length > 100 || !d.nodes.length || d.nodes.length > 100)
    throw Error('请配置 1 到 100 个审批节点，最多支持 100 个字段')
  const nodes = new Map(d.nodes.map((n) => [n.id, n]))
  if (nodes.size !== d.nodes.length) throw Error('节点标识重复')
  for (const n of d.nodes) {
    if (!identifier.test(n.id) || !n.name.trim() || !roles.includes(n.role))
      throw Error('请为每个审批节点填写名称并选择角色')
  }
  const seen = new Set<string>()
  function visit(exit: Exit, stack: string[]) {
    if (!exit.fallback && !exit.branches.length) throw Error('请设置下一步')
    for (const b of exit.branches) {
      const used = new Set<string>()
      if (
        !b.conditions.length ||
        b.conditions.some((c) => {
          const f = d.fields.find((f) => f.key === c.field && f.kind === 'routing')
          if (
            !f ||
            !c.value.trim() ||
            used.has(c.field) ||
            (f.type === 'number' && !isApprovalNumber(c.value))
          )
            return true
          used.add(c.field)
          return false
        })
      )
        throw Error('请补全分支判断字段和值')
    }
    for (const id of [...exit.branches.map((b) => b.target), ...(exit.fallback ? [exit.fallback] : [])]) {
      if (id === end) continue
      const node = nodes.get(id)
      if (!node || stack.includes(id)) throw Error('连线无效或形成了循环')
      if (seen.has(id)) continue
      seen.add(id)
      visit(node.exit, [...stack, id])
    }
  }
  if (d.start.fallback === end || d.start.branches.some((b) => b.target === end))
    throw Error('开始必须连接审批节点')
  visit(d.start, [])
  if (seen.size !== nodes.size) throw Error('有审批节点尚未连接')
}

// Compare decimal strings without losing precision on large identifiers or amounts.
function decimal(value: string) {
  const [base, exponent = '0'] = value.toLowerCase().split('e')
  const [whole, fraction = ''] = base.replace(/^[+-]/, '').split('.')
  const digits = (whole + fraction).replace(/^0+/, '')
  if (!digits) return '0'
  const significant = digits.replace(/0+$/, '')
  return (
    (base.startsWith('-') ? '-' : '') +
    significant +
    'e' +
    (BigInt(exponent) + BigInt(digits.length - significant.length - fraction.length))
  )
}

export function approvalPath(d: ApprovalDesign, values: Values): ApprovalNode[] {
  validateForm(d, values)
  const path: ApprovalNode[] = []
  let exit = d.start
  for (;;) {
    const branch = exit.branches.find((b) =>
      b.conditions.every((c) =>
        d.fields.find((f) => f.key === c.field)?.type === 'number'
          ? decimal(values[c.field]) === decimal(c.value)
          : values[c.field] === c.value
      )
    )
    const id = branch ? branch.target : exit.fallback
    if (id === end) return path
    const node = d.nodes.find((n) => n.id === id)
    if (!node || path.includes(node)) throw Error('没有匹配的审批路径，请检查判断字段')
    path.push(node)
    exit = node.exit
  }
}
