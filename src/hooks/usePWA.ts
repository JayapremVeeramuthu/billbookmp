import { useState, useEffect } from 'react';

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check if the event is already stored globally
    const checkInstallable = () => {
      if ((window as any).deferredPrompt) {
        setIsInstallable(true);
      }
    };

    checkInstallable();

    const handlePromptAvailable = () => {
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      (window as any).deferredPrompt = null;
      setIsInstallable(false);
      setIsStandalone(true);
      console.log('PWA installed successfully');
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Also listen to raw beforeinstallprompt in case it fires after hook mount
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setIsInstallable(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) {
      console.warn('Install prompt is not available');
      return false;
    }

    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      console.log(`User response to install prompt: ${choiceResult.outcome}`);

      if (choiceResult.outcome === 'accepted') {
        (window as any).deferredPrompt = null;
        setIsInstallable(false);
        return true;
      }
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
    }
    return false;
  };

  return {
    isInstallable,
    isStandalone,
    installApp,
  };
}
