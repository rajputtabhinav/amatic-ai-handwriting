/**
 * Adaptive Learning System
 * 
 * Tracks user understanding and adjusts difficulty in real-time.
 * Analyzes interaction patterns to determine comprehension level.
 */

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UnderstandingMetrics {
  questionsAsked: number; // More questions = struggling
  timePerStep: number; // Slow = needs simpler explanation
  repeatRequests: number; // Asked to repeat = confused
  interactionQuality: number; // 0-1: Correct actions vs mistakes
  completionRate: number; // 0-1: Steps completed vs total
  engagementScore: number; // 0-1: Active interaction vs passive viewing
}

export interface AdaptiveResponse {
  difficulty: DifficultyLevel;
  confidence: number; // 0-1: How confident we are in this assessment
  recommendations: string[];
  adjustments: {
    simplifyLanguage: boolean;
    addMoreSteps: boolean;
    provideExamples: boolean;
    slowDownPacing: boolean;
  };
}

/**
 * Adaptive Tutor Engine
 */
export class AdaptiveTutor {
  private history: UnderstandingMetrics[] = [];
  private currentDifficulty: DifficultyLevel = 'intermediate';

  /**
   * Analyze user understanding from metrics
   */
  analyzeUnderstanding(metrics: UnderstandingMetrics): AdaptiveResponse {
    // Calculate overall understanding score (0-100)
    const score = this.calculateUnderstandingScore(metrics);

    // Store in history
    this.history.push(metrics);

    // Determine difficulty level
    let difficulty: DifficultyLevel;
    let confidence: number;

    if (score < 40) {
      difficulty = 'beginner';
      confidence = 0.9;
    } else if (score < 70) {
      difficulty = 'intermediate';
      confidence = 0.8;
    } else {
      difficulty = 'advanced';
      confidence = 0.85;
    }

    // Update current difficulty
    this.currentDifficulty = difficulty;

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, score);

    // Determine adjustments needed
    const adjustments = {
      simplifyLanguage: score < 50,
      addMoreSteps: metrics.timePerStep > 30 && score < 60,
      provideExamples: metrics.questionsAsked > 3,
      slowDownPacing: metrics.timePerStep > 20 || metrics.repeatRequests > 1,
    };

    return {
      difficulty,
      confidence,
      recommendations,
      adjustments,
    };
  }

  /**
   * Calculate understanding score (0-100)
   */
  private calculateUnderstandingScore(metrics: UnderstandingMetrics): number {
    let score = 50; // Start at neutral

    // Interaction quality (most important) - 40 points
    score += metrics.interactionQuality * 40;

    // Completion rate - 30 points
    score += metrics.completionRate * 30;

    // Engagement - 20 points
    score += metrics.engagementScore * 20;

    // Penalties
    // Too many questions = struggling
    score -= Math.min(metrics.questionsAsked * 5, 20);

    // Slow progress = difficulty understanding
    if (metrics.timePerStep > 30) {
      score -= 15;
    } else if (metrics.timePerStep > 20) {
      score -= 10;
    }

    // Repeat requests = confusion
    score -= metrics.repeatRequests * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    metrics: UnderstandingMetrics,
    score: number
  ): string[] {
    const recommendations: string[] = [];

    if (score < 40) {
      recommendations.push('Try a simpler explanation with more basic concepts');
      recommendations.push('Break down into smaller, more digestible steps');
      recommendations.push('Use analogies and real-world examples');
    } else if (score < 70) {
      recommendations.push('Continue with current difficulty level');
      if (metrics.questionsAsked > 2) {
        recommendations.push('Provide additional clarifying examples');
      }
    } else {
      recommendations.push('User is ready for more advanced concepts');
      recommendations.push('Can increase complexity and depth');
    }

    // Specific recommendations based on metrics
    if (metrics.timePerStep > 30) {
      recommendations.push('Slow down pacing - user needs more time to process');
    }

    if (metrics.repeatRequests > 1) {
      recommendations.push('Try explaining from a different angle');
    }

    if (metrics.engagementScore < 0.3) {
      recommendations.push('Add more interactive elements to boost engagement');
    }

    return recommendations;
  }

  /**
   * Get current difficulty level
   */
  getCurrentDifficulty(): DifficultyLevel {
    return this.currentDifficulty;
  }

  /**
   * Get learning history
   */
  getHistory(): UnderstandingMetrics[] {
    return [...this.history];
  }

  /**
   * Calculate trend (improving, stable, declining)
   */
  getTrend(): 'improving' | 'stable' | 'declining' {
    if (this.history.length < 2) return 'stable';

    const recent = this.history.slice(-3);
    const scores = recent.map((m) => this.calculateUnderstandingScore(m));

    if (scores.length < 2) return 'stable';

    const avgChange =
      (scores[scores.length - 1] - scores[0]) / (scores.length - 1);

    if (avgChange > 5) return 'improving';
    if (avgChange < -5) return 'declining';
    return 'stable';
  }

  /**
   * Reset history (for new topic)
   */
  reset(): void {
    this.history = [];
    this.currentDifficulty = 'intermediate';
  }
}

