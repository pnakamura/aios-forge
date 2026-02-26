-- Add workflows column to projects table for project-level workflow definitions
ALTER TABLE public.projects ADD COLUMN workflows jsonb NOT NULL DEFAULT '[]'::jsonb;