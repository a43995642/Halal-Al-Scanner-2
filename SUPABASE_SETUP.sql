-- 1. إنشاء جدول لتتبع استخدام المستخدمين
create table if not exists user_stats (
  id uuid primary key, -- معرف المستخدم من Supabase Auth
  scan_count int default 0,
  is_premium boolean default false,
  created_at timestamp with time zone default now(),
  last_scan_at timestamp with time zone default now()
);

-- 2. تفعيل الحماية (RLS) لمنع التعديل المباشر
alter table user_stats enable row level security;

-- 3. السماح للقراءة فقط (لكي يعرف التطبيق حالة الاشتراك)
-- ملاحظة: الكتابة ممنوعة إلا عبر الخادم (Service Role)
create policy "Allow public read access"
on user_stats for select
using (true);

-- 4. دالة زيادة العداد (Increment Function) - هذا الجزء هو الأهم!
-- هذه الدالة يستخدمها الخادم لزيادة العداد بشكل آمن وتلقائي
create or replace function increment_scan_count(row_id uuid)
returns void as $$
begin
  insert into user_stats (id, scan_count, last_scan_at)
  values (row_id, 1, now())
  on conflict (id) do update
  set scan_count = user_stats.scan_count + 1,
      last_scan_at = now();
end;
$$ language plpgsql security definer;
