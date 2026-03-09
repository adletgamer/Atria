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
import Index from "./pages/Index";
import Registrar from "./pages/Registrar";
import Rastrear from "./pages/Rastrear";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import QRTest from "./pages/QRTest";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider>
        <LanguageProvider>
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;
