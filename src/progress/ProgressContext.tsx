/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { InMemoryProgressStore } from './inMemoryStore';
import type { ProgressSnapshot, ProgressStore } from './types';

const ProgressStoreContext = createContext<ProgressStore | null>(null);

export function ProgressProvider({ store, children }: { store?: ProgressStore; children: ReactNode }) {
  const value = useMemo(() => store ?? new InMemoryProgressStore(), [store]);
  return <ProgressStoreContext.Provider value={value}>{children}</ProgressStoreContext.Provider>;
}

export function useProgressStore(): ProgressStore {
  const store = useContext(ProgressStoreContext);
  if (!store) throw new Error('useProgressStore must be used within a ProgressProvider');
  return store;
}

export function useProgress(): ProgressSnapshot {
  const store = useProgressStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot(),
  );
}
