-- Run this SQL in your Supabase SQL editor to update the schema

-- 1. Add the new value to the todo_urgency enum
ALTER TYPE public.todo_urgency ADD VALUE IF NOT EXISTS 'not_important_not_urgent';

-- 2. Drop the automatic completion sync trigger and function.
-- This allows us to mark items as completed (is_done = true) while keeping them in their original Eisenhower Matrix quadrants, or re-open them.
DROP TRIGGER IF EXISTS todos_sync_completion ON public.todos;
DROP FUNCTION IF EXISTS public.sync_todo_completion();
