import type { UsageOverview, UsagePeriod, UsageRow } from '@/api/agentConsole'
import { sumUsage, totalTokens } from '@/utils/agentUsage'

export async function mockUsageOverview(period: UsagePeriod, now = new Date()): Promise<UsageOverview> {
  const groups = new Map<string, UsageRow[]>()
  const days: UsageRow[] = []
  const examples = [['qwen-plus', 'QWEN'], ['deepseek-chat', 'DEEPSEEK'], ['gpt-4o-mini', 'GPT']] as const
  for (let offset = 59; offset >= 0; offset--) {
    const day = new Date(now)
    day.setDate(day.getDate() - offset)
    if (period === 'TODAY' && offset > 0 || period === 'MONTH' && day.getMonth() !== now.getMonth()) continue
    const label = day.toLocaleDateString('sv-SE')
    const entries = examples.map(([model, provider], i) => {
      const calls = (day.getDate() * (i + 1)) % 7 + 1
      const inputTokens = calls * (4200 - 1300 * i)
      const outputTokens = calls * 293
      const row = { label: model, provider, calls, knownCalls: calls, pricedCalls: calls, inputTokens, outputTokens,
        cachedTokens: calls * 330, cacheWriteTokens: i === 0 ? calls * 45 : null, costCny: (inputTokens * 2 + outputTokens * 6) / 1000000 }
      if (!groups.has(model)) groups.set(model, [])
      groups.get(model)!.push(row)
      return row
    })
    if (period !== 'ALL' || offset < 30) days.push(sumUsage(entries, label))
  }
  const models = [...groups].map(([model, rows]) => ({ ...sumUsage(rows, model), provider: rows[0]!.provider }))
  return { updatedAt: now.toLocaleString('sv-SE').replace(' ', 'T'), models: models.sort((a, b) => totalTokens(b) - totalTokens(a)), days }
}
