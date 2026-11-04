# Pune Prime Times 📰

A production-ready, mobile-first digital news publication built with **Next.js 14 (App Router, TypeScript)**, **Tailwind CSS**, and **Supabase (PostgreSQL, SSR Cookie Auth, Storage)**, designed for effortless deployment on **Vercel**.

---

## 🌟 Highlights & Architecture

- **Public Access**: Readers browse all published news without accounts, passwords, paywalls, or tracking.
- **Editorial Desk (`/admin`)**: Non-technical staff (Admins and Editors) log in to write headlines, format stories in rich text, upload compressed media, and publish live news in real time.
- **Tiptap Rich-Text Editor**: Supports Headings, Bold, Italic, Pullquotes, Bulleted & Numbered Lists, Links, Dividers, and Inline Image uploads.
- **Client-Side Image Optimization**: Powered by `browser-image-compression`. Cover photos and inline images are automatically resized (max 1600px) and compressed to `< 500KB` WebP in the browser before reaching Supabase Storage (`news-images`).
- **Robust Security & RLS**: All write access is gated by Postgres Row Level Security (RLS) policies checking the user's role in `public.profiles`. The service role key is never exposed to the client.
- **No LocalStorage Auth**: Completely uses Supabase SSR cookies (`@supabase/ssr`) and server-side Edge middleware (`middleware.ts`) to validate sessions via `auth.getUser()`.
- **Editorial Workflow**: Draft autosave every 30 seconds, auto-generated editable slugs, live article preview modal, one-click publish/unpublish, and breaking news banners.
- **SEO & Social Share Ready**: Dynamic `generateMetadata` for WhatsApp and Twitter cards, canonical tags, `sitemap.xml`, and `robots.txt`. Fast page loads via Incremental Static Regeneration (ISR).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router, React 18, TypeScript) |
| **Styling** | Tailwind CSS + `@tailwindcss/typography` |
| **Database & Auth** | Supabase (Postgres with RLS, Auth via SSR Cookies) |
| **Object Storage** | Supabase Storage (`news-images` bucket) |
| **Editor** | Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, Image, Link) |
| **Image Compression**| `browser-image-compression` |
| **Sanitization** | `isomorphic-dompurify` |
| **Validation** | `zod` |
| **Notifications** | `sonner` |
| **Hosting** | Vercel |

---

## 📂 Project Structure

```text
PunePrimeTimes/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx                # Masthead, Category Nav, Breaking Banner, Footer
│   │   ├── page.tsx                  # Home: Breaking Banner, Featured Hero, Beat Chips, Latest Grid
│   │   ├── news/[slug]/page.tsx      # Article Page: rich text, WhatsApp share, related stories
│   │   └── category/[slug]/page.tsx  # Category Archive with pagination
│   ├── admin/
│   │   ├── login/page.tsx            # Staff Sign In (Supabase Auth)
│   │   ├── layout.tsx                # Admin Dashboard frame & Navigation
│   │   ├── page.tsx                  # Articles table (search, filter, quick publish, delete)
│   │   ├── new/page.tsx              # Article creation studio
│   │   ├── [id]/edit/page.tsx        # Article editor with autosave & preview
│   │   └── categories/page.tsx       # Beat & Category management
│   ├── api/
│   │   ├── auth/callback/route.ts    # Supabase Auth code exchange
│   │   └── revalidate/route.ts       # On-demand cache revalidation endpoint
│   ├── globals.css                   # Editorial typography & prose styling
│   ├── layout.tsx                    # Root Layout & Toaster
│   ├── not-found.tsx                 # Custom 404 page
│   ├── error.tsx                     # Error boundary
│   ├── robots.ts                     # Dynamic robots.txt
│   └── sitemap.ts                    # Dynamic sitemap.xml
├── components/
│   ├── admin/
│   │   ├── AdminDashboardClient.tsx  # Article table with interactive filters & deletion
│   │   ├── AdminNav.tsx              # Responsive editorial header & user badge
│   │   ├── ArticleEditor.tsx         # Full editor form with draft autosave & modal preview
│   │   ├── CategoryManager.tsx       # Add, rename, and delete news beats
│   │   ├── CoverImageUpload.tsx      # Client-side compression & Supabase upload
│   │   ├── DeleteConfirmModal.tsx    # Modal dialog for safe deletions
│   │   └── TiptapEditor.tsx          # Rich text editor with formatting & inline image uploads
│   └── public/
│       ├── ArticleCard.tsx           # Mobile-first article card (Hero, Standard, Compact)
│       ├── BreakingBanner.tsx        # High-visibility red breaking news bar
│       ├── CategoryNav.tsx           # Horizontal swipeable category navigation
│       ├── Footer.tsx                # Editorial footer & staff login link
│       ├── Header.tsx                # Editorial masthead with date & edition
│       ├── RichTextRenderer.tsx      # Sanitized Tiptap HTML renderer
│       └── ShareButtons.tsx          # WhatsApp, Twitter/X, and clipboard copy buttons
├── lib/
│   ├── site-config.ts                # Site metadata & branding
│   ├── types.ts                      # Database & article TypeScript definitions
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (cookie-based)
│   │   ├── server.ts                 # Server Component client (next/headers cookies)
│   │   └── middleware.ts             # Session refresh & admin role verification
│   ├── utils/
│   │   ├── image-compression.ts      # Client-side image compression (<500KB, max 1600px)
│   │   ├── slugify.ts                # URL-safe slug generator
│   │   ├── format-date.ts            # Indian standard date & relative time formatting
│   │   └── sanitize.ts               # DOMPurify HTML sanitization
│   └── validations/
│       └── article.ts                # Zod schemas for server & form validation
├── supabase/
│   └── schema.sql                    # Complete PostgreSQL schema, RLS, Triggers, Storage & Seed data
├── middleware.ts                     # Edge middleware for /admin route protection
├── next.config.js                    # Remote image patterns for Supabase storage
└── tailwind.config.ts                # Editorial typography and crimson palette
```

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free or pro project.
2. Note your **Project URL** and **anon public key** from `Settings` -> `API`.

