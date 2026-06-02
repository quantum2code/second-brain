CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	INSERT INTO public.profiles (id, email, created_at, updated_at)
	VALUES (NEW.id, NEW.email, now(), now())
	ON CONFLICT (id) DO UPDATE
	SET email = EXCLUDED.email,
	    updated_at = now();

	RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON "profiles"
FOR EACH ROW
EXECUTE FUNCTION public.set_profiles_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_upsert ON auth.users;
CREATE TRIGGER on_auth_user_upsert
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_from_auth_user();
