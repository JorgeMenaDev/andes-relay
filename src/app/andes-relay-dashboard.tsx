"use client";

import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  LifeBuoy,
  ListFilter,
  Mail,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Search,
  Settings,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { CSSProperties } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const tabs = [
  { key: "all", label: "Activity", icon: ListFilter },
  { key: "tickets", label: "Support", icon: LifeBuoy },
  { key: "feedback", label: "Feedback", icon: MessageSquareText },
  { key: "forms", label: "Forms", icon: ClipboardList },
  { key: "accounts", label: "Accounts", icon: UserPlus },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "emails", label: "Email", icon: Mail },
  { key: "searches", label: "Search", icon: Search },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

const activityTypes = [
  { key: "all", label: "All types" },
  { key: "ticket", label: "Support" },
  { key: "feedback", label: "Feedback" },
  { key: "form", label: "Forms" },
  { key: "account", label: "Accounts" },
  { key: "contact", label: "Contacts" },
  { key: "email", label: "Email" },
  { key: "search", label: "Search" },
] as const;

const timeWindows = [
  { key: "24h", label: "Latest 24 hours", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", label: "Latest 7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "all", label: "All time", ms: null },
] as const;

type SourceSettings = {
  discoveredProducts: { productKey: string; workspaceKey: string }[];
  discoveredWorkspaces: string[];
  products: { key: string; name: string; workspaceKey: string }[];
  workspaces: { key: string; name: string }[];
};

type WorkspaceInvite = {
  _id: Id<"workspaceInvites">;
  workspaceKey: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "revoked";
  createdAt: number;
};

type ProductOption = {
  productKey: string;
  value: string;
  workspaceKey: string;
};

type SourceFilter = {
  productKey?: string;
  workspaceKey?: string;
};

type ArchiveTarget =
  | { id: Id<"supportTickets">; type: "ticket" }
  | { id: Id<"feedbackItems">; type: "feedback" }
  | { id: Id<"contactSubmissions">; type: "form" }
  | { id: Id<"accountCreations">; type: "account" }
  | { id: Id<"contacts">; type: "contact" }
  | { id: Id<"emailJobs">; type: "email" }
  | { id: Id<"helpSearches">; type: "search" };

type ThemeMode = "dark" | "light";

const tableShellClass =
  "overflow-hidden rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-white dark:border-white/10 dark:bg-[#111]";
const tableHeadClass =
  "border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] font-mono text-xs uppercase tracking-wide text-[#646262] dark:border-white/10 dark:bg-[#181818] dark:text-white/45";
const tableBodyClass =
  "divide-y divide-[rgba(15,0,0,0.08)] dark:divide-white/10";
const cardClass =
  "rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-white p-4 dark:border-white/10 dark:bg-[#111]";
const primaryTextClass = "text-[#201d1d] dark:text-white";
const secondaryTextClass = "text-[#646262] dark:text-white/55";

const keyLabel = (key: string) =>
  key
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ") || key;

const sourceNames = (settings?: SourceSettings) => {
  const workspaceNames = new Map(
    settings?.workspaces.map((item) => [item.key, item.name]),
  );
  const productNames = new Map(
    settings?.products.map((item) => [
      `${item.workspaceKey}:${item.key}`,
      item.name,
    ]),
  );

  return {
    productName: (workspaceKey: string, productKey: string) =>
      productNames.get(`${workspaceKey}:${productKey}`) ?? keyLabel(productKey),
    workspaceName: (key: string) => workspaceNames.get(key) ?? keyLabel(key),
  };
};

const productOptionValue = (workspaceKey: string, productKey: string) =>
  `${workspaceKey}:${productKey}`;

const queryFilters = ({
  productValue,
  workspaceValue,
}: {
  productValue: string;
  workspaceValue: string;
}): SourceFilter => {
  if (productValue !== "all") {
    const [workspaceKey, productKey] = productValue.split(":");

    return { productKey, workspaceKey };
  }

  return workspaceValue === "all" ? {} : { workspaceKey: workspaceValue };
};

const formatDate = (value: number) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-2 font-mono text-xs font-medium text-[#646262] dark:border-white/10 dark:bg-white/5 dark:text-white/65">
      {children}
    </span>
  );
}