### Step 2: Run `supabase/schema.sql`

1. Open your Supabase project dashboard and navigate to the **SQL Editor** in the left sidebar.
2. Click **New query**, paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
3. This script will automatically:
   - Create tables: `profiles`, `categories`, `articles`.
   - Set up automated `updated_at` triggers.
   - Set up user signup trigger `on_auth_user_created` linking auth users to `profiles`.
   - Enable Row Level Security (RLS) on all tables with strict policies.
   - Create and configure the public Storage bucket `"news-images"` with upload policies.
   - Seed sample categories (*City & Metro, Civic & Infra, Tech & Innovation, Culture & Life, Business*) and 3 complete sample articles with rich text and cover images.

### Step 3: Create the First Admin User

1. In Supabase, go to **Authentication** -> **Users** -> **Add user** -> **Create user**.
2. Enter an email (e.g. `editor@puneprimetimes.com`) and a strong password. Click **Auto Confirm User?** = `Yes`.
3. Promote this user to `admin` by running this query in the **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where email = 'editor@puneprimetimes.com';
```

*(Note: You can also promote subsequent team members to `'editor'` or `'admin'` using the same query).*

### Step 4: Configure Local Environment

1. Clone or navigate to the project directory:
   ```bash
   cd PunePrimeTimes
   ```
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Open `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_NAME="Pune Prime Times"
   NEXT_PUBLIC_SITE_TAGLINE="Truth. Speed. Insight."
   ```

### Step 5: Run the Development Server

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open your browser:
   - **Public News Website**: [http://localhost:3000](http://localhost:3000)
   - **Editorial Staff Desk**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - Log in using the admin email and password created in Step 3.

---

## 🚢 Deploying to Vercel

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Go to [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
3. Import your `PunePrimeTimes` repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `NEXT_PUBLIC_SITE_URL`: Your production URL (e.g. `https://puneprimetimes.com` or `https://your-app.vercel.app`).
   - `NEXT_PUBLIC_SITE_NAME`: "Pune Prime Times"
   - `NEXT_PUBLIC_SITE_TAGLINE`: "Truth. Speed. Insight."
5. Click **Deploy**. Vercel will build and launch your production site.
6. In Supabase Dashboard -> **Authentication** -> **URL Configuration**:
   - Set **Site URL** to your Vercel production URL.
   - Add `https://your-domain.vercel.app/**` to **Redirect URLs**.

---

## 🔒 Security & Row-Level-Security (RLS) Model

1. **Anonymous Public Readers**:
   - Can only `SELECT` from `articles` where `status = 'published'`.
   - Can `SELECT` all rows from `categories`.
   - Can `SELECT` (read) images from the `news-images` storage bucket.
   - Cannot view draft articles, cannot modify content, cannot view profile emails.
2. **Staff (Admin & Editor)**:
   - Evaluated using `public.is_admin_or_editor()`, which verifies their role in `public.profiles`.
   - Can view all articles (including drafts), insert new articles, update content, and delete articles.
   - Can create, rename, and delete categories.
   - Can upload and delete images in the `news-images` storage bucket.
3. **Admin Exclusives**:
   - Can manage user roles in `public.profiles`.
4. **Service Role Key Protection**:
   - The Supabase Service Role Key is **never** embedded in client code or `.env.example`.
   - All authorization is enforced at the database level by PostgreSQL itself.

---

## 📝 Editorial Desk User Guide

- **Writing a New Article**: Go to `/admin/new`. Enter your headline; a URL-safe slug is generated automatically (which you can customize). Add an excerpt, select a category, upload a cover image, and type or paste your story into the Tiptap editor.
- **Autosave**: If you step away, drafts are automatically saved every 30 seconds.
- **Breaking News Banner**: Toggle **Breaking News** on any urgent story. It will immediately appear in the prominent red ticker banner across the top of the homepage.
- **Hero Spotlight**: Toggle **Featured Story (Hero)** to display the article in the premier front-page spotlight position.
- **Preview**: Click the **Preview** button at any time to inspect how your story will look to readers on mobile and desktop before publishing.

---

© 2026 Pune Prime Times. Built for speed, truth, and modern journalism.

