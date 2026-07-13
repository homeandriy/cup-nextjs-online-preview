'use client';

import {createContext, useContext, useState, type ReactNode} from 'react';
import {createStore, type StoreApi} from 'zustand/vanilla';
import {useStore} from 'zustand';

type AppState = {
  clicks: number;
  accent: 'orange';
  increment: () => void;
};

type AppStore = StoreApi<AppState>;

const createAppStore = () =>
  createStore<AppState>()((set) => ({
    clicks: 0,
    accent: 'orange',
    increment: () => set((state) => ({clicks: state.clicks + 1}))
  }));

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({children}: {children: ReactNode}) {
  const [store] = useState(createAppStore);

  return (
    <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore<T>(selector: (state: AppState) => T): T {
  const store = useContext(AppStoreContext);

  if (!store) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }

  return useStore(store, selector);
}
