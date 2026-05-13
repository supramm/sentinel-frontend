import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ReactorVariantName = 'lstm' | 'if' | 'cnn-bilstm';

interface V3 { x: number; y: number; z: number }
interface Pt2 { sx: number; sy: number; sc: number; z: number }

interface ReactorPalette {
  primary: string;
  secondary: string;
  accent: string;
  deep: string;
  white: string;
  backgroundInner: string;
  backgroundMid: string;
  backgroundOuter: string;
}

interface ReactorCountSet {
  midNodes: number;
  outerNodes: number;
  particles: number;
  arcs: number;
  shards: number;
}

interface ReactorRadii {
  midBase: number;
  midSpread: number;
  outerBase: number;
  outerSpread: number;
  particleBase: number;
  particleSpread: number;
  shardBase: number;
  shardSpread: number;
  edgeDistance: number;
  outerEdgeDistance: number;
  scale: number;
}

interface ReactorSpeeds {
  outer: number;
  ring: number;
  shard: number;
  autoRotate: number;
  particle: number;
  arcPulse: number;
}

export interface ReactorVariantConfig {
  id: ReactorVariantName;
  modelName: string;
  title: string;
  subtitle: string;
  hudTitle: string;
  hudStatus: string;
  metrics: [string, string, string];
  palette: ReactorPalette;
  counts: {
    desktop: ReactorCountSet;
    mobile: ReactorCountSet;
  };
  radii: ReactorRadii;
  speeds: ReactorSpeeds;
  ringScale: number;
  coreScale: number;
  glow: number;
}

interface SceneData {
  midNodes: V3[];
  midEdges: [number, number][];
  outerNodes: V3[];
  outerEdges: [number, number][];
  particles: V3[];
  arcs: { p0: V3; p1: V3; p2: V3; color: string; speed: number; phase: number }[];
  shards: { center: V3; size: number; color: string; phase: number }[];
}

interface AnimState {
  t: number;
  rotX: number;
  rotY: number;
  tgtRotX: number;
  tgtRotY: number;
  outerT: number;
  ringT: number;
  zoom: number;
  hovered: boolean;
  scene: SceneData | null;
  shardT: number;
  visible: boolean;
  lastFrame: number;
}

const DPR_CAP = 1.5;
const FRAME_INTERVAL = 1000 / 45;
const INTERSECTION_MARGIN = '260px';

export interface NeuralCognitionReactorProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  showHUD?: boolean;
  showTitle?: boolean;
  variant?: ReactorVariantName | ReactorVariantConfig;
}

