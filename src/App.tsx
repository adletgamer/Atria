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
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
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

                  {/* Authenticated App — each route wrapped in ErrorBoundary */}
                  <Route path="/overview" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/consignments" element={<ProtectedRoute><ErrorBoundary><Consignments /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/consignments/:id" element={<ProtectedRoute><ErrorBoundary><ConsignmentWorkbench /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/evidence" element={<ProtectedRoute><ErrorBoundary><Evidence /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/readiness" element={<ProtectedRoute><ErrorBoundary><Readiness /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><ErrorBoundary><Analytics /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute>} />

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
