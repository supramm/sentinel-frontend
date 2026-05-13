import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges, OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

/* ─── Color tokens ────────────────────────────────────────────────── */
const EDGE_COLOR = '#40dfff'
const EDGE_BRIGHT = '#90f4ff'
const EMISSIVE = new THREE.Color(0x00aacc)
const EMISSIVE_BRIGHT = new THREE.Color(0x00d4ff)

export type MotorComponentId = 1 | 2 | 3 | 4 | 5

export interface MotorHighlightProps {
  affectedComponent?: MotorComponentId
  healthColor?: string
}

function isAffected(componentId: MotorComponentId | undefined, affectedComponent?: MotorComponentId) {
  return componentId !== undefined && componentId === affectedComponent
}

function highlightEdgeColor(
  componentId: MotorComponentId,
  { affectedComponent, healthColor = EDGE_COLOR }: MotorHighlightProps,
  fallback = EDGE_COLOR,
) {
  return isAffected(componentId, affectedComponent) ? healthColor : fallback
}

/* ─── HoloPart: floating + self-rotating wrapper ──────────────────── */
interface HoloPartProps {
  children: React.ReactNode
  position: [number, number, number]
  floatAmp?: number
  floatSpeed?: number
  floatOffset?: number
  rotX?: number
  rotY?: number
  rotZ?: number
}

function HoloPart({
  children,
  position,
  floatAmp = 0.07,
  floatSpeed = 0.55,
  floatOffset = 0,
  rotX = 0,
  rotY = 0,
  rotZ = 0,
}: HoloPartProps) {
  const ref = useRef<THREE.Group>(null)
  const [px, py, pz] = position

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.set(
      px,
      py + Math.sin(t * floatSpeed + floatOffset) * floatAmp,
      pz,
    )
    if (rotX) ref.current.rotation.x += rotX
    if (rotY) ref.current.rotation.y += rotY
    if (rotZ) ref.current.rotation.z += rotZ
  })

  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

/* ─── Shared holographic material (inline JSX approach) ──────────── */
function HoloMat({
  opacity = 0.07,
  ei = 0.25,
  color = 0x000d1a,
  emissive = EMISSIVE,
  componentId,
  affectedComponent,
  healthColor = EDGE_COLOR,
}: {
  opacity?: number
  ei?: number
  color?: THREE.ColorRepresentation
  emissive?: THREE.ColorRepresentation
  componentId?: MotorComponentId
} & MotorHighlightProps) {
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  const active = isAffected(componentId, affectedComponent)
  const baseColor = useMemo(() => new THREE.Color(color), [color])
  const baseEmissive = useMemo(() => new THREE.Color(emissive), [emissive])
  const alertEmissive = useMemo(() => new THREE.Color(healthColor), [healthColor])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4.2)
    ref.current.color.copy(baseColor)
    if (active) {
      ref.current.emissive.copy(alertEmissive)
      ref.current.emissiveIntensity = ei + 0.55 + pulse * 0.55
      ref.current.opacity = Math.min(0.9, opacity + 0.1 + pulse * 0.08)
    } else {
      ref.current.emissive.copy(baseEmissive)
      ref.current.emissiveIntensity = ei
      ref.current.opacity = opacity
    }
  })

  return (
    <meshStandardMaterial
      ref={ref}
      color={baseColor}
      emissive={active ? alertEmissive : baseEmissive}
      emissiveIntensity={active ? ei + 0.8 : ei}
      transparent
      opacity={active ? Math.min(0.9, opacity + 0.12) : opacity}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  )
}

