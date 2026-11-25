import { shallowRef, ref } from 'vue'

// Period changes and manual refreshes can overlap. Only publish the latest response.
export function useDashboardSection<T>(fetchData: () => Promise<T>) {
  const data = shallowRef<T>()
  const loading = ref(false)
  const failed = ref(false)
  let revision = 0

  async function load() {
    const current = ++revision
    loading.value = true
    failed.value = false
    try {
      const result = await fetchData()
      if (current === revision) data.value = result
    } catch {
      if (current === revision) {
        failed.value = true
        data.value = undefined
      }
    } finally {
      if (current === revision) loading.value = false
    }
  }
  return { data, loading, failed, load }
}
