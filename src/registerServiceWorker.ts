// Attend My Class - Service Worker Registration Handler

export interface ServiceWorkerHooks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(hooks?: ServiceWorkerHooks) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);

        // Check if an update is already waiting
        if (registration.waiting) {
          hooks?.onUpdate?.(registration);
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available
                console.log('[PWA] New content is available; please refresh.');
                hooks?.onUpdate?.(registration);
              } else {
                // Content cached for offline use
                console.log('[PWA] Content is cached for offline use.');
                hooks?.onSuccess?.(registration);
              }
            }
          };
        };

        // Check for updates periodically every 30 minutes
        setInterval(() => {
          registration.update().catch((err) => console.warn('[PWA] Auto-update check skipped:', err));
        }, 1000 * 60 * 30);
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
        hooks?.onError?.(error);
      });

    // Reload page when new worker takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
