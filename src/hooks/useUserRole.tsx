import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { UserRole, UserProfile, RolePermissions } from "@/types/auth.types";
import { ROLE_PERMISSIONS } from "@/types/auth.types";

interface UseUserRoleReturn {
  role: UserRole | null;
  profile: UserProfile | null;
  permissions: RolePermissions | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isRole: (role: UserRole) => boolean;
}

export const useUserRole = (): UseUserRoleReturn => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserRole();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadUserRole();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadUserRole = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Try to get role from user metadata first (set during signup)
      const metadataRole = user.user_metadata?.role as UserRole | undefined;

      // Try to get from user_roles table (P1.4 implementation)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, organization_id, organizations(name)')
        .eq('user_id', user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is OK for new users
        logger.error('useUserRole.loadRole_failed', { user_id: user.id }, roleError);
      }

      const userRole = roleData?.role || metadataRole || 'export_manager'; // Default to export_manager

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: userRole,
        organization_id: roleData?.organization_id,
        organization_name: roleData?.organizations?.name,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };

      setRole(userRole);
      setProfile(userProfile);

      logger.info('useUserRole.loaded', { user_id: user.id, role: userRole });
    } catch (err: any) {
      logger.error('useUserRole.load_failed', {}, err);
      setError(err.message || 'Failed to load user role');
      // Default to export_manager on error
      setRole('export_manager');
    } finally {
      setLoading(false);
    }
  };

  const permissions = role ? ROLE_PERMISSIONS[role] : null;

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!permissions) return false;
    return permissions[permission];
  };

  const isRole = (checkRole: UserRole): boolean => {
    return role === checkRole;
  };

  return {
    role,
    profile,
    permissions,
    loading,
    error,
    hasPermission,
    isRole,
  };
};
