import { useEffect } from 'react'

interface ReactorState {
  id: string
  label: string
  active: boolean
  visible: boolean
  timestamp: number
}

class ReactorDiagnostics {
  private reactors: Map<string, ReactorState> = new Map()
  private isDev = import.meta.env.DEV

  register(id: string, label: string, active: boolean) {
    this.reactors.set(id, {
      id,
      label,
      active,
      visible: false,
      timestamp: performance.now(),
    })
  }

  updateState(id: string, active: boolean, visible: boolean) {
    const state = this.reactors.get(id)
    if (state) {
      state.active = active
      state.visible = visible
      state.timestamp = performance.now()
    }
  }

  log() {
    if (!this.isDev) return

    const summary = Array.from(this.reactors.values()).map((r) => ({
      id: r.id,
      status: r.active ? '🟢 ACTIVE' : '⚫ PAUSED',
      visible: r.visible ? '👁️' : '🚫',
      label: r.label,
    }))

    console.group(
      '%c📊 Reactor Diagnostics',
      'color: #00E5C3; font-weight: bold; font-size: 12px',
    )
    console.table(summary)
    console.log(
      '%cℹ️ Optimization Status',
      'color: #7DF9FF; font-weight: bold; font-size: 10px',
    )
    console.log(
      `Active: ${Array.from(this.reactors.values()).filter((r) => r.active).length}/${this.reactors.size}`,
    )
    console.log(
      `Visible: ${Array.from(this.reactors.values()).filter((r) => r.visible).length}/${this.reactors.size}`,
    )
    console.groupEnd()
  }
}

const diagnostics = new ReactorDiagnostics()

export function useReactorDiagnostics(id: string, label: string, active: boolean, visible: boolean) {
  useEffect(() => {
    diagnostics.register(id, label, active)
  }, [id, label])

  useEffect(() => {
    diagnostics.updateState(id, active, visible)
  }, [id, active, visible])

  useEffect(() => {
    const interval = import.meta.env.DEV ? setInterval(() => diagnostics.log(), 5000) : undefined
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])
}

export { diagnostics }
