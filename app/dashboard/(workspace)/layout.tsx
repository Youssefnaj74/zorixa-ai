import { WorkspaceShell } from "@/components/dashboard/workspace-shell";

export default function DashboardWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
