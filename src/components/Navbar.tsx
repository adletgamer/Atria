import { Link, useLocation } from "react-router-dom";
import { Leaf, Menu, X, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useMetaMask } from "@/hooks/useMetaMask";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { 
    account, 
    isConnected, 
    isLoading, 
    connectWallet, 
    disconnectWallet, 
    formatAddress 
  } = useMetaMask();

  const navItems = [
    { path: "/", label: "Inicio" },
    { path: "/registrar", label: "Registrar Lote" },
    { path: "/rastrear", label: "Rastrear" },
    { path: "/dashboard", label: "Dashboard" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src={logo} alt="MangoChain" className="h-10 w-10" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              MangoChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Wallet Connection Button */}
            {!isConnected ? (
              <Button 
                size="sm" 
                className="bg-gradient-primary hover:opacity-90"
                onClick={handleConnectWallet}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Conectar Wallet
                  </>
                )}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-200 bg-green-50 hover:bg-green-100"
                  >
                    <Wallet className="mr-2 h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-mono text-xs">
                      {formatAddress(account)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
                    onClick={handleDisconnectWallet}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Desconectar Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.path)
                    ? "text-primary bg-muted"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Wallet Connection */}
            <div className="px-4">
              {!isConnected ? (
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  onClick={handleConnectWallet}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Conectar Wallet
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-600 text-sm font-medium">✅ Conectado</p>
                    <p className="text-green-700 font-mono text-xs mt-1">
                      {formatAddress(account)}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-600 border-red-200"
                    onClick={handleDisconnectWallet}
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