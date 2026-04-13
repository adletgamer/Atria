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
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Rastrear from "./pages/Rastrear";
import Dashboard from "./pages/Dashboard";
import Consignments from "./pages/Consignments";
import ConsignmentWorkbench from "./pages/ConsignmentWorkbench";
import Evidence from "./pages/Evidence";
import Readiness from "./pages/Readiness";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Settings from "./pages/Settings";
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
                  {/* Public */}
                  <Route path="/" element={<Index />} />
                  <Route path="/verify-pack" element={<Rastrear />} />

                  {/* Auth */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* Authenticated App */}
                  <Route path="/overview" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/consignments" element={<ProtectedRoute><Consignments /></ProtectedRoute>} />
                  <Route path="/consignments/:id" element={<ProtectedRoute><ConsignmentWorkbench /></ProtectedRoute>} />
                  <Route path="/evidence" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />
                  <Route path="/readiness" element={<ProtectedRoute><Readiness /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                  {/* Fallback */}
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
