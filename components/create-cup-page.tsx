'use client';

import type {ComponentType} from 'react';
import {useEffect, useState} from 'react';

export function CreateCupPageClient() {
  const [Studio, setStudio] = useState<ComponentType | null>(null);

  useEffect(() => {
    let active = true;

    import('@/components/create-cup-studio').then((module) => {
      if (active) {
        setStudio(() => module.CreateCupStudio);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!Studio) {
    return <div className="min-h-screen" />;
  }

  return <Studio />;
}