/**
 * Track user interaction metrics
 */
export class InteractionTracker {
  private startTime: number = Date.now();
  private stepStartTime: number = Date.now();
  private stepTimes: number[] = [];
  private questionsAsked: number = 0;
  private repeatRequests: number = 0;
  private correctActions: number = 0;
  private totalActions: number = 0;
  private stepsCompleted: number = 0;
  private totalSteps: number = 0;
  private interactionCount: number = 0;

  constructor(totalSteps: number) {
    this.totalSteps = totalSteps;
  }

  /**
   * Mark step start
   */
  startStep(): void {
    this.stepStartTime = Date.now();
  }

  /**
   * Mark step complete
   */
  completeStep(): void {
    const duration = (Date.now() - this.stepStartTime) / 1000; // seconds
    this.stepTimes.push(duration);
    this.stepsCompleted++;
  }

  /**
   * Record user question
   */
  recordQuestion(): void {
    this.questionsAsked++;
  }

  /**
   * Record repeat request
   */
  recordRepeat(): void {
    this.repeatRequests++;
  }

  /**
   * Record user action
   */
  recordAction(correct: boolean): void {
    this.totalActions++;
    if (correct) {
      this.correctActions++;
    }
    this.interactionCount++;
  }

  /**
   * Get current metrics
   */
  getMetrics(): UnderstandingMetrics {
    const avgTimePerStep =
      this.stepTimes.length > 0
        ? this.stepTimes.reduce((a, b) => a + b, 0) / this.stepTimes.length
        : 0;

    const interactionQuality =
      this.totalActions > 0 ? this.correctActions / this.totalActions : 0.5;

    const completionRate =
      this.totalSteps > 0 ? this.stepsCompleted / this.totalSteps : 0;

    // Engagement: interactions per minute
    const elapsedMinutes = (Date.now() - this.startTime) / 60000;
    const interactionsPerMinute =
      elapsedMinutes > 0 ? this.interactionCount / elapsedMinutes : 0;
    const engagementScore = Math.min(interactionsPerMinute / 10, 1); // Normalize to 0-1

    return {
      questionsAsked: this.questionsAsked,
      timePerStep: avgTimePerStep,
      repeatRequests: this.repeatRequests,
      interactionQuality,
      completionRate,
      engagementScore,
    };
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.startTime = Date.now();
    this.stepStartTime = Date.now();
    this.stepTimes = [];
    this.questionsAsked = 0;
    this.repeatRequests = 0;
    this.correctActions = 0;
    this.totalActions = 0;
    this.stepsCompleted = 0;
    this.interactionCount = 0;
  }
}

export default {
  AdaptiveTutor,
  InteractionTracker,
};

