-- Create family_events table
CREATE TABLE IF NOT EXISTS family_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  is_lunar BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth TEXT,
  avatar TEXT,
  bio TEXT,
  parent_ids UUID[] DEFAULT '{}',
  spouse_ids UUID[] DEFAULT '{}',
  children_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create family_milestones table
CREATE TABLE IF NOT EXISTS family_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  people TEXT[] DEFAULT '{}',
  description TEXT,
  icon_name TEXT,
  color TEXT,
  bg TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create family_memories table
CREATE TABLE IF NOT EXISTS family_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  authorUid TEXT NOT NULL,
  authorName TEXT,
  authorPhoto TEXT,
  privacy TEXT DEFAULT 'family',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create family_likes table
CREATE TABLE IF NOT EXISTS family_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memoryId UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  userUid TEXT NOT NULL,
  userName TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create family_comments table
CREATE TABLE IF NOT EXISTS family_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memoryId UUID NOT NULL REFERENCES family_memories(id) ON DELETE CASCADE,
  userUid TEXT NOT NULL,
  userName TEXT,
  userPhoto TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  authorUid TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create photo_albums junction table
CREATE TABLE IF NOT EXISTS photo_albums (
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL,
  PRIMARY KEY (album_id, photo_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON family_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON family_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON family_events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON family_events FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON family_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON family_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON family_members FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON family_milestones FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON family_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON family_milestones FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON family_milestones FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON family_memories FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON family_memories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON family_memories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON family_memories FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON family_likes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON family_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON family_likes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON family_likes FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON family_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON family_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON family_comments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON family_comments FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON albums FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON albums FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON albums FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON albums FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON photo_albums FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON photo_albums FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON photo_albums FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON photo_albums FOR DELETE USING (true);
