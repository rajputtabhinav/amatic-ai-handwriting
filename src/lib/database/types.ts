export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_status: 'free' | 'active' | 'cancelled' | 'past_due';
  subscription_plan?: 'starter' | 'professional' | 'enterprise';
  subscription_id?: string;
  referral_code: string;
  referred_by?: string;
  total_earnings: number;
  available_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  razorpay_subscription_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'halted' | 'cancelled' | 'completed' | 'expired';
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  subscription_id?: string;
  commission_amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method?: string;
  payment_details?: Record<string, unknown>;
  razorpay_payout_id?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface HandwritingGeneration {
  id: string;
  user_id: string;
  text_length: number;
  style: string;
  export_format: 'pdf' | 'jpg';
  file_url?: string;
  created_at: string;
}

export interface AIChatMessage {
  id: string;
  user_id: string;
  message_type: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  created_at: string;
}

export interface UsageLimit {
  id: string;
  user_id: string;
  month_year: string; // YYYY-MM format
  handwriting_count: number;
  chat_messages_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

// Plan configuration types
export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: {
    handwriting_limit: number | null; // null means unlimited
    handwriting_styles: number | null;
    chat_messages_per_day: number | null;
    batch_processing: boolean;
    custom_templates: boolean;
    api_access: boolean;
    priority_support: boolean;
    phone_support: boolean;
  };
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Razorpay webhook payload types
export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: Record<string, unknown>;
    };
    subscription?: {
      entity: Record<string, unknown>;
    };
  };
  created_at: number;
}
