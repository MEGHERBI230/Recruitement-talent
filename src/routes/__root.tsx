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
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
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
  const userNom = useCirta((s) => s.user.nom);
  const [name, setName] = useState(userNom || "MEGHERBI Nabil");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    login(name.trim());
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src={logo} alt="CIRTA" className="h-16 w-16 rounded-md bg-muted object-contain p-2" />
          <CardTitle className="mt-2">CIRTA Recruitment Assistant</CardTitle>
          <p className="text-xs text-muted-foreground">Connexion locale — sécurisée par le poste</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Votre nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="MEGHERBI Nabil" autoFocus />
            </div>
            <Button type="submit" className="w-full"><LogIn className="mr-2 h-4 w-4" /> Se connecter</Button>
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
