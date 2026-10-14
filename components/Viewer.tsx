"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import type { GadgetData, PartData } from "@/data/demo-phone";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => ((t = clamp(t)), t * t * (3 - 2 * t));
type Ref<T> = RefObject<T>;

/* ---------- Процедурные детали (потом заменяются на узлы GLB) ---------- */
function rr(w: number, h: number, r: number) {
  const x = -w / 2, y = -h / 2, s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function Slab(p: {
  w: number; h: number; r: number; d: number; color: string;
  metal?: number; rough?: number; glow?: string; hole?: [number, number, number];
}) {
  const [geo] = useState(() => {
    const s = rr(p.w, p.h, p.r);
    if (p.hole) s.holes.push(rr(...p.hole));
    const g = new THREE.ExtrudeGeometry(s, {
      depth: p.d, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 12,
    });
    g.translate(0, 0, -p.d / 2);
    return g;
  });
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        color={p.color} metalness={p.metal ?? 0.4} roughness={p.rough ?? 0.45}
        emissive={p.glow ?? "#000000"} emissiveIntensity={p.glow ? 0.5 : 0}
      />
    </mesh>
  );
}

const Chip = ({ at, s }: { at: [number, number, number]; s: [number, number, number] }) => (
  <mesh position={at}>
    <boxGeometry args={s} />
    <meshStandardMaterial color="#1b2030" metalness={0.6} roughness={0.3} emissive="#000000" emissiveIntensity={0} />
  </mesh>
);

const Lens = ({ x, y }: { x: number; y: number }) => (
  <group position={[x, y, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
    <mesh>
      <cylinderGeometry args={[0.17, 0.17, 0.06, 32]} />
      <meshStandardMaterial color="#9aa2b4" metalness={1} roughness={0.2} emissive="#000000" emissiveIntensity={0} />
    </mesh>
    <mesh position={[0, 0.031, 0]}>
      <cylinderGeometry args={[0.11, 0.11, 0.01, 32]} />
      <meshStandardMaterial color="#05070c" metalness={1} roughness={0.05} emissive="#000000" emissiveIntensity={0} />
    </mesh>
  </group>
);

// Положение детали в собранном виде + её геометрия. Ключ = Part.slug из БД.
const SHAPES: Record<string, { at: [number, number, number]; node: ReactNode }> = {
  back: { at: [0, 0, 0], node: <Slab w={1.7} h={3.4} r={0.24} d={0.05} color="#aab4c8" metal={0.8} rough={0.3} /> },
  frame: { at: [0, 0, 0.13], node: <Slab w={1.78} h={3.48} r={0.26} d={0.22} hole={[1.62, 3.32, 0.18]} color="#6b7488" metal={0.9} rough={0.25} /> },
  battery: { at: [0, -0.7, 0.1], node: <Slab w={1.3} h={1.55} r={0.08} d={0.1} color="#2fbf8a" metal={0.2} rough={0.5} /> },
  board: {
    at: [0, 0.8, 0.1],
    node: (
      <>
        <Slab w={1.35} h={1.2} r={0.08} d={0.04} color="#1f7a5c" metal={0.3} rough={0.5} />
        <Chip at={[-0.3, -0.2, 0.05]} s={[0.4, 0.4, 0.06]} />
        <Chip at={[0.3, -0.3, 0.04]} s={[0.3, 0.3, 0.05]} />
      </>
    ),
  },
  camera: {
    at: [0.38, 1.0, 0.17],
    node: (
      <>
        <Slab w={0.8} h={0.8} r={0.16} d={0.06} color="#2a3042" />
        <Lens x={-0.17} y={0.17} />
        <Lens x={0.17} y={-0.17} />
      </>
    ),
  },
  display: { at: [0, 0, 0.27], node: <Slab w={1.62} h={3.34} r={0.18} d={0.04} color="#0a0f1e" glow="#27408f" metal={0.1} rough={0.15} /> },
};

function PartNode(props: {
  part: PartData; hovered: boolean; progress: Ref<number>;
  onOver: (s: string) => void; onOut: (s: string) => void;
}) {
  const { part, hovered, progress } = props;
  const ref = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);
  const shape = SHAPES[part.slug];

  useEffect(() => {
    const list: THREE.MeshStandardMaterial[] = [];
    ref.current?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mt = m.material as THREE.MeshStandardMaterial;
      mt.userData.base = mt.emissiveIntensity;
      if (!mt.emissiveIntensity) mt.emissive.set(part.accentColor);
      list.push(mt);
    });
    mats.current = list;
  }, [part.accentColor]);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g || !shape) return;
    const p = progress.current;
    const k = ease((p - part.animStart) / (part.animEnd - part.animStart));
    const [x, y, z] = shape.at;
    g.position.set(x + part.explodeX * k, y + part.explodeY * k, z + part.explodeZ * k);
    const on = hovered && p > 0.15;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, on ? part.hoverScale : 1, 10, dt));
    for (const m of mats.current)
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, (m.userData.base ?? 0) + (on ? 0.45 : 0), 10, dt);
  });

  if (!shape) return null;
  return (
    <group
      ref={ref}
      position={shape.at}
      onPointerOver={(e) => (e.stopPropagation(), props.onOver(part.slug))}
      onPointerOut={() => props.onOut(part.slug)}
    >
      {shape.node}
    </group>
  );
}

