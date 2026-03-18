-- 管理员个人设置表
CREATE TABLE IF NOT EXISTS admin_settings (
  user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_email text,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "owner rw admin_settings" ON admin_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
