-- booking-docs bucket RLS 策略
create policy "public upload booking docs"
  on storage.objects for insert
  with check (bucket_id = 'booking-docs');

create policy "authenticated read booking docs"
  on storage.objects for select
  using (bucket_id = 'booking-docs' and auth.role() = 'authenticated');
