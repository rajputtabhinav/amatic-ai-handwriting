/**
 * 3D Component Templates
 * 
 * Pre-built Three.js/React Three Fiber templates for spatial concepts.
 * Used for molecules, solar systems, architecture, and physics simulations.
 */

'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Line } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Molecule Viewer Template
 */
export interface Atom {
  id: string;
  position: [number, number, number];
  element: string;
  color: string;
  radius: number;
}

export interface Bond {
  from: string;
  to: string;
  type: 'single' | 'double' | 'triple';
}

export function MoleculeViewer({
  atoms,
  bonds,
}: {
  atoms: Atom[];
  bonds: Bond[];
}) {
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null);

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      {/* Atoms */}
      {atoms.map((atom) => (
        <Sphere
          key={atom.id}
          position={atom.position}
          args={[atom.radius, 32, 32]}
          onClick={() => setSelectedAtom(atom.id)}
        >
          <meshStandardMaterial
            color={atom.color}
            emissive={selectedAtom === atom.id ? atom.color : '#000000'}
            emissiveIntensity={selectedAtom === atom.id ? 0.3 : 0}
          />
        </Sphere>
      ))}

      {/* Bonds */}
      {bonds.map((bond, i) => {
        const fromAtom = atoms.find((a) => a.id === bond.from);
        const toAtom = atoms.find((a) => a.id === bond.to);
        if (!fromAtom || !toAtom) return null;

        return (
          <Line
            key={i}
            points={[fromAtom.position, toAtom.position]}
            color="#94a3b8"
            lineWidth={bond.type === 'triple' ? 3 : bond.type === 'double' ? 2 : 1}
          />
        );
      })}

      <OrbitControls enableZoom enablePan enableRotate />
    </Canvas>
  );
}

/**
 * Solar System Template
 */
export interface Planet {
  name: string;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  color: string;
}

function OrbitingPlanet({
  orbitRadius,
  orbitSpeed,
  size,
  color,
}: Planet) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * orbitSpeed;
      ref.current.position.x = Math.cos(t) * orbitRadius;
      ref.current.position.z = Math.sin(t) * orbitRadius;
    }
  });

  return (
    <Sphere ref={ref} args={[size, 32, 32]}>
      <meshStandardMaterial color={color} />
    </Sphere>
  );
}

export function SolarSystem({ planets }: { planets: Planet[] }) {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} />

      {/* Sun */}
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#FDB813" emissive="#FDB813" emissiveIntensity={0.5} />
      </Sphere>

      {/* Planets */}
      {planets.map((planet) => (
        <OrbitingPlanet key={planet.name} {...planet} />
      ))}

      {/* Orbit paths */}
      {planets.map((planet, i) => {
        const points = [];
        for (let j = 0; j <= 64; j++) {
          const angle = (j / 64) * Math.PI * 2;
          points.push(
            new THREE.Vector3(
              Math.cos(angle) * planet.orbitRadius,
              0,
              Math.sin(angle) * planet.orbitRadius
            )
          );
        }
        return (
          <Line
            key={i}
            points={points}
            color="#94a3b8"
            lineWidth={0.5}
            opacity={0.3}
            transparent
          />
        );
      })}

      <OrbitControls enableZoom enablePan enableRotate />
    </Canvas>
  );
}

/**
 * Physics Simulation Template
 */
export interface PhysicsObject {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  mass: number;
  color: string;
  shape: 'sphere' | 'box';
}

function PhysicsBody({ obj }: { obj: PhysicsObject }) {
  const ref = useRef<THREE.Mesh>(null);
  const [pos, setPos] = useState<[number, number, number]>(obj.position);

  useFrame((_, delta) => {
    if (ref.current) {
      // Simple physics simulation
      const gravity = [0, -9.8 * delta, 0];
      const newVel = [
        obj.velocity[0],
        obj.velocity[1] + gravity[1],
        obj.velocity[2],
      ];

      const newPos: [number, number, number] = [
        pos[0] + newVel[0] * delta,
        Math.max(-5, pos[1] + newVel[1] * delta), // Floor at -5
        pos[2] + newVel[2] * delta,
      ];

      setPos(newPos);
      ref.current.position.set(...newPos);
    }
  });

  return (
    <>
      {obj.shape === 'sphere' ? (
        <Sphere ref={ref} args={[obj.mass * 0.5, 32, 32]} position={pos}>
          <meshStandardMaterial color={obj.color} />
        </Sphere>
      ) : (
        <Box ref={ref} args={[obj.mass, obj.mass, obj.mass]} position={pos}>
          <meshStandardMaterial color={obj.color} />
        </Box>
      )}
    </>
  );
}

export function PhysicsSimulation({ objects }: { objects: PhysicsObject[] }) {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} />

      {/* Ground plane */}
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* Physics objects */}
      {objects.map((obj) => (
        <PhysicsBody key={obj.id} obj={obj} />
      ))}

      <OrbitControls enableZoom enablePan enableRotate />
    </Canvas>
  );
}

/**
 * DNA Helix Template
 */
export function DNAHelix({
  basePairs = 20,
  rotationSpeed = 0.01,
}: {
  basePairs?: number;
  rotationSpeed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });

  const helixPoints1: THREE.Vector3[] = [];
  const helixPoints2: THREE.Vector3[] = [];

  for (let i = 0; i < basePairs; i++) {
    const t = (i / basePairs) * Math.PI * 4;
    const y = i * 0.3 - (basePairs * 0.3) / 2;

    helixPoints1.push(
      new THREE.Vector3(Math.cos(t) * 2, y, Math.sin(t) * 2)
    );
    helixPoints2.push(
      new THREE.Vector3(
        Math.cos(t + Math.PI) * 2,
        y,
        Math.sin(t + Math.PI) * 2
      )
    );
  }

  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} />

      <group ref={groupRef}>
        {/* Helix strands */}
        <Line points={helixPoints1} color="#6366f1" lineWidth={3} />
        <Line points={helixPoints2} color="#8b5cf6" lineWidth={3} />

        {/* Base pairs */}
        {helixPoints1.map((point1, i) => {
          const point2 = helixPoints2[i];
          return (
            <Line
              key={i}
              points={[point1, point2]}
              color="#ec4899"
              lineWidth={2}
            />
          );
        })}

        {/* Nucleotides */}
        {helixPoints1.map((point, i) => (
          <Sphere key={`n1-${i}`} position={point.toArray()} args={[0.2, 16, 16]}>
            <meshStandardMaterial color="#6366f1" />
          </Sphere>
        ))}
        {helixPoints2.map((point, i) => (
          <Sphere key={`n2-${i}`} position={point.toArray()} args={[0.2, 16, 16]}>
            <meshStandardMaterial color="#8b5cf6" />
          </Sphere>
        ))}
      </group>

      <OrbitControls enableZoom enablePan enableRotate />
    </Canvas>
  );
}

export default {
  MoleculeViewer,
  SolarSystem,
  PhysicsSimulation,
  DNAHelix,
};

