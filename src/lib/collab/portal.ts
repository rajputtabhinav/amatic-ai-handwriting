/**
 * Portal - WebSocket Connection Manager for Collaboration
 * Handles real-time communication between collaborators
 * 
 * Real-time collaboration portal for canvas synchronization
 */

import { io, Socket } from 'socket.io-client';
import throttle from 'lodash.throttle';

import {
  encryptJSON,
  decryptJSON,
} from './encryption';

import {
  WS_EVENTS,
  WS_SUBTYPES,
  COLLAB_CONSTANTS,
  type SocketId,
  type SocketUpdateData,
  type SocketUpdateDataSource,
  type SyncableElement,
  type CollaboratorPointer,
  type UserIdleState,
  type PortalConfig,
} from './types';

// ============================================
// Portal Class
// ============================================

export class Portal {
  private socket: Socket | null = null;
  private socketInitialized: boolean = false;
  private roomId: string | null = null;
  private roomKey: string | null = null;
  private username: string = '';
  
  // Track broadcasted element versions to minimize bandwidth
  private broadcastedElementVersions: Map<string, number> = new Map();
  
  // Event handlers
  private config: PortalConfig | null = null;
  
  // Connection state
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  constructor() {
    // Bind methods
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }
  
  // ============================================
  // Connection Management
  // ============================================
  
  /**
   * Open a connection to a collaboration room
   */
  async open(config: PortalConfig): Promise<boolean> {
    this.config = config;
    this.roomId = config.roomId;
    this.roomKey = config.roomKey;
    this.username = config.username;
    
    // Get WebSocket server URL
    const wsUrl = this.getWebSocketUrl();
    
    try {
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });
      
      // Set up event listeners
      this.socket.on('connect', this.handleConnect);
      this.socket.on('disconnect', this.handleDisconnect);
      this.socket.on('connect_error', this.handleError);
      this.socket.on('init-room', this.handleInitRoom.bind(this));
      this.socket.on('new-user', this.handleNewUser.bind(this));
      this.socket.on('room-user-change', this.handleRoomUserChange.bind(this));
      this.socket.on('user-left', this.handleUserLeft.bind(this));
      // Listen for client-broadcast (incoming encrypted data from other clients)
      this.socket.on('client-broadcast', this.handleMessage);
      
