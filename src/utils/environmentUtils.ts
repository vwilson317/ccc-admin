/**
 * Calculates the effective open status of a barraca considering weather override, partnered status, and special admin override
 * @param barraca - The barraca object
 * @param weatherOverride - Whether weather override is active
 * @returns The effective open status (true if open, false if closed, null if undetermined for non-partnered)
 */
export const getEffectiveOpenStatus = (barraca: { 
    isOpen: boolean; 
    partnered: boolean; 
    specialAdminOverride?: boolean; 
    specialAdminOverrideExpires?: Date | null;
  }, weatherOverride: boolean): boolean | null => {
    // Check if special admin override is active and not expired
    if (barraca.specialAdminOverride && barraca.specialAdminOverrideExpires) {
      const now = new Date();
      if (now < barraca.specialAdminOverrideExpires) {
        return true; // Special admin override takes precedence
      }
    }
    
    // Non-partnered barracas have undetermined open status
    if (!barraca.partnered) {
      return null;
    }
    
    return weatherOverride ? false : barraca.isOpen;
  };