import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Cog,
  FileText,
  Users,
  ClipboardCheck,
  FlaskConical,
  FileBarChart,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo-cirta.png";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Postes", url: "/postes", icon: Briefcase },
  { title: "Machines", url: "/machines", icon: Cog },
  { title: "CV / Candidats", url: "/candidats", icon: FileText },
  { title: "Entretiens", url: "/entretiens", icon: Users },
  { title: "Tests pratiques", url: "/tests", icon: ClipboardCheck },
  { title: "Test comportemental", url: "/comportement", icon: FlaskConical },
  { title: "Rapports", url: "/rapports", icon: FileBarChart },
  { title: "Paramètres", url: "/parametres", icon: Settings },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <img src={logo} alt="CIRTA Automotive" className="h-10 w-10 rounded-md bg-background object-contain p-1" />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-sidebar-foreground">CIRTA</span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/70">
              Recruitment Assistant
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 text-[10px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          Zone Industrielle Ben Badis
          <br />
          El Khroub, Constantine
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
