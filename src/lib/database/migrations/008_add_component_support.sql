-- Migration: Add React Component Support to Canvas Elements
-- Replaces SVG-based illustrations with interactive React components

-- Add component-related columns to canvas elements
ALTER TABLE canvas_elements 
  ADD COLUMN IF NOT EXISTS component_code TEXT,
  ADD COLUMN IF NOT EXISTS component_concepts TEXT[], -- Array of key concepts
  ADD COLUMN IF NOT EXISTS component_props JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS component_version VARCHAR(10) DEFAULT 'v1.0';

-- Add index for component queries
CREATE INDEX IF NOT EXISTS idx_canvas_elements_component 
  ON canvas_elements(user_id, project_id) 
  WHERE component_code IS NOT NULL;

-- Add index for concept-based search
CREATE INDEX IF NOT EXISTS idx_canvas_elements_concepts 
  ON canvas_elements USING GIN(component_concepts) 
  WHERE component_concepts IS NOT NULL;

-- Update element type enum to include react-component
-- Note: This depends on your existing type constraint
-- If you have a CHECK constraint or enum, update it accordingly

COMMENT ON COLUMN canvas_elements.component_code IS 'TSX/JSX code for interactive React component';
COMMENT ON COLUMN canvas_elements.component_concepts IS 'Key educational concepts covered by the component';
COMMENT ON COLUMN canvas_elements.component_props IS 'Props to pass to the component at runtime';
COMMENT ON COLUMN canvas_elements.component_version IS 'Component API version for compatibility';

