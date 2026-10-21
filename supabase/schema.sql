-- ═══════════════════════════════════════════════════════════════════
-- NexusOS — Complete Supabase Schema with Row Level Security
-- Paste this in Supabase SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Custom Types ───────────────────────────────────────────────
CREATE TYPE owner_type AS ENUM ('david', 'cami');
CREATE TYPE visibility_type AS ENUM ('private', 'couple');
CREATE TYPE priority_type AS ENUM ('P1', 'P2', 'P3', 'P4');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
CREATE TYPE block_type AS ENUM (
  'paragraph', 'heading1', 'heading2', 'heading3',
  'bullet_list', 'numbered_list', 'todo', 'code',
  'table', 'callout', 'divider', 'timestamp', 'wikilink'
);
CREATE TYPE notification_level AS ENUM ('info', 'warning', 'urgent', 'overdue');

-- ─── Profiles (linked to Supabase Auth) ─────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  owner owner_type NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  accent_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Projects ───────────────────────────────────────────────────
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  owner owner_type NOT NULL,
  visibility visibility_type NOT NULL DEFAULT 'private',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tasks (and Subtasks via parent_task_id) ────────────────────
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status task_status NOT NULL DEFAULT 'todo',
  priority priority_type NOT NULL DEFAULT 'P4',
  owner owner_type NOT NULL,
  visibility visibility_type NOT NULL DEFAULT 'private',

  -- Hierarchy
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Tags & Category
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT '',

  -- Triple Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_minutes INTEGER,
  actual_minutes INTEGER DEFAULT 0,

  -- Reminders
  reminder_date TIMESTAMPTZ,

  -- Page content (stored as JSONB array of blocks)
  page_content JSONB DEFAULT '[]',

  -- WikiLinks (array of referenced task/note IDs)
  wiki_links UUID[] DEFAULT '{}',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_owner ON tasks(owner);
CREATE INDEX idx_tasks_visibility ON tasks(visibility);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);

-- ─── Tags ───────────────────────────────────────────────────────
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  owner owner_type NOT NULL,
  visibility visibility_type NOT NULL DEFAULT 'private',
  UNIQUE(name, owner)
);

-- ─── Habits ─────────────────────────────────────────────────────
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✅',
  color TEXT DEFAULT '#6366f1',
  owner owner_type NOT NULL,
  visibility visibility_type NOT NULL DEFAULT 'private',
  frequency_per_week INTEGER DEFAULT 7,
  target_minutes INTEGER,
  reminder_time TIME,
  streak_freezes DATE[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  minutes_logged INTEGER DEFAULT 0,
  UNIQUE(habit_id, date)
);

CREATE INDEX idx_habit_completions_habit ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(date);

-- ─── Time Logs ──────────────────────────────────────────────────
CREATE TABLE time_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  owner owner_type NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Expenses (Couple Hub) ──────────────────────────────────────
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'COP',
  paid_by owner_type NOT NULL,
  category TEXT DEFAULT 'Otro',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  split_type TEXT DEFAULT 'equal',
  split_ratio JSONB,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trip Plans (Couple Hub) ────────────────────────────────────
CREATE TABLE trip_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '✈️',
  destination TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  currency TEXT DEFAULT 'COP',
  cover_image TEXT,
  notes TEXT DEFAULT '',
  checklist_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Shared Notes (Couple Hub) ──────────────────────────────────
CREATE TABLE shared_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  updated_by owner_type NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Daily Notes ────────────────────────────────────────────────
CREATE TABLE daily_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  owner owner_type NOT NULL,
  content JSONB DEFAULT '[]',
  wiki_links UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, owner)
);

-- ─── Notifications ──────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  level notification_level DEFAULT 'info',
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  owner owner_type NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Helper function: get current user's owner type
CREATE OR REPLACE FUNCTION get_user_owner()
RETURNS owner_type AS $$
  SELECT owner FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Enable RLS on all tables ───────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── Profiles: user can only read/update their own ──────────────
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ─── Projects: owner sees private + both see couple ─────────────
CREATE POLICY projects_select ON projects FOR SELECT
  USING (
    visibility = 'couple'
    OR owner = get_user_owner()
  );
