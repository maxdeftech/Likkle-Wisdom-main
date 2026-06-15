import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export type PWAInstallController = {
  canInstall: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIOS: boolean;
  isStandalone: boolean;
  showPrompt: boolean;
  showIOSInstructions: boolean;
  isMinimized: boolean;
  handleInstallClick: () => Promise<void>;
  handleMinimize: () => void;
  handleMaximize: () => void;
  closeIOSInstructions: () => void;
};

const isStandaloneDisplay = () => (
  Capacitor.isNativePlatform() ||
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((window.navigator as { standalone?: boolean }).standalone)
);

export const usePWAInstall = (): PWAInstallController => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const standaloneMode = isStandaloneDisplay();
    setIsStandalone(standaloneMode);
    if (standaloneMode) {
      setCanInstall(false);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    setIsIOS(ios);
    if (ios || android) {
      setCanInstall(true);
      window.setTimeout(() => setShowPrompt(true), 3000);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
      if (!isDesktop) window.setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setShowIOSInstructions(false);
      setIsMinimized(false);
      setIsStandalone(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
        setIsMinimized(false);
        setCanInstall(false);
      }
      return;
    }

    setShowIOSInstructions(true);
  }, [deferredPrompt]);

  return {
    canInstall: canInstall && !isStandalone,
    deferredPrompt,
    isIOS,
    isStandalone,
    showPrompt,
    showIOSInstructions,
    isMinimized,
    handleInstallClick,
    handleMinimize: () => setIsMinimized(true),
    handleMaximize: () => setIsMinimized(false),
    closeIOSInstructions: () => setShowIOSInstructions(false),
  };
};
