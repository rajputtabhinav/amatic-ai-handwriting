import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface ChatUsage {
  userId: string;
  userMessage: string;
  aiResponse: string;
  provider: string;
  model: string;
  tokensUsed?: number;
}

export interface HandwritingUsage {
  userId: string;
  textLength: number;
  style: string;
  exportFormat: string;
  fileUrl?: string;
}

// Log chat usage for billing and analytics
export async function logChatUsage({
  userId,
  userMessage,
  aiResponse,
  tokensUsed
}: ChatUsage): Promise<boolean> {
  try {

    // Log individual messages
    const { error: chatError } = await supabaseAdmin
      .from('ai_chat_messages')
      .insert([
        {
          user_id: userId,
          message_type: 'user',
          content: userMessage,
          tokens_used: 0
        },
        {
          user_id: userId,
          message_type: 'assistant',
          content: aiResponse,
          tokens_used: tokensUsed || 0
        }
      ]);

    if (chatError) {
      logger.dbError('INSERT', 'ai_chat_messages', chatError);
    }

    // Update usage limits using optimized function
    const { error: usageError } = await supabaseAdmin
      .rpc('increment_usage_count', {
        p_user_id: userId,
        p_type: 'chat',
        p_count: 1
      });

    if (usageError) {
      logger.dbError('UPDATE', 'usage_limits', usageError);
      return false;
    }

    return true;
  } catch (error) {
    logger.dbError('INSERT', 'chat usage logging', error);
    return false;
  }
}

// Log handwriting generation usage
export async function logHandwritingUsage({
  userId,
  textLength,
  style,
  exportFormat,
  fileUrl
}: HandwritingUsage): Promise<boolean> {
  try {
    // Log handwriting generation
    const { error: genError } = await supabaseAdmin
      .from('handwriting_generations')
      .insert({
        user_id: userId,
        text_length: textLength,
        style,
        export_format: exportFormat,
        file_url: fileUrl
      });

    if (genError) {
      logger.dbError('INSERT', 'handwriting_generations', genError);
    }

    // Update usage limits using optimized function
    const { error: usageError } = await supabaseAdmin
      .rpc('increment_usage_count', {
        p_user_id: userId,
        p_type: 'handwriting',
        p_count: 1
      });

    if (usageError) {
      logger.dbError('UPDATE', 'usage_limits (handwriting)', usageError);
      return false;
    }

    return true;
  } catch (error) {
    logger.dbError('INSERT', 'handwriting usage logging', error);
    return false;
  }
}

// Check if user has exceeded usage limits
export async function checkUsageLimits(userId: string, type: 'chat' | 'handwriting'): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
}> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get user's current plan and usage
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('subscription_plan, subscription_status')
      .eq('id', userId)
      .single();

    const { data: usage } = await supabaseAdmin
      .from('usage_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single();

    const plan = user?.subscription_plan || 'free';
    const status = user?.subscription_status || 'free';

    // Define limits based on plan
    const limits = {
      free: { chat: 10, handwriting: 10 },
      starter: { chat: 50, handwriting: 500 },
      professional: { chat: 200, handwriting: 2000 },
      enterprise: { chat: -1, handwriting: -1 } // Unlimited
    };

    const planLimits = limits[plan as keyof typeof limits] || limits.free;
    const currentUsage = usage?.[type === 'chat' ? 'chat_messages_count' : 'handwriting_count'] || 0;
    const limit = planLimits[type];

    return {
      allowed: status === 'active' && (limit === -1 || currentUsage < limit),
      current: currentUsage,
      limit: limit === -1 ? 999999 : limit,
      plan: plan
    };

  } catch (error) {
    logger.dbError('SELECT', 'usage limits check', error);
    return { allowed: true, current: 0, limit: 10, plan: 'free' }; // Fail open
  }
}

// Get usage statistics for dashboard using optimized function
export async function getUserUsageStats(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_user_stats_optimized', { p_user_id: userId });

    if (error) {
      logger.dbError('SELECT', 'user usage stats', error);
      return {
        currentMonth: { chat: 0, handwriting: 0 },
        previousMonth: { chat: 0, handwriting: 0 },
        lifetime: { chat: 0, handwriting: 0 }
      };
    }

    return data || {
      currentMonth: { chat: 0, handwriting: 0 },
      previousMonth: { chat: 0, handwriting: 0 },
      lifetime: { chat: 0, handwriting: 0 }
    };

  } catch (error) {
    logger.dbError('SELECT', 'user usage stats', error);
    return {
      currentMonth: { chat: 0, handwriting: 0 },
      previousMonth: { chat: 0, handwriting: 0 },
      lifetime: { chat: 0, handwriting: 0 }
    };
  }
}
