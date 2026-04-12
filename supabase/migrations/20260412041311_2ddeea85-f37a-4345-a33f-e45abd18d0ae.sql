
-- Create material type enum
CREATE TYPE public.material_type AS ENUM ('pdf', 'video', 'link', 'notification');

-- Create session_materials table
CREATE TABLE public.session_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  material_type material_type NOT NULL DEFAULT 'notification',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_materials ENABLE ROW LEVEL SECURITY;

-- Trainers can insert materials for their sessions
CREATE POLICY "Trainers can insert materials"
ON public.session_materials FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = trainer_id
  AND EXISTS (SELECT 1 FROM public.sessions WHERE id = session_id AND trainer_id = auth.uid())
);

-- Trainers can update their own materials
CREATE POLICY "Trainers can update own materials"
ON public.session_materials FOR UPDATE
TO authenticated
USING (auth.uid() = trainer_id);

-- Trainers can delete their own materials
CREATE POLICY "Trainers can delete own materials"
ON public.session_materials FOR DELETE
TO authenticated
USING (auth.uid() = trainer_id);

-- Parents can view materials for their sessions, trainers for theirs, admins all
CREATE POLICY "Users can view relevant materials"
ON public.session_materials FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
    AND (s.parent_id = auth.uid() OR s.trainer_id = auth.uid())
  )
  OR has_role(auth.uid(), 'admin')
);

-- Create storage bucket for session materials
INSERT INTO storage.buckets (id, name, public) VALUES ('session-materials', 'session-materials', true);

CREATE POLICY "Trainers can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'session-materials');

CREATE POLICY "Anyone authenticated can view materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'session-materials');

CREATE POLICY "Trainers can delete own materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'session-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
