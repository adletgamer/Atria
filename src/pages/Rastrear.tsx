import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package, MapPin, User, CheckCircle, Truck, Shield, Barcode, Award, Calendar, ArrowRight, Leaf, Store, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import QRGenerator from "@/components/QRGenerator";
import { useLanguage } from "@/hooks/useLanguage";
import { lotService } from "@/services/lotService";
import { trackingService } from "@/services/trackingService";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

const txt = {
  es: {
    label: "Trazabilidad",
    title: "Rastrear Lote",
    subtitle: "Busca tu lote de mangos y visualiza su cadena de suministro completa",
    searchTitle: "Buscar por ID",
    searchDesc: "Ingresa el código único de tu lote",
    batchId: "ID del Lote",
    placeholder: "Ej: MG-2025-001",
    search: "Buscar Lote",
    searching: "Buscando...",
    tip: "Prueba con ID demo: MG-2025-001",
    batchInfo: "Información del Lote",
    producer: "Productor",
    location: "Ubicación",
    variety: "Variedad",
    quality: "Calidad",
    weight: "Peso Total",
    price: "Precio/Kg",
    regDate: "Fecha de Registro",
    txHash: "Hash de Transacción",
    immutable: "Registrado inmutablemente en Polygon Amoy",
    qrCode: "Código QR",
    supplyChain: "Cadena de Suministro",
    supplyChainDesc: "Seguimiento visual del lote desde su origen",
    readyTitle: "Listo para Rastrear",
    readyDesc: "Ingresa un ID de lote para comenzar",
    readyTip: "ID demo: MG-2025-001",
    searchingTitle: "Buscando en Blockchain...",
    searchingDesc: "Consultando red Polygon Amoy",
    found: "Lote encontrado",
    notFound: "Lote no encontrado. Prueba con: MG-2025-001",
    steps: [
      { title: "Productor", subtitle: "Finca de Origen", descTpl: "Registrado por" },
      { title: "Exportador", subtitle: "Proceso de Exportación", desc: "En clasificación y empaque" },
      { title: "Distribución", subtitle: "Centro Logístico", desc: "En transporte internacional" },
      { title: "Cliente Final", subtitle: "Punto de Venta", desc: "Disponible para consumo" },
    ],
  },
  en: {
    label: "Traceability",
    title: "Track Batch",
    subtitle: "Search for your mango batch and view its complete supply chain",
    searchTitle: "Search by ID",
    searchDesc: "Enter the unique code of your mango batch",
    batchId: "Batch ID",
    placeholder: "Ex: MG-2025-001",
    search: "Search Batch",
    searching: "Searching...",
    tip: "Try demo ID: MG-2025-001",
    batchInfo: "Batch Information",
    producer: "Producer",
    location: "Location",
    variety: "Variety",
    quality: "Quality",
    weight: "Total Weight",
    price: "Price/Kg",
    regDate: "Registration Date",
    txHash: "Transaction Hash",
    immutable: "Immutably recorded on Polygon Amoy",
    qrCode: "QR Code",
    supplyChain: "Supply Chain",
    supplyChainDesc: "Visual tracking of the batch from its origin",
    readyTitle: "Ready to Track",
    readyDesc: "Enter a batch ID to start tracking",
    readyTip: "Demo ID: MG-2025-001",
    searchingTitle: "Searching Blockchain...",
    searchingDesc: "Querying Polygon Amoy network",
    found: "Batch found",
    notFound: "Batch not found. Try: MG-2025-001",
    steps: [
      { title: "Producer", subtitle: "Origin Farm", descTpl: "Registered by" },
      { title: "Exporter", subtitle: "Export Process", desc: "Classification & packing" },
      { title: "Distribution", subtitle: "Logistics Hub", desc: "International transport" },
      { title: "Final Customer", subtitle: "Point of Sale", desc: "Available for consumption" },
    ],
  },
};

const stepIcons = [Leaf, Truck, Store, ShoppingBag];
const stepGradients = ["bg-gradient-earth", "bg-gradient-mango", "bg-primary", "bg-secondary"];

