import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useUser, initialsFrom, displayName, displayTitle } from "@/lib/use-user";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — InterviewAI Pro" }] }),
  component: Settings,
});

function Settings() {
  const { theme, toggle } = useTheme();
  const { user, loading, refresh } = useUser();
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPw, setUpdatingPw] = useState(false);

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
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button variant="outline" onClick={updatePassword} disabled={updatingPw || !user}>
              {updatingPw ? "Updating…" : "Update password"}
            </Button>
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
