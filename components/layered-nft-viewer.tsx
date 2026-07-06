'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';

interface Layer {
  id: string;
  url: string;
  zIndex: number;
}

interface LayeredNFTViewerProps {
  layers: Layer[];
  className?: string;
}

function LayeredArt({ layers }: { layers: Layer[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      // Parallax effect based on mouse position
      const targetX = (mousePos.x / window.innerWidth) * 2 - 1;
      const targetY = -(mousePos.y / window.innerHeight) * 2 + 1;
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetX * 0.1,
        0.1
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetY * 0.1,
        0.1
      );
    }
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer) => (
        <Image
          key={layer.id}
          url={layer.url}
          position={[0, 0, layer.zIndex * 0.1]}
          transparent
          scale={[3, 3]}
        />
      ))}
    </group>
  );
}

export default function LayeredNFTViewer({ layers, className }: LayeredNFTViewerProps) {
  if (!layers || layers.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-royal-500/10 rounded-lg ${className}`}>
        <p className="text-muted-foreground">No layers to display</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <LayeredArt layers={layers} />
      </Canvas>
    </div>
  );
}