/* ─── Main Stator Housing (large right cylinder with fins) ─────────── */
function MainHousing({ s, affectedComponent, healthColor }: { s: number } & MotorHighlightProps) {
  const len = 1.55 * s
  const R = 0.75 * s
  const fins = 15
  const HALF = len / 2
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart position={[2.5 * s, 0, 0]} floatAmp={0.06} floatSpeed={0.45} floatOffset={0}>
      {/* Core body */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R, R, len, 40, 1, false]} />
        <HoloMat opacity={0.06} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_COLOR)} threshold={15} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: fins }, (_, i) => {
        const x = -HALF + (i + 0.5) * (len / fins)
        return (
          <mesh key={i} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[R + 0.045 * s, 0.022 * s, 8, 40]} />
            <HoloMat
              color={0x001020}
              emissive={EMISSIVE_BRIGHT}
              ei={0.7}
              opacity={0.65}
              componentId={5}
              {...highlight}
            />
            <Edges scale={1.001} color={highlightEdgeColor(5, highlight, EDGE_BRIGHT)} />
          </mesh>
        )
      })}

      {/* Left end cap */}
      <mesh position={[-HALF, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R * 0.55, R * 0.55, 0.12 * s, 28]} />
        <HoloMat opacity={0.1} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_BRIGHT)} />
      </mesh>

      {/* Right end cap */}
      <mesh position={[HALF, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R * 0.55, R * 0.55, 0.12 * s, 28]} />
        <HoloMat opacity={0.1} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_BRIGHT)} />
      </mesh>

      {/* Mounting feet suggestion (bottom rail) */}
      <mesh position={[0, -(R + 0.04 * s), 0]}>
        <boxGeometry args={[len * 0.85, 0.12 * s, 0.55 * s]} />
        <HoloMat opacity={0.08} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_COLOR)} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Top Access Cover ────────────────────────────────────────────── */
function AccessCover({ s, affectedComponent, healthColor }: { s: number } & MotorHighlightProps) {
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[2.1 * s, 0.97 * s, 0]}
      floatAmp={0.055}
      floatSpeed={0.42}
      floatOffset={1.2}
    >
      <mesh>
        <boxGeometry args={[0.82 * s, 0.22 * s, 0.55 * s]} />
        <HoloMat opacity={0.07} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_COLOR)} />
      </mesh>
      {/* Lid detail */}
      <mesh position={[0, 0.13 * s, 0]}>
        <boxGeometry args={[0.78 * s, 0.04 * s, 0.51 * s]} />
        <HoloMat opacity={0.05} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_BRIGHT)} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Terminal / Electrical Box ───────────────────────────────────── */
function ElectricalBox({ s, affectedComponent, healthColor }: { s: number } & MotorHighlightProps) {
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[3.1 * s, 0.98 * s, 0.2 * s]}
      floatAmp={0.06}
      floatSpeed={0.38}
      floatOffset={2.5}
    >
      <mesh>
        <boxGeometry args={[0.52 * s, 0.5 * s, 0.42 * s]} />
        <HoloMat opacity={0.07} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_COLOR)} />
      </mesh>
      <mesh position={[0, 0.27 * s, 0]}>
        <boxGeometry args={[0.52 * s, 0.045 * s, 0.42 * s]} />
        <HoloMat opacity={0.05} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_BRIGHT)} />
      </mesh>
      {/* Conduit port */}
      <mesh position={[0, 0, 0.22 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07 * s, 0.07 * s, 0.1 * s, 12]} />
        <HoloMat opacity={0.1} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_BRIGHT)} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Cylindrical Capacitor ───────────────────────────────────────── */
function Capacitor({ s, affectedComponent, healthColor }: { s: number } & MotorHighlightProps) {
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[3.7 * s, 0.85 * s, -0.25 * s]}
      floatAmp={0.065}
      floatSpeed={0.5}
      floatOffset={3.8}
      rotY={0.004}
    >
      <mesh>
        <cylinderGeometry args={[0.14 * s, 0.14 * s, 0.55 * s, 16]} />
        <HoloMat opacity={0.08} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_COLOR)} />
      </mesh>
      <mesh position={[0, 0.3 * s, 0]}>
        <cylinderGeometry args={[0.07 * s, 0.07 * s, 0.1 * s, 8]} />
        <HoloMat opacity={0.1} componentId={3} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(3, highlight, EDGE_BRIGHT)} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Cylindrical Rotor Core ─────────────────────────────────────── */
function RotorCore({ s, affectedComponent, healthColor }: { s: number } & MotorHighlightProps) {
  const len = 1.1 * s
  const R = 0.5 * s
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[0.9 * s, 0, 0]}
      floatAmp={0.08}
      floatSpeed={0.5}
      floatOffset={1.0}
      rotX={0.003}
    >
      {/* Core cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R, R, len, 32, 4]} />
        <HoloMat opacity={0.065} componentId={1} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_COLOR)} threshold={15} />
      </mesh>

      {/* Rotor lamination rings */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -len / 2 + (i + 0.5) * (len / 9)
        return (
          <mesh key={i} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[R * 0.88, 0.012 * s, 6, 28]} />
            <HoloMat color={0x001020} emissive={EMISSIVE} ei={0.5} opacity={0.4} componentId={1} {...highlight} />
          </mesh>
        )
      })}

      {/* Shaft stub (right side) */}
      <mesh position={[len / 2 + 0.15 * s, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1 * s, 0.1 * s, 0.3 * s, 16]} />
        <HoloMat opacity={0.12} componentId={4} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(4, highlight, EDGE_BRIGHT)} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Outer Rotor Ring (large ring with blades/teeth) ─────────────── */
