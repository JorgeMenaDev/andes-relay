"use client";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  LifeBuoy,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const tabs = [
  { key: "tickets", label: "Support", icon: LifeBuoy },
  { key: "feedback", label: "Feedback", icon: MessageSquareText },
  { key: "forms", label: "Forms", icon: ClipboardList },
  { key: "accounts", label: "Accounts", icon: UserPlus },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "emails", label: "Email", icon: Mail },
  { key: "searches", label: "Search", icon: Search },
] as const;

const products = {
  "andy-partner": "Andy Partner",
  acredix: "Acredix",
  wainwrightsbaggers: "Wainwrights Baggers",
  "business-control-room": "Business Control Room",
  neurored: "Neurored",
} as const;

const productName = (key: string) =>
  products[key as keyof typeof products] ?? key;

const formatDate = (value: number) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded border border-[#d8d1bf] bg-[#fffdf7] px-2 font-mono text-xs font-medium text-[#5c5548]">
      {children}
    </span>
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
    <div className="rounded border border-[#d8d1bf] bg-[#fffdf7] p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-medium uppercase tracking-wide text-[#5c5548]">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[#5c5548]" />
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-normal text-[#161410]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded border border-dashed border-[#c7bda8] bg-[#fffdf7]">
      <p className="font-mono text-sm text-[#5c5548]">{label}</p>
    </div>
  );
}

function TicketsTable() {
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
            <th className="px-4 py-3 font-semibold">Product</th>
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
                <p className="font-medium text-slate-800">
                  {productName(ticket.productKey)}
                </p>
                <p className="text-xs text-slate-500">{ticket.companyKey}</p>
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

function FeedbackTable() {
  const feedback = useQuery(api.dashboard.listFeedback, { limit: 50 });

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
                {productName(item.productKey)} · {item.companyKey}
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

function ContactSubmissionsTable() {
  const submissions = useQuery(api.dashboard.listContactSubmissions, {
    limit: 50,
  });

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
                {productName(submission.productKey)} · {submission.companyKey}
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

function AccountCreationsTable() {
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
            <th className="px-4 py-3 font-semibold">Product</th>
            <th className="px-4 py-3 font-semibold">Source</th>
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
                <p className="font-medium text-[#2f2b24]">
                  {productName(account.productKey)}
                </p>
                <p className="text-xs text-[#5c5548]">{account.companyKey}</p>
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

function ContactsTable() {
  const contacts = useQuery(api.dashboard.listContacts, { limit: 50 });

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
            <th className="px-4 py-3 font-semibold">Companies</th>
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
                {contact.companies.join(", ")}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {contact.products.map(productName).join(", ")}
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

function EmailTable() {
  const emails = useQuery(api.dashboard.listEmailJobs, { limit: 50 });

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
            </div>
            <StatusPill>{email.status}</StatusPill>
          </div>
        </article>
      ))}
    </div>
  );
}

function SearchTable() {
  const searches = useQuery(api.dashboard.listHelpSearches, { limit: 50 });

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
            {productName(search.productKey)} · {formatDate(search.createdAt)}
          </p>
        </article>
      ))}
    </div>
  );
}

function LiveDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>(
    "tickets",
  );
  const overview = useQuery(api.dashboard.getOverview);

  return (
    <main className="min-h-screen bg-[#f7f4ea] px-4 py-6 text-[#161410] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d8d1bf] pb-5">
          <div>
            <p className="font-mono text-sm font-medium uppercase tracking-wide text-[#7b3f00]">
              Andes Relay
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Open-source customer signal routing for SaaS products
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded border border-[#d8d1bf] bg-[#fffdf7] px-3 font-mono text-sm font-medium text-[#5c5548]"
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

        <nav className="flex gap-1 overflow-x-auto border-b border-[#d8d1bf]">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex h-11 items-center gap-2 border-b-2 px-3 font-mono text-sm font-medium ${
                activeTab === key
                  ? "border-[#7b3f00] text-[#161410]"
                  : "border-transparent text-[#5c5548] hover:text-[#161410]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <section className="overflow-x-auto">
          {activeTab === "tickets" && <TicketsTable />}
          {activeTab === "feedback" && <FeedbackTable />}
          {activeTab === "forms" && <ContactSubmissionsTable />}
          {activeTab === "accounts" && <AccountCreationsTable />}
          {activeTab === "contacts" && <ContactsTable />}
          {activeTab === "emails" && <EmailTable />}
          {activeTab === "searches" && <SearchTable />}
        </section>
      </section>
    </main>
  );
}

export function AndesRelayDashboard({ configured }: { configured: boolean }) {
  if (!configured) {
    return <SetupScreen />;
  }

  return <LiveDashboard />;
}
