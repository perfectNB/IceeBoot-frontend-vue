<template>
  <div ref="host" class="agent-core-scene" :class="{ 'is-ready': ready }" role="img" :aria-label="label" @pointermove="onPointerMove" @pointerleave="onPointerLeave">
    <div v-if="!ready" class="engine-fallback" aria-hidden="true"><div class="fallback-orbit"><i></i><i></i><i></i><span>{{ kind === 'sandbox' ? 'E2B' : kind === 'models' ? 'LLM' : 'ICEEBOOT' }}</span></div></div>
    <canvas ref="canvas" class="engine-canvas" aria-hidden="true"></canvas>
    <div class="engine-vignette" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createEngineScene, type EngineScene, type SceneKind } from './agentCoreScene'

const props = withDefaults(defineProps<{ progress: number; reducedMotion?: boolean; label?: string; kind?: SceneKind; selection?: number }>(), { reducedMotion: false, label: 'IceeBoot 3D 场景', kind: 'hero', selection: 0 })
const emit = defineEmits<{ ready: []; unsupported: [] }>()
const host = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()
const ready = ref(false)
const systemReducedMotion = ref(false)
const motionReduced = computed(() => props.reducedMotion || systemReducedMotion.value)
const normalizedProgress = computed(() => Number.isFinite(props.progress) ? Math.min(1, Math.max(0, props.progress)) : 0)
let engine: EngineScene | undefined
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined
let media: MediaQueryList | undefined
let animationFrame = 0
let disposed = false
let initializing = false
let unsupported = false
let inView = false
let pageVisible = true
let elapsed = 0
let lastFrameTime = 0
let renderedProgress = 0
let pointerX = 0
let pointerY = 0
let renderedPointerX = 0
let renderedPointerY = 0

function pause() {
  if (animationFrame) cancelAnimationFrame(animationFrame)
  animationFrame = 0
  lastFrameTime = 0
}

function schedule() {
  if (disposed || unsupported || !engine || !inView || !pageVisible || animationFrame) return
  animationFrame = requestAnimationFrame(draw)
}

function draw(timestamp: number) {
  animationFrame = 0
  if (disposed || unsupported || !engine || !inView || !pageVisible) return
  const reduced = motionReduced.value
  const delta = lastFrameTime ? Math.min((timestamp - lastFrameTime) / 1000, 0.05) : 1 / 60
  lastFrameTime = timestamp
  if (!reduced) elapsed += delta
  const ease = reduced ? 1 : 1 - Math.exp(-delta * 9)
  renderedProgress += (normalizedProgress.value - renderedProgress) * ease
  renderedPointerX += ((reduced ? 0 : pointerX) - renderedPointerX) * ease
  renderedPointerY += ((reduced ? 0 : pointerY) - renderedPointerY) * ease
  try {
    engine.render(renderedProgress, elapsed, renderedPointerX, renderedPointerY, props.selection)
  } catch {
    failGracefully()
    return
  }
  // 降低动态效果时仅响应滚动/尺寸事件绘制一帧，不保留空转的 RAF。
  if (!reduced) schedule()
}

function failGracefully() {
  if (disposed || unsupported) return
  unsupported = true
  ready.value = false
  pause()
  engine?.dispose()
  engine = undefined
  emit('unsupported')
}

function resize() {
  if (!host.value || !engine) return
  const { width, height } = host.value.getBoundingClientRect()
  engine.resize(width, height)
  schedule()
}

async function initialize() {
  if (disposed || unsupported || initializing || engine || !inView || !pageVisible || !canvas.value) return
  initializing = true
  try {
    // 只在首次进入视口时加载 WebGL 依赖，官网文案与按钮不等待它。
    const three = await import('three')
    if (disposed || unsupported || !inView || !pageVisible || !canvas.value) return
    engine = createEngineScene(three, canvas.value, props.kind)
    renderedProgress = normalizedProgress.value
    resize()
    engine.render(renderedProgress, 0, 0, 0, props.selection)
    ready.value = true
    emit('ready')
    schedule()
  } catch {
    failGracefully()
  } finally {
    initializing = false
  }
}

function onPointerMove(event: PointerEvent) {
  if (motionReduced.value || event.pointerType !== 'mouse' || !host.value) return
  const bounds = host.value.getBoundingClientRect()
  pointerX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / Math.max(bounds.width, 1) * 2 - 1))
  pointerY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / Math.max(bounds.height, 1) * 2 - 1))
  schedule()
}
function onPointerLeave() { pointerX = 0; pointerY = 0; schedule() }
function onMotionPreference(event: MediaQueryListEvent) { systemReducedMotion.value = event.matches }
function onVisibility() {
  pageVisible = document.visibilityState !== 'hidden'
  if (!pageVisible) pause()
  else if (!engine) void initialize()
  else schedule()
}
function onContextLost(event: Event) { event.preventDefault(); failGracefully() }

watch(normalizedProgress, schedule)
watch(() => props.selection, schedule)
watch(motionReduced, () => { pause(); schedule() })
onMounted(() => {
  pageVisible = document.visibilityState !== 'hidden'
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  systemReducedMotion.value = media.matches
  media.addEventListener('change', onMotionPreference)
  canvas.value?.addEventListener('webglcontextlost', onContextLost)
  document.addEventListener('visibilitychange', onVisibility)
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize)
    if (host.value) resizeObserver.observe(host.value)
  } else window.addEventListener('resize', resize)
  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting)
      if (!inView) pause()
      else if (!engine) void initialize()
      else schedule()
    }, { threshold: 0.01 })
    if (host.value) intersectionObserver.observe(host.value)
  } else {
    inView = true
    void initialize()
  }
})
onBeforeUnmount(() => {
  disposed = true
  pause()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', resize)
  intersectionObserver?.disconnect()
  media?.removeEventListener('change', onMotionPreference)
  document.removeEventListener('visibilitychange', onVisibility)
  canvas.value?.removeEventListener('webglcontextlost', onContextLost)
  engine?.dispose()
  engine = undefined
})
</script>

<style scoped lang="scss">
.agent-core-scene { position: relative; width: 100%; height: 100%; min-height: 1px; isolation: isolate; touch-action: pan-y; }
.engine-canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; opacity: 0; transition: opacity .7s ease; pointer-events: none; }
.is-ready .engine-canvas { opacity: 1; }
.engine-vignette { position: absolute; inset: 0; pointer-events: none; }
.engine-fallback { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; }
.fallback-orbit { position: relative; width: 60%; aspect-ratio: 1; display: grid; place-items: center; perspective: 800px; i { position: absolute; inset: 0; border: 4px solid #bbd9cc; border-radius: 50%; transform: rotateX(55deg) rotateY(-25deg); box-shadow: 0 0 25px #afe3c422; } i:nth-child(2) { inset: 10%; transform: rotateY(65deg) rotateZ(40deg); border-color: #5eab90; } i:nth-child(3) { inset: 20%; transform: rotateX(-35deg); border-width: 12px; } span { position: relative; font: 12px monospace; letter-spacing: .15em; color: #c0e6ce; } }
@media (prefers-reduced-motion: reduce) { .engine-canvas { transition: none; } }
</style>
