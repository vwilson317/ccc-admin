import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Cloud, Sun } from 'lucide-react';

const WeatherOverrideToggle: React.FC = () => {
  const { weatherOverride, setWeatherOverride } = useApp();

  const handleToggle = () => {
    setWeatherOverride(!weatherOverride);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {weatherOverride ? (
            <Cloud className="h-5 w-5 text-blue-500" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-500" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">Weather Override</h3>
            <p className="text-sm text-gray-600">
              {weatherOverride ? 'Forcing good weather' : 'Using real weather'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            weatherOverride ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              weatherOverride ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default WeatherOverrideToggle;
