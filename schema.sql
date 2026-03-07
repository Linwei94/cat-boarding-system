-- ================================================================
-- 喵喵寄养管理系统 - Supabase 数据库结构
-- 请在 Supabase 控制台的 SQL Editor 中执行此文件
-- ================================================================

-- 房型表
CREATE TABLE IF NOT EXISTS room_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 主人表
CREATE TABLE IF NOT EXISTS owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  discount_rate DECIMAL(5,2) DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 猫咪表
CREATE TABLE IF NOT EXISTS cats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  age TEXT,
  gender TEXT DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
  color TEXT,
  special_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 寄养记录表
CREATE TABLE IF NOT EXISTS boardings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cat_id UUID REFERENCES cats(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,
  room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 上门喂养主记录表
CREATE TABLE IF NOT EXISTS home_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  cat_id UUID REFERENCES cats(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  visit_time TEXT,
  price_per_visit DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 上门喂养日期明细表
CREATE TABLE IF NOT EXISTS home_visit_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_visit_id UUID REFERENCES home_visits(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 启用行级安全 (RLS)
-- ================================================================
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE boardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_visit_dates ENABLE ROW LEVEL SECURITY;

-- 已登录用户可读写所有数据
CREATE POLICY "auth_room_types" ON room_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_owners" ON owners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_cats" ON cats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_boardings" ON boardings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_home_visits" ON home_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_home_visit_dates" ON home_visit_dates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ================================================================
-- 预设默认房型（可在系统内修改）
-- ================================================================
INSERT INTO room_types (name, description, price_per_day) VALUES
  ('标准房', '基础寄养服务，舒适安全的环境，每日清洁', 50.00),
  ('豪华房', '豪华寄养服务，独立宽敞空间，专属照顾', 80.00)
ON CONFLICT DO NOTHING;
