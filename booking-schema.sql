-- 预约 token 表：管理员生成，每个 token 对应一个客户预约邀请
create table if not exists booking_tokens (
  id            uuid primary key default gen_random_uuid(),
  token         text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by    uuid references auth.users(id) on delete cascade,
  customer_name text,          -- 管理员备注的客户姓名（可选）
  note          text,          -- 管理员备注
  expires_at    timestamptz not null default now() + interval '7 days',
  used          boolean not null default false,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- 客户提交的预约申请表
create table if not exists booking_requests (
  id              uuid primary key default gen_random_uuid(),
  token_id        uuid references booking_tokens(id) on delete set null,
  -- 主人信息
  owner_name      text not null,
  owner_phone     text not null,
  owner_wechat    text,
  owner_email     text,
  owner_address   text,
  -- 猫咪信息
  cat_name        text not null,
  cat_gender      text,
  cat_neutered    text,
  cat_breed       text,
  cat_age         text,
  cat_notes       text,
  -- 寄养日期
  check_in_date   date not null,
  check_out_date  date not null,
  transport       text,
  booking_notes   text,
  -- 文件（Supabase Storage 路径）
  passport_file   text,
  vaccine_file    text,
  cat_photo_file  text,
  -- 签名
  signature_data  text,         -- base64 PNG
  -- 须知确认
  notices_confirmed text[],
  -- 状态
  status          text not null default 'pending',  -- pending / confirmed / rejected
  admin_notes     text,
  submitted_at    timestamptz not null default now()
);

-- RLS: booking_tokens 只有认证用户可读写自己的
alter table booking_tokens enable row level security;
create policy "owner access" on booking_tokens
  for all using (auth.uid() = created_by);

-- RLS: booking_requests 认证用户可读（通过 token 关联），公开可插入（客户提交）
alter table booking_requests enable row level security;
create policy "public insert" on booking_requests
  for insert with check (true);
create policy "owner read" on booking_requests
  for select using (
    token_id in (select id from booking_tokens where created_by = auth.uid())
  );
create policy "owner update" on booking_requests
  for update using (
    token_id in (select id from booking_tokens where created_by = auth.uid())
  );

-- Supabase Storage bucket（在 Dashboard 手动建，或用 API）
-- bucket name: booking-docs
-- 设为 private，只有认证用户可读
