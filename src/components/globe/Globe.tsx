"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const ROTATION_PERIOD_SEC = 120; // 1 vuelta completa cada 120s (concepto §4)

export type GlobePoint = {
  lat: number;
  lng: number;
  /** Reserved for future heatmap intensity. Defaults to 1. */
  intensity?: number;
};

type Props = {
  /** Points to plot on the surface (lat/lng in degrees). Rotate with the earth. */
  points?: GlobePoint[];
  /** Wrapper height. Defaults to the home hero size. */
  height?: string;
};

/** Convert lat/lng (degrees) → unit-sphere vec3 (radius scalable). */
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

function Earth({
  paused,
  points,
}: {
  paused: boolean;
  points: GlobePoint[];
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
            return (
              <mesh key={`${p.lat},${p.lng},${i}`} position={pos}>
                <sphereGeometry args={[0.013, 12, 12]} />
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
  // Halo Fresnel: esfera ligeramente más grande, additive blend, glow en los bordes.
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
          <Earth paused={paused} points={points} />
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
    </div>
  );
}
