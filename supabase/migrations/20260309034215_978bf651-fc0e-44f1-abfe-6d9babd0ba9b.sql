CREATE POLICY "Role is immutable by user" ON public.profiles
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()));