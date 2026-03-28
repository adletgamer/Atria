import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/hooks/useLanguage";
import { useMetaMask } from "@/hooks/useMetaMask";
import { Link2, Wallet, LogOut, ShieldCheck, ArrowRight } from "lucide-react";

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
    subtitle: "Configuración de cuenta e integraciones",
    integrations: "Integrations",
    walletTitle: "Wallet",
    walletDesc: "Conecta tu wallet desde aquí cuando necesites firma on-chain.",
    connect: "Conectar Wallet",
    disconnect: "Desconectar",
    connected: "Conectada",
    notConnected: "No conectada",
    network: "Red",
    readiness: "Ir a Readiness",
  },
  en: {
    title: "Settings",
    subtitle: "Account configuration and integrations",
    integrations: "Integrations",
    walletTitle: "Wallet",
    walletDesc: "Connect your wallet here when you need on-chain signing.",
    connect: "Connect Wallet",
    disconnect: "Disconnect",
    connected: "Connected",
    notConnected: "Not connected",
    network: "Network",
    readiness: "Go to Readiness",
  },
};

const Settings = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const i = txt[lang];
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
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">{i.integrations}</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">{i.title}</h1>
              <p className="text-muted-foreground mt-1">{i.subtitle}</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="bg-card rounded-2xl p-6 sm:p-8 shadow-card border border-border"
          >
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-card-foreground font-display">{i.walletTitle}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{i.walletDesc}</p>
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
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {!isConnected ? (
                  <Button
                    onClick={() => connectWallet()}
                    disabled={isLoading}
                    className="bg-gradient-mango text-primary-foreground rounded-xl w-full sm:w-auto"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    {isLoading ? "..." : i.connect}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={disconnectWallet}
                    className="rounded-xl border-destructive/20 text-destructive w-full sm:w-auto"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {i.disconnect}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="mt-6">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/readiness") }>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {i.readiness}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
