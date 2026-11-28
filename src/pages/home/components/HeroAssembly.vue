<script setup lang="ts">
import { computed } from 'vue'
import { Box, Connection, Cpu, MagicStick } from '@element-plus/icons-vue'
import BrandMascot from '@/components/common/BrandMascot.vue'

const props = defineProps<{ paused: boolean; introProgress: number }>()

// Settle into the presenting pose as the overview reaches reading height.
const present = computed<number>((previous) => {
  if (props.paused) return previous ?? 0
  const t = Math.max(0, Math.min(1, (props.introProgress - .015) / .52))
  return t * t * (3 - 2 * t)
})

const capabilities = [
  { name: 'LLM', icon: Cpu, x: 84, y: 102, color: '#367be3', route: 'h43l29 29h44' },
  { name: 'Skills', icon: MagicStick, x: 200, y: 14, color: '#845cd0', route: 'v23l44 44v22' },
  { name: 'MCP', icon: Connection, x: 393, y: 14, color: '#108ba3', route: 'v23l-43 43v24' },
  { name: 'Sandbox', icon: Box, x: 515, y: 102, color: '#3860c6', route: 'h-41l-31 31h-48' },
]

// Project a wave of connected nodes into the plane behind the character.
function nodeAt(column: number, row: number) {
  const x = 14 + column * 27 + row * 2.5
  const wave = Math.sin(column * .33 + row * .23) * 31 + Math.cos(column * .45 - row * .18) * 16
  return { x, y: 225 + row * 5 + wave - column * 2.1 }
}
const mesh = Array.from({ length: 13 }, (_, row) =>
  Array.from({ length: 21 }, (_, column) => nodeAt(column, row)),
)
const vertices = [[1, 5], [3, 11], [5, 3], [7, 8], [14, 8], [16, 2], [18, 6], [20, 10]].map(
  ([column, row]) => mesh[row]![column]!,
)
const line = (points: { x: number; y: number }[]) => points.map(({ x, y }) => x + ',' + y).join(' ')
</script>

