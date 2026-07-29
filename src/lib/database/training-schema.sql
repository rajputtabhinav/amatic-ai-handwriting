-- Training Data Schema for Visual Reasoning AI
-- Collects data for future custom model training

-- reasoning_logs table (training data for future custom model)
-- Stores everything AI generates for each query
CREATE TABLE IF NOT EXISTS reasoning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User query
  user_query TEXT NOT NULL,
  
  -- AI reasoning/thinking process
  reasoning_text TEXT,
  
  -- Generated SVG code
  generated_svg TEXT,
  
  -- Animation timeline JSON
  timeline_json JSONB,
  
  -- Query analysis results
  detected_audience TEXT,        -- kid, teen, adult, professional
  detected_emotion TEXT,         -- curious, confused, excited, neutral
  detected_topic TEXT,           -- science, space, anatomy, etc.
  visual_style TEXT,             -- cartoon, modern, professional, minimal
  
  -- Voice settings used
  voice_emotion TEXT,
  voice_id TEXT,
  
  -- Physics preset used
  physics_preset TEXT,
  
  -- Performance metrics
  response_time_ms INTEGER,
  svg_element_count INTEGER,
  timeline_scene_count INTEGER,
  
  -- Metadata
  user_id TEXT,                  -- Optional: for personalization
  session_id TEXT,               -- Group related queries
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_feedback table (quality improvement)
-- Tracks thumbs up/down for each response
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to reasoning log
  reasoning_log_id UUID REFERENCES reasoning_logs(id) ON DELETE CASCADE,
  
  -- Feedback type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'report')),
  
  -- Optional feedback details
  feedback_text TEXT,
  feedback_category TEXT,        -- accuracy, clarity, relevance, animation, voice
  
  -- User info
  user_id TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for training data analysis
CREATE INDEX IF NOT EXISTS idx_reasoning_topic ON reasoning_logs(detected_topic);
CREATE INDEX IF NOT EXISTS idx_reasoning_audience ON reasoning_logs(detected_audience);
CREATE INDEX IF NOT EXISTS idx_reasoning_created ON reasoning_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reasoning_style ON reasoning_logs(visual_style);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_log ON user_feedback(reasoning_log_id);

-- View for aggregated feedback stats
CREATE OR REPLACE VIEW training_quality_stats AS
SELECT 
  rl.detected_topic,
  rl.detected_audience,
  rl.visual_style,
  COUNT(*) as total_queries,
  COUNT(CASE WHEN uf.feedback_type = 'thumbs_up' THEN 1 END) as thumbs_up,
  COUNT(CASE WHEN uf.feedback_type = 'thumbs_down' THEN 1 END) as thumbs_down,
  ROUND(
    COUNT(CASE WHEN uf.feedback_type = 'thumbs_up' THEN 1 END)::numeric / 
    NULLIF(COUNT(uf.id), 0) * 100, 
    2
  ) as approval_rate,
  AVG(rl.response_time_ms) as avg_response_time,
  AVG(rl.svg_element_count) as avg_elements
FROM reasoning_logs rl
LEFT JOIN user_feedback uf ON rl.id = uf.reasoning_log_id
GROUP BY rl.detected_topic, rl.detected_audience, rl.visual_style;

-- Function to log a reasoning response
CREATE OR REPLACE FUNCTION log_reasoning_response(
  p_query TEXT,
  p_reasoning TEXT,
  p_svg TEXT,
  p_timeline JSONB,
  p_audience TEXT,
  p_emotion TEXT,
  p_topic TEXT,
  p_style TEXT,
  p_voice_emotion TEXT,
  p_physics_preset TEXT,
  p_response_time INTEGER,
  p_element_count INTEGER,
  p_scene_count INTEGER,
  p_user_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO reasoning_logs (
    user_query,
    reasoning_text,
    generated_svg,
    timeline_json,
    detected_audience,
    detected_emotion,
    detected_topic,
    visual_style,
    voice_emotion,
    physics_preset,
    response_time_ms,
    svg_element_count,
    timeline_scene_count,
    user_id,
    session_id
  ) VALUES (
    p_query,
    p_reasoning,
    p_svg,
    p_timeline,
    p_audience,
    p_emotion,
    p_topic,
    p_style,
    p_voice_emotion,
    p_physics_preset,
    p_response_time,
    p_element_count,
    p_scene_count,
    p_user_id,
    p_session_id
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add feedback
CREATE OR REPLACE FUNCTION add_feedback(
  p_log_id UUID,
  p_type TEXT,
  p_text TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO user_feedback (
    reasoning_log_id,
    feedback_type,
    feedback_text,
    feedback_category,
    user_id
  ) VALUES (
    p_log_id,
    p_type,
    p_text,
    p_category,
    p_user_id
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (enable Row Level Security)
ALTER TABLE reasoning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow all inserts (for logging)
CREATE POLICY reasoning_logs_insert ON reasoning_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY user_feedback_insert ON user_feedback
  FOR INSERT WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY reasoning_logs_select ON reasoning_logs
  FOR SELECT USING (user_id IS NULL OR user_id = current_user);

CREATE POLICY user_feedback_select ON user_feedback
  FOR SELECT USING (user_id IS NULL OR user_id = current_user);

