-- 创建 booking-docs 存储桶（私有，10MB 限制）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'booking-docs',
  'booking-docs',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/gif','application/pdf']
)
on conflict (id) do nothing;
