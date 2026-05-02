import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PulsingCore() {
  const mesh = useRef();
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#e63946') }
  }), []);

  useFrame((state) => {
    mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        transparent
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float uTime;
          void main() {
            vUv = uv;
            vPosition = position;
            vec3 pos = position;
            pos.x += sin(pos.y * 10.0 + uTime) * 0.1;
            pos.y += cos(pos.x * 10.0 + uTime) * 0.1;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float uTime;
          uniform vec3 uColor;
          void main() {
            float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
            float dist = length(vPosition);
            float alpha = smoothstep(2.0, 0.0, dist) * 0.2 * pulse;
            gl_FragColor = vec4(uColor, alpha);
          }
        `}
      />
    </mesh>
  );
}
