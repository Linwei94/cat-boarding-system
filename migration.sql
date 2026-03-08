-- ================================================================
-- 迁移脚本：在 Supabase SQL Editor 执行一次
-- （适用于已执行过 schema.sql 的用户）
-- ================================================================

-- 1. 主人表加入微信字段
ALTER TABLE owners ADD COLUMN IF NOT EXISTS wechat TEXT;

-- 2. 新增主人专属房型价格表
CREATE TABLE IF NOT EXISTS owner_room_prices (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id     UUID REFERENCES owners(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
  price_per_day DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, room_type_id)
);

ALTER TABLE owner_room_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_owner_room_prices"
  ON owner_room_prices FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
