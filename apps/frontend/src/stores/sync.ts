/**
 * Sync store — tracks sync state and revision for offline-first operation.
 */

import { create } from 'zustand';

export interface SyncState {
  isConnected: boolean;
  syncStatus: 'idle' | 'syncing' | 'online' | 'pending' | 'offline' | 'error';
  revision: number;
  lastSyncAt: number | null;
  outboxCount: number;
  failedCount: number;
  errorMessage: string | null;

  setConnected: (connected: boolean) => void;
  setSyncStatus: (status: SyncState['syncStatus']) => void;
  setRevision: (rev: number) => void;
  setLastSyncAt: (at: number | null) => void;
  setOutboxCount: (count: number) => void;
  setFailedCount: (count: number) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isConnected: false,
  syncStatus: 'idle',
  revision: 0,
  lastSyncAt: null,
  outboxCount: 0,
  failedCount: 0,
  errorMessage: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setRevision: (rev) => set({ revision: rev }),
  setLastSyncAt: (at) => set({ lastSyncAt: at }),
  setOutboxCount: (count) => set({ outboxCount: count }),
  setFailedCount: (count) => set({ failedCount: count }),
  setError: (message) => set({ errorMessage: message }),

  reset: () => set({
    isConnected: false,
    syncStatus: 'idle',
    revision: 0,
    lastSyncAt: null,
    outboxCount: 0,
    failedCount: 0,
    errorMessage: null,
  }),
}));
