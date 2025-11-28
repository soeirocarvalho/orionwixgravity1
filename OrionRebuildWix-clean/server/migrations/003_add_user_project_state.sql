-- Migration: Add user_project_state table for user and project-specific workspace isolation
-- This table stores user-specific state for each project, including selections, searches, and filters
CREATE TABLE IF NOT EXISTS user_project_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    -- Project-specific state
    selected_forces JSONB DEFAULT '[]'::jsonb,
    searched_forces JSONB DEFAULT '[]'::jsonb,
    scanning_filters JSONB DEFAULT '{}'::jsonb,
    committed_radar_filters JSONB DEFAULT '{}'::jsonb,
    copilot_thread_id TEXT,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure one state per user per project
    UNIQUE(user_id, project_id)
);
-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_project_state_user_id ON user_project_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_state_project_id ON user_project_state(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_state_user_project ON user_project_state(user_id, project_id);
-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_project_state_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER user_project_state_updated_at BEFORE
UPDATE ON user_project_state FOR EACH ROW EXECUTE FUNCTION update_user_project_state_updated_at();
-- Comments for documentation
COMMENT ON TABLE user_project_state IS 'Stores user-specific workspace state for each project';
COMMENT ON COLUMN user_project_state.selected_forces IS 'Array of force IDs selected by the user in this project';
COMMENT ON COLUMN user_project_state.searched_forces IS 'Array of force IDs from the user''s last search in this project';
COMMENT ON COLUMN user_project_state.scanning_filters IS 'User''s scanning page filters for this project';
COMMENT ON COLUMN user_project_state.committed_radar_filters IS 'User''s committed radar filters for this project';
COMMENT ON COLUMN user_project_state.copilot_thread_id IS 'OpenAI thread ID for this user''s Copilot session in this project';