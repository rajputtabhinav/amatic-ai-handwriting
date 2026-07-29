/**
 * Text Overlay Layer
 * 
 * Dedicated layer for text elements that renders above all visuals.
 * Supports 8-45% adaptive text coverage with highlighting during narration.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { TextElement } from '@/types/master-plan';
import { useState, useEffect } from 'react';
import React from 'react';

export interface TextOverlayLayerProps {
  textElements: TextElement[];
  highlightedIds: string[];
  onTextClick?: (id: string) => void;
}

export function TextOverlayLayer({
  textElements,
  highlightedIds,
  onTextClick
}: TextOverlayLayerProps) {
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 30 }}
    >
      <AnimatePresence>
        {textElements.map(element => (
          <TextElementRenderer
            key={element.id}
            element={element}
            isHighlighted={highlightedIds.includes(element.id)}
            onClick={() => onTextClick?.(element.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual text element renderer
 */
function TextElementRenderer({
  element,
  isHighlighted,
  onClick
}: {
  element: TextElement;
  isHighlighted: boolean;
  onClick?: () => void;
}) {
  
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine styling based on type
  const getStyles = () => {
    const base = {
      ...element.style,
      userSelect: 'none' as const,
      pointerEvents: onClick ? 'auto' as const : 'none' as const,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease'
    };
    
    // Type-specific styles
    switch (element.type) {
      case 'title':
        return {
          ...base,
          fontSize: element.style.fontSize || 32,
          fontWeight: element.style.fontWeight || 'bold',
          textAlign: 'center' as const,
          color: isHighlighted ? '#6366F1' : element.style.color
        };
      
      case 'equation':
        return {
          ...base,
          fontSize: element.style.fontSize || 24,
          fontFamily: 'math, serif',
          backgroundColor: isHighlighted ? '#FEF3C7' : 'rgba(255, 255, 255, 0.95)',
          padding: '12px 20px',
          borderRadius: '8px',
          border: isHighlighted ? '2px solid #F59E0B' : '1px solid #E5E7EB',
          boxShadow: isHighlighted ? '0 4px 20px rgba(245, 158, 11, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.1)'
        };
      
      case 'definition':
        return {
          ...base,
          fontSize: element.style.fontSize || 14,
          backgroundColor: isHighlighted ? '#DBEAFE' : 'rgba(255, 255, 255, 0.9)',
          padding: '10px 15px',
          borderRadius: '6px',
          border: isHighlighted ? '2px solid #3B82F6' : '1px solid #E5E7EB',
          lineHeight: '1.6'
        };
      
      case 'label':
        return {
          ...base,
          fontSize: element.style.fontSize || 14,
          fontWeight: isHighlighted ? '700' : element.style.fontWeight || '600',
          color: isHighlighted ? '#8B5CF6' : element.style.color,
          textShadow: isHighlighted ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none'
        };
      
      case 'quote':
        return {
          ...base,
          fontSize: element.style.fontSize || 16,
          fontStyle: 'italic',
          backgroundColor: isHighlighted ? '#FEE2E2' : 'rgba(255, 255, 255, 0.9)',
          padding: '12px 18px',
          borderLeft: isHighlighted ? '4px solid #EF4444' : '4px solid #E5E7EB',
          borderRadius: '0 6px 6px 0'
        };
      
      default:
        return base;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: isHighlighted ? 1.05 : 1,
        y: isHighlighted ? -2 : 0
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        minHeight: element.size.height,
        ...getStyles()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {element.isLatex ? (
        <LaTeXRenderer content={element.content} />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: element.content }} />
      )}
      
      {/* Highlight pulse effect */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * LaTeX Renderer (placeholder - will be enhanced with KaTeX)
 */
function LaTeXRenderer({ content }: { content: string }) {
  // For now, render as styled text
  // TODO: Integrate KaTeX in latex-support todo
  return (
    <div style={{ fontFamily: 'math, serif', fontSize: '1.2em' }}>
      {content}
    </div>
  );
}

export default TextOverlayLayer;

