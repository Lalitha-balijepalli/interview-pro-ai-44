import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — InterviewAI Pro" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your interview prep."
      footer={<>Don't have an account? <Link to="/signup" className="text-primary font-medium">Sign up</Link></>}
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/dashboard" }); }}>
        <Button type="button" variant="outline" className="w-full">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".7"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".5"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" opacity=".3"/></svg>
          Continue with Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary">Forgot?</Link>
          </div>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full bg-gradient-primary border-0 shadow-elegant">Sign in</Button>
      </form>
    </AuthShell>
  );
}
