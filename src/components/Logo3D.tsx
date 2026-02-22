import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const LogoMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture("/solarizer-logo.png");

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.008;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2.5, 2.5, 0.35]} />
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.5}
        emissive="#F97316"
        emissiveIntensity={0.5}
        roughness={0.15}
        metalness={0.7}
      />
    </mesh>
  );
};

const Logo3D = ({ className }: { className?: string }) => (
  <div className={className}>
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[3, 3, 3]} intensity={1.8} color="#F97316" />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#ffffff" />
      <pointLight position={[0, 0, -3]} intensity={0.6} color="#F97316" />
      <LogoMesh />
    </Canvas>
  </div>
);

export default Logo3D;
