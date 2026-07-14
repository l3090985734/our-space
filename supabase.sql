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

-- 索引
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_parent_id ON notes(parent_id);
CREATE INDEX idx_photos_sort_order ON photos(sort_order, created_at DESC);
CREATE INDEX idx_countdowns_target_date ON countdowns(target_date);

-- RLS 策略（允许所有人读写，因为链接只分享给女朋友）
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on notes" ON notes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on photos" ON photos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on countdowns" ON countdowns FOR ALL USING (true) WITH CHECK (true);
