import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('Auth error:', error, errorDescription);
          navigate('/login?error=' + encodeURIComponent(errorDescription || error));
          return;
        }

        if (code) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code:', error);
            navigate('/login?error=' + encodeURIComponent(error.message));
            return;
          }

          if (data.session) {
            console.log('Successfully authenticated:', data.user?.email);
            // Redirect to overview or the originally requested page
            const redirectTo = sessionStorage.getItem('authRedirectTo') || '/overview';
            sessionStorage.removeItem('authRedirectTo');
            navigate(redirectTo);
            return;
          }
        }

        // If no code and no error, redirect to login
        navigate('/login');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=authentication_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
