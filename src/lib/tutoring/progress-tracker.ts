/**
 * Progress Tracking System
 * 
 * Monitors and persists user learning progress across sessions.
 * Integrates with database to track mastery and understanding.
 */

import { createClient } from '@/lib/supabase';

export interface LearningProgress {
  id: string;
  userId: string;
  concept: string;
  understandingScore: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  completedSteps: number[];
  totalSteps: number;
  timeSpentSeconds: number;
  questionsAsked: number;
  repeatRequests: number;
  correctActions: number;
  totalActions: number;
  masteryAchieved: boolean;
  masteryDate?: Date;
  attemptsCount: number;
  firstAttempt: Date;
  lastInteraction: Date;
}

export interface SessionData {
  progressId: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  stepsCompleted: number;
  questionsAsked: number;
  interactionsCount: number;
  understandingScoreStart: number;
  understandingScoreEnd?: number;
  difficultyLevel: string;
}

/**
 * Progress Tracker
 */
export class ProgressTracker {
  private supabase = createClient();
  private userId: string;
  private currentSession: SessionData | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get or create progress for a concept
   */
  async getProgress(concept: string): Promise<LearningProgress | null> {
    const { data, error } = await this.supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', this.userId)
      .eq('concept', concept)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found
      console.error('Error fetching progress:', error);
      return null;
    }

    if (!data) return null;

    return this.mapToProgress(data);
  }

  /**
   * Create new progress record
   */
  async createProgress(
    concept: string,
    totalSteps: number
  ): Promise<LearningProgress | null> {
    const { data, error } = await this.supabase
      .from('user_learning_progress')
      .insert({
        user_id: this.userId,
        concept,
        total_steps: totalSteps,
        understanding_score: 50, // Start at neutral
        difficulty_level: 'intermediate',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating progress:', error);
      return null;
    }

    return this.mapToProgress(data);
  }

  /**
   * Update progress
   */
  async updateProgress(
    concept: string,
    updates: Partial<LearningProgress>
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_learning_progress')
      .update({
        understanding_score: updates.understandingScore,
        difficulty_level: updates.difficultyLevel,
        completed_steps: updates.completedSteps,
        time_spent_seconds: updates.timeSpentSeconds,
        questions_asked: updates.questionsAsked,
        repeat_requests: updates.repeatRequests,
        correct_actions: updates.correctActions,
        total_actions: updates.totalActions,
        mastery_achieved: updates.masteryAchieved,
        mastery_date: updates.masteryDate,
        last_interaction: new Date().toISOString(),
      })
      .eq('user_id', this.userId)
      .eq('concept', concept);

    if (error) {
      console.error('Error updating progress:', error);
      return false;
    }

    return true;
  }

  /**
   * Start learning session
   */
  async startSession(
    concept: string,
    understandingScoreStart: number
  ): Promise<string | null> {
    // Get or create progress
    let progress = await this.getProgress(concept);
    if (!progress) {
      progress = await this.createProgress(concept, 0);
      if (!progress) return null;
    }

    // Create session record
    const { data, error } = await this.supabase
      .from('learning_sessions')
      .insert({
        progress_id: progress.id,
        user_id: this.userId,
        understanding_score_start: understandingScoreStart,
        difficulty_level: progress.difficultyLevel,
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting session:', error);
      return null;
    }

    this.currentSession = {
      progressId: progress.id,
      userId: this.userId,
      startedAt: new Date(data.started_at),
      stepsCompleted: 0,
      questionsAsked: 0,
      interactionsCount: 0,
      understandingScoreStart,
      difficultyLevel: progress.difficultyLevel,
    };

    return data.id;
  }

  /**
   * End learning session
   */
  async endSession(
    sessionId: string,
    understandingScoreEnd: number
  ): Promise<boolean> {
    if (!this.currentSession) return false;

    const durationSeconds = Math.floor(
      (Date.now() - this.currentSession.startedAt.getTime()) / 1000
    );

    const { error } = await this.supabase
      .from('learning_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        understanding_score_end: understandingScoreEnd,
        steps_completed: this.currentSession.stepsCompleted,
        questions_asked: this.currentSession.questionsAsked,
        interactions_count: this.currentSession.interactionsCount,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending session:', error);
      return false;
    }

    this.currentSession = null;
    return true;
  }

  /**
   * Get user's learning history
   */
  async getHistory(limit: number = 10): Promise<LearningProgress[]> {
    const { data, error } = await this.supabase
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', this.userId)
      .order('last_interaction', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return data.map((d) => this.mapToProgress(d));
  }

  /**
   * Get mastered concepts
   */
  async getMasteredConcepts(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('user_learning_progress')
      .select('concept')
      .eq('user_id', this.userId)
      .eq('mastery_achieved', true);

    if (error) {
      console.error('Error fetching mastered concepts:', error);
      return [];
    }

    return data.map((d) => d.concept);
  }

  /**
   * Map database record to LearningProgress
   */
  private mapToProgress(data: any): LearningProgress {
    return {
      id: data.id,
      userId: data.user_id,
      concept: data.concept,
      understandingScore: data.understanding_score,
      difficultyLevel: data.difficulty_level,
      completedSteps: data.completed_steps || [],
      totalSteps: data.total_steps,
      timeSpentSeconds: data.time_spent_seconds,
      questionsAsked: data.questions_asked,
      repeatRequests: data.repeat_requests,
      correctActions: data.correct_actions,
      totalActions: data.total_actions,
      masteryAchieved: data.mastery_achieved,
      masteryDate: data.mastery_date ? new Date(data.mastery_date) : undefined,
      attemptsCount: data.attempts_count,
      firstAttempt: new Date(data.first_attempt),
      lastInteraction: new Date(data.last_interaction),
    };
  }
}

/**
 * Hook for using progress tracker in components
 */
export function useProgressTracker(userId: string, concept: string) {
  const tracker = new ProgressTracker(userId);

  return {
    getProgress: () => tracker.getProgress(concept),
    updateProgress: (updates: Partial<LearningProgress>) =>
      tracker.updateProgress(concept, updates),
    startSession: (score: number) => tracker.startSession(concept, score),
    endSession: (sessionId: string, score: number) =>
      tracker.endSession(sessionId, score),
    getHistory: () => tracker.getHistory(),
    getMasteredConcepts: () => tracker.getMasteredConcepts(),
  };
}

export default {
  ProgressTracker,
  useProgressTracker,
};

