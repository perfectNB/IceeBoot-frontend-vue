import type * as Three from 'three'

type ThreeModule = typeof import('three')
type Disposable = { dispose: () => void }

export interface EngineScene {
  resize: (width: number, height: number) => void
  render: (progress: number, time: number, pointerX: number, pointerY: number) => void
  dispose: () => void
}

/** 自建几何与演播室反射，不加载模型、纹理或第三方网络资源。 */
export function createEngineScene(THREE: ThreeModule, canvas: HTMLCanvasElement): EngineScene {
  const resources = new Set<Disposable>()
  const track = <T extends Disposable>(resource: T): T => { resources.add(resource); return resource }
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.16

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 70)
  const rig = new THREE.Group()
  scene.add(rig)
  let aspect = 1
  let disposed = false
  const cleanUp = () => {
    if (disposed) return
    disposed = true
    scene.environment = null
    scene.clear()
    for (const resource of resources) resource.dispose()
    resources.clear()
    renderer.dispose()
    if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
  }

  try {
    // 数条明亮的摄影棚灯带在金属倒角上形成清晰的银色高光。
    const environmentCanvas = document.createElement('canvas')
    environmentCanvas.width = 1024
    environmentCanvas.height = 512
    const environmentContext = environmentCanvas.getContext('2d')
    if (environmentContext) {
      const gradient = environmentContext.createLinearGradient(0, 0, 0, 512)
      gradient.addColorStop(0, '#9baac3')
      gradient.addColorStop(0.46, '#263349')
      gradient.addColorStop(1, '#080d19')
      environmentContext.fillStyle = gradient
      environmentContext.fillRect(0, 0, 1024, 512)
      environmentContext.fillStyle = '#edf4ff'
      environmentContext.fillRect(80, 70, 550, 75)
      environmentContext.fillStyle = '#b8d5ff'
      environmentContext.fillRect(770, 160, 80, 250)
      environmentContext.fillStyle = '#314e9f'
      environmentContext.fillRect(0, 275, 350, 60)
      const environment = new THREE.CanvasTexture(environmentCanvas)
      environment.mapping = THREE.EquirectangularReflectionMapping
      environment.colorSpace = THREE.SRGBColorSpace
      const pmrem = new THREE.PMREMGenerator(renderer)
      try {
        const target = track(pmrem.fromEquirectangular(environment))
        scene.environment = target.texture
      } finally {
        environment.dispose()
        pmrem.dispose()
      }
    }

    scene.add(new THREE.HemisphereLight(0xcbdcff, 0x10172c, 2.1))
    const key = new THREE.DirectionalLight(0xf0f5ff, 4.4)
    key.position.set(3.5, 7, 5)
    const fill = new THREE.DirectionalLight(0x4b82ff, 3.8)
    fill.position.set(-5, 2, 2)
    const rim = new THREE.DirectionalLight(0xbddaff, 4.6)
    rim.position.set(2, 5, -5)
    scene.add(key, fill, rim)

    const silver = track(new THREE.MeshStandardMaterial({ color: 0x8f9eb7, metalness: 0.94, roughness: 0.22 }))
    const darkMetal = track(new THREE.MeshStandardMaterial({ color: 0x101a2c, metalness: 0.82, roughness: 0.29 }))
    const graphite = track(new THREE.MeshStandardMaterial({ color: 0x060c19, metalness: 0.65, roughness: 0.25 }))
    const cobalt = track(new THREE.MeshPhysicalMaterial({ color: 0x153e9c, metalness: 0.48, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.15 }))
    const glass = track(new THREE.MeshPhysicalMaterial({ color: 0xb1ccff, metalness: 0.08, roughness: 0.12, transmission: 0.3, thickness: 0.16, transparent: true, opacity: 0.58, clearcoat: 1, depthWrite: false }))
    const blueLight = track(new THREE.MeshBasicMaterial({ color: 0x8bb8ff, toneMapped: false }))
    const traceMaterial = track(new THREE.LineBasicMaterial({ color: 0x708fbb, transparent: true, opacity: 0.42, depthWrite: false }))
    const edgeMaterial = track(new THREE.LineBasicMaterial({ color: 0xb7d6ff, transparent: true, opacity: 0.62, depthWrite: false }))

    function roundedShape(width: number, depth: number, radius = 0.18) {
      const shape = new THREE.Shape()
      const x = -width / 2, z = -depth / 2
      shape.moveTo(x + radius, z)
      shape.lineTo(x + width - radius, z)
      shape.quadraticCurveTo(x + width, z, x + width, z + radius)
      shape.lineTo(x + width, z + depth - radius)
      shape.quadraticCurveTo(x + width, z + depth, x + width - radius, z + depth)
      shape.lineTo(x + radius, z + depth)
      shape.quadraticCurveTo(x, z + depth, x, z + depth - radius)
      shape.lineTo(x, z + radius)
      shape.quadraticCurveTo(x, z, x + radius, z)
      return shape
    }

    function plate(parent: Three.Group, width: number, depth: number, height: number, y: number, material: Three.Material, radius = 0.18) {
      const geometry = track(new THREE.ExtrudeGeometry(roundedShape(width, depth, radius), {
        depth: height, bevelEnabled: true, bevelSegments: 3,
        steps: 1, bevelSize: Math.min(height * 0.3, 0.055), bevelThickness: Math.min(height * 0.22, 0.045), curveSegments: 10,
      }))
      geometry.center()
      geometry.rotateX(-Math.PI / 2)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.y = y
      parent.add(mesh)
      return mesh
    }

    function border(parent: Three.Group, width: number, depth: number, y: number) {
      const vertices = roundedShape(width, depth).getPoints(10).map(point => new THREE.Vector3(point.x, y, -point.y))
      const geometry = track(new THREE.BufferGeometry().setFromPoints(vertices))
      parent.add(new THREE.LineLoop(geometry, edgeMaterial))
    }

    function circuits(parent: Three.Group, width: number, depth: number, y: number) {
      const points: number[] = []
      for (let i = 0; i < 12; i++) {
        const side = i < 6 ? -1 : 1
        const z = ((i % 6) / 5 - 0.5) * (depth - 0.65)
        const x0 = side * (width / 2 - 0.24)
        const x1 = side * (0.85 + (i % 3) * 0.19)
        const x2 = side * 0.58
        const z2 = z * 0.55
        points.push(x0, y, z, x1, y, z, x1, y, z, x2, y, z2, x2, y, z2, side * 0.34, y, z2)
      }
      const geometry = track(new THREE.BufferGeometry())
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
      parent.add(new THREE.LineSegments(geometry, traceMaterial))
    }

    const foundation = new THREE.Group()
    const security = new THREE.Group()
    const agent = new THREE.Group()
    rig.add(foundation, security, agent)
    plate(foundation, 5.25, 3.65, 0.23, 0, silver, 0.26)
    plate(foundation, 4.98, 3.38, 0.09, 0.16, darkMetal, 0.23)
    border(foundation, 5.1, 3.5, 0.135)
    circuits(foundation, 4.95, 3.35, 0.215)

    // 侧面机加工散热槽，批量实例化控制 draw call。
    const slotGeometry = track(new THREE.BoxGeometry(0.13, 0.048, 0.015))
    const vents = track(new THREE.InstancedMesh(slotGeometry, graphite, 18))
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < 18; i++) {
      matrix.makeTranslation(-1.84 + i * 0.215, -0.005, 1.842)
      vents.setMatrixAt(i, matrix)
    }
    foundation.add(vents)
    const screws = track(new THREE.InstancedMesh(track(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14)), silver, 4))
    for (let i = 0; i < 4; i++) {
      matrix.makeTranslation(i % 2 ? 2.29 : -2.29, 0.224, i < 2 ? -1.46 : 1.46)
      screws.setMatrixAt(i, matrix)
    }
    foundation.add(screws)

    plate(security, 4.72, 3.2, 0.09, 0, silver, 0.22)
    plate(security, 4.48, 2.96, 0.09, 0.105, glass, 0.2)
    border(security, 4.53, 3.01, 0.17)
    circuits(security, 4.3, 2.8, 0.159)
    plate(agent, 3.85, 2.57, 0.12, 0, darkMetal, 0.2)
    border(agent, 3.74, 2.46, 0.081)
    circuits(agent, 3.65, 2.4, 0.086)
    plate(agent, 2.02, 1.82, 0.22, 0.23, silver, 0.14)
    plate(agent, 1.84, 1.64, 0.17, 0.4, graphite, 0.12)
    plate(agent, 1.57, 1.37, 0.06, 0.525, cobalt, 0.1)
    border(agent, 1.63, 1.43, 0.569)

    const pinGeometry = track(new THREE.BoxGeometry(0.16, 0.035, 0.05))
    const pins = track(new THREE.InstancedMesh(pinGeometry, silver, 28))
    for (let i = 0; i < 28; i++) {
      const side = i < 14 ? -1 : 1
      matrix.makeTranslation(side * 1.07, 0.27, -0.75 + (i % 14) * 0.115)
      pins.setMatrixAt(i, matrix)
    }
    agent.add(pins)
    const glyphMaterial = track(new THREE.MeshStandardMaterial({ color: 0xe0edff, metalness: 0.68, roughness: 0.15, emissive: 0x7cabff, emissiveIntensity: 0.18 }))
    for (const side of [-1, 1]) {
      const bracket = new THREE.Mesh(track(new THREE.BoxGeometry(0.06, 0.026, 0.6)), glyphMaterial)
      bracket.position.set(side * 0.3, 0.575, 0)
      agent.add(bracket)
      for (const end of [-1, 1]) {
        const tip = new THREE.Mesh(track(new THREE.BoxGeometry(0.17, 0.026, 0.06)), glyphMaterial)
        tip.position.set(side * 0.245, 0.575, end * 0.27)
        agent.add(tip)
      }
    }
    const glyphCore = new THREE.Mesh(track(new THREE.BoxGeometry(0.09, 0.03, 0.42)), blueLight)
    glyphCore.position.set(0, 0.577, 0)
    glyphCore.rotation.y = 0.25
    agent.add(glyphCore)
    // 单个半透明封装盖形成真实折射与反射层，而不是纯平面示意。
    plate(agent, 2.17, 1.97, 0.075, 0.735, glass, 0.16)
    border(agent, 2.14, 1.94, 0.78)

    const modules: Three.Group[] = []
    const connections: { geometry: Three.BufferGeometry; values: Float32Array; material: Three.LineBasicMaterial; sparks: Three.Mesh[] }[] = []
    const sparkGeometry = track(new THREE.SphereGeometry(0.025, 8, 6))
    for (let i = 0; i < 3; i++) {
      const module = new THREE.Group()
      plate(module, 0.9, 1.02, 0.28, 0, silver, 0.12)
      plate(module, 0.75, 0.87, 0.09, 0.2, darkMetal, 0.1)
      plate(module, 0.53, 0.57, 0.055, 0.285, cobalt, 0.07)
      border(module, 0.69, 0.81, 0.27)
      // 1/2/3枚精密触点，在不依赖文字的情况下区分三个能力模块。
      for (let contact = 0; contact <= i; contact++) {
        const dot = new THREE.Mesh(track(new THREE.BoxGeometry(0.065, 0.02, 0.19)), blueLight)
        dot.position.set((contact - i / 2) * 0.14, 0.327, 0)
        module.add(dot)
      }
      modules.push(module)
      rig.add(module)
      const values = new Float32Array(40 * 3)
      const geometry = track(new THREE.BufferGeometry())
      geometry.setAttribute('position', new THREE.BufferAttribute(values, 3).setUsage(THREE.DynamicDrawUsage))
      const material = track(new THREE.LineBasicMaterial({ color: 0x88b6ff, transparent: true, opacity: 0.58, depthWrite: false }))
      const line = new THREE.Line(geometry, material)
      line.frustumCulled = false
      rig.add(line)
      const sparks = [new THREE.Mesh(sparkGeometry, blueLight), new THREE.Mesh(sparkGeometry, blueLight)]
      sparks.forEach(spark => rig.add(spark))
      connections.push({ geometry, values, material, sparks })
    }

    const particlePositions = new Float32Array(84 * 3)
    let seed = 37
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
    for (let i = 0; i < particlePositions.length; i += 3) {
      particlePositions[i] = (random() - 0.5) * 13
      particlePositions[i + 1] = (random() - 0.5) * 6
      particlePositions[i + 2] = (random() - 0.5) * 9
    }
    const particleGeometry = track(new THREE.BufferGeometry())
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMaterial = track(new THREE.PointsMaterial({ color: 0x9bbdff, size: 0.017, sizeAttenuation: true, transparent: true, opacity: 0.52, depthWrite: false }))
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    const sampleConnection = (index: number, t: number, destination: Three.Vector3, sourceY: number) => {
      const sourceX = 1.04, sourceZ = (index - 1) * 0.48
      const inverse = 1 - t
      return [
        inverse ** 3 * sourceX + 3 * inverse ** 2 * t * (sourceX + 0.85) + 3 * inverse * t ** 2 * (destination.x - 0.66) + t ** 3 * (destination.x - 0.47),
        inverse ** 3 * sourceY + 3 * inverse ** 2 * t * sourceY + 3 * inverse * t ** 2 * destination.y + t ** 3 * destination.y,
        inverse ** 3 * sourceZ + 3 * inverse ** 2 * t * sourceZ + 3 * inverse * t ** 2 * destination.z + t ** 3 * destination.z,
      ] as const
    }

    return {
      resize(width, height) {
        if (disposed || width <= 0 || height <= 0) return
        aspect = width / height
        camera.aspect = aspect
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
      },
      render(progress, time, pointerX, pointerY) {
        if (disposed) return
        const p = Math.min(1, Math.max(0, progress))
        const unfold = Math.sin(p * Math.PI)
        foundation.position.y = -0.94 - unfold * 0.62
        security.position.y = -0.46 + unfold * 0.12
        agent.position.y = 0.06 + unfold * 1.13
        security.rotation.y = unfold * -0.065
        agent.rotation.y = unfold * 0.045
        rig.rotation.y = -0.14 + p * 0.2 + pointerX * 0.055
        rig.rotation.z = pointerX * -0.02
        rig.position.y = Math.sin(time * 0.45) * 0.024
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i]!
          module.position.set(3.03 + unfold * 0.26, 0.13 + unfold * 1.28 + (i - 1) * 0.09, (i - 1) * 1.45)
          module.rotation.y = unfold * (i - 1) * 0.07
          const connection = connections[i]!
          for (let sample = 0; sample < 40; sample++) {
            const point = sampleConnection(i, sample / 39, module.position, agent.position.y + 0.27)
            connection.values.set(point, sample * 3)
          }
          connection.geometry.attributes.position!.needsUpdate = true
          for (let sparkIndex = 0; sparkIndex < connection.sparks.length; sparkIndex++) {
            const point = sampleConnection(i, (time * 0.15 + i * 0.23 + sparkIndex * 0.49) % 1, module.position, agent.position.y + 0.27)
            connection.sparks[sparkIndex]!.position.set(...point)
          }
        }
        const orbit = 0.62 + p * 0.43 + pointerX * 0.04
        const distance = 12.1 * Math.max(1, 0.96 / Math.max(aspect, 0.4))
        const elevation = 0.56 + unfold * 0.035 + pointerY * 0.025
        const horizontal = Math.cos(elevation) * distance
        camera.position.set(Math.sin(orbit) * horizontal, Math.sin(elevation) * distance, Math.cos(orbit) * horizontal)
        camera.lookAt(0.24, unfold * 0.17, 0)
        particles.rotation.y = time * 0.008
        renderer.render(scene, camera)
      },
      dispose: cleanUp,
    }
  } catch (error) {
    cleanUp()
    throw error
  }
}
