import { CustomerOpsDashboard } from "./customer-ops-dashboard";
import { Providers } from "./providers";

export default function Home() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <Providers convexUrl={convexUrl}>
      <CustomerOpsDashboard configured={Boolean(convexUrl)} />
    </Providers>
  );
}
