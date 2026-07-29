-- Migration: 002_functions_and_triggers
-- Description: Database functions and triggers
-- Date: 2025-01-05

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

