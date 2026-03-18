-- 管理员个人设置表（每个管理员账号一行）
create table if not exists admin_settings (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  notification_email text,
  updated_at        timestamptz not null default now()
);

alter table admin_settings enable row level security;

create policy "owner rw admin_settings" on admin_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
