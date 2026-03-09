import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Wallet, MapPin, User, Barcode, Shield, Zap, CheckCircle, ArrowRight, Gem, Star, Award, Leaf, DollarSign, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import QRGenerator from "@/components/QRGenerator";
import { VARIETY_OPTIONS, getVarietyById } from "@/constants/mangoVarieties";
import { saveBatchToDatabase } from "@/services/batchService";
import type { BatchRecord } from "@/services/batchService";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

const t = {
  es: {
    title: "Registrar Lote",
    subtitle: "Registra tu lote de mangos en la blockchain",
    formTitle: "Formulario de Registro",
    formDesc: "Completa todos los campos para registrar tu lote",
    batchId: "ID del Lote",
    batchIdPlaceholder: "Ej: MG-2025-001",
    producer: "Nombre del Productor",
    producerPlaceholder: "Nombre del productor",
    location: "Ubicación",
    variety: "Variedad de Mango",
    varietyPlaceholder: "Selecciona una variedad",
    quality: "Grado de Calidad",
    qualityPlaceholder: "Selecciona calidad",
    premium: "Premium",
    export: "Exportación",
    first: "Primera Clase",
    second: "Segunda Clase",
    totalKg: "Peso Total (kg)",
    totalKgPlaceholder: "Ej: 500",
    pricePerKg: "Precio por Kg (USD)",
    pricePerKgPlaceholder: "Ej: 2.80",
    listOnMarketplace: "Listar en Marketplace",
    listOnMarketplaceDesc: "Hacer visible para compradores",
    connectWallet: "Conectar Wallet",
    register: "Registrar Lote",
    registering: "Registrando...",
    walletTitle: "Wallet No Conectada",
    walletDesc: "Conecta tu wallet MetaMask para registrar lotes en Polygon Amoy Testnet",
    requiredNet: "Red Requerida: Polygon Amoy Testnet (Chain ID: 80002)",
    connected: "Wallet Conectada",
    success: "¡Registro Exitoso!",
    successDesc: "Tu lote ha sido registrado y guardado en la base de datos",
    registeredVar: "Variedad Registrada",
    trackBatch: "Rastrear Lote",
    registerAnother: "Registrar Otro",
    goMarketplace: "Ver en Marketplace",
    note: "Nota",
    noteMsg: "El lote se guardará en la base de datos y estará disponible en el Dashboard.",
    network: "Red",
    fillAll: "Completa todos los campos obligatorios",
    selectVar: "Selecciona una variedad",
    errorReg: "Error al registrar el lote",
    loginRequired: "Inicia sesión para registrar lotes",
    loginBtn: "Iniciar Sesión",
  },
  en: {
    title: "Register Batch",
    subtitle: "Register your mango batch on the blockchain",
    formTitle: "Registration Form",
    formDesc: "Complete all fields to register your batch",
    batchId: "Batch ID",
    batchIdPlaceholder: "Ex: MG-2025-001",
    producer: "Producer Name",
    producerPlaceholder: "Producer name",
    location: "Location",
    variety: "Mango Variety",
    varietyPlaceholder: "Select a variety",
    quality: "Quality Grade",
    qualityPlaceholder: "Select quality",
    premium: "Premium",
    export: "Export",
    first: "First Grade",
    second: "Second Grade",
    totalKg: "Total Weight (kg)",
    totalKgPlaceholder: "Ex: 500",
    pricePerKg: "Price per Kg (USD)",
    pricePerKgPlaceholder: "Ex: 2.80",
    listOnMarketplace: "List on Marketplace",
    listOnMarketplaceDesc: "Make visible to buyers",
    connectWallet: "Connect Wallet",
    register: "Register Batch",
    registering: "Registering...",
    walletTitle: "Wallet Not Connected",
    walletDesc: "Connect your MetaMask wallet to register batches on Polygon Amoy Testnet",
    requiredNet: "Required: Polygon Amoy Testnet (Chain ID: 80002)",
    connected: "Wallet Connected",
    success: "Registration Successful!",
    successDesc: "Your batch has been registered and saved to the database",
    registeredVar: "Registered Variety",
    trackBatch: "Track Batch",
    registerAnother: "Register Another",
    goMarketplace: "View on Marketplace",
    note: "Note",
    noteMsg: "The batch will be saved to the database and available on the Dashboard.",
    network: "Network",
    fillAll: "Please complete all required fields",
    selectVar: "Please select a variety",
    errorReg: "Error registering batch",
    loginRequired: "Log in to register batches",
    loginBtn: "Log In",
  },
};

