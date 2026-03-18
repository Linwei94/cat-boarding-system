-- 支持多猫预约
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS additional_cats jsonb;
