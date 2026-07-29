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
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id)
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
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
  export_format VARCHAR(10) NOT NULL, -- pdf, jpg
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI chat messages table (usage tracking)
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- YYYY-MM format
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

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_limits_updated_at BEFORE UPDATE ON usage_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_referral_code BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION set_referral_code();

-- Function to increment usage counts atomically
CREATE OR REPLACE FUNCTION increment_usage_count(
    p_user_id UUID,
    p_type TEXT,
    p_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    current_month TEXT;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Insert or update usage limits
    INSERT INTO usage_limits (user_id, month_year, handwriting_count, chat_messages_count)
    VALUES (
        p_user_id,
        current_month,
        CASE WHEN p_type = 'handwriting' THEN p_count ELSE 0 END,
        CASE WHEN p_type = 'chat' THEN p_count ELSE 0 END
    )
    ON CONFLICT (user_id, month_year)
    DO UPDATE SET
        handwriting_count = CASE 
            WHEN p_type = 'handwriting' THEN usage_limits.handwriting_count + p_count
            ELSE usage_limits.handwriting_count
        END,
        chat_messages_count = CASE 
            WHEN p_type = 'chat' THEN usage_limits.chat_messages_count + p_count
            ELSE usage_limits.chat_messages_count
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get optimized user statistics
CREATE OR REPLACE FUNCTION get_user_stats_optimized(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_month TEXT;
    previous_month TEXT;
    result JSON;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    previous_month := TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM');
    
    SELECT json_build_object(
        'currentMonth', json_build_object(
            'chat', COALESCE((SELECT chat_messages_count FROM usage_limits 
                WHERE user_id = p_user_id AND month_year = current_month), 0),
            'handwriting', COALESCE((SELECT handwriting_count FROM usage_limits 
                WHERE user_id = p_user_id AND month_year = current_month), 0)
        ),
        'previousMonth', json_build_object(
            'chat', COALESCE((SELECT chat_messages_count FROM usage_limits 
                WHERE user_id = p_user_id AND month_year = previous_month), 0),
            'handwriting', COALESCE((SELECT handwriting_count FROM usage_limits 
                WHERE user_id = p_user_id AND month_year = previous_month), 0)
        ),
        'lifetime', json_build_object(
            'chat', COALESCE((SELECT COUNT(*) FROM ai_chat_messages 
                WHERE user_id = p_user_id AND message_type = 'user'), 0),
            'handwriting', COALESCE((SELECT COUNT(*) FROM handwriting_generations 
                WHERE user_id = p_user_id), 0)
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
-- NOTE: This app uses Clerk for authentication, not Supabase Auth.
-- The following RLS policies are designed to work with service role access.
-- For client-side access with Clerk, you need to:
-- 1. Configure Supabase to accept Clerk JWT tokens, OR
-- 2. Use the service role key on the backend (which bypasses RLS), OR
-- 3. Disable RLS and handle authorization in your API routes
-- Current implementation uses option #2 (supabaseAdmin with service role)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE handwriting_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Service role bypass - allows backend operations
CREATE POLICY "Service role bypass" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass referrals" ON referrals
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass payouts" ON payouts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass generations" ON handwriting_generations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass chat" ON ai_chat_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass usage" ON usage_limits
    FOR ALL USING (auth.role() = 'service_role');

-- If you configure Clerk JWT integration with Supabase, uncomment these policies:
-- They assume clerk_user_id is passed in JWT claims
/*
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (
        referrer_id IN (
            SELECT id FROM users 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        ) OR
        referee_id IN (
            SELECT id FROM users 
            WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );
*/
