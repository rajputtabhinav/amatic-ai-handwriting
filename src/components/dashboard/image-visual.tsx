/**
 * Image Visual Component
 * 
 * Simple, reliable display of generated images (2D or 3D-style).
 * No compilation, no errors - just works!
 * 
 * Supports:
 * - Nano Banana standard images (85%)
 * - Nano Banana 3D-figurine images (10%)
 * - DALL-E 3 hero images (3%)
 * - Highlight effects during narration
 */

'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export interface ImageVisualProps {
  taskId: number;
  imageUrl: string;
  concept: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isHighlighted?: boolean;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Image Visual Component
 */
export function ImageVisual({
  taskId,
  imageUrl,
  concept,
  position,
  size,
  isHighlighted = false,
  onClick,
  onLoad,
  onError
}: ImageVisualProps) {
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error(`Failed to load image: ${imageUrl}`));
  };
  
  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: onClick ? 'pointer' : 'default',
        zIndex: isHighlighted ? 6 : 5,
        pointerEvents: 'none'
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: isHighlighted ? 1.05 : isHovered ? 1.02 : 1,
        y: 0
      }}
      transition={{ duration: 0.5, type: 'spring' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      data-visual-id={`visual-${taskId}`}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 rounded-lg border-2 border-red-200">
          <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
          <p className="text-sm text-red-600 text-center px-4">
            Failed to load image
          </p>
          <p className="text-xs text-red-400 mt-1">{concept}</p>
        </div>
      )}
      
      {/* Actual image */}
      {!hasError && (
        <motion.img
          src={imageUrl}
          alt={concept}
          className="w-full h-full object-contain rounded-lg"
          style={{
            filter: isHighlighted 
              ? 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.8)) brightness(1.1)'
              : isHovered
              ? 'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.2))'
              : 'none',
            transition: 'filter 0.3s ease'
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      
      {/* Highlight pulse effect */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            border: '3px solid rgba(99, 102, 241, 0.6)',
            boxShadow: 'inset 0 0 30px rgba(99, 102, 241, 0.2)'
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.02, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Concept label on hover */}
      {isHovered && !isHighlighted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 left-2 right-2 bg-black/75 text-white px-3 py-1.5 rounded text-sm font-medium text-center"
        >
          {concept}
        </motion.div>
      )}
    </motion.div>
  );
}

export default ImageVisual;

