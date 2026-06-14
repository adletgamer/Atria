import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "@/types/auth.types";
import { normalizeRole } from "@/types/auth.types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, role: null, loading: true, signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    const userId = currentUser.id;
    try {
      // Try to get role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, organization_id, organizations(name)')
        .eq('user_id', userId)
        .single();

      // Get role from metadata as fallback
      const metadataRole = currentUser.user_metadata?.role;
      const userRole = normalizeRole(roleData?.role || metadataRole);

      const userProfile: UserProfile = {
        id: userId,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
        role: userRole,
        organization_id: roleData?.organization_id,
        organization_name: roleData?.organizations?.name,
        created_at: currentUser.created_at || '',
        updated_at: currentUser.updated_at || currentUser.created_at || '',
      };

      setProfile(userProfile);
      setRole(userRole);
      return userProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set default profile on error
      const defaultProfile: UserProfile = {
        id: userId,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
        role: 'export_manager',
        created_at: currentUser.created_at || '',
        updated_at: currentUser.created_at || '',
      };
      setProfile(defaultProfile);
      setRole('export_manager');
      return defaultProfile;
    }
  };

  const applyPendingSignupRole = async (userId: string) => {
    const pendingRole = localStorage.getItem("pending_signup_role");
    if (!pendingRole || !["export_manager", "compliance_lead", "auditor"].includes(pendingRole)) return;

    // Create user role entry
    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: pendingRole,
        organization_id: '00000000-0000-0000-0000-000000000001', // Default org
        created_by: 'system'
      });

    if (!error) {
      localStorage.removeItem("pending_signup_role");
    }
  };

  useEffect(() => {
    let active = true;

    const handleUserSession = async (session: Session | null, event?: string) => {
      const currentUser = session?.user ?? null;
      if (!active) return;

      setSession(session);
      setUser(currentUser);

      if (currentUser) {
        if (event === "SIGNED_IN") {
          await applyPendingSignupRole(currentUser.id);
        }
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
        setRole(null);
      }

      if (active) {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleUserSession(session, event);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) {
        handleUserSession(session);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
