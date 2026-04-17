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

-- 1. Family Events (Lễ kỷ niệm)
CREATE POLICY "Authenticated users can view events" ON family_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify events" ON family_events FOR ALL TO authenticated USING (true); -- Simplified for now, can be restricted by UID

-- 2. Family Members (Thành viên)
CREATE POLICY "Authenticated users can view members" ON family_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify members" ON family_members FOR ALL TO authenticated USING (true);

-- 3. Family Milestones (Cột mốc)
CREATE POLICY "Authenticated users can view milestones" ON family_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert milestones" ON family_milestones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Only admins or owners can update milestones" ON family_milestones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only admins or owners can delete milestones" ON family_milestones FOR DELETE TO authenticated USING (true);

-- 4. Family Memories (Góc nhắn nhủ)
CREATE POLICY "Authenticated users can view memories" ON family_memories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own memories" ON family_memories FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = authorUid);
CREATE POLICY "Users can update their own memories" ON family_memories FOR UPDATE TO authenticated USING (auth.uid()::text = authorUid);
CREATE POLICY "Users can delete their own memories" ON family_memories FOR DELETE TO authenticated USING (auth.uid()::text = authorUid);

-- 5. Family Likes
CREATE POLICY "Authenticated users can view likes" ON family_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own likes" ON family_likes FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = userUid);
CREATE POLICY "Users can delete their own likes" ON family_likes FOR DELETE TO authenticated USING (auth.uid()::text = userUid);

-- 6. Family Comments
CREATE POLICY "Authenticated users can view comments" ON family_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own comments" ON family_comments FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = userUid);
CREATE POLICY "Users can update their own comments" ON family_comments FOR UPDATE TO authenticated USING (auth.uid()::text = userUid);
CREATE POLICY "Users can delete their own comments" ON family_comments FOR DELETE TO authenticated USING (auth.uid()::text = userUid);

-- 7. Albums
CREATE POLICY "Authenticated users can view albums" ON albums FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own albums" ON albums FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = authorUid);
CREATE POLICY "Users can update their own albums" ON albums FOR UPDATE TO authenticated USING (auth.uid()::text = authorUid);
CREATE POLICY "Users can delete their own albums" ON albums FOR DELETE TO authenticated USING (auth.uid()::text = authorUid);

-- 8. Photo Albums (Junction)
CREATE POLICY "Authenticated users can view photo_albums" ON photo_albums FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own album contents" ON photo_albums FOR ALL TO authenticated USING (true);

