import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { registerServiceWorker } from '../registerServiceWorker';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  promptInstall: () => Promise<boolean>;
  applyUpdate: () => void;
  showIOSGuide: boolean;
  setShowIOSGuide: (show: boolean) => void;
  dismissInstallBanner: () => void;
  isBannerDismissed: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amc_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Check standalone mode and device type
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app is launched in standalone / installed mode
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
      const standalone = isDisplayStandalone || isNavStandalone;
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // Check iOS Safari device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo|android/.test(userAgent);
    setIsIOS(isAppleDevice && isSafari);

    // Listen for display-mode change
    const matcher = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (e.matches) setIsInstalled(true);
    };
    try {
      matcher.addEventListener('change', handleDisplayChange);
    } catch {
      matcher.addListener(handleDisplayChange);
    }

    // Capture standard PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured; app is ready to install.');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed to device.');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker
    registerServiceWorker({
      onUpdate: (registration) => {
        console.log('[PWA] Service Worker update available.');
        setIsUpdateAvailable(true);
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
        }
      },
      onSuccess: () => {
        console.log('[PWA] App shell precached for offline usage.');
      },
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      try {
        matcher.removeEventListener('change', handleDisplayChange);
      } catch {
        matcher.removeListener(handleDisplayChange);
      }
    };
  }, []);

  // Trigger Native Install Prompt
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isIOS) {
      setShowIOSGuide(true);
      return false;
    }

    if (!deferredPrompt) {
      console.warn('[PWA] No deferred install prompt available.');
      // If on Android / Desktop without prompt, can show iOS / manual guide
      setShowIOSGuide(true);
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt.');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt.');
        return false;
      }
    } catch (err) {
      console.error('[PWA] Error displaying install prompt:', err);
      return false;
    }
  }, [deferredPrompt, isIOS]);

  // Apply PWA Update by telling service worker to skipWaiting
  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const dismissInstallBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem('amc_pwa_banner_dismissed', 'true');
    } catch {}
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isStandalone,
        isIOS,
        isOnline,
        isUpdateAvailable,
        promptInstall,
        applyUpdate,
        showIOSGuide,
        setShowIOSGuide,
        dismissInstallBanner,
        isBannerDismissed,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
