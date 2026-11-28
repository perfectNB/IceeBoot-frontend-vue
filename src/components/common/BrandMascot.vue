<template>
  <div class="brand-scene" :class="{ paused, private: eyesClosed }" aria-hidden="true">
    <div class="contour outer"></div>
    <div class="contour inner"></div>
    <div class="mascot-shadow"></div>
    <div class="float">
      <div class="shell">
        <div class="face">
          <div class="eyes"><i></i><i></i></div>
          <div class="cheeks"><i></i><i></i></div>
        </div>
      </div>
    </div>
    <i class="satellite near"></i><i class="satellite far"></i>
  </div>
</template>

<script setup lang="ts">
defineProps<{ paused?: boolean; eyesClosed?: boolean }>()
</script>

<style scoped>
.brand-scene { position: relative; isolation: isolate; width: 100%; aspect-ratio: 1; pointer-events: none; }
.float { position: absolute; inset: 19% 18% 24% 19%; animation: mascot-float 6s ease-in-out infinite; }
.shell {
  position: relative; height: 100%; border-radius: 49% 51% 48% 52%;
  transform: rotate(17deg);
  background: radial-gradient(ellipse at 32% 9%, #c6f8ff 0%, #65d7ff 19%, #39b7fa 46%, #1788ea 67%, #0759ba 87%);
  box-shadow: inset -6px -10px 18px #0048a548, inset 2px 4px 8px #b9faff;
}
.face {
  position: absolute; inset: 9% 13% 11% 6%; border-radius: 50%;
  background: radial-gradient(ellipse at 38% 27%, #fff 22%, #f5fcff 55%, #d5ecfa 87%, #abd8f2);
  box-shadow: 3px 5px 8px #06599e25;
}
.eyes,.cheeks { position: absolute; display: flex; justify-content: space-between; }
.eyes { inset: 32% 23% 36%; }
.eyes i { width: 23%; border-radius: 99px; background: linear-gradient(120deg,#344452,#121b25 60%); animation: mascot-blink 7s ease infinite; }
.cheeks { inset: 63% 11% 27%; }
.cheeks i { width: 16%; border-radius: 50%; background: #baddf9; }
.private .eyes i { animation: none; transform: scaleY(.13); }
.mascot-shadow { position: absolute; left: 29%; right: 23%; top: 80%; height: 4%; border-radius: 50%; background: #1468a83a; filter: blur(10px); }
.contour { position: absolute; border: 1px solid currentColor; color: #469ad544; border-radius: 50%; transform: rotate(-26deg); }
.outer { inset: 17% 0 14%; }
.inner { inset: 21% 5% 18%; border-style: dashed; color: #469ad533; }
.satellite { position: absolute; border-radius: 50%; background: radial-gradient(circle at 29% 22%,#b7f5ff,#4ecbff 36%,#1682e9 76%,#095aba); box-shadow: 0 8px 12px #146ba226; }
.near { width: 7%; aspect-ratio: 1; left: 7%; top: 63%; }
.far { width: 4%; aspect-ratio: 1; right: 11%; top: 19%; }
.paused .float,.paused .eyes i { animation-play-state: paused; }
@keyframes mascot-float { 0%,100% { transform: translateY(1%) rotate(-3deg); } 50% { transform: translateY(-3%) rotate(2deg); } }
@keyframes mascot-blink { 0%,43%,48%,100% { transform: scaleY(1); } 45% { transform: scaleY(.12); } }
@media (prefers-reduced-motion: reduce) { .float,.eyes i { animation: none; } }
</style>
