<script setup lang="ts">
import { useId } from 'vue'

const id = useId()
defineProps<{ animated?: boolean; eyesClosed?: boolean }>()
</script>

<template>
  <svg class="icee-mark" :class="{ animated: animated && !eyesClosed, sleeping: eyesClosed }" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <defs>
      <clipPath :id="id + '-clip'">
        <rect width="120" height="120" rx="31" />
      </clipPath>
      <linearGradient :id="id + '-case'" x2=".85" y2="1">
        <stop stop-color="#204d9e" />
        <stop offset=".57" stop-color="#102c63" />
        <stop offset="1" stop-color="#091d40" />
      </linearGradient>
      <linearGradient :id="id + '-hood'" x2=".9" y2=".65">
        <stop stop-color="#94eeff" />
        <stop offset=".48" stop-color="#48bcff" />
        <stop offset="1" stop-color="#2784ff" />
      </linearGradient>
    </defs>
    <g :clip-path="'url(#' + id + '-clip)'">
      <rect width="120" height="120" :fill="'url(#' + id + '-case)'" />
      <path d="M-17 66C-1 29 35 12 68 23c41 13 59 58 42 95l-10 19H-17Z" fill="#175bd1" />
      <path d="M-17 62C1 27 33 13 65 22c39 11 55 49 42 84-3 8-7 16-13 23H-17Z" :fill="'url(#' + id + '-hood)'" />
      <path d="M-15 74C-1 43 27 28 55 36c32 9 48 42 37 72-3 9-9 18-16 24h-91Z" fill="#f7fcff" />
      <g transform="rotate(19 42 79)">
        <g class="eyes" fill="#12203a">
          <rect x="22" y="59" width="12" height="32" rx="6" />
          <rect x="53" y="59" width="12" height="32" rx="6" />
        </g>
        <g fill="#c8e6ff">
          <ellipse cx="19" cy="96" rx="7" ry="4" />
          <ellipse cx="67" cy="96" rx="7" ry="4" />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.icee-mark { display: block; }
.eyes { transform-box: fill-box; transform-origin: center; }

.sleeping .eyes { transform: scaleY(.13); }

@media (prefers-reduced-motion: no-preference) {
  .animated .eyes { animation: blink 6.2s ease-in-out infinite; animation-play-state: var(--logo-play-state, running); }
}
@keyframes blink {
  0%, 68%, 72%, 100% { transform: scaleY(1); }
  70% { transform: scaleY(.1); }
}
</style>
