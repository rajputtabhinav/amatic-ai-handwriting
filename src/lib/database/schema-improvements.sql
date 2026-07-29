-- Additional database optimizations and indexes

-- Improved indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_chat_messages_user_created 
ON ai_chat_messages(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_handwriting_generations_user_created 
ON handwriting_generations(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_limits_user_month_updated 
ON usage_limits(user_id, month_year, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status_period 
ON subscriptions(status, current_period_end);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_status_created 
ON referrals(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_events_processed_created 
ON webhook_events(processed, created_at DESC);

-- Partial indexes for better performance on common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_subscription 
ON users(id) WHERE subscription_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_pending 
ON referrals(referrer_id, created_at) WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_pending 
ON payouts(user_id, created_at) WHERE status = 'pending';

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_limits_composite 
ON usage_limits(user_id, month_year, handwriting_count, chat_messages_count);

-- Function to get user stats with optimized query
CREATE OR REPLACE FUNCTION get_user_stats_optimized(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_month TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
    previous_month TEXT := to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM');
    result JSON;
BEGIN
    WITH current_usage AS (
        SELECT 
            COALESCE(chat_messages_count, 0) as chat,
            COALESCE(handwriting_count, 0) as handwriting
        FROM usage_limits 
        WHERE user_id = p_user_id AND month_year = current_month
    ),
    previous_usage AS (
        SELECT 
            COALESCE(chat_messages_count, 0) as chat,
            COALESCE(handwriting_count, 0) as handwriting
        FROM usage_limits 
        WHERE user_id = p_user_id AND month_year = previous_month
    ),
    lifetime_stats AS (
        SELECT 
            COUNT(CASE WHEN message_type = 'user' THEN 1 END) as total_chat_messages,
            (SELECT COUNT(*) FROM handwriting_generations WHERE user_id = p_user_id) as total_handwriting
        FROM ai_chat_messages 
        WHERE user_id = p_user_id
    )
    SELECT json_build_object(
        'currentMonth', json_build_object(
            'chat', COALESCE(c.chat, 0),
            'handwriting', COALESCE(c.handwriting, 0)
        ),
        'previousMonth', json_build_object(
            'chat', COALESCE(p.chat, 0),
            'handwriting', COALESCE(p.handwriting, 0)
        ),
        'lifetime', json_build_object(
            'chat', COALESCE(l.total_chat_messages, 0),
            'handwriting', COALESCE(l.total_handwriting, 0)
        )
    ) INTO result
    FROM current_usage c
    FULL OUTER JOIN previous_usage p ON true
    FULL OUTER JOIN lifetime_stats l ON true;
    
    RETURN COALESCE(result, '{
        "currentMonth": {"chat": 0, "handwriting": 0},
        "previousMonth": {"chat": 0, "handwriting": 0},
        "lifetime": {"chat": 0, "handwriting": 0}
    }'::json);
END;
$$ LANGUAGE plpgsql STABLE;

-- Improved usage logging function with better performance
CREATE OR REPLACE FUNCTION increment_usage_count(
    p_user_id UUID,
    p_type TEXT,
    p_count INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    current_month TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
BEGIN
    IF p_type = 'chat' THEN
        INSERT INTO usage_limits (user_id, month_year, chat_messages_count, handwriting_count)
        VALUES (p_user_id, current_month, p_count, 0)
        ON CONFLICT (user_id, month_year)
        DO UPDATE SET 
            chat_messages_count = usage_limits.chat_messages_count + p_count,
            updated_at = NOW();
    ELSIF p_type = 'handwriting' THEN
        INSERT INTO usage_limits (user_id, month_year, chat_messages_count, handwriting_count)
        VALUES (p_user_id, current_month, 0, p_count)
        ON CONFLICT (user_id, month_year)
        DO UPDATE SET 
            handwriting_count = usage_limits.handwriting_count + p_count,
            updated_at = NOW();
    ELSE
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment user earnings (for referral commissions)
CREATE OR REPLACE FUNCTION increment_user_earnings(
    user_id UUID,
    amount DECIMAL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET 
        total_earnings = total_earnings + amount,
        available_balance = available_balance + amount,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add constraints for data integrity
ALTER TABLE users ADD CONSTRAINT chk_subscription_status 
    CHECK (subscription_status IN ('free', 'starter', 'professional', 'enterprise'));

ALTER TABLE subscriptions ADD CONSTRAINT chk_subscription_status 
    CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid'));

ALTER TABLE referrals ADD CONSTRAINT chk_referral_status 
    CHECK (status IN ('pending', 'completed', 'failed'));

ALTER TABLE payouts ADD CONSTRAINT chk_payout_status 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add check constraints for positive values
ALTER TABLE usage_limits ADD CONSTRAINT chk_positive_counts 
    CHECK (handwriting_count >= 0 AND chat_messages_count >= 0);

ALTER TABLE subscriptions ADD CONSTRAINT chk_positive_amount 
    CHECK (amount > 0);

ALTER TABLE referrals ADD CONSTRAINT chk_positive_commission 
    CHECK (commission_amount >= 0);

ALTER TABLE payouts ADD CONSTRAINT chk_positive_payout_amount 
    CHECK (amount > 0);

-- Materialized view for analytics (optional - for reporting)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_usage_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.subscription_plan,
    u.subscription_status,
    u.created_at as user_created_at,
    COALESCE(current_usage.chat_messages_count, 0) as current_month_chat,
    COALESCE(current_usage.handwriting_count, 0) as current_month_handwriting,
    COALESCE(lifetime_chat.total_messages, 0) as lifetime_chat_messages,
    COALESCE(lifetime_handwriting.total_generations, 0) as lifetime_handwriting_generations,
    u.total_earnings,
    u.available_balance
FROM users u
LEFT JOIN usage_limits current_usage ON (
    u.id = current_usage.user_id 
    AND current_usage.month_year = to_char(CURRENT_DATE, 'YYYY-MM')
)
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_messages
    FROM ai_chat_messages 
    WHERE message_type = 'user'
    GROUP BY user_id
) lifetime_chat ON u.id = lifetime_chat.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_generations
    FROM handwriting_generations 
    GROUP BY user_id
) lifetime_handwriting ON u.id = lifetime_handwriting.user_id;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_user_usage_summary_user_id 
ON user_usage_summary(user_id);

CREATE INDEX IF NOT EXISTS idx_user_usage_summary_plan 
ON user_usage_summary(subscription_plan);

-- Schedule to refresh materialized view (run this manually or via cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY user_usage_summary;
