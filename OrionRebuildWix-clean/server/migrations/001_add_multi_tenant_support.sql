-- Migration: Add multi-tenant support
-- This migration converts the ORION platform from single-user public mode
-- to multi-tenant mode with user isolation.

-- Step 1: Add userId columns to tables that don't have them yet
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS user_id VARCHAR;
ALTER TABLE clustering_reports ADD COLUMN IF NOT EXISTS user_id VARCHAR;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS user_id VARCHAR;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id VARCHAR;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id VARCHAR;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS user_id VARCHAR;

-- Step 2: Create system user for default/shared data
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  email_verified,
  role,
  subscription_tier,
  subscription_status,
  subscription_cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@orion.internal',
  'ORION',
  'System',
  true,
  'admin',
  'enterprise',
  'active',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Update NULL userId references to system user
-- Projects table
UPDATE projects 
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

-- Driving forces inherit userId from their project
-- (will be enforced via application logic, not FK)

-- Clusters table
UPDATE clusters
SET user_id = (
  SELECT user_id FROM projects WHERE projects.id = clusters.project_id
)
WHERE user_id IS NULL;

-- Clustering reports table
UPDATE clustering_reports
SET user_id = (
  SELECT user_id FROM projects WHERE projects.id = clustering_reports.project_id
)
WHERE user_id IS NULL;

-- Workspaces table  
UPDATE workspaces
SET user_id = (
  SELECT user_id FROM projects WHERE projects.id = workspaces.project_id
)
WHERE user_id IS NULL;

-- Reports table
UPDATE reports
SET user_id = (
  SELECT user_id FROM projects WHERE projects.id = reports.project_id
)
WHERE user_id IS NULL;

-- Saved searches table
UPDATE saved_searches
SET user_id = (
  SELECT user_id FROM projects WHERE projects.id = saved_searches.project_id
)
WHERE user_id IS NULL;

-- Jobs table (orphaned jobs get system user)
UPDATE jobs
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

-- Step 4: Add NOT NULL constraints
ALTER TABLE projects
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE clusters
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE clustering_reports
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE workspaces
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE reports
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE saved_searches
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE jobs
  ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Add foreign key constraints for user ownership
ALTER TABLE projects
  ADD CONSTRAINT fk_projects_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE clusters
  ADD CONSTRAINT fk_clusters_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE clustering_reports
  ADD CONSTRAINT fk_clustering_reports_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspaces
  ADD CONSTRAINT fk_workspaces_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reports
  ADD CONSTRAINT fk_reports_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE saved_searches
  ADD CONSTRAINT fk_saved_searches_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE jobs
  ADD CONSTRAINT fk_jobs_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Create index on userId columns for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_clusters_user_id ON clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_clustering_reports_user_id ON clustering_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);

-- Migration complete
-- The system user now owns all existing data
-- New users will get their own isolated workspaces
