/**
 * Collaboration Module - Barrel Export
 */

// Types
export * from './types';

// Encryption
export {
  generateEncryptionKey,
  generateRoomId,
  encryptData,
  decryptData,
  encryptJSON,
  decryptJSON,
  getKeyFromUrlHash,
  setKeyInUrlHash,
  getRoomIdFromUrl,
  generateCollabLink,
  parseCollabLink,
  isValidEncryptionKey,
  isValidRoomId,
} from './encryption';

// Portal
export {
  Portal,
  getPortal,
  destroyPortal,
} from './portal';

// Reconciliation
export {
  generateVersionNonce,
  toSyncableElement,
  incrementVersion,
  reconcileElements,
  reconcileSceneUpdate,
  elementsAreEqual,
  getChangedElements,
  getSceneVersion,
  isSceneNewer,
} from './reconcile';

