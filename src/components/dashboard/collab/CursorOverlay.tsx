"use client";

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/stores/canvas-store';
import type { Collaborator, SocketId } from '@/lib/collab/types';
import { COLLABORATOR_COLORS } from '@/lib/collab/types';

interface CursorOverlayProps {
  scale?: number;
  offset?: { x: number; y: number };
}

/**
 * Renders remote collaborator cursors on the canvas
 */
export function CursorOverlay({ scale = 1, offset = { x: 0, y: 0 } }: CursorOverlayProps) {
  const { collaborators, isCollaborating } = useCanvasStore();
  
  // Convert Map to array for rendering
  const collaboratorList = useMemo(() => {
    return Array.from(collaborators.values()).filter(
      (c): c is Collaborator & { pointer: NonNullable<Collaborator['pointer']> } => 
        !!c.pointer && !c.isCurrentUser
    );
  }, [collaborators]);
  
  if (!isCollaborating || collaboratorList.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden z-20"
      style={{ 
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        transformOrigin: '0 0'
      }}
    >
      <AnimatePresence>
        {collaboratorList.map((collaborator) => (
          <CollaboratorCursor
            key={collaborator.id}
            collaborator={collaborator}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual cursor component
 */
function CollaboratorCursor({ 
  collaborator 
}: { 
  collaborator: Collaborator & { pointer: NonNullable<Collaborator['pointer']> }
}) {
  const { pointer, username, color, button, userState } = collaborator;
  
  // Get color based on socket ID hash
  const cursorColor = color || getColorForId(collaborator.id);
  
  // Fade out if idle or away
  const opacity = userState === 'away' ? 0.3 : userState === 'idle' ? 0.6 : 1;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity,
        scale: 1,
        x: pointer.x,
        y: pointer.y,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 25,
        mass: 0.5,
      }}
      className="absolute top-0 left-0"
      style={{ 
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
        style={{
          filter: `drop-shadow(0 2px 4px ${cursorColor.stroke}40)`,
        }}
      >
        <path
          d="M5.65376 12.4563L0.161655 1.03131C-0.188981 0.333119 0.559649 -0.37803 1.22457 0.237608L22.0446 17.8393C22.6699 18.4192 22.3439 19.4392 21.5141 19.5893L12.2426 21.1763C11.8287 21.2498 11.4818 21.532 11.3246 21.9276L7.88979 30.8359C7.60608 31.5557 6.58638 31.575 6.27666 30.8648L1.09374 19.0173"
          fill={cursorColor.background}
          stroke={cursorColor.stroke}
          strokeWidth="1.5"
        />
        {/* Draw indicator when button is down */}
        {button === 'down' && (
          <circle
            cx="12"
            cy="30"
            r="4"
            fill={cursorColor.stroke}
            className="animate-pulse"
          />
        )}
      </svg>
      
      {/* Username label */}
      <div
        className="absolute left-5 top-5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-sm"
        style={{
          backgroundColor: cursorColor.background,
          color: cursorColor.stroke,
          border: `1px solid ${cursorColor.stroke}`,
        }}
      >
        {username || 'Anonymous'}
      </div>
    </motion.div>
  );
}

/**
 * Get a consistent color for a socket ID
 */
function getColorForId(socketId: SocketId): typeof COLLABORATOR_COLORS[0] {
  // Simple hash function to get consistent index
  let hash = 0;
  for (let i = 0; i < socketId.length; i++) {
    const char = socketId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
}

export default CursorOverlay;

