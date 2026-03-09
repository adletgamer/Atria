import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package, MapPin, User, CheckCircle, Truck, Shield, Barcode, Award, Calendar } from "lucide-react";
import { toast } from "sonner";
import QRGenerator from "@/components/QRGenerator";
import { useLanguage } from "@/hooks/useLanguage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

const txt = {
  es: {
    label: "Trazabilidad",
    title: "Rastrear Lote",
    subtitle: "Busca tu lote de mangos y visualiza su trazabilidad completa",
    searchTitle: "Buscar por ID",
    searchDesc: "Ingresa el código único de tu lote",
    batchId: "ID del Lote",
    placeholder: "Ej: MG-2024-001",
    search: "Buscar Lote",
    searching: "Buscando...",
    tip: "Prueba con ID demo: MG-2024-001",
    batchInfo: "Información del Lote",
    producer: "Productor",
    location: "Ubicación",
    quality: "Calidad",
    network: "Red",
    regDate: "Fecha de Registro",
    txHash: "Hash de Transacción",
    immutable: "Registrado inmutablemente en Polygon Amoy",
    qrCode: "Código QR",
    timeline: "Cadena de Suministro",
    timelineDesc: "Seguimiento del lote desde su origen hasta el consumidor",
    readyTitle: "Listo para Rastrear",
    readyDesc: "Ingresa un ID de lote para comenzar",
    readyTip: "ID demo: MG-2024-001",
    searchingTitle: "Buscando en Blockchain...",
    searchingDesc: "Consultando red Polygon Amoy",
    found: "Lote encontrado",
    notFound: "Lote no encontrado. Prueba con: MG-2024-001",
    steps: [
      { title: "Productor — Piura", descTpl: "Registrado por" },
      { title: "Exportador", desc: "En proceso de exportación" },
      { title: "Supermercado — Lima", desc: "En distribución" },
      { title: "Cliente Final", desc: "Entregado al consumidor" },
    ],
  },
  en: {
    label: "Traceability",
    title: "Track Batch",
    subtitle: "Search for your mango batch and view its complete traceability",
    searchTitle: "Search by ID",
    searchDesc: "Enter the unique code of your mango batch",
    batchId: "Batch ID",
    placeholder: "Ex: MG-2024-001",
    search: "Search Batch",
    searching: "Searching...",
    tip: "Try demo ID: MG-2024-001",
    batchInfo: "Batch Information",
    producer: "Producer",
    location: "Location",
    quality: "Quality",
    network: "Network",
    regDate: "Registration Date",
    txHash: "Transaction Hash",
    immutable: "Immutably recorded on Polygon Amoy",
    qrCode: "QR Code",
    timeline: "Supply Chain",
    timelineDesc: "Track the batch from its origin to the final consumer",
    readyTitle: "Ready to Track",
    readyDesc: "Enter a batch ID to start tracking",
    readyTip: "Demo ID: MG-2024-001",
    searchingTitle: "Searching Blockchain...",
    searchingDesc: "Querying Polygon Amoy network",
    found: "Batch found",
    notFound: "Batch not found. Try: MG-2024-001",
    steps: [
      { title: "Producer — Piura", descTpl: "Registered by" },
      { title: "Exporter", desc: "In export process" },
      { title: "Supermarket — Lima", desc: "In distribution" },
      { title: "Final Customer", desc: "Delivered to consumer" },
    ],
  },
};

