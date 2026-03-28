import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import wagmiConfig from "@/config/wagmi";
import { queryClient } from "@/config/queryClient";
import { LanguageProvider } from "@/hooks/useLanguage";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Registrar from "./pages/Registrar";
import Rastrear from "./pages/Rastrear";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import Verify from "./pages/Verify";
import QRTest from "./pages/QRTest";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public Home */}
                  <Route path="/" element={<Index />} />

                  {/* Authenticated App IA */}
                  <Route path="/overview" element={<Dashboard />} />
                  <Route path="/consignments" element={<Dashboard />} />
                  <Route path="/evidence" element={<Rastrear />} />
                  <Route path="/readiness" element={<Dashboard />} />
                  <Route path="/verify-pack" element={<Rastrear />} />
                  <Route path="/analytics" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Legacy / compatibility routes */}
                  <Route path="/registrar" element={<Registrar />} />
                  <Route path="/rastrear" element={<Rastrear />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify/:batchId" element={<Verify />} />
                  <Route path="/qr-test" element={<QRTest />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;
