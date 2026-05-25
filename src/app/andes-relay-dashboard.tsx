"use client";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  LifeBuoy,
  ListFilter,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  OrganizationList,
  OrganizationProfile,
  OrganizationSwitcher,
  useOrganization,
} from "@clerk/nextjs";
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

const formatDate = (value: number) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-2 font-mono text-xs font-medium text-[#646262]">
      {children}
    </span>
  );
}

function FilterSelect({
  label,
  onChange,
  value,
  children,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-44 flex-col gap-1 font-mono text-xs text-[#646262]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-10 rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 text-sm text-[#201d1d] outline-none focus:border-[#646262]"
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
      <span className="text-sm font-semibold text-[#201d1d]">
        {names.workspaceName(workspaceKey)}
      </span>
      <span className="font-mono text-xs text-[#646262]">
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
    <div className="rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-medium uppercase text-[#646262]">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[#646262]" />
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-normal text-[#201d1d]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-[4px] border border-dashed border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]">
      <p className="font-mono text-sm text-[#646262]">{label}</p>
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
    <label className="flex flex-col gap-1 font-mono text-xs text-[#646262]">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        className="h-10 rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 text-sm text-[#201d1d] outline-none focus:border-[#646262]"
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
  const { organization } = useOrganization();
  const upsertWorkspace = useMutation(api.sources.upsertWorkspace);
  const upsertProduct = useMutation(api.sources.upsertProduct);
  const removeWorkspace = useMutation(api.sources.removeWorkspace);
  const removeProduct = useMutation(api.sources.removeProduct);
  const [workspaceKey, setWorkspaceKey] = useState("");
  const [workspaceNameValue, setWorkspaceNameValue] = useState("");
  const [productKey, setProductKey] = useState("");
  const [productNameValue, setProductNameValue] = useState("");
  const [productWorkspaceKey, setProductWorkspaceKey] = useState("");
  const endpoint = ingestEndpoint || "https://your-convex-site.convex.site";
  const sourceConfig = settings ?? {
    discoveredProducts: [],
    discoveredWorkspaces: [],
    products: [],
    workspaces: [],
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <section className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-[#646262]" />
          <h2 className="font-mono text-base font-semibold text-[#201d1d]">
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
            className="mt-5 h-10 rounded-[4px] bg-[#201d1d] px-4 font-mono text-sm font-medium text-[#fdfcfc] disabled:opacity-40"
          >
            Save
          </button>
        </form>

        <div className="mt-4 overflow-hidden border border-[rgba(15,0,0,0.12)]">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-[#f8f7f7] font-mono text-xs uppercase text-[#646262]">
              <tr>
                <th className="px-3 py-2 font-medium">Workspace</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,0,0,0.12)]">
              {sourceConfig.workspaces.map((workspace) => (
                <tr key={workspace.key}>
                  <td className="px-3 py-2 font-medium">{workspace.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[#646262]">
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
                  <td className="px-3 py-2 text-[#646262]">
                    {keyLabel(key)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#646262]">
                    {key}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        upsertWorkspace({ key, name: keyLabel(key) })
                      }
                      className="font-mono text-xs text-[#201d1d]"
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
            className="mt-5 h-10 rounded-[4px] bg-[#201d1d] px-4 font-mono text-sm font-medium text-[#fdfcfc] disabled:opacity-40"
          >
            Save
          </button>
        </form>

        <div className="mt-4 overflow-hidden border border-[rgba(15,0,0,0.12)]">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[#f8f7f7] font-mono text-xs uppercase text-[#646262]">
              <tr>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Workspace</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,0,0,0.12)]">
              {sourceConfig.products.map((product) => (
                <tr key={`${product.workspaceKey}:${product.key}`}>
                  <td className="px-3 py-2 font-medium">{product.name}</td>
                  <td className="px-3 py-2">
                    {sourceNames(sourceConfig).workspaceName(product.workspaceKey)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#646262]">
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
                  <td className="px-3 py-2 text-[#646262]">
                    {keyLabel(product.productKey)}
                  </td>
                  <td className="px-3 py-2">
                    {sourceNames(sourceConfig).workspaceName(product.workspaceKey)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#646262]">
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
                      className="font-mono text-xs text-[#201d1d]"
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

      <aside className="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#646262]" />
          <h2 className="font-mono text-base font-semibold text-[#201d1d]">
            Integration settings
          </h2>
        </div>
        <div className="grid gap-4 font-mono text-sm text-[#424245]">
          <div>
            <p className="text-xs uppercase text-[#646262]">Endpoint</p>
            <code className="mt-1 block break-all bg-[#f1eeee] p-3 text-xs text-[#201d1d]">
              {endpoint}/ingest
            </code>
          </div>
          <div>
            <p className="text-xs uppercase text-[#646262]">Product env vars</p>
            <pre className="mt-1 overflow-x-auto bg-[#f1eeee] p-3 text-xs text-[#201d1d]">
{`ANDES_RELAY_ENDPOINT=${endpoint}
ANDES_RELAY_INGEST_SECRET=<server-side secret>`}
            </pre>
          </div>
          <div>
            <p className="text-xs uppercase text-[#646262]">SDK install</p>
            <code className="mt-1 block bg-[#f1eeee] p-3 text-xs text-[#201d1d]">
              bun add @openandes/relay-sdk
            </code>
          </div>
          <div>
            <p className="text-xs uppercase text-[#646262]">MCP</p>
            <p className="mt-1 leading-6">
              No MCP server is exposed yet. Current integrations use the HTTP
              ingest endpoint and SDK. Keep the ingest secret server-side only.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-[rgba(15,0,0,0.12)] pt-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#646262]" />
            <h2 className="font-mono text-base font-semibold text-[#201d1d]">
              Clerk workspace
            </h2>
          </div>
          {authConfigured ? (
            <div className="grid gap-4">
              <OrganizationSwitcher
                afterCreateOrganizationUrl="/workspace"
                afterLeaveOrganizationUrl="/"
                afterSelectOrganizationUrl="/"
                createOrganizationMode="navigation"
                createOrganizationUrl="/create-workspace"
                hidePersonal
                organizationProfileMode="navigation"
                organizationProfileUrl="/workspace"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href="/create-workspace"
                  className="inline-flex h-10 items-center justify-center rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-3 font-mono text-sm font-medium text-[#201d1d]"
                >
                  Create workspace
                </Link>
                <Link
                  href="/workspace"
                  className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[#201d1d] px-3 font-mono text-sm font-medium text-[#fdfcfc]"
                >
                  Members and invites
                </Link>
              </div>
              {organization ? (
                <OrganizationProfile routing="hash" />
              ) : (
                <OrganizationList
                  afterCreateOrganizationUrl="/workspace"
                  afterSelectOrganizationUrl="/workspace"
                  hidePersonal
                />
              )}
            </div>
          ) : (
            <p className="text-sm leading-6 text-[#646262]">
              Clerk is disabled locally. In production, use this panel to create
              workspaces and invite members.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function TicketsTable({ settings }: { settings?: SourceSettings }) {
  const tickets = useQuery(api.dashboard.listTickets, { limit: 50 });
  const updateStatus = useMutation(api.tickets.updateStatus);

  if (tickets === undefined) {
    return <EmptyState label="Loading support tickets..." />;
  }

  if (tickets.length === 0) {
    return <EmptyState label="No support tickets yet." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Ticket</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-950">{ticket.title}</p>
                <p className="mt-1 line-clamp-2 max-w-xl text-slate-500">
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
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800"
                >
                  <option value="open">Open</option>
                  <option value="waiting">Waiting</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatDate(ticket.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackTable({ settings }: { settings?: SourceSettings }) {
  const feedback = useQuery(api.dashboard.listFeedback, { limit: 50 });
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
        <article
          key={item._id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {names.workspaceName(item.companyKey)} ·{" "}
                {names.productName(item.companyKey, item.productKey)}
              </p>
            </div>
            <StatusPill>{item.status}</StatusPill>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {item.message}
          </p>
        </article>
      ))}
    </div>
  );
}

function ContactSubmissionsTable({ settings }: { settings?: SourceSettings }) {
  const submissions = useQuery(api.dashboard.listContactSubmissions, {
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
        <article
          key={submission._id}
          className="rounded border border-[#d8d1bf] bg-[#fffdf7] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#161410]">
                {submission.subject ?? "Contact form submission"}
              </h3>
              <p className="mt-1 text-sm text-[#5c5548]">
                {names.workspaceName(submission.companyKey)} ·{" "}
                {names.productName(submission.companyKey, submission.productKey)}
              </p>
            </div>
            <StatusPill>{formatDate(submission.createdAt)}</StatusPill>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#2f2b24]">
            {submission.message}
          </p>
          {(submission.company || submission.phone) && (
            <p className="mt-3 font-mono text-xs text-[#5c5548]">
              {[submission.company, submission.phone].filter(Boolean).join(" · ")}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function AccountCreationsTable({ settings }: { settings?: SourceSettings }) {
  const accounts = useQuery(api.dashboard.listAccountCreations, { limit: 50 });

  if (accounts === undefined) {
    return <EmptyState label="Loading account creations..." />;
  }

  if (accounts.length === 0) {
    return <EmptyState label="No account creations yet." />;
  }

  return (
    <div className="overflow-hidden rounded border border-[#d8d1bf] bg-[#fffdf7]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-[#d8d1bf] bg-[#efe8d8] font-mono text-xs uppercase tracking-wide text-[#5c5548]">
          <tr>
            <th className="px-4 py-3 font-semibold">User</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Signup source</th>
            <th className="px-4 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ede5d5]">
          {accounts.map((account) => (
            <tr key={account._id}>
              <td className="px-4 py-3">
                <p className="font-medium text-[#161410]">
                  {account.name ?? account.email}
                </p>
                <p className="text-[#5c5548]">{account.email}</p>
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
              <td className="px-4 py-3 text-[#5c5548]">
                {formatDate(account.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactsTable({ settings }: { settings?: SourceSettings }) {
  const contacts = useQuery(api.dashboard.listContacts, { limit: 50 });
  const names = sourceNames(settings);

  if (contacts === undefined) {
    return <EmptyState label="Loading contacts..." />;
  }

  if (contacts.length === 0) {
    return <EmptyState label="No contacts yet." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Workspaces</th>
            <th className="px-4 py-3 font-semibold">Products</th>
            <th className="px-4 py-3 font-semibold">Locale</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contacts.map((contact) => (
            <tr key={contact._id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-950">
                  {contact.name ?? contact.email}
                </p>
                <p className="text-slate-500">{contact.email}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">
                {contact.companies.map(names.workspaceName).join(", ")}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {contact.products.map((key) => keyLabel(key)).join(", ")}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {contact.locale ?? "en"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmailTable({ settings }: { settings?: SourceSettings }) {
  const emails = useQuery(api.dashboard.listEmailJobs, { limit: 50 });
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
        <article
          key={email._id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                {email.subject}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {email.recipientEmail} · {email.templateKey}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {names.workspaceName(email.companyKey)} ·{" "}
                {names.productName(email.companyKey, email.productKey)}
              </p>
            </div>
            <StatusPill>{email.status}</StatusPill>
          </div>
        </article>
      ))}
    </div>
  );
}

function SearchTable({ settings }: { settings?: SourceSettings }) {
  const searches = useQuery(api.dashboard.listHelpSearches, { limit: 50 });
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
        <article
          key={search._id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-950">
              {search.query}
            </h3>
            <StatusPill>{`${search.resultCount ?? 0} results`}</StatusPill>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {names.workspaceName(search.companyKey)} ·{" "}
            {names.productName(search.companyKey, search.productKey)} ·{" "}
            {formatDate(search.createdAt)}
          </p>
        </article>
      ))}
    </div>
  );
}

function ActivityFeed({
  productFilter,
  settings,
  timeFilter,
  typeFilter,
  workspaceFilter,
}: {
  productFilter: string;
  settings?: SourceSettings;
  timeFilter: string;
  typeFilter: (typeof activityTypes)[number]["key"];
  workspaceFilter: string;
}) {
  const [loadedAt] = useState(() => Date.now());
  const selectedWindow = timeWindows.find((item) => item.key === timeFilter);
  const activity = useQuery(api.dashboard.listActivity, {
    limit: 100,
    productKey: productFilter === "all" ? undefined : productFilter,
    since:
      selectedWindow?.ms === null || selectedWindow === undefined
        ? undefined
        : loadedAt - selectedWindow.ms,
    type: typeFilter === "all" ? undefined : typeFilter,
    workspaceKey: workspaceFilter === "all" ? undefined : workspaceFilter,
  });

  if (activity === undefined) {
    return <EmptyState label="Loading activity..." />;
  }

  if (activity.length === 0) {
    return <EmptyState label="No activity for these filters." />;
  }

  return (
    <div className="overflow-hidden border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] font-mono text-xs uppercase text-[#646262]">
          <tr>
            <th className="px-4 py-3 font-medium">Signal</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(15,0,0,0.12)]">
          {activity.map((item) => (
            <tr key={`${item.type}-${item._id}`} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-[#201d1d]">{item.title}</p>
                <p className="mt-1 line-clamp-2 max-w-xl text-[#646262]">
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
              <td className="px-4 py-3 font-mono text-xs text-[#646262]">
                {formatDate(item.occurredAt)}
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
  const overview = useQuery(api.dashboard.getOverview);
  const sourceSettings = useQuery(api.sources.listSettings) as
    | SourceSettings
    | undefined;
  const workspaceOptions = [
    ...(sourceSettings?.workspaces.map((item) => item.key) ?? []),
    ...(sourceSettings?.discoveredWorkspaces ?? []),
  ].filter((key, index, keys) => keys.indexOf(key) === index);
  const productOptions = [
    ...(sourceSettings?.products.map((item) => ({
      productKey: item.key,
      workspaceKey: item.workspaceKey,
    })) ?? []),
    ...(sourceSettings?.discoveredProducts ?? []),
  ].filter(
    (item, index, items) =>
      items.findIndex(
        (candidate) =>
          candidate.workspaceKey === item.workspaceKey &&
          candidate.productKey === item.productKey,
      ) === index,
  );
  const names = sourceNames(sourceSettings);

  return (
    <SidebarProvider
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
      />
      <SidebarInset className="min-h-screen bg-[#fdfcfc] text-[#201d1d]">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[rgba(15,0,0,0.12)] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <p className="font-mono text-sm font-medium uppercase text-[#646262]">
                  Andes Relay
                </p>
              </div>
              <h1 className="mt-3 max-w-4xl font-mono text-3xl font-bold leading-normal tracking-normal">
                Open-source customer signal routing for SaaS products
              </h1>
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-[4px] border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 font-mono text-sm font-medium text-[#424245]"
              title="Convex updates this dashboard in realtime"
            >
              <RefreshCw className="h-4 w-4" />
              Live
            </button>
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
            <div className="flex flex-wrap gap-3 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4">
              <FilterSelect
                label="Window"
                value={timeFilter}
                onChange={setTimeFilter}
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
              >
                {activityTypes.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Workspace"
                value={workspaceFilter}
                onChange={setWorkspaceFilter}
              >
                <option value="all">All workspaces</option>
                {workspaceOptions.map((key) => (
                  <option key={key} value={key}>
                    {names.workspaceName(key)}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Product"
                value={productFilter}
                onChange={setProductFilter}
              >
                <option value="all">All products</option>
                {productOptions.map(({ productKey, workspaceKey }) => (
                  <option
                    key={`${workspaceKey}:${productKey}`}
                    value={productKey}
                  >
                    {names.productName(workspaceKey, productKey)}
                  </option>
                ))}
              </FilterSelect>
            </div>
          )}

          <section className="overflow-x-auto">
            {activeTab === "all" && (
              <ActivityFeed
                productFilter={productFilter}
                settings={sourceSettings}
                timeFilter={timeFilter}
                typeFilter={typeFilter}
                workspaceFilter={workspaceFilter}
              />
            )}
            {activeTab === "tickets" && (
              <TicketsTable settings={sourceSettings} />
            )}
            {activeTab === "feedback" && (
              <FeedbackTable settings={sourceSettings} />
            )}
            {activeTab === "forms" && (
              <ContactSubmissionsTable settings={sourceSettings} />
            )}
            {activeTab === "accounts" && (
              <AccountCreationsTable settings={sourceSettings} />
            )}
            {activeTab === "contacts" && (
              <ContactsTable settings={sourceSettings} />
            )}
            {activeTab === "emails" && <EmailTable settings={sourceSettings} />}
            {activeTab === "searches" && (
              <SearchTable settings={sourceSettings} />
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
