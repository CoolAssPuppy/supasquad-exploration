-- Table for activities automatically ingested from connected services
-- These are pending approval by the user before being added to the main feed

CREATE TABLE IF NOT EXISTS pending_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('discord', 'linkedin', 'github', 'twitter')),
  provider_activity_id text,
  activity_type activity_type NOT NULL,
  title text NOT NULL,
  description text,
  url text,
  event_name text,
  event_date date,
  location text,
  attendee_count integer,
  platform text,
  answer_count integer,
  suggested_points integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  ingested_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),

  UNIQUE(user_id, provider, provider_activity_id)
);

-- Enable RLS
ALTER TABLE pending_activities ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pending activities
CREATE POLICY "Users can view own pending activities"
  ON pending_activities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own pending activities (approve/decline)
CREATE POLICY "Users can update own pending activities"
  ON pending_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own pending activities
CREATE POLICY "Users can delete own pending activities"
  ON pending_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert pending activities (from edge functions)
CREATE POLICY "Service role can insert pending activities"
  ON pending_activities FOR INSERT
  WITH CHECK (true);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pending_activities_user_status ON pending_activities(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_activities_provider ON pending_activities(user_id, provider);
