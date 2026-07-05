import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — InterviewAI Pro" }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created!");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Check your email to confirm your account.");
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start practicing in under a minute."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary border-0 shadow-elegant">
          {loading ? "Creating…" : "Create account"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">By signing up you agree to our Terms and Privacy Policy.</p>
      </form>
    </AuthShell>
  );
}
