# AquaFarm Setup Guide

## Prerequisites
- Node.js 18+ (install from https://nodejs.org)
- A Supabase account (free tier works): https://supabase.com
- An Anthropic API key: https://console.anthropic.com
- (Optional) OpenWeatherMap API key for weather alerts: https://openweathermap.org/api

---

## Step 1 — Install Node.js
Download and install Node.js from https://nodejs.org/en/download

---

## Step 2 — Install dependencies
Open Terminal, navigate to this folder, and run:
```
npm install
```

---

## Step 3 — Set up Supabase

1. Go to https://supabase.com and create a new project
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

---

## Step 4 — Configure environment variables

Edit `.env.local` and fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key_here  # optional
```

---

## Step 5 — Run the app
```
npm run dev
```
Open http://localhost:3000

---

## First-time flow
1. Create an account at `/login`
2. Complete onboarding at `/onboarding` (pond setup, fish stocking)
3. You'll land on the dashboard with live feed recommendations

---

## Features
| Page | Description |
|---|---|
| `/dashboard` | Biomass, feed schedule, quick actions, alerts |
| `/feed` | Log morning/afternoon feed, custom meals |
| `/tracking` | Biomass chart, water quality, weight history, mortality |
| `/alerts` | All alerts, weather, manual triggers |
| `/ai` | Chat with AI assistant, disease photo identification |
