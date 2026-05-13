import { useEffect, useRef, useState } from 'react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import type { ReactorVariantConfig } from '../../../NeuralReactor/src/app/components/NeuralCognitionReactorMid'
import { useReactorDiagnostics } from '../hooks/useReactorDiagnostics'
import { InferenceSurface } from './InferenceSurface'
import { MODEL_ANALYTICS, type ModelAnalyticsKey } from '../data/modelAnalytics'

type ReactorComponent = ComponentType<{
  className?: string
  height?: number | string
  showHUD?: boolean
  showTitle?: boolean
  width?: number | string
}>

type ModelInferenceSectionProps = {
  analyticsKey: ModelAnalyticsKey
  analyticsSlots: readonly string[]
  config: ReactorVariantConfig
  id: string
  label: string
  Reactor: ReactorComponent
  sectionNumber: string
  streamlitUrl: string
  subtitle: string
  title: string
}

type MetricItem = {
  label: string
  value: string | number
}

type BarItem = {
  label: string
  value: number
}

type MatrixItem = {
  label: string
  value: string | number
}

type ChipGroupItem = {
  heading: string
  items: string[]
}

function useSectionActivity() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)
  const [nearViewport, setNearViewport] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting && entry.intersectionRatio > 0.28)
      },
      { threshold: [0, 0.16, 0.28, 0.52, 0.72] },
    )

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        setNearViewport(entry.isIntersecting || entry.boundingClientRect.bottom > -500)
      },
      { rootMargin: '500px 0px 500px 0px', threshold: 0 },
    )

    observer.observe(node)
    preloadObserver.observe(node)

    return () => {
      observer.disconnect()
      preloadObserver.disconnect()
    }
  }, [])

  return { active, nearViewport, ref }
}

function PanelHero({
  hero,
  subtitle,
}: {
  hero?: string
  subtitle?: string
}) {
  if (!hero && !subtitle) return null

  return (
    <div className="analytics-hero">
      {hero ? <strong>{hero}</strong> : null}
      {subtitle ? <span>{subtitle}</span> : null}
    </div>
  )
}

function MetricGrid({ items }: { items?: readonly MetricItem[] }) {
  if (!items?.length) return null

  return (
    <div className="analytics-metric-grid">
      {items.map((item) => (
        <div className="analytics-metric" key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function MiniBarList({ items }: { items?: readonly BarItem[] }) {
  if (!items?.length) return null

  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="analytics-bars">
      {items.map((item) => {
        const width = `${Math.min(100, Math.max(4, (item.value / maxValue) * 100))}%`

        return (
          <div className="analytics-bar-row" key={`${item.label}-${item.value}`}>
            <div className="analytics-bar-meta">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="analytics-bar-track">
              <span className="analytics-bar-fill" style={{ width }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ConfusionMiniMatrix({ items }: { items?: readonly MatrixItem[] }) {
  if (!items?.length) return null

  return (
    <div className="analytics-matrix">
      {items.map((item) => (
        <div className="analytics-matrix-cell" key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function ChipGroup({
  heading,
  items,
}: {
  heading?: string
  items?: readonly string[]
}) {
  if (!items?.length) return null

  return (
    <div className="analytics-chip-group">
      {heading ? <span className="analytics-section-label">{heading}</span> : null}
      <div className="analytics-chip-list">
        {items.map((item) => (
          <span className="analytics-chip" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function PanelNote({ notes }: { notes?: readonly string[] }) {
  if (!notes?.length) return null

  return (
    <div className="analytics-note">
      {notes.slice(0, 1).map((note) => (
        <span key={note}>{note}</span>
      ))}
    </div>
  )
}

function AnalyticsModule({ children }: { children: ReactNode }) {
  return <div className="analytics-module">{children}</div>
}

function AnalyticsPanels({
  active,
  analyticsKey,
}: {
  active: boolean
  analyticsKey: ModelAnalyticsKey
}) {
  const panels = MODEL_ANALYTICS[analyticsKey] ?? []

  return (
    <aside className="model-analytics" data-active={active}>
      {panels.map((panel, index) => (
        <div
          className="model-analytics__panel"
          key={`${analyticsKey}-${panel.title}`}
          style={{ '--panel-delay': `${index * 110}ms` } as CSSProperties}
        >
          <div className="model-analytics__head">
            <span>{panel.title}</span>
            <span>{panel.status}</span>
          </div>

          <div className="model-analytics__slot">
            <AnalyticsModule>
              <PanelHero hero={panel.hero} subtitle={panel.subtitle} />

              <MetricGrid items={panel.chips} />

              <MiniBarList items={panel.bars} />

              <ConfusionMiniMatrix items={panel.matrix} />

              {panel.chipGroups?.map((group: ChipGroupItem) => (
                <ChipGroup heading={group.heading} items={group.items} key={group.heading} />
              ))}

              <PanelNote notes={panel.notes} />
            </AnalyticsModule>
          </div>
        </div>
      ))}
    </aside>
  )
}

export function ModelInferenceSection({
  analyticsKey,
  analyticsSlots,
  config,
  id,
  label,
  Reactor,
  sectionNumber,
  streamlitUrl,
  subtitle,
  title,
}: ModelInferenceSectionProps) {
  const { active, nearViewport, ref } = useSectionActivity()
  const palette = config.palette

  void analyticsSlots

  useReactorDiagnostics(id, label, active, true)

  return (
    <section
      ref={ref}
      id={id}
      className="model-inference-section"
      data-active={active}
      style={
        {
          '--model-accent': palette.accent,
          '--model-deep': palette.deep,
          '--model-primary': palette.primary,
          '--model-secondary': palette.secondary,
          '--model-white': palette.white,
          contain: 'layout paint style',
        } as CSSProperties
      }
      aria-label={title}
    >
      <div className="model-inference-section__backdrop" aria-hidden="true" />

      <div className="model-inference-section__header">
        <div>
          <span className="model-inference-section__kicker">SECTION {sectionNumber}</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <span className="model-inference-section__status">
          <span />
          {label} SYSTEM
        </span>
      </div>

      <div className="model-inference-section__grid">
        <div className="model-reactor-port" data-active={active}>
          <div className="model-reactor-port__label">
            <span>NEURAL REACTOR</span>
            <span>{config.modelName}</span>
          </div>

          <div className="model-reactor-port__stage">
            <Reactor width="100%" height="100%" showHUD={false} showTitle={false} />
          </div>
        </div>

        <InferenceSurface
          active={active}
          nearViewport={nearViewport}
          label={`${label} INFERENCE SURFACE`}
          title={`${title} Streamlit app`}
          url={streamlitUrl}
        />

        <AnalyticsPanels active={active} analyticsKey={analyticsKey} />
      </div>
    </section>
  )
}