import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { PWAInstallBanner } from '../common/PWAInstallBanner';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Sidebar />
      <main className="md:ml-64 min-h-screen transition-all duration-300">
        <Outlet />
      </main>
      <PWAInstallBanner />
    </div>
  );
}
