"use client";

import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { X } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { cloudinaryTransform, cn } from "@/lib/utils";

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
  /** Trips that touched this location. Click reveals them. The first trip
   *  (most recent, since the caller sorts by start_at desc) is the one
   *  whose cover photo gets used as the marker thumbnail. */
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
  /**
   * Where the click-to-pin trip panel anchors. Default "bottom" works for
   * mini-globes that live inside a page. Full-viewport globes (like the
   * Atlas) should use "top" so the panel doesn't overlap a bottom HUD.
   */
  panelPlacement?: "top" | "bottom";
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

// Photo billboard. Renders a square sprite at the lat/lng with the trip's
// cover photo as texture. Sprites auto-billboard (always face camera) and
// are correctly occluded by the globe geometry, so they hide when on the
// far side. Texture loading suspends; the parent Suspense boundary keeps
// the rest of the scene rendering while photos load.
function PhotoSprite({
  point,
  position,
  pinned,
  handlers,
}: {
  point: GlobePoint;
  position: [number, number, number];
  pinned: boolean;
  handlers: PointHandlers;
}) {
  const rawUrl = point.trips?.[0]?.coverPhotoUrl;
  // Deliver a small square crop instead of the full upload — keeps texture
  // memory low when there are many markers on screen.
  const url = rawUrl
    ? cloudinaryTransform(rawUrl, "c_fill,g_auto,w_200,h_200,q_auto,f_auto")
    : null;
  const texture = useLoader(THREE.TextureLoader, url ?? "");
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
  }, [texture]);

  const interactive = !!point.name && (point.trips?.length ?? 0) > 0;
  const size = pinned ? 0.14 : 0.085;

  return (
    <sprite
      position={position}
      scale={[size, size, size]}
      onPointerOver={
        interactive
          ? (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              handlers.onHover(point);
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
              handlers.onPick(point);
            }
          : undefined
      }
    >
      <spriteMaterial
        map={texture}
        sizeAttenuation
        transparent={false}
        depthWrite
      />
    </sprite>
  );
}

// Fallback dot for points without a cover photo (and the Suspense fallback
// while textures are loading).
function DotMarker({
  point,
  position,
  pinned,
  handlers,
}: {
  point: GlobePoint;
  position: [number, number, number];
  pinned: boolean;
  handlers: PointHandlers;
}) {
  const interactive = !!point.name && (point.trips?.length ?? 0) > 0;
  const radius = pinned ? 0.026 : interactive ? 0.018 : 0.013;
  return (
    <mesh
      position={position}
      onPointerOver={
        interactive
          ? (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              handlers.onHover(point);
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
              handlers.onPick(point);
            }
          : undefined
      }
    >
      <sphereGeometry args={[radius, 12, 12]} />
      <meshBasicMaterial color={pinned ? "#f4f1ea" : "#d4a373"} />
    </mesh>
  );
}

function Marker({
  point,
  pinned,
  handlers,
}: {
  point: GlobePoint;
  pinned: boolean;
  handlers: PointHandlers;
}) {
  // Sit photo markers slightly further out than dot markers so they don't
  // clip into the surface.
  const hasPhoto = !!point.trips?.[0]?.coverPhotoUrl;
  const position = latLngToVec3(point.lat, point.lng, hasPhoto ? 1.05 : 1.005);

  if (!hasPhoto) {
    return (
      <DotMarker
        point={point}
        position={position}
        pinned={pinned}
        handlers={handlers}
      />
    );
  }
  return (
    <Suspense
      fallback={
        <DotMarker
          point={point}
          position={position}
          pinned={pinned}
          handlers={handlers}
        />
      }
    >
      <PhotoSprite
        point={point}
        position={position}
        pinned={pinned}
        handlers={handlers}
      />
    </Suspense>
  );
}

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

  // Collision resolution: when multiple points fall within a tiny arc of
  // each other their photos overlap unreadably. Group them by a coarse
  // lat/lng bucket and only render the most relevant one in each bucket
  // (the one with the most recent trip, which is already first in `trips`
  // since the caller sorts by start_at desc).
  const renderedPoints = useMemo(() => {
    const BUCKET_DEG = 2.5;
    const bucketKey = (lat: number, lng: number) =>
      `${Math.round(lat / BUCKET_DEG)}|${Math.round(lng / BUCKET_DEG)}`;
    const byBucket = new Map<string, GlobePoint>();
    for (const p of points) {
      const key = bucketKey(p.lat, p.lng);
      const existing = byBucket.get(key);
      if (!existing) {
        byBucket.set(key, p);
        continue;
      }
      // Prefer the bucket representative that actually has a photo. If
      // both have photos, keep the one with more trips (more interesting
      // cluster). Equal? keep the existing one — order is deterministic.
      const newHasPhoto = !!p.trips?.[0]?.coverPhotoUrl;
      const oldHasPhoto = !!existing.trips?.[0]?.coverPhotoUrl;
      if (newHasPhoto && !oldHasPhoto) {
        byBucket.set(key, p);
        continue;
      }
      if (newHasPhoto === oldHasPhoto) {
        if ((p.trips?.length ?? 0) > (existing.trips?.length ?? 0)) {
          byBucket.set(key, p);
        }
      }
    }
    return Array.from(byBucket.values());
  }, [points]);

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial map={colorMap} roughness={1} metalness={0} />
      </mesh>
      {renderedPoints.length > 0 && (
        <group>
          {renderedPoints.map((p) => {
            const key = `${p.lat},${p.lng},${p.name ?? ""}`;
            const pinned = pinnedKey === key;
            return (
              <Marker
                key={key}
                point={p}
                pinned={pinned}
                handlers={handlers}
              />
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
  panelPlacement = "bottom",
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
        <div
          className={cn(
            "absolute left-3 right-3 z-30 flex flex-col gap-3 border border-border bg-card/95 p-3 backdrop-blur-sm",
            panelPlacement === "top"
              ? "top-3 md:left-auto md:right-3 md:top-3 md:max-w-sm"
              : "bottom-3",
          )}
        >
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
            Toca una foto · zoom con la rueda
          </span>
        </div>
      )}
    </div>
  );
}
