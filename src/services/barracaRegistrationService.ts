import { supabase } from '../lib/supabase';
import { BarracaRegistration } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Transform registration data to database format
const transformRegistrationToDB = (registration: Omit<BarracaRegistration, 'id' | 'submittedAt' | 'status'>): any => ({
  id: uuidv4(),
  name: registration.name,
  owner_name: registration.ownerName,
  barraca_number: registration.barracaNumber || null,
  location: registration.location,
  coordinates: registration.coordinates,
  typical_hours: registration.typicalHours,
  description: registration.description,
  nearest_posto: registration.nearestPosto || null,
  contact: registration.contact,
  amenities: registration.amenities,
  environment: registration.environment,
  default_photo: registration.defaultPhoto || null,
  weekend_hours_enabled: registration.weekendHoursEnabled,
  weekend_hours: registration.weekendHours || null,
  additional_info: registration.additionalInfo || null,
  // Partnership opportunities
  qr_codes: registration.qrCodes || false,
  repeat_discounts: registration.repeatDiscounts || false,
  hotel_partnerships: registration.hotelPartnerships || false,
  content_creation: registration.contentCreation || false,
  online_orders: registration.onlineOrders || false,
  // Contact preferences for photos and status updates
  contact_for_photos: registration.contactForPhotos || false,
  contact_for_status: registration.contactForStatus || false,
  preferred_contact_method: registration.preferredContactMethod || null,
  status: 'pending',
  submitted_at: new Date().toISOString(),
  reviewed_at: null,
  reviewed_by: null,
  admin_notes: null
});

// Transform database row to registration object
const transformRegistrationFromDB = (row: any): BarracaRegistration => {
  try {
    return {
  id: row.id,
  name: row.name,
  ownerName: row.owner_name,
  barracaNumber: row.barraca_number,
  location: row.location,
  coordinates: row.coordinates,
  typicalHours: row.typical_hours,
  description: row.description,
  nearestPosto: row.nearest_posto,
  contact: {
    phone: (row.contact && row.contact.phone) ? row.contact.phone : '',
    email: (row.contact && row.contact.email) ? row.contact.email : '',
    instagram: (row.contact && row.contact.instagram) ? row.contact.instagram : undefined,
    website: (row.contact && row.contact.website) ? row.contact.website : undefined
  },
  amenities: row.amenities || [],
  environment: row.environment || [],
  defaultPhoto: row.default_photo,
  weekendHoursEnabled: row.weekend_hours_enabled || false,
  weekendHours: row.weekend_hours,
  additionalInfo: row.additional_info,
  // Partnership opportunities
  qrCodes: row.qr_codes || false,
  repeatDiscounts: row.repeat_discounts || false,
  hotelPartnerships: row.hotel_partnerships || false,
  contentCreation: row.content_creation || false,
  onlineOrders: row.online_orders || false,
  // Contact preferences for photos and status updates
  contactForPhotos: row.contact_for_photos || false,
  contactForStatus: row.contact_for_status || false,
  preferredContactMethod: row.preferred_contact_method,
  status: row.status,
  submittedAt: new Date(row.submitted_at),
  reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
  reviewedBy: row.reviewed_by,
  adminNotes: row.admin_notes
    };
  } catch (error) {
    console.error('Error in transformRegistrationFromDB:', error);
    console.error('Row data:', row);
    throw error;
  }
};

export class BarracaRegistrationService {
  // Submit a new barraca registration
  static async submit(registration: Omit<BarracaRegistration, 'id' | 'submittedAt' | 'status'>): Promise<BarracaRegistration> {
    try {
      const registrationData = transformRegistrationToDB(registration);

      const { data, error } = await supabase
        .from('barraca_registrations')
        .insert(registrationData)
        .select()
        .single();

      if (error) {
        console.error('Error submitting registration:', error);
        throw new Error(`Failed to submit registration: ${error.message}`);
      }

      const result = transformRegistrationFromDB(data);

      // Send email notification (keeping Twilio setup for later)
      try {
        console.log('Sending email notification for new registration:', result.id);
        
        await fetch('/.netlify/functions/email-whatsapp-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration: result,
            adminEmail: import.meta.env.VITE_ADMIN_EMAIL || 'admin@yourdomain.com'
          })
        });

