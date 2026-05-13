import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HolographicMotor } from '../components/HolographicMotor'
import type { MotorComponentId } from '../components/HolographicMotor'
import '../../../Dashboard/hero.css'
import results from '../../../Dashboard/results.json'

const SENSORS = [
  { key: 'temperature_c', label: 'TEMPERATURE', unit: 'C', max: 200, dec: 1 },
  { key: 'vibration_mm_s', label: 'VIBRATION', unit: 'mm/s', max: 10, dec: 2 },
  { key: 'pressure_kpa', label: 'PRESSURE', unit: 'kPa', max: 300, dec: 1 },
  { key: 'motor_rpm', label: 'MOTOR RPM', unit: 'rpm', max: 4000, dec: 0 },
  { key: 'flow_rate_lpm', label: 'FLOW RATE', unit: 'L/min', max: 100, dec: 1 },
  { key: 'power_consumption_kw', label: 'POWER', unit: 'kW', max: 100, dec: 1 },
  { key: 'coolant_temp_c', label: 'COOLANT TEMP', unit: 'C', max: 200, dec: 1 },
  { key: 'acoustic_level_db', label: 'ACOUSTIC', unit: 'dB', max: 120, dec: 1 },
]

const SENSOR_KEYS = SENSORS.map((sensor) => sensor.key)
const SENSOR_TO_COMPONENT: Record<string, MotorComponentId> = {
  vibration_mm_s: 1,
  motor_rpm: 1,
  acoustic_level_db: 1,
  temperature_c: 2,
  coolant_temp_c: 2,
  pressure_kpa: 3,
  flow_rate_lpm: 3,
  power_consumption_kw: 5,
}

type Scenario = {
  scenario_id: string
  machine_type?: string
  operating_mode?: string
  health_status?: string
  inference_time_ms?: number
  sensor_snapshot?: Record<string, number>
  lstm_ae_top3_features?: string[]
  if_top3_features?: string[]
  anomaly_type_predicted?: string
  anomaly_type_confidence?: string
  ensemble_anomaly_score?: number
  rul_days?: number
  rul_cycles?: number
  rul_bracket?: string
  consensus_strength?: string
}

function affectedComponentFromScenario(scenario: Scenario) {
  const top = (scenario.if_top3_features || []).find((feature) => SENSOR_KEYS.includes(feature))
  return top ? SENSOR_TO_COMPONENT[top] || 4 : 4
}

function healthColorForStatus(status?: string) {
  if (status === 'caution') return '#FBBF24'
  if (status === 'warning') return '#FB923C'
  if (status === 'degraded') return '#EF4444'
  return '#38BDF8'
}

function flaggedSensorKeys(scenario: Scenario) {
  const all = new Set([...(scenario.lstm_ae_top3_features || []), ...(scenario.if_top3_features || [])])
  return SENSOR_KEYS.filter((key) => all.has(key))
}

function humanizeSensorKey(key?: string) {
  return (key || '')
    .replace(/_/g, ' ')
    .replace(/\bc\b/i, '')
    .replace(/\bpct\b/i, '%')
    .replace(/\bcst\b/i, '')
    .trim()
    .toUpperCase()
}

function formatAnomaly(anomaly?: string) {
  if (!anomaly || anomaly === 'normal') return 'NOMINAL'
  return anomaly.replace(/_/g, ' ').toUpperCase()
}

function useUTCClock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${time.getUTCFullYear()}-${pad(time.getUTCMonth() + 1)}-${pad(time.getUTCDate())} ${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())} UTC`
}

function useJitter(frozen: boolean) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (frozen) return
    const id = window.setInterval(() => setTick((value) => value + 1), 600)
    return () => window.clearInterval(id)
  }, [frozen])

  return tick
}

function applyJitter(value: number, seed: number) {
  const jitter = (Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1
  const sign = jitter > 0 ? 1 : -1
  return value * (1 + sign * Math.abs(jitter) * 0.015)
}

function gotoSectionHash(hash: string) {
  const normalized = hash.startsWith('#') ? hash : `#${hash}`
  const shell = document.querySelector<HTMLElement>('main.sentinel-os-shell')
  const target = document.getElementById(normalized.slice(1))
  if (target && shell) {
    const top = target.getBoundingClientRect().top - shell.getBoundingClientRect().top + shell.scrollTop
    shell.scrollTo({ top, behavior: 'smooth' })
  }
  if (window.location.hash !== normalized) {
    window.location.hash = normalized
  }
}

