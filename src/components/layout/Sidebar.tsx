import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Users,
  Printer,
  Settings,
  ChevronLeft,
  Menu,
  Download,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePWA } from '../../hooks/usePWA';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/invoices/create', label: 'Create Invoice', icon: FilePlus },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/print-history', label: 'Print History', icon: Printer },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isInstallable, isStandalone, installApp } = usePWA();

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`
          fixed left-0 top-0 h-full z-40 flex flex-col
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-all duration-300 ease-in-out
          ${collapsed ? 'md:w-[72px]' : 'md:w-64'}
          w-64 md:w-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          shadow-sm
        `}
      >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 dark:border-gray-800">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">MP</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">MP Prints</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">Bill Book Manager</p>
          </div>
        )}
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setMobileOpen(false);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          className={`ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${collapsed ? 'hidden md:block mx-auto' : ''}`}
        >
          {collapsed ? (
            <Menu className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }
              ${collapsed ? 'md:justify-center md:px-2' : ''}
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
          </NavLink>
        ))}
        {isInstallable && !isStandalone && (
          <button
            onClick={() => {
              installApp();
              handleLinkClick();
            }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300
              ${collapsed ? 'md:justify-center md:px-2' : ''}
              cursor-pointer border-none bg-transparent text-left
            `}
          >
            <Download className="w-5 h-5 flex-shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>Install App</span>
          </button>
        )}
      </nav>

    </aside>
    </>
  );
}
