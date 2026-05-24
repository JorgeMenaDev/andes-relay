import { AndesRelayDashboard } from "./andes-relay-dashboard";
import { Providers } from "./providers";

export default function Home() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const ingestEndpoint = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <Providers convexUrl={convexUrl}>
      <AndesRelayDashboard
        authConfigured={authConfigured}
        configured={Boolean(convexUrl)}
        ingestEndpoint={ingestEndpoint}
      />
    </Providers>
  );
}