function HoloPanel({
  children,
  className = '',
  inner = false,
  style,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  inner?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}) {
  return (
    <div className={`holo ${inner ? 'inner' : ''} ${className}`} style={style} onClick={onClick}>
      <span className="bracket tl" />
      <span className="bracket tr" />
      <span className="bracket bl" />
      <span className="bracket br" />
      {children}
    </div>
  )
}

function MetricCounter({
  value,
  decimals = 1,
  duration = 600,
  className = '',
  suffix = '',
}: {
  value: number
  decimals?: number
  duration?: number
  className?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef(performance.now())

  useEffect(() => {
    let raf = 0
    fromRef.current = display
    startRef.current = performance.now()
    const target = value
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const step = () => {
      const t = Math.min(1, (performance.now() - startRef.current) / duration)
      setDisplay(fromRef.current + (target - fromRef.current) * ease(t))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span className={className}>
      {Number(display).toFixed(decimals)}
      {suffix}
    </span>
  )
}

function SensorBar({
  label,
  value,
  max,
  unit,
  decimals,
  flagged,
}: {
  label: string
  value: number
  max: number
  unit: string
  decimals: number
  flagged: boolean
}) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100))
  return (
    <div className={`sensor-row ${flagged ? 'flagged' : ''}`}>
      <div className="label">
        <span className="pulse-dot" />
        <span>{label}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="reading">
        <MetricCounter value={value} decimals={decimals} />
        <span className="unit">{unit}</span>
      </div>
    </div>
  )
}

const GlyphPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12 H6 L8 6 L12 18 L14 9 L16 14 L18 12 H22" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const GlyphTree = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="4" cy="12" r="2" />
    <circle cx="20" cy="5" r="2" />
    <circle cx="20" cy="12" r="2" />
    <circle cx="20" cy="19" r="2" />
    <path d="M6 12 H12 M12 12 V5 H18 M12 12 H18 M12 12 V19 H18" />
  </svg>
)

const GlyphHourglass = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 3 H18 L12 11 L18 21 H6 L12 13 Z" strokeLinejoin="round" />
    <line x1="6" y1="3" x2="18" y2="3" />
    <line x1="6" y1="21" x2="18" y2="21" />
  </svg>
)

