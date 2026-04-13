import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Globe, ChevronDown, BarChart3, Package, FileText, ShieldCheck, Activity, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
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

const useAnchorNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAnchor = useCallback((anchor: string) => {
    if (location.pathname === "/") {
      scrollTo(anchor);
    } else {
      navigate(`/#${anchor}`);
    }
  }, [location.pathname, navigate, scrollTo]);

  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => scrollTo(id), 80);
    }
  }, [location, scrollTo]);

  return handleAnchor;
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { lang, toggle } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const handleAnchor = useAnchorNav();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const publicNavItems = [
    { label: lang === "es" ? "Inicio" : "Home", action: () => handleAnchor("hero") },
    { label: lang === "es" ? "Producto" : "Product", action: () => handleAnchor("product") },
    { label: lang === "es" ? "Cómo funciona" : "How it works", action: () => handleAnchor("how-it-works") },
    { label: lang === "es" ? "Verificar Pack" : "Verify Pack", path: "/verify-pack" },
  ];

  const appNavItems = [
    { path: "/overview", label: "Overview", icon: BarChart3 },
    { path: "/consignments", label: lang === "es" ? "Consignaciones" : "Consignments", icon: Package },
    { path: "/evidence", label: lang === "es" ? "Evidencia" : "Evidence", icon: FileText },
    { path: "/readiness", label: "Readiness", icon: Activity },
    { path: "/verify-pack", label: lang === "es" ? "Verificar" : "Verify", icon: ShieldCheck },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled
        ? "bg-background/80 backdrop-blur-xl shadow-sm border-b border-border/40"
        : "bg-background/60 backdrop-blur-md border-b border-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-12 items-center justify-between">
          {/* Left — Logo */}
          <Link to={user ? "/overview" : "/"} className="flex items-center gap-2 shrink-0">
            <div className="bg-gradient-mango w-7 h-7 rounded-lg flex items-center justify-center">
              <img src={logo} alt="MangoChain" className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-bold text-foreground hidden sm:inline font-display">MangoChain</span>
          </Link>

          {/* Center — Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {user ? (
              appNavItems.map((item) => (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}>
                  {item.icon && <item.icon className="h-3 w-3" />}
                  {item.label}
                </Link>
              ))
            ) : (
              publicNavItems.map((item) =>
                item.path ? (
                  <Link key={item.label} to={item.path}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                      isActive(item.path)
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}>
                    {item.label}
                  </Link>
                ) : (
                  <button key={item.label} onClick={item.action}
                    className="px-3 py-1.5 text-[12px] font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    {item.label}
                  </button>
                )
              )
            )}
          </div>

          {/* Right — Lang + Auth + CTA */}
          <div className="flex items-center gap-1.5">
            <button onClick={toggle}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title={lang === "es" ? "Switch to English" : "Cambiar a Español"}>
              <Globe className="h-3 w-3" />{lang === "es" ? "EN" : "ES"}
            </button>

            <div className="hidden lg:flex items-center gap-1.5">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-md gap-1.5 px-2 h-7 hover:bg-muted/80">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 bg-gradient-mango rounded-full flex items-center justify-center">
                          <span className="text-[9px] font-bold text-primary-foreground">
                            {(profile?.full_name || user.email || "U")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-[11px] font-medium max-w-[72px] truncate text-foreground">{profile?.full_name || user.email?.split("@")[0]}</span>
                      <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border shadow-lg p-1 w-48">
                    <div className="px-2.5 py-1.5">
                      <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name || user.email}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {profile?.role === "exportador" ? (lang === "es" ? "Exportador" : "Exporter") : (lang === "es" ? "Agricultor" : "Farmer")}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md text-[11px] font-medium">
                      <Link to="/settings">
                        <Settings className="mr-1.5 h-3 w-3" />{lang === "es" ? "Ajustes" : "Settings"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md text-[11px] font-medium">
                      <Link to="/analytics">
                        <BarChart3 className="mr-1.5 h-3 w-3" />{lang === "es" ? "Analítica" : "Analytics"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive cursor-pointer rounded-md text-[11px] font-medium" onClick={signOut}>
                      <LogOut className="mr-1.5 h-3 w-3" />{lang === "es" ? "Cerrar sesión" : "Log out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="rounded-md text-[11px] font-medium h-7 px-2.5 text-muted-foreground hover:text-foreground">
                      {lang === "es" ? "Iniciar sesión" : "Log in"}
                    </Button>
                  </Link>
                  <a href="mailto:pilot@mangochain.io?subject=Pilot%20Request">
                    <Button size="sm" className="rounded-md text-[11px] font-medium h-7 px-3 bg-foreground text-background hover:bg-foreground/90">
                      {lang === "es" ? "Solicitar piloto" : "Request pilot"}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </a>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button className="lg:hidden p-1.5 rounded-md hover:bg-muted/50 transition-colors"
              onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X className="h-4 w-4 text-foreground" /> : <Menu className="h-4 w-4 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="lg:hidden py-3 space-y-0.5 border-t border-border/30 animate-in slide-in-from-top-2 duration-200">
            {user ? (
              appNavItems.map((item) => (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path) ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`} onClick={() => setIsOpen(false)}>
                  {item.icon && <item.icon className="h-3.5 w-3.5" />}
                  {item.label}
                </Link>
              ))
            ) : (
              publicNavItems.map((item) =>
                item.path ? (
                  <Link key={item.label} to={item.path}
                    className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.path) ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`} onClick={() => setIsOpen(false)}>
                    {item.label}
                  </Link>
                ) : (
                  <button key={item.label} onClick={() => { item.action?.(); setIsOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    {item.label}
                  </button>
                )
              )
            )}
            <div className="pt-2 border-t border-border/30 mt-1 space-y-1.5 px-1">
              {user ? (
                <>
                  <Link to="/settings" onClick={() => setIsOpen(false)}>
                    <Button className="w-full rounded-md text-xs h-8" variant="outline">
                      <Settings className="mr-1.5 h-3.5 w-3.5" />{lang === "es" ? "Ajustes" : "Settings"}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => { signOut(); setIsOpen(false); }} className="w-full text-destructive border-destructive/20 rounded-md text-xs h-8">
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />{lang === "es" ? "Cerrar sesión" : "Log out"}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button className="w-full rounded-md text-xs h-8" variant="outline">
                      {lang === "es" ? "Iniciar sesión" : "Log in"}
                    </Button>
                  </Link>
                  <a href="mailto:pilot@mangochain.io?subject=Pilot%20Request">
                    <Button className="w-full rounded-md text-xs h-8 bg-foreground text-background hover:bg-foreground/90">
                      {lang === "es" ? "Solicitar piloto" : "Request pilot"}
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
