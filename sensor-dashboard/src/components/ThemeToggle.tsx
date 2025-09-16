'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = useMemo(() => [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ], []);

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  }, [setTheme]);

  return (
    <div className="relative">
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            className={`relative flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
              theme === value
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            title={`Switch to ${label} mode`}
            aria-label={`Switch to ${label} mode`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default memo(ThemeToggle);