function OuterRotorRing({ s, affectedComponent, healthColor }: { s: number } & MotorHighlightProps) {
  const outerR = 0.92 * s
  const numTeeth = 26
  const depth = 0.14 * s
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[-0.55 * s, 0, 0]}
      floatAmp={0.09}
      floatSpeed={0.62}
      floatOffset={2.0}
      rotX={-0.0025}
    >
      {/* Outer torus ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[outerR, 0.065 * s, 12, 56]} />
        <HoloMat color={0x001020} emissive={EMISSIVE_BRIGHT} ei={0.45} opacity={0.3} componentId={1} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_BRIGHT)} />
      </mesh>

      {/* Gear-like teeth */}
      {Array.from({ length: numTeeth }, (_, i) => {
        const angle = (i / numTeeth) * Math.PI * 2
        const y = Math.sin(angle) * (outerR + 0.05 * s)
        const z = Math.cos(angle) * (outerR + 0.05 * s)
        return (
          <mesh key={i} position={[0, y, z]} rotation={[angle, 0, 0]}>
            <boxGeometry args={[depth, 0.13 * s, 0.065 * s]} />
            <HoloMat opacity={0.06} componentId={1} {...highlight} />
            <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_COLOR)} />
          </mesh>
        )
      })}

      {/* Spokes */}
      {Array.from({ length: 7 }, (_, i) => {
        const angle = (i / 7) * Math.PI * 2
        return (
          <mesh key={i} rotation={[angle, 0, 0]}>
            <boxGeometry args={[depth * 0.7, outerR * 0.72, 0.045 * s]} />
            <HoloMat opacity={0.05} componentId={1} {...highlight} />
            <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_COLOR)} />
          </mesh>
        )
      })}

      {/* Central hub */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24 * s, 0.24 * s, depth, 24]} />
        <HoloMat opacity={0.1} componentId={1} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_BRIGHT)} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Gear Wheel (medium toothed gear, mid-left) ─────────────────── */
function GearWheel({
  s,
  posX,
  outerR = 0.78,
  innerR = 0.3,
  numTeeth = 20,
  floatOffset = 3.0,
  affectedComponent,
  healthColor,
}: {
  s: number
  posX: number
  outerR?: number
  innerR?: number
  numTeeth?: number
  floatOffset?: number
} & MotorHighlightProps) {
  const oR = outerR * s
  const iR = innerR * s
  const depth = 0.13 * s
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[posX * s, 0, 0]}
      floatAmp={0.09}
      floatSpeed={0.68}
      floatOffset={floatOffset}
      rotX={0.004}
    >
      {/* Rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[oR, (oR - iR) * 0.38, 8, 40]} />
        <HoloMat color={0x001020} emissive={EMISSIVE_BRIGHT} ei={0.4} opacity={0.25} componentId={1} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_BRIGHT)} />
      </mesh>

      {/* Teeth */}
      {Array.from({ length: numTeeth }, (_, i) => {
        const angle = (i / numTeeth) * Math.PI * 2
        const y = Math.sin(angle) * (oR + 0.04 * s)
        const z = Math.cos(angle) * (oR + 0.04 * s)
        return (
          <mesh key={i} position={[0, y, z]} rotation={[angle, 0, 0]}>
            <boxGeometry args={[depth, 0.115 * s, 0.06 * s]} />
            <HoloMat opacity={0.06} componentId={1} {...highlight} />
            <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_COLOR)} />
          </mesh>
        )
      })}

      {/* Hub disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[iR, iR, depth, 22]} />
        <HoloMat opacity={0.1} componentId={1} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_BRIGHT)} />
      </mesh>

      {/* Spokes */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} rotation={[angle, 0, 0]}>
            <boxGeometry args={[depth * 0.6, oR * 0.65, 0.04 * s]} />
            <HoloMat opacity={0.04} componentId={1} {...highlight} />
            <Edges scale={1.001} color={highlightEdgeColor(1, highlight, EDGE_COLOR)} />
          </mesh>
        )
      })}
    </HoloPart>
  )
}

