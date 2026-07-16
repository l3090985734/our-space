-- 纸条表
CREATE TABLE notes (
  id          BIGSERIAL PRIMARY KEY,
  author      TEXT NOT NULL CHECK (author IN ('he', 'she')),
  content     TEXT NOT NULL,
  parent_id   BIGINT REFERENCES notes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 照片表
CREATE TABLE photos (
  id           BIGSERIAL PRIMARY KEY,
  storage_path TEXT NOT NULL,
  caption      TEXT DEFAULT '',
  uploaded_by  TEXT NOT NULL CHECK (uploaded_by IN ('he', 'she')),
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 倒计时表
CREATE TABLE countdowns (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  target_date DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 时间线事件表
CREATE TABLE timeline_events (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  event_date  DATE NOT NULL,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 愿望清单表
CREATE TABLE wishes (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  icon         TEXT DEFAULT '🌟',
  completed    BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 应用设置表（只有一行，id=1）
CREATE TABLE app_settings (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  anniversary_date DATE NOT NULL DEFAULT '2024-01-01',
  CONSTRAINT single_row CHECK (id = 1)
);

-- 插入默认设置
INSERT INTO app_settings (id, anniversary_date) VALUES (1, '2024-01-01') ON CONFLICT DO NOTHING;

-- 索引
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_parent_id ON notes(parent_id);
CREATE INDEX idx_photos_sort_order ON photos(sort_order, created_at DESC);
CREATE INDEX idx_countdowns_target_date ON countdowns(target_date);
CREATE INDEX idx_timeline_events_date ON timeline_events(event_date DESC);
CREATE INDEX idx_wishes_completed ON wishes(completed, created_at DESC);

-- RLS 策略（允许所有人读写，因为链接只分享给女朋友）
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on notes" ON notes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on photos" ON photos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on countdowns" ON countdowns FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on timeline" ON timeline_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on wishes" ON wishes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
