import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Power, PowerOff, CheckCircle, XCircle } from 'lucide-react';
import { BarracaService } from '../services/barracaService';
import { Barraca } from '../types';
import { getEffectiveOpenStatus } from '../utils/environmentUtils';
import { useApp } from '../contexts/AppContext';

interface SpecialAdminPanelProps {
  barracas: Barraca[];
  onRefresh: () => Promise<void>;
}

const SpecialAdminPanel: React.FC<SpecialAdminPanelProps> = ({ barracas, onRefresh }) => {
  const { t } = useTranslation();
  const { weatherOverride } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenBarraca = async (barracaId: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      console.log('🔄 Opening barraca:', barracaId);
      await BarracaService.specialAdminOpenBarraca(barracaId, 24); // Default 24 hours
      console.log('✅ Barraca opened successfully');
      setMessage({ type: 'success', text: 'Barraca opened successfully!' });
      
      // Trigger a background refresh after a short delay
      setTimeout(() => {
        if (onRefresh) {
          onRefresh().catch((error: unknown) => {
            console.warn('Background refresh failed:', error);
          });
        }
      }, 500);
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open barraca' });
      console.error('Error opening barraca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBarraca = async (barracaId: string) => {
    setLoading(true);
    setMessage(null);
    
    try {
      console.log('🔄 Closing barraca:', barracaId);
      await BarracaService.specialAdminCloseBarraca(barracaId);
      console.log('✅ Barraca closed successfully');
      setMessage({ type: 'success', text: 'Barraca closed successfully!' });
      
      // Trigger a background refresh after a short delay
      setTimeout(() => {
        if (onRefresh) {
          onRefresh().catch((error: unknown) => {
            console.warn('Background refresh failed:', error);
          });
        }
      }, 500);
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to close barraca' });
      console.error('Error closing barraca:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-orange-100 p-2 rounded-lg">
          <Power className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Special Admin Panel</h2>
          <p className="text-sm text-gray-600">Quick open/close operations</p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Barraca List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {barracas && barracas.length > 0 ? (
          barracas.map((barraca) => {
            const isCurrentlyOpen = getEffectiveOpenStatus(barraca, weatherOverride || false);
            
            return (
              <div key={barraca.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isCurrentlyOpen === true ? 'bg-green-500' : isCurrentlyOpen === false ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">
                      {barraca.barracaNumber && `#${barraca.barracaNumber} `}{barraca.name}
                    </div>
                    <div className="text-sm text-gray-600">{barraca.location}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    isCurrentlyOpen === true 
                      ? 'bg-green-100 text-green-800' 
                      : isCurrentlyOpen === false
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCurrentlyOpen === true ? 'Open' : isCurrentlyOpen === false ? 'Closed' : 'Undetermined'}
                  </span>
                  
                  <button
                    onClick={() => isCurrentlyOpen === true ? handleCloseBarraca(barraca.id) : handleOpenBarraca(barraca.id)}
                    disabled={loading}
                    className={`px-3 py-1 text-white text-sm rounded-md hover:opacity-90 disabled:opacity-50 flex items-center space-x-1 ${
                      isCurrentlyOpen === true ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isCurrentlyOpen === true ? (
                      <>
                        <PowerOff className="h-3 w-3" />
                        <span>Close</span>
                      </>
                    ) : (
                      <>
                        <Power className="h-3 w-3" />
                        <span>Open</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No barracas found. Loading...</p>
            <p className="text-sm mt-2">Debug: {barracas ? `${barracas.length} barracas` : 'barracas is null/undefined'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialAdminPanel; 