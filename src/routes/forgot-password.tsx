import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — InterviewAI Pro" }] }),
  component: Forgot,
});

function Forgot() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a magic link to reset it."
      footer={<>Remember it? <Link to="/login" className="text-primary font-medium">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Reset link sent — check your inbox."); }}>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required /></div>
        <Button type="submit" className="w-full bg-gradient-primary border-0 shadow-elegant">Send reset link</Button>
      </form>
    </AuthShell>
  );
}
