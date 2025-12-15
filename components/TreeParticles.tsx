import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppMode, ParticleData } from '../types';
import { easing } from 'maath';

interface TreeParticlesProps {
  mode: AppMode;
  photos: string[]; // URLs
  onPhotoSelect?: (index: number) => void;
}

const ORNAMENT_COUNT = 2200; // Dense tree
const TREE_HEIGHT = 20;
const TREE_RADIUS = 7.5; // Slightly wider base

// --- GEOMETRIES ---
const sphereGeo = new THREE.SphereGeometry(1, 32, 32); // Higher definition for smooth reflections
const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
const gemGeo = new THREE.OctahedronGeometry(1, 0);

// Candy Cane
const caneCylinderGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
caneCylinderGeo.translate(0, 0.75, 0); 
const caneHookGeo = new THREE.TorusGeometry(0.3, 0.15, 8, 12, Math.PI);
caneHookGeo.rotateZ(Math.PI / 2);
caneHookGeo.translate(-0.3, 1.5, 0); 

// Santa Hat
const santaConeGeo = new THREE.ConeGeometry(0.6, 1.5, 16);
santaConeGeo.translate(0, 0.75, 0);
const santaBrimGeo = new THREE.TorusGeometry(0.6, 0.2, 8, 16);
const santaPomGeo = new THREE.SphereGeometry(0.2, 8, 8);
santaPomGeo.translate(0, 1.5, 0);

// Gift Box Ribbons
const ribbonVGeo = new THREE.BoxGeometry(1.25, 1.25, 0.3);
const ribbonHGeo = new THREE.BoxGeometry(0.3, 1.25, 1.25);

// Gingerbread Man Shape
const gingerbreadShape = new THREE.Shape();
const headRadius = 0.25;
const bodyWidth = 0.3;
const bodyHeight = 0.4;
gingerbreadShape.moveTo(-bodyWidth/2, bodyHeight);
gingerbreadShape.lineTo(-bodyWidth/2 - 0.2, bodyHeight - 0.1);
gingerbreadShape.lineTo(-bodyWidth/2 - 0.2, bodyHeight - 0.25);
gingerbreadShape.lineTo(-bodyWidth/2, 0);
gingerbreadShape.lineTo(-bodyWidth/2 - 0.1, -0.4);
gingerbreadShape.lineTo(0, -0.4);
gingerbreadShape.lineTo(bodyWidth/2 + 0.1, -0.4);
gingerbreadShape.lineTo(bodyWidth/2, 0);
gingerbreadShape.lineTo(bodyWidth/2 + 0.2, bodyHeight - 0.25);
gingerbreadShape.lineTo(bodyWidth/2 + 0.2, bodyHeight - 0.1);
gingerbreadShape.lineTo(bodyWidth/2, bodyHeight);
gingerbreadShape.absarc(0, bodyHeight + headRadius*0.8, headRadius, 0, Math.PI * 2);

const gingerbreadGeo = new THREE.ExtrudeGeometry(gingerbreadShape, {
  depth: 0.15,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.05,
  bevelSegments: 2
});
gingerbreadGeo.center();


// --- LUXURY MATERIALS ---
// Using MeshStandardMaterial with high metalness for that "shiny bauble" look
const goldMaterial = new THREE.MeshStandardMaterial({ 
  color: '#FDB931', // Richer gold
  metalness: 1.0, 
  roughness: 0.15, 
  envMapIntensity: 1.2,
  emissive: '#593a00',
  emissiveIntensity: 0.2
}); 

const greenMaterial = new THREE.MeshStandardMaterial({ 
  color: '#004225', // British Racing Green / Forest Green
  metalness: 0.9, 
  roughness: 0.2, 
  envMapIntensity: 1.0,
  emissive: '#001a05',
  emissiveIntensity: 0.2
}); 

const redMaterial = new THREE.MeshStandardMaterial({ 
  color: '#8a0303', // Deep Ruby
  metalness: 0.8, 
  roughness: 0.15, 
  envMapIntensity: 1.0,
  emissive: '#330000',
  emissiveIntensity: 0.3
}); 

const silverMaterial = new THREE.MeshStandardMaterial({ 
  color: '#E5E4E2', // Platinum
  metalness: 1.0, 
  roughness: 0.1, 
  envMapIntensity: 1.2 
});

const brownMaterial = new THREE.MeshStandardMaterial({ 
  color: '#8B4513', metalness: 0.1, roughness: 0.8 
});
const whiteFabricMaterial = new THREE.MeshStandardMaterial({ 
  color: '#FFFFFF', metalness: 0.0, roughness: 0.9 
});
const santaRedMaterial = new THREE.MeshStandardMaterial({
  color: '#D40000', metalness: 0.1, roughness: 0.4, emissive: '#990000', emissiveIntensity: 0.1
});
const photoFrameMaterial = new THREE.MeshStandardMaterial({
  color: '#FDB931', metalness: 1, roughness: 0.1
});
const photoBackingMaterial = new THREE.MeshStandardMaterial({
  color: '#000000', metalness: 0.8, roughness: 0.5
});


