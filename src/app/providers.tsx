"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useMemo } from "react";
import { api } from "../../convex/_generated/api";

function OperatorAccess({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const allowed = useQuery(api.access.canOperate, isAuthenticated ? {} : "skip");
  if (isLoading || (isAuthenticated && allowed === undefined)) {
    return <p className="p-6">Checking access…</p>;
  }
  if (!allowed) {
    return <p className="p-6">Operator access is required. Contact the deployment administrator.</p>;
  }
  return children;
}

export function Providers({ children, convexUrl }: { children: ReactNode; convexUrl?: string }) {
  const convex = useMemo(() => convexUrl ? new ConvexReactClient(convexUrl) : null, [convexUrl]);
  if (!convex || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <p className="p-6">Dashboard access is unavailable until authentication is configured.</p>;
  }
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <OperatorAccess>{children}</OperatorAccess>
    </ConvexProviderWithClerk>
  );
}
