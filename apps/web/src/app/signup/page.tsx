import AuthPanel from "@/components/auth-panel";

export default function SignupPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="grid gap-4">
        <div>
          <h1 className="text-2xl font-medium">Sign Up</h1>
        </div>
        <AuthPanel mode="sign-up" redirectTo="/home" />
      </div>
    </div>
  );
}
