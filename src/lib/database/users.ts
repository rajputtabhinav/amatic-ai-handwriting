import { supabase, supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { User } from './types';

export async function createUser(userData: {
  clerk_user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  referred_by?: string;
}): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        clerk_user_id: userData.clerk_user_id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        referred_by: userData.referred_by,
      }])
      .select()
      .single();

    if (error) {
      logger.dbError('INSERT', 'users', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.dbError('INSERT', 'users', error);
    return null;
  }
}

export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      logger.dbError('SELECT', 'users', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.dbError('SELECT', 'users', error);
    return null;
  }
}

export async function getUserByReferralCode(referralCode: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    if (error) {
      logger.dbError('SELECT', 'users (by referral code)', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.dbError('SELECT', 'users (by referral code)', error);
    return null;
  }
}

export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'full_name' | 'avatar_url'>>
): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.dbError('UPDATE', 'users', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.dbError('UPDATE', 'users', error);
    return null;
  }
}

export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    subscription_status: string;
    subscription_plan?: string;
    subscription_id?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update(subscriptionData)
      .eq('id', userId);

    if (error) {
      logger.dbError('UPDATE', 'users subscription', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.dbError('UPDATE', 'users subscription', error);
    return false;
  }
}

export async function updateUserEarnings(
  userId: string,
  earningsData: {
    total_earnings?: number;
    available_balance?: number;
  }
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update(earningsData)
      .eq('id', userId);

    if (error) {
      logger.dbError('UPDATE', 'users earnings', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.dbError('UPDATE', 'users earnings', error);
    return false;
  }
}

export async function getUserStats(userId: string) {
  try {
    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const [usageResult, referralsResult, handwritingResult] = await Promise.all([
      supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .single(),
      
      supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId),
      
      supabase
        .from('handwriting_generations')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    return {
      usage: usageResult.data || { handwriting_count: 0, chat_messages_count: 0 },
      referrals: referralsResult.data || [],
      handwriting_generations: handwritingResult.data || [],
    };
  } catch (error) {
    logger.dbError('SELECT', 'user stats', error);
    return {
      usage: { handwriting_count: 0, chat_messages_count: 0 },
      referrals: [],
      handwriting_generations: [],
    };
  }
}
