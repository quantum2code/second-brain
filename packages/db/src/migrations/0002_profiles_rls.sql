ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by owner" ON "profiles";
CREATE POLICY "Profiles are viewable by owner"
ON "profiles"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are editable by owner" ON "profiles";
CREATE POLICY "Profiles are editable by owner"
ON "profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are insertable by owner" ON "profiles";
CREATE POLICY "Profiles are insertable by owner"
ON "profiles"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
