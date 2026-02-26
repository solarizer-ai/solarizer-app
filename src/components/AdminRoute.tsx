import { Navigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminRole();

  // Render nothing while checking — do not hint the route exists
  if (isLoading) return null;

  // Non-admin: redirect to home (not /dashboard) so the admin area is not revealed
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
