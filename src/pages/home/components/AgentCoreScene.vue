<template>
  <div ref="host" class="agent-core-scene" :class="{ 'is-ready': ready }" :style="fallbackStyle" role="img" :aria-label="label" @pointermove="onPointerMove" @pointerleave="onPointerLeave">
    <div v-if="!ready" class="engine-fallback" aria-hidden="true">
      <div class="fallback-perspective">
        <div class="fallback-plate fallback-foundation"><span></span><span></span><span></span></div>
        <div class="fallback-plate fallback-security"><div class="fallback-traces"></div></div>
        <div class="fallback-plate fallback-agent"><div class="fallback-chip"><i></i><i></i><i></i></div></div>
        <div class="fallback-module module-one"><i></i></div>
        <div class="fallback-module module-two"><i></i><i></i></div>
        <div class="fallback-module module-three"><i></i><i></i><i></i></div>
      </div>
    </div>
    <canvas ref="canvas" class="engine-canvas" aria-hidden="true"></canvas>
    <div class="engine-vignette" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createEngineScene, type EngineScene } from './agentCoreScene'

const props = withDefaults(defineProps<{ progress: number; reducedMotion?: boolean; label?: string }>(), { reducedMotion: false, label: '分层 AI 应用引擎' })
const emit = defineEmits<{ ready: []; unsupported: [] }>()
const host = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()
const ready = ref(false)
const systemReducedMotion = ref(false)
const motionReduced = computed(() => props.reducedMotion || systemReducedMotion.value)
const normalizedProgress = computed(() => Number.isFinite(props.progress) ? Math.min(1, Math.max(0, props.progress)) : 0)
const fallbackStyle = computed(() => ({ '--engine-separation': String(Math.sin(normalizedProgress.value * Math.PI)) }))
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
    engine.render(renderedProgress, reduced ? 0 : elapsed, renderedPointerX, renderedPointerY)
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
    engine = createEngineScene(three, canvas.value)
    renderedProgress = normalizedProgress.value
    resize()
    engine.render(renderedProgress, 0, 0, 0)
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
.engine-canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; opacity: 0; pointer-events: none; }
.is-ready .engine-canvas { opacity: 1; }
.engine-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 58% 51%, transparent 40%, #05091416 90%); }
.engine-fallback { position: absolute; inset: 0; display: grid; place-items: center; perspective: 1000px; overflow: hidden; pointer-events: none; }
.fallback-perspective { width: min(54%, 370px); aspect-ratio: 1.4; position: relative; transform-style: preserve-3d; transform: rotateX(55deg) rotateZ(-33deg); }
.fallback-plate { position: absolute; inset: 0; border-radius: 20px; border: 1px solid #a2bfe470; box-shadow: 0 8px 0 #0c1423, 0 9px 0 #7f9fc668, 0 35px 65px #0007; transform-style: preserve-3d; }
.fallback-foundation { background: linear-gradient(145deg, #8092ac, #1d2c45 38%, #101929); transform: translateZ(calc(-65px - var(--engine-separation) * 42px)); display: flex; justify-content: center; align-items: flex-end; gap: 10px; padding: 20px; span { display: block; width: 40px; height: 3px; border-radius: 2px; background: #101827; } }
.fallback-security { inset: 8%; background: linear-gradient(130deg, #d0e4ff30, #567baa18); backdrop-filter: blur(2px); transform: translateZ(calc(-22px + var(--engine-separation) * 8px)); box-shadow: 0 4px 0 #566f944a, 0 5px 0 #c6dcff66, inset 0 1px 12px #c0d6ff1c; }
.fallback-traces { position: absolute; inset: 12%; opacity: .45; background-image: linear-gradient(90deg, transparent 48%, #93b7ef 49%, transparent 50%), linear-gradient(transparent 48%, #93b7ef 49%, transparent 50%); background-size: 25% 45%; }
.fallback-agent { inset: 14%; background: linear-gradient(135deg, #263b5b, #0c1423 60%); transform: translateZ(calc(26px + var(--engine-separation) * 64px)); }
.fallback-chip { position: absolute; inset: 18% 24%; border: 8px solid #91a5c0; border-radius: 13px; background: linear-gradient(145deg, #132445, #224995); box-shadow: 0 8px 0 #080f20, 0 9px 0 #83b5ff, inset 0 0 25px #345abf; display: flex; align-items: center; justify-content: center; gap: 7px; i { display: block; background: #c7dfff; height: 40%; width: 5%; box-shadow: 0 0 12px #609bff66; } i:nth-child(2) { height: 28%; background: #7cacff; } }
.fallback-module { position: absolute; left: 110%; width: 23%; height: 34%; border: 5px solid #6d84a4; border-radius: 9px; background: linear-gradient(145deg, #17376d, #0d1930); transform: translateZ(calc(34px + var(--engine-separation) * 65px)); box-shadow: 0 5px 0 #1a2a44, 0 7px 0 #7398cb, 0 15px 25px #0005; display: flex; align-items: center; justify-content: center; gap: 4px; i { background: #94bfff; width: 8%; height: 23%; box-shadow: 0 0 7px #8abdff88; } }
.module-one { top: -12%; }
.module-two { top: 38%; }
.module-three { top: 88%; }
@media (max-width: 600px) { .fallback-perspective { width: 51%; } .fallback-plate { border-radius: 12px; } .fallback-chip { border-width: 5px; border-radius: 7px; } .fallback-module { border-width: 3px; } }
@media (prefers-reduced-motion: reduce) { .engine-canvas, .fallback-plate { transition: none; } }
</style>
