import React, { useState, useMemo } from 'react';
import { Phone, Mail, Instagram, Search, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { Barraca } from '../types';

const ContactInfo: React.FC = () => {
  const { t } = useTranslation();
  const { barracas, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Filter barracas that have contact information
  const barracasWithContact = useMemo(() => {
    return barracas.filter(barraca => 
      barraca.contact.phone || 
      barraca.contact.email || 
      barraca.contact.instagram
    );
  }, [barracas]);

  // Filter based on search query
  const filteredBarracas = useMemo(() => {
    if (!searchQuery.trim()) return barracasWithContact;
    
    const query = searchQuery.toLowerCase();
    return barracasWithContact.filter(barraca => 
      barraca.name.toLowerCase().includes(query) ||
      barraca.location.toLowerCase().includes(query) ||
      barraca.barracaNumber?.toLowerCase().includes(query) ||
      barraca.contact.phone?.toLowerCase().includes(query) ||
      barraca.contact.email?.toLowerCase().includes(query) ||
      barraca.contact.instagram?.toLowerCase().includes(query)
    );
  }, [barracasWithContact, searchQuery]);

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format Brazilian phone numbers
    if (digits.length === 11 && digits.startsWith('55')) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    
    return phone; // Return original if can't format
  };

  const formatInstagram = (instagram: string) => {
    if (!instagram) return '';
    // Remove @ if present and add it back
    const cleanHandle = instagram.replace('@', '');
    return `@${cleanHandle}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('admin.contactInfo.title')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('admin.contactInfo.subtitle')}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredBarracas.length} {t('admin.contactInfo.barracasWithContact')}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={t('admin.contactInfo.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
        />
      </div>

      {/* Contact List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
            <p className="text-lg font-medium mb-2">
              {t('common.loading')}
            </p>
            <p className="text-sm">
              {t('admin.contactInfo.subtitle')}
            </p>
          </div>
        ) : filteredBarracas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">
              {searchQuery ? t('admin.contactInfo.noResults') : t('admin.contactInfo.noContacts')}
            </p>
            <p className="text-sm">
              {searchQuery ? t('admin.contactInfo.tryDifferentSearch') : t('admin.contactInfo.addContactInfo')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBarracas.map((barraca) => (
              <div key={barraca.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {barraca.name}
                      </h3>
                      {barraca.barracaNumber && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-beach-100 text-beach-800">
                          #{barraca.barracaNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{barraca.location}</p>
                    
                    {/* Contact Information */}
                    <div className="space-y-2">
                      {barraca.contact.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <a
                            href={`https://wa.me/${barraca.contact.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-pink-600 hover:text-pink-700 font-medium underline transition-colors"
                          >
                            {formatPhoneNumber(barraca.contact.phone)}
                          </a>
                          <button
                            onClick={() => copyToClipboard(barraca.contact.phone!, `${barraca.id}-phone`)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title={t('admin.contactInfo.copyPhone')}
                          >
                            {copiedItem === `${barraca.id}-phone` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {barraca.contact.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 font-medium">
                            {barraca.contact.email}
                          </span>
                          <button
                            onClick={() => copyToClipboard(barraca.contact.email!, `${barraca.id}-email`)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title={t('admin.contactInfo.copyEmail')}
                          >
                            {copiedItem === `${barraca.id}-email` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {barraca.contact.instagram && (
                        <div className="flex items-center gap-3">
                          <Instagram className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <a
                            href={`https://instagram.com/${barraca.contact.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-pink-600 hover:text-pink-700 font-medium underline transition-colors"
                          >
                            {formatInstagram(barraca.contact.instagram)}
                          </a>
                          <button
                            onClick={() => copyToClipboard(barraca.contact.instagram!, `${barraca.id}-instagram`)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title={t('admin.contactInfo.copyInstagram')}
                          >
                            {copiedItem === `${barraca.id}-instagram` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactInfo;
