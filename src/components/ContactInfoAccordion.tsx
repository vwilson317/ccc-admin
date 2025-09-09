import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Phone, Mail, Instagram, ExternalLink, MessageCircle } from 'lucide-react';
import { Barraca } from '../types';

interface ContactInfoAccordionProps {
  barraca: Barraca;
  onContactUpdate: (contact: Barraca['contact']) => void;
}

const ContactInfoAccordion: React.FC<ContactInfoAccordionProps> = ({ barraca, onContactUpdate }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [contactData, setContactData] = useState(barraca.contact);

  // Sync contactData with barraca prop when it changes
  useEffect(() => {
    setContactData(barraca.contact);
  }, [barraca.contact]);

  const handleContactChange = (field: keyof Barraca['contact'], value: string) => {
    const updatedContact = { ...contactData, [field]: value };
    setContactData(updatedContact);
    onContactUpdate(updatedContact);
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
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

  const formatInstagram = (instagram: string): string => {
    if (!instagram) return '';
    // Remove @ if present and add it back
    const cleanHandle = instagram.replace('@', '');
    return `@${cleanHandle}`;
  };

  const hasContactInfo = contactData.phone || contactData.email || contactData.instagram || contactData.website;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Contact Info</span>
          </div>
          {hasContactInfo ? (
            <div className="space-y-1 text-sm">
              {contactData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <a
                    href={`https://wa.me/${contactData.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 font-medium underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatPhoneNumber(contactData.phone)}
                  </a>
                </div>
              )}
              {contactData.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  <a
                    href={`mailto:${contactData.email}`}
                    className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contactData.email}
                  </a>
                </div>
              )}
              {contactData.instagram && (
                <div className="flex items-center gap-2">
                  <Instagram className="h-3 w-3 text-pink-500 flex-shrink-0" />
                  <a
                    href={contactData.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700 font-medium underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatInstagram(contactData.instagram)}
                  </a>
                </div>
              )}
              {contactData.website && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <a
                    href={contactData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-700 font-medium underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contactData.website}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500">No contact information available</span>
          )}
        </div>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp / Phone
                </label>
                <input
                  type="tel"
                  value={contactData.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  placeholder="+55 21 99999-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={contactData.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  placeholder="contato@barraca.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <input
                  type="text"
                  value={contactData.instagram || ''}
                  onChange={(e) => handleContactChange('instagram', e.target.value)}
                  placeholder="@barraca_username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={contactData.website || ''}
                  onChange={(e) => handleContactChange('website', e.target.value)}
                  placeholder="https://www.barraca.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const phone = (contactData.phone || '').replace(/\D/g, '');
                  if (!phone) return;
                  window.open(`https://wa.me/${phone}`, '_blank');
                }}
                disabled={!contactData.phone}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => contactData.email && window.open(`mailto:${contactData.email}`, '_self')}
                disabled={!contactData.email}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </button>
              <button
                type="button"
                onClick={() => contactData.instagram && window.open(contactData.instagram, '_blank')}
                disabled={!contactData.instagram}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </button>
              <button
                type="button"
                onClick={() => contactData.phone && navigator.clipboard?.writeText(contactData.phone)}
                disabled={!contactData.phone}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Phone className="h-4 w-4 mr-2" />
                Copy Phone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfoAccordion;
