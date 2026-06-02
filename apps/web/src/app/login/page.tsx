import AuthPanel from "@/components/auth-panel";

export default function LoginPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="grid gap-4">
        <div>
          <h1 className="text-2xl font-medium">Login</h1>
        </div>
        <AuthPanel mode="sign-in" redirectTo="/home" />
      </div>
    </div>
  );
}
