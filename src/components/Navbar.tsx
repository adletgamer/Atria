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
    { path: "/", label: "Home" },
    { path: "/registrar", label: "Register Batch" },
    { path: "/rastrear", label: "Tracking" },
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
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 transition-all duration-300 hover:scale-105"
          >
            <div className="bg-gradient-mango w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
              <img src={logo} alt="MangoChain" className="h-8 w-8" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-mango bg-clip-text ">
              MangoChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative text-sm font-semibold transition-all duration-300 group ${
                  isActive(item.path)
                    ? "text-orange-500"
                    : "text-slate-700 hover:text-orange-500"
                }`}
              >
                {item.label}
                {isActive(item.path) ? (
                  <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
                ) : (
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full group-hover:w-full transition-all duration-300" />
                )}
              </Link>
            ))}
            
            {/* Wallet Connection Button */}
            {!isConnected ? (
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                onClick={handleConnectWallet}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                    className="border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-5 py-2.5 rounded-full shadow-md transition-all duration-300"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    <span className="font-mono text-xs">
                      {formatAddress(account)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="border-2 border-slate-200 rounded-2xl shadow-xl bg-white p-2"
                >
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer rounded-xl px-3 py-2 transition-colors duration-200 hover:bg-red-50"
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
            className="md:hidden p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-300"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-slate-700" /> 
            ) : (
              <Menu className="h-6 w-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-slate-200 bg-white/95 backdrop-blur-lg">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 text-sm font-semibold transition-all duration-300 rounded-2xl mx-2 ${
                  isActive(item.path)
                    ? "text-orange-500 bg-orange-50 border-l-4 border-orange-500"
                    : "text-slate-700 hover:text-orange-500 hover:bg-slate-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Wallet Connection */}
            <div className="px-4 pt-4 border-t border-slate-200">
              {!isConnected ? (
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  onClick={handleConnectWallet}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl text-center shadow-md">
                    <p className="text-emerald-700 text-sm font-semibold flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      ✅ Conectado
                    </p>
                    <p className="text-emerald-700 font-mono text-xs mt-2 font-medium">
                      {formatAddress(account)}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-600 border-2 border-red-200 bg-red-50 hover:bg-red-100 font-semibold px-6 py-3 rounded-full transition-all duration-300"
                    onClick={handleDisconnectWallet}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Desconectar Wallet
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