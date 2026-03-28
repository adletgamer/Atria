import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, Globe, ChevronDown, BarChart3, Package, Home, FileText, ShieldCheck, Activity, Settings, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { lang, toggle } = useLanguage();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const publicNavItems = [
    { path: "/", label: lang === "es" ? "Inicio" : "Home", icon: Home },
    { path: "/#product", label: lang === "es" ? "Producto" : "Product", icon: Package },
    { path: "/#how-it-works", label: lang === "es" ? "Cómo funciona" : "How it works", icon: Workflow },
    { path: "/verify-pack", label: lang === "es" ? "Verificar Pack" : "Verify Pack", icon: ShieldCheck },
  ];

  const appNavItems = [
    { path: "/overview", label: lang === "es" ? "Overview" : "Overview", icon: BarChart3 },
    { path: "/consignments", label: lang === "es" ? "Consignaciones" : "Consignments", icon: Package },
    { path: "/evidence", label: lang === "es" ? "Evidencia" : "Evidence", icon: FileText },
    { path: "/readiness", label: lang === "es" ? "Readiness" : "Readiness", icon: Activity },
    { path: "/verify-pack", label: lang === "es" ? "Verificar Pack" : "Verify Pack", icon: ShieldCheck },
    { path: "/analytics", label: lang === "es" ? "Analítica" : "Analytics", icon: BarChart3 },
    { path: "/settings", label: lang === "es" ? "Ajustes" : "Settings", icon: Settings },
  ];

  const navItems = user ? appNavItems : publicNavItems;

  const isActive = (path: string) => {
    if (path.includes("#")) {
      return location.pathname === "/";
    }
    return location.pathname === path;
  };

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled ? "glass shadow-card border-b border-border/30" : "bg-transparent border-b border-transparent"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={user ? "/overview" : "/"} className="flex items-center gap-2.5 group">
            <div className="bg-gradient-mango w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
              <img src={logo} alt="MangoChain" className="h-6 w-6" />
            </div>
            <span className="text-lg font-extrabold text-gradient-mango hidden sm:inline font-display tracking-tight">MangoChain</span>
          </Link>

          {/* Desktop Nav - Pill style */}
          <div className="hidden lg:flex items-center bg-muted/60 rounded-2xl p-1 border border-border/50">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <button onClick={toggle}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-all"
              title={lang === "es" ? "Switch to English" : "Cambiar a Español"}>
              <Globe className="h-3 w-3" />{lang === "es" ? "EN" : "ES"}
            </button>

            {/* User Auth - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-xl gap-2 px-3 hover:bg-muted/80">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full ring-2 ring-primary/20" />
                      ) : (
                        <div className="w-6 h-6 bg-gradient-mango rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-foreground">
                            {(profile?.full_name || user.email || "U")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-xs font-semibold max-w-[80px] truncate text-foreground">{profile?.full_name || user.email?.split("@")[0]}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl border-border shadow-elevated p-1.5 w-52">
                    <div className="px-3 py-2 mb-1">
                      <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || user.email}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {profile?.role === "exportador" ? (lang === "es" ? "Exportador" : "Exporter") : (lang === "es" ? "Agricultor" : "Farmer")}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl text-xs font-semibold">
                      <Link to="/settings">
                        <Settings className="mr-2 h-3.5 w-3.5" />{lang === "es" ? "Ajustes" : "Settings"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive cursor-pointer rounded-xl text-xs font-semibold" onClick={signOut}>
                      <LogOut className="mr-2 h-3.5 w-3.5" />{lang === "es" ? "Cerrar sesión" : "Log out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button size="sm" variant="outline" className="rounded-xl border-border text-xs font-semibold h-8">
                    {lang === "es" ? "Iniciar sesión" : "Log in"}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Toggle */}
            <button className="lg:hidden p-2 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 transition-colors"
              onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="lg:hidden py-4 space-y-1 border-t border-border/30 animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                  isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`} onClick={() => setIsOpen(false)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="pt-3 px-2 border-t border-border/30 mt-2 space-y-3">
              {user ? (
                <>
                  <Link to="/settings" onClick={() => setIsOpen(false)}>
                    <Button className="w-full rounded-xl border-border" variant="outline">
                      <Settings className="mr-2 h-4 w-4" />{lang === "es" ? "Ajustes" : "Settings"}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => { signOut(); setIsOpen(false); }} className="w-full text-destructive border-destructive/20 rounded-xl">
                    <LogOut className="mr-2 h-3.5 w-3.5" />{lang === "es" ? "Cerrar sesión" : "Log out"}
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-xl border-border" variant="outline">
                    {lang === "es" ? "Iniciar sesión" : "Log in"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
