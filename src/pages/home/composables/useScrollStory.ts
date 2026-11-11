import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** 各章节独立跟随原生滚动；同一帧统一读布局，不劫持滚轮。 */
export function useScrollStory(root: Ref<HTMLElement | undefined>) {
  const sceneProgress = ref<Record<string, number>>({})
  const prefersReducedMotion = ref(false)
  const canReveal = ref(false)
  let frame = 0
  let observer: IntersectionObserver | undefined
  let media: MediaQueryList | undefined
  let scenes: HTMLElement[] = []
  function measure() {
    frame = 0
    const height = window.innerHeight
    const next: Record<string, number> = {}
    for (const scene of scenes) {
      const rect = scene.getBoundingClientRect()
      next[scene.dataset.scene!] = prefersReducedMotion.value ? .45 : Math.min(1, Math.max(0, (height * .65 - rect.top) / (rect.height + height * .1)))
    }
    sceneProgress.value = next
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(measure) }
  function updateMotion() { prefersReducedMotion.value = media?.matches ?? false; schedule() }
  onMounted(() => {
    scenes = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-scene]') || [])
    media = window.matchMedia('(prefers-reduced-motion: reduce)'); updateMotion()
    media.addEventListener('change', updateMotion)
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule, { passive: true })
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer?.unobserve(entry.target) }
      }, { threshold: .08 })
      root.value?.querySelectorAll('[data-reveal]').forEach(element => observer?.observe(element))
      canReveal.value = true
    }
    measure()
  })
  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame)
    observer?.disconnect(); media?.removeEventListener('change', updateMotion)
    window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule)
  })
  return { sceneProgress, prefersReducedMotion, canReveal }
}
