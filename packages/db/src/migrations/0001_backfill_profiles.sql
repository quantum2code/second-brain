INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT id, email, now(), now()
FROM auth.users
ON CONFLICT (id) DO NOTHING;
