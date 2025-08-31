import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Globe,
  Calendar,
  Star,
  Building2,
  Users,
  Wifi,
  Car,
  Music,
  Baby,
  Heart,
  Shield,
  Zap,
  Camera,
  MessageSquare,
  FileText,
  Edit3
} from 'lucide-react';
import { BarracaRegistration } from '../types';
import { BarracaRegistrationService } from '../services/barracaRegistrationService';
import { registrationLogger } from '../utils/sentryLogger';
import toast from 'react-hot-toast';

const RegistrationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [registration, setRegistration] = useState<BarracaRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (id) {
      loadRegistration(id);
    }
  }, [id]);

  const loadRegistration = async (registrationId: string) => {
    try {
      setLoading(true);
      registrationLogger.info('Loading registration', { registrationId });
      
      const data = await BarracaRegistrationService.getById(registrationId);
      setRegistration(data);
      if (data?.adminNotes) {
        setAdminNotes(data.adminNotes);
      }
      
      registrationLogger.info('Registration loaded successfully', { 
        registrationId, 
        status: data?.status 
      });
    } catch (error) {
      registrationLogger.error('Error loading registration', error, { registrationId });
      toast.error('Failed to load registration details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!registration || !id) return;

    try {
      setUpdating(true);
      registrationLogger.trackAction('status_update_started', id, { status, hasAdminNotes: !!adminNotes });
      
      await BarracaRegistrationService.updateStatus(id, status, adminNotes);
      
      toast.success(`Registration ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      registrationLogger.info('Registration status updated successfully', { 
        registrationId: id, 
        newStatus: status 
      });
      
      // Reload the registration to show updated status
      await loadRegistration(id);
      
    } catch (error) {
      registrationLogger.error('Error updating status', error, { 
        registrationId: id, 
        attemptedStatus: status 
      });
      toast.error('Failed to update registration status');
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToBarraca = async () => {
    if (!registration || !id) return;

    try {
      setUpdating(true);
      registrationLogger.trackAction('convert_to_barraca_started', id);
      
      await BarracaRegistrationService.convertToBarraca(id);
      toast.success('Registration converted to barraca successfully');
      
      registrationLogger.info('Registration converted to barraca successfully', { registrationId: id });
      navigate('/admin');
    } catch (error) {
      registrationLogger.error('Error converting to barraca', error, { registrationId: id });
      toast.error('Failed to convert registration to barraca');
    } finally {
      setUpdating(false);
    }
  };

  const handleBackClick = () => {
    registrationLogger.trackAction('back_button_clicked');
    navigate('/admin');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5" />;
      case 'rejected': return <XCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getEnvironmentIcon = (environment: string) => {
    switch (environment.toLowerCase()) {
      case 'familiar': return <Baby className="h-4 w-4" />;
      case 'lgbtq+': return <Heart className="h-4 w-4" />;
      case 'seguro': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wi-fi') || amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (amenityLower.includes('estacionamento') || amenityLower.includes('parking')) return <Car className="h-4 w-4" />;
    if (amenityLower.includes('música') || amenityLower.includes('music')) return <Music className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-beach-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registration details...</p>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Registration not found</h2>
          <p className="mt-2 text-gray-600">The registration you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 bg-beach-500 text-white rounded-lg hover:bg-beach-600"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBackClick}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium text-sm">Back to Admin</span>
            </button>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(registration.status)}`}>
              {getStatusIcon(registration.status)}
              <span className="font-medium capitalize">{registration.status}</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{registration.name}</h1>
            <p className="text-gray-600 mt-1">Registration #{registration.id}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo */}
            {registration.defaultPhoto && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Photo</h2>
                <div className="flex justify-center">
                  <div className="relative w-80 h-60 bg-gray-100 rounded-lg overflow-hidden shadow-md">
                    <img
                      src={registration.defaultPhoto}
                      alt={`${registration.name} photo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="text-center text-gray-500">
                        <Camera className="h-12 w-12 mx-auto mb-2" />
                        <p>Photo could not be loaded</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Barraca Name</label>
                  <p className="text-lg font-medium">{registration.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Owner Name</label>
                  <p className="text-lg font-medium">{registration.ownerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Barraca Number</label>
                  <p className="text-lg font-medium">{registration.barracaNumber || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="text-lg font-medium">{registration.location}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nearest Posto</label>
                  <p className="text-lg font-medium">{registration.nearestPosto || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Typical Hours</label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-lg font-medium">{registration.typicalHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed">{registration.description}</p>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registration.contact.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{registration.contact.phone}</p>
                      <p className="text-sm text-gray-500">Phone</p>
                    </div>
                  </div>
                )}
                {registration.contact.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{registration.contact.email}</p>
                      <p className="text-sm text-gray-500">Email</p>
                    </div>
                  </div>
                )}
                {registration.contact.instagram && (
                  <div className="flex items-center space-x-3">
                    <Instagram className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{registration.contact.instagram}</p>
                      <p className="text-sm text-gray-500">Instagram</p>
                    </div>
                  </div>
                )}
                {registration.contact.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{registration.contact.website}</p>
                      <p className="text-sm text-gray-500">Website</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities & Environment */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Amenities & Environment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Amenities</h3>
                  <div className="space-y-2">
                    {registration.amenities.length > 0 ? (
                      registration.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {getAmenityIcon(amenity)}
                          <span className="text-gray-700">{amenity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No amenities specified</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Environment</h3>
                  <div className="space-y-2">
                    {registration.environment.length > 0 ? (
                      registration.environment.map((env, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {getEnvironmentIcon(env)}
                          <span className="text-gray-700">{env}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No environment types specified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekend Hours */}
            {registration.weekendHoursEnabled && registration.weekendHours && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Weekend Hours</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(registration.weekendHours).map(([day, hours]) => (
                    <div key={day} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium capitalize">{day}</p>
                      <p className="text-sm text-gray-600">
                        {hours.open} - {hours.close}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partnership Opportunities */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Partnership Opportunities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Zap className={`h-4 w-4 ${registration.qrCodes ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={registration.qrCodes ? 'text-gray-700' : 'text-gray-400'}>QR Codes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className={`h-4 w-4 ${registration.repeatDiscounts ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={registration.repeatDiscounts ? 'text-gray-700' : 'text-gray-400'}>Repeat Discounts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className={`h-4 w-4 ${registration.hotelPartnerships ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={registration.hotelPartnerships ? 'text-gray-700' : 'text-gray-400'}>Hotel Partnerships</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Camera className={`h-4 w-4 ${registration.contentCreation ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={registration.contentCreation ? 'text-gray-700' : 'text-gray-400'}>Content Creation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className={`h-4 w-4 ${registration.onlineOrders ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={registration.onlineOrders ? 'text-gray-700' : 'text-gray-400'}>Online Orders</span>
                </div>
              </div>
            </div>

            {/* Contact Preferences */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Camera className={`h-4 w-4 ${registration.contactForPhotos ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={registration.contactForPhotos ? 'text-gray-700' : 'text-gray-400'}>
                    Contact for Photos
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className={`h-4 w-4 ${registration.contactForStatus ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={registration.contactForStatus ? 'text-gray-700' : 'text-gray-400'}>
                    Contact for Status Updates
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">
                    Preferred Contact: {registration.preferredContactMethod || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* English Fluency & Tab System */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">English Fluency & Tab System</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">English Fluency</h3>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700 capitalize">
                      {registration.englishFluency === 'no' && 'No English speakers'}
                      {registration.englishFluency === 'not_fluent' && 'Not fluent'}
                      {registration.englishFluency === 'fluent' && 'Fluent English speakers'}
                    </span>
                  </div>
                  {registration.englishFluency === 'fluent' && registration.englishSpeakerNames && (
                    <div className="mt-2 pl-6">
                      <span className="text-sm text-gray-600">Names: </span>
                      <span className="text-gray-700">{registration.englishSpeakerNames}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Tab System</h3>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {registration.tabSystem === 'name_only' && 'Name only'}
                      {registration.tabSystem === 'individual_paper' && 'Individual paper tab'}
                      {registration.tabSystem === 'number_on_chair' && 'Number on chair'}
                      {registration.tabSystem === 'digital' && 'Digital (app or system-based)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {registration.additionalInfo && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                <p className="text-gray-700 leading-relaxed">{registration.additionalInfo}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              
              {registration.status === 'pending' && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updating}
                    className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                    className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {registration.status === 'approved' && (
                <button
                  onClick={handleConvertToBarraca}
                  disabled={updating}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Convert to Barraca</span>
                </button>
              )}

              {/* Admin Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                  placeholder="Add notes about this registration..."
                />
              </div>
            </div>

            {/* Registration Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Registration Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted</label>
                  <p className="text-gray-700">
                    {new Date(registration.submittedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                {registration.reviewedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reviewed</label>
                    <p className="text-gray-700">
                      {new Date(registration.reviewedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {registration.reviewedBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reviewed By</label>
                    <p className="text-gray-700">{registration.reviewedBy}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Registration ID</label>
                  <p className="text-sm text-gray-500 font-mono">{registration.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationDetail;
