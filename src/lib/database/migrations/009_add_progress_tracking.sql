-- Migration: Add Learning Progress Tracking
-- Tracks user understanding, mastery, and learning history across sessions

CREATE TABLE IF NOT EXISTS user_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept VARCHAR(255) NOT NULL,
  
  -- Understanding metrics
  understanding_score INTEGER CHECK (understanding_score >= 0 AND understanding_score <= 100),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Progress tracking
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  total_steps INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Interaction metrics
  questions_asked INTEGER DEFAULT 0,
  repeat_requests INTEGER DEFAULT 0,
  correct_actions INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,
  
  -- Mastery tracking
  mastery_achieved BOOLEAN DEFAULT FALSE,
  mastery_date TIMESTAMP,
  attempts_count INTEGER DEFAULT 1,
  
  -- Timestamps
  first_attempt TIMESTAMP DEFAULT NOW(),
  last_interaction TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one progress record per user per concept
  UNIQUE(user_id, concept)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user 
  ON user_learning_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_concept 
  ON user_learning_progress(concept);

CREATE INDEX IF NOT EXISTS idx_user_progress_mastery 
  ON user_learning_progress(user_id, mastery_achieved);

CREATE INDEX IF NOT EXISTS idx_user_progress_recent 
  ON user_learning_progress(user_id, last_interaction DESC);

-- Learning session history (detailed tracking)
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES user_learning_progress(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session details
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  
  -- Session metrics
  steps_completed INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  interactions_count INTEGER DEFAULT 0,
  
  -- Session outcome
  understanding_score_start INTEGER,
  understanding_score_end INTEGER,
  difficulty_level VARCHAR(20),
  
  -- Session data
  session_data JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user 
  ON learning_sessions(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_progress 
  ON learning_sessions(progress_id, started_at DESC);

-- Comments for documentation
COMMENT ON TABLE user_learning_progress IS 'Tracks overall learning progress and mastery for each concept per user';
COMMENT ON TABLE learning_sessions IS 'Detailed history of individual learning sessions';

COMMENT ON COLUMN user_learning_progress.understanding_score IS 'Current understanding level (0-100)';
COMMENT ON COLUMN user_learning_progress.difficulty_level IS 'Current difficulty level based on performance';
COMMENT ON COLUMN user_learning_progress.completed_steps IS 'Array of step indices completed';
COMMENT ON COLUMN user_learning_progress.mastery_achieved IS 'Whether user has mastered this concept';

