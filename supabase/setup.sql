-- 1. Create the table if it doesn't exist
create table if not exists public.user_stats (
  id uuid references auth.users on delete cascade not null primary key,
  scan_count int default 0,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_scan_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
alter table public.user_stats enable row level security;

-- 3. Drop existing policies to prevent "policy already exists" errors
drop policy if exists "Users can read own stats" on public.user_stats;
drop policy if exists "Users can update own stats" on public.user_stats;

-- 4. Re-create the policies
create policy "Users can read own stats"
  on public.user_stats for select
  using ( auth.uid() = id );

create policy "Users can update own stats"
  on public.user_stats for update
  using ( auth.uid() = id );

-- 5. Create the function required by api/analyze.js
-- This function allows the backend to securely increment the counter
create or replace function increment_scan_count(row_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.user_stats
  set 
    scan_count = scan_count + 1,
    last_scan_at = now()
  where id = row_id;
end;
$$;
