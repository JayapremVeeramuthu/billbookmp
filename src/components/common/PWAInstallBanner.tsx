import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export function PWAInstallBanner() {
  const { isInstallable, isStandalone, installApp } = usePWA();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('pwa-install-banner-dismissed') === 'true';
    if (isInstallable && !isStandalone && !isDismissed) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isInstallable, isStandalone]);

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-install-banner-dismissed', 'true');
    setVisible(false);
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-50 animate-fade-in no-print">
      <div className="glass-card p-5 border border-blue-100/50 dark:border-blue-900/30 shadow-2xl relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-lg">MP</span>
          </div>

          <div className="flex-1 pr-6">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Install MP Prints Bill Book
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Access your bill book offline, speed up load times, and manage invoices in full screen.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 mt-4 justify-end">
          <button
            onClick={handleDismiss}
            className="btn btn-secondary btn-sm px-4 py-2 font-semibold text-xs"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="btn btn-primary btn-sm px-4 py-2 font-semibold text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Install App
          </button>
        </div>
      </div>
    </div>
  );
}
