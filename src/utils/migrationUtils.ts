import { supabase } from '../lib/supabase';

/**
 * Utility functions for running database migrations
 */

export interface MigrationResult {
  success: boolean;
  updated: number;
  totalBarracas: number;
  totalRegistrations: number;
  errors?: string[];
}

/**
 * Migration: Update existing barracas with Instagram data from their original registrations
 */
export async function updateBarracasWithInstagram(): Promise<MigrationResult> {
  console.log('🚀 Starting Instagram migration...');
  
  const result: MigrationResult = {
    success: false,
    updated: 0,
    totalBarracas: 0,
    totalRegistrations: 0,
    errors: []
  };

  try {
    // Step 1: Get all barracas
    const { data: allBarracas, error: barracasError } = await supabase
      .from('barracas')
      .select('id, name, contact');

    if (barracasError) {
      result.errors?.push(`Error fetching barracas: ${barracasError.message}`);
      return result;
    }

    result.totalBarracas = allBarracas?.length || 0;

    // Step 2: Get all registrations with Instagram data
    const { data: registrations, error: registrationsError } = await supabase
      .from('barraca_registrations')
      .select('id, name, contact, status')
      .not('contact->instagram', 'is', null)
      .not('contact->instagram', 'eq', '');

    if (registrationsError) {
      result.errors?.push(`Error fetching registrations: ${registrationsError.message}`);
      return result;
    }

    result.totalRegistrations = registrations?.length || 0;

    if (!allBarracas || allBarracas.length === 0) {
      result.success = true;
      return result;
    }

    // Step 3: Find barracas that need Instagram updates
    const updates = [];

    for (const barraca of allBarracas) {
      // Check if barraca already has Instagram
      const hasInstagram = barraca.contact?.instagram && 
                          barraca.contact.instagram.trim() !== '';

      if (hasInstagram) {
        continue; // Skip barracas that already have Instagram
      }

      // Try to find matching registration by name (case-insensitive)
      const matchingRegistration = registrations?.find(reg => 
        reg.name.toLowerCase().trim() === barraca.name.toLowerCase().trim() &&
        reg.contact?.instagram &&
        reg.contact.instagram.trim() !== ''
      );

      if (matchingRegistration) {
        console.log(`🔗 Found match: "${barraca.name}" -> "@${matchingRegistration.contact.instagram}"`);
        
        // Update the barraca's contact info with Instagram
        const updatedContact = {
          ...barraca.contact,
          instagram: matchingRegistration.contact.instagram
        };

        updates.push({
          id: barraca.id,
          name: barraca.name,
          contact: updatedContact,
          instagram: matchingRegistration.contact.instagram
        });
      }
    }

    // Step 4: Perform updates
    if (updates.length > 0) {
      console.log(`🔄 Updating ${updates.length} barracas with Instagram data...`);
      
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('barracas')
          .update({ 
            contact: update.contact,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (updateError) {
          const errorMsg = `Error updating barraca "${update.name}": ${updateError.message}`;
          console.error(`❌ ${errorMsg}`);
          result.errors?.push(errorMsg);
        } else {
          console.log(`✅ Updated "${update.name}" with Instagram: @${update.instagram}`);
          result.updated++;
        }
      }
    }

    result.success = true;
    console.log(`🎉 Migration completed! Updated ${result.updated} barracas`);
    
    return result;

  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('💥', errorMsg);
    result.errors?.push(errorMsg);
    return result;
  }
}

/**
 * Dry run version - shows what would be updated without making changes
 */
export async function updateBarracasWithInstagramDryRun(): Promise<{
  barracasWithoutInstagram: number;
  registrationsWithInstagram: number;
  potentialMatches: number;
  matches: Array<{
    barraca: string;
    registration: string;
    instagram: string;
  }>;
}> {
  console.log('🔍 DRY RUN: Analyzing barracas and registrations for Instagram updates');
  
  try {
    // Get all barracas
    const { data: allBarracas, error: barracasError } = await supabase
      .from('barracas')
      .select('id, name, contact');

    if (barracasError) throw barracasError;

    // Get registrations with Instagram
    const { data: registrations, error: registrationsError } = await supabase
      .from('barraca_registrations')
      .select('id, name, contact, status')
      .not('contact->instagram', 'is', null)
      .not('contact->instagram', 'eq', '');

    if (registrationsError) throw registrationsError;

    // Count barracas without Instagram
    const barracasWithoutInstagram = allBarracas?.filter(barraca => {
      const hasInstagram = barraca.contact?.instagram && 
                          barraca.contact.instagram.trim() !== '';
      return !hasInstagram;
    }).length || 0;

    const matches = [];
    
    for (const barraca of allBarracas || []) {
      // Check if barraca already has Instagram
      const hasInstagram = barraca.contact?.instagram && 
                          barraca.contact.instagram.trim() !== '';

      if (hasInstagram) {
        continue; // Skip barracas that already have Instagram
      }

      const matchingRegistration = registrations?.find(reg => 
        reg.name.toLowerCase().trim() === barraca.name.toLowerCase().trim() &&
        reg.contact?.instagram &&
        reg.contact.instagram.trim() !== ''
      );

      if (matchingRegistration) {
        matches.push({
          barraca: barraca.name,
          registration: matchingRegistration.name,
          instagram: matchingRegistration.contact.instagram
        });
      }
    }

    return {
      barracasWithoutInstagram,
      registrationsWithInstagram: registrations?.length || 0,
      potentialMatches: matches.length,
      matches
    };

  } catch (error) {
    console.error('💥 Dry run failed:', error);
    throw error;
  }
}
