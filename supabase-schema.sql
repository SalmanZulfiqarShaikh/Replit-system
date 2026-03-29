-- ============================================================
-- Salman's System — Supabase Schema
-- Run this entire script in Supabase SQL Editor
-- Project: mqewngxecxpinrujnwhs
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sessions table (for session management)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Daily check-ins
CREATE TABLE IF NOT EXISTS daily_checkins (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  has_uni BOOLEAN NOT NULL DEFAULT false,
  has_office BOOLEAN NOT NULL DEFAULT false,
  tasks TEXT NOT NULL DEFAULT '',
  available_hours REAL NOT NULL DEFAULT 0,
  pomodoro_sessions INTEGER NOT NULL DEFAULT 0,
  hours_logged REAL NOT NULL DEFAULT 0,
  ai_schedule TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pomodoro sessions
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  work_duration INTEGER NOT NULL DEFAULT 25,
  break_duration INTEGER NOT NULL DEFAULT 5,
  completed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Episode progress
CREATE TABLE IF NOT EXISTS episode_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  episode_id TEXT NOT NULL,
  episode_title TEXT NOT NULL,
  phase TEXT NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY REFERENCES users(id),
  current_phase TEXT NOT NULL DEFAULT 'Phase 1',
  total_hours_logged REAL NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_check_in TEXT,
  achievements TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed Salman as the sole user
INSERT INTO users (id, email, first_name, last_name)
VALUES ('salman-001', 'ss3000569@gmail.com', 'Salman', 'Zulfiqar')
ON CONFLICT (id) DO NOTHING;

-- Create Salman's profile
INSERT INTO user_profiles (id)
VALUES ('salman-001')
ON CONFLICT (id) DO NOTHING;
