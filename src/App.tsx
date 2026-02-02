import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import wagmiConfig from "@/config/wagmi";
import { queryClient } from "@/config/queryClient";
import Index from "./pages/Index";
import Registrar from "./pages/Registrar";
import Rastrear from "./pages/Rastrear";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import QRTest from "./pages/QRTest";
import NotFound from "./pages/NotFound";

/**
 * Orden CRÍTICO de Providers:
 * 1. QueryClientProvider (debe estar primero)
 * 2. WagmiProvider (necesita QueryClient)
 * 3. RainbowKitProvider (necesita Wagmi)
 * 4. TooltipProvider
 * 5. BrowserRouter
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/registrar" element={<Registrar />} />
              <Route path="/rastrear" element={<Rastrear />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/verify/:batchId" element={<Verify />} />
              <Route path="/qr-test" element={<QRTest />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;
