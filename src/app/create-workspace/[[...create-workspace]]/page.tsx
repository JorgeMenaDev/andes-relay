import { WorkspaceManagement } from "../../workspace/workspace-management";
import { Providers } from "../../providers";

export default function CreateWorkspacePage() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <Providers convexUrl={convexUrl}>
      <WorkspaceManagement />
    </Providers>
  );
}
