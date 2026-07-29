"use client";

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Moon } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas-store';
import type { Collaborator, SocketId, UserIdleState } from '@/lib/collab/types';
import { COLLABORATOR_COLORS } from '@/lib/collab/types';

interface UserListProps {
  className?: string;
  compact?: boolean;
}

/**
 * Display list of collaborators in the session
 */
export function UserList({ className, compact = false }: UserListProps) {
  const { collaborators, isCollaborating, username } = useCanvasStore();
  
  // Build list including current user
  const users = useMemo(() => {
    const list: (Collaborator & { isCurrentUser?: boolean })[] = [];
    
    // Add current user first
    list.push({
      id: 'current-user' as SocketId,
      username: username || 'You',
      userState: 'active',
      isCurrentUser: true,
    });
    
    // Add collaborators
    collaborators.forEach((collab) => {
      if (!collab.isCurrentUser) {
        list.push(collab);
      }
    });
    
    return list;
  }, [collaborators, username]);
  
  if (!isCollaborating) {
    return null;
  }
  
  if (compact) {
    return <CompactUserList users={users} className={className} />;
  }
  
  return <FullUserList users={users} className={className} />;
}

/**
 * Compact avatar stack view
 */
function CompactUserList({ 
  users, 
  className 
}: { 
  users: (Collaborator & { isCurrentUser?: boolean })[];
  className?: string;
}) {
  const maxVisible = 3;
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = Math.max(0, users.length - maxVisible);
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-1.5">
        <AnimatePresence mode="popLayout">
          {visibleUsers.map((user, index) => (
            <UserAvatar
              key={user.id}
              user={user}
              index={index}
              size="xs"
            />
          ))}
        </AnimatePresence>
        
        {hiddenCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-0 flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 border border-white text-[10px] font-medium text-gray-600"
          >
            +{hiddenCount}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Full list view with names
 */
function FullUserList({ 
  users, 
  className 
}: { 
  users: (Collaborator & { isCurrentUser?: boolean })[];
  className?: string;
}) {
  return (
    <div className={`space-y-0.5 ${className}`}>
      <div className="text-[10px] font-medium text-gray-400 px-1.5 pb-0.5">
        {users.length} online
      </div>
      
      <div className="space-y-0">
        <AnimatePresence mode="popLayout">
          {users.map((user, index) => (
            <UserListItem
              key={user.id}
              user={user}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Individual user avatar
 */
function UserAvatar({ 
  user, 
  index,
  size = 'md'
}: { 
  user: Collaborator & { isCurrentUser?: boolean };
  index: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const color = user.color || getColorForId(user.id);
  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: -5 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.5, x: -5 }}
      transition={{ delay: index * 0.03 }}
      style={{ zIndex: 10 - index }}
      className="relative"
    >
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium border border-white shadow-sm`}
        style={{
          backgroundColor: color.background,
          color: color.stroke,
        }}
        title={user.username || 'Anonymous'}
      >
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.username || 'User'} 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(user.username || 'A')
        )}
      </div>
      
      {/* Status indicator - only show on larger sizes */}
      {(size === 'md' || size === 'lg') && <StatusDot state={user.userState} size={size} />}
      
      {/* Current user indicator */}
      {user.isCurrentUser && size !== 'xs' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-white" />
      )}
    </motion.div>
  );
}

/**
 * User list item with full info
 */
function UserListItem({ 
  user, 
  index 
}: { 
  user: Collaborator & { isCurrentUser?: boolean };
  index: number;
}) {
  const color = user.color || getColorForId(user.id);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-gray-50 transition-colors"
    >
      {/* Avatar */}
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium flex-shrink-0"
        style={{
          backgroundColor: color.background,
          color: color.stroke,
        }}
      >
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.username || 'User'} 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(user.username || 'A')
        )}
      </div>
      
      {/* Name & status */}
      <div className="flex-1 min-w-0 flex items-center gap-1">
        <span className="text-[11px] font-medium text-gray-700 truncate">
          {user.username || 'Anon'}
        </span>
        {user.isCurrentUser && (
          <span className="text-[9px] text-gray-400">(you)</span>
        )}
        <StatusIcon state={user.userState} />
      </div>
    </motion.div>
  );
}

/**
 * Status indicator dot
 */
function StatusDot({ state, size = 'md' }: { state?: UserIdleState; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const colors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    away: 'bg-gray-400',
  };
  
  const dotSize = size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';
  
  return (
    <div 
      className={`absolute -bottom-0.5 -right-0.5 ${dotSize} rounded-full border border-white ${colors[state || 'active']}`}
    />
  );
}

/**
 * Status icon
 */
function StatusIcon({ state }: { state?: UserIdleState }) {
  switch (state) {
    case 'active':
      return <Wifi className="w-2.5 h-2.5 text-green-500" />;
    case 'idle':
      return <Moon className="w-2.5 h-2.5 text-yellow-500" />;
    case 'away':
      return <WifiOff className="w-2.5 h-2.5 text-gray-400" />;
    default:
      return <Wifi className="w-2.5 h-2.5 text-green-500" />;
  }
}

/**
 * Get status text - exported for potential use in other components
 */
export function getStatusText(state?: UserIdleState): string {
  switch (state) {
    case 'active': return 'Active';
    case 'idle': return 'Idle';
    case 'away': return 'Away';
    default: return 'Active';
  }
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get a consistent color for a socket ID
 */
function getColorForId(socketId: SocketId): typeof COLLABORATOR_COLORS[0] {
  let hash = 0;
  for (let i = 0; i < socketId.length; i++) {
    const char = socketId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
}

export default UserList;

