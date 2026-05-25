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
  ExternalLink,
  LogOut,
  Mountain,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
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
  onWorkspaceChange,
  selectedWorkspaceName,
  selectedWorkspaceValue,
  vercelUrl,
  workspaceOptions,
  ...props
}: ComponentProps<typeof Sidebar> & {
  activeKey: string;
  authConfigured: boolean;
  items: readonly SidebarNavItem[];
  onSelect: (key: string) => void;
  onWorkspaceChange: (value: string) => void;
  selectedWorkspaceName: string;
  selectedWorkspaceValue: string;
  vercelUrl: string;
  workspaceOptions: { key: string; name: string }[];
}) {
  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-white/10 bg-[#050505] text-[#ededed] [--sidebar:#050505] [--sidebar-accent:rgba(255,255,255,0.08)] [--sidebar-border:rgba(255,255,255,0.1)] [--sidebar-foreground:#ededed]"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={selectedWorkspaceName}
              className="hover:bg-white/10 hover:text-white data-[active=true]:bg-white/10"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-[4px] border border-white/10 bg-white text-black">
                <Mountain className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col gap-1 leading-none">
                <span className="truncate font-medium">
                  {selectedWorkspaceName}
                </span>
                <span className="font-mono text-xs text-white/50">
                  Andes Relay
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pb-2">
          <label className="sr-only" htmlFor="workspace-selector">
            Workspace
          </label>
          <select
            id="workspace-selector"
            value={selectedWorkspaceValue}
            onChange={(event) => onWorkspaceChange(event.currentTarget.value)}
            className="h-9 w-full rounded-[4px] border border-white/10 bg-[#111] px-2 font-mono text-xs text-white outline-none focus:border-white/40"
          >
            <option value="all">All workspaces</option>
            {workspaceOptions.map((workspace) => (
              <option key={workspace.key} value={workspace.key}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40">
            Workspace
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Manage workspaces"
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Link href="/workspace">
                  <Users />
                  <span>Workspaces</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Open Vercel project"
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                <a href={vercelUrl} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  <span>Open Vercel</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40">Signals</SidebarGroupLabel>
          <SidebarMenu>
            {items.map(({ key, label, icon: Icon }) => (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton
                  isActive={activeKey === key}
                  onClick={() => onSelect(key)}
                  tooltip={label}
                  className="text-white/70 hover:bg-white/10 hover:text-white data-[active=true]:bg-white data-[active=true]:text-black"
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
            <span className="truncate text-sm font-medium text-white">
              {displayName}
            </span>
            <span className="truncate font-mono text-xs text-white/50">
              {email}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => openUserProfile()}
          tooltip="User settings"
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Settings />
          <span>User settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          tooltip="Log out"
          className="text-white/70 hover:bg-white/10 hover:text-white"
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
            <span className="truncate text-sm font-medium text-white">
              Local preview
            </span>
            <span className="truncate font-mono text-xs text-white/50">
              Clerk disabled
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