<template>
  <div class="assembly" :class="{ paused }" :style="{ '--present': present }" aria-hidden="true">
    <svg class="neural-field" viewBox="0 0 600 440" fill="none">
      <g v-for="(cap, i) in capabilities" :key="cap.name" :style="{ '--index': i }" :transform="`translate(${cap.x} ${cap.y})`">
        <path :d="'M0 0' + cap.route" :stroke="cap.color" stroke-opacity=".5" stroke-linejoin="round" stroke-dasharray="2 3" />
        <path class="signal-packet" :d="'M0 0' + cap.route" :stroke="cap.color" pathLength="100" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="12 110" />
      </g>
      <g class="mesh">
        <polyline v-for="(row, i) in mesh" :key="i" :points="line(row)" />
        <polyline v-for="(_, i) in mesh[0]" :key="'column-' + i" :points="line(mesh.map(row => row[i]!))" />
      </g>
      <g class="neurons">
        <g v-for="(node, i) in vertices" :key="i" :transform="`translate(${node.x} ${node.y})`">
          <circle r="5.5" fill="var(--site-bg)" stroke="currentColor" />
          <circle class="node-core" r="2.5" fill="currentColor" :style="{ animationDelay: i * -.4 + 's' }" />
        </g>
      </g>
      <g stroke="currentColor" class="floor">
        <ellipse cx="300" cy="365" rx="134" ry="24" opacity=".28" />
        <ellipse cx="300" cy="365" rx="149" ry="29" opacity=".22" stroke-dasharray="2 6" />
      </g>
    </svg>
    <div
      v-for="(cap, i) in capabilities" :key="cap.name"
      class="cap-anchor"
      :style="{ left: cap.x / 600 * 100 + '%', top: cap.y / 440 * 100 + '%', '--signal': cap.color, '--index': i }"
    >
      <span class="cap-label"><component :is="cap.icon" /><span>{{ cap.name }}</span></span>
    </div>
    <div class="shadow"></div>
    <div class="robot">
      <div class="gesture">
        <svg class="chassis" viewBox="0 0 200 220" fill="none">
          <defs>
            <linearGradient id="icee-ceramic" x1=".2" y1=".15" x2=".88" y2=".92">
              <stop stop-color="#fff" /><stop offset=".52" stop-color="#edf9ff" /><stop offset=".82" stop-color="#c3dcee" /><stop offset="1" stop-color="#83a9d1" />
            </linearGradient>
            <linearGradient id="icee-joint" x2=".9" y2="1">
              <stop stop-color="#50ceff" /><stop offset=".5" stop-color="#327dd7" /><stop offset="1" stop-color="#173d80" />
            </linearGradient>
          </defs>
          <!-- Two boots, a single ceramic body and articulated side fins. -->
          <g fill="url(#icee-joint)">
            <rect x="65" y="185" width="26" height="23" rx="11" transform="rotate(9 78 197)" />
            <g class="lifted-foot">
              <rect x="111" y="186" width="26" height="23" rx="11" transform="rotate(-9 124 198)" />
            </g>
          </g>
          <path d="M73 122Q100 114 127 124C140 137 148 165 143 181Q139 198 102 199Q63 199 57 182C52 167 60 135 73 122Z" fill="url(#icee-ceramic)" stroke="#aecce2" />
          <g fill="url(#icee-ceramic)" stroke="#aac9df">
            <g class="presenting-arm">
              <ellipse cx="42" cy="153" rx="11" ry="24" transform="rotate(27 42 153)" />
            </g>
            <ellipse cx="157" cy="144" rx="11" ry="24" transform="rotate(-39 157 144)" />
          </g>
          <rect x="83" y="144" width="36" height="19" rx="9.5" fill="#183758" />
          <path d="M90 154h4l2-4 3 8 3-10 3 6h7" stroke="#73edff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="robot-head"><BrandMascot :active="!paused" :eyes-closed="false" /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assembly {
  position: relative;
  isolation: isolate;
  width: min(100%, 650px);
  aspect-ratio: 600 / 440;
  --motion: running;
  --bounce: calc(1 - var(--present));
  --cap-step: 1.6s;
  background: radial-gradient(ellipse at 50% 54%,#78d6ff38,transparent 62%);
}
.paused { --motion: paused; }
.neural-field, .chassis { display: block; width: 100%; height: 100%; }
.neural-field { position: absolute; inset: 0; overflow: visible; }
.signal-packet { opacity: 0; }
.mesh { stroke: #428dcc; stroke-width: .8; opacity: .34; }
.neurons { color: #378fd3; }
.floor { color: #3694cb; }
.cap-anchor {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.cap-label {
  display: inline-flex;
  gap: .5em;
  align-items: center;
  padding: .45em .75em .45em .5em;
  color: var(--text);
  background: color-mix(in srgb, var(--site-bg) 94%, var(--signal));
  border: 1px solid color-mix(in srgb, var(--signal) 34%, var(--site-bg));
  border-radius: 11px;
  box-shadow: 0 4px 12px -6px color-mix(in srgb, var(--signal) 32%, transparent);
  font: 600 clamp(12px, 1.1vw, 16px)/1.2 ui-monospace, monospace;
}
.cap-label svg {
  width: 1.75em;
  height: 1.75em;
  box-sizing: border-box;
  padding: .3em;
  color: color-mix(in srgb, var(--signal) 74%, var(--text));
  background: color-mix(in srgb, var(--signal) 13%, var(--site-bg));
  border-radius: 6px;
  fill: currentColor;
}
.shadow {
  position: absolute;
  width: 28%; height: 4%; left: 36%; bottom: 15.5%;
  border-radius: 50%; background: radial-gradient(ellipse,#285e925e,transparent 72%);
  filter: blur(3px);
}
.robot {
  position: absolute;
  width: 48%;
  left: 26%;
  bottom: 13.5%;
  aspect-ratio: 200 / 220;
  transform-origin: 50% 94%;
}
.gesture {
  position: absolute;
  inset: 0;
  transform-origin: 39% 91%;
  transform: rotate(calc(-7deg * var(--present)));
}
.chassis { overflow: visible; }
.presenting-arm {
  transform-origin: 53px 132px;
  translate: calc(-12px * var(--present)) calc(10px * var(--present));
  scale: calc(1 + .18 * var(--present));
  transform: rotate(calc(66deg * var(--present)));
}
.lifted-foot {
  transform-origin: 121px 186px;
  transform: translateY(calc(-6px * var(--present))) rotate(calc(-20deg * var(--present)));
}
.robot-head {
  transform-origin: 51% 91%;
  transform: perspective(550px) translateX(calc(-3% * var(--present)))
    rotateY(calc(-18deg * var(--present))) rotate(calc(-8deg * var(--present)));
}
.robot-head { position: absolute; inset: 4% 0 auto; width: 100%; height: 61%; }
.robot-head :deep(.brand-scene) { width: 100%; height: 100%; }
.robot-head :deep(.brand-scene::after) { display: none; }
.robot-head :deep(.shell) {
  width: 88%; height: 86%;
  transform: rotate(7deg);
  box-shadow: inset -3px -6px 0 #225fae, inset 1px 3px 1px #b7edff, 0 6px 8px -5px #265a8999;
}
.robot-head :deep(.face) { inset: 8% 8% 10% 5%; }
.robot-head :deep(.eyes i) { width: 23%; border-radius: 100px; }
.robot-head :deep(.cheeks i) { width: 15%; height: 100%; }
.robot-head :deep(.cheeks) { height: 8%; }
@media (prefers-reduced-motion: no-preference) {
  .robot { animation: hop 3s infinite; }
  .shadow { animation: contact 3s infinite; }
  .presenting-arm { animation: offer 3s ease-in-out infinite; }
  .node-core { animation: pulse 3s ease-in-out infinite; }
  .cap-label, .signal-packet {
    animation-duration: calc(4 * var(--cap-step));
    animation-delay: calc(var(--index) * var(--cap-step));
    animation-iteration-count: infinite;
  }
  .cap-label { animation-name: broadcast; animation-timing-function: ease-in-out; }
  .signal-packet { animation-name: transmit; animation-timing-function: linear; }
  .robot, .shadow, .presenting-arm, .node-core, .cap-label, .signal-packet { animation-play-state: var(--motion); }
}
@keyframes broadcast {
  0%, 25%, 100% { transform: translateY(0); }
  7% {
    transform: translateY(-4px);
    border-color: var(--signal);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--signal) 14%, transparent), 0 3px 15px color-mix(in srgb, var(--signal) 22%, transparent);
  }
}
@keyframes transmit {
  0%, 4% { opacity: 0; stroke-dashoffset: 12; }
  7% { opacity: 1; }
  22% { opacity: 1; stroke-dashoffset: -88; }
  25%, 100% { opacity: 0; stroke-dashoffset: -100; }
}
/* Once the hand is raised, add a small follow-through at the shoulder. */
@keyframes offer {
  0%, 55%, 100% { transform: rotate(calc(66deg * var(--present))); }
  25% { transform: rotate(calc(79deg * var(--present))); }
}
@keyframes hop {
  0%, 10%, 74%, 100% { transform: none; }
  18% { transform: scale(calc(1 + .045 * var(--bounce)),calc(1 - .07 * var(--bounce))); animation-timing-function: ease-out; }
  37% { transform: translateY(calc(-16% * var(--bounce))) rotate(calc(-4deg * var(--bounce))) scale(calc(1 - .015 * var(--bounce)),calc(1 + .025 * var(--bounce))); animation-timing-function: ease-in; }
  54% { transform: scale(calc(1 + .065 * var(--bounce)),calc(1 - .09 * var(--bounce))); animation-timing-function: ease-out; }
  62% { transform: translateY(calc(-2% * var(--bounce))) scale(calc(1 - .01 * var(--bounce)),calc(1 + .02 * var(--bounce))); }
}
@keyframes contact { 0%,18%,54%,100% { transform: scale(1); opacity: 1; } 37% { transform: scale(calc(1 - .32 * var(--bounce))); opacity: calc(1 - .55 * var(--bounce)); } }
@keyframes pulse { 50% { opacity: .25; } }
</style>
