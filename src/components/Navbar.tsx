import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wallet, LogOut, AlertCircle, Globe, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMetaMask } from "@/hooks/useMetaMask";
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
  const location = useLocation();
  const { account, isConnected: walletConnected, isLoading, error, connectWallet, disconnectWallet, formatAddress, chain, isNetworkValid } = useMetaMask();
  const { lang, toggle } = useLanguage();
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { path: "/", label: lang === "es" ? "Inicio" : "Home" },
    { path: "/marketplace", label: lang === "es" ? "Mercado" : "Market" },
    { path: "/registrar", label: lang === "es" ? "Registrar" : "Register" },
    { path: "/rastrear", label: lang === "es" ? "Rastrear" : "Track" },
    { path: "/dashboard", label: "Dashboard" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="container mx-auto px-4">
        {error && walletConnected && (
          <div className="py-2">
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-mango w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <img src={logo} alt="MangoChain" className="h-7 w-7" />
            </div>
            <span className="text-lg font-extrabold text-gradient-mango hidden sm:inline font-display">MangoChain</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>{item.label}</Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              title={lang === "es" ? "Switch to English" : "Cambiar a Español"}>
              <Globe className="h-3.5 w-3.5" />{lang === "es" ? "EN" : "ES"}
            </button>

            {/* User Auth - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl border-border gap-2 px-3">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                      ) : (
                        <UserCircle className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium max-w-[100px] truncate">{profile?.full_name || user.email?.split("@")[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border shadow-elevated p-1 w-48">
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground rounded-lg">
                      {profile?.role === "exportador" ? (lang === "es" ? "Exportador" : "Exporter") : (lang === "es" ? "Agricultor" : "Farmer")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive cursor-pointer rounded-lg" onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />{lang === "es" ? "Cerrar sesión" : "Log out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button size="sm" variant="outline" className="rounded-xl border-border text-xs font-semibold">
                    {lang === "es" ? "Iniciar sesión" : "Log in"}
                  </Button>
                </Link>
              )}

              {/* Wallet */}
              {!walletConnected ? (
                <Button size="sm" className="bg-gradient-mango text-primary-foreground font-semibold px-4 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300"
                  onClick={() => connectWallet()} disabled={isLoading}>
                  {isLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" /> : <Wallet className="mr-2 h-4 w-4" />}
                  {isLoading ? "..." : (lang === "es" ? "Wallet" : "Wallet")}
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm"
                      className={`font-medium px-3 rounded-xl border transition-all duration-200 ${
                        isNetworkValid ? "border-secondary/30 bg-secondary/5 text-secondary" : "border-destructive/30 bg-destructive/5 text-destructive"
                      }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${isNetworkValid ? "bg-secondary" : "bg-destructive animate-pulse"}`} />
                      <span className="font-mono text-xs">{formatAddress(account)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border shadow-elevated p-1 w-48">
                    {!isNetworkValid && <div className="px-3 py-2 text-xs text-destructive font-medium">{lang === "es" ? "Red incorrecta" : "Wrong network"}</div>}
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground rounded-lg">{chain || "..."}</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive cursor-pointer rounded-lg" onClick={() => disconnectWallet()}>
                      <LogOut className="mr-2 h-4 w-4" />{lang === "es" ? "Desconectar" : "Disconnect"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`} onClick={() => setIsOpen(false)}>{item.label}</Link>
            ))}
            <div className="pt-3 px-2 border-t border-border/50 mt-2 space-y-3">
              {user ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <span className="text-sm font-medium text-foreground truncate">{profile?.full_name || user.email?.split("@")[0]}</span>
                  <Button variant="ghost" size="sm" onClick={() => { signOut(); setIsOpen(false); }} className="text-destructive text-xs">
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-xl border-border" variant="outline">
                    {lang === "es" ? "Iniciar sesión" : "Log in"}
                  </Button>
                </Link>
              )}
              {!walletConnected ? (
                <Button className="w-full bg-gradient-mango text-primary-foreground font-semibold rounded-xl"
                  onClick={() => { connectWallet(); setIsOpen(false); }} disabled={isLoading}>
                  <Wallet className="mr-2 h-4 w-4" />{isLoading ? "..." : "Wallet"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className={`p-3 rounded-xl text-center border text-sm ${isNetworkValid ? "bg-secondary/5 border-secondary/20 text-secondary" : "bg-destructive/5 border-destructive/20 text-destructive"}`}>
                    <span className="font-mono text-xs">{formatAddress(account)}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/20 rounded-xl"
                    onClick={() => { disconnectWallet(); setIsOpen(false); }}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />{lang === "es" ? "Desconectar" : "Disconnect"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
