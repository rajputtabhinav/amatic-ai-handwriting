"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import {
  getPortal,
  destroyPortal,
  getRoomIdFromUrl,
  getKeyFromUrlHash,
  WS_SUBTYPES,
  toSyncableElement,
  reconcileSceneUpdate,
  COLLAB_CONSTANTS,
  type SocketId,
  type SyncableElement,
  type SocketUpdateDataSource,
} from '@/lib/collab';

interface UseCollaborationOptions {
  onJoinRoom?: () => void;
  onLeaveRoom?: () => void;
}

/**
 * Hook for managing collaboration state and connection
 */
export function useCollaboration(options: UseCollaborationOptions = {}) {
  const {
    elements,
    isCollaborating,
    roomId,
    username,
    startCollaboration,
    stopCollaboration,
    syncElements,
    updateCollaborator,
    removeCollaborator,
    setCollabError,
    setUserIdleState,
  } = useCanvasStore();
  
  const lastBroadcastTimeRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  
  const portal = getPortal();
  
  /**
   * Handle scene initialization (full sync on join)
   */
  const handleSceneInit = useCallback((data: SocketUpdateDataSource[WS_SUBTYPES.INIT]) => {
    const { elements: remoteElements } = data.payload;
    
    // Full sync - replace local elements
    syncElements(remoteElements);
    
    // logger.debug('[Collab] Scene initialized with', remoteElements.length, 'elements');
  }, [syncElements]);
  
  /**
   * Handle scene update (incremental)
   */
  const handleSceneUpdate = useCallback((data: SocketUpdateDataSource[WS_SUBTYPES.UPDATE]) => {
    const { elements: remoteElements } = data.payload;
    
    // Get current elements as syncable
    const localElements = elements.map(toSyncableElement);
    
    // Reconcile changes
    const { elements: reconciled, changed } = reconcileSceneUpdate(
      localElements,
      remoteElements
    );
    
    if (changed) {
      syncElements(reconciled);
      // logger.debug('[Collab] Scene updated with', remoteElements.length, 'changes');
    }
  }, [elements, syncElements]);
  
  /**
   * Handle mouse location updates
   */
  const handleMouseLocation = useCallback((data: SocketUpdateDataSource[WS_SUBTYPES.MOUSE_LOCATION]) => {
    const { socketId, pointer, button, username, selectedElementIds } = data.payload;
    
    updateCollaborator(socketId, {
      pointer,
      button,
      username,
      selectedElementIds,
      userState: 'active',
    });
  }, [updateCollaborator]);
  
  /**
   * Handle idle status updates
   */
  const handleIdleStatus = useCallback((data: SocketUpdateDataSource[WS_SUBTYPES.IDLE_STATUS]) => {
    const { socketId, userState, username } = data.payload;
    
    updateCollaborator(socketId, {
      userState,
      username,
    });
  }, [updateCollaborator]);
  
  /**
   * Handle user join
   */
  const handleUserJoin = useCallback((socketId: SocketId) => {
    updateCollaborator(socketId, {
      id: socketId,
      username: '',
      userState: 'active',
    });
    
    // Send current scene to new user
    if (elements.length > 0) {
      const syncable = elements.map(toSyncableElement);
      portal.broadcastScene(WS_SUBTYPES.INIT, syncable, true);
    }
  }, [elements, updateCollaborator]);
  
  /**
   * Handle user leave
   */
  const handleUserLeave = useCallback((socketId: SocketId) => {
    removeCollaborator(socketId);
  }, [removeCollaborator]);
  
  /**
   * Handle connection error
   */
  const handleConnectionError = useCallback((error: Error) => {
    setCollabError(error.message);
    console.error('[Collab] Connection error:', error);
  }, [setCollabError]);
  
  /**
   * Connect to room from URL
   */
  const connectFromUrl = useCallback(async () => {
    const urlRoomId = getRoomIdFromUrl();
    const urlRoomKey = getKeyFromUrlHash();
    
    if (urlRoomId && urlRoomKey) {
      // Validate room exists
      try {
        const response = await fetch(`/api/collab?room=${urlRoomId}`);
        const data = await response.json();
        
        if (!data.success && data.code === 'ROOM_EXPIRED') {
          setCollabError('This collaboration link has expired');
          return false;
        }
        
        // Start collaboration
        startCollaboration(urlRoomId, urlRoomKey);
        
        // Connect portal
        await portal.open({
          roomId: urlRoomId,
          roomKey: urlRoomKey,
          username: username || 'Anonymous',
          onSceneInit: handleSceneInit,
          onSceneUpdate: handleSceneUpdate,
          onMouseLocation: handleMouseLocation,
          onIdleStatus: handleIdleStatus,
          onUserJoin: handleUserJoin,
          onUserLeave: handleUserLeave,
          onConnectionError: handleConnectionError,
        });
        
        options.onJoinRoom?.();
        return true;
      } catch (error) {
        console.error('[Collab] Failed to connect:', error);
        setCollabError('Failed to join collaboration room');
        return false;
      }
    }
    
    return false;
  }, [
    username,
    startCollaboration,
    setCollabError,
    handleSceneInit,
    handleSceneUpdate,
    handleMouseLocation,
    handleIdleStatus,
    handleUserJoin,
    handleUserLeave,
    handleConnectionError,
    options,
  ]);
  
  /**
   * Broadcast element changes
   */
  const broadcastElements = useCallback((changedElements: SyncableElement[]) => {
    if (!isCollaborating || !portal.isOpen()) return;
    
    // Throttle broadcasts
    const now = Date.now();
    if (now - lastBroadcastTimeRef.current < 50) return;
    lastBroadcastTimeRef.current = now;
    
    portal.broadcastScene(WS_SUBTYPES.UPDATE, changedElements, false);
  }, [isCollaborating]);
  
  /**
   * Broadcast mouse position
   */
  const broadcastMouse = useCallback((
    pointer: { x: number; y: number },
    button: 'up' | 'down' = 'up',
    selectedElementIds: Record<string, boolean> = {}
  ) => {
    if (!isCollaborating || !portal.isOpen()) return;
    
    portal.broadcastMouseLocation({
      pointer,
      button,
      selectedElementIds,
    });
  }, [isCollaborating]);
  
  /**
   * Track user activity for idle detection
   */
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Reset idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    setUserIdleState('active');
    
    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      setUserIdleState('idle');
      portal.broadcastIdleChange('idle');
      
      // Set away after longer period
      idleTimerRef.current = setTimeout(() => {
        setUserIdleState('away');
        portal.broadcastIdleChange('away');
      }, COLLAB_CONSTANTS.IDLE_THRESHOLD);
    }, COLLAB_CONSTANTS.ACTIVE_THRESHOLD);
  }, [setUserIdleState]);
  
  /**
   * Disconnect from collaboration
   */
  const disconnect = useCallback(() => {
    destroyPortal();
    stopCollaboration();
    options.onLeaveRoom?.();
  }, [stopCollaboration, options]);
  
  // Check for room in URL on mount
  useEffect(() => {
    connectFromUrl();
    
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);
  
  // Broadcast element changes when elements update
  useEffect(() => {
    if (isCollaborating && elements.length > 0) {
      const syncable = elements.map(toSyncableElement);
      broadcastElements(syncable);
    }
  }, [elements, isCollaborating, broadcastElements]);
  
  return {
    isCollaborating,
    roomId,
    collaboratorCount: useCanvasStore.getState().collaborators.size,
    connectFromUrl,
    disconnect,
    broadcastElements,
    broadcastMouse,
    trackActivity,
  };
}

export default useCollaboration;