const Rastrear = () => {
  const [searchParams] = useSearchParams();
  const [loteId, setLoteId] = useState("");
  const [loteData, setLoteData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { lang } = useLanguage();
  const i = txt[lang];

  useEffect(() => {
    const initialLote = searchParams.get("lote");
    if (initialLote) { setLoteId(initialLote); handleSearch(initialLote); }
  }, []);

  const handleSearch = async (searchId?: string) => {
    const searchValue = searchId || loteId;
    
    // VALIDACIÓN: Entrada no vacía
    if (!searchValue) {
      toast.error(i.placeholder);
      return;
    }

    setIsSearching(true);
    try {
      // PASO 1: Obtener lote completo desde DB
      const lotResult = await lotService.getLotByLotId(searchValue);
      
      if (!lotResult.success || !lotResult.data) {
        toast.error(i.notFound);
        setLoteData(null);
        return;
      }

      const lotData = lotResult.data;

      // PASO 2: Obtener timeline de eventos
      const timelineResult = await trackingService.getLotTimeline(searchValue);
      const events = timelineResult.success ? timelineResult.data : [];

      // PASO 3: Construir pasos desde eventos reales
      const createdDate = lotData.created_at;
      const steps = i.steps.map((step, idx) => ({
        ...step,
        description: idx === 0 
          ? `${step.descTpl || step.desc} ${lotData.producer_name || "Desconocido"}` 
          : step.desc,
        completed: idx === 0, // Solo el primer paso (creación) está completado
        current: idx === 0,
        date: idx === 0
          ? new Date(createdDate).toLocaleDateString(lang === "es" ? "es-PE" : "en-US", { month: "short", day: "numeric" })
          : undefined,
      }));

      // PASO 4: Preparar datos para mostrar
      setLoteData({
        ...lotData,
        steps,
        events, // Incluir eventos para referencia
      });

      toast.success(i.found);
    } catch (error) {
      console.error("Error en handleSearch:", error);
      toast.error(i.notFound);
      setLoteData(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div initial="hidden" animate="visible" className="text-center mb-14">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">{i.label}</motion.p>
            <motion.h1 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-3">{i.title}</motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">{i.subtitle}</motion.p>
          </motion.div>

          {/* Search Bar - Full Width */}
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-10">
            <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-card border border-border">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Barcode className="h-3.5 w-3.5 text-primary" />{i.batchId}
                  </Label>
                  <Input placeholder={i.placeholder} value={loteId}
                    onChange={(e) => setLoteId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="rounded-xl border-border bg-background h-12 text-base" />
                </div>
                <Button onClick={() => handleSearch()} disabled={isSearching} size="lg"
                  className="bg-gradient-mango text-primary-foreground font-semibold py-6 px-8 rounded-2xl shadow-sm hover:shadow-elevated hover:scale-[1.01] transition-all duration-300 sm:w-auto w-full">
                  {isSearching ? (
                    <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />{i.searching}</>
                  ) : (
                    <><Search className="mr-2 h-5 w-5" />{i.search}</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">💡 {i.tip}</p>
            </div>
          </motion.div>

          {/* Results */}
          {loteData ? (
            <motion.div initial="hidden" animate="visible" className="space-y-8">
              {/* Supply Chain Visual Flow */}
              <motion.div custom={0} variants={fadeUp} className="bg-card rounded-3xl p-8 shadow-card border border-border">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-card-foreground font-display">{i.supplyChain}</h2>
                    <p className="text-xs text-muted-foreground">{i.supplyChainDesc}</p>
                  </div>
                </div>

                {/* Horizontal Flow - Desktop */}
                <div className="hidden md:block">
                  <div className="relative flex items-start justify-between">
                    {/* Connection Line */}
                    <div className="absolute top-7 left-[calc(12.5%)] right-[calc(12.5%)] h-1 bg-border rounded-full z-0">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((loteData.steps.filter((s: any) => s.completed).length - 1) / (loteData.steps.length - 1)) * 100}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full bg-gradient-mango rounded-full"
                      />
                    </div>

                    {loteData.steps.map((step: any, index: number) => {
                      const Icon = stepIcons[index];
                      return (
                        <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.2 + 0.3 }}
                          className="flex flex-col items-center text-center w-1/4 relative z-10">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-4 border-card transition-all ${
                            step.completed ? stepGradients[index] : step.current ? "bg-gradient-mango animate-pulse" : "bg-muted"
                          }`}>
                            <Icon className={`h-6 w-6 ${step.completed || step.current ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </div>
                          <div className="mt-4 space-y-1">
                            <h4 className={`text-sm font-bold font-display ${
                              step.completed ? "text-foreground" : step.current ? "text-primary" : "text-muted-foreground"
                            }`}>{step.title}</h4>
                            <p className="text-[11px] text-muted-foreground">{step.subtitle}</p>
                            {step.date && (
                              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                                step.completed ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary"
                              }`}>{step.date}</span>
                            )}
                          </div>
                          {step.completed && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.2 + 0.6 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle className="h-3.5 w-3.5 text-secondary-foreground" />
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Vertical Flow - Mobile */}
                <div className="md:hidden">
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-6">
                      {loteData.steps.map((step: any, index: number) => {
                        const Icon = stepIcons[index];
                        return (
                          <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.15 }} className="flex gap-4 relative">
                            <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border-2 border-card flex-shrink-0 ${
                              step.completed ? stepGradients[index] : step.current ? "bg-gradient-mango animate-pulse" : "bg-muted"
                            }`}>
                              <Icon className={`h-5 w-5 ${step.completed || step.current ? "text-primary-foreground" : "text-muted-foreground"}`} />
                            </div>
                            <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                              step.completed ? "bg-secondary/5 border-secondary/20" : step.current ? "bg-primary/5 border-primary/20" : "bg-muted border-border"
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className={`font-bold text-sm ${step.completed ? "text-foreground" : step.current ? "text-primary" : "text-muted-foreground"}`}>
                                    {step.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">{step.description}</p>
                                </div>
                                {step.date && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    step.completed ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary"
                                  }`}>{step.date}</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Batch Info Grid + QR */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div custom={1} variants={fadeUp} className="lg:col-span-2 bg-card rounded-3xl p-8 shadow-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                      <Package className="h-5 w-5 text-secondary" />
                    </div>
                    <h2 className="text-xl font-bold text-card-foreground font-display">{i.batchInfo}</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { icon: Barcode, label: i.batchId, value: loteData.batch_id, color: "text-primary" },
                      { icon: User, label: i.producer, value: loteData.producer_name, color: "text-primary" },
                      { icon: MapPin, label: i.location, value: loteData.location, color: "text-primary" },
                      { icon: Leaf, label: i.variety, value: loteData.variety, color: "text-secondary" },
                      { icon: Award, label: i.quality, value: loteData.quality, color: "text-accent-foreground" },
                      { icon: Package, label: i.weight, value: loteData.total_kg ? `${loteData.total_kg} kg` : "—", color: "text-muted-foreground" },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-muted rounded-2xl border border-border">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</span>
                        </div>
                        <p className="text-sm font-bold text-card-foreground truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tx Hash */}
                  {loteData.transaction_hash && (
                    <div className="mt-6 p-4 bg-primary/5 border border-primary/15 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">{i.txHash}</span>
                      </div>
                      <p className="font-mono text-[11px] break-all bg-background p-3 rounded-xl border border-border text-muted-foreground">
                        {loteData.transaction_hash || loteData.hash}
                      </p>
                      <p className="text-[11px] text-primary mt-2 font-medium">🔒 {i.immutable}</p>
                    </div>
                  )}
                </motion.div>

                {/* QR Code */}
                <motion.div custom={2} variants={fadeUp} className="bg-card rounded-3xl p-8 shadow-card border border-border flex flex-col items-center justify-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">{i.qrCode}</p>
                  <div className="bg-background p-6 rounded-2xl border border-border shadow-sm">
                    <QRGenerator batchId={loteData.batch_id} size={180} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center font-medium">{loteData.batch_id}</p>
                </motion.div>
              </div>
            </motion.div>
          ) : isSearching ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card rounded-3xl p-16 shadow-card border border-border text-center">
              <div className="w-14 h-14 mx-auto bg-gradient-mango rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary-foreground border-t-transparent" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground font-display mb-2">{i.searchingTitle}</h3>
              <p className="text-muted-foreground">{i.searchingDesc}</p>
            </motion.div>
          ) : (
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="bg-card rounded-3xl p-16 shadow-card border border-border text-center">
              <div className="w-14 h-14 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-6">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground font-display mb-2">{i.readyTitle}</h3>
              <p className="text-muted-foreground mb-1">{i.readyDesc}</p>
              <p className="text-xs text-muted-foreground">{i.readyTip}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rastrear;
