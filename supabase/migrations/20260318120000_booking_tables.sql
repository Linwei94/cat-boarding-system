-- 预约 token 表
create table if not exists booking_tokens (
  id            uuid primary key default gen_random_uuid(),
  token         text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_by    uuid references auth.users(id) on delete cascade,
  customer_name text,
  note          text,
  expires_at    timestamptz not null default now() + interval '7 days',
  used          boolean not null default false,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- 客户预约申请表
create table if not exists booking_requests (
  id              uuid primary key default gen_random_uuid(),
  token_id        uuid references booking_tokens(id) on delete set null,
  owner_name      text not null,
  owner_phone     text not null,
  owner_wechat    text,
  owner_email     text,
  owner_address   text,
  cat_name        text not null,
  cat_gender      text,
  cat_neutered    text,
  cat_breed       text,
  cat_age         text,
  cat_notes       text,
  check_in_date   date not null,
  check_out_date  date not null,
  transport       text,
  booking_notes   text,
  passport_file   text,
  vaccine_file    text,
  cat_photo_file  text,
  signature_data  text,
  notices_confirmed text[],
  status          text not null default 'pending',
  admin_notes     text,
  submitted_at    timestamptz not null default now()
);

-- RLS
alter table booking_tokens enable row level security;
create policy "owner access tokens" on booking_tokens
  for all using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

alter table booking_requests enable row level security;
create policy "public insert requests" on booking_requests
  for insert with check (true);
create policy "owner read requests" on booking_requests
  for select using (
    token_id in (select id from booking_tokens where created_by = auth.uid())
  );
create policy "owner update requests" on booking_requests
  for update using (
    token_id in (select id from booking_tokens where created_by = auth.uid())
  );

-- 允许匿名用户读取自己的 token（用于客户端验证）
create policy "public read token by value" on booking_tokens
  for select using (true);

-- 允许匿名用户标记 token 为已使用
create policy "public update used" on booking_tokens
  for update using (true)
  with check (used = true);
