import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const clamp = (value: number) => Math.max(0, Math.min(1, value))

/** Read all section bounds together. The same scroll position produces the same pose in either direction. */
export function useScrollStory(root: Ref<HTMLElement | undefined>) {
  const sceneProgress = ref<Record<string, number>>({})
  const prefersReducedMotion = ref(false)
  let frame = 0
  let media: MediaQueryList | undefined
  let scenes: HTMLElement[] = []

  function measure() {
    frame = 0
    const height = Math.max(window.innerHeight, 1)
    const bounds = scenes.map(scene => scene.getBoundingClientRect())
    const next: Record<string, number> = {}
    scenes.forEach((scene, index) => {
      const rect = bounds[index]!
      const name = scene.dataset.scene!
      next[name] = prefersReducedMotion.value ? .45 : clamp((height * .65 - rect.top) / (rect.height + height * .1))
      const arrival = clamp((height - rect.top) / (height * .62))
      const departure = name === 'hero'
        ? clamp((window.scrollY - 1) / (height * .85))
        : clamp((height * .65 - rect.bottom) / (height * .65))
      scene.style.setProperty('--arrival', arrival.toFixed(4))
      scene.style.setProperty('--departure', departure.toFixed(4))
    })
    sceneProgress.value = next
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(measure) }
  function updateMotion() { prefersReducedMotion.value = media?.matches ?? false; schedule() }

  onMounted(() => {
    scenes = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-scene]') || [])
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    updateMotion()
    media.addEventListener('change', updateMotion)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    media?.removeEventListener('change', updateMotion)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  })
  return { sceneProgress, prefersReducedMotion }
}
