import type * as Three from 'three'

type ThreeModule = typeof import('three')
type Disposable = { dispose: () => void }
export type SceneKind = 'hero' | 'foundation' | 'agent' | 'models' | 'sandbox'
export interface EngineScene {
  resize: (width: number, height: number) => void
  render: (progress: number, time: number, pointerX: number, pointerY: number, selection?: number) => void
  setTheme: (dark: boolean) => void
  dispose: () => void
}

/** 每个章节使用独立几何叙事；共享材质语言，不加载外部模型或纹理。 */
export function createEngineScene(THREE: ThreeModule, canvas: HTMLCanvasElement, kind: SceneKind = 'hero'): EngineScene {
  const resources = new Set<Disposable>()
  const keep = <T extends Disposable>(value: T): T => { resources.add(value); return value }
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
  const rig = new THREE.Group()
  scene.add(rig)
  let renderWidth = 0
  let renderHeight = 0
  let aspect = 1
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    scene.environment = null
    scene.clear()
    resources.forEach(resource => resource.dispose())
    resources.clear()
    renderer.dispose()
    if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
  }
  try {
    const studio = document.createElement('canvas')
    studio.width = 512; studio.height = 256
    const context = studio.getContext('2d')
    if (context) {
      // The broad studio highlights need only a 128px reflection cubemap.
      context.scale(.5, .5)
      context.fillStyle = '#101322'; context.fillRect(0, 0, 1024, 512)
      const glow = context.createLinearGradient(0, 0, 0, 512)
      glow.addColorStop(0, '#79829d'); glow.addColorStop(.45, '#171c32'); glow.addColorStop(1, '#050711')
      context.fillStyle = glow; context.fillRect(0, 0, 1024, 512)
      context.fillStyle = '#ffffff'; context.fillRect(50, 40, 120, 290); context.fillRect(440, 70, 350, 65)
      context.fillStyle = '#b4c9ff'; context.fillRect(850, 160, 55, 270)
      const texture = new THREE.CanvasTexture(studio)
      texture.mapping = THREE.EquirectangularReflectionMapping
      texture.colorSpace = THREE.SRGBColorSpace
      const generator = new THREE.PMREMGenerator(renderer)
      try { scene.environment = keep(generator.fromEquirectangular(texture)).texture }
      finally { texture.dispose(); generator.dispose() }
    }
    const ambient = new THREE.HemisphereLight(0xdde4ff, 0x11161f, 2)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(-3, 6, 7)
    const rim = new THREE.DirectionalLight(0xc763ff, 2.5); rim.position.set(6, 2, -4)
    scene.add(key, rim)
    const chrome = keep(new THREE.MeshStandardMaterial({ color: 0xc5cee9, metalness: 1, roughness: .17 }))
    const graphite = keep(new THREE.MeshStandardMaterial({ color: 0x171d38, metalness: .87, roughness: .26 }))
    const porcelain = keep(new THREE.MeshStandardMaterial({ color: 0xe6eaff, metalness: .62, roughness: .23 }))
    const accentMaterial = keep(new THREE.MeshPhysicalMaterial({ color: 0x793cf2, metalness: .4, roughness: .18, clearcoat: 1 }))
    const glass = keep(new THREE.MeshPhysicalMaterial({ color: 0x9671f5, metalness: .08, roughness: .12, transparent: true, opacity: .15, depthWrite: false, side: THREE.DoubleSide }))
    const glow = keep(new THREE.MeshBasicMaterial({ color: 0x61caff, toneMapped: false }))
    const lineMaterial = keep(new THREE.LineBasicMaterial({ color: 0x9a8af0, transparent: true, opacity: .35 }))
    const nodes: Three.Group[] = []
    const rings: Three.Mesh[] = []
    const wires: Three.BufferGeometry[] = []
    const wireLines: Three.Line[] = []
    const plates: Three.Mesh[] = []
    const sparks: Three.Mesh[] = []
    const activations: number[] = []
    let previousTime: number | undefined
    function mesh(parent: Three.Object3D, geometry: Three.BufferGeometry, material: Three.Material) {
      const object = new THREE.Mesh(keep(geometry), material); parent.add(object); return object
    }
    function slab(parent: Three.Object3D, width: number, height: number, depth: number, material: Three.Material) {
      const r = Math.min(.16, height / 4), x = -width / 2, y = -height / 2
      const shape = new THREE.Shape()
      shape.moveTo(x + r, y); shape.lineTo(x + width - r, y)
      shape.quadraticCurveTo(x + width, y, x + width, y + r); shape.lineTo(x + width, y + height - r)
      shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height); shape.lineTo(x + r, y + height)
      shape.quadraticCurveTo(x, y + height, x, y + height - r); shape.lineTo(x, y + r)
      shape.quadraticCurveTo(x, y, x + r, y)
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 3, bevelSize: .035, bevelThickness: .035, curveSegments: 8, steps: 1 })
      geometry.center()
      return mesh(parent, geometry, material)
    }
    function label(parent: Three.Object3D, text: string, width: number, color = '#edf0ff') {
      const surface = document.createElement('canvas'); surface.width = 512; surface.height = 128
      const ctx = surface.getContext('2d')
      if (ctx) { ctx.font = '500 82px sans-serif'; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 64, 470) }
      const map = keep(new THREE.CanvasTexture(surface)); map.colorSpace = THREE.SRGBColorSpace
      const material = keep(new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }))
      return mesh(parent, new THREE.PlaneGeometry(width, width / 4), material)
    }
    function ring(parent: Three.Object3D, radius: number, thickness: number, material: Three.Material) {
      return mesh(parent, new THREE.TorusGeometry(radius, thickness, 12, 96), material)
    }
    function outline(parent: Three.Object3D, geometry: Three.BufferGeometry) {
      const edges = keep(new THREE.EdgesGeometry(geometry)); parent.add(new THREE.LineSegments(edges, lineMaterial))
    }
    const orb = new THREE.Group(); rig.add(orb)
    if (kind === 'hero') {
      mesh(orb, new THREE.IcosahedronGeometry(1.03, 5), chrome)
      for (let i = 0; i < 3; i++) {
        const hoop = ring(rig, 1.65 + i * .38, i === 0 ? .12 : .065, i === 1 ? accentMaterial : chrome)
        hoop.rotation.set(.7 + i * .5, -.6 + i * .55, i * .8)
        rings.push(hoop)
      }
      const core = ring(orb, 1.05, .035, glow); core.rotation.x = Math.PI / 2
      for (let i = 0; i < 5; i++) sparks.push(mesh(rig, new THREE.SphereGeometry(i === 0 ? .18 : .07, 20, 16), i === 0 ? porcelain : glow))
    } else if (kind === 'foundation') {
      for (let i = 0; i < 3; i++) {
        const group = new THREE.Group(); rig.add(group); nodes.push(group)
        const body = slab(group, 3.6, 2.65, .16, i === 1 ? chrome : graphite); body.rotation.x = -Math.PI / 2
        const edge = slab(group, 3.5, 2.55, .025, i === 1 ? accentMaterial : porcelain); edge.rotation.x = -Math.PI / 2; edge.position.y = -.1
        const title = label(group, ['IDENTITY / RBAC', 'SERVICES', 'APPLICATION'][i]!, 2.4); title.rotation.x = -Math.PI / 2; title.position.set(0, .14, .8)
        for (let j = 0; j < 3; j++) {
          const block = slab(group, .72, .7, .16, j === i ? accentMaterial : chrome); block.rotation.x = -Math.PI / 2; block.position.set((j - 1) * .95, .19, -.35)
        }
      }
    } else if (kind === 'agent') {
      mesh(orb, new THREE.OctahedronGeometry(.9, 0), chrome)
      const inner = ring(orb, 1.15, .04, glow); inner.rotation.x = .5
      const outer = ring(rig, 2.45, .018, chrome); outer.rotation.x = -.25
      ;['SKILL', 'TOOL', 'MCP', 'AGENT'].forEach((name, i) => {
        const node = new THREE.Group(); rig.add(node); nodes.push(node)
        slab(node, 1.15, .72, .16, graphite)
        sparks.push(mesh(rig, new THREE.SphereGeometry(.045, 12, 8), glow))
        const text = label(node, name, .96); text.position.z = .12
        const led = slab(node, .55, .022, .01, glow); led.position.set(0, -.26, .12)
        const wire = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(2.4 * Math.cos(i * Math.PI / 2), 2.4 * Math.sin(i * Math.PI / 2), 0)])
        wires.push(keep(wire)); const line = new THREE.Line(wire, lineMaterial); wireLines.push(line); rig.add(line)
      })
    } else if (kind === 'models') {
      const disk = mesh(orb, new THREE.CylinderGeometry(1, 1, .24, 64), chrome); disk.rotation.x = Math.PI / 2
      const face = mesh(orb, new THREE.CircleGeometry(.91, 64), accentMaterial); face.position.z = .14
      const text = label(orb, 'LLM', 1.45); text.position.z = .16
      const modelOrbit = ring(rig, 2.45, .025, chrome)
      modelOrbit.position.z = -.65
      rings.push(modelOrbit)
      ;['GPT', 'Claude', 'Gemini', 'Qwen', 'DeepSeek', 'GLM', 'Kimi', 'MiniMax'].forEach(name => {
        const node = new THREE.Group(); rig.add(node); nodes.push(node)
        const disc = mesh(node, new THREE.CylinderGeometry(.52, .52, .22, 40), chrome); disc.rotation.x = Math.PI / 2
        const face = mesh(node, new THREE.CircleGeometry(.48, 40), graphite); face.position.z = .125; plates.push(face)
        const text = label(node, name, 1.0); text.position.z = .145
        const trim = ring(node, .5, .025, chrome); trim.position.z = .125
      })
    } else {
      const box = new THREE.BoxGeometry(3.15, 3.2, 2.65)
      mesh(rig, box, glass); outline(rig, box)
      for (const y of [-1.64, 1.64]) {
        const frame = slab(rig, 3.3, 2.8, .15, graphite); frame.rotation.x = -Math.PI / 2; frame.position.y = y
        const rim = slab(rig, 3.32, 2.82, .025, chrome); rim.rotation.x = -Math.PI / 2; rim.position.y = y - .1
      }
      ;['> python', '$ curl', '{ ENV }'].forEach((name, i) => {
        const node = new THREE.Group(); rig.add(node); nodes.push(node)
        slab(node, 2.1, .56, .09, i === 1 ? accentMaterial : graphite)
        const text = label(node, name, 1.45); text.position.z = .085
      })
      const title = label(rig, 'E2B', 1.1); title.position.set(0, 1.77, .3); title.rotation.x = -Math.PI / 2
      for (let i = 0; i < 12; i++) sparks.push(mesh(rig, new THREE.SphereGeometry(.025, 8, 6), glow))
    }
    return {
      resize(width, height) {
        if (disposed || width <= 0 || height <= 0 || (width === renderWidth && height === renderHeight)) return
        renderWidth = width
        renderHeight = height
        aspect = width / height; camera.aspect = aspect; camera.updateProjectionMatrix(); renderer.setSize(width, height, false)
      },
      render(progress, time, pointerX, pointerY, selection = 0) {
        if (disposed) return
        const p = THREE.MathUtils.smoothstep(progress, 0, 1)
        // 时间来自可见场景的 RAF；暂停/减少动态效果时固定，不累加离屏时间。
        const delta = previousTime === undefined ? 0 : Math.max(0, Math.min(time - previousTime, .05))
        previousTime = time
        const response = delta > 0 ? 1 - Math.exp(-delta * 10) : 1
        const activation = (index: number, active: boolean) => {
          const target = active ? 1 : 0
          activations[index] = (activations[index] ?? target) + (target - (activations[index] ?? target)) * response
          return activations[index]!
        }
        rig.position.y = Math.sin(time * .65) * .07
        rig.rotation.set(.04 + pointerY * .09, pointerX * .16, Math.sin(time * .25) * .015)
        orb.rotation.y = p * .9 + time * .16
        if (kind === 'hero') {
          rig.rotation.y += -.28 + p * .75
          rings.forEach((hoop, i) => {
            hoop.rotation.x = .65 + i * .5 + p * .8 + Math.sin(time * .28 + i) * .13
            hoop.rotation.y = -.65 + i * .55 + time * .065 * (i % 2 ? 1 : -1)
            hoop.rotation.z = i * .8 + p * .55 + Math.sin(time * .35 + i) * .1
          })
          sparks.forEach((spark, i) => {
            const a = i * 1.25 + time * .16 + p
            spark.position.set(Math.cos(a) * 2.5, Math.sin(a) * 1.8, Math.sin(a + 1) * 1.4)
          })
        } else if (kind === 'foundation') {
          rig.rotation.y += -.5 + p * .55 + Math.sin(time * .4) * .07
          rig.rotation.x = .32 + pointerY * .09
          nodes.forEach((node, i) => {
            node.position.y = (i - 1) * (.48 + p * 1.02) + Math.sin(time * .85 + i * .8) * .045
            node.rotation.y = (i - 1) * p * .1 + Math.sin(time * .45 + i) * .035
          })
        } else if (kind === 'agent') {
          rig.rotation.y += -.15 + p * .3
          nodes.forEach((node, i) => {
            const active = i === 3 || Boolean(selection & (1 << i))
            const emphasis = activation(i, active)
            const a = i * Math.PI / 2 + .3 + Math.sin(time * .35) * .13
            const radius = 1.9 + p * .65 + Math.sin(time * .7 + i) * .05
            node.position.set(Math.cos(a) * radius, Math.sin(a) * radius * .82, Math.sin(p * Math.PI + i + time * .5) * .15 + emphasis * .12)
            node.rotation.y = pointerX * -.1 + Math.sin(time * .45 + i) * .055
            node.scale.setScalar(1 + emphasis * .035)
            const positions = wires[i]!.attributes.position!
            positions.setXYZ(1, node.position.x, node.position.y, node.position.z)
            positions.needsUpdate = true
            ;(node.children[0] as Three.Mesh).material = active ? accentMaterial : graphite
            wireLines[i]!.visible = active
            const pulse = (time * .25 + i * .23) % 1
            sparks[i]!.position.copy(node.position).multiplyScalar(pulse)
            sparks[i]!.visible = active
          })
        } else if (kind === 'models') {
          rig.rotation.y += -.6 + p * .4 + Math.sin(time * .3) * .07
          rig.rotation.x = .35 + pointerY * .07
          // 轨道缓慢公转，标签保持正向；选中节点平滑前浮，不挤动页面布局。
          nodes.forEach((node, i) => {
            const a = i / 8 * Math.PI * 2 + p * .45 + time * .055
            const emphasis = activation(i, selection === i)
            node.position.set(Math.cos(a) * 2.45, Math.sin(a) * 2.45, Math.sin(a) * .32 + emphasis * .48)
            node.scale.setScalar(1 + emphasis * .12)
            node.rotation.y = Math.sin(time * .5 + i) * .06
            plates[i]!.material = selection === i ? accentMaterial : graphite
          })
          orb.rotation.set(0, 0, 0)
          orb.scale.setScalar(1 + Math.sin(time * .8) * .015)
        } else {
          rig.rotation.y += -.55 + p * .85 + Math.sin(time * .4) * .12
          rig.rotation.x = .16 + pointerY * .07
          nodes.forEach((node, i) => {
            node.position.set(Math.sin(p * Math.PI + i + time * .5) * .13, (i - 1) * .85 + Math.sin(time * .8 + i) * .055, .1 + Math.sin(p * Math.PI) * .25)
            node.rotation.y = (i - 1) * .06 + Math.sin(time * .45 + i) * .04
          })
          sparks.forEach((spark, i) => {
            const a = i * 2.4 + time * .3
            spark.position.set(Math.cos(a) * 1.32, ((i / 12 + time * .1 + p) % 1) * 2.8 - 1.4, Math.sin(a) * 1.1)
          })
        }
        const distance = (kind === 'hero' ? 10.6 : kind === 'foundation' ? 10 : 11.7) * Math.max(1, .9 / Math.max(aspect, .3))
        camera.position.set(0, kind === 'foundation' ? 4.8 : .55, distance)
        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
      },
      setTheme(dark) {
        if (disposed) return
        // 复用现有场景与 GPU 资源，主题切换不重建 canvas，也不重置动画。
        ambient.color.set(dark ? 0xdde4ff : 0xe7efff)
        rim.color.set(dark ? 0xc763ff : 0x88afff)
        chrome.color.set(dark ? 0xc5cee9 : 0xd7e3f7)
        chrome.metalness = dark ? 1 : .82
        graphite.color.set(dark ? 0x171d38 : 0x233959)
        accentMaterial.color.set(dark ? 0x793cf2 : 0x245cda)
        accentMaterial.emissive.set(dark ? 0x4b16c4 : 0x000000)
        accentMaterial.emissiveIntensity = dark ? .22 : 0
        glow.color.set(dark ? 0x61caff : 0x2879ed)
        lineMaterial.color.set(dark ? 0x9a8af0 : 0x5086ca)
        lineMaterial.opacity = dark ? .35 : .45
        glass.color.set(dark ? 0x9671f5 : 0x7ca7ed)
        glass.opacity = dark ? .15 : .12
      },
      dispose,
    }
  } catch (error) { dispose(); throw error }
}
