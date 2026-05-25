import { CreateOrganization } from "@clerk/nextjs";

export default function CreateWorkspacePage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ea] p-6 text-[#161410]">
        <div className="max-w-md border border-[#d8d1bf] bg-[#fffdf7] p-5">
          <h1 className="font-mono text-lg font-semibold">
            Clerk is not configured
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#5c5548]">
            Add the production Clerk keys before creating workspaces.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4ea] p-6">
      <CreateOrganization
        afterCreateOrganizationUrl="/workspace"
        path="/create-workspace"
        routing="path"
      />
    </main>
  );
}
