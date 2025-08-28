import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Eye, Check, X, Clock, MapPin, Phone, Mail, Calendar, MessageSquare } from 'lucide-react';
import { BarracaRegistration } from '../types';
import { BarracaRegistrationService } from '../services/barracaRegistrationService';

interface AdminRegistrationsProps {
  onRegistrationConverted?: () => void;
}

const AdminRegistrations: React.FC<AdminRegistrationsProps> = ({ onRegistrationConverted }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<BarracaRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<BarracaRegistration | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRegistrations();
    loadStats();
  }, [selectedStatus]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const { registrations: data } = await BarracaRegistrationService.getAll(1, 50, status);
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await BarracaRegistrationService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewRegistration = (registration: BarracaRegistration) => {
    // Navigate to the registration detail page in the same tab
    navigate(`/registration/${registration.id}`);
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;
    
    try {
      setProcessing(true);
      console.log('Starting approval process for registration:', selectedRegistration.id);
      
      // First update the status
      console.log('Updating registration status to approved...');
      await BarracaRegistrationService.updateStatus(
        selectedRegistration.id!,
        'approved',
        adminNotes,
        'admin'
      );
      console.log('Registration status updated successfully');
      
      // Convert to barraca if approved
      console.log('Converting registration to barraca...');
      await BarracaRegistrationService.convertToBarraca(selectedRegistration.id!);
      console.log('Registration converted to barraca successfully');
      
      setShowModal(false);
      setSelectedRegistration(null);
      setAdminNotes('');
      
      // Refresh data
      loadRegistrations();
      loadStats();
      
      if (onRegistrationConverted) {
        onRegistrationConverted();
      }
      
      // Show success message
      alert('Registration approved and converted to barraca successfully!');
    } catch (error) {
      console.error('Error approving registration:', error);
      alert(`Failed to approve registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration) return;
    
    try {
      setProcessing(true);
      await BarracaRegistrationService.updateStatus(
        selectedRegistration.id!,
        'rejected',
        adminNotes,
        'admin'
      );
      
      setShowModal(false);
      setSelectedRegistration(null);
      setAdminNotes('');
      
      // Refresh data
      loadRegistrations();
      loadStats();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this registration?')) return;
    
    try {
      await BarracaRegistrationService.delete(id);
      loadRegistrations();
      loadStats();
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert('Failed to delete registration');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getWhatsAppLink = (phone: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beach-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
              <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-1.5 sm:p-2 rounded-lg">
              <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
              <Check className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-red-100 p-1.5 sm:p-2 rounded-lg">
              <X className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-4 pb-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
              selectedStatus === status
                ? 'bg-beach-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Registrations List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {registrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No registrations found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {registrations.map(registration => (
              <div key={registration.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {registration.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {registration.barracaNumber && (
                          <span className="text-sm text-gray-500">
                            #{registration.barracaNumber}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                          {getStatusIcon(registration.status)}
                          <span className="ml-1">{registration.status}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{registration.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium flex-shrink-0 text-xs sm:text-sm">Owner:</span>
                        <span className="truncate">{registration.ownerName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <a
                          href={getWhatsAppLink(registration.contact.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-beach-600 hover:text-beach-700 underline-offset-2 hover:underline"
                          title="Abrir no WhatsApp"
                        >
                          {registration.contact.phone}
                        </a>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{registration.contact.email}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm line-clamp-2 mb-2">
                      {registration.description}
                    </p>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500">
                        Submitted {formatDate(registration.submittedAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-1 sm:space-x-2 sm:ml-4">
                    <button
                      onClick={() => handleViewRegistration(registration)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {registration.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setShowModal(true);
                          }}
                          className="p-1.5 sm:p-2 text-green-400 hover:text-green-600 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setShowModal(true);
                          }}
                          className="p-1.5 sm:p-2 text-red-400 hover:text-red-600 transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Detail Modal */}
      {showModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Registration Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900 break-words">{selectedRegistration.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                      <p className="mt-1 text-sm text-gray-900 break-words">{selectedRegistration.ownerName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Barraca Number</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRegistration.barracaNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="mt-1 text-sm text-gray-900 break-words">{selectedRegistration.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hours</label>
                      <p className="mt-1 text-sm text-gray-900 break-words">{selectedRegistration.typicalHours}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nearest Posto</label>
                      <p className="mt-1 text-sm text-gray-900 break-words">{selectedRegistration.nearestPosto}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900 break-all">
                        <a
                          href={getWhatsAppLink(selectedRegistration.contact.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-beach-600 hover:text-beach-700 underline-offset-2 hover:underline"
                        >
                          {selectedRegistration.contact.phone}
                        </a>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900 break-all">{selectedRegistration.contact.email}</p>
                    </div>
                    {selectedRegistration.contact.instagram && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Instagram</label>
                        <p className="mt-1 text-sm text-gray-900 break-all">{selectedRegistration.contact.instagram}</p>
                      </div>
                    )}
                    {selectedRegistration.contact.website && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <p className="mt-1 text-sm text-gray-900 break-all">{selectedRegistration.contact.website}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-sm text-gray-900">{selectedRegistration.description}</p>
                </div>

                {/* Default Photo */}
                {selectedRegistration.defaultPhoto && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Photo</label>
                    <div className="mt-2">
                      <img 
                        src={selectedRegistration.defaultPhoto} 
                        alt="Barraca photo" 
                        className="w-full max-w-md h-32 sm:h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                )}



                {/* Amenities */}
                {selectedRegistration.amenities.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegistration.amenities.map((amenity, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Environment */}
                {selectedRegistration.environment && selectedRegistration.environment.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegistration.environment.map((env, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {env}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Partnership Opportunities */}
                {(selectedRegistration.qrCodes || selectedRegistration.repeatDiscounts || selectedRegistration.hotelPartnerships || selectedRegistration.contentCreation || selectedRegistration.onlineOrders) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Partnership Opportunities</h3>
                    <div className="space-y-2">
                      {selectedRegistration.qrCodes && (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">QR Codes on Furniture</span>
                        </div>
                      )}
                      {selectedRegistration.repeatDiscounts && (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Repeat Customer Discounts</span>
                        </div>
                      )}
                      {selectedRegistration.hotelPartnerships && (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Hotel Partnerships</span>
                        </div>
                      )}
                      {selectedRegistration.contentCreation && (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Content Creation</span>
                        </div>
                      )}
                      {selectedRegistration.onlineOrders && (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Online Orders</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Preferences */}
                {(selectedRegistration.contactForPhotos || selectedRegistration.contactForStatus) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Preferences</h3>
                    <div className="space-y-2">
                      {selectedRegistration.contactForPhotos && (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Contact for Photos</span>
                        </div>
                      )}
                      {selectedRegistration.contactForStatus && (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Contact for Status Updates</span>
                        </div>
                      )}
                      {selectedRegistration.preferredContactMethod && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">Preferred Method:</span>
                          <span className="text-sm text-gray-600 capitalize">{selectedRegistration.preferredContactMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {selectedRegistration.additionalInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.additionalInfo}</p>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-beach-500 focus:border-transparent"
                    placeholder="Add notes about this registration..."
                  />
                </div>

                {/* Action Buttons */}
                {selectedRegistration.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Approve & Convert to Barraca</span>
                      <span className="sm:hidden">Approve</span>
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={processing}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrations;
