'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';

interface BuildingSelectorProps {
  availableBuildings: string[];
  selectedBuildings: string[];
  onBuildingChange: (buildings: string[]) => void;
  isLoading?: boolean;
}

const BuildingSelector: React.FC<BuildingSelectorProps> = ({
  availableBuildings,
  selectedBuildings,
  onBuildingChange,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleBuildingToggle = (building: string) => {
    const updated = selectedBuildings.includes(building)
      ? selectedBuildings.filter(b => b !== building)
      : [...selectedBuildings, building];
    
    onBuildingChange(updated);
  };

  const handleSelectAll = () => {
    if (selectedBuildings.length === availableBuildings.length) {
      onBuildingChange([]);
    } else {
      onBuildingChange([...availableBuildings]);
    }
  };

  const sortedBuildings = [...availableBuildings].sort((a, b) => {
    const numA = parseInt(a.replace('Blk ', ''));
    const numB = parseInt(b.replace('Blk ', ''));
    return numA - numB;
  });

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 mb-2">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Building Selection
        </h3>
      </div>
      
      {/* Dropdown Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {selectedBuildings.length === 0 
              ? 'Select buildings...'
              : selectedBuildings.length === 1
              ? selectedBuildings[0]
              : `${selectedBuildings.length} buildings selected`
            }
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {/* Select All Option */}
            <div
              onClick={handleSelectAll}
              className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                  selectedBuildings.length === availableBuildings.length
                    ? 'bg-blue-600 border-blue-600'
                    : selectedBuildings.length > 0
                    ? 'bg-gray-400 border-gray-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {selectedBuildings.length > 0 && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedBuildings.length === availableBuildings.length ? 'Deselect All' : 'Select All'}
                </span>
              </div>
            </div>

            {/* Individual Buildings */}
            {sortedBuildings.map((building) => (
              <div
                key={building}
                onClick={() => handleBuildingToggle(building)}
                className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                  selectedBuildings.includes(building)
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {selectedBuildings.includes(building) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="text-sm text-gray-900 dark:text-white">
                  {building}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Buildings Summary */}
      {selectedBuildings.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Monitoring {selectedBuildings.length} building{selectedBuildings.length !== 1 ? 's' : ''}:
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedBuildings.map((building) => (
              <span
                key={building}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
              >
                {building}
                <button
                  onClick={() => handleBuildingToggle(building)}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5"
                >
                  <span className="sr-only">Remove {building}</span>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingSelector;
