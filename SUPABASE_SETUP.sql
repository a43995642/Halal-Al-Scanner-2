-- 1. إنشاء جدول لتتبع استخدام المستخدمين (بدلاً من localStorage)
create table user_stats (
  id uuid default gen_random_uuid() primary key,
  ip_address text unique, -- سنستخدم الـ IP مؤقتاً أو user_id إذا فعلت تسجيل الدخول
  scan_count int default 0,
  is_premium boolean default false,
  last_scan_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 2. تفعيل الحماية (RLS)
alter table user_stats enable row level security;

-- 3. السماح للخادم فقط (Vercel) بالتعديل (Service Role)
-- لا ننشئ سياسات "Public" للكتابة، القراءة فقط مسموحة للمستخدم للتأكد من حالته
create policy "Allow public read access"
on user_stats for select
using (true);
