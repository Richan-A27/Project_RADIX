-- RADIX Talent Match — Supabase Schema
-- Run this in your Supabase SQL Editor (https://cmijqmlwzhgqcisysmzl.supabase.co)

-- JD Analyses table — stores extracted skill data from job descriptions
CREATE TABLE IF NOT EXISTS jd_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT DEFAULT 'jd',
  source_file TEXT NOT NULL,
  company TEXT,
  role TEXT,
  skills JSONB NOT NULL DEFAULT '[]',
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE jd_analyses ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth for now)
CREATE POLICY "Allow all access" ON jd_analyses
  FOR ALL USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_jd_analyses_created_at ON jd_analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jd_analyses_company ON jd_analyses (company);

-- Resume Analyses table — stores extracted skill data from candidate resumes
CREATE TABLE IF NOT EXISTS resume_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT DEFAULT 'resume',
  source_file TEXT NOT NULL,
  company TEXT,
  role TEXT,
  skills JSONB NOT NULL DEFAULT '[]',
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth for now)
CREATE POLICY "Allow all access" ON resume_analyses
  FOR ALL USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_resume_analyses_created_at ON resume_analyses (created_at DESC);
