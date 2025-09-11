'use client';

import { useState, useEffect } from 'react';
import ModelTester from '@/components/ModelTester';

export default function TestingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <ModelTester />
    </div>
  );
}
