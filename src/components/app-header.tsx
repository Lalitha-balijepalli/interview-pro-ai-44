import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function AppHeader({ title }: { title: string }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-xl px-4">
      <SidebarTrigger />
      <h1 className="text-sm font-medium">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">AM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