export const REACTOR_VARIANTS: Record<ReactorVariantName, ReactorVariantConfig> = {
  lstm: {
    id: 'lstm',
    modelName: 'LSTM',
    title: 'LSTM MEMORY REACTOR',
    subtitle: 'SEQUENTIAL MEMORY STATE VISUALIZATION',
    hudTitle: 'LSTM Memory Core v1.0',
    hudStatus: 'GATED STATE FLOW',
    metrics: ['MEMORY_LAYER - ACTIVE', 'TEMPORAL_DEPTH - 0.88', 'STATE_FLUX - CONTINUOUS'],
    palette: {
      primary: '#FFB347',
      secondary: '#FFD580',
      accent: '#FF8A00',
      deep: '#FF5500',
      white: '#FFF5E0',
      backgroundInner: '#151109',
      backgroundMid: '#0B0A0E',
      backgroundOuter: '#050505',
    },
    counts: {
      desktop: { midNodes: 78, outerNodes: 38, particles: 520, arcs: 13, shards: 9 },
      mobile: { midNodes: 42, outerNodes: 22, particles: 190, arcs: 7, shards: 5 },
    },
    radii: {
      midBase: 88,
      midSpread: 82,
      outerBase: 215,
      outerSpread: 28,
      particleBase: 255,
      particleSpread: 160,
      shardBase: 165,
      shardSpread: 60,
      edgeDistance: 118,
      outerEdgeDistance: 96,
      scale: 1,
    },
    speeds: { outer: 0.035, ring: 0.75, shard: 0.22, autoRotate: 0.012, particle: 0.014, arcPulse: 0.7 },
    ringScale: 0.96,
    coreScale: 1,
    glow: 1,
  },
  if: {
    id: 'if',
    modelName: 'IF',
    title: 'IF INFERENCE FIELD',
    subtitle: 'SPARSE DECISION BOUNDARY VISUALIZATION',
    hudTitle: 'IF Inference Field v1.0',
    hudStatus: 'BRANCH EVALUATION',
    metrics: ['DECISION_LAYER - ACTIVE', 'BOUNDARY_DEPTH - 0.76', 'RULE_FLUX - DISCRETE'],
    palette: {
      primary: '#7DF9FF',
      secondary: '#E8FFFF',
      accent: '#00AEEF',
      deep: '#4B7BFF',
      white: '#F4FFFF',
      backgroundInner: '#07151A',
      backgroundMid: '#060B12',
      backgroundOuter: '#020407',
    },
    counts: {
      desktop: { midNodes: 52, outerNodes: 32, particles: 340, arcs: 6, shards: 16 },
      mobile: { midNodes: 30, outerNodes: 18, particles: 140, arcs: 4, shards: 9 },
    },
    radii: {
      midBase: 74,
      midSpread: 66,
      outerBase: 198,
      outerSpread: 24,
      particleBase: 235,
      particleSpread: 120,
      shardBase: 145,
      shardSpread: 105,
      edgeDistance: 96,
      outerEdgeDistance: 86,
      scale: 0.92,
    },
    speeds: { outer: 0.025, ring: 1.25, shard: 0.65, autoRotate: 0.01, particle: 0.024, arcPulse: 1.35 },
    ringScale: 0.88,
    coreScale: 0.84,
    glow: 0.9,
  },
  'cnn-bilstm': {
    id: 'cnn-bilstm',
    modelName: 'CNN-BiLSTM',
    title: 'CNN-BILSTM FUSION CORE',
    subtitle: 'SPATIAL TEMPORAL HYBRID VISUALIZATION',
    hudTitle: 'CNN-BiLSTM Fusion v1.0',
    hudStatus: 'FEATURE MEMORY FUSION',
    metrics: ['FEATURE_LAYER - ACTIVE', 'BIDIRECTIONAL_DEPTH - 0.94', 'FUSION_FLUX - CONTINUOUS'],
    palette: {
      primary: '#00E5C3',
      secondary: '#FFD166',
      accent: '#FF5FD2',
      deep: '#FF7A00',
      white: '#F8FFF7',
      backgroundInner: '#071612',
      backgroundMid: '#090713',
      backgroundOuter: '#040405',
    },
    counts: {
      desktop: { midNodes: 105, outerNodes: 58, particles: 760, arcs: 14, shards: 15 },
      mobile: { midNodes: 56, outerNodes: 30, particles: 260, arcs: 8, shards: 8 },
    },
    radii: {
      midBase: 98,
      midSpread: 104,
      outerBase: 255,
      outerSpread: 42,
      particleBase: 305,
      particleSpread: 210,
      shardBase: 190,
      shardSpread: 95,
      edgeDistance: 124,
      outerEdgeDistance: 112,
      scale: 1.08,
    },
    speeds: { outer: 0.06, ring: 1.15, shard: 0.45, autoRotate: 0.022, particle: 0.023, arcPulse: 1.05 },
    ringScale: 1.08,
    coreScale: 1.12,
    glow: 1.15,
  },
};

const rotY = (p: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
};

const rotX = (p: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
};

const rotZ = (p: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
};

function project(p: V3, rx: number, ry: number, fov: number, cx: number, cy: number): Pt2 {
  const r = rotX(rotY(p, ry), rx);
  const d = fov + r.z;
  if (d <= 0) return { sx: cx, sy: cy, sc: 0, z: r.z };
  const sc = fov / d;
  return { sx: r.x * sc + cx, sy: r.y * sc + cy, sc, z: r.z };
}

