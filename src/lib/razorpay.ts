import Razorpay from 'razorpay';
import crypto from 'crypto';
import { logger } from './logger';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || 
    process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id_here' || 
    process.env.RAZORPAY_KEY_SECRET === 'your_razorpay_key_secret_here') {
  logger.warn('Razorpay not configured - payment features will be disabled');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'placeholder_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

export const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'plan_starter_monthly',
    name: 'Starter',
    amount: 29900, // Amount in paise (₹299)
    currency: 'INR',
    interval: 1,
    period: 'monthly' as const,
    features: {
      handwriting_limit: 500,
      handwriting_styles: 3,
      chat_messages_per_day: 50,
      batch_processing: false,
      custom_templates: false,
      api_access: false,
      priority_support: false,
      phone_support: false,
      cloud_storage_gb: 2,
    },
  },
  basic: {
    id: 'plan_basic_monthly',
    name: 'Basic',
    amount: 59900, // Amount in paise (₹599)
    currency: 'INR',
    interval: 1,
    period: 'monthly' as const,
    features: {
      handwriting_limit: 1500,
      handwriting_styles: 5,
      chat_messages_per_day: 100,
      batch_processing: false,
      custom_templates: 'basic',
      api_access: false,
      priority_support: true,
      phone_support: false,
      cloud_storage_gb: 5,
    },
  },
  standard: {
    id: 'plan_standard_monthly',
    name: 'Standard',
    amount: 99900, // Amount in paise (₹999)
    currency: 'INR',
    interval: 1,
    period: 'monthly' as const,
    features: {
      handwriting_limit: 3000,
      handwriting_styles: 10,
      chat_messages_per_day: 250,
      batch_processing: true,
      custom_templates: true,
      api_access: false,
      priority_support: true,
      phone_support: false,
      cloud_storage_gb: 15,
    },
  },
  professional: {
    id: 'plan_professional_monthly',
    name: 'Professional',
    amount: 149900, // Amount in paise (₹1,499)
    currency: 'INR',
    interval: 1,
    period: 'monthly' as const,
    features: {
      handwriting_limit: 6000,
      handwriting_styles: 15,
      chat_messages_per_day: 500,
      batch_processing: true,
      custom_templates: true,
      api_access: 'basic',
      priority_support: true,
      phone_support: true,
      cloud_storage_gb: 30,
    },
  },
  business: {
    id: 'plan_business_monthly',
    name: 'Business',
    amount: 199900, // Amount in paise (₹1,999)
    currency: 'INR',
    interval: 1,
    period: 'monthly' as const,
    features: {
      handwriting_limit: 12000,
      handwriting_styles: 20,
      chat_messages_per_day: 1000,
      batch_processing: true,
      custom_templates: true,
      api_access: 'full',
      priority_support: true,
      phone_support: true,
      cloud_storage_gb: 100,
      team_members: 5,
    },
  },
  premium: {
    id: 'plan_premium_monthly',
    name: 'Premium',
    amount: 299900, // Amount in paise (₹2,999)
    currency: 'INR',
    interval: 1,
    period: 'monthly' as const,
    features: {
      handwriting_limit: 25000,
      handwriting_styles: 25,
      chat_messages_per_day: null, // Unlimited
      batch_processing: true,
      custom_templates: true,
      api_access: 'full',
      priority_support: true,
      phone_support: true,
      cloud_storage_gb: 250,
      team_members: 15,
      priority_features: true,
    },
  },
  enterprise: {
    id: 'plan_enterprise_monthly',
    name: 'Enterprise',
    amount: 399900, // Amount in paise (₹3,999)
    currency: 'INR',
    interval: 1,
    period: 'monthly' as const,
    features: {
      handwriting_limit: null, // Unlimited
      handwriting_styles: null, // All styles + Custom
      chat_messages_per_day: null, // Unlimited
      batch_processing: true,
      custom_templates: true,
      api_access: 'full',
      priority_support: true,
      phone_support: true,
      cloud_storage_gb: null, // Unlimited
      team_members: null, // Unlimited
      white_label: true,
      custom_integrations: true,
      sla_guarantee: true,
      account_manager: true,
    },
  },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

export async function createSubscriptionPlan(planType: PlanType) {
  const plan = SUBSCRIPTION_PLANS[planType];
  
  try {
    const razorpayPlan = await razorpay.plans.create({
      period: plan.period,
      interval: plan.interval,
      item: {
        name: `Amatic.ai ${plan.name} Plan`,
        amount: plan.amount,
        currency: plan.currency,
      },
    });

    return razorpayPlan;
  } catch (error) {
    logger.error('Error creating Razorpay plan', error);
    throw error;
  }
}

export async function createSubscription(planId: string, customerId: string, totalCount?: number) {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: totalCount || 12, // 12 months by default
      addons: [],
      notes: {
        customer_id: customerId,
        created_via: 'amatic_web_app',
      },
    });

    return subscription;
  } catch (error) {
    logger.error('Error creating Razorpay subscription', error);
    throw error;
  }
}

export async function createCustomer(customerData: {
  name: string;
  email: string;
  contact?: string;
}) {
  try {
    const customer = await razorpay.customers.create({
      name: customerData.name,
      email: customerData.email,
      contact: customerData.contact,
      fail_existing: 0,
    });

    return customer;
  } catch (error) {
    logger.error('Error creating Razorpay customer', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true) {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);

    return subscription;
  } catch (error) {
    logger.error('Error cancelling Razorpay subscription', error);
    throw error;
  }
}

export function calculateReferralCommission(planAmount: number): number {
  // Platform keeps ₹100 (10000 paise), rest goes to referrer
  const platformFee = 10000; // ₹100 in paise
  return Math.max(0, planAmount - platformFee);
}

export function validateWebhookSignature(webhookBody: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(webhookBody)
    .digest('hex');
  
  return expectedSignature === signature;
}
