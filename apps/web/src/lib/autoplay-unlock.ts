'use client';

import React from 'react';

/**
 * Simula gestos de usuário no documento para desbloquear autoplay com áudio
 * em navegadores que exigem interação humana antes de reproduzir mídia com som.
 * Útil para TVs e kiosks onde não há interação humana direta com a tela.
 */
export function unlockAutoplay(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const dispatch = (type: string) => {
    try {
      const evt = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: 1,
        clientY: 1,
      });
      document.dispatchEvent(evt);
    } catch {
      // ignore
    }
  };

  const events = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'];
  events.forEach(dispatch);

  // Alguns navegadores precisam de foco ou keydown
  try {
    const keyEvt = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      code: 'Enter',
    });
    document.dispatchEvent(keyEvt);
  } catch {
    // ignore
  }
}

/**
 * Hook simples que dispara o unlock no mount e retorna um ref de estado.
 */
export function useAutoplayUnlock(enabled: boolean): boolean {
  const [unlocked, setUnlocked] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;
    unlockAutoplay();
    const t1 = setTimeout(() => unlockAutoplay(), 100);
    const t2 = setTimeout(() => {
      unlockAutoplay();
      setUnlocked(true);
    }, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [enabled]);

  return unlocked;
}
