-- Create user_squares table with sparse storage
-- Only stores squares that users have filled in
CREATE TABLE IF NOT EXISTS user_squares (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    square_index INT NOT NULL CHECK (square_index >= 1 AND square_index <= 1000),
    title TEXT NOT NULL,
    details TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, square_index)
);

-- Enable Row Level Security
ALTER TABLE user_squares ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own squares
CREATE POLICY "Users can view their own squares"
    ON user_squares FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own squares"
    ON user_squares FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own squares"
    ON user_squares FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own squares"
    ON user_squares FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_squares_user_id ON user_squares(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_squares_updated_at
    BEFORE UPDATE ON user_squares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
