import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

export default function FloatingDiamond() {
  const mesh = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = Math.cos(t / 4) / 8;
    mesh.current.rotation.y = Math.sin(t / 4) / 8;
    mesh.current.rotation.z = Math.sin(t / 4) / 8;
    mesh.current.position.y = (1 + Math.sin(t / 1.5)) / 10;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={mesh} scale={[1.5, 2.5, 1.5]}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#e63946"
          speed={2}
          distort={0.4}
          radius={1}
          metalness={0.8}
          roughness={0.2}
          emissive="#e63946"
          emissiveIntensity={0.5}
        />
      </mesh>
    </Float>
  );
}
