import React from "react";
import { T } from "@/i18n";
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
import { ActiveSection, PROFILE_MENU_ITEMS } from "../types";

interface ProfileSidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeSection,
  onSectionChange
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const mainItems = PROFILE_MENU_ITEMS;
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel><T>Profile</T></SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    className={activeSection === item.id ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span><T>{item.label}</T></span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