/* ─── Support / Bearing Disc ─────────────────────────────────────── */
function SupportDisc({
  s,
  posX,
  R = 0.52,
  floatOffset = 4.0,
  affectedComponent,
  healthColor,
}: {
  s: number
  posX: number
  R?: number
  floatOffset?: number
} & MotorHighlightProps) {
  const r = R * s
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[posX * s, 0, 0]}
      floatAmp={0.07}
      floatSpeed={0.5}
      floatOffset={floatOffset}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.065 * s, 32]} />
        <HoloMat opacity={0.1} componentId={2} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(2, highlight, EDGE_COLOR)} threshold={20} />
      </mesh>

      {/* Outer rim glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.018 * s, 8, 32]} />
        <HoloMat color={0x001020} emissive={EMISSIVE_BRIGHT} ei={0.75} opacity={0.65} componentId={2} {...highlight} />
      </mesh>

      {/* Bolt holes ring */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const y = Math.sin(angle) * r * 0.65
        const z = Math.cos(angle) * r * 0.65
        return (
          <mesh key={i} position={[0, y, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03 * s, 0.03 * s, 0.08 * s, 8]} />
            <HoloMat opacity={0.15} componentId={2} {...highlight} />
          </mesh>
        )
      })}
    </HoloPart>
  )
}

/* ─── Front Shaft Connector ──────────────────────────────────────── */
function ShaftConnector({ s, affectedComponent, healthColor }: { s: number } & MotorHighlightProps) {
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[-3.3 * s, 0, 0]}
      floatAmp={0.06}
      floatSpeed={0.8}
      floatOffset={5.1}
      rotX={0.005}
    >
      {/* Shaft cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1 * s, 0.1 * s, 0.52 * s, 16]} />
        <HoloMat opacity={0.1} componentId={4} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(4, highlight, EDGE_COLOR)} />
      </mesh>

      {/* Connector flange */}
      <mesh position={[0.28 * s, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22 * s, 0.22 * s, 0.1 * s, 20]} />
        <HoloMat opacity={0.1} componentId={4} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(4, highlight, EDGE_BRIGHT)} />
      </mesh>

      {/* Key-way protrusion */}
      <mesh position={[0, 0.11 * s, 0]}>
        <boxGeometry args={[0.3 * s, 0.04 * s, 0.04 * s]} />
        <HoloMat opacity={0.12} componentId={4} {...highlight} />
        <Edges scale={1.001} color={highlightEdgeColor(4, highlight, EDGE_BRIGHT)} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Gasket Ring ─────────────────────────────────────────────────── */
function GasketRing({
  s,
  posX,
  floatOffset = 3.3,
  affectedComponent,
  healthColor,
}: { s: number; posX: number; floatOffset?: number } & MotorHighlightProps) {
  const highlight = { affectedComponent, healthColor }

  return (
    <HoloPart
      position={[posX * s, 0, 0]}
      floatAmp={0.055}
      floatSpeed={0.58}
      floatOffset={floatOffset}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.57 * s, 0.028 * s, 10, 56]} />
        <HoloMat color={0x001020} emissive={0x00bbcc} ei={0.7} opacity={0.65} componentId={2} {...highlight} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Floating Bolt / Fastener ────────────────────────────────────── */
function Bolt({
  s,
  position,
  floatOffset = 0,
}: {
  s: number
  position: [number, number, number]
  floatOffset?: number
}) {
  const [px, py, pz] = position
  return (
    <HoloPart
      position={[px * s, py * s, pz * s]}
      floatAmp={0.04}
      floatSpeed={1.1}
      floatOffset={floatOffset}
      rotX={0.012}
    >
      {/* Bolt shank */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04 * s, 0.03 * s, 0.26 * s, 8]} />
        <HoloMat opacity={0.2} ei={0.4} />
        <Edges scale={1.001} color={EDGE_BRIGHT} />
      </mesh>

      {/* Bolt head (hex) */}
      <mesh position={[-0.14 * s, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075 * s, 0.075 * s, 0.07 * s, 6]} />
        <HoloMat opacity={0.2} ei={0.4} />
        <Edges scale={1.001} color={EDGE_BRIGHT} />
      </mesh>
    </HoloPart>
  )
}

