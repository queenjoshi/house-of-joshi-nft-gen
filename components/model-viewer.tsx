'use client';

import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<any>(null);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = 0;
    }
  }, [url]);

  return (
    <primitive ref={modelRef} object={scene} scale={1.5} />
  );
}

interface ModelViewerProps {
  url: string;
  className?: string;
}

export function ModelViewer({ url, className }: ModelViewerProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5] }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <OrbitControls enableZoom={false} />
        <Model url={url} />
      </Canvas>
    </div>
  );
}
