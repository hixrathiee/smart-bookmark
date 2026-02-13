# Smart Bookmark App

A simple full-stack bookmark manager built with Next.js (App Router), Supabase, and Tailwind CSS.

This application allows users to log in using Google OAuth, create private bookmarks, delete them, and see updates in real-time across multiple tabs.

---

## 🚀 Live Demo

https://smart-bookmark-anjali.vercel.app

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router)
- **Authentication:** Supabase (Google OAuth only)
- **Database:** Supabase Postgres
- **Realtime:** Supabase Realtime (Postgres changes subscription)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## ✨ Features

- Google Sign In / Sign Up (OAuth only)
- Add bookmark (Title + URL)
- Delete bookmark (with confirmation)
- Bookmarks are private per user (Row Level Security)
- Real-time updates across tabs (no refresh required)
- URL validation and form validation
- Session persistence across refresh
- Clean and responsive UI

---

## 🔐 Database Design

### Table: `bookmarks`

| Column     | Type      | Description |
|------------|----------|-------------|
| id         | uuid     | Primary key |
| title      | text     | Bookmark title |
| url        | text     | Bookmark URL |
| user_id    | uuid     | Linked to authenticated user |
| created_at | timestamptz | Timestamp |

---

## 🔒 Row Level Security (RLS)

RLS was enabled on the `bookmarks` table to ensure user data privacy.

Policies implemented:

- Users can read their own bookmarks  
  `auth.uid() = user_id`

- Users can insert bookmarks for themselves  
  `auth.uid() = user_id`

- Users can delete their own bookmarks  
  `auth.uid() = user_id`

This ensures users cannot access or modify other users’ data.

---

## 🔄 Realtime Implementation

Supabase Realtime was used to listen for `postgres_changes` on the `bookmarks` table.

When a bookmark is added or deleted in one tab, other open tabs automatically update without refreshing.

A subscription is created on component mount and properly unsubscribed on unmount to prevent memory leaks.

---

## ⚠️ Challenges Faced & Solutions

### 1️⃣ Login Page Flicker on Refresh
Initially, the login screen briefly appeared before the authenticated page loaded.

**Solution:**  
Added a `loading` state while checking `supabase.auth.getUser()` to prevent UI flicker.

---

### 2️⃣ Realtime WebSocket Warning in Development
Occasional WebSocket warnings appeared in development mode.

**Solution:**  
Properly unsubscribed from channels using `channel.unsubscribe()` in the cleanup function.  
This reduced unnecessary reconnections during hot reload.

---

### 3️⃣ UI Not Updating Immediately After Delete
The bookmark sometimes remained visible until refresh.

**Solution:**  
Updated local state immediately after successful delete, instead of relying only on realtime events.

---

### 4️⃣ URL Validation Issues
Users could enter invalid URLs like `google.com`, which caused navigation errors.

**Solution:**  
Implemented URL validation using the `URL` constructor and enforced `https://` format.

---

## 📁 Project Structure

app/
├── layout.tsx
├── page.tsx
lib/
├── supabase.ts


- `app/page.tsx` → Main UI and application logic
- `lib/supabase.ts` → Supabase client configuration

---

## 🧪 How to Run Locally

```bash
git clone https://github.com/hixrathiee/smart-bookmark.git
cd smart-bookmark
npm install
npm run dev
```
Create a `.env.local` file in the root directory and add:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase Dashboard under:

Project Settings → API

Then restart the development server:

```bash
npm run dev
```

## 🌍 Deployment

The application is deployed on Vercel.

Environment variables configured in Vercel:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
