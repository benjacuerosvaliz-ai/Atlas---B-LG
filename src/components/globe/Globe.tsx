"use client";

import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useRouter } from "next/navigation";
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
  /** Reserved for future heatmap intensity. Defaults to 1. */
  intensity?: number;
  /** When set, the point becomes hoverable + clickable and shows a preview overlay. */
  trip?: GlobeTripMeta;
};

type Props = {
  points?: GlobePoint[];
  height?: string;
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
  onHover: (trip: GlobeTripMeta) => void;
  onLeave: () => void;
  onPick: (trip: GlobeTripMeta) => void;
};

function Earth({
  paused,
  points,
  handlers,
}: {
  paused: boolean;
  points: GlobePoint[];
  handlers: PointHandlers;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colorMap = useLoader(THREE.TextureLoader, "/textures/earth.jpg");

  useMemo(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;
  }, [colorMap]);

  useFrame((_, delta) => {
    if (!paused && groupRef.current) {
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
          {points.map((p, i) => {
            const pos = latLngToVec3(p.lat, p.lng);
            const interactive = !!p.trip;
            const radius = interactive ? 0.018 : 0.013;
            return (
              <mesh
                key={`${p.lat},${p.lng},${i}`}
                position={pos}
                onPointerOver={
                  interactive
                    ? (e: ThreeEvent<PointerEvent>) => {
                        e.stopPropagation();
                        if (p.trip) handlers.onHover(p.trip);
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
                        if (p.trip) handlers.onPick(p.trip);
                      }
                    : undefined
                }
              >
                <sphereGeometry args={[radius, 12, 12]} />
                <meshBasicMaterial color="#d4a373" />
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

export function Globe({ points = [], height = "min(80vh, 700px)" }: Props) {
  const [paused, setPaused] = useState(false);
  const [hoveredTrip, setHoveredTrip] = useState<GlobeTripMeta | null>(null);
  const router = useRouter();

  const handlers: PointHandlers = {
    onHover: (trip) => setHoveredTrip(trip),
    onLeave: () => setHoveredTrip(null),
    onPick: (trip) => router.push(`/t/${trip.id}`),
  };

  const hasInteractive = points.some((p) => p.trip);

  return (
    <div
      className="relative w-full"
      style={{ height }}
      aria-label="Globo terráqueo BØLG Atlas"
      role="img"
    >
      <Canvas
        camera={{ position: [0, 0, 2.7], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.18} />
        <directionalLight position={[5, 3, 5]} intensity={1.6} />
        <directionalLight position={[-5, -2, -3]} intensity={0.18} color="#5bc0be" />
        <Suspense fallback={null}>
          <Earth paused={paused} points={points} handlers={handlers} />
          <Atmosphere />
          <Stars radius={80} depth={50} count={1800} factor={2.2} fade speed={0.4} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          rotateSpeed={0.45}
          enableDamping
          dampingFactor={0.08}
          onStart={() => setPaused(true)}
          onEnd={() => setPaused(false)}
        />
      </Canvas>

      {hoveredTrip && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex items-center gap-3 border border-border bg-card/90 p-3 backdrop-blur-sm">
          {hoveredTrip.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hoveredTrip.coverPhotoUrl}
              alt=""
              className="h-14 w-14 shrink-0 object-cover"
            />
          ) : (
            <div className="h-14 w-14 shrink-0 bg-fog" />
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm">{hoveredTrip.title}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
              <span className="tabular-nums">
                {(hoveredTrip.distanceKm ?? 0).toLocaleString("es-CL")} km
              </span>
              <span className="px-2">·</span>
              Click para ver
            </span>
          </div>
        </div>
      )}

      {hasInteractive && !hoveredTrip && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/35">
            Pasa el cursor por un punto
          </span>
        </div>
      )}
    </div>
  );
}
