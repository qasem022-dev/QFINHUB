-- ─────────────────────────────────────────────────────────────
-- QFINHUB: Create saved_plans table with Row Level Security
-- ─────────────────────────────────────────────────────────────
-- This table stores AI-generated financial calculators that
-- users save from the AI Custom Specialist.
-- ─────────────────────────────────────────────────────────────

-- 1. Create the saved_plans table
CREATE TABLE IF NOT EXISTS public.saved_plans (
  id         UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  config     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT saved_plans_pkey PRIMARY KEY (id)
);

-- 2. Add comments for documentation
COMMENT ON TABLE public.saved_plans IS 'Stores AI-generated financial calculators saved by users';
COMMENT ON COLUMN public.saved_plans.id IS 'Unique identifier for each saved plan';
COMMENT ON COLUMN public.saved_plans.user_id IS 'References the user who owns this plan';
COMMENT ON COLUMN public.saved_plans.title IS 'Display title of the saved calculator';
COMMENT ON COLUMN public.saved_plans.config IS 'Full AICalculatorResponse JSON (inputs, results, chart, plan, table)';
COMMENT ON COLUMN public.saved_plans.created_at IS 'Timestamp when the plan was first saved';
COMMENT ON COLUMN public.saved_plans.updated_at IS 'Timestamp when the plan was last modified';

-- 3. Enable Row Level Security
ALTER TABLE public.saved_plans ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────

-- 3a. SELECT: users can only see their own plans
CREATE POLICY "Users can view their own plans"
  ON public.saved_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3b. INSERT: users can only create plans where they are the owner
CREATE POLICY "Users can create their own plans"
  ON public.saved_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3c. DELETE: users can only delete their own plans
CREATE POLICY "Users can delete their own plans"
  ON public.saved_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3d. UPDATE: users can update their own plans
CREATE POLICY "Users can update their own plans"
  ON public.saved_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTE: UPDATE policy is enabled so users can edit their saved plans.
-- Remove this policy if plans should be immutable after creation.

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

-- Primary lookup: all queries filter by user_id
CREATE INDEX IF NOT EXISTS idx_saved_plans_user_id
  ON public.saved_plans (user_id);

-- List pages order by most recent first
CREATE INDEX IF NOT EXISTS idx_saved_plans_user_id_created_at
  ON public.saved_plans (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Trigger: auto-update updated_at timestamp
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_saved_plans_updated_at
  BEFORE UPDATE ON public.saved_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