function SignalActions({
  label,
  target,
}: {
  label: string;
  target: ArchiveTarget;
}) {
  const archiveSignal = useMutation(api.signals.archive);
  const [archiving, setArchiving] = useState(false);

  const archive = async () => {
    if (!window.confirm(`Archive ${label}? It will be removed from this view.`)) {
      return;
    }

    setArchiving(true);
    try {
      await archiveSignal({ target });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Open actions for ${label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-white text-[#646262] hover:bg-[#f8f7f7] disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
          disabled={archiving}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-36 rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#181818]"
        >
          <DropdownMenu.Item
            disabled={archiving}
            onSelect={(event) => {
              event.preventDefault();
              void archive();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-[3px] px-2 py-2 font-mono text-xs text-[#201d1d] outline-none hover:bg-[#f8f7f7] disabled:pointer-events-none disabled:opacity-40 dark:text-white/85 dark:hover:bg-white/10"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function FilterSelect({
  label,
  onChange,
  tone = "light",
  value,
  children,
}: {
  label: string;
  onChange: (value: string) => void;
  tone?: "dark" | "light";
  value: string;
  children: ReactNode;
}) {
  const isDark = tone === "dark";

  return (
    <label
      className={`flex min-w-44 flex-col gap-1 font-mono text-xs ${
        isDark ? "text-white/45" : "text-[#646262] dark:text-white/45"
      }`}
    >
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={`h-10 rounded-[4px] border px-3 text-sm outline-none ${
          isDark
            ? "border-white/10 bg-[#050505] text-white focus:border-white/40"
            : "border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] text-[#201d1d] focus:border-[#646262] dark:border-white/10 dark:bg-[#050505] dark:text-white dark:focus:border-white/40"
        }`}
      >
        {children}
      </select>
    </label>
  );
}

function SourceStamp({
  productKey,
  settings,
  workspaceKey,
}: {
  productKey: string;
  settings?: SourceSettings;
  workspaceKey: string;
}) {
  const names = sourceNames(settings);

  return (
    <div className="flex min-w-40 flex-col gap-1">
      <span className="text-sm font-semibold text-[#201d1d] dark:text-white">
        {names.workspaceName(workspaceKey)}
      </span>
      <span className="font-mono text-xs text-[#646262] dark:text-white/55">
        {names.productName(workspaceKey, productKey)}
      </span>
    </div>
  );
}

function SetupScreen() {
  return (
    <main className="min-h-screen bg-[#f7f4ea] px-4 py-6 text-[#161410] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#d8d1bf] pb-5">
          <div>
            <p className="font-mono text-sm font-medium uppercase tracking-wide text-[#7b3f00]">
              Andes Relay
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Shared support, feedback, help search, and email control.
            </h1>
          </div>
          <Settings className="mt-1 h-6 w-6 text-slate-500" />
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <h2 className="text-base font-semibold text-amber-950">
                Convex is not connected yet
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-900">
                Run the Convex setup and keep `NEXT_PUBLIC_CONVEX_URL` in
                `.env.local`. The dashboard will switch to live data as soon as
                that value exists.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            "Create a Convex deployment",
            "Set ANDES_RELAY_INGEST_SECRET",
            "Submit the example product fixtures",
          ].map((item) => (
            <div
              key={item}
            className="rounded border border-[#d8d1bf] bg-[#fffdf7] p-4"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              <p className="mt-3 text-sm font-medium text-[#2f2b24]">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-white p-4 dark:border-white/10 dark:bg-[#111]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-medium uppercase text-[#646262] dark:text-white/45">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[#646262] dark:text-white/45" />
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-normal text-[#201d1d] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-[4px] border border-dashed border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] dark:border-white/10 dark:bg-[#111]">
      <p className="font-mono text-sm text-[#646262] dark:text-white/55">
        {label}
      </p>
    </div>
  );
}

function TextInput({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1 font-mono text-xs text-[#646262] dark:text-white/45">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        className="h-10 rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 text-sm text-[#201d1d] outline-none focus:border-[#646262] dark:border-white/10 dark:bg-[#050505] dark:text-white dark:placeholder:text-white/35 dark:focus:border-white/40"
      />
    </label>
  );
}

function SettingsPanel({
  authConfigured,
  ingestEndpoint,
  settings,
}: {
  authConfigured: boolean;
  ingestEndpoint?: string;
  settings?: SourceSettings;
}) {
  const upsertWorkspace = useMutation(api.sources.upsertWorkspace);
  const upsertProduct = useMutation(api.sources.upsertProduct);
  const removeWorkspace = useMutation(api.sources.removeWorkspace);
  const removeProduct = useMutation(api.sources.removeProduct);
  const createWorkspaceInvite = useMutation(api.sources.createWorkspaceInvite);
  const revokeWorkspaceInvite = useMutation(api.sources.revokeWorkspaceInvite);
  const workspaceInvites = useQuery(api.sources.listWorkspaceInvites, {});
  const [workspaceKey, setWorkspaceKey] = useState("");
  const [workspaceNameValue, setWorkspaceNameValue] = useState("");
  const [productKey, setProductKey] = useState("");
  const [productNameValue, setProductNameValue] = useState("");
  const [productWorkspaceKey, setProductWorkspaceKey] = useState("");
  const [inviteWorkspaceKey, setInviteWorkspaceKey] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const endpoint = ingestEndpoint || "https://your-convex-site.convex.site";
  const sourceConfig = settings ?? {
    discoveredProducts: [],
    discoveredWorkspaces: [],
    products: [],
    workspaces: [],
  };
  const workspaceOptions = [
    ...sourceConfig.workspaces.map((item) => item.key),
    ...sourceConfig.discoveredWorkspaces,
  ].filter((key, index, keys) => keys.indexOf(key) === index);
  const invites = (workspaceInvites ?? []) as WorkspaceInvite[];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <section className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 dark:border-white/10 dark:bg-[#111]">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-[#646262] dark:text-white/55" />
          <h2 className="font-mono text-base font-semibold text-[#201d1d] dark:text-white">
            Source settings
          </h2>
        </div>

        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          onSubmit={async (event) => {
            event.preventDefault();
            await upsertWorkspace({
              key: workspaceKey,
              name: workspaceNameValue || keyLabel(workspaceKey),
            });
            setWorkspaceKey("");
            setWorkspaceNameValue("");
          }}
        >
          <TextInput
            label="Workspace key"
            value={workspaceKey}
            onChange={setWorkspaceKey}
            placeholder="andesphere"
          />
          <TextInput
            label="Display name"
            value={workspaceNameValue}
            onChange={setWorkspaceNameValue}
            placeholder="Andesphere"
          />
          <button
            type="submit"
            disabled={!workspaceKey.trim()}
            className="mt-5 h-10 rounded-[4px] bg-[#201d1d] px-4 font-mono text-sm font-medium text-[#fdfcfc] disabled:opacity-40 dark:bg-white/70 dark:text-black"
          >
            Save
          </button>
        </form>

        <div className="mt-4 overflow-hidden border border-[rgba(15,0,0,0.12)] dark:border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-[#f8f7f7] font-mono text-xs uppercase text-[#646262] dark:bg-[#181818] dark:text-white/45">
              <tr>
                <th className="px-3 py-2 font-medium">Workspace</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,0,0,0.12)] dark:divide-white/10">
              {sourceConfig.workspaces.map((workspace) => (
                <tr key={workspace.key}>
                  <td className="px-3 py-2 font-medium text-[#201d1d] dark:text-white">
                    {workspace.name}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#646262] dark:text-white/55">
                    {workspace.key}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeWorkspace({ key: workspace.key })}
                      className="font-mono text-xs text-[#ff3b30]"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {sourceConfig.discoveredWorkspaces.map((key) => (
                <tr key={key}>
                  <td className="px-3 py-2 text-[#646262] dark:text-white/65">
                    {keyLabel(key)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#646262] dark:text-white/55">
                    {key}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        upsertWorkspace({ key, name: keyLabel(key) })
                      }
                      className="font-mono text-xs text-[#201d1d] dark:text-white"
                    >
                      Add label
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={async (event) => {
            event.preventDefault();
            await upsertProduct({
              key: productKey,
              name: productNameValue || keyLabel(productKey),
              workspaceKey: productWorkspaceKey,
            });
            setProductKey("");
            setProductNameValue("");
          }}
        >
          <TextInput
            label="Product key"
            value={productKey}
            onChange={setProductKey}
            placeholder="web"
          />
          <TextInput
            label="Display name"
            value={productNameValue}
            onChange={setProductNameValue}
            placeholder="Web app"
          />
          <FilterSelect
            label="Workspace"
            value={productWorkspaceKey}
            onChange={setProductWorkspaceKey}
          >
            <option value="">Select workspace</option>
            {[
              ...sourceConfig.workspaces.map((item) => item.key),
              ...sourceConfig.discoveredWorkspaces,
            ]
              .filter((key, index, keys) => keys.indexOf(key) === index)
              .map((key) => (
                <option key={key} value={key}>
                  {sourceNames(sourceConfig).workspaceName(key)}
                </option>
              ))}
          </FilterSelect>
          <button
            type="submit"
            disabled={!productKey.trim() || !productWorkspaceKey.trim()}
            className="mt-5 h-10 rounded-[4px] bg-[#201d1d] px-4 font-mono text-sm font-medium text-[#fdfcfc] disabled:opacity-40 dark:bg-white/70 dark:text-black"
          >
            Save
          </button>
        </form>

        <div className="mt-4 overflow-hidden border border-[rgba(15,0,0,0.12)] dark:border-white/10">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[#f8f7f7] font-mono text-xs uppercase text-[#646262] dark:bg-[#181818] dark:text-white/45">
              <tr>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Workspace</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,0,0,0.12)] dark:divide-white/10">
              {sourceConfig.products.map((product) => (
                <tr key={`${product.workspaceKey}:${product.key}`}>
                  <td className="px-3 py-2 font-medium text-[#201d1d] dark:text-white">
                    {product.name}
                  </td>
                  <td className="px-3 py-2 text-[#201d1d] dark:text-white/75">
                    {sourceNames(sourceConfig).workspaceName(product.workspaceKey)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#646262] dark:text-white/55">
                    {product.key}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        removeProduct({
                          key: product.key,
                          workspaceKey: product.workspaceKey,
                        })
                      }
                      className="font-mono text-xs text-[#ff3b30]"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {sourceConfig.discoveredProducts.map((product) => (
                <tr key={`${product.workspaceKey}:${product.productKey}`}>
                  <td className="px-3 py-2 text-[#646262] dark:text-white/65">
                    {keyLabel(product.productKey)}
                  </td>
                  <td className="px-3 py-2 text-[#201d1d] dark:text-white/75">
                    {sourceNames(sourceConfig).workspaceName(product.workspaceKey)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#646262] dark:text-white/55">
                    {product.productKey}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        upsertProduct({
                          key: product.productKey,
                          name: keyLabel(product.productKey),
                          workspaceKey: product.workspaceKey,
                        })
                      }
                      className="font-mono text-xs text-[#201d1d] dark:text-white"
                    >
                      Add label
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 dark:border-white/10 dark:bg-[#111]">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#646262] dark:text-white/55" />
          <h2 className="font-mono text-base font-semibold text-[#201d1d] dark:text-white">
            Integration settings
          </h2>
        </div>
        <div className="grid gap-4 font-mono text-sm text-[#424245] dark:text-white/75">
          <div>
            <p className="text-xs uppercase text-[#646262] dark:text-white/45">Endpoint</p>
            <code className="mt-1 block break-all bg-[#f1eeee] p-3 text-xs text-[#201d1d] dark:bg-[#181818] dark:text-white/85">
              {endpoint}/ingest
            </code>
          </div>
          <div>
            <p className="text-xs uppercase text-[#646262] dark:text-white/45">Product env vars</p>
            <pre className="mt-1 overflow-x-auto bg-[#f1eeee] p-3 text-xs text-[#201d1d] dark:bg-[#181818] dark:text-white/85">
{`ANDES_RELAY_ENDPOINT=${endpoint}
ANDES_RELAY_INGEST_SECRET=<server-side secret>`}
            </pre>
          </div>
          <div>
            <p className="text-xs uppercase text-[#646262] dark:text-white/45">SDK install</p>
            <code className="mt-1 block bg-[#f1eeee] p-3 text-xs text-[#201d1d] dark:bg-[#181818] dark:text-white/85">
              bun add @openandes/relay-sdk
            </code>
          </div>
          <div>
            <p className="text-xs uppercase text-[#646262] dark:text-white/45">MCP</p>
            <p className="mt-1 leading-6">
              No MCP server is exposed yet. Current integrations use the HTTP
              ingest endpoint and SDK. Keep the ingest secret server-side only.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-[rgba(15,0,0,0.12)] pt-4 dark:border-white/10">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#646262] dark:text-white/55" />
            <h2 className="font-mono text-base font-semibold text-[#201d1d] dark:text-white">
              Workspace access
            </h2>
          </div>
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              await createWorkspaceInvite({
                email: inviteEmail,
                role: inviteRole,
                workspaceKey: inviteWorkspaceKey,
              });
              setInviteEmail("");
            }}
          >
            <FilterSelect
              label="Workspace"
              value={inviteWorkspaceKey}
              onChange={setInviteWorkspaceKey}
            >
              <option value="">Select workspace</option>
              {workspaceOptions.map((key) => (
                <option key={key} value={key}>
                  {sourceNames(sourceConfig).workspaceName(key)}
                </option>
              ))}
            </FilterSelect>
            <TextInput
              label="Invite email"
              value={inviteEmail}
              onChange={setInviteEmail}
              placeholder="person@example.com"
            />
            <FilterSelect
              label="Role"
              value={inviteRole}
              onChange={(value) =>
                setInviteRole(value === "admin" ? "admin" : "member")
              }
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </FilterSelect>
            <button
              type="submit"
              disabled={!inviteWorkspaceKey.trim() || !inviteEmail.trim()}
              className="h-10 rounded-[4px] bg-[#201d1d] px-4 font-mono text-sm font-medium text-[#fdfcfc] disabled:opacity-40 dark:bg-white/70 dark:text-black"
            >
              Invite
            </button>
          </form>

          <div className="mt-4 overflow-hidden border border-[rgba(15,0,0,0.12)] dark:border-white/10">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-[#f1eeee] font-mono text-xs uppercase text-[#646262] dark:bg-[#181818] dark:text-white/45">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Workspace</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(15,0,0,0.12)] dark:divide-white/10">
                {invites.map((invite) => (
                  <tr key={invite._id}>
                    <td className="px-3 py-2 font-medium text-[#201d1d] dark:text-white">
                      {invite.email}
                    </td>
                    <td className="px-3 py-2 text-[#201d1d] dark:text-white/75">
                      {sourceNames(sourceConfig).workspaceName(invite.workspaceKey)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[#646262] dark:text-white/55">
                      {invite.role}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill>{invite.status}</StatusPill>
                    </td>
                    <td className="px-3 py-2">
                      {invite.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => revokeWorkspaceInvite({ id: invite._id })}
                          className="font-mono text-xs text-[#ff3b30]"
                        >
                          Revoke
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {invites.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center font-mono text-xs text-[#646262] dark:text-white/55"
                    >
                      No workspace invites yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {!authConfigured ? (
            <p className="mt-3 text-xs leading-5 text-[#646262] dark:text-white/55">
              Clerk is disabled locally, so invites are saved without a signed-in
              sender.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function TicketsTable({
  filters,
  settings,
}: {
  filters: SourceFilter;
  settings?: SourceSettings;
}) {
  const tickets = useQuery(api.dashboard.listTickets, {
    ...filters,
    limit: 50,
  });
  const updateStatus = useMutation(api.tickets.updateStatus);

  if (tickets === undefined) {
    return <EmptyState label="Loading support tickets..." />;
  }

  if (tickets.length === 0) {
    return <EmptyState label="No support tickets yet." />;
  }

  return (
    <div className={tableShellClass}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className={tableHeadClass}>
          <tr>
            <th className="px-4 py-3 font-semibold">Ticket</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="align-top">
              <td className="px-4 py-3">
                <p className={`font-medium ${primaryTextClass}`}>
                  {ticket.title}
                </p>
                <p className={`mt-1 line-clamp-2 max-w-xl ${secondaryTextClass}`}>
                  {ticket.message}
                </p>
              </td>
              <td className="px-4 py-3">
                <SourceStamp
                  productKey={ticket.productKey}
                  settings={settings}
                  workspaceKey={ticket.companyKey}
                />
              </td>
              <td className="px-4 py-3">
                <StatusPill>{ticket.priority}</StatusPill>
              </td>
              <td className="px-4 py-3">
                <select
                  value={ticket.status}
                  onChange={(event) =>
                    updateStatus({
                      ticketId: ticket._id as Id<"supportTickets">,
                      status: event.currentTarget.value as
                        | "open"
                        | "waiting"
                        | "resolved"
                        | "closed",
                    })
                  }
                  className="h-8 rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-white px-2 text-sm text-[#201d1d] dark:border-white/10 dark:bg-[#050505] dark:text-white"
                >
                  <option value="open">Open</option>
                  <option value="waiting">Waiting</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td className={`px-4 py-3 ${secondaryTextClass}`}>
                {formatDate(ticket.updatedAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <SignalActions
                  label={ticket.title}
                  target={{
                    id: ticket._id as Id<"supportTickets">,
                    type: "ticket",
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackTable({
  filters,
  settings,
}: {
  filters: SourceFilter;
  settings?: SourceSettings;
}) {
  const feedback = useQuery(api.dashboard.listFeedback, {
    ...filters,
    limit: 50,
  });
  const names = sourceNames(settings);

  if (feedback === undefined) {
    return <EmptyState label="Loading feedback..." />;
  }

  if (feedback.length === 0) {
    return <EmptyState label="No feedback yet." />;
  }

  return (
    <div className="grid gap-3">
      {feedback.map((item) => (
        <article key={item._id} className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={`text-base font-semibold ${primaryTextClass}`}>
                {item.title}
              </h3>
              <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                {names.workspaceName(item.companyKey)} ·{" "}
                {names.productName(item.companyKey, item.productKey)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill>{item.status}</StatusPill>
              <SignalActions
                label={item.title}
                target={{
                  id: item._id as Id<"feedbackItems">,
                  type: "feedback",
                }}
              />
            </div>
          </div>
          <p className={`mt-3 text-sm leading-6 ${primaryTextClass}`}>
            {item.message}
          </p>
        </article>
      ))}
    </div>
  );
}

function ContactSubmissionsTable({
  filters,
  settings,
}: {
  filters: SourceFilter;
  settings?: SourceSettings;
}) {
  const submissions = useQuery(api.dashboard.listContactSubmissions, {
    ...filters,
    limit: 50,
  });
  const names = sourceNames(settings);

  if (submissions === undefined) {
    return <EmptyState label="Loading contact form submissions..." />;
  }

  if (submissions.length === 0) {
    return <EmptyState label="No contact form submissions yet." />;
  }

  return (
    <div className="grid gap-3">
      {submissions.map((submission) => (
        <article key={submission._id} className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={`text-base font-semibold ${primaryTextClass}`}>
                {submission.subject ?? "Contact form submission"}
              </h3>
              <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                {names.workspaceName(submission.companyKey)} ·{" "}
                {names.productName(submission.companyKey, submission.productKey)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill>{formatDate(submission.createdAt)}</StatusPill>
              <SignalActions
                label={submission.subject ?? "contact form submission"}
                target={{
                  id: submission._id as Id<"contactSubmissions">,
                  type: "form",
                }}
              />
            </div>
          </div>
          <p className={`mt-3 text-sm leading-6 ${primaryTextClass}`}>
            {submission.message}
          </p>
          {(submission.company || submission.phone) && (
            <p className={`mt-3 font-mono text-xs ${secondaryTextClass}`}>
              {[submission.company, submission.phone].filter(Boolean).join(" · ")}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function AccountCreationsTable({
  filters,
  settings,
}: {
  filters: SourceFilter;
  settings?: SourceSettings;
}) {
  const accounts = useQuery(api.dashboard.listAccountCreations, {
    ...filters,
    limit: 50,
  });

  if (accounts === undefined) {
    return <EmptyState label="Loading account creations..." />;
  }

  if (accounts.length === 0) {
    return <EmptyState label="No account creations yet." />;
  }

  return (
    <div className={tableShellClass}>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className={tableHeadClass}>
          <tr>
            <th className="px-4 py-3 font-semibold">User</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Signup source</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {accounts.map((account) => (
            <tr key={account._id}>
              <td className="px-4 py-3">
                <p className={`font-medium ${primaryTextClass}`}>
                  {account.name ?? account.email}
                </p>
                <p className={secondaryTextClass}>{account.email}</p>
              </td>
              <td className="px-4 py-3">
                <SourceStamp
                  productKey={account.productKey}
                  settings={settings}
                  workspaceKey={account.companyKey}
                />
              </td>
              <td className="px-4 py-3">
                <StatusPill>{account.source ?? "app"}</StatusPill>
              </td>
              <td className={`px-4 py-3 ${secondaryTextClass}`}>
                {formatDate(account.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <SignalActions
                  label={account.name ?? account.email}
                  target={{
                    id: account._id as Id<"accountCreations">,
                    type: "account",
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactsTable({
  filters,
  settings,
}: {
  filters: SourceFilter;
  settings?: SourceSettings;
}) {
  const contacts = useQuery(api.dashboard.listContacts, {
    ...filters,
    limit: 50,
  });
  const names = sourceNames(settings);

  if (contacts === undefined) {
    return <EmptyState label="Loading contacts..." />;
  }

  if (contacts.length === 0) {
    return <EmptyState label="No contacts yet." />;
  }

  return (
    <div className={tableShellClass}>
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className={tableHeadClass}>
          <tr>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Workspaces</th>
            <th className="px-4 py-3 font-semibold">Products</th>
            <th className="px-4 py-3 font-semibold">Locale</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {contacts.map((contact) => (
            <tr key={contact._id}>
              <td className="px-4 py-3">
                <p className={`font-medium ${primaryTextClass}`}>
                  {contact.name ?? contact.email}
                </p>
                <p className={secondaryTextClass}>{contact.email}</p>
              </td>
              <td className={`px-4 py-3 ${primaryTextClass}`}>
                {contact.companies.map(names.workspaceName).join(", ")}
              </td>
              <td className={`px-4 py-3 ${primaryTextClass}`}>
                {contact.products.map((key) => keyLabel(key)).join(", ")}
              </td>
              <td className={`px-4 py-3 ${secondaryTextClass}`}>
                {contact.locale ?? "en"}
              </td>
              <td className="px-4 py-3 text-right">
                <SignalActions
                  label={contact.name ?? contact.email}
                  target={{
                    id: contact._id as Id<"contacts">,
                    type: "contact",
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmailTable({
  filters,
  settings,
}: {
  filters: SourceFilter;
  settings?: SourceSettings;
}) {
  const emails = useQuery(api.dashboard.listEmailJobs, {
    ...filters,
    limit: 50,
  });
  const names = sourceNames(settings);

  if (emails === undefined) {
    return <EmptyState label="Loading email queue..." />;
  }

  if (emails.length === 0) {
    return <EmptyState label="No email jobs yet." />;
  }

  return (
    <div className="grid gap-3">
      {emails.map((email) => (
        <article key={email._id} className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={`text-base font-semibold ${primaryTextClass}`}>
                {email.subject}
              </h3>
              <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                {email.recipientEmail} · {email.templateKey}
              </p>
              <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                {names.workspaceName(email.companyKey)} ·{" "}
                {names.productName(email.companyKey, email.productKey)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill>{email.status}</StatusPill>
              <SignalActions
                label={email.subject}
                target={{
                  id: email._id as Id<"emailJobs">,
                  type: "email",
                }}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function SearchTable({
  filters,
  settings,
}: {
  filters: SourceFilter;
  settings?: SourceSettings;
}) {
  const searches = useQuery(api.dashboard.listHelpSearches, {
    ...filters,
    limit: 50,
  });
  const names = sourceNames(settings);

  if (searches === undefined) {
    return <EmptyState label="Loading help searches..." />;
  }

  if (searches.length === 0) {
    return <EmptyState label="No help searches yet." />;
  }

  return (
    <div className="grid gap-3">
      {searches.map((search) => (
        <article key={search._id} className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className={`text-base font-semibold ${primaryTextClass}`}>
              {search.query}
            </h3>
            <div className="flex items-center gap-2">
              <StatusPill>{`${search.resultCount ?? 0} results`}</StatusPill>
              <SignalActions
                label={search.query}
                target={{
                  id: search._id as Id<"helpSearches">,
                  type: "search",
                }}
              />
            </div>
          </div>
          <p className={`mt-1 text-sm ${secondaryTextClass}`}>
            {names.workspaceName(search.companyKey)} ·{" "}
            {names.productName(search.companyKey, search.productKey)} ·{" "}
            {formatDate(search.createdAt)}
          </p>
        </article>
      ))}
    </div>
  );
}

const activityArchiveTarget = (item: { _id: string; type: string }) => {
  switch (item.type) {
    case "ticket":
      return { id: item._id as Id<"supportTickets">, type: "ticket" } as const;
    case "feedback":
      return {
        id: item._id as Id<"feedbackItems">,
        type: "feedback",
      } as const;
    case "form":
      return {
        id: item._id as Id<"contactSubmissions">,
        type: "form",
      } as const;
    case "account":
      return {
        id: item._id as Id<"accountCreations">,
        type: "account",
      } as const;
    case "contact":
      return { id: item._id as Id<"contacts">, type: "contact" } as const;
    case "email":
      return { id: item._id as Id<"emailJobs">, type: "email" } as const;
    default:
      return { id: item._id as Id<"helpSearches">, type: "search" } as const;
  }
};

function ActivityFeed({
  filters,
  settings,
  timeFilter,
  typeFilter,
}: {
  filters: SourceFilter;
  settings?: SourceSettings;
  timeFilter: string;
  typeFilter: (typeof activityTypes)[number]["key"];
}) {
  const [loadedAt] = useState(() => Date.now());
  const selectedWindow = timeWindows.find((item) => item.key === timeFilter);
  const activity = useQuery(api.dashboard.listActivity, {
    ...filters,
    limit: 100,
    since:
      selectedWindow?.ms === null || selectedWindow === undefined
        ? undefined
        : loadedAt - selectedWindow.ms,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  if (activity === undefined) {
    return <EmptyState label="Loading activity..." />;
  }

  if (activity.length === 0) {
    return <EmptyState label="No activity for these filters." />;
  }

  return (
    <div className={tableShellClass}>
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className={tableHeadClass}>
          <tr>
            <th className="px-4 py-3 font-medium">Signal</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">When</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {activity.map((item) => (
            <tr key={`${item.type}-${item._id}`} className="align-top">
              <td className="px-4 py-3">
                <p className={`font-medium ${primaryTextClass}`}>
                  {item.title}
                </p>
                <p className={`mt-1 line-clamp-2 max-w-xl ${secondaryTextClass}`}>
                  {item.description}
                </p>
              </td>
              <td className="px-4 py-3">
                <SourceStamp
                  productKey={item.productKey}
                  settings={settings}
                  workspaceKey={item.companyKey}
                />
              </td>
              <td className="px-4 py-3">
                <StatusPill>
                  {activityTypes.find((type) => type.key === item.type)
                    ?.label ?? item.type}
                </StatusPill>
              </td>
              <td className="px-4 py-3">
                <StatusPill>{item.statusLabel}</StatusPill>
              </td>
              <td className={`px-4 py-3 font-mono text-xs ${secondaryTextClass}`}>
                {formatDate(item.occurredAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <SignalActions
                  label={item.title}
                  target={activityArchiveTarget(item)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveDashboard({
  authConfigured,
  ingestEndpoint,
}: {
  authConfigured: boolean;
  ingestEndpoint?: string;
}) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>(
    "all",
  );
  const [productFilter, setProductFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("24h");
  const [typeFilter, setTypeFilter] =
    useState<(typeof activityTypes)[number]["key"]>("all");
  const [workspaceFilter, setWorkspaceFilter] = useState("all");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const sourceSettings = useQuery(api.sources.listSettings) as
    | SourceSettings
    | undefined;
  const workspaceOptions = [
    ...(sourceSettings?.workspaces.map((item) => item.key) ?? []),
    ...(sourceSettings?.discoveredWorkspaces ?? []),
  ].filter((key, index, keys) => keys.indexOf(key) === index);
  const workspaceSelectOptions = workspaceOptions.map((key) => ({
    key,
    name: sourceNames(sourceSettings).workspaceName(key),
  }));
  const productOptions: ProductOption[] = [
    ...(sourceSettings?.products.map((item) => ({
      productKey: item.key,
      value: productOptionValue(item.workspaceKey, item.key),
      workspaceKey: item.workspaceKey,
    })) ?? []),
    ...(sourceSettings?.discoveredProducts.map((item) => ({
      ...item,
      value: productOptionValue(item.workspaceKey, item.productKey),
    })) ?? []),
  ].filter(
    (item, index, items) =>
      items.findIndex(
        (candidate) =>
          candidate.workspaceKey === item.workspaceKey &&
          candidate.productKey === item.productKey,
      ) === index,
  );
  const filteredProductOptions =
    workspaceFilter === "all"
      ? productOptions
      : productOptions.filter((item) => item.workspaceKey === workspaceFilter);
  const names = sourceNames(sourceSettings);
  const filters = queryFilters({
    productValue: productFilter,
    workspaceValue: workspaceFilter,
  });
  const overview = useQuery(api.dashboard.getOverview, filters);
  const selectedProduct = productOptions.find(
    (item) => item.value === productFilter,
  );
  const selectedWorkspaceName =
    workspaceFilter === "all"
      ? "All workspaces"
      : names.workspaceName(workspaceFilter);
  const selectedProjectName = selectedProduct
    ? names.productName(selectedProduct.workspaceKey, selectedProduct.productKey)
    : "All projects";

  return (
    <SidebarProvider
      className={theme === "dark" ? "dark" : ""}
      style={
        {
          "--sidebar-width": "17rem",
        } as CSSProperties
      }
    >
      <AppSidebar
        activeKey={activeTab}
        authConfigured={authConfigured}
        items={tabs}
        onSelect={(key) => setActiveTab(key as (typeof tabs)[number]["key"])}
        onWorkspaceChange={(value) => {
          setWorkspaceFilter(value);
          setProductFilter("all");
        }}
        selectedWorkspaceName={selectedWorkspaceName}
        selectedWorkspaceValue={workspaceFilter}
        workspaceOptions={workspaceSelectOptions}
      />
      <SidebarInset className="min-h-screen bg-[#fdfcfc] text-[#201d1d] dark:bg-[#0a0a0a] dark:text-[#ededed]">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(15,0,0,0.12)] pb-5 dark:border-white/10">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-[#646262] dark:text-white/60">
                <SidebarTrigger className="-ml-1" />
                <span className="font-mono text-xs uppercase">Dashboard</span>
              </div>
              <span className="hidden h-5 w-px bg-[rgba(15,0,0,0.12)] dark:bg-white/10 sm:block" />
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase text-[#646262] dark:text-white/40">
                  {selectedWorkspaceName}
                </p>
                <h1 className="truncate font-mono text-2xl font-semibold tracking-normal">
                  {selectedProjectName}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <FilterSelect
                label="Project"
                value={productFilter}
                onChange={setProductFilter}
                tone={theme}
              >
                <option value="all">All projects</option>
                {filteredProductOptions.map(({ productKey, value, workspaceKey }) => (
                  <option key={value} value={value}>
                    {workspaceFilter === "all"
                      ? `${names.workspaceName(workspaceKey)} / ${names.productName(
                          workspaceKey,
                          productKey,
                        )}`
                      : names.productName(workspaceKey, productKey)}
                  </option>
                ))}
              </FilterSelect>
              <button
                type="button"
                onClick={() =>
                  setTheme((current) =>
                    current === "dark" ? "light" : "dark",
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-white px-3 font-mono text-sm font-medium text-[#201d1d] hover:bg-[#f8f7f7] dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                Theme
              </button>
            </div>
          </header>

          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
            <Metric
              label="Open support"
              value={overview?.openTickets ?? 0}
              icon={LifeBuoy}
            />
            <Metric
              label="New feedback"
              value={overview?.newFeedback ?? 0}
              icon={MessageSquareText}
            />
            <Metric
              label="Queued emails"
              value={overview?.queuedEmails ?? 0}
              icon={Mail}
            />
            <Metric
              label="Contacts"
              value={overview?.contacts ?? 0}
              icon={Users}
            />
            <Metric
              label="Forms"
              value={overview?.contactSubmissions ?? 0}
              icon={ClipboardList}
            />
            <Metric
              label="Accounts"
              value={overview?.accountCreations ?? 0}
              icon={UserPlus}
            />
            <Metric
              label="Recent searches"
              value={overview?.recentSearches ?? 0}
              icon={Search}
            />
          </div>

          {activeTab === "all" && (
            <div className="flex flex-wrap gap-3 border border-[rgba(15,0,0,0.12)] bg-white p-4 dark:border-white/10 dark:bg-[#111]">
              <FilterSelect
                label="Window"
                value={timeFilter}
                onChange={setTimeFilter}
                tone={theme}
              >
                {timeWindows.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Type"
                value={typeFilter}
                onChange={(value) =>
                  setTypeFilter(value as (typeof activityTypes)[number]["key"])
                }
                tone={theme}
              >
                {activityTypes.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </FilterSelect>
            </div>
          )}

          <section className="overflow-x-auto">
            {activeTab === "all" && (
              <ActivityFeed
                filters={filters}
                settings={sourceSettings}
                timeFilter={timeFilter}
                typeFilter={typeFilter}
              />
            )}
            {activeTab === "tickets" && (
              <TicketsTable filters={filters} settings={sourceSettings} />
            )}
            {activeTab === "feedback" && (
              <FeedbackTable filters={filters} settings={sourceSettings} />
            )}
            {activeTab === "forms" && (
              <ContactSubmissionsTable
                filters={filters}
                settings={sourceSettings}
              />
            )}
            {activeTab === "accounts" && (
              <AccountCreationsTable
                filters={filters}
                settings={sourceSettings}
              />
            )}
            {activeTab === "contacts" && (
              <ContactsTable filters={filters} settings={sourceSettings} />
            )}
            {activeTab === "emails" && (
              <EmailTable filters={filters} settings={sourceSettings} />
            )}
            {activeTab === "searches" && (
              <SearchTable filters={filters} settings={sourceSettings} />
            )}
            {activeTab === "settings" && (
              <SettingsPanel
                authConfigured={authConfigured}
                ingestEndpoint={ingestEndpoint}
                settings={sourceSettings}
              />
            )}
          </section>
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AndesRelayDashboard({
  authConfigured,
  configured,
  ingestEndpoint,
}: {
  authConfigured: boolean;
  configured: boolean;
  ingestEndpoint?: string;
}) {
  if (!configured) {
    return <SetupScreen />;
  }

  return (
    <LiveDashboard
      authConfigured={authConfigured}
      ingestEndpoint={ingestEndpoint}
    />
  );
}
