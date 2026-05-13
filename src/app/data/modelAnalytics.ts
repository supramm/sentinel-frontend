export type ModelAnalyticsKey = 'lstm' | 'if' | 'rul'

export type ModelAnalyticsPanel = {
  title: string
  status: string
  hero?: string
  subtitle?: string
  chips?: Array<{ label: string; value: string }>
  bars?: Array<{ label: string; value: number }>
  matrix?: Array<{ label: string; value: string }>
  chipGroups?: Array<{ heading: string; items: string[] }>
  notes?: string[]
}

export const MODEL_ANALYTICS: Record<ModelAnalyticsKey, ModelAnalyticsPanel[]> = {
  lstm: [
    {
      title: 'Model Core',
      status: 'TRAINED',
      hero: 'LSTM AE',
      subtitle: 'Temporal anomaly scanner',
      chips: [
        { label: 'Window', value: '50' },
        { label: 'Features', value: '48' },
        { label: 'Sensors', value: '11' },
        { label: 'Epoch', value: '103' },
      ],
      notes: ['Flags high reconstruction error.'],
    },
    {
      title: 'Detection',
      status: 'VALIDATED',
      chips: [
        { label: 'AUC', value: '0.864' },
        { label: 'AP', value: '0.657' },
        { label: 'p95', value: '0.0031' },
      ],
      matrix: [
        { label: 'TP', value: '95' },
        { label: 'FP', value: '58' },
        { label: 'FN', value: '75' },
        { label: 'TN', value: '899' },
      ],
      notes: ['p95 error boundary.'],
    },
    {
      title: 'Error Signature',
      status: 'RANKED',
      bars: [
        { label: 'amb_roc', value: 100 },
        { label: 'hum_roc', value: 68 },
        { label: 'vibration', value: 47 },
        { label: 'vib_mean', value: 38 },
      ],
      notes: ['Tail crosses threshold.'],
    },
  ],
  if: [
    {
      title: 'Model Core',
      status: 'READY',
      hero: 'Isolation Forest',
      subtitle: 'Root-cause isolation',
      chips: [
        { label: 'Mode', value: 'Unsupervised' },
        { label: 'Input', value: 'Sensors' },
        { label: 'Output', value: 'Score' },
        { label: 'Layer', value: 'WHY' },
      ],
      notes: ['Isolates abnormal windows.'],
    },
    {
      title: 'Isolation Logic',
      status: 'ACTIVE',
      bars: [
        { label: 'Feature Drift', value: 82 },
        { label: 'Path Depth', value: 74 },
        { label: 'Sensor Match', value: 69 },
        { label: 'Confidence', value: 76 },
      ],
      notes: ['Short paths = outliers.'],
    },
    {
      title: 'Root-Cause Map',
      status: 'MAPPED',
      chipGroups: [
        { heading: 'Components', items: ['Fan', 'Compressor', 'Turbine'] },
        { heading: 'Scenarios', items: ['Bearing', 'Thermal', 'Pressure', 'Sensor Fault'] },
      ],
      notes: ['Maps sensors to machine zones.'],
    },
  ],
  rul: [
    {
      title: 'Model Core',
      status: 'TRAINED',
      hero: 'CNN-BiLSTM-Attn',
      subtitle: 'RUL prediction engine',
      chips: [
        { label: 'CNN', value: 'Patterns' },
        { label: 'BiLSTM', value: 'Memory' },
        { label: 'Attention', value: 'Focus' },
        { label: 'Output', value: 'Cycles' },
      ],
      notes: ['Predicts remaining life.'],
    },
    {
      title: 'Validation',
      status: 'VERIFIED',
      chips: [
        { label: 'Runs', value: '24' },
        { label: 'Failures', value: '0' },
        { label: 'Latency', value: '12.05 ms' },
        { label: 'States', value: '4' },
      ],
      bars: [
        { label: 'Healthy', value: 8 },
        { label: 'Caution', value: 8 },
        { label: 'Warning', value: 4 },
        { label: 'Degraded', value: 4 },
      ],
      notes: ['All scenarios passed.'],
    },
    {
      title: 'Dispatch',
      status: 'RANGE LOCKED',
      chips: [
        { label: 'Min', value: '6.0' },
        { label: 'Max', value: '120.9' },
        { label: 'Critical', value: 'SCN_022' },
        { label: 'Healthy', value: 'SCN_001' },
      ],
      notes: ['Low RUL cases prioritized.'],
    },
  ],
}
