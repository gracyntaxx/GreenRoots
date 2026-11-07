import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@/types";
import { useSession } from "@/store/session";
import { homeForRole, isFieldRole, isPortalRole } from "@/lib/routing";

export function RequireRole({
  allow,
  children,
}: {
  allow: "field" | "portal" | Role[];
  children: React.ReactNode;
}) {
  const profile = useSession((s) => s.profile);
  const location = useLocation();

  if (!profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allow === "field" && !isFieldRole(profile.role)) {
    return <Navigate to={homeForRole(profile.role)} replace />;
  }
  if (allow === "portal" && !isPortalRole(profile.role)) {
    return <Navigate to={homeForRole(profile.role)} replace />;
  }
  if (Array.isArray(allow) && !allow.includes(profile.role)) {
    return <Navigate to={homeForRole(profile.role)} replace />;
  }
  return <>{children}</>;
}
