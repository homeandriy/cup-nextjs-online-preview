'use client';

import type {ReactNode} from 'react';
import {createStore} from 'zustand/vanilla';
import {useStore} from 'zustand';

import type {DesignLayer, MugType} from '@/components/create-cup-studio';

type StateUpdater<T> = T | ((current: T) => T);

type AppState = {
  clicks: number;
  accent: 'orange';
  mugType: MugType;
  layers: DesignLayer[];
  selectedLayerId: string | null;
  increment: () => void;
  setMugType: (mugType: MugType) => void;
  setLayers: (layers: StateUpdater<DesignLayer[]>) => void;
  setSelectedLayerId: (selectedLayerId: StateUpdater<string | null>) => void;
};

const createAppStore = () =>
  createStore<AppState>()((set) => ({
    clicks: 0,
    accent: 'orange',
    mugType: 'classic11oz',
    layers: [],
    selectedLayerId: null,
    increment: () => set((state) => ({clicks: state.clicks + 1})),
    setMugType: (mugType) => set({mugType}),
    setLayers: (layers) => set((state) => ({
      layers: typeof layers === 'function' ? layers(state.layers) : layers
    })),
    setSelectedLayerId: (selectedLayerId) => set((state) => ({
      selectedLayerId:
        typeof selectedLayerId === 'function'
          ? selectedLayerId(state.selectedLayerId)
          : selectedLayerId
    }))
  }));

const appStore = createAppStore();

export function AppStoreProvider({children}: {children: ReactNode}) {
  return children;
}

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector);
}
