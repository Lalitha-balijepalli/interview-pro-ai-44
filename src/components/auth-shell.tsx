import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-hero relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">InterviewAI <span className="text-muted-foreground text-xs">PRO</span></span>
        </Link>
        <div className="z-10 max-w-md">
          <p className="text-2xl font-medium leading-relaxed">
            "Practicing here for 2 weeks helped me land my dream offer. The feedback feels eerily human."
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-primary" />
            <div>
              <div className="text-sm font-medium">Sarah Kim</div>
              <div className="text-xs text-muted-foreground">SWE @ Google</div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
            <span className="font-semibold">InterviewAI Pro</span>
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-center text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
