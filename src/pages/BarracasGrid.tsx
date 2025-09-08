import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getEffectiveOpenStatus } from '../utils/environmentUtils';

const BarracasGrid: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { barracas, isLoading, error, refreshBarracas, weatherOverride } = useApp();
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    // ensure latest data when opening grid
    refreshBarracas();
  }, [refreshBarracas]);

  const locations = Array.from(new Set(barracas.map(b => b.location))).sort();

  const filtered = barracas.filter(b => {
    const matchesQuery = query.trim() === '' ||
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      (b.barracaNumber || '').toLowerCase().includes(query.toLowerCase());
    const matchesLocation = locationFilter === 'all' || b.location === locationFilter;
    return matchesQuery && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900" data-lingo-skip>
            {t('admin.manageBarracas')}
          </h1>
          <button
            onClick={() => navigate('/barracas/new')}
            className="bg-gradient-to-r from-beach-500 to-beach-600 text-white px-4 py-2 rounded-lg hover:from-beach-600 hover:to-beach-700 transition-all duration-200 shadow-lg flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addBarraca')}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('admin.table.barraca') || 'Search barraca'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            >
              <option value="all">All locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <button
              onClick={() => { setQuery(''); setLocationFilter('all'); }}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('common.clear') || 'Clear'}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">Loading barracas...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b) => {
            const isOpen = getEffectiveOpenStatus(b, weatherOverride || false);
            return (
              <button
                key={b.id}
                onClick={() => navigate(`/barracas/${b.id}`)}
                className="text-left bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
              >
                <img src={b.photos.horizontal[0]} alt={b.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{b.name}</div>
                      <div className="text-xs text-gray-500">{b.barracaNumber ? `#${b.barracaNumber}` : ''}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${isOpen === true ? 'bg-green-100 text-green-800' : isOpen === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                      {isOpen === true ? 'Open' : isOpen === false ? 'Closed' : 'N/A'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">{b.location}</div>
                  <div className="mt-3 flex justify-end">
                    <span className="inline-flex items-center text-beach-600 text-sm">
                      <Edit2 className="h-4 w-4 mr-1" /> Manage
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BarracasGrid;


