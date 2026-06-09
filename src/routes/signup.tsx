import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — InterviewAI Pro" }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start practicing in under a minute."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/dashboard" }); }}>
        <Button type="button" variant="outline" className="w-full">Continue with Google</Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" required /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required /></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" required /></div>
        <Button type="submit" className="w-full bg-gradient-primary border-0 shadow-elegant">Create account</Button>
        <p className="text-xs text-muted-foreground text-center">By signing up you agree to our Terms and Privacy Policy.</p>
      </form>
    </AuthShell>
  );
}