const stepIcons = [User, Truck, Package, CheckCircle];

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
    if (!searchValue) { toast.error(i.placeholder); return; }
    setIsSearching(true);

    setTimeout(() => {
      const lotes = JSON.parse(localStorage.getItem("lotes") || "[]");
      const lote = lotes.find((l: any) => l.loteId === searchValue);

      if (lote) {
        setLoteData({
          ...lote,
          steps: i.steps.map((step, idx) => ({
            ...step,
            description: idx === 0 ? `${step.descTpl || step.desc} ${lote.productor}` : step.desc,
            completed: idx === 0,
            current: idx === 1,
            date: idx === 0 ? new Date(lote.timestamp).toLocaleDateString(lang === "es" ? "es-PE" : "en-US") :
              idx === 1 ? new Date(Date.now() + 86400000).toLocaleDateString(lang === "es" ? "es-PE" : "en-US") : undefined,
          })),
        });
        toast.success(i.found);
      } else {
        toast.error(i.notFound);
        setLoteData(null);
      }
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial="hidden" animate="visible" className="text-center mb-14">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">{i.label}</motion.p>
            <motion.h1 custom={1} variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-3">{i.title}</motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground">{i.subtitle}</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Search Panel */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="lg:col-span-1">
              <div className="bg-card rounded-3xl p-8 shadow-card border border-border sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground font-display">{i.searchTitle}</h2>
                    <p className="text-xs text-muted-foreground">{i.searchDesc}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Barcode className="h-3.5 w-3.5 text-primary" />{i.batchId}
                    </Label>
                    <Input placeholder={i.placeholder} value={loteId}
                      onChange={(e) => setLoteId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="rounded-xl border-border bg-background h-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>

                  <Button onClick={() => handleSearch()} disabled={isSearching} size="lg"
                    className="w-full bg-gradient-mango text-primary-foreground font-semibold py-6 rounded-2xl shadow-sm hover:shadow-elevated hover:scale-[1.01] transition-all duration-300">
                    {isSearching ? (
                      <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />{i.searching}</>
                    ) : (
                      <><Search className="mr-2 h-5 w-5" />{i.search}</>
                    )}
                  </Button>

                  <div className="p-3 bg-muted rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground font-medium">💡 {i.tip}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-8">
              {loteData ? (
                <motion.div initial="hidden" animate="visible" className="space-y-8">
                  {/* Batch Info */}
                  <motion.div custom={0} variants={fadeUp} className="bg-card rounded-3xl p-8 shadow-card border border-border">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                        <Package className="h-5 w-5 text-secondary" />
                      </div>
                      <h2 className="text-xl font-bold text-card-foreground font-display">{i.batchInfo}</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { icon: Barcode, label: i.batchId, value: loteData.loteId, color: "text-primary" },
                        { icon: User, label: i.producer, value: loteData.productor, color: "text-primary" },
                        { icon: MapPin, label: i.location, value: loteData.ubicacion, color: "text-primary" },
                        { icon: Award, label: i.quality, value: loteData.calidad, color: "text-accent" },
                        { icon: Shield, label: i.network, value: loteData.network, color: "text-secondary" },
                        { icon: Calendar, label: i.regDate, value: new Date(loteData.timestamp).toLocaleDateString(lang === "es" ? "es-PE" : "en-US", { year: "numeric", month: "short", day: "numeric" }), color: "text-muted-foreground" },
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

                    {/* Tx Hash + QR */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 p-4 bg-primary/5 border border-primary/15 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">{i.txHash}</span>
                        </div>
                        <p className="font-mono text-[11px] break-all bg-background p-3 rounded-xl border border-border text-muted-foreground">{loteData.hash}</p>
                        <p className="text-[11px] text-primary mt-2 font-medium">🔒 {i.immutable}</p>
                      </div>
                      <div className="flex-shrink-0 bg-background p-4 rounded-2xl border border-border flex flex-col items-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{i.qrCode}</p>
                        <QRGenerator batchId={loteData.loteId} size={100} />
                      </div>
                    </div>
                  </motion.div>

                  {/* Timeline */}
                  <motion.div custom={1} variants={fadeUp} className="bg-card rounded-3xl p-8 shadow-card border border-border">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-card-foreground font-display">{i.timeline}</h2>
                        <p className="text-xs text-muted-foreground">{i.timelineDesc}</p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-6">
                        {loteData.steps.map((step: any, index: number) => {
                          const Icon = stepIcons[index];
                          return (
                            <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.15 }}
                              className="flex gap-5 relative">
                              <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border-2 border-card flex-shrink-0 transition-all ${
                                step.completed ? "bg-gradient-earth" : step.current ? "bg-gradient-mango animate-pulse-glow" : "bg-muted"
                              }`}>
                                <Icon className={`h-5 w-5 ${step.completed || step.current ? "text-primary-foreground" : "text-muted-foreground"}`} />
                              </div>
                              <div className={`flex-1 p-5 rounded-2xl border transition-all ${
                                step.completed ? "bg-secondary/5 border-secondary/20" : step.current ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted border-border"
                              }`}>
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className={`font-bold font-display ${step.completed ? "text-secondary" : step.current ? "text-primary" : "text-muted-foreground"}`}>
                                    {step.title}
                                  </h4>
                                  {step.date && (
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                                      step.completed ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary"
                                    }`}>{step.date}</span>
                                  )}
                                </div>
                                <p className={`text-sm ${step.completed ? "text-secondary/80" : step.current ? "text-primary/80" : "text-muted-foreground"}`}>
                                  {step.description}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
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
      </div>
    </div>
  );
};

export default Rastrear;
