import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature, calculateReferralCommission } from '@/lib/razorpay';
import { supabaseAdmin } from '@/lib/supabase';
import { RazorpayWebhookPayload } from '@/lib/database/types';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Validate webhook signature
    const isValid = validateWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload: RazorpayWebhookPayload = JSON.parse(body);

    // Store webhook event for processing
    await supabaseAdmin
      .from('webhook_events')
      .insert({
        event_id: payload.payload.payment?.entity.id || payload.payload.subscription?.entity.id,
        event_type: payload.event,
        payload: payload,
        processed: false,
      });

    // Process different event types
    switch (payload.event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(payload);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      
      default:
        logger.warn(`Unhandled webhook event: ${payload.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(payload: RazorpayWebhookPayload) {
  try {
    const subscription = payload.payload.subscription?.entity;
    if (!subscription) return;

    // Get customer details from Razorpay
    // Note: In a real implementation, you'd make an API call to get customer details
    
    // Cast subscription to a more specific type
    const sub = subscription as {
      id: string;
      plan_id: string;
      status: string;
      current_start: number;
      current_end: number;
    };

    // Update user subscription status
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        razorpay_subscription_id: sub.id,
        plan_id: sub.plan_id,
        plan_name: sub.plan_id.includes('professional') ? 'Professional' : 
                   sub.plan_id.includes('enterprise') ? 'Enterprise' : 'Starter',
        amount: sub.plan_id.includes('professional') ? 599 :
                sub.plan_id.includes('enterprise') ? 799 : 299,
        currency: 'INR',
        status: sub.status,
        current_period_start: new Date(sub.current_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_end * 1000).toISOString(),
      });

    logger.info(`Subscription activated: ${sub.id}`);
  } catch (error) {
    logger.error('Error handling subscription activation:', error);
  }
}

async function handleSubscriptionCancelled(payload: RazorpayWebhookPayload) {
  try {
    const subscription = payload.payload.subscription?.entity;
    if (!subscription) return;

    const sub = subscription as { id: string };

    // Update subscription status
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', sub.id);

    logger.info(`Subscription cancelled: ${sub.id}`);
  } catch (error) {
    logger.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  try {
    const payment = payload.payload.payment?.entity;
    if (!payment) return;

    const pay = payment as {
      id: string;
      amount: number;
      notes?: {
        referrer_id?: string;
        user_id?: string;
      };
    };

    // If this payment is for a subscription with a referral, process commission
    if (pay.notes && pay.notes.referrer_id) {
      const commissionAmount = calculateReferralCommission(pay.amount);
      
      // Create referral record
      await supabaseAdmin
        .from('referrals')
        .insert({
          referrer_id: pay.notes.referrer_id,
          referee_id: pay.notes.user_id,
          commission_amount: commissionAmount / 100, // Convert paise to rupees
          status: 'completed',
        });

      // Update referrer's earnings
      await supabaseAdmin.rpc('increment_user_earnings', {
        user_id: pay.notes.referrer_id,
        amount: commissionAmount / 100,
      });
    }

    logger.info(`Payment captured: ${pay.id}`);
  } catch (error) {
    logger.error('Error handling payment capture:', error);
  }
}
