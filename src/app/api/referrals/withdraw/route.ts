import { createProtectedRoute } from '@/lib/api/middleware';
import { getUserByClerkId } from '@/lib/database/users';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';

const MINIMUM_WITHDRAWAL = 300; // ₹300 minimum

/**
 * POST /api/referrals/withdraw
 * Request withdrawal of referral earnings
 */
export const POST = createProtectedRoute(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { amount, paymentMethod, paymentDetails } = body;
    
    // Validate amount
    if (!amount || amount < MINIMUM_WITHDRAWAL) {
      return errorResponse(`Minimum withdrawal amount is ₹${MINIMUM_WITHDRAWAL}`, 400);
    }
    
    // Get user from database
    const user = await getUserByClerkId(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    // Check if user has sufficient balance
    if (user.available_balance < amount) {
      return errorResponse('Insufficient balance', 400);
    }
    
    // Create payout request
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from('payouts')
      .insert({
        user_id: user.id,
        amount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_details: paymentDetails,
      })
      .select()
      .single();
    
    if (payoutError) {
      logger.error('Failed to create payout request', payoutError);
      return errorResponse('Failed to create payout request', 500);
    }
    
    // Deduct from available balance (will be restored if payout fails)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        available_balance: user.available_balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (updateError) {
      logger.error('Failed to update user balance', updateError);
      return errorResponse('Failed to update user balance', 500);
    }
    
    return successResponse({
      message: 'Withdrawal request submitted successfully',
      payout,
      remainingBalance: user.available_balance - amount,
    }, 201);
  } catch (error) {
    logger.error('Withdrawal request error', error);
    return errorResponse('Failed to process withdrawal request', 500, error);
  }
});

/**
 * GET /api/referrals/withdraw
 * Get withdrawal history
 */
export const GET = createProtectedRoute(async (_request, { userId }) => {
  try {
    const user = await getUserByClerkId(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    const { data: payouts, error } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Failed to fetch payouts', error);
      return errorResponse('Failed to fetch withdrawal history', 500);
    }
    
    return successResponse({
      payouts,
      availableBalance: user.available_balance,
      totalEarnings: user.total_earnings,
    });
  } catch (error) {
    logger.error('Fetch withdrawal history error', error);
    return errorResponse('Failed to fetch withdrawal history', 500, error);
  }
});

