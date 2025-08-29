import { supabase } from '../lib/supabase';
import { EmailSubscription } from '../types';

// Transform database row to EmailSubscription type
const transformEmailSubscriptionFromDB = (row: any): EmailSubscription => {
  try {
    return {
      email: row.email,
      subscribedAt: new Date(row.subscribed_at),
      preferences: {
        newBarracas: row.preferences?.newBarracas ?? false,
        specialOffers: row.preferences?.specialOffers ?? false,
      },
    };
  } catch (error) {
    console.error('Error transforming email subscription from DB:', error);
    console.error('Row data:', row);
    throw error;
  }
};

export class EmailSubscriptionService {
  // Get all active email subscriptions
  static async getAll(): Promise<EmailSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('email_subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('subscribed_at', { ascending: false });

      if (error) {
        console.error('Error fetching email subscriptions:', error);
        throw new Error(`Failed to fetch email subscriptions: ${error.message}`);
      }

      return data.map(transformEmailSubscriptionFromDB);
    } catch (error) {
      console.error('Error in getAll email subscriptions:', error);
      throw error;
    }
  }

  // Get email subscription count
  static async getCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('email_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching email subscription count:', error);
        throw new Error(`Failed to fetch email subscription count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCount email subscriptions:', error);
      throw error;
    }
  }

  // Subscribe a new email
  static async subscribe(email: string, preferences?: { newBarracas?: boolean; specialOffers?: boolean }): Promise<EmailSubscription> {
    try {
      const subscriptionData = {
        email,
        subscribed_at: new Date().toISOString(),
        preferences: preferences || { newBarracas: true, specialOffers: true },
        is_active: true,
        unsubscribe_token: crypto.randomUUID(),
      };

      const { data, error } = await supabase
        .from('email_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error('Error subscribing email:', error);
        throw new Error(`Failed to subscribe email: ${error.message}`);
      }

      return transformEmailSubscriptionFromDB(data);
    } catch (error) {
      console.error('Error in subscribe email:', error);
      throw error;
    }
  }

  // Check if email is already subscribed
  static async isSubscribed(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_subscriptions')
        .select('id')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking email subscription:', error);
        throw new Error(`Failed to check email subscription: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      console.error('Error in isSubscribed:', error);
      throw error;
    }
  }

  // Unsubscribe an email
  static async unsubscribe(email: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .update({ is_active: false })
        .eq('email', email);

      if (error) {
        console.error('Error unsubscribing email:', error);
        throw new Error(`Failed to unsubscribe email: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in unsubscribe email:', error);
      throw error;
    }
  }
}
