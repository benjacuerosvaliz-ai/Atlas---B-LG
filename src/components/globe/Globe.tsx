"use client";

import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { X } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const ROTATION_PERIOD_SEC = 120; // 1 vuelta completa cada 120s (concepto §4)

export type GlobeTripMeta = {
  id: string;
  title: string;
  distanceKm: number | null;
  coverPhotoUrl: string | null;
};

export type GlobePoint = {
  lat: number;
  lng: number;
  /** Place name shown on hover, e.g. "Santiago", "Pucón". */
  name?: string;
  /** Trips that touched this location. Click reveals them. */
  trips?: GlobeTripMeta[];
  /** Reserved for future heatmap intensity. Defaults to 1. */
  intensity?: number;
};

type Props = {
  points?: GlobePoint[];
  height?: string;
  /**
   * Initial camera distance from the globe center. User can still zoom in
   * down to minDistance (1.35) or out to maxDistance (5).
   * - 2.7 = decorative tight framing (home hero default)
   * - 3.6 = mid framing for mini-globes on profile / sku pages
   * - 4.2 = far framing for the full Atlas, forces user to zoom in
   */
  cameraDistance?: number;
};

function latLngToVec3(
  lat: number,
  lng: number,
  radius = 1.005,
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

type PointHandlers = {
  onHover: (point: GlobePoint) => void;
  onLeave: () => void;
  onPick: (point: GlobePoint) => void;
};

function Earth({
  spinning,
  points,
  handlers,
  pinnedKey,
}: {
  spinning: boolean;
  points: GlobePoint[];
  handlers: PointHandlers;
  pinnedKey: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colorMap = useLoader(THREE.TextureLoader, "/textures/earth.jpg");

  useMemo(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;
  }, [colorMap]);

  useFrame((_, delta) => {
    if (spinning && groupRef.current) {
      groupRef.current.rotation.y += (delta * Math.PI * 2) / ROTATION_PERIOD_SEC;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial map={colorMap} roughness={1} metalness={0} />
      </mesh>
      {points.length > 0 && (
        <group>
          {points.map((p) => {
            const pos = latLngToVec3(p.lat, p.lng);
            const interactive = !!p.name && (p.trips?.length ?? 0) > 0;
            const key = `${p.lat},${p.lng},${p.name ?? ""}`;
            const pinned = pinnedKey === key;
            // Slightly larger when interactive; bigger again when pinned.
            const radius = pinned ? 0.026 : interactive ? 0.018 : 0.013;
            return (
              <mesh
                key={key}
                position={pos}
                onPointerOver={
                  interactive
                    ? (e: ThreeEvent<PointerEvent>) => {
                        e.stopPropagation();
                        handlers.onHover(p);
                        document.body.style.cursor = "pointer";
                      }
                    : undefined
                }
                onPointerOut={
                  interactive
                    ? () => {
                        handlers.onLeave();
                        document.body.style.cursor = "default";
                      }
                    : undefined
                }
                onClick={
                  interactive
                    ? (e: ThreeEvent<MouseEvent>) => {
                        e.stopPropagation();
                        handlers.onPick(p);
                      }
                    : undefined
                }
              >
                <sphereGeometry args={[radius, 12, 12]} />
                <meshBasicMaterial color={pinned ? "#f4f1ea" : "#d4a373"} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.07}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          uColor: { value: new THREE.Color("#7aa9ff") },
          uIntensity: { value: 0.55 },
        }}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          uniform vec3 uColor;
          uniform float uIntensity;
          void main() {
            float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
            gl_FragColor = vec4(uColor, fresnel * uIntensity);
          }
        `}
      />
    </mesh>
  );
}

export function Globe({
  points = [],
  height = "min(80vh, 700px)",
  cameraDistance = 2.7,
}: Props) {
  // Auto-rotation runs until the first user interaction (drag, zoom, click)
  // and then stays off for the rest of the session — easier to click points
  // on a still globe than a moving one.
  const [spinning, setSpinning] = useState(true);
  const [hovered, setHovered] = useState<GlobePoint | null>(null);
  const [pinned, setPinned] = useState<GlobePoint | null>(null);

  const handlers: PointHandlers = {
    onHover: (p) => setHovered(p),
    onLeave: () => setHovered(null),
    onPick: (p) => {
      setSpinning(false);
      setPinned(p);
    },
  };

  const hasInteractive = points.some(
    (p) => !!p.name && (p.trips?.length ?? 0) > 0,
  );
  const pinnedKey = pinned
    ? `${pinned.lat},${pinned.lng},${pinned.name ?? ""}`
    : null;

  return (
    <div
      className="relative w-full"
      style={{ height }}
      aria-label="Globo terráqueo BØLG Atlas"
      role="img"
    >
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.18} />
        <directionalLight position={[5, 3, 5]} intensity={1.6} />
        <directionalLight position={[-5, -2, -3]} intensity={0.18} color="#5bc0be" />
        <Suspense fallback={null}>
          <Earth
            spinning={spinning}
            points={points}
            handlers={handlers}
            pinnedKey={pinnedKey}
          />
          <Atmosphere />
          <Stars radius={80} depth={50} count={1800} factor={2.2} fade speed={0.4} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={1.35}
          maxDistance={5}
          zoomSpeed={0.5}
          rotateSpeed={0.45}
          enableDamping
          dampingFactor={0.08}
          onStart={() => setSpinning(false)}
        />
      </Canvas>

      {/* Hover label: just the place name. */}
      {hovered && !pinned && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 border border-border bg-card/85 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-[11px] uppercase tracking-[0.24em]">
            {hovered.name}
          </span>
        </div>
      )}

      {/* Pinned panel: trips at this location. */}
      {pinned && (pinned.trips?.length ?? 0) > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col gap-3 border border-border bg-card/95 p-3 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/60">
              {pinned.trips!.length === 1 ? "Viaje en" : "Viajes en"}{" "}
              <span className="text-foreground">{pinned.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setPinned(null)}
              className="text-foreground/50 hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {pinned.trips!.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/t/${t.id}`}
                  className="group flex items-center gap-3 hover:bg-foreground/[0.04] transition-colors"
                >
                  {t.coverPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.coverPhotoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 bg-fog" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm">{t.title}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50 tabular-nums">
                      {(t.distanceKm ?? 0).toLocaleString("es-CL")} km
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-foreground/40 group-hover:text-foreground transition-colors">
                    Ver →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasInteractive && !hovered && !pinned && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/35">
            Pasa por un punto · zoom con la rueda
          </span>
        </div>
      )}
    </div>
  );
}