/* ─── Atmosphere Particles ────────────────────────────────────────── */
function AtmosphereParticles({ s }: { s: number }) {
  const count = 350
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 14 * s
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7 * s
      arr[i * 3 + 2] = (Math.random() - 0.5) * 9 * s
    }
    return arr
  }, [count, s])

  const ref = useRef<THREE.Points>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.018
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={new THREE.Color(EDGE_COLOR)}
        size={0.018 * s}
        transparent
        opacity={0.45}
        sizeAttenuation
      />
    </points>
  )
}

/* ─── Holographic Floor ───────────────────────────────────────────── */
function HoloFloor({ s }: { s: number }) {
  const floorY = -1.15 * s

  return (
    <group position={[0, floorY, 0]}>
      {/* Reflective plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial
          color={new THREE.Color(0x000510)}
          emissive={new THREE.Color(0x001222)}
          emissiveIntensity={0.35}
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Grid helper */}
      <gridHelper
        args={[20 * s, 28, new THREE.Color(0x002244), new THREE.Color(0x001133)]}
      />
    </group>
  )
}

/* ─── Scanning Line (sweeping horizontal highlight) ──────────────── */
function ScanLine({ s }: { s: number }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.35) * 1.3 * s
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + Math.abs(Math.sin(clock.elapsedTime * 0.7)) * 0.1
    }
  })

  return (
    <mesh ref={ref} position={[0, 0, 2.0 * s]}>
      <planeGeometry args={[12 * s, 0.012 * s]} />
      <meshBasicMaterial
        color={new THREE.Color(EDGE_BRIGHT)}
        transparent
        opacity={0.15}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* ─── Axis glow lines (connecting components) ─────────────────────── */
function AxisLine({ s }: { s: number }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + Math.sin(clock.elapsedTime * 0.9) * 0.05
    }
  })

  return (
    <mesh ref={ref} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.005 * s, 0.005 * s, 7.5 * s, 4]} />
      <meshBasicMaterial
        color={new THREE.Color(EDGE_COLOR)}
        transparent
        opacity={0.15}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ─── Scene ───────────────────────────────────────────────────────── */
function MotorScene({ affectedComponent, healthColor }: MotorHighlightProps) {
  const { viewport } = useThree()
  // Responsive scale: motor spans ~8.5 units wide at s=1
  const s = Math.min(1.0, (viewport.width / 8.8) * 0.98)
  const highlight = { affectedComponent, healthColor }

  const rootRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (rootRef.current) {
      rootRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.06) * 0.06
    }
  })

  const bolts: Array<{ pos: [number, number, number]; offset: number }> = [
    { pos: [1.55, 0.85, 0.5], offset: 0.5 },
    { pos: [1.55, -0.85, 0.5], offset: 1.3 },
    { pos: [1.55, 0.85, -0.5], offset: 2.1 },
    { pos: [1.55, -0.85, -0.5], offset: 2.9 },
    { pos: [3.2, 0.75, 0.35], offset: 3.7 },
    { pos: [-0.4, 0.55, 0.4], offset: 4.5 },
    { pos: [-0.4, -0.55, -0.4], offset: 5.2 },
  ]

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 6 * s, 4 * s]} color={new THREE.Color(EDGE_COLOR)} intensity={3.5} />
      <pointLight position={[-4 * s, 3 * s, 2 * s]} color={new THREE.Color(EDGE_COLOR)} intensity={2.0} />
      <pointLight position={[5 * s, 2 * s, -2 * s]} color={new THREE.Color(0x0055aa)} intensity={1.5} />

      {/* Stars */}
      <Stars radius={80} depth={50} count={600} factor={1.8} saturation={0} fade />

      {/* Motor assembly root */}
      <group ref={rootRef}>
        {/* Right side: main body + accessories */}
        <MainHousing s={s} {...highlight} />
        <AccessCover s={s} {...highlight} />
        <ElectricalBox s={s} {...highlight} />
        <Capacitor s={s} {...highlight} />

        {/* Center: rotor */}
        <RotorCore s={s} {...highlight} />

        {/* Left-center: outer rotor ring */}
        <OuterRotorRing s={s} {...highlight} />

        {/* Left: gear wheels */}
        <GearWheel s={s} posX={-1.78} outerR={0.83} innerR={0.28} numTeeth={22} floatOffset={3.0} {...highlight} />
        <GearWheel s={s} posX={-2.55} outerR={0.62} innerR={0.22} numTeeth={17} floatOffset={4.2} {...highlight} />

        {/* Far left: disc + shaft */}
        <SupportDisc s={s} posX={-3.0} R={0.47} floatOffset={5.5} {...highlight} />
        <ShaftConnector s={s} {...highlight} />

        {/* Gasket rings between major sections */}
        <GasketRing s={s} posX={1.65} floatOffset={0.8} {...highlight} />
        <GasketRing s={s} posX={0.2} floatOffset={2.1} {...highlight} />
        <GasketRing s={s} posX={-1.2} floatOffset={3.6} {...highlight} />

        {/* Floating bolts */}
        {bolts.map(({ pos, offset }, i) => (
          <Bolt key={i} s={s} position={pos} floatOffset={offset} />
        ))}

        {/* Atmospheric elements */}
        <AxisLine s={s} />
        <ScanLine s={s} />
        <AtmosphereParticles s={s} />
        <HoloFloor s={s} />
      </group>

      {/* Controls */}
      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.35}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={4}
        maxDistance={18}
        target={[0, 0, 0]}
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.08} intensity={1.8} />
      </EffectComposer>
    </>
  )
}