const Registrar = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { isConnected, connectWallet, formatAddress, account } = useMetaMask();
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const i = t[lang];

  const [formData, setFormData] = useState({
    loteId: "",
    productor: "",
    ubicacion: "Piura",
    variedad: "",
    calidad: "",
    totalKg: "",
    pricePerKg: "",
    isListed: false,
  });

  // Pre-fill producer name from profile
  useState(() => {
    if (profile?.full_name && !formData.productor) {
      setFormData((prev) => ({ ...prev, productor: profile.full_name }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error(i.loginRequired); return; }
    if (!isConnected) { toast.error(i.walletTitle); return; }
    if (!formData.loteId || !formData.productor || !formData.calidad || !formData.variedad) {
      toast.error(i.fillAll); return;
    }
    const varietyInfo = getVarietyById(formData.variedad);
    if (!varietyInfo) { toast.error(i.selectVar); return; }

    setIsLoading(true);
    try {
      const mockHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      const batchData: BatchRecord = {
        batch_id: formData.loteId,
        producer_name: formData.productor,
        location: formData.ubicacion,
        variety: varietyInfo.name,
        quality: formData.calidad,
        transaction_hash: mockHash,
        wallet_address: account || undefined,
        total_kg: formData.totalKg ? parseFloat(formData.totalKg) : undefined,
        price_per_kg: formData.pricePerKg ? parseFloat(formData.pricePerKg) : undefined,
        is_listed: formData.isListed,
        metadata: {
          varietyId: formData.variedad,
          timestamp: new Date().toISOString(),
          network: "Polygon Amoy",
          emoji: varietyInfo.emoji,
        },
      };

      const result = await saveBatchToDatabase(batchData);
      if (result.success) {
        toast.success(i.success);
        setRegistrationSuccess(true);
      }
    } catch {
      toast.error(i.errorReg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRegistrationSuccess(false);
    setFormData({ loteId: "", productor: profile?.full_name || "", ubicacion: "Piura", variedad: "", calidad: "", totalKg: "", pricePerKg: "", isListed: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div initial="hidden" animate="visible" className="text-center mb-14">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Blockchain</motion.p>
            <motion.h1 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-3">{i.title}</motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground">{i.subtitle}</motion.p>
          </motion.div>

          {registrationSuccess ? (
            /* Success State */
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
              className="bg-card rounded-3xl p-10 shadow-card border border-secondary/20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-earth rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground font-display">{i.success}</h2>
                  <p className="text-muted-foreground">{i.successDesc}</p>
                </div>
              </div>

              {formData.variedad && getVarietyById(formData.variedad) && (
                <div className="p-5 bg-muted rounded-2xl border border-border mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{i.registeredVar}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{getVarietyById(formData.variedad)?.emoji}</span>
                    <div>
                      <p className="font-bold text-card-foreground">{getVarietyById(formData.variedad)?.name}</p>
                      <p className="text-sm text-muted-foreground">{getVarietyById(formData.variedad)?.description}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5 bg-muted rounded-2xl border border-border mb-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">QR Code</p>
                <QRGenerator batchId={formData.loteId} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate(`/rastrear?lote=${formData.loteId}`)} className="flex-1 bg-gradient-earth text-primary-foreground font-semibold py-6 rounded-2xl shadow-sm hover:shadow-elevated hover:scale-[1.02] transition-all duration-300">
                  <ArrowRight className="mr-2 h-5 w-5" />{i.trackBatch}
                </Button>
                {formData.isListed && (
                  <Button onClick={() => navigate("/marketplace")} variant="outline" className="flex-1 border-border font-semibold py-6 rounded-2xl hover:bg-muted transition-all duration-300">
                    <DollarSign className="mr-2 h-5 w-5" />{i.goMarketplace}
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" className="flex-1 border-border font-semibold py-6 rounded-2xl hover:bg-muted transition-all duration-300">
                  {i.registerAnother}
                </Button>
              </div>
            </motion.div>
          ) : !user ? (
            /* Not Logged In */
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
              className="bg-card rounded-3xl p-10 shadow-card border border-border text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-card-foreground font-display mb-3">{i.loginRequired}</h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">{i.subtitle}</p>
              <Button onClick={() => navigate("/login")} className="bg-gradient-mango text-primary-foreground font-semibold px-8 py-6 rounded-2xl shadow-sm hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-base">
                <ArrowRight className="mr-2 h-5 w-5" />{i.loginBtn}
              </Button>
            </motion.div>
          ) : !isConnected ? (
            /* Wallet Not Connected */
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
              className="bg-card rounded-3xl p-10 shadow-card border border-border text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-card-foreground font-display mb-3">{i.walletTitle}</h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">{i.walletDesc}</p>
              <Button onClick={() => connectWallet()} className="bg-gradient-mango text-primary-foreground font-semibold px-8 py-6 rounded-2xl shadow-sm hover:shadow-elevated hover:scale-[1.02] transition-all duration-300 text-base">
                <Wallet className="mr-2 h-5 w-5" />{i.connectWallet}
              </Button>
              <div className="mt-6 p-4 bg-muted rounded-2xl border border-border">
                <p className="text-sm text-muted-foreground font-medium">{i.requiredNet}</p>
              </div>
            </motion.div>
          ) : (
            /* Registration Form */
            <motion.div initial="hidden" animate="visible">
              {/* Connected Badge */}
              <motion.div custom={0} variants={fadeUp} className="mb-8 p-4 bg-secondary/5 border border-secondary/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-secondary">{i.connected}</span>
                  <span className="font-mono text-xs text-muted-foreground">{formatAddress(account)}</span>
                </div>
                <span className="text-xs text-muted-foreground">Polygon Amoy</span>
              </motion.div>

              {/* Form Card */}
              <motion.div custom={1} variants={fadeUp} className="bg-card rounded-3xl p-8 sm:p-10 shadow-card border border-border">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-mango rounded-2xl flex items-center justify-center shadow-lg">
                    <Shield className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-card-foreground font-display">{i.formTitle}</h2>
                    <p className="text-sm text-muted-foreground">{i.formDesc}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Batch ID */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-primary" />{i.batchId} *
                    </Label>
                    <Input placeholder={i.batchIdPlaceholder} value={formData.loteId}
                      onChange={(e) => setFormData({ ...formData, loteId: e.target.value })}
                      className="rounded-xl border-border bg-background h-12 text-base" required />
                  </div>

                  {/* Producer */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />{i.producer} *
                    </Label>
                    <Input placeholder={i.producerPlaceholder} value={formData.productor}
                      onChange={(e) => setFormData({ ...formData, productor: e.target.value })}
                      className="rounded-xl border-border bg-background h-12 text-base" required />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Location */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />{i.location}
                      </Label>
                      <Select value={formData.ubicacion} onValueChange={(v) => setFormData({ ...formData, ubicacion: v })}>
                        <SelectTrigger className="rounded-xl border-border bg-background h-12"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          <SelectItem value="Piura">Piura</SelectItem>
                          <SelectItem value="Lambayeque">Lambayeque</SelectItem>
                          <SelectItem value="Ica">Ica</SelectItem>
                          <SelectItem value="La Libertad">La Libertad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quality */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Gem className="h-4 w-4 text-primary" />{i.quality} *
                      </Label>
                      <Select value={formData.calidad} onValueChange={(v) => setFormData({ ...formData, calidad: v })}>
                        <SelectTrigger className="rounded-xl border-border bg-background h-12"><SelectValue placeholder={i.qualityPlaceholder} /></SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          <SelectItem value="Premium"><div className="flex items-center gap-2"><Star className="h-4 w-4 text-accent" />{i.premium}</div></SelectItem>
                          <SelectItem value="Exportación"><div className="flex items-center gap-2"><Gem className="h-4 w-4 text-secondary" />{i.export}</div></SelectItem>
                          <SelectItem value="Primera"><div className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" />{i.first}</div></SelectItem>
                          <SelectItem value="Segunda"><div className="flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" />{i.second}</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Variety */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-secondary" />{i.variety} *
                    </Label>
                    <Select value={formData.variedad} onValueChange={(v) => setFormData({ ...formData, variedad: v })}>
                      <SelectTrigger className="rounded-xl border-border bg-background h-12"><SelectValue placeholder={i.varietyPlaceholder} /></SelectTrigger>
                      <SelectContent className="rounded-xl border-border max-h-80">
                        {VARIETY_OPTIONS.map((v) => (
                          <SelectItem key={v.value} value={v.value}>
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{v.emoji}</span>
                              <div>
                                <p className="font-semibold">{v.label}</p>
                                <p className="text-xs text-muted-foreground">{v.description}</p>
                              </div>
                              {v.exportable && <span className="text-[10px] font-bold uppercase text-secondary ml-auto">Export</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formData.variedad && getVarietyById(formData.variedad) && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-secondary/5 border border-secondary/20 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">{getVarietyById(formData.variedad)?.emoji}</span>
                        <div>
                          <p className="font-semibold text-card-foreground text-sm">{getVarietyById(formData.variedad)?.name}</p>
                          <p className="text-xs text-muted-foreground">{getVarietyById(formData.variedad)?.description}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Weight & Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />{i.totalKg}
                      </Label>
                      <Input type="number" step="0.1" min="0" placeholder={i.totalKgPlaceholder} value={formData.totalKg}
                        onChange={(e) => setFormData({ ...formData, totalKg: e.target.value })}
                        className="rounded-xl border-border bg-background h-12 text-base" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-secondary" />{i.pricePerKg}
                      </Label>
                      <Input type="number" step="0.01" min="0" placeholder={i.pricePerKgPlaceholder} value={formData.pricePerKg}
                        onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                        className="rounded-xl border-border bg-background h-12 text-base" />
                    </div>
                  </div>

                  {/* List on Marketplace toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{i.listOnMarketplace}</p>
                        <p className="text-xs text-muted-foreground">{i.listOnMarketplaceDesc}</p>
                      </div>
                    </div>
                    <Switch checked={formData.isListed} onCheckedChange={(v) => setFormData({ ...formData, isListed: v })} />
                  </div>

                  {/* Submit */}
                  <Button type="submit" disabled={isLoading} size="lg"
                    className="w-full bg-gradient-mango text-primary-foreground font-semibold py-6 rounded-2xl shadow-sm hover:shadow-elevated hover:scale-[1.01] transition-all duration-300 text-base mt-4">
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{i.registering}</>
                    ) : (
                      <><Zap className="mr-2 h-5 w-5" />{i.register}</>
                    )}
                  </Button>
                </form>
              </motion.div>

              {/* Note */}
              <motion.div custom={2} variants={fadeUp} className="mt-6 p-5 bg-muted rounded-2xl border border-border">
                <p className="text-sm text-muted-foreground"><strong>{i.note}:</strong> {i.noteMsg}</p>
                <p className="text-xs text-muted-foreground mt-2"><strong>{i.network}:</strong> Polygon Amoy Testnet (Chain ID: 80002)</p>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registrar;
