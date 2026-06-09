import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Brain, BarChart3, Mic, Target, Zap, Check,
  Github, Twitter, Linkedin, Star, ArrowRight,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewAI Pro — Ace your next interview with AI" },
      { name: "description", content: "AI-powered interview simulator with real-time feedback, performance analytics, and personalized coaching." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">InterviewAI <span className="text-muted-foreground text-xs">PRO</span></span>
          </Link>
          <nav className="ml-10 hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#testimonials" className="hover:text-foreground">Testimonials</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-gradient-primary border-0 shadow-elegant">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 border bg-card/60 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Now with multimodal voice + video analysis
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Ace your next interview <br />
            <span className="text-gradient">with an AI coach.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Practice realistic interviews tailored to your resume, role, or dream company. Get instant feedback on technical accuracy, communication, and confidence.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/signup"><Button size="lg" className="bg-gradient-primary border-0 shadow-elegant gap-2">Start practicing free <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/dashboard"><Button size="lg" variant="outline">Live demo</Button></Link>
          </div>
          <div className="mt-12 flex justify-center gap-8 text-xs text-muted-foreground">
            <div>⭐ 4.9/5 from 12,000+ users</div>
            <div className="hidden sm:block">🎯 89% report higher confidence</div>
            <div className="hidden md:block">🚀 Used at FAANG prep</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-4xl font-bold">Everything you need to prepare</h2>
          <p className="mt-3 text-muted-foreground">An end-to-end platform from resume to offer.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI Interviewer", desc: "Realistic voice-based interviews adapted to your level and target role." },
            { icon: BarChart3, title: "Deep Analytics", desc: "Track technical, communication, and confidence scores across sessions." },
            { icon: Mic, title: "Voice & Video", desc: "Analyze tone, pace, filler words, and eye contact in real time." },
            { icon: Target, title: "Role-Specific", desc: "Tailored question banks for SWE, Data, PM, Cybersecurity, and more." },
            { icon: Zap, title: "Instant Reports", desc: "Detailed PDF reports with strengths, weaknesses, and recommendations." },
            { icon: Sparkles, title: "Resume-Aware", desc: "Upload your resume — questions reference your actual projects." },
          ].map((f) => (
            <Card key={f.title} className="p-6 bg-gradient-card border-border/50 hover:shadow-elegant transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary mb-4 shadow-glow">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-secondary/30 border-y">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Loved by candidates</Badge>
            <h2 className="text-4xl font-bold">From practice to offer letter</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah K.", role: "SWE @ Google", text: "The AI feedback on filler words was a game changer. Got my offer in 3 weeks." },
              { name: "Marcus T.", role: "Data Scientist @ Amazon", text: "Best system design prep tool I've used. The reports are insanely detailed." },
              { name: "Priya R.", role: "PM @ Microsoft", text: "I practiced 20+ mock interviews here. Felt the real one was just another session." },
            ].map((t) => (
              <Card key={t.name} className="p-6 bg-card">
                <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
                <p className="text-sm mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-primary" />
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="text-4xl font-bold">Simple, transparent plans</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: "Free", price: "$0", desc: "Try the platform", features: ["3 interviews/month", "Basic reports", "Resume upload"] },
            { name: "Pro", price: "$19", desc: "For active job seekers", features: ["Unlimited interviews", "Advanced analytics", "PDF reports", "Video analysis"], featured: true },
            { name: "Team", price: "$49", desc: "For bootcamps & teams", features: ["Everything in Pro", "Team dashboards", "Custom question banks", "Priority support"] },
          ].map((p) => (
            <Card key={p.name} className={`p-8 ${p.featured ? "bg-gradient-card border-primary shadow-elegant relative" : ""}`}>
              {p.featured && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary border-0">Most popular</Badge>}
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-4 mb-6"><span className="text-4xl font-bold">{p.price}</span><span className="text-muted-foreground">/mo</span></div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" />{f}</li>)}
              </ul>
              <Link to="/signup" className="block"><Button className={`w-full ${p.featured ? "bg-gradient-primary border-0" : ""}`} variant={p.featured ? "default" : "outline"}>Get started</Button></Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/20">
        <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary"><Sparkles className="h-3.5 w-3.5 text-primary-foreground" /></div>
              <span className="font-semibold text-sm">InterviewAI Pro</span>
            </div>
            <p className="text-xs text-muted-foreground">AI-powered interview prep that actually works.</p>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Changelog"] },
            { title: "Company", links: ["About", "Blog", "Careers"] },
            { title: "Legal", links: ["Privacy", "Terms", "Security"] },
          ].map((c) => (
            <div key={c.title}>
              <div className="text-sm font-medium mb-3">{c.title}</div>
              <ul className="space-y-2 text-xs text-muted-foreground">{c.links.map(l => <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 InterviewAI Pro</span>
            <div className="flex gap-3">
              <Twitter className="h-4 w-4" /><Github className="h-4 w-4" /><Linkedin className="h-4 w-4" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
