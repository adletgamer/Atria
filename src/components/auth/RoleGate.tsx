import { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import type { UserRole, RolePermissions } from "@/types/auth.types";

interface RoleGateProps {
  children: ReactNode;
  /** Required role(s) to view content */
  roles?: UserRole[];
  /** Required permission to view content */
  permission?: keyof RolePermissions;
  /** Content to show when access is denied */
  fallback?: ReactNode;
  /** If true, hide content instead of showing fallback */
  hideOnDenied?: boolean;
}

/**
 * RoleGate - Conditionally render content based on user role or permission
 * 
 * Usage:
 * ```tsx
 * <RoleGate roles={['compliance_lead', 'system_admin']}>
 *   <Button>Generate Pack</Button>
 * </RoleGate>
 * 
 * <RoleGate permission="canResolveException">
 *   <Button>Resolve Exception</Button>
 * </RoleGate>
 * ```
 */
export const RoleGate = ({
  children,
  roles,
  permission,
  fallback = null,
  hideOnDenied = false,
}: RoleGateProps) => {
  const { role, hasPermission, loading } = useUserRole();

  // While loading, don't render anything
  if (loading) {
    return null;
  }

  // Check role-based access
  if (roles && roles.length > 0) {
    const hasRole = role && roles.includes(role);
    if (!hasRole) {
      return hideOnDenied ? null : <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (permission) {
    const hasPerm = hasPermission(permission);
    if (!hasPerm) {
      return hideOnDenied ? null : <>{fallback}</>;
    }
  }

  // Access granted
  return <>{children}</>;
};

export default RoleGate;
