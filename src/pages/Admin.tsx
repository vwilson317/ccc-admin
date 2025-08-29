import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Plus, Edit2, Trash2, Eye, EyeOff, Users, Mail, BarChart3, Power, Settings, MessageSquare, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
// import { useAnalytics } from '../hooks/useAnalytics';
import { getEffectiveOpenStatus } from '../utils/environmentUtils';
import AdminBarracaForm from '../components/AdminBarracaForm';
import AdminStats from '../components/AdminStats';
// import AnalyticsDashboard from '../components/AnalyticsDashboard';
import SpecialAdminPanel from '../components/SpecialAdminPanel';
import ManualStatusPanel from '../components/ManualStatusPanel';
import AdminRegistrations from '../components/AdminRegistrations';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Admin: React.FC = () => {
  const { t } = useTranslation();
  const { 
    isAdmin, 
    isSpecialAdmin,
    session,
    adminLogin, 
    adminLogout, 
    barracas, 
    deleteBarraca,
    emailSubscriptions,
    setWeatherOverride,
    weatherOverride,
    overrideExpiry,
    refreshBarracas,
    isLoading,
    error
  } = useApp();
  // const { trackAdminLogin, trackAdminAction } = useAnalytics();
  const trackAdminLogin = (action: string, details?: string) => {
    console.log('Analytics:', action, details);
  };
  const trackAdminAction = (action: string, details?: string) => {
    console.log('Analytics:', action, details);
  };
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'registrations' | 'barracas' | 'stats' | 'emails' | 'analytics' | 'special' | 'manual'>('registrations');
  const [editingBarraca, setEditingBarraca] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Helper function to format time until expiry
  const formatTimeUntilExpiry = (expiry: Date) => {
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Helper function to copy ID to clipboard
  const copyToClipboard = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
      trackAdminAction('Copy Barraca ID', `ID: ${id}`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      trackAdminAction('Copy Barraca ID', `ID: ${id}`);
    }
  };

  // Pagination helper functions
  const totalPages = Math.ceil(barracas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBarracas = barracas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    trackAdminAction('Pagination', `Page ${page}`);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    trackAdminAction('Items Per Page Change', `${newItemsPerPage} items`);
  };

  // Reset pagination when switching tabs
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Keyboard navigation for pagination
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeTab !== 'barracas') return;
      
      if (event.key === 'ArrowLeft' && currentPage > 1) {
        event.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
        event.preventDefault();
        handlePageChange(currentPage + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, currentPage, totalPages]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setLoginError('');

    try {
      await adminLogin(email, password);
      trackAdminLogin('success');
    } catch (error) {
      trackAdminLogin('failed');
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleDeleteBarraca = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this barraca?')) {
      try {
        trackAdminAction('Delete Barraca', `Barraca ID: ${id}`);
        await deleteBarraca(id);
        // Success message could be added here
      } catch (error) {
        console.error('Failed to delete barraca:', error);
        // Error message could be added here
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-beach-50 to-beach-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-beach-500 to-beach-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-lingo-skip>
              {t('login.title')}
            </h1>
            <p className="text-gray-600" data-lingo-skip>
              Sign in to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLogging}
              className="w-full bg-gradient-to-r from-beach-500 to-beach-600 text-white py-3 rounded-lg font-semibold hover:from-beach-600 hover:to-beach-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:transform-none"
            >
              {isLogging ? t('common.loading') : t('login.signIn')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Special Admin Interface - Show only the Special Admin Panel
  if (isSpecialAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900" data-lingo-skip>
                Special Admin Panel
              </h1>
              
              <div className="flex items-center space-x-4">
                {/* Language Switcher */}
                <LanguageSwitcher />
                
                {/* Desktop Logout Button - Always visible when logged in */}
                <button
                  onClick={adminLogout}
                  className="flex items-center px-4 sm:px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm border-2 border-red-700"
                >
                  <Power className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t('admin.logout')}</span>
                  <span className="sm:hidden">Logout</span>
                </button>
              </div>
              

            </div>
            

          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SpecialAdminPanel 
            barracas={barracas}
            onRefresh={refreshBarracas}
          />
        </div>
      </div>
    );
  }

  // Regular Admin Interface - Show all tabs and panels
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900" data-lingo-skip>
              {t('admin.dashboard')}
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Session Info */}
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
              
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Desktop Logout Button */}
              <button
                onClick={adminLogout}
                className="hidden sm:flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Power className="h-4 w-4 mr-2" />
                {t('admin.logout')}
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-beach-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Session Info */}
                {session.isAuthenticated && session.user && (
                  <div className="px-3 py-2 text-sm text-gray-600 border-b border-gray-100">
                    <div className="font-medium">{session.user.email}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {session.user.role.replace('_', ' ')}
                    </div>
                    {session.expiresAt && (
                      <div className="text-xs text-gray-500">
                        Expires: {new Date(session.expiresAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => {
                    adminLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md flex items-center"
                >
                  <Power className="h-4 w-4 mr-2" />
                  {t('admin.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex overflow-x-auto scrollbar-hide space-x-6 sm:space-x-8 pb-2">
              <button
                onClick={() => setActiveTab('registrations')}
                className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'registrations'
                    ? 'border-beach-500 text-beach-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Registrations
              </button>
              <button
                onClick={() => setActiveTab('barracas')}
                className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'barracas'
                    ? 'border-beach-500 text-beach-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Edit2 className="h-4 w-4 inline mr-2" />
                {t('admin.manageBarracas')}
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'stats'
                    ? 'border-beach-500 text-beach-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                {t('admin.stats')}
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'emails'
                    ? 'border-beach-500 text-beach-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Mail className="h-4 w-4 inline mr-2" />
                {t('admin.emails')} ({emailSubscriptions.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'border-beach-500 text-beach-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('special')}
                className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'special'
                    ? 'border-beach-500 text-beach-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Power className="h-4 w-4 inline mr-2" />
                Special Admin
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-shrink-0 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'manual'
                    ? 'border-beach-500 text-beach-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Manual Status
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'barracas' && (
          <div>
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
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900" data-lingo-skip>
                  {t('admin.manageBarracas')}
                </h2>
                {weatherOverride && (
                  <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <EyeOff className="h-4 w-4 mr-1" />
                    Weather Override Active
                    {overrideExpiry && (
                      <span className="ml-2 text-xs opacity-75">
                        (expires in {formatTimeUntilExpiry(overrideExpiry)})
                      </span>
                    )}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  {t('admin.pagination.showing', {
                    start: startIndex + 1,
                    end: Math.min(endIndex, barracas.length),
                    total: barracas.length
                  })}
                  {totalPages > 1 && (
                    <span className="ml-2 text-gray-500">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    if (weatherOverride) {
                      try {
                        await setWeatherOverride(false);
                        trackAdminAction('Disable Weather Override', 'Show Normal Status');
                      } catch (error) {
                        console.error('Failed to disable weather override:', error);
                        alert('Failed to disable weather override. Please try again.');
                      }
                    } else {
                      if (window.confirm('Enable weather override? This will show all barracas as closed in the UI (no database changes). The override will automatically clear at midnight.')) {
                        try {
                          await setWeatherOverride(true);
                          trackAdminAction('Enable Weather Override', 'Show All Closed');
                        } catch (error) {
                          console.error('Failed to enable weather override:', error);
                          alert('Failed to enable weather override. Please try again.');
                        }
                      }
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 shadow-lg flex items-center ${
                    weatherOverride 
                      ? 'bg-green-600 text-white hover:bg-green-700 status-pulse-fast' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {weatherOverride ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      {t('admin.disableWeatherOverride')}
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      {t('admin.enableWeatherOverride')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-beach-500 to-beach-600 text-white px-4 py-2 rounded-lg hover:from-beach-600 hover:to-beach-700 transition-all duration-200 shadow-lg flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin.addBarraca')}
                </button>
              </div>
            </div>

            {(showForm || editingBarraca) && (
              <div className="mb-8">
                <AdminBarracaForm 
                  barracaId={editingBarraca}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingBarraca(null);
                  }}
                  onSave={() => {
                    setShowForm(false);
                    setEditingBarraca(null);
                  }}
                />
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.table.barraca')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.table.location')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.table.partnered')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.table.updated')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentBarracas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <p className="text-lg font-medium mb-2">No barracas found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentBarracas.map((barraca) => (
                      <tr key={barraca.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={barraca.photos.horizontal[0] || '/api/placeholder/600/400'}
                              alt={barraca.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {barraca.name}
                              </div>
                              {barraca.barracaNumber && (
                                <div className="text-xs text-gray-500">
                                  #{barraca.barracaNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => copyToClipboard(barraca.id)}
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-beach-600 transition-colors group"
                            title="Click to copy ID"
                          >
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded group-hover:bg-beach-100 transition-colors">
                              {barraca.id.slice(0, 8)}...
                            </span>
                            {copiedId === barraca.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400 group-hover:text-beach-600" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {barraca.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            barraca.partnered
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {barraca.partnered ? t('barraca.partner') : t('admin.table.notPartnered')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {barraca.updatedAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingBarraca(barraca.id)}
                              className="text-beach-600 hover:text-beach-900 p-1"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBarraca(barraca.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
                             {totalPages > 1 && (
                 <div className="flex justify-center items-center space-x-2 py-4 border-t border-gray-200">
                   <button
                     onClick={() => handlePageChange(currentPage - 1)}
                     disabled={currentPage === 1}
                     className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-beach-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     aria-label={t('admin.pagination.previous')}
                   >
                     <ChevronLeft className="h-5 w-5" />
                   </button>
                   
                   <div className="flex items-center space-x-1">
                     {getPageNumbers().map((page, index) => (
                       <button
                         key={index}
                         onClick={() => {
                           if (typeof page === 'number') {
                             handlePageChange(page);
                           }
                         }}
                         disabled={typeof page !== 'number'}
                         className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                           typeof page === 'number' && page === currentPage
                             ? 'bg-beach-500 text-white shadow-sm'
                             : typeof page === 'number'
                             ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                             : 'text-gray-400 cursor-default'
                         }`}
                         aria-label={typeof page === 'number' ? `Page ${page}` : undefined}
                         aria-current={typeof page === 'number' && page === currentPage ? 'page' : undefined}
                       >
                         {page}
                       </button>
                     ))}
                   </div>
                   
                   <button
                     onClick={() => handlePageChange(currentPage + 1)}
                     disabled={currentPage === totalPages}
                     className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-beach-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     aria-label={t('admin.pagination.next')}
                   >
                     <ChevronRight className="h-5 w-5" />
                   </button>
                 </div>
               )}
                                            <div className="flex justify-center items-center space-x-2 py-4 border-t border-gray-200">
                 <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                   {t('admin.pagination.itemsPerPage')}
                 </label>
                 <select
                   id="itemsPerPage"
                   value={itemsPerPage}
                   onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                   className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-beach-500 focus:border-beach-500 transition-colors"
                 >
                   <option value={5}>5</option>
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                   <option value={50}>50</option>
                 </select>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <AdminRegistrations 
            onRegistrationConverted={() => {
              // Refresh barracas when a registration is converted
              refreshBarracas();
            }}
          />
        )}

        {activeTab === 'stats' && <AdminStats />}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>
            <p className="text-gray-600">Analytics dashboard coming soon...</p>
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6" data-lingo-skip>
              {t('admin.emails')}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.table.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.table.subscribed')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.table.preferences')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailSubscriptions.map((subscription, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.subscribedAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {subscription.preferences.newBarracas && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs" data-lingo-skip>
                              New Spots
                            </span>
                          )}
                          {subscription.preferences.specialOffers && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs" data-lingo-skip>
                              Offers
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'special' && (
          <SpecialAdminPanel 
            barracas={barracas}
            onRefresh={refreshBarracas}
          />
        )}

        {activeTab === 'manual' && (
          <ManualStatusPanel />
        )}
      </div>
    </div>
  );
};

export default Admin;