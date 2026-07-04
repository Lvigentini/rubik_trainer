/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { InMemoryProgressStore } from './inMemoryStore';
import type { ProgressSnapshot, ProgressStore } from './types';

const ProgressStoreContext = createContext<ProgressStore | null>(null);

export function ProgressProvider({ store, children }: { store?: ProgressStore; children: ReactNode }) {
  const [fallback] = useState(() => new InMemoryProgressStore());
  const value = store ?? fallback;
  return <ProgressStoreContext.Provider value={value}>{children}</ProgressStoreContext.Provider>;
}

export function useProgressStore(): ProgressStore {
  const store = useContext(ProgressStoreContext);
  if (!store) throw new Error('useProgressStore must be used within a ProgressProvider');
  return store;
}

export function useProgress(): ProgressSnapshot {
  const store = useProgressStore();
  const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store]);
  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
