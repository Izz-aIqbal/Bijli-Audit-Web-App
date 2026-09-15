"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// Silence Three.js Clock & Color Management deprecation warnings
THREE.ColorManagement.enabled = true;

// Statically generated particle positions (computed once at module load so the
// render pass stays pure — React forbids impure calls like Math.random inside render).
const PARTICLE_POSITIONS: [number, number, number][] = Array.from(
  { length: 40 },
  () => [
    (Math.random() - 0.5) * 18,
    (Math.random() - 0.5) * 11,
    -3 - Math.random() * 4, // Keep behind content layer
  ]
);
const PARTICLE_SCALES: number[] = Array.from(
  { length: 40 },
  () => 0.06 + Math.random() * 0.12
);
const PARTICLE_SPEEDS: number[] = Array.from(
  { length: 40 },
  () => 0.4 + Math.random() * 1.2
);

// Random short "energy bolt" line segments floating in space.
const BOLT_SEGMENTS: [number, number, number][][] = Array.from(
  { length: 12 },
  () => {
    const x = (Math.random() - 0.5) * 14;
    const y = (Math.random() - 0.5) * 9;
    const z = -2 - Math.random() * 3;
    return [
      [x, y, z],
      [
        x + (Math.random() - 0.5) * 2.2,
        y + (Math.random() - 0.5) * 2.2,
        z + (Math.random() - 0.5) * 1.2,
      ],
    ] as [number, number, number][];
  }
);

// Floating translucent "bill sheet" planes, like papers drifting in the wind.
const SHEET_POSITIONS: [number, number, number][] = [
  [-5.2, 2.4, -1.5],
  [5.4, -2.6, -1.5],
  [-4.6, -3.1, -2.2],
];
const SHEET_SPINS: [number, number, number][] = [
  [0.4, 0.2, 0.1],
  [-0.35, -0.15, 0.2],
  [0.2, 0.3, -0.1],
];

function EnergyParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
      groupRef.current.rotation.x += delta * 0.02;
    }
    // Gentle breathing pulse on every particle.
    meshes.current.forEach((m, i) => {
      if (m) {
        const s = PARTICLE_SCALES[i] * (1 + Math.sin(t * PARTICLE_SPEEDS[i]) * 0.35);
        m.scale.setScalar(s);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {PARTICLE_POSITIONS.map((position, i) => (
        <mesh
          key={i}
          position={position}
          ref={(el) => {
            meshes.current[i] = el;
          }}
        >
          <octahedronGeometry args={[PARTICLE_SCALES[i], 0]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#f59e0b" : "#38bdf8"}
            emissive={i % 2 === 0 ? "#f59e0b" : "#38bdf8"}
            emissiveIntensity={0.9}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// Static electricity arcs drawn as additive line segments.
function EnergyBolts() {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    BOLT_SEGMENTS.forEach(([a, b]) => {
      positions.push(...a, ...b);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color="#f97316"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

// Slow-spinning wireframe "energy core" — the heart of the scene.
function EnergyCore() {
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.18;
      coreRef.current.rotation.y += delta * 0.24;
      const ripple = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.06;
      coreRef.current.scale.setScalar(ripple);
    }
  });

  return (
    <mesh ref={coreRef} position={[0, 0, -1.5]}>
      <torusKnotGeometry args={[0.9, 0.28, 64, 8]} />
      <meshBasicMaterial
        color="#f59e0b"
        wireframe
        transparent
        opacity={0.28}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Multi-axis orbit rings that cross one another like a gyroscope.
function OrbitRings() {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringC = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringA.current) {
      ringA.current.rotation.x += delta * 0.22;
      ringA.current.rotation.y += delta * 0.12;
    }
    if (ringB.current) {
      ringB.current.rotation.x += delta * 0.14;
      ringB.current.rotation.z += delta * 0.2;
    }
    if (ringC.current) {
      ringC.current.rotation.y += delta * 0.26;
      ringC.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group position={[0, 0, -3]}>
      <mesh ref={ringA} rotation={[1.2, 0, 0]}>
        <torusGeometry args={[3.4, 0.016, 8, 96]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ringB} rotation={[0.4, 1.3, 0.6]}>
        <torusGeometry args={[3.1, 0.012, 8, 96]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ringC} rotation={[1.9, 0.8, 1.1]}>
        <torusGeometry args={[2.7, 0.02, 8, 72]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Translucent paper "bill sheets" drifting on the edges.
function FloatingSheets() {
  return (
    <group>
      {SHEET_POSITIONS.map((position, i) => (
        <Float
          key={i}
          speed={1.6 + i * 0.3}
          rotationIntensity={1.4}
          floatIntensity={1.8}
        >
          <mesh position={position} rotation={SHEET_SPINS[i]}>
            <planeGeometry args={[1.1, 1.5]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// Pointer-aware parallax wrapper — the whole field gently follows the cursor.
function ParallaxField({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const targetX = state.pointer.x * 0.35;
      const targetY = state.pointer.y * 0.25;
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.03;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.03;
      groupRef.current.position.x += (state.pointer.x * 0.4 - groupRef.current.position.x) * 0.03;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function Scene() {
  return (
    <div className="w-full h-full min-h-screen pointer-events-none">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />

        <ParallaxField>
          {/* Ambient Electricity Field */}
          <EnergyParticles />
          <EnergyBolts />

          {/* The waiting energy core + gyroscope orbits */}
          <EnergyCore />
          <OrbitRings />

          {/* Peripheral accents */}
          <FloatingSheets />
        </ParallaxField>
      </Canvas>
    </div>
  );
}