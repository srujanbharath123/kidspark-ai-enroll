CREATE POLICY "Admins can create sessions"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));