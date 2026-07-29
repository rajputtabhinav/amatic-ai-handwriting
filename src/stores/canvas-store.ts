import { create } from 'zustand';
import type { Collaborator, SocketId, UserIdleState } from '@/lib/collab/types';

export type ToolType =
  | 'select'
  | 'pen'
  | 'eraser'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'handwriting'
  | 'image';

export interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  text?: string;
  color: string;
  strokeWidth: number;
  opacity: number;
  isSelected?: boolean;
  imageUrl?: string;
  imageData?: HTMLImageElement;
}

interface CanvasStoreState {
  elements: CanvasElement[];
  username: string;
  isCollaborating: boolean;
  roomId: string | null;
  roomKey: string | null;
  collaborators: Map<SocketId, Collaborator>;
  collabError: string | null;
  tool: ToolType;
  setElements: (elements: CanvasElement[]) => void;
  syncElements: (elements: CanvasElement[]) => void;
  setUsername: (username: string) => void;
  setTool: (tool: ToolType) => void;
  startCollaboration: (roomId: string, roomKey: string) => void;
  stopCollaboration: () => void;
  updateCollaborator: (socketId: SocketId, collaborator: Partial<Collaborator>) => void;
  removeCollaborator: (socketId: SocketId) => void;
  setCollabError: (error: string | null) => void;
  setUserIdleState: (state: UserIdleState) => void;
}

export const useCanvasStore = create<CanvasStoreState>((set) => ({
  elements: [],
  username: 'Anonymous',
  isCollaborating: false,
  roomId: null,
  roomKey: null,
  collaborators: new Map(),
  collabError: null,
  tool: 'select',
  setElements: (elements) => set({ elements }),
  syncElements: (elements) => set({ elements }),
  setUsername: (username) => set({ username }),
  setTool: (tool) => set({ tool }),
  startCollaboration: (roomId, roomKey) =>
    set({
      isCollaborating: true,
      roomId,
      roomKey,
      collabError: null,
    }),
  stopCollaboration: () =>
    set({
      isCollaborating: false,
      roomId: null,
      roomKey: null,
      collaborators: new Map(),
      collabError: null,
    }),
  updateCollaborator: (socketId, collaborator) =>
    set((state) => {
      const collaborators = new Map(state.collaborators);
      collaborators.set(socketId, {
        id: socketId,
        username: collaborator.username || collaborators.get(socketId)?.username || 'Anonymous',
        ...collaborators.get(socketId),
        ...collaborator,
      });
      return { collaborators };
    }),
  removeCollaborator: (socketId) =>
    set((state) => {
      const collaborators = new Map(state.collaborators);
      collaborators.delete(socketId);
      return { collaborators };
    }),
  setCollabError: (collabError) => set({ collabError }),
  setUserIdleState: (userState) =>
    set((state) => {
      const collaborators = new Map(state.collaborators);
      for (const [socketId, collaborator] of collaborators.entries()) {
        if (collaborator.isCurrentUser) {
          collaborators.set(socketId, { ...collaborator, userState });
        }
      }
      return { collaborators };
    }),
}));
