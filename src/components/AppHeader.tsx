import React from 'react';
import { useTranslation } from 'react-i18next';
import { Power } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useApp } from '../contexts/AppContext';

const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const { session, adminLogout } = useApp();

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" data-lingo-skip>
              {t('admin.dashboard')}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {session.isAuthenticated && session.user && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">{session.user.email}</span>
                <span className="text-gray-400">•</span>
                <span className="capitalize">{session.user.role.replace('_', ' ')}</span>
                {session.expiresAt && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs">
                      Expires: {new Date(session.expiresAt).toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            )}

            <LanguageSwitcher />

            {session.isAuthenticated && (
              <button
                onClick={adminLogout}
                className="hidden sm:flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Power className="h-4 w-4 mr-2" />
                {t('admin.logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;


