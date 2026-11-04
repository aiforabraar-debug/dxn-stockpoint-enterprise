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

export const useSyncStore = create<SyncState>((set: any) => ({
  isConnected: false,
  syncStatus: 'idle',
  revision: 0,
  lastSyncAt: null,
  outboxCount: 0,
  failedCount: 0,
  errorMessage: null,

  setConnected: (connected: boolean) => set({ isConnected: connected }),
  setSyncStatus: (status: any) => set({ syncStatus: status }),
  setRevision: (rev: number) => set({ revision: rev }),
  setLastSyncAt: (at: number | null) => set({ lastSyncAt: at }),
  setOutboxCount: (count: number) => set({ outboxCount: count }),
  setFailedCount: (count: number) => set({ failedCount: count }),
  setError: (message: string | null) => set({ errorMessage: message }),

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