/* ─── HUD Overlay ─────────────────────────────────────────────────── */
function HUDOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none font-mono">
      {/* Corner brackets */}
      <div className="absolute top-5 left-5 w-10 h-10 border-l-2 border-t-2 border-cyan-400/40" />
      <div className="absolute top-5 right-5 w-10 h-10 border-r-2 border-t-2 border-cyan-400/40" />
      <div className="absolute bottom-5 left-5 w-10 h-10 border-l-2 border-b-2 border-cyan-400/40" />
      <div className="absolute bottom-5 right-5 w-10 h-10 border-r-2 border-b-2 border-cyan-400/40" />

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-1">
        <span className="text-cyan-400/50 text-[10px] tracking-[0.35em] uppercase">
          HOLOGRAPHIC CAD VISUALIZATION  •  v4.7.2
        </span>
        <span className="text-cyan-300/80 text-xs tracking-[0.25em] uppercase">
          AC INDUCTION MOTOR — EXPLODED VIEW
        </span>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent mt-1" />
      </div>

      {/* Left panel */}
      <div className="absolute top-1/2 left-5 -translate-y-1/2 hidden md:flex flex-col gap-2">
        {[
          ['STATOR', 'ASSEMBLED'],
          ['ROTOR', 'EXPLODED'],
          ['SHAFT', 'DETACHED'],
          ['BEARINGS', 'FLOATING'],
        ].map(([label, status]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/70 animate-pulse" />
            <span className="text-cyan-400/50 text-[10px] tracking-widest">{label}</span>
            <span className="text-cyan-300/30 text-[9px]">{status}</span>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div className="absolute top-1/2 right-5 -translate-y-1/2 hidden md:flex flex-col gap-1.5 text-right">
        {[
          ['MODEL', 'EM-7400X-PRO'],
          ['POWER', '7.5 kW'],
          ['VOLTAGE', '380V / 60Hz'],
          ['SPEED', '1450 RPM'],
          ['CLASS', 'IP-55 / F'],
          ['MASS', '48.3 kg'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 justify-end">
            <span className="text-cyan-400/40 text-[9px] tracking-widest">{k}</span>
            <span className="text-cyan-300/70 text-[10px]">{v}</span>
          </div>
        ))}
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 md:gap-12">
        {[
          ['COMPONENTS', '9'],
          ['GEOMETRY', 'PROCEDURAL'],
          ['RENDER', 'HOLOGRAPHIC'],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col items-center gap-0.5">
            <span className="text-cyan-400/40 text-[9px] tracking-widest">{k}</span>
            <span className="text-cyan-300/60 text-[10px] tracking-wider">{v}</span>
          </div>
        ))}
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-14 left-0 right-0 flex justify-center">
        <span className="text-cyan-400/25 text-[9px] tracking-widest">DRAG TO ROTATE • SCROLL TO ZOOM</span>
      </div>
    </div>
  )
}

/* ─── Root Export ─────────────────────────────────────────────────── */
export function HolographicMotor({ affectedComponent, healthColor }: MotorHighlightProps) {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 40%, #021228 0%, #010a1c 50%, #000308 100%)',
      }}
    >
      <HUDOverlay />

      <Canvas
        camera={{ position: [5.5, 3.0, 10], fov: 50, near: 0.01, far: 1000 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <MotorScene affectedComponent={affectedComponent} healthColor={healthColor} />
        </Suspense>
      </Canvas>
    </div>
  )
}
