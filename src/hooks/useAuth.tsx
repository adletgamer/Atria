import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "@/types/auth.types";

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

  const fetchProfile = async (userId: string) => {
    try {
      // Try to get role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, organization_id, organizations(name)')
        .eq('user_id', userId)
        .single();

      // Get role from metadata as fallback
      const metadataRole = user?.user_metadata?.role as UserRole | undefined;
      const userRole = roleData?.role || metadataRole || 'export_manager';

      const userProfile: UserProfile = {
        id: userId,
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
        role: userRole,
        organization_id: roleData?.organization_id,
        organization_name: roleData?.organizations?.name,
        created_at: user?.created_at || '',
        updated_at: user?.updated_at || user?.created_at || '',
      };

      setProfile(userProfile);
      setRole(userRole);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set default profile on error
      const defaultProfile: UserProfile = {
        id: userId,
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
        role: 'export_manager',
        created_at: user?.created_at || '',
        updated_at: user?.created_at || '',
      };
      setProfile(defaultProfile);
      setRole('export_manager');
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          if (event === "SIGNED_IN") {
            await applyPendingSignupRole(session.user.id);
          }
          await fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
