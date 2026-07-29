-- Migration: 001_initial_schema
-- Description: Initial database schema with all tables
-- Date: 2025-01-05

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Clerk user data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  subscription_status VARCHAR(50) DEFAULT 'free',
  subscription_plan VARCHAR(50),
  subscription_id VARCHAR(255),
  referral_code VARCHAR(50) UNIQUE,
  referred_by UUID REFERENCES users(id),
  total_earnings DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  plan_id VARCHAR(100) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  payment_details JSONB,
  razorpay_payout_id VARCHAR(255),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Handwriting generations table (usage tracking)
CREATE TABLE IF NOT EXISTS handwriting_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text_length INTEGER NOT NULL,
  style VARCHAR(100) NOT NULL,
  export_format VARCHAR(10) NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI chat messages table (usage tracking)
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL,
  handwriting_count INTEGER DEFAULT 0,
  chat_messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Webhook events table (for Razorpay webhooks)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_handwriting_user_id ON handwriting_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usage_limits(user_id, month_year);

