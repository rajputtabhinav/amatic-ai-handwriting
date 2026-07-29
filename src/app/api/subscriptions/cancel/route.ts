import { createProtectedRoute } from '@/lib/api/middleware';
import { getUserByClerkId } from '@/lib/database/users';
import { cancelSubscription } from '@/lib/razorpay';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';

/**
 * POST /api/subscriptions/cancel
 * Cancel user subscription
 */
export const POST = createProtectedRoute(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { cancelAtCycleEnd = true } = body;
    
    // Get user from database
    const user = await getUserByClerkId(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    // Check if user has active subscription
    if (!user.subscription_id) {
      return errorResponse('No active subscription found', 400);
    }
    
    // Get subscription from database
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (subError || !subscription) {
      return errorResponse('Subscription not found', 404);
    }
    
    // Cancel subscription with Razorpay
    const cancelledSubscription = await cancelSubscription(
      subscription.razorpay_subscription_id,
      cancelAtCycleEnd
    );
    
    // Update subscription status in database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: cancelAtCycleEnd ? 'active' : 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);
    
    if (updateError) {
      logger.error('Failed to update subscription status', updateError);
      return errorResponse('Failed to update subscription status', 500);
    }
    
    // Update user subscription status
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_status: cancelAtCycleEnd ? 'active' : 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (userUpdateError) {
      logger.error('Failed to update user subscription status', userUpdateError);
    }
    
    return successResponse({
      message: cancelAtCycleEnd 
        ? 'Subscription will be cancelled at the end of the billing period'
        : 'Subscription cancelled immediately',
      subscription: cancelledSubscription,
      cancelAtCycleEnd,
    });
  } catch (error) {
    logger.error('Subscription cancellation error', error);
    return errorResponse('Failed to cancel subscription', 500, error);
  }
});

