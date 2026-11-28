import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const ease = (t: number) => t * t * (3 - 2 * t)

export function useScrollStory(root: Ref<HTMLElement | undefined>) {
  const sceneProgress = ref<Record<string, number>>({})
  const featureBlend = ref<Record<string, number>>({ capabilities: 1 })
  const prefersReducedMotion = ref(false)
  let frame = 0
  let media: MediaQueryList | undefined
  let resizeObserver: ResizeObserver | undefined
  let header: HTMLElement | null = null
  let scenes: HTMLElement[] = []
  let stageIndices: number[] = []

  function measure() {
    frame = 0
    // Use the visible area below the sticky navigation for both the copy and the artwork.
    const top = header?.getBoundingClientRect().height ?? 0
    const bottom = window.innerHeight
    const height = Math.max(bottom - top, 1)
    const center = top + height / 2
    const bounds = scenes.map(scene => scene.getBoundingClientRect())

    // Each boundary transfers the outgoing layer's weight to its neighbour.
    // A short chapter also limits the blend width, so only two layers overlap.
    let weight = 1
    stageIndices.forEach((index, position) => {
      const nextIndex = stageIndices[position + 1]
      let incoming = 0
      if (nextIndex !== undefined) {
        const current = bounds[index]!
        const next = bounds[nextIndex]!
        const boundary = (current.bottom + next.top) / 2
        const span = Math.max(1, Math.min(height / 2, current.height, next.height))
        incoming = ease(clamp(.5 + (center - boundary) / span))
      }
      featureBlend.value[scenes[index]!.dataset.scene!] = weight - incoming
      weight = incoming
    })

    scenes.forEach((scene, index) => {
      const rect = bounds[index]!
      const name = scene.dataset.scene!
      sceneProgress.value[name] = prefersReducedMotion.value ? .45 : clamp((top + height * .65 - rect.top) / (rect.height + height * .1))
      const arrival = ease(clamp((bottom - rect.top) / (height * .62)))
      const departure = name === 'hero'
        ? ease(clamp((top - rect.top) / (height * .85)))
        : ease(clamp((top + height * .65 - rect.bottom) / (height * .65)))
      scene.style.setProperty('--arrival', arrival.toFixed(4))
      scene.style.setProperty('--departure', departure.toFixed(4))
    })
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(measure) }
  function updateMotion() { prefersReducedMotion.value = media?.matches ?? false; schedule() }

  onMounted(() => {
    header = root.value?.querySelector('.launch-header') ?? null
    scenes = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-scene]') || [])
    stageIndices = scenes.flatMap((scene, index) =>
      scene.dataset.scene === 'capabilities' || scene.classList.contains('feature-scene') ? [index] : [],
    )
    resizeObserver = new ResizeObserver(schedule)
    if (header) resizeObserver.observe(header)
    scenes.forEach(scene => resizeObserver!.observe(scene))
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    updateMotion()
    media.addEventListener('change', updateMotion)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    resizeObserver?.disconnect()
    media?.removeEventListener('change', updateMotion)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  })
  return { sceneProgress, featureBlend, prefersReducedMotion }
}
