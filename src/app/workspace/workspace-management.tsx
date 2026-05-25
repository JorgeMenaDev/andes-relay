"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type WorkspaceInvite = {
  _id: Id<"workspaceInvites">;
  workspaceKey: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "revoked";
};

const keyLabel = (key: string) =>
  key
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ") || key;

export function WorkspaceManagement() {
  const settings = useQuery(api.sources.listSettings);
  const invites = useQuery(api.sources.listWorkspaceInvites, {});
  const upsertWorkspace = useMutation(api.sources.upsertWorkspace);
  const createWorkspaceInvite = useMutation(api.sources.createWorkspaceInvite);
  const revokeWorkspaceInvite = useMutation(api.sources.revokeWorkspaceInvite);
  const [workspaceKey, setWorkspaceKey] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteWorkspaceKey, setInviteWorkspaceKey] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const workspaceOptions = [
    ...(settings?.workspaces.map((item) => item.key) ?? []),
    ...(settings?.discoveredWorkspaces ?? []),
  ].filter((key, index, keys) => keys.indexOf(key) === index);
  const workspaceNames = new Map(
    settings?.workspaces.map((item) => [item.key, item.name]),
  );

  return (
    <main className="min-h-screen bg-[#f7f4ea] p-6 text-[#201d1d]">
      <section className="mx-auto grid w-full max-w-5xl gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#d8d1bf] bg-[#fffdf7] p-4">
          <div>
            <p className="font-mono text-xs uppercase text-[#646262]">
              Andes Relay
            </p>
            <h1 className="font-mono text-xl font-semibold">
              Workspace access
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-[4px] bg-[#201d1d] px-4 font-mono text-sm font-medium text-[#fdfcfc]"
          >
            Dashboard
          </Link>
        </div>

        <section className="grid gap-4 border border-[#d8d1bf] bg-[#fffdf7] p-4">
          <h2 className="font-mono text-base font-semibold">Create workspace</h2>
          <form
            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={async (event) => {
              event.preventDefault();
              await upsertWorkspace({
                key: workspaceKey,
                name: workspaceName || keyLabel(workspaceKey),
              });
              setWorkspaceKey("");
              setWorkspaceName("");
            }}
          >
            <Input
              label="Workspace key"
              value={workspaceKey}
              onChange={setWorkspaceKey}
              placeholder="arketix"
            />
            <Input
              label="Display name"
              value={workspaceName}
              onChange={setWorkspaceName}
              placeholder="Arketix"
            />
            <button
              type="submit"
              disabled={!workspaceKey.trim()}
              className="mt-5 h-10 rounded-[4px] bg-[#201d1d] px-4 font-mono text-sm font-medium text-[#fdfcfc] disabled:opacity-40"
            >
              Save
            </button>
          </form>
        </section>

        <section className="grid gap-4 border border-[#d8d1bf] bg-[#fffdf7] p-4">
          <h2 className="font-mono text-base font-semibold">Invite people</h2>
          <form
            className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]"
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
            <Select
              label="Workspace"
              value={inviteWorkspaceKey}
              onChange={setInviteWorkspaceKey}
            >
              <option value="">Select workspace</option>
              {workspaceOptions.map((key) => (
                <option key={key} value={key}>
                  {workspaceNames.get(key) ?? keyLabel(key)}
                </option>
              ))}
            </Select>
            <Input
              label="Email"
              value={inviteEmail}
              onChange={setInviteEmail}
              placeholder="person@example.com"
            />
            <Select
              label="Role"
              value={inviteRole}
              onChange={(value) =>
                setInviteRole(value === "admin" ? "admin" : "member")
              }
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
            <button
              type="submit"
              disabled={!inviteWorkspaceKey.trim() || !inviteEmail.trim()}
              className="mt-5 h-10 rounded-[4px] bg-[#201d1d] px-4 font-mono text-sm font-medium text-[#fdfcfc] disabled:opacity-40"
            >
              Invite
            </button>
          </form>

          <div className="overflow-x-auto border border-[#d8d1bf]">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-[#f8f7f7] font-mono text-xs uppercase text-[#646262]">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Workspace</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8d1bf]">
                {((invites ?? []) as WorkspaceInvite[]).map((invite) => (
                  <tr key={invite._id}>
                    <td className="px-3 py-2 font-medium">{invite.email}</td>
                    <td className="px-3 py-2">
                      {workspaceNames.get(invite.workspaceKey) ??
                        keyLabel(invite.workspaceKey)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[#646262]">
                      {invite.role}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[#646262]">
                      {invite.status}
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
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function Input({
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
        className="h-10 rounded-[4px] border border-[#d8d1bf] bg-[#f8f7f7] px-3 text-sm text-[#201d1d] outline-none focus:border-[#646262]"
      />
    </label>
  );
}

function Select({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1 font-mono text-xs text-[#646262]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-10 rounded-[4px] border border-[#d8d1bf] bg-[#f8f7f7] px-3 text-sm text-[#201d1d] outline-none focus:border-[#646262]"
      >
        {children}
      </select>
    </label>
  );
}
