-- 允许匿名用户（客户）通过 token 值读取 booking_tokens
-- 这是客户打开预约链接时验证 token 所必须的
create policy if not exists "public read token by value" on booking_tokens
  for select using (true);

-- 允许匿名用户将 token 标记为已使用（提交预约后）
create policy if not exists "public update used" on booking_tokens
  for update using (true)
  with check (used = true);
