import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { useCirta } from "@/store/useCirta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, LogIn, User } from "lucide-react";
import { AIUsageBadge } from "@/components/AIControls";
import logo from "@/assets/logo-cirta.png";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CIRTA Recruitment Assistant" },
      { name: "description", content: "Plateforme intelligente d'aide au recrutement industriel — CIRTA AUTOMOTIVE" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "CIRTA Recruitment Assistant" },
      { property: "og:description", content: "Plateforme intelligente d'aide au recrutement industriel — CIRTA AUTOMOTIVE" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "CIRTA Recruitment Assistant" },
      { name: "twitter:description", content: "Plateforme intelligente d'aide au recrutement industriel — CIRTA AUTOMOTIVE" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a6c1fbc-40b0-49d5-b565-42c83d6db43d/id-preview-31bde14f--4fa4ba25-30d6-4d2c-8384-f57f0c7abb3c.lovable.app-1777990979771.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a6c1fbc-40b0-49d5-b565-42c83d6db43d/id-preview-31bde14f--4fa4ba25-30d6-4d2c-8384-f57f0c7abb3c.lovable.app-1777990979771.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function LoginGate() {
  const login = useCirta((s) => s.login);
  const [email, setEmail] = useState("admin@cirta.dz");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = login(email, password);
    if (!r.ok) setErr(r.error || "Erreur de connexion");
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src={logo} alt="CIRTA" className="h-16 w-16 rounded-md bg-muted object-contain p-2" />
          <CardTitle className="mt-2">CIRTA Recruitment Assistant</CardTitle>
          <p className="text-xs text-muted-foreground">Connexion sécurisée par mot de passe</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@cirta.dz" autoFocus />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button type="submit" className="w-full"><LogIn className="mr-2 h-4 w-4" /> Se connecter</Button>
            <p className="text-[10px] text-muted-foreground text-center">Admin par défaut : admin@cirta.dz / admin</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RootComponent() {
  const isLoggedIn = useCirta((s) => s.auth.isLoggedIn);
  const displayName = useCirta((s) => s.auth.displayName);
  const logout = useCirta((s) => s.logout);

  if (!isLoggedIn) return <LoginGate />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex flex-1 items-center gap-2">
              <span className="text-sm font-semibold text-foreground">CIRTA Recruitment Assistant</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                — Plateforme d'aide au recrutement industriel
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block"><AIUsageBadge compact /></div>
              <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs sm:flex">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">{displayName}</span>
              </div>
              <Button size="sm" variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Déconnexion
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
