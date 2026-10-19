import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export type HubMove = 'idle' | 'wave' | 'think' | 'celebrate' | 'quiet';
function Character({ move, color, eyes }: { move: HubMove; color: string; eyes: string }) {
  const body = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const eyeGroup = useRef<THREE.Group>(null);
  const leftPosition = new THREE.Vector3(-1.08, -0.2, 0.25);
  const rightPosition = new THREE.Vector3(1.08, -0.2, 0.25);
  useFrame(({ clock, pointer }, delta) => {
    const t = clock.getElapsedTime();
    const blend = 1 - Math.exp(-delta * 8);
    let bodyY = 0;
    let bodyRotationZ = 0;
    let leftRotationZ = 0;
    let rightRotationZ = 0;

    leftPosition.set(-1.08, -0.2, 0.25);
    rightPosition.set(1.08, -0.2, 0.25);
    if (move === 'idle') {
      bodyY = Math.sin(t * 2) * 0.08;
      leftPosition.y = -0.2 + Math.sin(t * 2 - 0.5) * 0.05;
      rightPosition.y = leftPosition.y;
    } else if (move === 'wave') {
      bodyY = Math.sin(t * 2) * 0.06;
      leftPosition.set(-1.02, 0.45 + Math.sin(t * 8) * 0.05, 0.35);
      leftRotationZ = Math.sin(t * 9) * 0.6;
    } else if (move === 'think') {
      bodyY = Math.sin(t * 1.5) * 0.04;
      bodyRotationZ = 0.12;
      leftPosition.set(-0.68, -0.15 + Math.sin(t * 6) * 0.03, 0.65);
      rightPosition.set(0.95, -0.3, 0.2);
    } else if (move === 'celebrate') {
      bodyY = Math.abs(Math.sin(t * 6)) * 0.3;
      bodyRotationZ = Math.sin(t * 8) * 0.18;
      const handY = 0.55 + Math.sin(t * 12) * 0.08;
      leftPosition.set(-0.85, handY, 0.25);
      rightPosition.set(0.85, handY, 0.25);
      leftRotationZ = 0.6;
      rightRotationZ = -0.6;
    }

    if (body.current) {
      body.current.position.y = THREE.MathUtils.damp(body.current.position.y, bodyY, 8, delta);
      body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, bodyRotationZ, 8, delta);
      body.current.rotation.y = THREE.MathUtils.damp(body.current.rotation.y, pointer.x * 0.18, 8, delta);
    }
    if (leftArm.current) {
      leftArm.current.position.lerp(leftPosition, blend);
      leftArm.current.rotation.z = THREE.MathUtils.damp(leftArm.current.rotation.z, leftRotationZ, 8, delta);
    }
    if (rightArm.current) {
      rightArm.current.position.lerp(rightPosition, blend);
      rightArm.current.rotation.z = THREE.MathUtils.damp(rightArm.current.rotation.z, rightRotationZ, 8, delta);
    }
    if (eyeGroup.current) {
      const blink = move !== 'quiet' && Math.sin(t * 1.15) > 0.994;
      const squint = move === 'think' ? 0.68 : 1;
      eyeGroup.current.scale.y = THREE.MathUtils.damp(eyeGroup.current.scale.y, blink ? 0.12 : squint, 14, delta);
      eyeGroup.current.position.x = THREE.MathUtils.damp(eyeGroup.current.position.x, pointer.x * 0.04, 8, delta);
    }
  });
  return <group ref={body} rotation={[0, -0.08, 0]}>
    <mesh><sphereGeometry args={[0.84, 64, 64]} /><meshPhysicalMaterial color={color} roughness={0.19} metalness={0.18} clearcoat={1} clearcoatRoughness={0.1} sheen={1} sheenColor={color} /></mesh>
    <group ref={eyeGroup} position={[0, 0.06, 0.77]}>
      {[-0.23, 0.23].map(x => <mesh key={x} position={[x, 0, 0]} scale={[0.075, 0.15, 0.065]}><sphereGeometry args={[1, 24, 24]} /><meshBasicMaterial color={eyes} /></mesh>)}
    </group>
    <mesh ref={leftArm} position={[-1.08, -0.2, 0.25]} scale={[0.2, 0.26, 0.18]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.12} roughness={0.24} metalness={0.08} clearcoat={1} clearcoatRoughness={0.08} sheen={0.8} sheenColor={color} />
    </mesh>
    <mesh ref={rightArm} position={[1.08, -0.2, 0.25]} scale={[0.2, 0.26, 0.18]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.12} roughness={0.24} metalness={0.08} clearcoat={1} clearcoatRoughness={0.08} sheen={0.8} sheenColor={color} />
    </mesh>
  </group>;
}
export default function HubScene({ move = 'idle', color, eyes, reduced }: { move?: HubMove; color: string; eyes: string; reduced: boolean }) {
  return <Canvas camera={{ position: [0, 0, 3.8], fov: 39 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }} aria-hidden="true">
    <ambientLight intensity={1.6} /><directionalLight position={[-3, 4, 5]} intensity={4} /><pointLight position={[3, -1, 2]} intensity={12} color={color} /><directionalLight position={[1, 3, -2]} intensity={3} />
    <Character move={reduced ? 'quiet' : move} color={color} eyes={eyes} />
  </Canvas>;
}