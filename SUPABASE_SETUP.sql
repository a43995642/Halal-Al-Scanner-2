files:
  - filename: "SUPABASE_SCHEMA.sql"
    content: |
      -- 1. Create the user_stats table
      create table if not exists public.user_stats (
        id uuid references auth.users on delete cascade not null primary key,
        scan_count int default 0,
        is_premium boolean default false,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );

      -- 2. Enable Row Level Security (RLS)
      alter table public.user_stats enable row level security;

  - filename: "SUPABASE_SETUP.sql"
    content: |
      -- 1. Allow users to view their own stats
      create policy "Users can view own stats"
      on public.user_stats for select
      using ( auth.uid() = id );

      -- 2. Allow users to insert their own stats row (for anonymous login creation)
      create policy "Users can insert own stats"
      on public.user_stats for insert
      with check ( auth.uid() = id );

      -- 3. Create a secure function to increment scan count safely from backend
      create or replace function increment_scan_count(row_id uuid)
      returns void as $$
      begin
        insert into public.user_stats (id, scan_count)
        values (row_id, 1)
        on conflict (id) do update
        set scan_count = user_stats.scan_count + 1;
      end;
      $$ language plpgsql security definer;
