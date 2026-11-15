import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'

interface AdaptiveFieldCanvasProps {
  activeMode: 'visual' | 'simple' | 'audio' | 'bionic' | 'contrast'
  paused?: boolean
}

const MODE_PALETTES: Record<
  AdaptiveFieldCanvasProps['activeMode'],
  { primary: number; secondary: number; accent: number; speed: number; pulse: number }
> = {
  bionic: { primary: 0x0f766e, secondary: 0x2dd4bf, accent: 0x14b8a6, speed: 0.85, pulse: 0.32 },
  audio: { primary: 0x0369a1, secondary: 0x38bdf8, accent: 0x0ea5e9, speed: 1.35, pulse: 0.52 },
  simple: { primary: 0x0d9488, secondary: 0x5eead4, accent: 0x2dd4bf, speed: 0.55, pulse: 0.22 },
  contrast: { primary: 0x0f172a, secondary: 0x334155, accent: 0x1e293b, speed: 0.4, pulse: 0.16 },
  visual: { primary: 0x115e59, secondary: 0x14b8a6, accent: 0x0d9488, speed: 0.75, pulse: 0.28 },
}

export function AdaptiveFieldCanvas({ activeMode, paused = false }: AdaptiveFieldCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const calmMode = useStore((s) => s.learningModes.includes('focus'))
  const modeRef = useRef(activeMode)
  const pausedRef = useRef(paused)

  useEffect(() => {
    modeRef.current = activeMode
  }, [activeMode])

  useEffect(() => {
    pausedRef.current = paused || calmMode
  }, [paused, calmMode])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      return
    }

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || 760

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 120)
    camera.position.set(0, 0, 13.5)
    camera.lookAt(0, 0, 0)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0x2dd4bf, 2.2)
    dirLight1.position.set(6, 8, 10)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0x0f766e, 1.6)
    dirLight2.position.set(-8, -6, 6)
    scene.add(dirLight2)

    const rootGroup = new THREE.Group()
    scene.add(rootGroup)

    // 1. Upright Geodesic Wireframe Sphere (Full-screen vertical & horizontal presence)
    const sphereGeo = new THREE.IcosahedronGeometry(4.6, 3)
    const sphereBasePos = sphereGeo.attributes.position.array.slice() as Float32Array
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: MODE_PALETTES[modeRef.current].primary,
      wireframe: true,
      transparent: true,
      opacity: 0.24,
      roughness: 0.2,
      metalness: 0.1,
    })
    const wireframeSphere = new THREE.Mesh(sphereGeo, sphereMat)
    rootGroup.add(wireframeSphere)

    // 2. Inner Translucent Sculptural Core
    const coreGeo = new THREE.IcosahedronGeometry(2.65, 2)
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: MODE_PALETTES[modeRef.current].secondary,
      transparent: true,
      opacity: 0.14,
      roughness: 0.15,
      metalness: 0.3,
      wireframe: false,
    })
    const innerCore = new THREE.Mesh(coreGeo, coreMat)
    rootGroup.add(innerCore)

    // 3. Three Upright Gyroscopic Rings (No flat floor look)
    const ringGeo1 = new THREE.TorusGeometry(6.1, 0.025, 16, 128)
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: MODE_PALETTES[modeRef.current].primary,
      transparent: true,
      opacity: 0.34,
    })
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1)
    ring1.rotation.set(0.35, 0.4, 0)
    rootGroup.add(ring1)

    const ringGeo2 = new THREE.TorusGeometry(7.4, 0.02, 16, 128)
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: MODE_PALETTES[modeRef.current].secondary,
      transparent: true,
      opacity: 0.26,
    })
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2)
    ring2.rotation.set(-0.55, -0.3, 0.4)
    rootGroup.add(ring2)

    const ringGeo3 = new THREE.TorusGeometry(8.8, 0.016, 16, 128)
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: MODE_PALETTES[modeRef.current].accent,
      transparent: true,
      opacity: 0.18,
    })
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3)
    ring3.rotation.set(0.18, -0.65, -0.3)
    rootGroup.add(ring3)

    // 4. Full-Viewport 3D Volumetric Particle Constellation (Covers X: -14..14, Y: -8..8, Z: -6..4)
    const particleCount = 680
    const particlePositions = new Float32Array(particleCount * 3)
    const particleBase = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)

    const colorA = new THREE.Color(MODE_PALETTES[modeRef.current].primary)
    const colorB = new THREE.Color(MODE_PALETTES[modeRef.current].secondary)
    const tempColor = new THREE.Color()

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 3.2 + Math.random() * 8.5

      const x = radius * Math.sin(phi) * Math.cos(theta) * 1.35
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.95
      const z = radius * Math.cos(phi) * 0.65

      particlePositions[i * 3] = x
      particlePositions[i * 3 + 1] = y
      particlePositions[i * 3 + 2] = z

      particleBase[i * 3] = x
      particleBase[i * 3 + 1] = y
      particleBase[i * 3 + 2] = z

      tempColor.copy(colorA).lerp(colorB, Math.random())
      particleColors[i * 3] = tempColor.r
      particleColors[i * 3 + 1] = tempColor.g
      particleColors[i * 3 + 2] = tempColor.b
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
    })

    const constellation = new THREE.Points(particleGeo, particleMat)
    rootGroup.add(constellation)

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointer.targetX = ((e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2
      pointer.targetY = ((e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || 760
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    let rafId = 0
    let clock = 0

    const renderFrame = () => {
      const palette = MODE_PALETTES[modeRef.current]
      sphereMat.color.setHex(palette.primary)
      coreMat.color.setHex(palette.secondary)
      ringMat1.color.setHex(palette.primary)
      ringMat2.color.setHex(palette.secondary)
      ringMat3.color.setHex(palette.accent)

      if (!pausedRef.current) {
        clock += 0.015 * palette.speed
      }

      pointer.x += (pointer.targetX - pointer.x) * 0.05
      pointer.y += (pointer.targetY - pointer.y) * 0.05

      // Morph upright geodesic sphere vertices organically
      const sPos = sphereGeo.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < sPos.count; i++) {
        const bx = sphereBasePos[i * 3]
        const by = sphereBasePos[i * 3 + 1]
        const bz = sphereBasePos[i * 3 + 2]
        const wave =
          1 +
          Math.sin(bx * 0.65 + clock * 1.4) *
            Math.cos(by * 0.65 + clock * 1.1) *
            (palette.pulse * 0.25)
        sPos.setXYZ(i, bx * wave, by * wave, bz * wave)
      }
      sPos.needsUpdate = true

      // Animate volumetric constellation across full viewport
      const pPos = particleGeo.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < particleCount; i++) {
        const bx = particleBase[i * 3]
        const by = particleBase[i * 3 + 1]
        const bz = particleBase[i * 3 + 2]
        const floatY = by + Math.sin(clock + bx * 0.5) * 0.28
        const floatX = bx + Math.cos(clock * 0.8 + by * 0.5) * 0.22
        pPos.setXYZ(i, floatX, floatY, bz)
      }
      pPos.needsUpdate = true

      wireframeSphere.rotation.y = clock * 0.22 + pointer.x * 0.35
      wireframeSphere.rotation.x = clock * 0.14 - pointer.y * 0.25
      innerCore.rotation.y = -clock * 0.3
      innerCore.rotation.z = clock * 0.18

      ring1.rotation.z = clock * 0.24
      ring1.rotation.x = 0.35 + Math.sin(clock * 0.5) * 0.2
      ring2.rotation.z = -clock * 0.19
      ring2.rotation.y = -0.3 + Math.cos(clock * 0.4) * 0.22
      ring3.rotation.x = 0.18 + Math.sin(clock * 0.3) * 0.18
      ring3.rotation.z = clock * 0.12

      constellation.rotation.y = clock * 0.06 + pointer.x * 0.18
      constellation.rotation.x = -pointer.y * 0.12

      renderer.render(scene, camera)
      rafId = window.requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('resize', handleResize)
      sphereGeo.dispose()
      sphereMat.dispose()
      coreGeo.dispose()
      coreMat.dispose()
      ringGeo1.dispose()
      ringMat1.dispose()
      ringGeo2.dispose()
      ringMat2.dispose()
      ringGeo3.dispose()
      ringMat3.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-95"
    />
  )
}
