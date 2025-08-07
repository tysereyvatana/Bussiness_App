-- Creates a table to log user activities for the dashboard feed.
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    
    -- Links to the user who performed the action.
    -- ON DELETE SET NULL means if the user is deleted, the activity log remains
    -- but is no longer associated with them.
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- The name of the user who performed the action, stored for convenience.
    username VARCHAR(255),
    
    -- A short description of the action (e.g., 'created_customer', 'updated_user_role').
    action_type VARCHAR(255) NOT NULL,
    
    -- A more detailed, human-readable description of the event.
    details TEXT,
    
    -- Timestamp for when the activity occurred.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quickly fetching recent activities.
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