export const TreeParticles: React.FC<TreeParticlesProps> = ({ mode, photos }) => {
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Mesh>(null);
  const [focusedPhotoIndex, setFocusedPhotoIndex] = useState<number>(-1);

  // Initialize Particles
  const particles = useMemo(() => {
    const tempParticles: ParticleData[] = [];
    
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      // Spiral Formula
      const t = i / ORNAMENT_COUNT; 
      const y = (t * TREE_HEIGHT) - (TREE_HEIGHT / 2);
      const levelRadius = (1 - t) * TREE_RADIUS; 
      // Less depth variation for a smoother conical surface like the reference
      const r = levelRadius * (0.8 + Math.random() * 0.2); 
      const angle = i * 2.39996; 
      
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);

      // Determine Type - Increase probability of BOXES (Gifts) and SPHERES
      const typeRandom = Math.random();
      let meshType: ParticleData['meshType'] = 'sphere';
      
      if (typeRandom > 0.96) meshType = 'santaHat';
      else if (typeRandom > 0.93) meshType = 'gingerbread';
      else if (typeRandom > 0.88) meshType = 'giftBox';
      else if (typeRandom > 0.84) meshType = 'candyCane';
      else if (typeRandom > 0.50) meshType = 'box'; // Many cubes/boxes
      else if (typeRandom > 0.40) meshType = 'gem';
      else meshType = 'sphere'; // Balance of spheres

      // Determine Color - Gold/Silver/Green dominance
      const colorRandom = Math.random();
      let colorType = 'gold';
      if (colorRandom > 0.70) colorType = 'green';
      else if (colorRandom > 0.45) colorType = 'silver'; // Added Silver
      else if (colorRandom > 0.35) colorType = 'red'; // Less Red
      else colorType = 'gold'; // Most Gold

      const scatterPos = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );

      const focusPos = new THREE.Vector3(
         (Math.random() - 0.5) * 50,
         (Math.random() - 0.5) * 50,
         -15 - Math.random() * 30 
      );

      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      );

      // Scale tweak - Larger particles to fill gaps
      let scale = 0.25 + Math.random() * 0.35; // Bigger base size
      if (meshType === 'santaHat') scale *= 1.2;
      if (meshType === 'gingerbread') scale *= 1.2;
      if (meshType === 'giftBox') scale *= 1.1;
      if (meshType === 'box') scale *= 0.9; // Cubes fit nicely

      tempParticles.push({
        id: `ornament-${i}`,
        type: 'ornament',
        meshType,
        color: colorType,
        position: new THREE.Vector3(x, y, z),
        treePos: new THREE.Vector3(x, y, z),
        scatterPos,
        focusPos,
        rotation,
        scale,
      });
    }
    return tempParticles;
  }, []);

  // Merge Photo particles
  const allParticles = useMemo(() => {
    if (photos.length === 0) return particles;

    const photoParticles: ParticleData[] = photos.map((url, i) => {
      const t = (i + 1) / (photos.length + 1);
      const angle = t * Math.PI * 2 * 10; 
      const y = t * TREE_HEIGHT * 0.8 - (TREE_HEIGHT / 2) + 2; 
      const r = (1 - t) * (TREE_RADIUS + 1.2); 

      return {
        id: `photo-${i}`,
        type: 'photo',
        meshType: 'box',
        color: 'white',
        position: new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle)),
        treePos: new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle)),
        scatterPos: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          8 + (Math.random() - 0.5) * 5
        ),
        focusPos: new THREE.Vector3(0, 0, 4), 
        rotation: new THREE.Quaternion(),
        scale: 1, 
        imageUrl: url,
      };
    });

    return [...particles, ...photoParticles];
  }, [particles, photos]);

  useEffect(() => {
    if (mode === AppMode.FOCUS && photos.length > 0) {
      const idx = Math.floor(Math.random() * photos.length);
      setFocusedPhotoIndex(idx);
    } else {
      setFocusedPhotoIndex(-1);
    }
  }, [mode, photos]);
  
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.8;
    const innerRadius = 0.8;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2; 
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelSegments: 3
    });
    geo.center();
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (mode === AppMode.TREE) {
      groupRef.current.rotation.y += delta * 0.15;
    } else {
       easing.damp(groupRef.current.rotation, 'y', groupRef.current.rotation.y + delta * 0.05, 0.5, delta);
    }
    
    if (starRef.current) {
        starRef.current.rotation.y -= delta * 0.2; 
    }

    groupRef.current.children.forEach((child, index) => {
      if (index >= allParticles.length) return;

      const data = allParticles[index];
      if (!data) return;

      let targetPos = data.treePos;
      let targetScale = data.scale;
      let targetRot = data.rotation; 

      if (mode === AppMode.SCATTER) {
        targetPos = data.scatterPos;
        const time = state.clock.getElapsedTime();
        targetPos = targetPos.clone().add(new THREE.Vector3(
            Math.sin(time * 0.5 + index) * 0.5,
            Math.cos(time * 0.3 + index) * 0.5,
            Math.sin(time * 0.4 + index) * 0.5
        ));
        
        child.rotation.x += delta * 0.2;
        child.rotation.y += delta * 0.2;
        return; 
      } 
      
      if (mode === AppMode.FOCUS) {
        if (data.type === 'photo') {
           const photoIndex = parseInt(data.id.split('-')[1]);
           if (photoIndex === focusedPhotoIndex) {
             targetPos = data.focusPos;
             targetScale = 3; 
             const q = new THREE.Quaternion();
             q.setFromEuler(new THREE.Euler(0, -groupRef.current.rotation.y, 0)); 
             targetRot = q; 
           } else {
             targetPos = data.focusPos.clone().setZ(-20).add(new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, 0));
           }
        } else {
           targetPos = data.focusPos; 
        }
      }

      easing.damp3(child.position, targetPos, 0.6, delta);
      easing.dampQ(child.quaternion, targetRot, 0.6, delta);
      
      const currentScale = child.scale.x;
      const smoothScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 2);
      child.scale.setScalar(smoothScale);
      
      if (data.type === 'photo') {
         child.scale.set(smoothScale * 1.5, smoothScale, 0.1); 
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {allParticles.map((p) => (
        <ParticleMesh key={p.id} data={p} />
      ))}
      {/* Radiant Star - Bright White/Gold mix */}
      <mesh ref={starRef} position={[0, TREE_HEIGHT / 2 + 0.8, 0]} geometry={starGeometry}>
        <meshStandardMaterial color="#fffbe6" emissive="#fffbe6" emissiveIntensity={5} toneMapped={false} />
        <pointLight intensity={8} distance={30} color="#fffbe6" decay={1.5} />
      </mesh>
    </group>
  );
};

