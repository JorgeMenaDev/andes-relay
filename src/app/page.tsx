import { AndesRelayDashboard } from "./andes-relay-dashboard";
import { Providers } from "./providers";

export default function Home() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <Providers convexUrl={convexUrl}>
      <AndesRelayDashboard configured={Boolean(convexUrl)} />
    </Providers>
  );
}
