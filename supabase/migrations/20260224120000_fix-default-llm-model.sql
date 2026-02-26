-- Fix default LLM model: google/gemini-3-flash-preview does not exist
-- Replace with gemini-2.0-flash (valid Google AI Studio model name)
ALTER TABLE project_agents
  ALTER COLUMN llm_model SET DEFAULT 'gemini-2.0-flash';
