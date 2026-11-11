import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** 原生滚动叙事，不拦截滚轮；所有监听、观察器与待处理帧随页面销毁。 */
export function useScrollStory(story: Ref<HTMLElement | undefined>, root: Ref<HTMLElement | undefined>) {
  const storyProgress = ref(0)
  const pageProgress = ref(0)
  const prefersReducedMotion = ref(false)
  const canReveal = ref(false)
  const activeChapter = computed(() => Math.min(2, Math.floor(storyProgress.value * 3)))
  let frame = 0
  let observer: IntersectionObserver | undefined
  let media: MediaQueryList | undefined

  function measure() {
    frame = 0
    const element = story.value
    if (element) {
      const bounds = element.getBoundingClientRect()
      const distance = Math.max(1, bounds.height - window.innerHeight + 64)
      storyProgress.value = Math.min(1, Math.max(0, (64 - bounds.top) / distance))
    }
    const distance = document.documentElement.scrollHeight - window.innerHeight
    pageProgress.value = distance > 0 ? Math.min(1, window.scrollY / distance) : 0
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(measure)
  }

  function updateMotion() {
    prefersReducedMotion.value = media?.matches ?? false
    schedule()
  }

  function scrollToChapter(index: number) {
    const element = story.value
    if (!element) return
    if (prefersReducedMotion.value) {
      element.querySelector<HTMLElement>(`[data-chapter="${index}"]`)?.scrollIntoView({ block: 'center' })
      return
    }
    const distance = Math.max(1, element.offsetHeight - window.innerHeight + 64)
    const start = element.getBoundingClientRect().top + window.scrollY - 64
    window.scrollTo({ top: start + distance * (index / 3 + 0.04), behavior: 'smooth' })
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    updateMotion()
    media.addEventListener('change', updateMotion)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer?.unobserve(entry.target)
          }
        }
      }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' })
      root.value?.querySelectorAll('[data-reveal]').forEach((element) => observer?.observe(element))
      canReveal.value = true
    }
    measure()
  })

  onBeforeUnmount(() => {
    if (frame) window.cancelAnimationFrame(frame)
    observer?.disconnect()
    media?.removeEventListener('change', updateMotion)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  })

  return { storyProgress, pageProgress, activeChapter, prefersReducedMotion, canReveal, scrollToChapter }
}
