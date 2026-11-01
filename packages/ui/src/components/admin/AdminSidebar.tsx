import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { T, translate } from "@/i18n";
import { LayoutDashboard, Users, Server, Shield, AlertTriangle, ChartBar, Settings, Database, Video, Package, ScrollText, ShieldCheck, Globe } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import { useLocation, useNavigate } from "react-router-dom";

export type AdminActiveSection = 'dashboard' | 'users' | 'server' | 'bans' | 'violations' | 'analytics' | 'storage' | 'videos' | 'products' | 'acl' | 'logs' | 'zitadel' | 'sites';

const menuItems = [
  { id: 'dashboard' as AdminActiveSection, label: translate('Dashboard'), icon: LayoutDashboard },
  { id: 'users' as AdminActiveSection, label: translate('Users'), icon: Users },
  { id: 'server' as AdminActiveSection, label: translate('Server'), icon: Server },
  { id: 'bans' as AdminActiveSection, label: translate('Bans'), icon: Shield },
  { id: 'violations' as AdminActiveSection, label: translate('Violations'), icon: AlertTriangle },
  { id: 'analytics' as AdminActiveSection, label: translate('Analytics'), icon: ChartBar },
  { id: 'logs' as AdminActiveSection, label: translate('Logs'), icon: ScrollText },
  { id: 'zitadel' as AdminActiveSection, label: translate('Zitadel'), icon: ShieldCheck },
  { id: 'storage' as AdminActiveSection, label: translate('Storage'), icon: Database },
  { id: 'videos' as AdminActiveSection, label: translate('Videos'), icon: Video },
  { id: 'products' as AdminActiveSection, label: translate('Products'), icon: Package },
  { id: 'acl' as AdminActiveSection, label: translate('ACL'), icon: Shield },
  ...(import.meta.env.VITE_ENABLE_SITE_ADMIN === 'true'
    ? [{ id: 'sites' as AdminActiveSection, label: translate('Sites'), icon: Globe }]
    : []),
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  // ── Mobile: horizontal scrollable nav strip ──────────────────────
  if (isMobile) {
    return (
      <nav className="w-full overflow-x-auto border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-14 z-30">
        <div className="flex gap-1 px-2 py-1.5 min-w-max">
          {menuItems.map((item) => {
            const isActive = (item.id === 'users' && (location.pathname === '/admin' || location.pathname === '/admin/')) || location.pathname.includes(`/admin/${item.id}`);
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/admin/${item.id}`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // ── Desktop: standard vertical sidebar ───────────────────────────
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel><T>Admin</T></SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = (item.id === 'users' && (location.pathname === '/admin' || location.pathname === '/admin/')) || location.pathname.includes(`/admin/${item.id}`);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => navigate(`/admin/${item.id}`)}
                      className={isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