function VitalStrip({ kind, magnitude, color = '#38BDF8' }: { kind: string; magnitude: number; color?: string }) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const pts = 240
    const width = 1200
    const seg = width / pts
    let d = ''
    for (let i = 0; i <= pts; i += 1) {
      const x = i * seg
      let y = 12
      if (kind === 'vibration') {
        y = 12 + Math.sin(i * 0.6) * (3 + magnitude * 0.6) + (Math.random() - 0.5) * magnitude * 0.4
      } else if (kind === 'temperature') {
        y = 12 + Math.sin(i * 0.07) * (4 + magnitude * 0.02) + Math.sin(i * 0.4)
      } else {
        y = 12 + Math.sin(i * 0.18) * (3 + magnitude * 0.01) + Math.cos(i * 0.5) * 1.5
      }
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(2)} `
    }
    pathRef.current?.setAttribute('d', d)
  }, [kind, magnitude])

  return (
    <div className="vital-strip">
      <span className="vital-label">{kind.toUpperCase()}</span>
      <svg viewBox="0 0 600 24" preserveAspectRatio="none">
        <g style={{ animation: `vitalScroll ${kind === 'vibration' ? 6 : kind === 'temperature' ? 14 : 9}s linear infinite` }}>
          <path ref={pathRef} stroke={color} strokeWidth="1" fill="none" opacity="0.55" />
        </g>
      </svg>
    </div>
  )
}

function WhatCard({ scenario }: { scenario: Scenario }) {
  const score = (scenario.ensemble_anomaly_score || 0) * 100
  return (
    <HoloPanel inner className="diag-card what" onClick={() => gotoSectionHash('#lstm-autoencoder')}>
      <div className="diag-head"><GlyphPulse /> WHAT</div>
      <div className="diag-value">{formatAnomaly(scenario.anomaly_type_predicted)}</div>
      <div className="diag-sub">CONFIDENCE: {(scenario.anomaly_type_confidence || 'unknown').toUpperCase()}</div>
      <div className="diag-tert">
        <span className="chip">SCORE <MetricCounter value={score} decimals={1} /></span>
      </div>
    </HoloPanel>
  )
}

function WhyCard({ scenario, flaggedCount }: { scenario: Scenario; flaggedCount: number }) {
  const firstSensor = (scenario.if_top3_features || []).find((feature) => SENSOR_KEYS.includes(feature))
  const dev = Math.round((scenario.ensemble_anomaly_score || 0) * 100 + 5)
  return (
    <HoloPanel inner className="diag-card why" onClick={() => gotoSectionHash('#isolation-forest')}>
      <div className="diag-head"><GlyphTree /> WHY</div>
      <div className="diag-value">{firstSensor ? humanizeSensorKey(firstSensor) : 'NOMINAL VARIANCE'}</div>
      <div className="diag-sub"><MetricCounter value={flaggedCount} decimals={0} /> OF 8 SENSORS FLAGGED</div>
      <div className="diag-tert">
        <span className="chip health">DELTA +{dev}%</span>
      </div>
    </HoloPanel>
  )
}

function WhenCard({ scenario }: { scenario: Scenario }) {
  const days = scenario.rul_days || 0
  const cycles = Math.round(scenario.rul_cycles || 0)
  const useHours = days < 1
  const value = useHours ? days * 24 : days
  const unit = useHours ? 'HOURS' : 'DAYS'
  const bracket = scenario.rul_bracket || 'healthy'
  return (
    <HoloPanel inner className={`diag-card when bracket-${bracket}`} onClick={() => gotoSectionHash('#cnn-bilstm-attention')}>
      <div className="diag-head"><GlyphHourglass /> WHEN</div>
      <div className="diag-value">
        <MetricCounter value={value} decimals={1} /> {unit}
      </div>
      <div className="diag-sub"><MetricCounter value={cycles} decimals={0} /> CYCLES REMAINING</div>
      <div className="diag-tert">
        <span className={`chip ${bracket !== 'healthy' ? 'health' : ''}`}>[{bracket.toUpperCase()}]</span>
      </div>
    </HoloPanel>
  )
}

function ConnectorOverlay({
  heroRef,
  affectedComp,
}: {
  heroRef: React.RefObject<HTMLDivElement>
  affectedComp: MotorComponentId
}) {
  const [paths, setPaths] = useState<string[]>([])

  const compute = useCallback(() => {
    const hero = heroRef.current
    if (!hero) return
    const heroRect = hero.getBoundingClientRect()
    const motorWrap = hero.querySelector('.figma-motor-target')
    const whyCard = hero.querySelector('.diag-card.why')
    if (!motorWrap || !whyCard) return

    const motorRect = motorWrap.getBoundingClientRect()
    const whyRect = whyCard.getBoundingClientRect()
    const compXMap: Record<MotorComponentId, number> = { 1: 0.4, 2: 0.32, 3: 0.68, 4: 0.5, 5: 0.58 }
    const compX = motorRect.left - heroRect.left + motorRect.width * (compXMap[affectedComp] || 0.5)
    const compY = motorRect.top - heroRect.top + motorRect.height * 0.5
    const whyX = whyRect.left - heroRect.left + 6
    const whyY = whyRect.top - heroRect.top + whyRect.height / 2
    const nextPaths: string[] = []

    hero.querySelectorAll('.sensor-row.flagged').forEach((row) => {
      const rect = row.getBoundingClientRect()
      const sx = rect.right - heroRect.left
      const sy = rect.top - heroRect.top + rect.height / 2
      const cx1 = (sx + compX) / 2 + 30
      const cx2 = (sx + compX) / 2 - 30
      nextPaths.push(`M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${compY}, ${compX - 70} ${compY}`)
    })

    const cx1 = (compX + whyX) / 2
    nextPaths.push(`M ${compX + 70} ${compY} C ${cx1} ${compY}, ${cx1} ${whyY}, ${whyX} ${whyY}`)
    setPaths(nextPaths)
  }, [affectedComp, heroRef])

  useEffect(() => {
    compute()
    const id = window.setInterval(compute, 1500)
    window.addEventListener('resize', compute)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('resize', compute)
    }
  }, [compute])

  return (
    <svg className="connectors" preserveAspectRatio="none">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

function Hero({ scenarios }: { scenarios: Scenario[] }) {
  const [idx, setIdx] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [cardsVisible, setCardsVisible] = useState({ what: true, why: true, when: true })
  const [cursorIn, setCursorIn] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const utc = useUTCClock()

  const scenario = scenarios[idx] || scenarios[0]
  const flagged = useMemo(() => flaggedSensorKeys(scenario), [scenario])
  const affectedComp = useMemo(() => affectedComponentFromScenario(scenario), [scenario])
  const healthColor = useMemo(() => healthColorForStatus(scenario.health_status), [scenario.health_status])
  const tick = useJitter(thinking)
  const latency = scenario.inference_time_ms || 0
  const latencyAmber = latency > 12

  const onShuffle = () => {
    if (thinking) return
    setThinking(true)
    setCardsVisible({ what: false, why: false, when: false })
    window.setTimeout(() => setIdx((value) => (value + 1) % scenarios.length), 250)
    window.setTimeout(() => setCardsVisible((value) => ({ ...value, what: true })), 420)
    window.setTimeout(() => setCardsVisible((value) => ({ ...value, why: true })), 500)
    window.setTimeout(() => setCardsVisible((value) => ({ ...value, when: true })), 580)
    window.setTimeout(() => setThinking(false), 720)
  }

  return (
    <div
      ref={heroRef}
      className={`hero ${thinking ? 'thinking' : ''} ${cursorIn ? 'cursor-in' : ''}`}
      data-health={scenario.health_status}
      onMouseEnter={() => setCursorIn(true)}
      onMouseLeave={() => setCursorIn(false)}
    >
      <div className="reticle-sweep" key={`sweep-${idx}-${thinking}`} />

      <div className="topbar">
        <div className="left">
          <div className="brand">
            <span className="reticle" />
            <span>SENTINELAI</span>
            <span className="muted" style={{ marginLeft: 8, fontSize: 9.5, letterSpacing: '0.18em' }}>// OPERATIONAL INTELLIGENCE</span>
          </div>
        </div>
        <div className="center">
          <div className="status-chip"><span className="dot" /> MODELS: ONLINE</div>
          <div className="status-chip"><span className="dot" /> PIPELINE: ACTIVE</div>
          <div className="status-chip">
            <span className={`dot ${latencyAmber ? 'amber' : ''}`} />
            LATENCY: <MetricCounter value={latency} decimals={2} />ms
          </div>
        </div>
        <div className="right">{utc}</div>
      </div>

      <div className="cols">
        <HoloPanel className="sensors-panel">
          <div className="holo-header">
            <div>
              <div className="title">SENSOR TELEMETRY</div>
              <div className="sub">{(scenario.machine_type || '').toUpperCase()} / T+<MetricCounter value={latency} decimals={2} />MS</div>
            </div>
            <div className="right"><span className="dot" /> STREAM ACTIVE</div>
          </div>
          <div className="holo-body">
            <div className="sensors">
              {SENSORS.map((def, i) => {
                const raw = scenario.sensor_snapshot?.[def.key] ?? 0
                const value = thinking ? raw : applyJitter(raw, tick + i)
                return (
                  <SensorBar
                    key={def.key}
                    label={def.label}
                    value={value}
                    max={def.max}
                    unit={def.unit}
                    decimals={def.dec}
                    flagged={flagged.includes(def.key)}
                  />
                )
              })}
            </div>
          </div>
          <div className="holo-footer">8 SENSORS / {flagged.length} FLAGGED</div>
        </HoloPanel>

        <HoloPanel className="center-panel">
          <div className="mode-pill">
            <span>MODE: {(scenario.operating_mode || '').toUpperCase()}</span>
            <span className="sep">/</span>
            <span>MACHINE: {(scenario.machine_type || '').toUpperCase()}</span>
            <span className="sep">/</span>
            <span>ID: {scenario.scenario_id}</span>
          </div>
          <div className="holo-body" style={{ padding: 0, position: 'relative' }}>
            <div className="motor-stage">
              <div className="health-aura" />
              <div className="figma-motor-target" style={{ position: 'absolute', inset: '-18% -10% -18%', minHeight: 360 }}>
                <HolographicMotor affectedComponent={affectedComp} healthColor={healthColor} />
              </div>
            </div>
          </div>
          <div className="vitals">
            <VitalStrip kind="vibration" magnitude={scenario.sensor_snapshot?.vibration_mm_s || 1} />
            <VitalStrip kind="temperature" magnitude={scenario.sensor_snapshot?.temperature_c || 50} />
            <VitalStrip kind="pressure" magnitude={scenario.sensor_snapshot?.pressure_kpa || 100} />
          </div>
        </HoloPanel>

        <HoloPanel className="diag-panel">
          <div className="holo-header">
            <div>
              <div className="title">LIVE DIAGNOSIS</div>
              <div className="sub">CONSENSUS: {scenario.consensus_strength === 'clean' ? 'ALIGNED' : 'PARTIAL'}</div>
            </div>
            <div className="right"><span className="dot" /> ACTIVE</div>
          </div>
          <div className="holo-body" style={{ padding: 10 }}>
            <div className="diag-stack">
              {cardsVisible.what && <WhatCard scenario={scenario} />}
              {cardsVisible.why && <WhyCard scenario={scenario} flaggedCount={flagged.length} />}
              {cardsVisible.when && <WhenCard scenario={scenario} />}
              {!cardsVisible.what && <div style={{ flex: 1 }} />}
              {!cardsVisible.why && <div style={{ flex: 1 }} />}
              {!cardsVisible.when && <div style={{ flex: 1 }} />}
            </div>
          </div>
        </HoloPanel>

        <ConnectorOverlay heroRef={heroRef} affectedComp={affectedComp} />
      </div>

      <div className="bottombar">
        <button className={`shuffle-btn ${thinking ? 'compress' : ''}`} onClick={onShuffle} aria-label="Analyze new scenario">
          <span className="arrow">▶</span> ANALYZE NEW SCENARIO
        </button>
        <div className="scenario-chip">
          SCENARIO {String(idx + 1).padStart(2, '0')} OF {String(scenarios.length).padStart(2, '0')} / {(scenario.machine_type || '').toUpperCase()} / {(scenario.health_status || '').toUpperCase()}
        </div>
      </div>
    </div>
  )
}

export function SentinelDashboard() {
  return (
    <>
      <div className="bg-grid" />
      <div className="tint-layer tint-radial" />
      <div className="tint-layer tint-scan" />
      <Hero scenarios={results as Scenario[]} />
    </>
  )
}
