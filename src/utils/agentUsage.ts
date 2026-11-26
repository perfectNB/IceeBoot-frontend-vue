import type { UsageRow } from '@/api/agentConsole'

export const totalTokens = (row: UsageRow) => row.inputTokens + row.outputTokens
export const numberText = (value: number | null) => value == null ? '—' : value.toLocaleString('zh-CN')
const compact = new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 })
export const shortNumber = (value: number) => compact.format(value)
const cny = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' })
export const costText = (value: number | null) => value == null ? '未计价' : cny.format(value)

export function sumUsage(rows: UsageRow[], label = ''): UsageRow {
  const sum: UsageRow = { label, provider: null, calls: 0, knownCalls: 0, pricedCalls: 0,
    inputTokens: 0, outputTokens: 0, cachedTokens: null, cacheWriteTokens: null, costCny: null }
  for (const row of rows) {
    sum.calls += row.calls
    sum.knownCalls += row.knownCalls
    sum.pricedCalls += row.pricedCalls
    sum.inputTokens += row.inputTokens
    sum.outputTokens += row.outputTokens
    for (const field of ['cachedTokens', 'cacheWriteTokens', 'costCny'] as const) {
      if (row[field] != null) sum[field] = (sum[field] ?? 0) + row[field]
    }
  }
  return sum
}

export function reportedTokens(row: UsageRow, value: number | null, compact = false) {
  if (value == null || (row.calls > 0 && row.knownCalls === 0)) return '—'
  return compact ? shortNumber(value) : numberText(value)
}
