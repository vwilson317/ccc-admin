/**
 * Instagram Migration Script (CommonJS version)
 * This script updates existing barracas with Instagram data from their original registrations
 * 
 * Usage: node src/scripts/runInstagramMigration.cjs [dry]
 * - For dry run: node src/scripts/runInstagramMigration.cjs dry
 * - For actual migration: node src/scripts/runInstagramMigration.cjs
 */

// Load environment variables from .env.local file
const fs = require('fs');
const path = require('path');

// Load .env.local file
try {
  const envPath = path.join(__dirname, '../../.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  
  console.log('✅ Loaded environment variables from .env.local');
} catch (error) {
  console.warn('⚠️  Could not load .env.local file:', error.message);
  console.log('Make sure to run this script from the project root directory');
}

async function updateBarracasWithInstagram() {
  console.log('🚀 Starting Instagram migration...');
  
  const result = {
    success: false,
    updated: 0,
    totalBarracas: 0,
    totalRegistrations: 0,
    errors: []
  };

  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables:');
      console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
      console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
      console.error('');
      console.error('Please make sure your .env.local file exists and contains:');
      console.error('   VITE_SUPABASE_URL=your_supabase_url');
      console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Get all barracas
    console.log('📋 Fetching barracas...');
    const { data: allBarracas, error: barracasError } = await supabase
      .from('barracas')
      .select('id, name, contact');

    if (barracasError) {
      result.errors.push(`Error fetching barracas: ${barracasError.message}`);
      return result;
    }

    result.totalBarracas = allBarracas?.length || 0;
    console.log(`📊 Found ${result.totalBarracas} barracas`);

    // Step 2: Get all registrations with Instagram data
    console.log('📋 Fetching registrations with Instagram data...');
    const { data: registrations, error: registrationsError } = await supabase
      .from('barraca_registrations')
      .select('id, name, contact, status');

    if (registrationsError) {
      result.errors.push(`Error fetching registrations: ${registrationsError.message}`);
      return result;
    }

    // Filter registrations that have Instagram data
    const registrationsWithInstagram = registrations?.filter(reg => 
      reg.contact?.instagram && 
      reg.contact.instagram.trim() !== ''
    ) || [];
    
    result.totalRegistrations = registrationsWithInstagram.length;
    console.log(`📊 Found ${result.totalRegistrations} registrations with Instagram data`);

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
      const matchingRegistration = registrationsWithInstagram.find(reg => 
        reg.name.toLowerCase().trim() === barraca.name.toLowerCase().trim()
      );

      if (matchingRegistration) {
        // Update the barraca's contact info with Instagram
        // Ensure only one @ symbol at the beginning
        let instagramHandle = matchingRegistration.contact.instagram.trim();
        if (instagramHandle.startsWith('@@')) {
          instagramHandle = '@' + instagramHandle.substring(2);
        } else if (!instagramHandle.startsWith('@')) {
          instagramHandle = '@' + instagramHandle;
        }
        
        console.log(`🔗 Found match: "${barraca.name}" -> "${instagramHandle}"`);
        
        const updatedContact = {
          ...barraca.contact,
          instagram: instagramHandle
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
          result.errors.push(errorMsg);
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
    const errorMsg = `Migration failed: ${error.message}`;
    console.error('💥', errorMsg);
    result.errors.push(errorMsg);
    return result;
  }
}

async function updateBarracasWithInstagramDryRun() {
  console.log('🔍 DRY RUN: Analyzing barracas and registrations for Instagram updates');
  
  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables:');
      console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
      console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
      console.error('');
      console.error('Please make sure your .env.local file exists and contains:');
      console.error('   VITE_SUPABASE_URL=your_supabase_url');
      console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all barracas
    const { data: allBarracas, error: barracasError } = await supabase
      .from('barracas')
      .select('id, name, contact');

    if (barracasError) throw barracasError;

    // Get registrations with Instagram
    const { data: registrations, error: registrationsError } = await supabase
      .from('barraca_registrations')
      .select('id, name, contact, status');

    if (registrationsError) throw registrationsError;

    // Count barracas without Instagram
    const barracasWithoutInstagram = allBarracas?.filter(barraca => {
      const hasInstagram = barraca.contact?.instagram && 
                          barraca.contact.instagram.trim() !== '';
      return !hasInstagram;
    }).length || 0;

    // Filter registrations that have Instagram data
    const registrationsWithInstagram = registrations?.filter(reg => 
      reg.contact?.instagram && 
      reg.contact.instagram.trim() !== ''
    ) || [];

    const matches = [];
    
    for (const barraca of allBarracas || []) {
      // Check if barraca already has Instagram
      const hasInstagram = barraca.contact?.instagram && 
                          barraca.contact.instagram.trim() !== '';

      if (hasInstagram) {
        continue; // Skip barracas that already have Instagram
      }

      const matchingRegistration = registrationsWithInstagram.find(reg => 
        reg.name.toLowerCase().trim() === barraca.name.toLowerCase().trim()
      );

      if (matchingRegistration) {
        // Ensure only one @ symbol at the beginning
        let instagramHandle = matchingRegistration.contact.instagram.trim();
        if (instagramHandle.startsWith('@@')) {
          instagramHandle = '@' + instagramHandle.substring(2);
        } else if (!instagramHandle.startsWith('@')) {
          instagramHandle = '@' + instagramHandle;
        }
        
        matches.push({
          barraca: barraca.name,
          registration: matchingRegistration.name,
          instagram: instagramHandle
        });
      }
    }

    return {
      barracasWithoutInstagram,
      registrationsWithInstagram: registrationsWithInstagram.length,
      potentialMatches: matches.length,
      matches
    };

  } catch (error) {
    console.error('💥 Dry run failed:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('dry') || args.includes('--dry-run');

  console.log('🚀 Instagram Migration Script');
  console.log('============================');
  
  if (isDryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made');
    console.log('');
    
    try {
      const result = await updateBarracasWithInstagramDryRun();
      
      console.log('');
      console.log('📊 DRY RUN RESULTS:');
      console.log(`  - Barracas without Instagram: ${result.barracasWithoutInstagram}`);
      console.log(`  - Registrations with Instagram: ${result.registrationsWithInstagram}`);
      console.log(`  - Potential matches: ${result.potentialMatches}`);
      
      if (result.matches.length > 0) {
        console.log('');
        console.log('🔗 Matches that would be updated:');
        result.matches.forEach((match, index) => {
          // Ensure only one @ symbol for display
          let displayInstagram = match.instagram;
          if (displayInstagram.startsWith('@@')) {
            displayInstagram = '@' + displayInstagram.substring(2);
          } else if (!displayInstagram.startsWith('@')) {
            displayInstagram = '@' + displayInstagram;
          }
          console.log(`  ${index + 1}. "${match.barraca}" -> "${displayInstagram}"`);
        });
      }
      
    } catch (error) {
      console.error('💥 Dry run failed:', error);
      process.exit(1);
    }
  } else {
    console.log('⚠️  Running ACTUAL migration - changes will be made to the database');
    console.log('');
    
    // Ask for confirmation (in a real scenario, you might want to add a prompt)
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      const result = await updateBarracasWithInstagram();
      
      console.log('');
      console.log('🎉 MIGRATION COMPLETED:');
      console.log(`  - Success: ${result.success}`);
      console.log(`  - Updated barracas: ${result.updated}`);
      console.log(`  - Total barracas checked: ${result.totalBarracas}`);
      console.log(`  - Total registrations checked: ${result.totalRegistrations}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('');
        console.log('❌ Errors encountered:');
        result.errors.forEach(error => {
          console.log(`  - ${error}`);
        });
      }
      
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  }
}

// Run the script
main().catch(console.error);
