'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Brain, 
  Settings, 
  Bell,
  MonitorSpeaker,
  Zap,
  Home
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Real-time sensor monitoring'
    },
    {
      href: '/training',
      label: 'Model Training',
      icon: <Brain className="h-5 w-5" />,
      description: 'Train and optimize ML models'
    },
    {
      href: '/testing',
      label: 'Model Testing',
      icon: <Zap className="h-5 w-5" />,
      description: 'Test model predictions'
    },
    {
      href: '/alerts',
      label: 'Alerts',
      icon: <Bell className="h-5 w-5" />,
      description: 'Manage notifications'
    }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <MonitorSpeaker className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sensor AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Anomaly Detection
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon}
                  <span className="hidden md:block">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
