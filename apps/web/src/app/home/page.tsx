import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="grid gap-4">
        <section className="rounded-lg border p-4">
          <h1 className="text-2xl font-medium">Home</h1>
          <p className="mt-2 text-sm text-muted-foreground">This page is protected.</p>
          <p className="mt-4 text-sm">Signed in as {data.user.email ?? data.user.id}</p>
        </section>
      </div>
    </div>
  );
}
