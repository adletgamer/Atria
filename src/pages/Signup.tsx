import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, Building, Leaf, ArrowRight, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/hooks/useLanguage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

const txt = {
  es: {
    title: "Crear Cuenta",
    subtitle: "Únete al marketplace de mangos peruanos",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    password: "Contraseña",
    company: "Empresa (opcional)",
    role: "¿Cuál es tu rol?",
    agricultor: "Agricultor",
    agricultorDesc: "Produzco y vendo mangos",
    exportador: "Exportador",
    exportadorDesc: "Compro y exporto mangos",
    signup: "Crear cuenta",
    google: "Continuar con Google",
    or: "o",
    haveAccount: "¿Ya tienes cuenta?",
    login: "Iniciar sesión",
    checkEmail: "Revisa tu correo para verificar tu cuenta",
  },
  en: {
    title: "Create Account",
    subtitle: "Join the Peruvian mango marketplace",
    fullName: "Full name",
    email: "Email address",
    password: "Password",
    company: "Company (optional)",
    role: "What's your role?",
    agricultor: "Farmer",
    agricultorDesc: "I produce and sell mangoes",
    exportador: "Exporter",
    exportadorDesc: "I buy and export mangoes",
    signup: "Create account",
    google: "Continue with Google",
    or: "or",
    haveAccount: "Already have an account?",
    login: "Log in",
    checkEmail: "Check your email to verify your account",
  },
};

const Signup = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const i = txt[lang];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", company: "", role: "agricultor" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/overview`,
        data: { full_name: form.fullName, company_name: form.company, role: form.role },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(i.checkEmail);
    navigate("/login");
  };

  const handleGoogle = async () => {
    localStorage.setItem("pending_signup_role", form.role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/overview`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <motion.div initial="hidden" animate="visible" className="w-full max-w-md">
        {/* Logo */}
        <motion.div custom={0} variants={fadeUp} className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="bg-gradient-mango w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
              <img src={logo} alt="MangoChain" className="h-8 w-8" />
            </div>
            <span className="text-2xl font-extrabold text-gradient-mango font-display">MangoChain</span>
          </Link>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="bg-card rounded-3xl p-8 sm:p-10 shadow-card border border-border">
          <h1 className="text-2xl font-bold text-card-foreground font-display mb-1">{i.title}</h1>
          <p className="text-muted-foreground mb-8">{i.subtitle}</p>

          {/* Google */}
          <Button onClick={handleGoogle} variant="outline" className="w-full rounded-2xl py-6 border-border font-semibold mb-6 hover:bg-muted transition-all">
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {i.google}
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{i.or}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" />{i.fullName}</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="rounded-xl border-border bg-background h-12" required />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" />{i.email}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-xl border-border bg-background h-12" required />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary" />{i.password}</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="rounded-xl border-border bg-background h-12 pr-10" required minLength={6} />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2"><Building className="h-3.5 w-3.5 text-primary" />{i.company}</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="rounded-xl border-border bg-background h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2"><Leaf className="h-3.5 w-3.5 text-secondary" />{i.role}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="rounded-xl border-border bg-background h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="agricultor"><div><p className="font-semibold">{i.agricultor}</p><p className="text-xs text-muted-foreground">{i.agricultorDesc}</p></div></SelectItem>
                  <SelectItem value="exportador"><div><p className="font-semibold">{i.exportador}</p><p className="text-xs text-muted-foreground">{i.exportadorDesc}</p></div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading} size="lg"
              className="w-full bg-gradient-mango text-primary-foreground font-semibold py-6 rounded-2xl shadow-sm hover:shadow-elevated hover:scale-[1.01] transition-all duration-300">
              {loading ? "..." : <>{i.signup}<ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {i.haveAccount}{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">{i.login}</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;