CREATE POLICY projects_insert ON projects FOR INSERT
  WITH CHECK (owner = get_user_owner());
CREATE POLICY projects_update ON projects FOR UPDATE
  USING (
    visibility = 'couple'
    OR owner = get_user_owner()
  );
CREATE POLICY projects_delete ON projects FOR DELETE
  USING (owner = get_user_owner());

-- ─── Tasks: same pattern — private only by owner, couple by both ─
CREATE POLICY tasks_select ON tasks FOR SELECT
  USING (
    visibility = 'couple'
    OR owner = get_user_owner()
  );
CREATE POLICY tasks_insert ON tasks FOR INSERT
  WITH CHECK (owner = get_user_owner());
CREATE POLICY tasks_update ON tasks FOR UPDATE
  USING (
    visibility = 'couple'
    OR owner = get_user_owner()
  );
CREATE POLICY tasks_delete ON tasks FOR DELETE
  USING (owner = get_user_owner());

-- ─── Tags ───────────────────────────────────────────────────────
CREATE POLICY tags_select ON tags FOR SELECT
  USING (
    visibility = 'couple'
    OR owner = get_user_owner()
  );
CREATE POLICY tags_insert ON tags FOR INSERT
  WITH CHECK (owner = get_user_owner());

-- ─── Habits ─────────────────────────────────────────────────────
CREATE POLICY habits_select ON habits FOR SELECT
  USING (
    visibility = 'couple'
    OR owner = get_user_owner()
  );
CREATE POLICY habits_insert ON habits FOR INSERT
  WITH CHECK (owner = get_user_owner());
CREATE POLICY habits_update ON habits FOR UPDATE
  USING (
    visibility = 'couple'
    OR owner = get_user_owner()
  );
CREATE POLICY habits_delete ON habits FOR DELETE
  USING (owner = get_user_owner());

-- ─── Habit Completions: via habit ownership ─────────────────────
CREATE POLICY habit_completions_select ON habit_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM habits h
      WHERE h.id = habit_completions.habit_id
      AND (h.visibility = 'couple' OR h.owner = get_user_owner())
    )
  );
CREATE POLICY habit_completions_insert ON habit_completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits h
      WHERE h.id = habit_completions.habit_id
      AND (h.visibility = 'couple' OR h.owner = get_user_owner())
    )
  );

-- ─── Time Logs: owner only ──────────────────────────────────────
CREATE POLICY time_logs_select ON time_logs FOR SELECT
  USING (owner = get_user_owner());
CREATE POLICY time_logs_insert ON time_logs FOR INSERT
  WITH CHECK (owner = get_user_owner());

-- ─── Expenses: always visible to both (couple data) ─────────────
CREATE POLICY expenses_all ON expenses FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ─── Trip Plans: always visible to both ─────────────────────────
CREATE POLICY trip_plans_all ON trip_plans FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ─── Shared Notes: always visible to both ───────────────────────
CREATE POLICY shared_notes_all ON shared_notes FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ─── Daily Notes: owner only ────────────────────────────────────
CREATE POLICY daily_notes_select ON daily_notes FOR SELECT
  USING (owner = get_user_owner());
CREATE POLICY daily_notes_insert ON daily_notes FOR INSERT
  WITH CHECK (owner = get_user_owner());
CREATE POLICY daily_notes_update ON daily_notes FOR UPDATE
  USING (owner = get_user_owner());

-- ─── Notifications: owner only ──────────────────────────────────
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (owner = get_user_owner());
CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (owner = get_user_owner());
CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (owner = get_user_owner());

-- ═══════════════════════════════════════════════════════════════════
-- REALTIME SUBSCRIPTIONS (enable for collaborative couple features)
-- ═══════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE habit_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─── Automatic updated_at trigger ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER shared_notes_updated_at BEFORE UPDATE ON shared_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER daily_notes_updated_at BEFORE UPDATE ON daily_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
