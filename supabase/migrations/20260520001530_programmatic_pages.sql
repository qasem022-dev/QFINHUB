-- Create programmatic_pages table for mega-SEO scaling (500+ pages/day)
-- Used by ISR route /scenario/[id] to serve data-driven content pages

CREATE TABLE IF NOT EXISTS public.programmatic_pages (
    slug                TEXT PRIMARY KEY,
    calculator_slug     TEXT NOT NULL,
    calculator_name     TEXT NOT NULL,
    category            TEXT NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    h1                  TEXT NOT NULL,
    content_html        TEXT NOT NULL,
    meta_title          TEXT NOT NULL,
    meta_description    TEXT NOT NULL,
    params              JSONB NOT NULL DEFAULT '{}',
    computed_values     JSONB DEFAULT '{}',
    faqs                JSONB DEFAULT '[]',
    schema_ld           JSONB DEFAULT '{}',
    related_slugs       TEXT[] DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_prog_calc_slug ON public.programmatic_pages(calculator_slug);
CREATE INDEX IF NOT EXISTS idx_prog_category ON public.programmatic_pages(category);
CREATE INDEX IF NOT EXISTS idx_prog_created ON public.programmatic_pages(created_at DESC);

-- Public read access (ISR route uses anon key)
ALTER TABLE public.programmatic_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
    ON public.programmatic_pages 
    FOR SELECT 
    USING (true);
