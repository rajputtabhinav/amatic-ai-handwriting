-- Migration: 003_row_level_security
-- Description: Enable Row Level Security policies
-- Date: 2025-01-05

-- Enable RLS on all tables
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

