<template>
  <div class="brand-scene" aria-hidden="true">
    <div ref="head" class="shell">
      <div class="face">
        <div ref="gaze" class="gaze">
          <div class="eyes" :class="{ closed: eyesClosed }"><i></i><i></i></div>
        </div>
        <div class="cheeks"><i></i><i></i></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps<{ active: boolean; eyesClosed: boolean }>()
const head = ref<HTMLElement>()
const gaze = ref<HTMLElement>()

watchEffect((onCleanup) => {
  const shell = head.value
  const eyes = gaze.value
  if (!props.active || props.eyesClosed || !shell || !eyes) return

  let frame = 0
  let pointerX = 0
  let pointerY = 0
  function reset() {
    cancelAnimationFrame(frame)
    frame = 0
    eyes!.style.removeProperty('transform')
  }
  function move(event: PointerEvent) {
    if (event.pointerType === 'touch') return
    pointerX = event.clientX
    pointerY = event.clientY
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const rect = shell!.getBoundingClientRect()
      const dx = pointerX - rect.left - rect.width / 2
      const dy = pointerY - rect.top - rect.height / 2
      const distance = Math.hypot(dx, dy, rect.width * .7)
      eyes!.style.transform = `translate(${15 * dx / distance}%, ${13 * dy / distance}%)`
    })
  }
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('blur', reset)
  document.documentElement.addEventListener('pointerleave', reset)
  onCleanup(() => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('blur', reset)
    document.documentElement.removeEventListener('pointerleave', reset)
    reset()
  })
})
</script>

<style scoped>
.brand-scene {
  position: relative;
  width: 160px;
  height: 119px;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.brand-scene::after {
  content: '';
  position: absolute;
  bottom: 1px;
  width: 70px;
  height: 7px;
  border-radius: 50%;
  background: #2373b933;
  filter: blur(4px);
}
.shell {
  position: relative;
  width: 124px;
  height: 95px;
  border-radius: 46% 48% 42% 43% / 52% 55% 42% 44%;
  transform: rotate(7deg);
  background: linear-gradient(145deg,#92e9ff 2%,#4dbbff 27%,#287fe9 65%,#1852aa);
  box-shadow: inset -3px -4px 0 #195bb5, inset 1px 2px 0 #b9eeff;
}
.face {
  position: absolute;
  inset: 8px 10px 10px 6px;
  border-radius: inherit;
  background: linear-gradient(155deg,#fff 45%,#e4f4ff);
}
.gaze, .eyes, .cheeks { position: absolute; }
.gaze { inset: 0; transition: transform 100ms ease-out; }
.eyes, .cheeks { display: flex; justify-content: space-between; }
.eyes { top: 28%; left: 28%; right: 26%; height: 35%; }
.eyes i { width: 11px; border-radius: 9px; background: #132640; transition: transform .13s ease; }
.closed i { transform: scaleY(.13); }
.cheeks { inset: 67% 16% auto; }
.cheeks i { width: 13px; height: 7px; border-radius: 50%; background: #c3e2f9; }
@media (prefers-reduced-motion: reduce) {
  .gaze, .eyes i { transition: none; }
}
</style>
