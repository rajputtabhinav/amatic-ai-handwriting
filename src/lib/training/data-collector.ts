/**
 * Training Data Collector
 * 
 * Collects all AI interactions for future model training.
 * Logs queries, reasoning, SVG, timelines, and user feedback.
 */

import { createClient } from '@supabase/supabase-js';
// TODO: Re-enable when svg-generator is implemented
// import { GeneratedSVG } from '../visual/svg-generator';
type GeneratedSVG = any;
import { GeneratedTimeline } from '../visual/timeline-generator';
import { DetailedQueryAnalysis } from '../visual/query-analyzer';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Validate URL is a valid HTTP/HTTPS URL
 */
function isValidSupabaseUrl(url: string | undefined): url is string {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const supabase = isValidSupabaseUrl(supabaseUrl) && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface TrainingLogEntry {
  query: string;
  reasoning?: string;
  svg?: GeneratedSVG;
  timeline?: GeneratedTimeline;
  analysis?: DetailedQueryAnalysis;
  voiceEmotion?: string;
  physicsPreset?: string;
  responseTimeMs?: number;
  userId?: string;
  sessionId?: string;
  // NEW: Quality metrics for agent learning
  qualityScore?: number;        // 0-100 score from validator
  attemptsTaken?: number;       // How many retries needed
  qualityGrade?: string;        // 'excellent' | 'good' | 'fair' | 'poor'
  elementCount?: number;        // Number of elements generated
}

export interface FeedbackEntry {
  logId: string;
  type: 'thumbs_up' | 'thumbs_down' | 'report';
  text?: string;
  category?: string;
  userId?: string;
}

export interface TrainingStats {
  totalLogs: number;
  thumbsUp: number;
  thumbsDown: number;
  approvalRate: number;
  avgResponseTime: number;
  topTopics: { topic: string; count: number }[];
}

/**
 * Training Data Collector Class
 */
export class DataCollector {
  private enabled: boolean;
  private buffer: TrainingLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.enabled = !!supabase;
    
    // Flush buffer periodically
    if (typeof window !== 'undefined' && this.enabled) {
      this.flushInterval = setInterval(() => this.flush(), 30000);
    }
  }

  /**
   * Check if collector is enabled
   */
  get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a training entry
   */
  async log(entry: TrainingLogEntry): Promise<string | null> {
    if (!this.enabled || !supabase) {
      // Buffer locally if not connected
      this.buffer.push(entry);
      console.debug('Training data buffered (no database connection)');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('reasoning_logs')
        .insert({
          user_query: entry.query,
          reasoning_text: entry.reasoning || null,
          generated_svg: entry.svg?.code || null,
          timeline_json: entry.timeline ? {
            title: entry.timeline.title,
            duration: entry.timeline.duration,
            scenes: entry.timeline.scenes
          } : null,
          detected_audience: entry.analysis?.audience || null,
          detected_emotion: entry.analysis?.emotion || null,
          detected_topic: entry.analysis?.topic || null,
          visual_style: entry.analysis?.visualStyle || null,
          voice_emotion: entry.voiceEmotion || null,
          physics_preset: entry.physicsPreset || entry.analysis?.suggestedPhysicsPreset || null,
          response_time_ms: entry.responseTimeMs || null,
          svg_element_count: entry.elementCount || entry.svg?.elements.length || null,
          timeline_scene_count: entry.timeline?.scenes.length || null,
          user_id: entry.userId || null,
          session_id: entry.sessionId || null,
          // NEW: Quality metrics for learning
          quality_score: entry.qualityScore || null,
          attempts_taken: entry.attemptsTaken || null,
          quality_grade: entry.qualityGrade || null
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to log training data:', error);
        this.buffer.push(entry);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Training log error:', error);
      this.buffer.push(entry);
      return null;
    }
  }

  /**
   * Add user feedback
   */
  async addFeedback(feedback: FeedbackEntry): Promise<boolean> {
    if (!this.enabled || !supabase) {
      console.debug('Feedback skipped (no database connection)');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          reasoning_log_id: feedback.logId,
          feedback_type: feedback.type,
          feedback_text: feedback.text || null,
          feedback_category: feedback.category || null,
          user_id: feedback.userId || null
        });

      if (error) {
        console.error('Failed to add feedback:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Feedback error:', error);
      return false;
    }
  }

  /**
   * Get training statistics
   */
  async getStats(): Promise<TrainingStats | null> {
    if (!this.enabled || !supabase) {
      return null;
    }

    try {
      // Get total counts
      const { data: logs, error: logsError } = await supabase
        .from('reasoning_logs')
        .select('id, response_time_ms, detected_topic', { count: 'exact' });

      if (logsError) throw logsError;

      // Get feedback counts
      const { data: thumbsUp, error: upError } = await supabase
        .from('user_feedback')
        .select('id', { count: 'exact' })
        .eq('feedback_type', 'thumbs_up');

      if (upError) throw upError;

      const { data: thumbsDown, error: downError } = await supabase
        .from('user_feedback')
        .select('id', { count: 'exact' })
        .eq('feedback_type', 'thumbs_down');

      if (downError) throw downError;

      // Calculate stats
      const totalLogs = logs?.length || 0;
      const thumbsUpCount = thumbsUp?.length || 0;
      const thumbsDownCount = thumbsDown?.length || 0;
      const totalFeedback = thumbsUpCount + thumbsDownCount;
      
      const avgResponseTime = logs?.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / Math.max(totalLogs, 1);

      // Get top topics
      const topicCounts: Record<string, number> = {};
      logs?.forEach(log => {
        if (log.detected_topic) {
          topicCounts[log.detected_topic] = (topicCounts[log.detected_topic] || 0) + 1;
        }
      });

      const topTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalLogs,
        thumbsUp: thumbsUpCount,
        thumbsDown: thumbsDownCount,
        approvalRate: totalFeedback > 0 ? (thumbsUpCount / totalFeedback) * 100 : 0,
        avgResponseTime,
        topTopics
      };
    } catch (error) {
      console.error('Stats error:', error);
      return null;
    }
  }

  /**
   * Flush buffered entries
   */
  async flush(): Promise<void> {
    if (!this.enabled || !supabase || this.buffer.length === 0) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    for (const entry of entries) {
      await this.log(entry);
    }
  }

  /**
   * Export training data for model training
   */
  async exportForTraining(options?: {
    minApprovalRate?: number;
    topics?: string[];
    limit?: number;
  }): Promise<TrainingLogEntry[]> {
    if (!this.enabled || !supabase) {
      return [];
    }

    try {
      let query = supabase
        .from('reasoning_logs')
        .select(`
          user_query,
          reasoning_text,
          generated_svg,
          timeline_json,
          detected_audience,
          detected_emotion,
          detected_topic,
          visual_style,
          voice_emotion,
          physics_preset
        `);

      if (options?.topics && options.topics.length > 0) {
        query = query.in('detected_topic', options.topics);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(row => ({
        query: row.user_query,
        reasoning: row.reasoning_text,
        svg: row.generated_svg ? {
          code: row.generated_svg,
          elements: [],
          physics: { world: { gravity: { x: 0, y: 0 } }, elements: [] },
          metadata: { query: row.user_query, style: row.visual_style, audience: row.detected_audience, generatedAt: new Date() }
        } : undefined,
        analysis: {
          audience: row.detected_audience,
          emotion: row.detected_emotion,
          topic: row.detected_topic,
          visualStyle: row.visual_style,
          voiceTone: row.voice_emotion
        } as any,
        voiceEmotion: row.voice_emotion,
        physicsPreset: row.physics_preset
      })) || [];
    } catch (error) {
      console.error('Export error:', error);
      return [];
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

/**
 * Create data collector instance
 */
export function createDataCollector(): DataCollector {
  return new DataCollector();
}

/**
 * Singleton instance
 */
let globalCollector: DataCollector | null = null;

export function getDataCollector(): DataCollector {
  if (!globalCollector) {
    globalCollector = new DataCollector();
  }
  return globalCollector;
}

/**
 * Quick log function
 */
export async function logTrainingData(entry: TrainingLogEntry): Promise<string | null> {
  return getDataCollector().log(entry);
}

/**
 * Quick feedback function
 */
export async function logFeedback(feedback: FeedbackEntry): Promise<boolean> {
  return getDataCollector().addFeedback(feedback);
}

// Default export
export default {
  DataCollector,
  createDataCollector,
  getDataCollector,
  logTrainingData,
  logFeedback
};

