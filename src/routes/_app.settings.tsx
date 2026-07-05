import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, LogOut, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useUser, initialsFrom, displayName, displayTitle } from "@/lib/use-user";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — InterviewAI Pro" }] }),
  component: Settings,
});

function Settings() {
  const { theme, toggle } = useTheme();
  const { user, loading, refresh } = useUser();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPw, setUpdatingPw] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) return toast.error(error.message);
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  }

  useEffect(() => {
    if (!user) return;
    setFullName(displayName(user));
    setTitle(displayTitle(user));
  }, [user]);

  const initials = initialsFrom(fullName || displayName(user), user?.email);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, title },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Profile updated");
  }

  async function updatePassword() {
    if (!newPassword) return toast.error("Enter a new password");
    setUpdatingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPw(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    toast.success("Password updated");
  }

  return (
    <>
      <AppHeader title="Settings" />
      <div className="p-6 space-y-6 max-w-3xl">
        <Card className="p-6">
          <h3 className="font-semibold mb-1">Profile information</h3>
          <p className="text-sm text-muted-foreground mb-5">Update your personal details.</p>
          <div className="flex items-center gap-4 mb-5">
            <Avatar className="h-16 w-16"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">{initials}</AvatarFallback></Avatar>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" disabled={loading || !user} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full Stack Developer" disabled={loading || !user} />
            </div>
          </div>
          <div className="mt-5">
            <Button className="bg-gradient-primary border-0" onClick={saveProfile} disabled={saving || !user}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {!user && !loading && (
              <p className="text-xs text-muted-foreground mt-2">Sign in to edit your profile.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-1">Account settings</h3>
          <p className="text-sm text-muted-foreground mb-5">Manage your password and security.</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button variant="outline" onClick={updatePassword} disabled={updatingPw || !user}>
              {updatingPw ? "Updating…" : "Update password"}
            </Button>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-medium">Sign out</div>
                  <div className="text-xs text-muted-foreground">End your session on this device.</div>
                </div>
                <Button variant="destructive" onClick={handleSignOut} disabled={signingOut || !user} className="gap-2">
                  <LogOut className="h-4 w-4" />{signingOut ? "Signing out…" : "Sign out"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-1">Appearance</h3>
          <p className="text-sm text-muted-foreground mb-5">Switch between light and dark mode.</p>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <div>
                <div className="text-sm font-medium">{theme === "dark" ? "Dark" : "Light"} mode</div>
                <div className="text-xs text-muted-foreground">Toggle the interface theme.</div>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggle} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-1">Notifications</h3>
          <p className="text-sm text-muted-foreground mb-5">Choose what we email you about.</p>
          <div className="space-y-3">
            {[
              { label: "Weekly progress summary", desc: "A digest of your performance every Monday.", on: true },
              { label: "New question packs", desc: "Be notified when new interview content drops.", on: true },
              { label: "Marketing & tips", desc: "Occasional product updates and prep tips.", on: false },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <div className="text-sm font-medium">{n.label}</div>
                  <div className="text-xs text-muted-foreground">{n.desc}</div>
                </div>
                <Switch defaultChecked={n.on} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
