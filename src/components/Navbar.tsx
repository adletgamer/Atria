import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wallet, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useMetaMask } from "@/hooks/useMetaMask";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);
  const location = useLocation();
  const { 
    account, 
    isConnected, 
    isLoading, 
    error,
    connectWallet, 
    disconnectWallet, 
    formatAddress,
    chain,
    isNetworkValid
  } = useMetaMask();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/registrar", label: "Registrar" },
    { path: "/rastrear", label: "Rastrear" },
    { path: "/dashboard", label: "Dashboard" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setIsOpen(false); // Cerrar menú móvil después de conectar
    } catch (err) {
      // El error se maneja en el hook
      setShowMetaMaskModal(true);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setIsOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          {/* Error Banner */}
          {error && isConnected && (
            <div className="py-2 px-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 transition-all duration-300 hover:scale-105"
            >
              <div className="bg-gradient-mango w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
                <img src={logo} alt="MangoChain" className="h-8 w-8" />
              </div>
              <span className="text-2xl font-extrabold bg-gradient-mango bg-clip-text hidden sm:inline">
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
              
              {/* Wallet Connection Button - Desktop */}
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
                      className={`border-2 font-semibold px-5 py-2.5 rounded-full shadow-md transition-all duration-300 ${
                        isNetworkValid
                          ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
                      }`}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      <span className="font-mono text-xs">
                        {formatAddress(account)}
                      </span>
                      {!isNetworkValid && <span className="ml-2 text-xs">⚠️</span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="border-2 border-slate-200 rounded-2xl shadow-xl bg-white p-2 w-48"
                  >
                    {!isNetworkValid && (
                      <div className="px-3 py-2 text-xs text-red-600 font-semibold mb-2">
                        Red incorrecta. Cambia a Polygon Amoy.
                      </div>
                    )}
                    <DropdownMenuItem 
                      className="text-slate-700 cursor-pointer rounded-xl px-3 py-2 transition-colors duration-200 hover:bg-slate-100"
                      disabled
                    >
                      <span className="text-xs">{chain || 'Conectando...'}</span>
                    </DropdownMenuItem>
                    <div className="my-1 border-t border-slate-200" />
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer rounded-xl px-3 py-2 transition-colors duration-200 hover:bg-red-50"
                      onClick={handleDisconnectWallet}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Desconectar
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
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
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
                    <div className={`p-4 rounded-2xl text-center shadow-md border-2 ${
                      isNetworkValid
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                        : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                    }`}>
                      <p className={`text-sm font-semibold flex items-center justify-center gap-2 ${
                        isNetworkValid ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          isNetworkValid ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        {isNetworkValid ? '✅ Conectado' : '⚠️ Red Incorrecta'}
                      </p>
                      <p className={`font-mono text-xs mt-2 font-medium ${
                        isNetworkValid ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {formatAddress(account)}
                      </p>
                      {!isNetworkValid && (
                        <p className="text-xs text-red-600 mt-2">Cambia a Polygon Amoy</p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-red-600 border-2 border-red-200 bg-red-50 hover:bg-red-100 font-semibold px-6 py-3 rounded-full transition-all duration-300"
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

      {/* MetaMask Installation Modal */}
      <Dialog open={showMetaMaskModal} onOpenChange={setShowMetaMaskModal}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              🦊 MetaMask no detectado
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Necesitas MetaMask para interactuar con la blockchain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                MetaMask es una extensión de navegador que te permite gestionar wallets de Ethereum.
              </AlertDescription>
            </Alert>
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
              <h4 className="font-semibold text-slate-900">Pasos:</h4>
              <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
                <li>Visita metamask.io</li>
                <li>Descarga la extensión para tu navegador</li>
                <li>Instálalo y completa la configuración</li>
                <li>Vuelve aquí e intenta conectar nuevamente</li>
              </ol>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowMetaMaskModal(false)}
            >
              Cerrar
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600"
              onClick={() => window.open('https://metamask.io', '_blank')}
            >
              Ir a MetaMask
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;