function onSphere(r: number): V3 {
  const u = Math.random(), v = Math.random();
  const th = 2 * Math.PI * u;
  const ph = Math.acos(2 * v - 1);
  return { x: r * Math.sin(ph) * Math.cos(th), y: r * Math.sin(ph) * Math.sin(th), z: r * Math.cos(ph) };
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const value = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function resolveVariant(variant: ReactorVariantName | ReactorVariantConfig | undefined): ReactorVariantConfig {
  if (!variant) return REACTOR_VARIANTS.lstm;
  return typeof variant === 'string' ? REACTOR_VARIANTS[variant] : variant;
}

function buildScene(mobile: boolean, variant: ReactorVariantConfig): SceneData {
  const counts = mobile ? variant.counts.mobile : variant.counts.desktop;
  const radii = variant.radii;
  const palette = variant.palette;
  const colors = [palette.secondary, palette.primary, palette.accent];
  const midEdgeLimit = mobile ? counts.midNodes * 3 : counts.midNodes * 5;
  const outerEdgeLimit = mobile ? counts.outerNodes * 2 : counts.outerNodes * 4;

  const midNodes: V3[] = Array.from(
    { length: counts.midNodes },
    () => onSphere(radii.midBase + Math.random() * radii.midSpread),
  );
  const midEdges: [number, number][] = [];
  for (let i = 0; i < midNodes.length; i++) {
    for (let j = i + 1; j < midNodes.length; j++) {
      const n = midNodes[i], m = midNodes[j];
      const d = Math.hypot(n.x - m.x, n.y - m.y, n.z - m.z);
      if (d < radii.edgeDistance) midEdges.push([i, j]);
      if (midEdges.length >= midEdgeLimit) break;
    }
    if (midEdges.length >= midEdgeLimit) break;
  }

  const outerNodes: V3[] = Array.from(
    { length: counts.outerNodes },
    () => onSphere(radii.outerBase + Math.random() * radii.outerSpread),
  );
  const outerEdges: [number, number][] = [];
  for (let i = 0; i < outerNodes.length; i++) {
    for (let j = i + 1; j < outerNodes.length; j++) {
      const n = outerNodes[i], m = outerNodes[j];
      const d = Math.hypot(n.x - m.x, n.y - m.y, n.z - m.z);
      if (d < radii.outerEdgeDistance) outerEdges.push([i, j]);
      if (outerEdges.length >= outerEdgeLimit) break;
    }
    if (outerEdges.length >= outerEdgeLimit) break;
  }

  const particles: V3[] = Array.from(
    { length: counts.particles },
    () => onSphere(radii.particleBase + Math.random() * radii.particleSpread),
  );

  const arcs = Array.from({ length: counts.arcs }, (_, i) => {
    const a = (i / counts.arcs) * Math.PI * 2;
    const r1 = 20 + Math.random() * 15;
    const r2 = 70 + Math.random() * 55;
    const r3 = radii.midBase + radii.midSpread + Math.random() * 90;
    return {
      p0: { x: Math.cos(a) * r1, y: (Math.random() - 0.5) * r1, z: Math.sin(a) * r1 },
      p1: { x: Math.cos(a + 0.5) * r2, y: (Math.random() - 0.5) * r2 * 1.5, z: Math.sin(a + 0.5) * r2 },
      p2: onSphere(r3),
      color: colors[i % colors.length],
      speed: (0.10 + Math.random() * 0.18) * variant.speeds.arcPulse,
      phase: Math.random() * Math.PI * 2,
    };
  });

  const shards = Array.from({ length: counts.shards }, (_, i) => ({
    center: onSphere(radii.shardBase + Math.random() * radii.shardSpread),
    size: 7 + Math.random() * 18,
    color: colors[(i + 1) % colors.length],
    phase: Math.random() * Math.PI * 2,
  }));

  return { midNodes, midEdges, outerNodes, outerEdges, particles, arcs, shards };
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  radiusW: number,
  axX: number,
  axY: number,
  axZ: number,
  globalRX: number,
  globalRY: number,
  fov: number,
  cx: number,
  cy: number,
  color: string,
  opacity: number,
  lw: number,
) {
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.shadowColor = color;
  ctx.beginPath();
  const seg = 72;
  for (let i = 0; i <= seg; i++) {
    const ang = (i / seg) * Math.PI * 2;
    let p: V3 = { x: Math.cos(ang) * radiusW, y: Math.sin(ang) * radiusW, z: 0 };
    p = rotX(p, axX);
    p = rotZ(p, axZ);
    p = rotY(p, axY);
    const pt = project(p, globalRX, globalRY, fov, cx, cy);
    i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawHex(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rot;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a1 = (i / 3) * Math.PI * 2 + rot;
    const a2 = a1 + Math.PI;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
    ctx.lineTo(x + Math.cos(a2) * r, y + Math.sin(a2) * r);
    ctx.stroke();
  }
}

export const NeuralCognitionReactor = memo(function NeuralCognitionReactor({
  className = '',
  width = '100%',
  height = '100%',
  showHUD = true,
  showTitle = true,
  variant,
}: NeuralCognitionReactorProps) {
  const config = useMemo(() => resolveVariant(variant), [variant]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const st = useRef<AnimState>({
    t: 0,
    rotX: 0.18,
    rotY: 0,
    tgtRotX: 0.18,
    tgtRotY: 0,
    outerT: 0,
    ringT: 0,
    zoom: 0,
    hovered: false,
    scene: null,
    shardT: 0,
    visible: false,
    lastFrame: 0,
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    st.current.scene = buildScene(isMobile, config);
  }, [config, isMobile]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        st.current.visible = visible;
        st.current.lastFrame = 0;
        setIsVisible(visible);
      },
      { root: null, rootMargin: INTERSECTION_MARGIN, threshold: 0.01 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let last = performance.now();

    function resize() {
      const { width: w, height: h } = container!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas!.width = Math.max(1, Math.round(w * dpr));
      canvas!.height = Math.max(1, Math.round(h * dpr));
      canvas!.style.width = w + 'px';
      canvas!.style.height = h + 'px';
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    function frame(now: number) {
      if (!st.current.visible) {
        rafRef.current = null;
        return;
      }

      if (st.current.lastFrame && now - st.current.lastFrame < FRAME_INTERVAL) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = st.current;
      s.lastFrame = now;
      if (!s.scene) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const palette = config.palette;
      s.t += dt;
      s.outerT += dt * config.speeds.outer;
      s.ringT += dt * config.speeds.ring;
      s.shardT += dt * config.speeds.shard;
      s.rotX += (s.tgtRotX - s.rotX) * 0.048;
      s.rotY += (s.tgtRotY - s.rotY) * 0.048;
      s.tgtRotY += dt * config.speeds.autoRotate;

      const W = canvas!.width;
      const H = canvas!.height;
      const cx = W * 0.5;
      const cy = H * 0.5;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const ws = (Math.min(W, H) / (800 * dpr)) * config.radii.scale;
      const fov = Math.min(W, H) * 0.54 + s.zoom * 28 * dpr;
      const t = s.t;
      const rx = s.rotX, ry = s.rotY;
      const hov = s.hovered;
      const scene = s.scene;
      const P = (p: V3, extraRX = 0, extraRY = 0): Pt2 =>
        project({ x: p.x * ws, y: p.y * ws, z: p.z * ws }, rx + extraRX, ry + extraRY, fov, cx, cy);

      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.shadowBlur = 3 * dpr;
      ctx.shadowColor = palette.primary;
      ctx.strokeStyle = palette.primary;
      ctx.lineWidth = 0.6 * dpr;
      for (const [a, b] of scene.outerEdges) {
        const pa = P(scene.outerNodes[a], s.outerT * 0.12, s.outerT);
        const pb = P(scene.outerNodes[b], s.outerT * 0.12, s.outerT);
        if (pa.sc <= 0 || pb.sc <= 0) continue;
        ctx.globalAlpha = (0.11 + 0.04 * Math.sin(t * 0.38 + a * 0.1)) * (hov ? 1.4 : 1);
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      }

      ctx.shadowBlur = 5 * dpr;
      ctx.shadowColor = palette.primary;
      ctx.fillStyle = palette.primary;
      for (const n of scene.outerNodes) {
        const p = P(n, s.outerT * 0.12, s.outerT);
        if (p.sc <= 0) continue;
        ctx.globalAlpha = 0.22 * (hov ? 1.35 : 1);
        ctx.beginPath(); ctx.arc(p.sx, p.sy, Math.max(1, 2.5 * p.sc * ws * dpr), 0, Math.PI * 2); ctx.fill();
      }

      ctx.shadowBlur = 6 * dpr;
      ctx.shadowColor = palette.primary;
      ctx.strokeStyle = palette.primary;
      ctx.lineWidth = 1.1 * dpr;
      for (const [a, b] of scene.midEdges) {
        const pa = P(scene.midNodes[a]);
        const pb = P(scene.midNodes[b]);
        if (pa.sc <= 0 || pb.sc <= 0) continue;
        const pulse = 0.45 + 0.38 * Math.sin(t * 0.78 + a * 0.18 + b * 0.12);
        ctx.globalAlpha = pulse * (hov ? 1.3 : 1);
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      }

      ctx.shadowBlur = 9 * dpr;
      ctx.shadowColor = palette.secondary;
      ctx.fillStyle = palette.secondary;
      for (let i = 0; i < scene.midNodes.length; i++) {
        const p = P(scene.midNodes[i]);
        if (p.sc <= 0) continue;
        const r = Math.max(1.5, 3.5 * p.sc * ws * dpr);
        ctx.globalAlpha = 0.82 + 0.12 * Math.sin(t * 1.15 + i * 0.3);
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.fill();
      }

      ctx.lineWidth = 1.4 * dpr;
      for (const arc of scene.arcs) {
        const p0 = P(arc.p0), p1 = P(arc.p1), p2 = P(arc.p2);
        if (p0.sc <= 0) continue;
        const pulse = 0.38 + 0.55 * Math.abs(Math.sin(t * arc.speed + arc.phase));
        ctx.globalAlpha = pulse * (hov ? 1.3 : 1);
        ctx.strokeStyle = arc.color;
        ctx.shadowColor = arc.color;
        ctx.shadowBlur = 10 * dpr * config.glow;
        ctx.beginPath();
        ctx.moveTo(p0.sx, p0.sy);
        ctx.quadraticCurveTo(p1.sx, p1.sy, p2.sx, p2.sy);
        ctx.stroke();
      }

      const rt = s.ringT;
      const ringScale = config.ringScale;
      const ringDefs = [
        { r: 148, ax: rt * 0.50, ay: rt * 0.20, az: 0, color: palette.primary, op: 0.82, lw: 2.2 },
        { r: 180, ax: 0, ay: rt * 0.38, az: rt * 0.15, color: palette.accent, op: 0.62, lw: 1.6 },
        { r: 208, ax: -rt * 0.28, ay: rt * 0.30, az: 0, color: palette.secondary, op: 0.42, lw: 1.1 },
        { r: 118, ax: 0, ay: 0, az: rt * 0.40, color: palette.deep, op: 0.92, lw: 2.7 },
        { r: 66, ax: rt * 0.60, ay: rt * 0.22, az: 0.12, color: palette.primary, op: 0.88, lw: 3.2 },
        { r: 260, ax: rt * 0.15, ay: rt * 0.10, az: 0, color: palette.accent, op: 0.22, lw: 0.8 },
      ];
      ctx.shadowBlur = 14 * dpr * config.glow;
      for (const rd of ringDefs) {
        const pulse = 0.65 + 0.35 * Math.sin(t * 0.45 + rd.r * 0.01);
        drawRing(ctx, rd.r * ringScale * ws, rd.ax, rd.ay, rd.az, rx, ry, fov, cx, cy, rd.color, rd.op * pulse * (hov ? 1.18 : 1), rd.lw * dpr);
      }

      ctx.shadowBlur = 8 * dpr * config.glow;
      for (let i = 0; i < scene.shards.length; i++) {
        const sh = scene.shards[i];
        const p = P(sh.center);
        if (p.sc <= 0) continue;
        const size = sh.size * p.sc * ws * dpr;
        const rot = s.shardT * (0.4 + i * 0.05) + sh.phase;
        const alpha = (0.28 + 0.28 * Math.sin(t * 0.45 + sh.phase)) * (hov ? 1.3 : 1);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = sh.color;
        ctx.shadowColor = sh.color;
        ctx.lineWidth = 0.9 * dpr;
        drawHex(ctx, p.sx, p.sy, size, rot);
      }

      const coreR = 85 * ws * dpr * config.coreScale;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      const ci = (0.55 + 0.2 * Math.sin(t * 1.15) + (hov ? 0.18 : 0)) * config.glow;
      cg.addColorStop(0, rgba(palette.secondary, Math.min(ci, 1)));
      cg.addColorStop(0.35, rgba(palette.primary, 0.18));
      cg.addColorStop(1, rgba(palette.deep, 0));
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();

      ctx.shadowBlur = 18 * dpr * config.glow;
      ctx.shadowColor = palette.secondary;
      const coreRings = [
        { r: 40, ax: t * 0.55, ay: 0, az: t * 0.30, color: palette.secondary, op: 0.92, lw: 1.8 },
        { r: 37, ax: 0, ay: t * 0.88, az: t * 0.44, color: palette.primary, op: 0.80, lw: 1.5 },
        { r: 33, ax: -t * 0.42, ay: t * 0.50, az: 0, color: palette.accent, op: 0.70, lw: 1.2 },
        { r: 28, ax: t * 0.70, ay: t * 0.35, az: -t * 0.50, color: palette.white, op: 0.55, lw: 1.0 },
      ];
      for (const cr of coreRings) {
        drawRing(ctx, cr.r * ws * dpr * config.coreScale, cr.ax, cr.ay, cr.az, rx, ry, fov, cx, cy, cr.color, cr.op * (hov ? 1.1 : 1), cr.lw * dpr);
      }

      const dotR = 22 * ws * dpr * config.coreScale;
      const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotR);
      ig.addColorStop(0, rgba(palette.white, 1));
      ig.addColorStop(0.45, rgba(palette.secondary, 0.85));
      ig.addColorStop(1, rgba(palette.primary, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = ig;
      ctx.shadowColor = palette.secondary;
      ctx.shadowBlur = 22 * dpr * config.glow;
      ctx.beginPath(); ctx.arc(cx, cy, dotR, 0, Math.PI * 2); ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = palette.primary;
      for (let i = 0; i < scene.particles.length; i++) {
        const p = P(scene.particles[i], Math.sin(t * 0.012) * 0.06, t * config.speeds.particle);
        if (p.sc <= 0) continue;
        const alpha = (0.28 + 0.18 * Math.sin(t * 0.45 + i * 0.1)) * (hov ? 1.3 : 1);
        ctx.globalAlpha = alpha;
        const r = Math.max(0.5, 2.2 * p.sc * ws * dpr);
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(frame);
    }

    if (isVisible && rafRef.current === null) {
      last = performance.now();
      rafRef.current = requestAnimationFrame(frame);
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      ro.disconnect();
    };
  }, [config, isVisible]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    st.current.tgtRotY = nx * 1.4;
    st.current.tgtRotX = 0.18 - ny * 0.9;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    st.current.zoom = Math.max(-6, Math.min(10, st.current.zoom - e.deltaY * 0.012));
  }, []);

  const handleEnter = useCallback(() => {
    setHovered(true);
    st.current.hovered = true;
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(false);
    st.current.hovered = false;
    st.current.tgtRotY = st.current.rotY;
    st.current.tgtRotX = 0.18;
  }, []);

  const palette = config.palette;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none cursor-crosshair ${className}`}
      style={{ width, height, contain: 'layout paint size' }}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onWheel={handleWheel}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 90% at 50% 50%, ${palette.backgroundInner} 0%, ${palette.backgroundMid} 55%, ${palette.backgroundOuter} 100%)`,
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 48%, rgba(0,0,0,0.72) 100%)',
        }}
      />

      {showTitle && (
        <div
          className="absolute left-1/2 top-1/2 z-20 pointer-events-none text-center"
          style={{
            transform: 'translate(-50%, calc(-50% + clamp(140px, 24vw, 240px)))',
            width: 'min(92vw, 720px)',
            padding: '0 16px',
          }}
        >
          <h1
            style={{
              color: rgba(palette.secondary, 0.58),
              fontFamily: 'monospace',
              fontSize: 'clamp(0.55rem, 1.1vw, 0.75rem)',
              letterSpacing: 'clamp(0.18em, 1.2vw, 0.5em)',
              margin: 0,
              overflowWrap: 'anywhere',
              textTransform: 'uppercase',
            }}
          >
            {config.title}
          </h1>
          <p
            style={{
              color: rgba(palette.accent, 0.34),
              fontFamily: 'monospace',
              fontSize: 'clamp(0.45rem, 0.8vw, 0.6rem)',
              letterSpacing: 'clamp(0.08em, 0.7vw, 0.2em)',
              marginTop: '6px',
              overflowWrap: 'anywhere',
            }}
          >
            {config.subtitle}
          </p>
        </div>
      )}

      {showHUD && (
        <div
          className="absolute inset-0 pointer-events-none flex flex-col justify-between"
          style={{ padding: 'clamp(16px, 3vw, 32px)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div style={{ color: palette.accent, fontFamily: 'monospace', fontSize: 'clamp(8px,1.2vw,11px)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                {config.hudTitle}
              </div>
              <div style={{ color: rgba(palette.accent, 0.42), fontFamily: 'monospace', fontSize: 'clamp(7px,0.9vw,9px)', letterSpacing: '0.18em', marginTop: '5px' }}>
                ACTIVE &gt; {config.hudStatus}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  background: hovered ? palette.secondary : palette.accent,
                  borderRadius: '50%',
                  boxShadow: `0 0 ${hovered ? '14px' : '7px'} ${palette.accent}`,
                  height: '8px',
                  transition: 'all 0.35s ease',
                  width: '8px',
                }}
              />
              <span style={{ color: palette.accent, fontFamily: 'monospace', fontSize: 'clamp(7px,0.9vw,9px)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                {isVisible ? (hovered ? 'ENGAGED' : 'LIVE') : 'PAUSED'}
              </span>
            </div>
          </div>

          <div style={{ position: 'absolute', top: 'clamp(14px,2.5vw,28px)', left: 'clamp(14px,2.5vw,28px)', width: '24px', height: '24px', borderTop: `1px solid ${palette.accent}66`, borderLeft: `1px solid ${palette.accent}66` }} />
          <div style={{ position: 'absolute', top: 'clamp(14px,2.5vw,28px)', right: 'clamp(14px,2.5vw,28px)', width: '24px', height: '24px', borderTop: `1px solid ${palette.accent}66`, borderRight: `1px solid ${palette.accent}66` }} />
          <div style={{ position: 'absolute', bottom: 'clamp(14px,2.5vw,28px)', left: 'clamp(14px,2.5vw,28px)', width: '24px', height: '24px', borderBottom: `1px solid ${palette.accent}66`, borderLeft: `1px solid ${palette.accent}66` }} />
          <div style={{ position: 'absolute', bottom: 'clamp(14px,2.5vw,28px)', right: 'clamp(14px,2.5vw,28px)', width: '24px', height: '24px', borderBottom: `1px solid ${palette.accent}66`, borderRight: `1px solid ${palette.accent}66` }} />

          <div className="flex items-end justify-between gap-4">
            <div style={{ color: rgba(palette.accent, 0.34), fontFamily: 'monospace', fontSize: 'clamp(6px,0.85vw,9px)', lineHeight: '1.75', letterSpacing: '0.12em' }}>
              <div>DRAG - ROTATE</div>
              <div>SCROLL - ZOOM</div>
              <div>HOVER - ENGAGE</div>
            </div>
            <div style={{ color: rgba(palette.accent, 0.28), fontFamily: 'monospace', fontSize: 'clamp(6px,0.85vw,9px)', lineHeight: '1.75', textAlign: 'right', letterSpacing: '0.12em' }}>
              {config.metrics.map((metric) => <div key={metric}>{metric}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const LSTMReactor = memo(function LSTMReactor(props: Omit<NeuralCognitionReactorProps, 'variant'>) {
  return <NeuralCognitionReactor {...props} variant="lstm" />;
});

export const IFReactor = memo(function IFReactor(props: Omit<NeuralCognitionReactorProps, 'variant'>) {
  return <NeuralCognitionReactor {...props} variant="if" />;
});

export const CNNBiLSTMReactor = memo(function CNNBiLSTMReactor(props: Omit<NeuralCognitionReactorProps, 'variant'>) {
  return <NeuralCognitionReactor {...props} variant="cnn-bilstm" />;
});

export default NeuralCognitionReactor;
