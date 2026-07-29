/**
 * Element Reconciliation for Collaboration
 * Handles merging local and remote element changes
 * 
 * Element reconciliation algorithm for real-time collaboration
 */

import type { CanvasElement } from '@/stores/canvas-store';
import type { SyncableElement, RemoteElement, ReconciledElement } from './types';

// ============================================
// Version & Nonce Generation
// ============================================

/**
 * Generate a random version nonce
 */
export function generateVersionNonce(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

/**
 * Create a syncable element from a canvas element
 */
export function toSyncableElement(element: CanvasElement): SyncableElement {
  return {
    ...element,
    version: (element as SyncableElement).version || 1,
    versionNonce: (element as SyncableElement).versionNonce || generateVersionNonce(),
    isDeleted: false,
  };
}

/**
 * Increment element version
 */
export function incrementVersion(element: SyncableElement): SyncableElement {
  return {
    ...element,
    version: element.version + 1,
    versionNonce: generateVersionNonce(),
  };
}

// ============================================
// Reconciliation Logic
// ============================================

/**
 * Determine if a remote element should override local
 * Returns true if remote wins, false if local wins
 */
function shouldOverrideLocal(
  local: SyncableElement,
  remote: RemoteElement
): boolean {
  // Higher version always wins
  if (remote.version !== local.version) {
    return remote.version > local.version;
  }
  
  // Same version - use nonce as tiebreaker (higher nonce wins)
  // This provides deterministic conflict resolution
  return remote.versionNonce > local.versionNonce;
}

/**
 * Reconcile local and remote elements
 * Returns the reconciled element array
 */
export function reconcileElements(
  localElements: readonly SyncableElement[],
  remoteElements: readonly RemoteElement[]
): ReconciledElement[] {
  // Create maps for O(1) lookup
  const localMap = new Map<string, SyncableElement>();
  const remoteMap = new Map<string, RemoteElement>();
  
  for (const element of localElements) {
    localMap.set(element.id, element);
  }
  
  for (const element of remoteElements) {
    remoteMap.set(element.id, element);
  }
  
  const reconciledMap = new Map<string, ReconciledElement>();
  
  // Process all local elements
  for (const local of localElements) {
    const remote = remoteMap.get(local.id);
    
    if (!remote) {
      // Element only exists locally - keep it
      reconciledMap.set(local.id, local as ReconciledElement);
    } else if (shouldOverrideLocal(local, remote)) {
      // Remote wins - use remote element
      reconciledMap.set(local.id, remote as ReconciledElement);
    } else {
      // Local wins - keep local element
      reconciledMap.set(local.id, local as ReconciledElement);
    }
  }
  
  // Add remote elements that don't exist locally
  for (const remote of remoteElements) {
    if (!localMap.has(remote.id)) {
      reconciledMap.set(remote.id, remote as ReconciledElement);
    }
  }
  
  // Convert to array and filter deleted elements
  const reconciled = Array.from(reconciledMap.values())
    .filter(element => !element.isDeleted);
  
  return reconciled;
}

/**
 * Reconcile with incoming scene update
 * Only processes changed elements (incremental update)
 */
export function reconcileSceneUpdate(
  localElements: readonly SyncableElement[],
  incomingElements: readonly RemoteElement[]
): {
  elements: ReconciledElement[];
  changed: boolean;
} {
  const localMap = new Map<string, SyncableElement>();
  for (const element of localElements) {
    localMap.set(element.id, element);
  }
  
  let changed = false;
  const result: ReconciledElement[] = [...localElements] as ReconciledElement[];
  
  for (const incoming of incomingElements) {
    const localIndex = result.findIndex(el => el.id === incoming.id);
    const local = localMap.get(incoming.id);
    
    if (!local) {
      // New element from remote
      if (!incoming.isDeleted) {
        result.push(incoming as ReconciledElement);
        changed = true;
      }
    } else if (shouldOverrideLocal(local, incoming)) {
      // Remote wins
      if (incoming.isDeleted) {
        // Remove the element
        result.splice(localIndex, 1);
      } else {
        // Update the element
        result[localIndex] = incoming as ReconciledElement;
      }
      changed = true;
    }
  }
  
  return { elements: result, changed };
}

// ============================================
// Element Comparison
// ============================================

/**
 * Check if two elements are equal (for change detection)
 */
export function elementsAreEqual(
  a: SyncableElement,
  b: SyncableElement
): boolean {
  if (a.id !== b.id) return false;
  if (a.version !== b.version) return false;
  if (a.versionNonce !== b.versionNonce) return false;
  
  // Deep compare the rest of the properties
  const aKeys = Object.keys(a).filter(k => !['version', 'versionNonce'].includes(k));
  const bKeys = Object.keys(b).filter(k => !['version', 'versionNonce'].includes(k));
  
  if (aKeys.length !== bKeys.length) return false;
  
  for (const key of aKeys) {
    const aVal = (a as unknown as Record<string, unknown>)[key];
    const bVal = (b as unknown as Record<string, unknown>)[key];
    
    if (typeof aVal !== typeof bVal) return false;
    
    if (Array.isArray(aVal) && Array.isArray(bVal)) {
      if (aVal.length !== bVal.length) return false;
      if (JSON.stringify(aVal) !== JSON.stringify(bVal)) return false;
    } else if (aVal !== bVal) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get elements that have changed between two arrays
 */
export function getChangedElements(
  oldElements: readonly SyncableElement[],
  newElements: readonly SyncableElement[]
): SyncableElement[] {
  const oldMap = new Map<string, SyncableElement>();
  for (const element of oldElements) {
    oldMap.set(element.id, element);
  }
  
  const changed: SyncableElement[] = [];
  
  for (const newElement of newElements) {
    const oldElement = oldMap.get(newElement.id);
    
    if (!oldElement || !elementsAreEqual(oldElement, newElement)) {
      changed.push(newElement);
    }
  }
  
  // Also track deleted elements
  const newIds = new Set(newElements.map(e => e.id));
  for (const oldElement of oldElements) {
    if (!newIds.has(oldElement.id)) {
      changed.push({
        ...oldElement,
        isDeleted: true,
        version: oldElement.version + 1,
        versionNonce: generateVersionNonce(),
      });
    }
  }
  
  return changed;
}

// ============================================
// Scene Version Tracking
// ============================================

/**
 * Calculate a scene version hash
 * Used to detect if scene has changed
 */
export function getSceneVersion(elements: readonly SyncableElement[]): number {
  let version = 0;
  for (const element of elements) {
    version += element.version;
  }
  return version;
}

/**
 * Check if local scene is newer than a given version
 */
export function isSceneNewer(
  elements: readonly SyncableElement[],
  version: number
): boolean {
  return getSceneVersion(elements) > version;
}

