-- Allow admins to insert trainer_availability
CREATE POLICY "Admins can insert availability" ON public.trainer_availability
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update trainer_availability
CREATE POLICY "Admins can update availability" ON public.trainer_availability
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete trainer_availability
CREATE POLICY "Admins can delete availability" ON public.trainer_availability
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));