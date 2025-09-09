import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Save, X, Plus, Trash2, Settings, Calendar, Eye, MessageCircle, Menu, Phone, Mail, ExternalLink, Star, Instagram } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Barraca, CTAButtonConfig } from '../types';

interface AdminBarracaFormProps {
  barracaId?: string | null;
  onCancel: () => void;
  onSave: () => void;
}

const AdminBarracaForm: React.FC<AdminBarracaFormProps> = ({ barracaId, onCancel, onSave }) => {
  const { t } = useTranslation();
  const { barracas, addBarraca, updateBarraca } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    barracaNumber: '',
    location: '',
    coordinates: { lat: -22.9711, lng: -43.1822 },
    isOpen: true,
    typicalHours: '9:00 - 18:00',
    description: '',
    nearestPosto: '',
    photos: { horizontal: [''], vertical: [''] },
    menuPreview: [''],
    contact: {
      phone: '',
      email: '',
      website: '',
      instagram: ''
    },
    amenities: [''],
    environment: [] as string[],
    additionalInfo: '',
    weatherDependent: false,
    partnered: false,
    weekendHoursEnabled: false,
    weekendHours: {
      friday: { open: '10:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '10:00', close: '20:00' }
    },
    specialAdminOverride: false,
    specialAdminOverrideExpires: null as Date | null,
    rating: undefined as 1 | 2 | 3 | undefined,
    ctaButtons: [] as CTAButtonConfig[],
    // Partnership opportunities
    qrCodes: false,
    repeatDiscounts: false,
    hotelPartnerships: false,
    contentCreation: false,
    onlineOrders: false,
    // Contact preferences
    contactForPhotos: false,
    contactForStatus: false,
    preferredContactMethod: 'whatsapp' as 'whatsapp' | 'instagram' | 'email',
    // English fluency
    englishFluency: 'no' as 'no' | 'not_fluent' | 'fluent',
    englishSpeakerNames: '',
    // Tab system
    tabSystem: 'name_only' as 'name_only' | 'individual_paper' | 'number_on_chair' | 'digital'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showCTAConfig, setShowCTAConfig] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'details'>('details');

  // Helper function to validate image URL
  const validateImageUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  // Helper function to validate and format Instagram URL
  const validateInstagramUrl = (url: string): { isValid: boolean; formattedUrl: string; error?: string } => {
    if (!url.trim()) {
      return { isValid: false, formattedUrl: '', error: 'Instagram URL is required' };
    }

    let formattedUrl = url.trim();
    
    // Handle different Instagram URL formats
    if (formattedUrl.includes('instagram.com')) {
      // Full URL provided
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = 'https://' + formattedUrl;
      }
    } else if (formattedUrl.startsWith('@')) {
      // Username with @ symbol
      const username = formattedUrl.substring(1);
      formattedUrl = `https://instagram.com/${username}`;
    } else if (formattedUrl.match(/^[a-zA-Z0-9._]+$/)) {
      // Just username without @
      formattedUrl = `https://instagram.com/${formattedUrl}`;
    } else {
      return { isValid: false, formattedUrl: '', error: 'Invalid Instagram URL format' };
    }

    // Validate the final URL
    try {
      const urlObj = new URL(formattedUrl);
      if (!urlObj.hostname.includes('instagram.com')) {
        return { isValid: false, formattedUrl: '', error: 'URL must be from Instagram' };
      }
      return { isValid: true, formattedUrl };
    } catch {
      return { isValid: false, formattedUrl: '', error: 'Invalid URL format' };
    }
  };

  // Helper function to extract Instagram username from URL
  const extractInstagramUsername = (url: string): string => {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      return pathParts[0] || '';
    } catch {
      return '';
    }
  };

  // Helper function to handle image load errors
  const handleImageError = (imageKey: string) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  // Helper function to handle image load success
  const handleImageSuccess = (imageKey: string) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: false }));
  };

  // Popular image hosting services
  const imageHostingServices = [
    { name: 'Imgur', url: 'https://imgur.com/upload' },
    { name: 'Cloudinary', url: 'https://cloudinary.com/console/media_library' },
    { name: 'Unsplash', url: 'https://unsplash.com' },
    { name: 'Pexels', url: 'https://pexels.com' },
    { name: 'Pixabay', url: 'https://pixabay.com' }
  ];

  const openImageHostingService = (serviceUrl: string) => {
    window.open(serviceUrl, '_blank');
  };

  // Complete list of South Zone neighborhoods
  const southZoneNeighborhoods = [
    'Copacabana', 
    'Ipanema', 
    'Leblon', 
    'Leme', 
    'Arpoador',
    'Diabo Beach',
    'Flamengo',
    'Botafogo',
    'Urca',
    'Vermelha Beach',
    'São Conrado',
    'Barra da Tijuca',
    'Recreio',
    'Joatinga',
    'Pepino Beach'
  ];

  const ctaButtonStyles = ['primary', 'secondary', 'outline', 'ghost'];
  const ctaButtonTypes = ['url', 'phone', 'email', 'whatsapp', 'ig', 'reservation', 'custom'];
  const iconOptions = ['Calendar', 'Eye', 'MessageCircle', 'Menu', 'Phone', 'Mail', 'ExternalLink', 'Star', 'Instagram'];

  // Common environment types for easy selection
  const commonEnvironmentTypes = [
    'Beachfront',
    'Ocean View',
    'Shaded',
    'Open Air',
    'Indoor',
    'Rooftop',
    'Garden',
    'Poolside',
    'Street Side',
    'Quiet',
    'Family Friendly',
    'Romantic',
    'Party Atmosphere',
    'Sports Bar',
    'Live Music',
    'DJ',
    'Pet Friendly',
    'Wheelchair Accessible'
  ];

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (barracaId && !isInitialized) {
      const barraca = barracas.find(b => b.id === barracaId);
      if (barraca) {
        setFormData({
          name: barraca.name,
          ownerName: (barraca as any).ownerName || '',
          barracaNumber: barraca.barracaNumber || '',
          location: barraca.location,
          coordinates: barraca.coordinates,
          isOpen: barraca.isOpen,
          typicalHours: barraca.typicalHours,
          description: barraca.description,
          nearestPosto: (barraca as any).nearestPosto || '',
          photos: barraca.photos,
          menuPreview: barraca.menuPreview,
          contact: {
            phone: barraca.contact.phone || '',
            email: barraca.contact.email || '',
            website: barraca.contact.website || '',
            instagram: (barraca.contact as any).instagram || ''
          },
          amenities: barraca.amenities,
          environment: (barraca as any).environment || [],
          additionalInfo: (barraca as any).additionalInfo || '',
          weatherDependent: barraca.weatherDependent,
          partnered: barraca.partnered,
          weekendHoursEnabled: barraca.weekendHoursEnabled,
          weekendHours: barraca.weekendHours || {
            friday: { open: '10:00', close: '22:00' },
            saturday: { open: '10:00', close: '22:00' },
            sunday: { open: '10:00', close: '20:00' }
          },
          specialAdminOverride: barraca.specialAdminOverride,
          specialAdminOverrideExpires: barraca.specialAdminOverrideExpires,
          rating: barraca.rating,
          ctaButtons: barraca.ctaButtons || [],
          // Partnership opportunities
          qrCodes: (barraca as any).qrCodes || false,
          repeatDiscounts: (barraca as any).repeatDiscounts || false,
          hotelPartnerships: (barraca as any).hotelPartnerships || false,
          contentCreation: (barraca as any).contentCreation || false,
          onlineOrders: (barraca as any).onlineOrders || false,
          // Contact preferences
          contactForPhotos: (barraca as any).contactForPhotos || false,
          contactForStatus: (barraca as any).contactForStatus || false,
          preferredContactMethod: (barraca as any).preferredContactMethod || 'whatsapp',
          // English fluency
          englishFluency: (barraca as any).englishFluency || 'no',
          englishSpeakerNames: (barraca as any).englishSpeakerNames || '',
          // Tab system
          tabSystem: (barraca as any).tabSystem || 'name_only'
        });
        setIsInitialized(true);
      }
    }
  }, [barracaId, barracas, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Ensure at least one horizontal image exists
      const filteredHorizontalImages = formData.photos.horizontal.filter(img => img.trim() !== '');
      const filteredVerticalImages = formData.photos.vertical.filter(img => img.trim() !== '');
      
      // Add placeholder image if no horizontal images provided
      const finalHorizontalImages = filteredHorizontalImages.length > 0 
        ? filteredHorizontalImages 
        : ['https://images.cariocacoastalclub.com/under-construction-sm.png'];

      // Generate barraca number if not provided
      const finalBarracaNumber = formData.barracaNumber.trim() || 
        (barracas.length + 1).toString().padStart(3, '0');

      // Format Instagram URLs in CTA buttons
      const formattedCtaButtons = formData.ctaButtons
        .filter(button => button.text.trim() !== '' && button.action.value.trim() !== '')
        .map(button => {
          if (button.action.type === 'ig') {
            const validation = validateInstagramUrl(button.action.value);
            if (validation.isValid) {
              return {
                ...button,
                action: {
                  ...button.action,
                  value: validation.formattedUrl
                }
              };
            }
          }
          return button;
        });

      const barracaData = {
        ...formData,
        barracaNumber: finalBarracaNumber,
        photos: {
          horizontal: finalHorizontalImages,
          vertical: filteredVerticalImages,
        },
        menuPreview: formData.menuPreview.filter(item => item.trim() !== ''),
        amenities: formData.amenities.filter(amenity => amenity.trim() !== ''),
        environment: formData.environment.filter(env => env.trim() !== ''),
        ctaButtons: formattedCtaButtons
      };

      if (barracaId) {
        await updateBarraca({ ...barracaData, id: barracaId });
        setSaveMessage({ type: 'success', text: 'Barraca updated successfully!' });
        toast.success('Barraca updated successfully!');
      } else {
        await addBarraca(barracaData);
        setSaveMessage({ type: 'success', text: 'Barraca created successfully!' });
        toast.success('Barraca created successfully!');
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
        onSave();
      }, 3000);
    } catch (error) {
      console.error('Failed to save barraca:', error);
      setSaveMessage({ 
        type: 'error', 
        text: `Failed to save barraca: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (field: 'menuPreview' | 'amenities' | 'environment' | 'horizontal' | 'vertical') => {
    if (field === 'horizontal' || field === 'vertical') {
      setFormData(prev => ({
        ...prev,
        photos: {
          ...prev.photos,
          [field]: [...prev.photos[field], '']
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), '']
      }));
    }
  };

  const updateArrayItem = (field: 'menuPreview' | 'amenities' | 'environment' | 'horizontal' | 'vertical', index: number, value: string) => {
    if (field === 'horizontal' || field === 'vertical') {
      setFormData(prev => ({
        ...prev,
        photos: {
          ...prev.photos,
          [field]: prev.photos[field].map((item, i) => i === index ? value : item)
        }
      }));
      
      // Clear image error when URL is changed
      const imageKey = `${field}-${index}`;
      if (imageErrors[imageKey]) {
        setImageErrors(prev => ({ ...prev, [imageKey]: false }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field] as string[]).map((item: string, i: number) => i === index ? value : item)
      }));
    }
  };

  const removeArrayItem = (field: 'menuPreview' | 'amenities' | 'environment' | 'horizontal' | 'vertical', index: number) => {
    if (field === 'horizontal' || field === 'vertical') {
      setFormData(prev => ({
        ...prev,
        photos: {
          ...prev.photos,
          [field]: prev.photos[field].filter((_, i) => i !== index)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field] as string[]).filter((_: string, i: number) => i !== index)
      }));
    }
  };

  const handleEnvironmentToggle = (environmentType: string) => {
    setFormData(prev => ({
      ...prev,
      environment: prev.environment.includes(environmentType)
        ? prev.environment.filter((e: string) => e !== environmentType)
        : [...prev.environment, environmentType]
    }));
  };

  // Reorder images
  const reorderImage = (field: 'horizontal' | 'vertical', fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const images = [...prev.photos[field]];
      const [movedImage] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, movedImage);
      
      return {
        ...prev,
        photos: {
          ...prev.photos,
          [field]: images
        }
      };
    });
  };

  // CTA Button management functions
  const addCTAButton = () => {
    const newButton: CTAButtonConfig = {
      id: `cta-${Date.now()}`,
      text: '',
      action: {
        type: 'url',
        value: '',
        target: '_blank',
        trackingEvent: 'online_store_clicked'
      },
      style: 'primary',
      position: formData.ctaButtons.length + 1,
      visibilityConditions: {},
      enabled: true
    };

    setFormData(prev => ({
      ...prev,
      ctaButtons: [...prev.ctaButtons, newButton]
    }));
  };

  const updateCTAButton = (index: number, updates: Partial<CTAButtonConfig>) => {
    setFormData(prev => ({
      ...prev,
      ctaButtons: prev.ctaButtons.map((button, i) => 
        i === index ? { ...button, ...updates } : button
      )
    }));
  };

  const removeCTAButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ctaButtons: prev.ctaButtons.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {barracaId ? t('admin.editBarraca') : t('admin.addBarraca')}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success/Error Messages */}
        {saveMessage && (
          <div className={`p-4 rounded-lg border ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {saveMessage.type === 'success' ? (
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
          </div>
        )}


        {/* Form Content */}
        <>
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.form.name')} {t('admin.form.required')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.form.barracaNumber')}
            </label>
            <input
              type="text"
              value={formData.barracaNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, barracaNumber: e.target.value }))}
              placeholder="e.g. 001"
              pattern="[0-9]*"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.form.location')} {t('admin.form.required')}
            </label>
            <select
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            >
              <option value="">{t('admin.form.selectNeighborhood')}</option>
              {southZoneNeighborhoods.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <select
            value={formData.rating || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              rating: e.target.value ? parseInt(e.target.value) as 1 | 2 | 3 : undefined 
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
          >
            <option value="">No Rating</option>
            <option value="1">⭐ Good (1 star)</option>
            <option value="2">⭐⭐ Great (2 stars)</option>
            <option value="3">⭐⭐⭐ Excellent (3 stars)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.form.description')} {t('admin.form.required')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
          />
        </div>

        {/* Owner Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner Name
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
              placeholder="Owner's full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nearest Posto
            </label>
            <input
              type="text"
              value={formData.nearestPosto}
              onChange={(e) => setFormData(prev => ({ ...prev, nearestPosto: e.target.value }))}
              placeholder="e.g. Posto 9"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            value={formData.additionalInfo}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
            rows={3}
            placeholder="Any additional information about the barraca..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
          />
        </div>

        {/* Environment Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environment Types
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Select the types of environment this barraca offers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {commonEnvironmentTypes.map((envType) => (
              <label key={envType} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.environment.includes(envType)}
                  onChange={() => handleEnvironmentToggle(envType)}
                  className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{envType}</span>
              </label>
            ))}
          </div>
          
          {/* Custom Environment Types */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Custom Environment Types
              </label>
              <button
                type="button"
                onClick={() => addArrayItem('environment')}
                className="text-beach-600 hover:text-beach-800 flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Type
              </button>
            </div>
            {formData.environment.filter(env => !commonEnvironmentTypes.includes(env)).map((env, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={env}
                  onChange={(e) => updateArrayItem('environment', index, e.target.value)}
                  placeholder="Custom environment type"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('environment', index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* English Fluency and Tab System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Fluency
            </label>
            <select
              value={formData.englishFluency}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                englishFluency: e.target.value as 'no' | 'not_fluent' | 'fluent' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            >
              <option value="no">No English</option>
              <option value="not_fluent">Not Fluent</option>
              <option value="fluent">Fluent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tab System
            </label>
            <select
              value={formData.tabSystem}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                tabSystem: e.target.value as 'name_only' | 'individual_paper' | 'number_on_chair' | 'digital' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            >
              <option value="name_only">Name Only</option>
              <option value="individual_paper">Individual Paper</option>
              <option value="number_on_chair">Number on Chair</option>
              <option value="digital">Digital</option>
            </select>
          </div>
        </div>

        {/* English Speaker Names - Only show if fluent is selected */}
        {formData.englishFluency === 'fluent' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Speaker Names
            </label>
            <input
              type="text"
              value={formData.englishSpeakerNames}
              onChange={(e) => setFormData(prev => ({ ...prev, englishSpeakerNames: e.target.value }))}
              placeholder="Names of English-speaking staff members"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Partnership Opportunities */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Partnership Opportunities</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.qrCodes}
                onChange={(e) => setFormData(prev => ({ ...prev, qrCodes: e.target.checked }))}
                className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">QR Codes</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.repeatDiscounts}
                onChange={(e) => setFormData(prev => ({ ...prev, repeatDiscounts: e.target.checked }))}
                className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Repeat Discounts</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.hotelPartnerships}
                onChange={(e) => setFormData(prev => ({ ...prev, hotelPartnerships: e.target.checked }))}
                className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Hotel Partnerships</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.contentCreation}
                onChange={(e) => setFormData(prev => ({ ...prev, contentCreation: e.target.checked }))}
                className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Content Creation</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.onlineOrders}
                onChange={(e) => setFormData(prev => ({ ...prev, onlineOrders: e.target.checked }))}
                className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Online Orders</span>
            </label>
          </div>
        </div>

        {/* Contact Preferences */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Contact Preferences</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <select
                value={formData.preferredContactMethod}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  preferredContactMethod: e.target.value as 'whatsapp' | 'instagram' | 'email' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.contactForPhotos}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactForPhotos: e.target.checked }))}
                  className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Contact for Photos</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.contactForStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactForStatus: e.target.checked }))}
                  className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Contact for Status</span>
              </label>
            </div>
          </div>
        </div>



        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.weatherDependent}
                onChange={(e) => setFormData(prev => ({ ...prev, weatherDependent: e.target.checked }))}
                className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
                disabled={!formData.partnered}
              />
              <span className={`ml-2 text-sm ${!formData.partnered ? 'text-gray-400' : 'text-gray-700'}`}>
                {t('admin.form.weatherDependent')}
              </span>
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.partnered}
                onChange={(e) => setFormData(prev => ({ ...prev, partnered: e.target.checked }))}
                className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{t('admin.form.partnered')}</span>
            </label>
          </div>
        </div>

        {/* Images - Available for all barracas */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">{t('admin.form.images')}</h4>
          
          {/* Preview Section */}
          {formData.photos.horizontal.length > 0 && formData.photos.horizontal[0].trim() !== '' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Preview:</h5>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <img
                  src={formData.photos.horizontal[0]}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{formData.name || 'Barraca Name'}</h3>
                  <p className="text-sm text-gray-600">{formData.location || 'Location'}</p>
                  {formData.description && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{formData.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Horizontal Images */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('admin.form.horizontalImages')} (Landscape)
              </label>
              <button
                type="button"
                onClick={() => addArrayItem('horizontal')}
                className="text-beach-600 hover:text-beach-800 flex items-center text-sm bg-beach-50 px-3 py-1 rounded-lg hover:bg-beach-100 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('admin.form.addHorizontalImage')}
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.photos.horizontal.map((image, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => updateArrayItem('horizontal', index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                    />
                    {image && (
                      <div className="mt-2">
                        {!validateImageUrl(image) && (
                          <div className="text-red-500 text-xs mb-1">Invalid URL format</div>
                        )}
                        <img
                          src={image}
                          alt={`Horizontal image ${index + 1}`}
                          className={`w-full h-32 object-cover rounded-lg border ${
                            imageErrors[`horizontal-${index}`] 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200'
                          }`}
                          onError={() => handleImageError(`horizontal-${index}`)}
                          onLoad={() => handleImageSuccess(`horizontal-${index}`)}
                        />
                        {imageErrors[`horizontal-${index}`] && (
                          <div className="text-red-500 text-xs mt-1">Failed to load image</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => reorderImage('horizontal', index, index - 1)}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Move up"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {index < formData.photos.horizontal.length - 1 && (
                      <button
                        type="button"
                        onClick={() => reorderImage('horizontal', index, index + 1)}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Move down"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeArrayItem('horizontal', index)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {formData.photos.horizontal.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No horizontal images added</p>
                  <p className="text-xs text-gray-400 mt-1">Add landscape images for better display</p>
                </div>
              </div>
            )}
          </div>

          {/* Vertical Images */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('admin.form.verticalImages')} (Portrait)
              </label>
              <button
                type="button"
                onClick={() => addArrayItem('vertical')}
                className="text-beach-600 hover:text-beach-800 flex items-center text-sm bg-beach-50 px-3 py-1 rounded-lg hover:bg-beach-100 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('admin.form.addVerticalImage')}
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.photos.vertical.map((image, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => updateArrayItem('vertical', index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                    />
                    {image && (
                      <div className="mt-2">
                        {!validateImageUrl(image) && (
                          <div className="text-red-500 text-xs mb-1">Invalid URL format</div>
                        )}
                        <img
                          src={image}
                          alt={`Vertical image ${index + 1}`}
                          className={`w-24 h-32 object-cover rounded-lg border ${
                            imageErrors[`vertical-${index}`] 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200'
                          }`}
                          onError={() => handleImageError(`vertical-${index}`)}
                          onLoad={() => handleImageSuccess(`vertical-${index}`)}
                        />
                        {imageErrors[`vertical-${index}`] && (
                          <div className="text-red-500 text-xs mt-1">Failed to load image</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => reorderImage('vertical', index, index - 1)}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Move up"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {index < formData.photos.vertical.length - 1 && (
                      <button
                        type="button"
                        onClick={() => reorderImage('vertical', index, index + 1)}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Move down"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeArrayItem('vertical', index)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {formData.photos.vertical.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No vertical images added</p>
                  <p className="text-xs text-gray-400 mt-1">Add portrait images for mobile display</p>
                </div>
              </div>
            )}
          </div>

          {/* Image Hosting Services */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">Need images? Try these hosting services:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imageHostingServices.map((service) => (
                      <button
                        key={service.name}
                        type="button"
                        onClick={() => openImageHostingService(service.url)}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Summary */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Image Summary:</span>
                <span className="ml-2">
                  {formData.photos.horizontal.filter(img => img.trim() !== '').length} horizontal, 
                  {formData.photos.vertical.filter(img => img.trim() !== '').length} vertical
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {formData.photos.horizontal.filter(img => img.trim() !== '').length === 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">No horizontal images</span>
                )}
                {Object.values(imageErrors).some(error => error) && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Some images failed to load</span>
                )}
              </div>
            </div>
          </div>

          {/* Image Tips */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Image Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Horizontal images: Use landscape photos (16:9 or 4:3 ratio) for best display</li>
                  <li>• Vertical images: Use portrait photos (3:4 or 9:16 ratio) for mobile view</li>
                  <li>• Supported formats: JPG, PNG, WebP</li>
                  <li>• Recommended size: At least 800px wide for horizontal, 600px tall for vertical</li>
                  <li>• First horizontal image will be used as the main cover photo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information - Now handled by ContactInfoAccordion */}

        {/* Partnered-only fields */}
        {formData.partnered && (
          <>
            {/* Availability and Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.form.availability')}
                </label>
                <select
                  value={formData.isOpen ? 'open' : 'closed'}
                  onChange={(e) => setFormData(prev => ({ ...prev, isOpen: e.target.value === 'open' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                >
                  <option value="open">{t('barraca.open')}</option>
                  <option value="closed">{t('barraca.closed')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.form.typicalHours')}
                </label>
                <input
                  type="text"
                  value={formData.typicalHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, typicalHours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Weekend Hours */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900">Weekend Hours</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.weekendHoursEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekendHoursEnabled: e.target.checked }))}
                    className="h-4 w-4 text-beach-600 focus:ring-beach-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Weekend Hours</span>
                </label>
              </div>
              
              {formData.weekendHoursEnabled && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Configure specific hours for Friday, Saturday, and Sunday. These hours will override regular business hours on weekends.
                  </p>
                  
                  {/* Friday Hours */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Friday Hours
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="time"
                          value={formData.weekendHours.friday.open}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            weekendHours: {
                              ...prev.weekendHours,
                              friday: { ...prev.weekendHours.friday, open: e.target.value }
                            }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                        />
                        <span className="flex items-center text-gray-500">to</span>
                        <input
                          type="time"
                          value={formData.weekendHours.friday.close}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            weekendHours: {
                              ...prev.weekendHours,
                              friday: { ...prev.weekendHours.friday, close: e.target.value }
                            }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Saturday Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Saturday Hours
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="time"
                          value={formData.weekendHours.saturday.open}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            weekendHours: {
                              ...prev.weekendHours,
                              saturday: { ...prev.weekendHours.saturday, open: e.target.value }
                            }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                        />
                        <span className="flex items-center text-gray-500">to</span>
                        <input
                          type="time"
                          value={formData.weekendHours.saturday.close}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            weekendHours: {
                              ...prev.weekendHours,
                              saturday: { ...prev.weekendHours.saturday, close: e.target.value }
                            }
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Sunday Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sunday Hours
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={formData.weekendHours.sunday.open}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          weekendHours: {
                            ...prev.weekendHours,
                            sunday: { ...prev.weekendHours.sunday, open: e.target.value }
                          }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                      />
                      <span className="flex items-center text-gray-500">to</span>
                      <input
                        type="time"
                        value={formData.weekendHours.sunday.close}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          weekendHours: {
                            ...prev.weekendHours,
                            sunday: { ...prev.weekendHours.sunday, close: e.target.value }
                          }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Preview */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.form.menuPreview')}
                </label>
                <button
                  type="button"
                  onClick={() => addArrayItem('menuPreview')}
                  className="text-beach-600 hover:text-beach-800 flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('admin.form.addItem')}
                </button>
              </div>
              {formData.menuPreview.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateArrayItem('menuPreview', index, e.target.value)}
                    placeholder="Menu item name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('menuPreview', index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Amenities */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.form.amenities')}
                </label>
                <button
                  type="button"
                  onClick={() => addArrayItem('amenities')}
                  className="text-beach-600 hover:text-beach-800 flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('admin.form.addAmenity')}
                </button>
              </div>
              {formData.amenities.map((amenity, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={amenity}
                    onChange={(e) => updateArrayItem('amenities', index, e.target.value)}
                    placeholder="WiFi, Umbrellas, etc."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('amenities', index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* CTA Buttons Configuration */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">{t('admin.form.ctaButtons')}</h4>
                <div className="flex gap-2">
                  {/* Auto-create Instagram button if Instagram contact is provided */}
                  {formData.contact.instagram && !formData.ctaButtons.some(btn => btn.action.type === 'ig') && (
                    <button
                      type="button"
                      onClick={() => {
                        const instagramValidation = validateInstagramUrl(formData.contact.instagram);
                        if (instagramValidation.isValid) {
                          const newButton: CTAButtonConfig = {
                            id: `instagram-${Date.now()}`,
                            text: 'Follow on Instagram',
                            action: {
                              type: 'ig',
                              value: instagramValidation.formattedUrl,
                              target: '_blank',
                              trackingEvent: 'instagram_follow_clicked'
                            },
                            style: 'outline',
                            position: formData.ctaButtons.length + 1,
                            visibilityConditions: {},
                            icon: 'Instagram',
                            enabled: true
                          };
                          setFormData(prev => ({
                            ...prev,
                            ctaButtons: [...prev.ctaButtons, newButton]
                          }));
                        }
                      }}
                      className="text-xs bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1 rounded-lg transition-colors"
                    >
                      + Instagram Button
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCTAConfig(!showCTAConfig)}
                    className="flex items-center text-beach-600 hover:text-beach-800 text-sm"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {showCTAConfig ? t('common.less') : t('common.more')}
                  </button>
                </div>
              </div>

              {showCTAConfig && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  {formData.ctaButtons.map((button, index) => {
                    const isInstagramButton = button.action.type === 'ig';
                    const instagramValidation = isInstagramButton ? validateInstagramUrl(button.action.value) : null;
                    
                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={button.text}
                          onChange={(e) => updateCTAButton(index, { text: e.target.value })}
                          placeholder={isInstagramButton ? "Follow on Instagram" : "Button text"}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                        />
                        <select
                          value={button.action.type}
                          onChange={(e) => updateCTAButton(index, { action: { ...button.action, type: e.target.value as any } })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                        >
                          {ctaButtonTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={button.action.value}
                            onChange={(e) => updateCTAButton(index, { action: { ...button.action, value: e.target.value } })}
                            placeholder={
                              button.action.type === 'ig' ? 'Instagram username or URL (e.g., @username or https://instagram.com/username)' :
                              button.action.type === 'whatsapp' ? 'Phone number (e.g., +55 21 99999-0000)' :
                              button.action.type === 'email' ? 'Email address' :
                              button.action.type === 'phone' ? 'Phone number' :
                              'URL, phone, email, etc.'
                            }
                            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent ${
                              isInstagramButton && instagramValidation && !instagramValidation.isValid 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                          />
                          {isInstagramButton && instagramValidation && (
                            <div className="text-xs">
                              {!instagramValidation.isValid ? (
                                <span className="text-red-600">{instagramValidation.error}</span>
                              ) : (
                                <span className="text-green-600">
                                  ✓ {instagramValidation.formattedUrl}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={button.style}
                            onChange={(e) => updateCTAButton(index, { style: e.target.value as any })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                          >
                            {ctaButtonStyles.map(style => (
                              <option key={style} value={style}>{style}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeCTAButton(index)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addCTAButton}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-beach-500 hover:text-beach-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Non-partnered message */}
        {!formData.partnered && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {t('admin.form.partneredRequired')}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{t('admin.form.partneredRequiredMessage')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-beach-500 to-beach-600 text-white rounded-lg hover:from-beach-600 hover:to-beach-700 transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center"
          >
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('admin.form.saving') : t('admin.form.save')}
          </button>
        </div>
        </>
      </form>
    </div>
  );
};

export default AdminBarracaForm;