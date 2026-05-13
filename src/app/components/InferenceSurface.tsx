import { useEffect, useMemo, useRef, useState } from 'react'

type InferenceSurfaceProps = {
  active: boolean
  nearViewport?: boolean
  className?: string
  label: string
  title: string
  url: string
}

export function InferenceSurface({ 
  active, 
  nearViewport = false, 
  className = '', 
  label, 
  title, 
  url 
}: InferenceSurfaceProps) {
  const [shouldMount, setShouldMount] = useState(active || nearViewport)
  const [loaded, setLoaded] = useState(false)
  const visibilityTimeoutRef = useRef<NodeJS.Timeout>()

  // Lazy-load iframe when near viewport or active
  useEffect(() => {
    if (active || nearViewport) {
      setShouldMount(true)
    } else {
      // Debounce unmounting to prevent thrashing
      visibilityTimeoutRef.current = setTimeout(() => {
        setShouldMount(false)
        setLoaded(false)
      }, 2000)
    }
    return () => {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current)
      }
    }
  }, [active, nearViewport])

  const endpoint = useMemo(() => {
    try {
      const parsed = new URL(url)
      return parsed.host
    } catch {
      return url
    }
  }, [url])

  return (
    <div
      className={`inference-surface ${className}`}
      data-active={active}
      data-loaded={loaded}
      style={{ contain: 'layout paint' }}
    >
      <div className="inference-surface__header">
        <span>{label}</span>
        <a href={url} target="_blank" rel="noreferrer">
          {endpoint}
        </a>
      </div>

      <div className="inference-surface__viewport">
        {shouldMount && (
          <iframe
            allow="clipboard-read; clipboard-write; fullscreen"
            className="inference-surface__frame"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            referrerPolicy="no-referrer-when-downgrade"
            src={url}
            title={title}
          />
        )}

        {!loaded && (
          <div className="inference-surface__loading" aria-live="polite">
            <span className="inference-surface__spinner" />
            <span>Awaiting inference surface</span>
          </div>
        )}

        <div className="inference-surface__glass" aria-hidden="true" />
        <div className="inference-surface__scan" aria-hidden="true" />
      </div>
    </div>
  )
}
