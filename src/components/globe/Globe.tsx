"use client";
/* eslint-disable react-hooks/immutability -- Three.js textures se configuran
 * imperativamente tras cargar (texture.colorSpace, texture.anisotropy). Es
 * el patrón canónico de react-three-fiber; el rule de inmutabilidad no
 * entiende que estos objetos no son React state. */

import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { X } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cloudinaryTransform, cn } from "@/lib/utils";

const ROTATION_PERIOD_SEC = 120; // 1 vuelta completa cada 120s (concepto §4)

export type GlobeTripMeta = {
  id: string;
  title: string;
  distanceKm: number | null;
  coverPhotoUrl: string | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
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

export type GlobeArc = {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  /** When the arc was created — drives the fade-in / fade-out timeline. */
  createdAt: number;
};

type Props = {
  points?: GlobePoint[];
  arcs?: GlobeArc[];
  height?: string;
  cameraDistance?: number;
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
// cover photo as texture. Sprites auto-billboard and occlude with the globe.
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
  // r_max → Cloudinary recorta la imagen en círculo. bo_*solid_rgb:f4f1ea
  // → borde fino color bone, que aísla visualmente las fotos cuando se
  // tocan en el globo. f_auto entrega PNG/WebP automáticamente porque
  // r_max requiere alfa.
  const url = rawUrl
    ? cloudinaryTransform(
        rawUrl,
        "c_fill,g_auto,w_220,h_220,r_max,bo_2px_solid_rgb:f4f1ea,q_auto,f_auto",
      )
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
      {/* transparent + alphaTest hace que las esquinas transparentes (fuera
          del círculo) no oculten otros markers detrás. depthWrite false
          para no causar z-fighting entre sprites pero seguir leyendo el
          depth del globo (la foto queda oculta cuando está al otro lado). */}
      <spriteMaterial
        map={texture}
        sizeAttenuation
        transparent
        alphaTest={0.5}
        depthWrite={false}
      />
    </sprite>
  );
}

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

// Curved arc from start → end, lifted above the globe surface. Fades in,
// holds, then fades out. Lifecycle is driven by createdAt timestamp and
// useFrame; the parent is responsible for un-mounting after ~6.5s.
function Arc({ arc }: { arc: GlobeArc }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const geom = useMemo(() => {
    const s = new THREE.Vector3(...latLngToVec3(arc.startLat, arc.startLng, 1.01));
    const e = new THREE.Vector3(...latLngToVec3(arc.endLat, arc.endLng, 1.01));
    const mid = s.clone().lerp(e, 0.5);
    const dist = s.distanceTo(e);
    // Lift the midpoint outward, proportional to chord length, so longer
    // arcs bulge more dramatically. Clamp so absurdly long arcs don't fly
    // off the screen.
    const lift = 1 + Math.min(0.6, dist * 0.4);
    mid.normalize().multiplyScalar(lift);
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    return new THREE.TubeGeometry(curve, 48, 0.006, 8, false);
  }, [arc.startLat, arc.startLng, arc.endLat, arc.endLng]);

  useFrame(() => {
    if (!matRef.current) return;
    const elapsed = (Date.now() - arc.createdAt) / 1000;
    let opacity = 0;
    if (elapsed < 0.5) {
      opacity = elapsed / 0.5; // fade in
    } else if (elapsed < 4.5) {
      opacity = 1; // hold
    } else {
      opacity = Math.max(0, 1 - (elapsed - 4.5) / 1.5); // fade out
    }
    matRef.current.opacity = opacity;
  });

  return (
    <mesh geometry={geom}>
      <meshBasicMaterial
        ref={matRef}
        color="#7aa9ff"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Earth({
  points,
  arcs,
  handlers,
  pinnedKey,
  spinning,
}: {
  points: GlobePoint[];
  arcs: GlobeArc[];
  handlers: PointHandlers;
  pinnedKey: string | null;
  spinning: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colorMap = useLoader(THREE.TextureLoader, "/textures/earth.jpg");

  useMemo(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;
  }, [colorMap]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (spinning) {
      g.rotation.y += (delta * Math.PI * 2) / ROTATION_PERIOD_SEC;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial map={colorMap} roughness={1} metalness={0} />
      </mesh>

      {arcs.length > 0 && (
        <group>
          {arcs.map((a) => (
            <Arc key={a.id} arc={a} />
          ))}
        </group>
      )}

      {points.length > 0 && (
        <group>
          {points.map((p) => {
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
  arcs = [],
  height = "min(80vh, 700px)",
  cameraDistance = 2.7,
  panelPlacement = "bottom",
}: Props) {
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
            points={points}
            arcs={arcs}
            handlers={handlers}
            pinnedKey={pinnedKey}
            spinning={spinning}
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

      {/* Hover label: place name + author avatar peek. Only shows when not
          pinned, so the click panel can take over the visual focus. */}
      {hovered && !pinned && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 border border-border bg-card/85 px-3 py-1.5 backdrop-blur-sm">
          {(() => {
            const trip = hovered.trips?.[0];
            return (
              <>
                {trip?.avatarUrl && (
                  <Avatar className="h-5 w-5 shrink-0 bg-fog">
                    <AvatarImage
                      src={trip.avatarUrl}
                      alt={trip.displayName ?? trip.username ?? ""}
                    />
                  </Avatar>
                )}
                <span className="text-[11px] uppercase tracking-[0.24em]">
                  {hovered.name}
                </span>
                {trip?.username && (
                  <span className="font-mono text-[10px] text-foreground/55">
                    · @{trip.username}
                  </span>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Pinned panel: PEOPLE who passed through this location. We dedupe
          the marker's trip list by username so the same person doesn't
          show up multiple times if they came back. Each row links to the
          user's public profile, not the underlying trip. */}
      {pinned && (pinned.trips?.length ?? 0) > 0 && (() => {
        const seen = new Set<string>();
        const people = (pinned.trips ?? []).filter((t) => {
          const key = t.username ?? t.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return !!t.username;
        });
        if (people.length === 0) return null;
        return (
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
                {people.length === 1
                  ? "1 persona ha estado en"
                  : `${people.length} personas han estado en`}{" "}
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
            <ul className="flex flex-col">
              {people.map((t) => {
                const initials = (t.displayName ?? t.username ?? "·")
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0] ?? "")
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <li key={t.username ?? t.id}>
                    <Link
                      href={`/u/${t.username}`}
                      className="group flex items-center gap-3 border-b border-border/40 py-2 last:border-b-0 hover:bg-foreground/[0.04] transition-colors"
                    >
                      <Avatar className="h-10 w-10 shrink-0 bg-fog">
                        {t.avatarUrl && (
                          <AvatarImage
                            src={t.avatarUrl}
                            alt={t.displayName ?? t.username ?? ""}
                          />
                        )}
                        <AvatarFallback className="bg-fog text-[10px] font-black text-foreground/75">
                          {initials || "·"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm">
                          {t.displayName ?? `@${t.username}`}
                        </span>
                        {t.username && (
                          <span className="truncate font-mono text-[10px] text-foreground/45">
                            @{t.username}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.24em] text-foreground/40 group-hover:text-foreground transition-colors">
                        Ver perfil →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })()}

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
