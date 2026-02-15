# Bookmark Manager - Next.js & Supabase

A realtime bookmark management application built with Next.js 15, Supabase, and Google OAuth authentication. Features instant updates across multiple browser tabs without page refreshes.

## Features

- **Google OAuth Authentication** - Secure sign-in with Google
- **Real-time Updates** - Changes reflect across all open tabs instantly
- **Add Bookmarks** - Save URLs with custom titles
- **Delete Bookmarks** - Remove bookmarks with one click
- **Responsive Design** - Clean, modern UI with Tailwind CSS
- **Row-Level Security** - Users can only access their own bookmarks

## 🛠️ Tech Stack

- **Frontend**: Next.js1 6 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS
- **Authentication**: Google OAuth via Supabase Auth

## 📋 Prerequisites

- Node.js 20+
- A Supabase account
- A Google Cloud project for OAuth

## ⚙️ Setup Instructions

### 1. Supabase Setup

Create a new Supabase project and run this SQL:
```sql
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

-- Create policies
create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table bookmarks;

-- Enable full replica identity for realtime
alter table bookmarks replica identity full;

-- Create indexes
create index bookmarks_user_id_idx on public.bookmarks(user_id);
create index bookmarks_created_at_idx on public.bookmarks(created_at desc);
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret
7. In Supabase Dashboard > Authentication > Providers > Google:
   - Enable Google provider
   - Add Client ID and Client Secret

### 3. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Project Structure
```
bookmark-app/
├── app/
│   ├── actions/
│   │   ├── auth.ts           # Authentication server actions
│   │   └── bookmark.ts       # Bookmark CRUD server actions
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts      # OAuth callback handler
│   ├── BookmarksPage.tsx     # Client component wrapper
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main server component
├── components/
│   ├── AddBookmarkForm.tsx   # Bookmark creation form
│   ├── BookmarkList.tsx      # Real-time bookmark list
│   └── SignOutButton.tsx     # Sign out component
├── lib/
│   └── supabase/
│       ├── client.ts         # Browser Supabase client
│       └── server.ts         # Server Supabase client
```

## 🔥 Challenges Faced & Solutions

### Challenge 1: Authentication State Management
**Problem**: Session wasn't persisting across page refreshes, causing "Not authenticated" errors.

**Solution**: 
- Properly configured Supabase SSR with separate client/server instances
- Used cookiebased session management with Next.js server components
- Ensured server actions always use the server Supabase client (`@/lib/supabase/server`)

### Challenge 2: Real-time INSERT Events Not Broadcasting
**Problem**: Supabase Realtime DELETE events worked perfectly, but INSERT events weren't being received in other browser tabs.

**Root Cause**: Despite correct database configuration (Realtime enabled, RLS policies correct, replica identity set to FULL), INSERT events were not being broadcast by Supabase.

**Solutions Attempted**:
1. ✅ Verified RLS policies had correct `WITH CHECK` clause
2. ✅ Confirmed `ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks`
3. ✅ Set `ALTER TABLE bookmarks REPLICA IDENTITY FULL`
4. ✅ Checked Realtime subscription status (showed SUBSCRIBED)
5. ❌ None of the above fixed INSERT event broadcasting

**Final Solution - Hybrid Approach**:
Implemented a multi-layered real-time strategy:
```typescript
// Layer 1: Supabase Realtime (works for DELETE)
// Layer 2: BroadcastChannel API (instant cross-tab in same browser)
// Layer 3: Smart polling (30-second fallback for cross-device)
```

This hybrid approach provides:
- **Instant updates** for same-browser tabs via BroadcastChannel
- **Immediate deletes** via Supabase Realtime
- **30-second max delay** for cross-device via polling
- **less database load** than continuous polling


### Challenge 3: Row-Level Security Policy Issues
**Problem**: Initial INSERT policy had `with_check: null`, blocking inserts.

**Solution**:
```sql
-- Fixed policy with proper WITH CHECK clause
CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Challenge 4: OAuth Redirect URI Mismatch
**Problem**: Google OAuth returned "Error 400: redirect_uri_mismatch".

**Solution**:
- Google Cloud Console redirect URI must be Supabase callback URL
- **Correct**: `https://xxx.supabase.co/auth/v1/callback`
- **Wrong**: `http://localhost:3000/auth/callback`

## 🎓 Key Learnings

1. **Supabase Realtime has quirks** - Not all events broadcast reliably, need fallback strategies
2. **Hybrid approaches work** - Combining multiple technologies (Realtime + BroadcastChannel + polling) provides best UX
3. **Server vs Client context matters** - Next.js App Router requires careful client/server separation
4. **Row-Level Security is powerful** - Properly configured RLS eliminates need for backend authorization logic
5. **OAuth requires exact URLs** - Even minor mismatches in redirect URIs cause failures


## 🔒 Security Features

- **Row-Level Security** enforces data isolation
- **Server-side authentication** checks in all mutations
- **HTTP-only cookies** for session management
- **CSRF protection** via Supabase Auth


## 📝 Future Improvements

- [ ] Add bookmark categories/tags
- [ ] Implement search functionality
- [ ] Add bookmark URL validation
- [ ] Export bookmarks to JSON/CSV
- [ ] Implement bookmark archiving
- [ ] Add browser extension for quick bookmark saving



## 👤 Author

[Abhijith Rajesh] - Built as an assessment project

---

**Note**: This project demonstrates proficiency in Next.js 16, Supabase, real-time features, authentication, and problem-solving complex technical challenges.