        console.log('Email notification sent successfully');
      } catch (notificationError) {
        console.error('Failed to send email notification:', notificationError);
        // Don't fail the registration if notification fails
      }

      return result;
    } catch (error) {
      console.error('Error in submit registration:', error);
      throw error;
    }
  }

  // Get all registrations (admin only)
  static async getAll(
    page: number = 1,
    pageSize: number = 20,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<{ registrations: BarracaRegistration[], total: number }> {
    try {
      let query = supabase
        .from('barraca_registrations')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('submitted_at', { ascending: false });
      query = query.range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching registrations:', error);
        throw new Error(`Failed to fetch registrations: ${error.message}`);
      }

      const registrations = data?.map(transformRegistrationFromDB) || [];
      return { registrations, total: count || 0 };
    } catch (error) {
      console.error('Error in getAll registrations:', error);
      throw error;
    }
  }

  // Get a single registration by ID
  static async getById(id: string): Promise<BarracaRegistration | null> {
    try {
      const { data, error } = await supabase
        .from('barraca_registrations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching registration:', error);
        throw new Error(`Failed to fetch registration: ${error.message}`);
      }

      return transformRegistrationFromDB(data);
    } catch (error) {
      console.error('Error in getById registration:', error);
      throw error;
    }
  }

  // Update registration status (admin only)
  static async updateStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<BarracaRegistration> {
    try {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy || 'admin'
      };

      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('barraca_registrations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating registration status:', error);
        throw new Error(`Failed to update registration status: ${error.message}`);
      }

      return transformRegistrationFromDB(data);
    } catch (error) {
      console.error('Error in updateStatus registration:', error);
      throw error;
    }
  }

  // Convert approved registration to barraca
  static async convertToBarraca(registrationId: string): Promise<any> {
    try {
      console.log('Starting conversion of registration:', registrationId);
      
      // First get the registration
      const registration = await this.getById(registrationId);
      if (!registration) {
        throw new Error('Registration not found');
      }

      console.log('Found registration:', registration.name, 'Status:', registration.status);

      if (registration.status !== 'approved') {
        throw new Error('Can only convert approved registrations');
      }

      // Import the barraca service to create the barraca
      const { BarracaService } = await import('./barracaService');
      
      // Convert registration data to barraca format
      const barracaData = {
        name: registration.name,
        barracaNumber: registration.barracaNumber,
        location: registration.location,
        coordinates: registration.coordinates,
        isOpen: true, // Default to open
        typicalHours: registration.typicalHours,
        description: registration.description,
        photos: { horizontal: [], vertical: [] }, // Empty photos initially
        menuPreview: [], // Initialize empty menu preview
        contact: {
          phone: registration.contact?.phone || '',
          email: registration.contact?.email || '',
          instagram: registration.contact?.instagram || undefined,
          website: registration.contact?.website || undefined
        },
        amenities: registration.amenities || [],
        weatherDependent: false, // Default to not weather dependent
        partnered: false, // Default to non-partnered
        weekendHoursEnabled: registration.weekendHoursEnabled || false,
        weekendHours: registration.weekendHours || undefined,
        manualStatus: 'undefined' as const,
        specialAdminOverride: false,
        specialAdminOverrideExpires: null,
        rating: undefined,
        ctaButtons: []
      };

      console.log('Creating barraca with data:', barracaData);

      // Create the barraca
      const barraca = await BarracaService.create(barracaData);

      console.log('Barraca created successfully:', barraca.id);

      // Update registration to mark as converted
      await this.updateStatus(registrationId, 'approved', 'Converted to barraca', 'system');

      console.log('Registration updated successfully');

      return barraca;
    } catch (error) {
      console.error('Error converting registration to barraca:', error);
      throw error;
    }
  }

  // Delete a registration (admin only)
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('barraca_registrations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting registration:', error);
        throw new Error(`Failed to delete registration: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in delete registration:', error);
      throw error;
    }
  }

  // Get registration statistics
  static async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('barraca_registrations')
        .select('status');

      if (error) {
        console.error('Error fetching registration stats:', error);
        throw new Error(`Failed to fetch registration stats: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        pending: data?.filter((r: any) => r.status === 'pending').length || 0,
        approved: data?.filter((r: any) => r.status === 'approved').length || 0,
        rejected: data?.filter((r: any) => r.status === 'rejected').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error in getStats registration:', error);
      throw error;
    }
  }
}
