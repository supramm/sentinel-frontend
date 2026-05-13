import { useLayoutEffect, useRef } from 'react'
import {
  CNNBiLSTMReactor,
  IFReactor,
  LSTMReactor,
  REACTOR_VARIANTS,
} from '../../NeuralReactor/src/app/components/NeuralCognitionReactorMid'
import { ModelInferenceSection } from './components/ModelInferenceSection'
import { SentinelDashboard } from './dashboard/SentinelDashboard'
import '../styles/ai-operating-system.css'

const modelSections = [
  {
    id: 'lstm-autoencoder',
    label: 'LSTM',
    sectionNumber: '02',
    title: 'LSTM Autoencoder Inference',
    subtitle: 'Temporal reconstruction stream',
    streamlitUrl: 'https://sentinel-lstm-engine.streamlit.app/?embed=true',
    Reactor: LSTMReactor,
    config: REACTOR_VARIANTS.lstm,
    analyticsKey: 'lstm',
    analyticsSlots: ['Telemetry Window', 'Error Lattice', 'Health Dispatch'],
  },
  {
    id: 'isolation-forest',
    label: 'IF',
    sectionNumber: '03',
    title: 'Isolation Forest Inference',
    subtitle: 'Sparse boundary inspection',
    streamlitUrl: 'https://sentinel-if-engine.streamlit.app/?embed=true',
    Reactor: IFReactor,
    config: REACTOR_VARIANTS.if,
    analyticsKey: 'if',
    analyticsSlots: ['Feature Isolation', 'Path Depth Matrix', 'Outlier Dispatch'],
  },
  {
    id: 'cnn-bilstm-attention',
    label: 'RUL',
    sectionNumber: '04',
    title: 'CNN-BiLSTM-Attention Inference',
    subtitle: 'Remaining useful life fusion',
    streamlitUrl: 'https://sentinel-rul-engine.streamlit.app/?embed=true',
    Reactor: CNNBiLSTMReactor,
    config: REACTOR_VARIANTS['cnn-bilstm'],
    analyticsKey: 'rul',
    analyticsSlots: ['Fusion Window', 'Attention Trace', 'RUL Dispatch'],
  },
] as const

export default function App() {
  const shellRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const scrollToHash = (behavior: ScrollBehavior) => {
      const id = window.location.hash.slice(1)
      const target = id ? document.getElementById(decodeURIComponent(id)) : null
      const shell = shellRef.current

      if (!target || !shell) return
      const targetTop = target.getBoundingClientRect().top - shell.getBoundingClientRect().top + shell.scrollTop
      shell.scrollTo({ top: targetTop, behavior })
    }

    const onHashChange = () => scrollToHash('smooth')
    scrollToHash('auto')
    const frameScroll = window.requestAnimationFrame(() => scrollToHash('auto'))
    const settledScroll = window.setTimeout(() => scrollToHash('auto'), 350)

    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.cancelAnimationFrame(frameScroll)
      window.clearTimeout(settledScroll)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  return (
    <main ref={shellRef} className="sentinel-os-shell" aria-label="SentinelAI operating system">
      <nav className="sentinel-os-rail" aria-label="SentinelAI sections">
        <a href="#sentinel-hero" aria-label="Hero dashboard">
          01
        </a>
        {modelSections.map((section) => (
          <a key={section.id} href={`#${section.id}`} aria-label={section.title}>
            {section.sectionNumber}
          </a>
        ))}
      </nav>

      <section id="sentinel-hero" className="sentinel-os-hero" aria-label="SentinelAI hero dashboard">
        <SentinelDashboard />
      </section>

      {modelSections.map((section) => (
        <ModelInferenceSection key={section.id} {...section} />
      ))}
    </main>
  )
}
