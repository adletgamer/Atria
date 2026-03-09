import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "es" ? "Contraseña actualizada" : "Password updated");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="bg-gradient-mango w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
              <img src={logo} alt="MangoChain" className="h-8 w-8" />
            </div>
            <span className="text-2xl font-extrabold text-gradient-mango font-display">MangoChain</span>
          </Link>
        </div>

        <div className="bg-card rounded-3xl p-8 sm:p-10 shadow-card border border-border">
          <h1 className="text-2xl font-bold text-card-foreground font-display mb-1">
            {lang === "es" ? "Nueva Contraseña" : "New Password"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {lang === "es" ? "Ingresa tu nueva contraseña" : "Enter your new password"}
          </p>

          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-primary" />
                {lang === "es" ? "Nueva contraseña" : "New password"}
              </Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-border bg-background h-12" required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} size="lg"
              className="w-full bg-gradient-mango text-primary-foreground font-semibold py-6 rounded-2xl">
              {loading ? "..." : (lang === "es" ? "Actualizar contraseña" : "Update password")}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
