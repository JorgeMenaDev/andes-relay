import { WorkspaceManagement } from "../workspace-management";
import { Providers } from "../../providers";

export default function WorkspacePage() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <Providers convexUrl={convexUrl}>
      <WorkspaceManagement />
    </Providers>
  );
}
