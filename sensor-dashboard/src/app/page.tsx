'use client';

import { useState, useEffect, Suspense } from 'react';
import SensorDashboard from '@/components/SensorDashboard';

function SensorDashboardWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading sensor dashboard...</p>
      </div>
    </div>}>
      <SensorDashboard />
    </Suspense>
  );
}

export default function Home() {
  return (
    <SensorDashboardWithSuspense />
  );
}
