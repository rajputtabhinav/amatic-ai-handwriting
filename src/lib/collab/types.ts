/**
 * Real-time Collaboration Types
 * Type definitions for collaborative canvas editing
 */

import type { CanvasElement } from '@/stores/canvas-store';

// ============================================
// Socket & Connection Types
// ============================================

export type SocketId = string & { _brand: 'SocketId' };

export interface CollaboratorPointer {
  x: number;
  y: number;
}

export type UserIdleState = 'active' | 'idle' | 'away';

export interface Collaborator {
  id: SocketId;
  username: string;
  pointer?: CollaboratorPointer;
  button?: 'up' | 'down';
  selectedElementIds?: Record<string, boolean>;
  userState?: UserIdleState;
  color?: CollaboratorColor;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

export interface CollaboratorColor {
  background: string;
  stroke: string;
}

// Predefined colors for collaborators
export const COLLABORATOR_COLORS: CollaboratorColor[] = [
  { background: '#FF6B6B', stroke: '#E63946' },
  { background: '#4ECDC4', stroke: '#1A936F' },
  { background: '#FFE66D', stroke: '#F4A261' },
  { background: '#95E1D3', stroke: '#38A3A5' },
  { background: '#DDA0DD', stroke: '#9B59B6' },
  { background: '#98D8C8', stroke: '#16A085' },
  { background: '#F7DC6F', stroke: '#F39C12' },
  { background: '#85C1E9', stroke: '#2980B9' },
  { background: '#F1948A', stroke: '#E74C3C' },
  { background: '#BB8FCE', stroke: '#8E44AD' },
  { background: '#7DCEA0', stroke: '#27AE60' },
  { background: '#F8B500', stroke: '#D68910' },
  { background: '#5DADE2', stroke: '#2E86AB' },
  { background: '#EB984E', stroke: '#CA6F1E' },
  { background: '#A3E4D7', stroke: '#1ABC9C' },
  { background: '#D7BDE2', stroke: '#7D3C98' },
];

// ============================================
// Room & Session Types
// ============================================

export interface RoomData {
  roomId: string;
  roomKey: string; // Encryption key (stored in URL hash, never sent to server)
}

export interface RoomUser {
  odId: SocketId;
  username: string;
  joinedAt: number;
}

export interface CollabState {
  isCollaborating: boolean;
  roomId: string | null;
  roomKey: string | null;
  username: string;
  collaborators: Map<SocketId, Collaborator>;
  errorMessage: string | null;
  activeRoomLink: string | null;
}

// ============================================
// WebSocket Event Types
// ============================================

export const WS_EVENTS = {
  SERVER_VOLATILE: 'server-volatile-broadcast',
  SERVER: 'server-broadcast',
  USER_FOLLOW_CHANGE: 'user-follow',
  USER_FOLLOW_ROOM_CHANGE: 'user-follow-room-change',
} as const;

export enum WS_SUBTYPES {
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  INIT = 'SCENE_INIT',
  UPDATE = 'SCENE_UPDATE',
  MOUSE_LOCATION = 'MOUSE_LOCATION',
  IDLE_STATUS = 'IDLE_STATUS',
  USER_VISIBLE_SCENE_BOUNDS = 'USER_VISIBLE_SCENE_BOUNDS',
}

// ============================================
// Syncable Element Types
// ============================================

export interface SyncableElement extends CanvasElement {
  version: number;
  versionNonce: number;
  isDeleted?: boolean;
}

export interface RemoteElement extends SyncableElement {
  // Remote elements may have additional metadata
  parent?: string | null;
}

// ReconciledElement inherits all properties from SyncableElement
export type ReconciledElement = SyncableElement;

// ============================================
// Socket Message Payloads
// ============================================

export interface SceneInitPayload {
  type: WS_SUBTYPES.INIT;
  payload: {
    elements: SyncableElement[];
  };
}

export interface SceneUpdatePayload {
  type: WS_SUBTYPES.UPDATE;
  payload: {
    elements: SyncableElement[];
  };
}

export interface MouseLocationPayload {
  type: WS_SUBTYPES.MOUSE_LOCATION;
  payload: {
    socketId: SocketId;
    pointer: CollaboratorPointer;
    button: 'up' | 'down';
    selectedElementIds: Record<string, boolean>;
    username: string;
  };
}

export interface IdleStatusPayload {
  type: WS_SUBTYPES.IDLE_STATUS;
  payload: {
    socketId: SocketId;
    userState: UserIdleState;
    username: string;
  };
}

export interface UserVisibleSceneBoundsPayload {
  type: WS_SUBTYPES.USER_VISIBLE_SCENE_BOUNDS;
  payload: {
    socketId: SocketId;
    username: string;
    sceneBounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export type SocketUpdateData =
  | SceneInitPayload
  | SceneUpdatePayload
  | MouseLocationPayload
  | IdleStatusPayload
  | UserVisibleSceneBoundsPayload;

export type SocketUpdateDataSource = {
  [WS_SUBTYPES.INIT]: SceneInitPayload;
  [WS_SUBTYPES.UPDATE]: SceneUpdatePayload;
  [WS_SUBTYPES.MOUSE_LOCATION]: MouseLocationPayload;
  [WS_SUBTYPES.IDLE_STATUS]: IdleStatusPayload;
  [WS_SUBTYPES.USER_VISIBLE_SCENE_BOUNDS]: UserVisibleSceneBoundsPayload;
};

// ============================================
// Collaboration API Types
// ============================================

export interface CreateRoomResponse {
  success: boolean;
  roomId: string;
  roomKey: string;
  shareLink: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId: string;
  existingElements?: SyncableElement[];
  collaborators?: Collaborator[];
  error?: string;
}

export interface CollabAPIError {
  success: false;
  error: string;
  code?: string;
}

// ============================================
// Configuration Constants
// ============================================

export const COLLAB_CONSTANTS = {
  // Time constants (ms)
  SAVE_TO_LOCAL_STORAGE_TIMEOUT: 300,
  INITIAL_SCENE_UPDATE_TIMEOUT: 5000,
  FILE_UPLOAD_TIMEOUT: 300,
  LOAD_IMAGES_TIMEOUT: 500,
  SYNC_FULL_SCENE_INTERVAL_MS: 20000,
  CURSOR_SYNC_TIMEOUT: 33, // ~30fps
  DELETED_ELEMENT_TIMEOUT: 24 * 60 * 60 * 1000, // 1 day
  
  // Idle detection thresholds
  IDLE_THRESHOLD: 60000, // 1 minute
  ACTIVE_THRESHOLD: 3000, // 3 seconds
  
  // Room limits
  MAX_COLLABORATORS: 16,
  ROOM_ID_LENGTH: 20,
  
  // File limits
  FILE_UPLOAD_MAX_BYTES: 4 * 1024 * 1024, // 4 MiB
} as const;

// ============================================
// Utility Types
// ============================================

export type CollabEventHandler<T extends keyof SocketUpdateDataSource> = (
  data: SocketUpdateDataSource[T]
) => void;

export interface PortalConfig {
  roomId: string;
  roomKey: string;
  username: string;
  onSceneInit?: CollabEventHandler<WS_SUBTYPES.INIT>;
  onSceneUpdate?: CollabEventHandler<WS_SUBTYPES.UPDATE>;
  onMouseLocation?: CollabEventHandler<WS_SUBTYPES.MOUSE_LOCATION>;
  onIdleStatus?: CollabEventHandler<WS_SUBTYPES.IDLE_STATUS>;
  onUserJoin?: (socketId: SocketId) => void;
  onUserLeave?: (socketId: SocketId) => void;
  onConnectionError?: (error: Error) => void;
}

