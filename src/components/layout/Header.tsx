import { Moon, Sun, Bell, Menu } from 'lucide-react';
import { useTheme } from '../common/ThemeProvider';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new Event('toggleSidebar'))}
          className="md:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">{subtitle}</p>
        )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-500" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </button>

        <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
          <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
