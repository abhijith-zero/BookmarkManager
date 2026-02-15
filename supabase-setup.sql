-- Bookmark App Database Setup

-- Create bookmarks table
create table public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  url text not null,
  user_id uuid references auth.users not null
);

-- Enable Row Level Security
alter table public.bookmarks enable row level security;

-- Create policy to allow users to read their own bookmarks
create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own bookmarks
create policy "Users can insert their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to delete their own bookmarks
create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- Enable Realtime for the bookmarks table
alter publication supabase_realtime add table bookmarks;

-- Create an index on user_id for better query performance
create index bookmarks_user_id_idx on public.bookmarks(user_id);

-- Create an index on created_at for sorting
create index bookmarks_created_at_idx on public.bookmarks(created_at desc);