-- 允许匿名用户（客户）通过 token 值读取 booking_tokens
DO $$ BEGIN
  CREATE POLICY "public read token by value" ON booking_tokens FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 允许匿名用户将 token 标记为已使用（提交预约后）
DO $$ BEGIN
  CREATE POLICY "public update used" ON booking_tokens FOR UPDATE USING (true) WITH CHECK (used = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 允许匿名用户提交预约申请
DO $$ BEGIN
  CREATE POLICY "public insert requests" ON booking_requests FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
