/**
 * 3D Model Viewer Component
 * 
 * Renders true 3D models (GLB format) using React Three Fiber.
 * For concepts that require rotation to understand (5% of visuals).
 * 
 * Uses existing React Three Fiber setup.
 */

'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import * as THREE from 'three';

export interface Model3DViewerProps {
  taskId: number;
  modelUrl: string;
  concept: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isHighlighted?: boolean;
  onClick?: () => void;
}

/**
 * 3D Model Viewer
 */
export function Model3DViewer({
  taskId,
  modelUrl,
  concept,
  position,
  size,
  isHighlighted = false,
  onClick
}: Model3DViewerProps) {
  
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className="absolute bg-white rounded-lg shadow-lg overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        border: isHighlighted ? '3px solid #6366F1' : '1px solid #E5E7EB',
        zIndex: isHighlighted ? 6 : 5,
        pointerEvents: 'none'
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: isHighlighted ? 1.05 : 1 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      data-visual-id={`visual-${taskId}`}
    >
      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50">
          <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
          <p className="text-sm text-red-600">Failed to load 3D model</p>
          <p className="text-xs text-red-400 mt-1">{concept}</p>
        </div>
      ) : (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: '#F9FAFB' }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} />
            <spotLight position={[-10, -10, -10]} angle={0.3} penumbra={1} intensity={0.5} />
            
            {/* Environment for reflections */}
            <Environment preset="studio" />
            
            {/* The 3D Model */}
            <Model3DObject 
              url={modelUrl}
              onError={() => setHasError(true)}
              isHighlighted={isHighlighted}
            />
            
            {/* Orbit controls for user interaction */}
            <OrbitControls
              enableZoom
              enablePan
              enableRotate
              autoRotate={!isHovered}
              autoRotateSpeed={2}
              minDistance={2}
              maxDistance={10}
            />
          </Suspense>
        </Canvas>
      )}
      
      {/* Controls hint */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-2 left-2 right-2 bg-black/75 text-white px-3 py-1.5 rounded text-xs text-center"
        >
          🖱️ Drag to rotate • Scroll to zoom
        </motion.div>
      )}
      
      {/* Concept label */}
      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-700">
        {concept}
      </div>
    </motion.div>
  );
}

/**
 * 3D Model Object Loader
 */
function Model3DObject({
  url,
  onError,
  isHighlighted
}: {
  url: string;
  onError: () => void;
  isHighlighted: boolean;
}) {
  
  const meshRef = useRef<THREE.Group>(null);
  
  const gltf = useLoader(GLTFLoader, url);

  useFrame((_, delta) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  try {
    return (
      <group ref={meshRef}>
        <primitive object={gltf.scene} scale={1} />
      </group>
    );
  } catch {
    onError();
    return null;
  }
}

export default Model3DViewer;

