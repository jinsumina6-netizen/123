import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';

const SnowShaderConfig = {
  uniforms: {
    color: { value: new THREE.Color('#fff') },
  },
  vertexShader: `
    attribute float size;
    attribute float opacity;
    varying float vOpacity;
    void main() {
      vOpacity = opacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (250.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying float vOpacity;
    void main() {
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);
      if (r > 1.0) discard;
      float alpha = (1.0 - r) * vOpacity;
      gl_FragColor = vec4(color, alpha);
    }
  `
};

export const EnvironmentEffects: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Reduced particle count for a cleaner look
  const particleCount = 400; 

  const [positions, sizes, opacities, speeds, drifts, offsets] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const drifts = new Float32Array(particleCount);
    const offsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 50 - 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      sizes[i] = Math.random() * 1.5 + 0.5; 
      opacities[i] = Math.random() * 0.5 + 0.3;
      speeds[i] = 1.5 + Math.random() * 2.0; 
      drifts[i] = Math.random() * 1.5 + 0.5; 
      offsets[i] = Math.random() * 100; 
    }

    return [positions, sizes, opacities, speeds, drifts, offsets];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current && pointsRef.current.geometry.attributes.position) {
      const positionsAttr = pointsRef.current.geometry.attributes.position;
      const array = positionsAttr.array as Float32Array;
      const time = state.clock.getElapsedTime();
      const globalWind = Math.sin(time * 0.5) * 0.5;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        array[i3 + 1] -= speeds[i] * delta;
        const localDrift = Math.sin(time * 2.0 + offsets[i]) * drifts[i] * 0.3;
        array[i3] += (globalWind + localDrift) * delta;
        array[i3 + 2] += Math.cos(time * 1.5 + offsets[i]) * 0.2 * delta;

        if (array[i3 + 1] < -20) {
          array[i3 + 1] = 30; 
          array[i3] = (Math.random() - 0.5) * 60; 
          array[i3 + 2] = (Math.random() - 0.5) * 60; 
        }
        
        if (array[i3] > 30) array[i3] -= 60;
        if (array[i3] < -30) array[i3] += 60;
        if (array[i3 + 2] > 30) array[i3 + 2] -= 60;
        if (array[i3 + 2] < -30) array[i3 + 2] += 60;
      }
      positionsAttr.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Crucial: Environment map for realistic metallic reflections */}
      <Environment preset="city" />

      {/* Lighting setup for dramatic contrast */}
      {/* Base ambient is handled by Environment, adding slight fill */}
      <ambientLight intensity={0.2} color="#ffffff" />
      
      {/* Warm Main Light */}
      <pointLight position={[10, 20, 10]} intensity={2.0} color="#fff5e6" distance={60} decay={2} />
      
      {/* Cool Rim Light - enhances edges */}
      <pointLight position={[-15, 5, -10]} intensity={2.0} color="#dbeaff" distance={60} decay={2} />
      
      {/* Top Spotlight for the Star and upper tree */}
      <spotLight 
        position={[0, 30, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={5.0} 
        color="#ffffff" 
        castShadow 
      />
      
      {/* Background stars */}
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
      
      {/* Snow particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={particleCount} array={sizes} itemSize={1} />
          <bufferAttribute attach="attributes-opacity" count={particleCount} array={opacities} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={SnowShaderConfig.uniforms}
          vertexShader={SnowShaderConfig.vertexShader}
          fragmentShader={SnowShaderConfig.fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};