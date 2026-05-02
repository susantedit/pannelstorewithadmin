import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float, MeshDistortMaterial, PerspectiveCamera } from '@react-three/drei';

function Diamond(props) {
  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={2}>
      <mesh {...props}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#e63946"
          speed={3}
          distort={0.4}
          radius={1}
          roughness={0}
          metalness={1}
        />
      </mesh>
    </Float>
  );
}

function FloatingCube({ color, ...props }) {
  return (
    <Float speed={1.5} rotationIntensity={1.5} floatIntensity={1.5}>
      <mesh {...props}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
    </Float>
  );
}

export default function Scene3D() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Suspense fallback={null}>
          <Diamond position={[3, 1, 0]} scale={0.8} />
          <FloatingCube position={[-4, -2, -2]} color="#a855f7" scale={0.5} />
          <FloatingCube position={[2, -3, -1]} color="#34d399" scale={0.4} />
        </Suspense>
        
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
