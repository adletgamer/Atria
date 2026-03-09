import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wallet, LogOut, AlertCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMetaMask } from "@/hooks/useMetaMask";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", label: "Inicio" },
  { path: "/registrar", label: "Registrar" },
  { path: "/rastrear", label: "Rastrear" },
  { path: "/dashboard", label: "Dashboard" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { account, isConnected, isLoading, error, connectWallet, disconnectWallet, formatAddress, chain, isNetworkValid } = useMetaMask();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="container mx-auto px-4">
        {/* Error Banner */}
        {error && isConnected && (
          <div className="py-2">
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-mango w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-extrabold text-gradient-mango hidden sm:inline font-display">
              MangoChain
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Desktop Wallet */}
            <div className="hidden md:block">
              {!isConnected ? (
                <Button
                  size="sm"
                  className="bg-gradient-mango text-primary-foreground font-semibold px-5 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300"
                  onClick={() => connectWallet()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                  ) : (
                    <Wallet className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Conectando..." : "Conectar"}
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-medium px-4 rounded-xl border transition-all duration-200 ${
                        isNetworkValid
                          ? "border-secondary/30 bg-secondary/5 text-secondary hover:bg-secondary/10"
                          : "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${isNetworkValid ? "bg-secondary" : "bg-destructive animate-pulse"}`} />
                      <span className="font-mono text-xs">{formatAddress(account)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border border-border shadow-elevated p-1 w-48">
                    {!isNetworkValid && (
                      <div className="px-3 py-2 text-xs text-destructive font-medium">
                        Red incorrecta — usa Polygon Amoy
                      </div>
                    )}
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground rounded-lg">
                      {chain || "Conectando..."}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive cursor-pointer rounded-lg"
                      onClick={() => disconnectWallet()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Desconectar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 px-2 border-t border-border/50 mt-2">
              {!isConnected ? (
                <Button
                  className="w-full bg-gradient-mango text-primary-foreground font-semibold rounded-xl"
                  onClick={() => { connectWallet(); setIsOpen(false); }}
                  disabled={isLoading}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {isLoading ? "Conectando..." : "Conectar Wallet"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl text-center border ${
                    isNetworkValid ? "bg-secondary/5 border-secondary/20" : "bg-destructive/5 border-destructive/20"
                  }`}>
                    <div className={`flex items-center justify-center gap-2 text-sm font-medium ${
                      isNetworkValid ? "text-secondary" : "text-destructive"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${isNetworkValid ? "bg-secondary" : "bg-destructive animate-pulse"}`} />
                      {isNetworkValid ? "Conectado" : "Red Incorrecta"}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground mt-1">{formatAddress(account)}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 rounded-xl"
                    onClick={() => { disconnectWallet(); setIsOpen(false); }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Desconectar
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