const ParticleMesh: React.FC<{ data: ParticleData }> = React.memo(({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    if (data.imageUrl) {
        return new THREE.TextureLoader().load(data.imageUrl);
    }
    return null;
  }, [data.imageUrl]);

  let material = goldMaterial;
  if (data.color === 'red') material = redMaterial;
  if (data.color === 'green') material = greenMaterial;
  if (data.color === 'silver') material = silverMaterial;

  if (data.type === 'photo') {
      return (
          <group ref={meshRef as any}>
              <mesh geometry={boxGeo} material={photoFrameMaterial} scale={[1.1, 1.1, 0.2]} />
              <mesh position={[0,0,-0.11]} geometry={boxGeo} material={photoBackingMaterial} scale={[1.05, 1.05, 0.05]} />
              <mesh position={[0, 0, 0.12]} scale={[0.95, 0.95, 1]}>
                  <planeGeometry />
                  {texture ? (
                      <meshBasicMaterial map={texture} toneMapped={false} />
                  ) : (
                      <meshStandardMaterial color="#111" />
                  )}
              </mesh>
          </group>
      )
  }

  if (data.meshType === 'gingerbread') {
    return <mesh ref={meshRef} geometry={gingerbreadGeo} material={brownMaterial} />;
  }

  if (data.meshType === 'santaHat') {
    return (
      <group ref={meshRef as any}>
         <mesh geometry={santaConeGeo} material={santaRedMaterial} />
         <mesh geometry={santaBrimGeo} material={whiteFabricMaterial} />
         <mesh geometry={santaPomGeo} material={whiteFabricMaterial} />
      </group>
    );
  }

  if (data.meshType === 'giftBox') {
    return (
      <group ref={meshRef as any}>
         <mesh geometry={boxGeo} material={material} />
         <mesh geometry={ribbonVGeo} material={goldMaterial} />
         <mesh geometry={ribbonHGeo} material={goldMaterial} />
      </group>
    )
  }

  if (data.meshType === 'candyCane') {
    return (
      <group ref={meshRef as any}>
         <mesh geometry={caneCylinderGeo} material={whiteFabricMaterial} />
         <mesh geometry={caneHookGeo} material={redMaterial} />
      </group>
    );
  }

  let geometry: THREE.BufferGeometry = sphereGeo;
  if (data.meshType === 'box') geometry = boxGeo;
  if (data.meshType === 'gem') geometry = gemGeo;

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={material}
    />
  );
}, (prev, next) => prev.data.id === next.data.id && prev.data.type === next.data.type);