      return true;
    } catch (error) {
      console.error('Failed to connect to collaboration server:', error);
      this.config?.onConnectionError?.(error as Error);
      return false;
    }
  }
  
  /**
   * Close the connection
   */
  close(): void {
    if (!this.socket) return;
    
    // Flush any pending uploads
    this.queueBroadcast.flush();
    
    this.socket.close();
    this.socket = null;
    this.roomId = null;
    this.roomKey = null;
    this.socketInitialized = false;
    this.broadcastedElementVersions.clear();
    this.config = null;
  }
  
  /**
   * Check if connection is open and ready
   */
  isOpen(): boolean {
    return !!(
      this.socketInitialized &&
      this.socket?.connected &&
      this.roomId &&
      this.roomKey
    );
  }
  
  /**
   * Get the socket ID
   */
  getSocketId(): SocketId | null {
    return (this.socket?.id as SocketId) || null;
  }
  
  // ============================================
  // Event Handlers
  // ============================================
  
  private handleConnect(): void {
    // logger.debug('[Collab] Connected to server');
    this.reconnectAttempts = 0;
  }
  
  private handleDisconnect(reason: string): void {
    // logger.debug('[Collab] Disconnected:', reason);
    this.socketInitialized = false;
    
    if (reason === 'io server disconnect') {
      // Server disconnected us, try to reconnect
      this.socket?.connect();
    }
  }
  
  private handleError(error: Error): void {
    console.error('[Collab] Connection error:', error);
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.config?.onConnectionError?.(
        new Error('Failed to connect after multiple attempts')
      );
    }
  }
  
  private handleInitRoom(): void {
    console.log('[Collab] Room initialized');
    if (this.socket && this.roomId) {
      this.socket.emit('join-room', this.roomId);
      this.socketInitialized = true;
    }
  }
  
  private handleNewUser(socketId: string): void {
    // logger.debug('[Collab] New user joined:', socketId);
    this.config?.onUserJoin?.(socketId as SocketId);
  }
  
  private handleRoomUserChange(clients: SocketId[]): void {
    // logger.debug('[Collab] Room users changed:', clients.length);
    // This is handled by the Collab component
  }
  
  private handleUserLeft(socketId: string): void {
    // logger.debug('[Collab] User left:', socketId);
    this.config?.onUserLeave?.(socketId as SocketId);
  }
  
  private async handleMessage(
    roomId: string,
    encryptedBuffer: ArrayBuffer,
    iv: Uint8Array
  ): Promise<void> {
    if (!this.roomKey || roomId !== this.roomId) return;
    
    try {
      const data = await decryptJSON<SocketUpdateData>(
        this.roomKey,
        encryptedBuffer,
        iv
      );
      
      // Route to appropriate handler
      switch (data.type) {
        case WS_SUBTYPES.INIT:
          this.config?.onSceneInit?.(data as SocketUpdateDataSource[WS_SUBTYPES.INIT]);
          break;
        case WS_SUBTYPES.UPDATE:
          this.config?.onSceneUpdate?.(data as SocketUpdateDataSource[WS_SUBTYPES.UPDATE]);
          break;
        case WS_SUBTYPES.MOUSE_LOCATION:
          this.config?.onMouseLocation?.(data as SocketUpdateDataSource[WS_SUBTYPES.MOUSE_LOCATION]);
          break;
        case WS_SUBTYPES.IDLE_STATUS:
          this.config?.onIdleStatus?.(data as SocketUpdateDataSource[WS_SUBTYPES.IDLE_STATUS]);
          break;
      }
    } catch (error) {
      console.error('[Collab] Failed to decrypt message:', error);
    }
  }
  
  // ============================================
  // Broadcasting
  // ============================================
  
  /**
   * Broadcast encrypted data to the room
   */
  private async broadcastSocketData(
    data: SocketUpdateData,
    volatile: boolean = false
  ): Promise<void> {
    if (!this.isOpen() || !this.roomKey) return;
    
    try {
      const { encryptedBuffer, iv } = await encryptJSON(this.roomKey, data);
      
      this.socket?.emit(
        volatile ? WS_EVENTS.SERVER_VOLATILE : WS_EVENTS.SERVER,
        this.roomId,
        encryptedBuffer,
        iv
      );
    } catch (error) {
      console.error('[Collab] Failed to broadcast:', error);
    }
  }
  
  /**
   * Throttled broadcast to prevent flooding
   */
  private queueBroadcast = throttle(
    async (data: SocketUpdateData, volatile: boolean) => {
      await this.broadcastSocketData(data, volatile);
    },
    COLLAB_CONSTANTS.CURSOR_SYNC_TIMEOUT
  );
  
  /**
   * Broadcast scene elements (init or update)
   */
  async broadcastScene(
    updateType: WS_SUBTYPES.INIT | WS_SUBTYPES.UPDATE,
    elements: readonly SyncableElement[],
    syncAll: boolean = false
  ): Promise<void> {
    if (!this.isOpen()) return;
    
    // For INIT, always sync all elements
    if (updateType === WS_SUBTYPES.INIT) {
      syncAll = true;
    }
    
    // Filter elements that need syncing
    const elementsToSync = elements.filter(element => {
      if (syncAll) return true;
      
      const lastVersion = this.broadcastedElementVersions.get(element.id);
      return !lastVersion || element.version > lastVersion;
    });
    
    if (elementsToSync.length === 0) return;
    
    const data: SocketUpdateDataSource[typeof updateType] = {
      type: updateType,
      payload: {
        elements: elementsToSync as SyncableElement[],
      },
    };
    
    // Update version tracking
    for (const element of elementsToSync) {
      this.broadcastedElementVersions.set(element.id, element.version);
    }
    
    await this.broadcastSocketData(data as SocketUpdateData);
  }
  
  /**
   * Broadcast mouse location (throttled, volatile)
   */
  broadcastMouseLocation(payload: {
    pointer: CollaboratorPointer;
    button: 'up' | 'down';
    selectedElementIds: Record<string, boolean>;
  }): void {
    if (!this.isOpen() || !this.socket?.id) return;
    
    const data: SocketUpdateDataSource[WS_SUBTYPES.MOUSE_LOCATION] = {
      type: WS_SUBTYPES.MOUSE_LOCATION,
      payload: {
        socketId: this.socket.id as SocketId,
        pointer: payload.pointer,
        button: payload.button,
        selectedElementIds: payload.selectedElementIds,
        username: this.username,
      },
    };
    
    this.queueBroadcast(data as SocketUpdateData, true);
  }
  
  /**
   * Broadcast idle status
   */
  async broadcastIdleChange(userState: UserIdleState): Promise<void> {
    if (!this.isOpen() || !this.socket?.id) return;
    
    const data: SocketUpdateDataSource[WS_SUBTYPES.IDLE_STATUS] = {
      type: WS_SUBTYPES.IDLE_STATUS,
      payload: {
        socketId: this.socket.id as SocketId,
        userState,
        username: this.username,
      },
    };
    
    await this.broadcastSocketData(data as SocketUpdateData, true);
  }
  
  // ============================================
  // Utilities
  // ============================================
  
  private getWebSocketUrl(): string {
    // Use environment variable or same origin (port 3000)
    if (process.env.NEXT_PUBLIC_WS_URL) {
      return process.env.NEXT_PUBLIC_WS_URL;
    }
    
    // In browser, use same origin (WebSocket is on same port as Next.js)
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    // Fallback for SSR
    return 'http://localhost:3000';
  }
  
  /**
   * Update username
   */
  setUsername(username: string): void {
    this.username = username;
  }
}

// ============================================
// Singleton Instance
// ============================================

let portalInstance: Portal | null = null;

export function getPortal(): Portal {
  if (!portalInstance) {
    portalInstance = new Portal();
  }
  return portalInstance;
}

export function destroyPortal(): void {
  if (portalInstance) {
    portalInstance.close();
    portalInstance = null;
  }
}