/* Колесо задаёт прогресс 0..1: камера приближается, детали расходятся */
function Rig({ progress, target, bar, children }: { progress: Ref<number>; target: Ref<number>; bar: Ref<HTMLDivElement | null>; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    progress.current = THREE.MathUtils.damp(progress.current, target.current, 4, dt);
    const k = ease(progress.current);
    s.camera.position.z = THREE.MathUtils.lerp(11, 7.6, k);
    if (g.current) g.current.rotation.set(0.08, -0.35 - k * 0.5, 0);
    if (bar.current) bar.current.style.transform = `scaleX(${progress.current})`;
  });
  return <group ref={g}>{children}</group>;
}

/* ---------- Страница ---------- */
export default function Viewer({ gadget }: { gadget: GadgetData }) {
  const [hover, setHover] = useState<string | null>(null);
  const progress = useRef(0);
  const target = useRef(0);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const add = (d: number) => (target.current = clamp(target.current + d));
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      add((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.0007);
    };
    const key = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) add(0.12);
      if (["ArrowUp", "PageUp"].includes(e.key)) add(-0.12);
    };
    let y = 0;
    const ts = (e: TouchEvent) => (y = e.touches[0].clientY);
    const tm = (e: TouchEvent) => {
      const ny = e.touches[0].clientY;
      add((y - ny) * 0.003);
      y = ny;
    };
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", ts, { passive: true });
    window.addEventListener("touchmove", tm, { passive: true });
    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", ts);
      window.removeEventListener("touchmove", tm);
    };
  }, []);

  const over = (s: string) => progress.current > 0.15 && setHover(s);
  const out = (s: string) => setHover((h) => (h === s ? null : h));
  const active = gadget.parts.find((p) => p.slug === hover);

  return (
    <div className="fixed inset-0 touch-none select-none overflow-hidden bg-[radial-gradient(ellipse_at_40%_45%,#fdfdfe_0%,#dde2ea_75%)] text-[#171c28]">
      <div className="absolute inset-x-0 top-0 bottom-[36%] md:right-[380px] md:bottom-0">
        <Canvas camera={{ position: [0, 0, 11], fov: 34 }} dpr={[1, 2]} onPointerMissed={() => setHover(null)}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 6]} intensity={1.4} />
          <Suspense fallback={null}>
            <Environment preset="studio" />
          </Suspense>
          <Rig progress={progress} target={target} bar={bar}>
            {gadget.parts.map((p) => (
              <PartNode key={p.slug} part={p} hovered={hover === p.slug} progress={progress} onOver={over} onOut={out} />
            ))}
          </Rig>
        </Canvas>

        <header className="pointer-events-none absolute left-6 top-6">
          <h1 className="text-xl font-semibold tracking-tight">{gadget.name}</h1>
          <p className="mt-1 text-sm text-black/55">{gadget.summary}</p>
        </header>

        <nav className="absolute bottom-20 left-6 hidden flex-col gap-0.5 md:flex">
          {gadget.parts.map((p) => (
            <button
              key={p.slug}
              onMouseEnter={() => setHover(p.slug)}
              onMouseLeave={() => out(p.slug)}
              onFocus={() => setHover(p.slug)}
              onBlur={() => out(p.slug)}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors ${hover === p.slug ? "bg-black/5 text-black" : "text-black/50"}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: p.accentColor }} />
              {p.name}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3">
          <button onClick={() => (target.current = 0)} className="rounded-full border border-black/15 px-3 py-1 text-xs hover:bg-black/5">Собрать</button>
          <div className="h-[3px] w-40 overflow-hidden rounded bg-black/10">
            <div ref={bar} className="h-full origin-left scale-x-0 bg-[#171c28]" />
          </div>
          <button onClick={() => (target.current = 1)} className="rounded-full border border-black/15 px-3 py-1 text-xs hover:bg-black/5">Разобрать</button>
        </div>
      </div>

      <aside className="absolute inset-x-0 bottom-0 z-10 h-[36%] overflow-auto border-t border-black/10 bg-white/80 p-5 backdrop-blur-md md:inset-x-auto md:inset-y-0 md:right-0 md:h-auto md:w-[380px] md:border-l md:border-t-0 md:p-8">
        {active ? (
          <div key={active.slug}>
            <span className="mb-3 block h-1 w-10 rounded-full" style={{ background: active.accentColor }} />
            <h2 className="text-2xl font-semibold tracking-tight">{active.name}</h2>
            <p className="mt-2 text-[15px] leading-relaxed">{active.function}</p>
            {active.description && <p className="mt-3 text-sm leading-relaxed text-black/60">{active.description}</p>}
            <dl className="mt-5 text-sm">
              {active.specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 border-t border-black/10 py-2">
                  <dt className="text-black/55">{s.label}</dt>
                  <dd className="text-right font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Разберите устройство</h2>
            <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-black/60">
              Крутите колесо мыши (на телефоне проведите пальцем вверх): камера приблизится, а детали разойдутся. Наведите на деталь, чтобы узнать, что это.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
