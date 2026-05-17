# APU Room Booking System

A real time room booking web application for Asia Pacific University. Students can browse campus buildings, view live room availability, and book rooms directly from their browser.

## Features

- 🗺️ Interactive SVG campus map with clickable buildings
- ⚡ Real time availability updates via Supabase Realtime
- 📅 Slot-based booking system (1-hour slots, max 2 per day per room)
- 📧 Email confirmation with QR code on every booking
- 👤 User authentication (email & password)
- 📋 My Bookings dashboard view, edit, and cancel bookings
- 🔍 Search and filter rooms by name or type
- 🛡️ Admin panel view all bookings, cancel with reason, notify student via email
- 📱 Mobile responsive

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL + Realtime) |
| Email | Resend + Supabase Edge Functions |
| Deployment | Vercel |

## Getting Started

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/apu-booking.git
cd apu-booking
npm install
```

### 2. Set up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the Supabase SQL Editor
3. Create a storage bucket called `avatars` and set it to public

### 3. Environment variables
```bash
cp .env.local.example .env.local
```
Fill in your Supabase URL and anon key.

### 4. Run locally
```bash
npm run dev
```

## Deployment

Deployed on Vercel. Add the environment variables in Vercel dashboard under Settings → Environment Variables.