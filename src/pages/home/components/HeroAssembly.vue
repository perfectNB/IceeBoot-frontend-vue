<template>
  <div class="assembly" aria-hidden="true">
    <div class="assembly-floor"></div>
    <div class="assembly-stack">
      <div class="plate carrier"><div class="contacts"></div></div>
      <div class="plate circuit"><div class="traces"></div></div>
      <div class="plate glass"><div class="etching"></div></div>
      <div class="processor">
        <div class="enamel"><i></i><i></i></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assembly {
  position: relative;
  width: min(100%, 580px, 67svh);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  isolation: isolate;
  pointer-events: none;
}
.assembly-floor {
  position: absolute;
  inset: 5% -5% 0;
  background:
    radial-gradient(ellipse at center, #238ac332, transparent 62%),
    radial-gradient(#4583a954 .8px, transparent 1px) center / 14px 14px;
  mask-image: radial-gradient(ellipse, black 24%, transparent 70%);
  transform: rotate(-11deg) skewX(12deg);
}
.assembly-stack {
  position: relative;
  width: 57%;
  aspect-ratio: 1;
  transform-style: preserve-3d;
  transform: translateY(12%) perspective(1100px) rotateX(calc(52deg - var(--departure, 0) * 10deg)) rotateZ(calc(-34deg + var(--departure, 0) * 17deg));
}
.plate, .processor { position: absolute; border-radius: 16%; }
.plate { inset: 0; }
.carrier {
  background: linear-gradient(150deg, #84c7df, #3d789d 45%, #25476c);
  border: 2px solid #bfeaff;
  box-shadow: -1px 2px #5087a6, -2px 4px #38627f, -3px 6px #254662, -8px 28px 30px #1e506244;
}
.contacts {
  position: absolute; inset: 4%; border-radius: 14%;
  background: repeating-linear-gradient(90deg,#a4cfde 0 2px,transparent 2px 9px) top / 72% 5% no-repeat,
    repeating-linear-gradient(90deg,#9bd1ea 0 2px,transparent 2px 9px) bottom / 72% 5% no-repeat;
}
.circuit {
  inset: 4%; transform: translateZ(calc(31px + var(--departure, 0) * 22px));
  background: linear-gradient(140deg,#478ca4,#124d70 47%,#153d67);
  border: 2px solid #b3f5ff;
  box-shadow: -2px 4px #2b88aa, -3px 6px #186487;
}
.traces,.etching { position: absolute; inset: 8%; border-radius: 10%; }
.traces {
  background: repeating-linear-gradient(45deg, transparent 0 10px,#87d9e950 10px 11px,transparent 11px 17px),
    repeating-linear-gradient(-45deg,transparent 0 33px,#a2e8f633 33px 34px);
  border: 1px solid #afeaff80;
}
.glass {
  inset: 2%; transform: translateZ(calc(62px + var(--departure, 0) * 46px));
  background: linear-gradient(125deg,#f4feffa8,#caf3ff80 37%,#87ceeb63 64%,#d9f9ffab);
  border: 2px solid #e1fcff;
  box-shadow: inset 0 0 0 3px #e4fbff55, -2px 4px #6fbed9, -3px 6px #4396b9;
}
.etching { border: 1px solid #efffffa6; background: radial-gradient(circle,#f4ffff 0 3px, #6398af 3.5px,transparent 5px) top left / 12px 12px no-repeat, radial-gradient(circle,#f4ffff 0 3px,#6398af 3.5px,transparent 5px) bottom right / 12px 12px no-repeat; }
.processor {
  inset: 17%; display: grid; place-items: center;
  transform: translateZ(calc(100px + var(--departure, 0) * 84px));
  border: 2px solid #c0f6ff;
  background: linear-gradient(140deg,#8ce9ff 4%,#33bcf0 44%,#0879cc 85%);
  box-shadow: inset 0 0 0 3px #9cebff7d,-1px 2px #279dd5,-2px 4px #1383be,-3px 6px #116faa,-4px 8px #115a95, -6px 17px 14px #16678f36;
}
.enamel {
  width: 75%; height: 75%; border-radius: 25%;
  display: flex; justify-content: center; align-items: center; gap: 13%;
  background: linear-gradient(145deg,#fff,#e6f7ff);
  box-shadow: inset 1px 2px 3px white, inset -1px -2px 4px #92c7da, 0 2px 5px #1475a45c;
}
.enamel i {
  width: 13%; height: 43%; border-radius: 30px; transform: rotate(19deg);
  background: linear-gradient(100deg,#0b2440,#26415c);
  box-shadow: inset 1px 2px 3px #081d32, 0 2px 1px white;
}
@media (max-width: 760px) {
  .assembly { width: min(100%, 365px); }
  .assembly-stack { transform: translateY(18%) rotateX(50deg) rotateZ(calc(-32deg + var(--departure, 0) * 9deg)); }
  .processor { transform: translateZ(calc(59px + var(--departure, 0) * 18px)); }
  .glass { transform: translateZ(calc(37px + var(--departure, 0) * 11px)); }
  .circuit { transform: translateZ(calc(17px + var(--departure, 0) * 6px)); }
}
</style>
