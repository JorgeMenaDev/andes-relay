"use client";

import {
  OrganizationList,
  OrganizationProfile,
  OrganizationSwitcher,
  useOrganization,
} from "@clerk/nextjs";

export function WorkspaceManagement() {
  const { organization } = useOrganization();

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f4ea] p-6 text-[#201d1d]">
      <section className="grid w-full max-w-5xl gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#d8d1bf] bg-[#fffdf7] p-4">
          <div>
            <p className="font-mono text-xs uppercase text-[#646262]">
              Andes Relay
            </p>
            <h1 className="font-mono text-xl font-semibold">
              Workspace access
            </h1>
          </div>
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/workspace"
            afterLeaveOrganizationUrl="/"
            afterSelectOrganizationUrl="/workspace"
            createOrganizationMode="navigation"
            createOrganizationUrl="/create-workspace"
            hidePersonal
            organizationProfileMode="navigation"
            organizationProfileUrl="/workspace"
          />
        </div>

        {organization ? (
          <OrganizationProfile
            afterLeaveOrganizationUrl="/"
            path="/workspace"
            routing="path"
          />
        ) : (
          <div className="border border-[#d8d1bf] bg-[#fffdf7] p-4">
            <OrganizationList
              afterCreateOrganizationUrl="/workspace"
              afterSelectOrganizationUrl="/workspace"
              hidePersonal
            />
          </div>
        )}
      </section>
    </main>
  );
}
