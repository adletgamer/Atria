import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/hooks/useLanguage";
import { useMetaMask } from "@/hooks/useMetaMask";
import { Link2, Settings2, LogOut, ShieldCheck, ArrowRight, ChevronDown } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const txt = {
  es: {
    title: "Settings",
    subtitle: "Configuración de cuenta",
    account: "Cuenta",
    consignments: "Ir a Consignaciones",
    advancedTitle: "Avanzado: Anclaje On-Chain",
    advancedDesc: "Configuración de firma on-chain. Solo para administradores.",
    connect: "Conectar",
    disconnect: "Desconectar",
    connected: "Conectada",
    notConnected: "No conectada",
    network: "Red",
  },
  en: {
    title: "Settings",
    subtitle: "Account configuration",
    account: "Account",
    consignments: "Go to Consignments",
    advancedTitle: "Advanced: On-Chain Anchoring",
    advancedDesc: "On-chain signing configuration. Administrators only.",
    connect: "Connect",
    disconnect: "Disconnect",
    connected: "Connected",
    notConnected: "Not connected",
    network: "Network",
  },
};

const Settings = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const i = txt[lang];
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    account,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    formatAddress,
    chain,
    isNetworkValid,
    error,
  } = useMetaMask();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" animate="visible" className="mb-8">
            <motion.div custom={0} variants={fadeUp}>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">{i.account}</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">{i.title}</h1>
              <p className="text-muted-foreground mt-1">{i.subtitle}</p>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="mb-6">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/consignments")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {i.consignments}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Advanced: On-Chain — collapsed by default */}
          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="font-medium">{i.advancedTitle}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            </button>

            {showAdvanced && (
              <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-card border border-border">
                <p className="text-xs text-muted-foreground mb-4">{i.advancedDesc}</p>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    <span className="font-semibold">Status:</span>{" "}
                    <span className={isConnected ? "text-secondary" : "text-muted-foreground"}>
                      {isConnected ? i.connected : i.notConnected}
                    </span>
                  </p>
                  <p className="text-foreground">
                    <span className="font-semibold">{i.network}:</span>{" "}
                    <span className={isNetworkValid ? "text-secondary" : "text-muted-foreground"}>{chain || "-"}</span>
                  </p>
                  {isConnected && account && (
                    <p className="text-foreground">
                      <span className="font-semibold">Address:</span>{" "}
                      <span className="font-mono text-xs">{formatAddress(account)}</span>
                    </p>
                  )}
                  {error && <p className="text-destructive text-xs">{error}</p>}
                </div>

                <div className="flex gap-2 mt-4">
                  {!isConnected ? (
                    <Button
                      onClick={() => connectWallet()}
                      disabled={isLoading}
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Link2 className="mr-2 h-3.5 w-3.5" />
                      {isLoading ? "..." : i.connect}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectWallet}
                      className="rounded-xl border-destructive/20 text-destructive"
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      {i.disconnect}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
