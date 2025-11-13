import { Link, useLocation } from "react-router-dom";
import { Leaf, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Inicio" },
    { path: "/registrar", label: "Registrar Lote" },
    { path: "/rastrear", label: "Rastrear" },
    { path: "/dashboard", label: "Dashboard" },
  ];

  const isActive = (path: string) => location.pathname === path;

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
            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
              <Leaf className="mr-2 h-4 w-4" />
              Conectar Wallet
            </Button>
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
            <div className="px-4">
              <Button size="sm" className="w-full bg-gradient-primary hover:opacity-90">
                <Leaf className="mr-2 h-4 w-4" />
                Conectar Wallet
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
