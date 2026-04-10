'use client';

import { useEffect } from 'react';

function shouldRegisterServiceWorker(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;

  // Avoid dev SW caching surprises, but still allow localhost testing.
  if (process.env.NODE_ENV === 'production') return true;

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!shouldRegisterServiceWorker()) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Proactively check for an updated SW on load.
        registration.update().catch(() => undefined);

        // If there is a waiting SW (new version), tell it to activate.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed') {
              // If there's an existing controller, this is an update.
              if (navigator.serviceWorker.controller) {
                registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        });

        // Reload once the new SW takes control.
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
    };

    register();
  }, []);

  return null;
}
