'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Request notification permission for mobile wallet notifications
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
              console.log('Notification permission:', permission);
            });
          }

          // Register background sync for wallet transactions
          if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
            (registration as any).sync.register('wallet-transaction').then(() => {
              console.log('Background sync registered for wallet transactions');
            }).catch((error: Error) => {
              console.log('Background sync registration failed:', error);
            });
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed - page will reload');
        window.location.reload();
      });
    }
  }, []);

  return null;
}
