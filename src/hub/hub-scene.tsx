import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export type HubMove = "idle" | "wave" | "think" | "celebrate" | "quiet";
function Character({ move, color, eyes }: { move: HubMove; color: string; eyes: string }) {
  const body = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Mesh>(null);
  const eyeGroup = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (body.current) {
      body.current.position.y = move === "quiet" ? 0 : Math.sin(t * 1.8) * 0.09;
      body.current.rotation.z =
        move === "celebrate" ? Math.sin(t * 7) * 0.25 : Math.sin(t * 1.4) * 0.035;
      body.current.rotation.y = pointer.x * 0.18;
    }
    if (arm.current)
      arm.current.rotation.z =
        move === "wave" ? -0.8 + Math.sin(t * 9) * 0.35 : move === "think" ? -0.8 : 0.3;
    if (eyeGroup.current) {
      const blink = Math.sin(t * 1.15) > 0.994;
      eyeGroup.current.scale.y = blink ? 0.12 : 1;
      eyeGroup.current.position.x = pointer.x * 0.04;
    }
  });
  return (
    <group ref={body} rotation={[0, -0.08, 0]}>
      <mesh>
        <sphereGeometry args={[0.84, 64, 64]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.19}
          metalness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.1}
          sheen={1}
          sheenColor={color}
        />
      </mesh>
      <group ref={eyeGroup} position={[0, 0.06, 0.77]}>
        {[-0.23, 0.23].map((x) => (
          <mesh key={x} position={[x, 0, 0]} scale={[0.075, move === "think" ? 0.09 : 0.15, 0.065]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial color={eyes} />
          </mesh>
        ))}
      </group>
      {move !== "quiet" && (
        <>
          <mesh
            ref={arm}
            position={[-0.78, move === "wave" ? 0.26 : -0.19, 0.12]}
            scale={[0.15, 0.31, 0.16]}
          >
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} />
          </mesh>
          <mesh position={[0.79, -0.24, 0.1]} rotation={[0, 0, -0.4]} scale={[0.14, 0.24, 0.16]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} />
          </mesh>
        </>
      )}
    </group>
  );
}
export default function HubScene({
  move = "idle",
  color,
  eyes,
  reduced,
}: {
  move?: HubMove;
  color: string;
  eyes: string;
  reduced: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.8], fov: 39 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      aria-hidden="true"
    >
      <ambientLight intensity={1.6} />
      <directionalLight position={[-3, 4, 5]} intensity={4} />
      <pointLight position={[3, -1, 2]} intensity={12} color={color} />
      <directionalLight position={[1, 3, -2]} intensity={3} />
      <Character move={reduced ? "quiet" : move} color={color} eyes={eyes} />
    </Canvas>
  );
}
