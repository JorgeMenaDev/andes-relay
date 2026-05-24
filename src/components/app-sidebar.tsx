"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useClerk, useUser } from "@clerk/nextjs";
import type { LucideIcon } from "lucide-react";
import {
  LogOut,
  Mountain,
  Settings,
  UserCircle,
} from "lucide-react";
import type { ComponentProps } from "react";

export type SidebarNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
};

export function AppSidebar({
  activeKey,
  authConfigured,
  items,
  onSelect,
  ...props
}: ComponentProps<typeof Sidebar> & {
  activeKey: string;
  authConfigured: boolean;
  items: readonly SidebarNavItem[];
  onSelect: (key: string) => void;
}) {
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Andes Relay">
              <div className="flex aspect-square size-8 items-center justify-center rounded-[4px] bg-[#201d1d] text-[#fdfcfc]">
                <Mountain className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Andes Relay</span>
                <span className="font-mono text-xs text-sidebar-foreground/65">
                  Live dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Signals</SidebarGroupLabel>
          <SidebarMenu>
            {items.map(({ key, label, icon: Icon }) => (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton
                  isActive={activeKey === key}
                  onClick={() => onSelect(key)}
                  tooltip={label}
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        {authConfigured ? <ClerkUserMenu /> : <LocalUserMenu />}
      </SidebarFooter>
    </Sidebar>
  );
}

function ClerkUserMenu() {
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "Signed in";
  const displayName = user?.fullName ?? email;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip={email}>
          <UserCircle className="size-5" />
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-medium">{displayName}</span>
            <span className="truncate font-mono text-xs text-sidebar-foreground/65">
              {email}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => openUserProfile()}
          tooltip="User settings"
        >
          <Settings />
          <span>User settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          tooltip="Log out"
        >
          <LogOut />
          <span>Log out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function LocalUserMenu() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip="Clerk is not configured locally">
          <UserCircle className="size-5" />
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-medium">Local preview</span>
            <span className="truncate font-mono text-xs text-sidebar-foreground/65">
              Clerk disabled
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
