import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Package, TrendingUp, Users, MapPin, ArrowUpRight, DollarSign,
  Shield, ShieldCheck, Calendar, Leaf, Award, Truck, BarChart3, Activity,
  ExternalLink, Loader2,
} from "lucide-react";
import peruMap from "@/assets/peru-map.png";
import { dashboardService } from "@/services/dashboardService";
import type { AnchoringStats } from "@/services/dashboardService";
import { getTopicHashScanUrl, isHederaConfigured } from "@/config/hedera";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

const txt = {
  es: {
    label: "Panel de Control",
    title: "Overview",
    subtitle: "Vista operacional de consignaciones, evidencia y readiness",
    batches: "Consignaciones",
    batchesDesc: "Casos registrados",
    producers: "Actores Activos",
    producersDesc: "Participantes con actividad",
    orders: "Verificaciones",
    ordersDesc: "Eventos de verificación",
    regions: "Regiones",
    regionsDesc: "Zonas activas",
    registerNew: "Nueva Consignación",
    marketplace: "Readiness",
    recentTitle: "Evidencia Reciente",
    recentDesc: "Últimos registros auditables",
    mapTitle: "Mapa de Producción",
    mapDesc: "Principales regiones productoras de mango en Perú",
    qualityTitle: "Distribución de Estado",
    qualityDesc: "Porcentaje por estado operativo",
    networkTitle: "Estado de Red",
    noBatches: "Sin registros recientes",
    noBatchesDesc: "Comienza cargando evidencia en consignaciones",
    registerFirst: "Ir a Consignaciones",
    viewAll: "Ver Todos",
    highProd: "Alta Producción",
    medProd: "Media Producción",
    welcome: "Bienvenido",
    totalKg: "Evidence Completeness",
    avgPrice: "Custody Continuity",
  },
  en: {
    label: "Control Panel",
    title: "Overview",
    subtitle: "Operational view of consignments, evidence and readiness",
    batches: "Consignments",
    batchesDesc: "Registered cases",
    producers: "Active Actors",
    producersDesc: "Participants with activity",
    orders: "Verifications",
    ordersDesc: "Verification events",
    regions: "Regions",
    regionsDesc: "Active zones",
    registerNew: "New Consignment",
    marketplace: "Readiness",
    recentTitle: "Recent Evidence",
    recentDesc: "Latest auditable records",
    mapTitle: "Production Map",
    mapDesc: "Main mango producing regions in Peru",
    qualityTitle: "State Distribution",
    qualityDesc: "Percentage by operational state",
    networkTitle: "Network Status",
    noBatches: "No recent records",
    noBatchesDesc: "Start by adding evidence to consignments",
    registerFirst: "Go to Consignments",
    viewAll: "View All",
    highProd: "High Production",
    medProd: "Medium Production",
    welcome: "Welcome",
    totalKg: "Evidence Completeness",
    avgPrice: "Custody Continuity",
  },
};


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const i = txt[lang];

  const [batches, setBatches] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBatches: 0, producers: 0, orders: 0, regions: 0, totalKg: 0, avgPrice: 0, evidenceCompleteness: 0, custodyContinuity: 0 });
  const [qualityDistribution, setQualityDistribution] = useState<any[]>([]);
  const [locationDistribution, setLocationDistribution] = useState<any[]>([]);
  const [anchoringStats, setAnchoringStats] = useState<AnchoringStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        // PASO 1: Obtener estadísticas generales
        const statsResult = await dashboardService.getDashboardStats();
        if (statsResult.success && statsResult.data) {
          setStats({
            totalBatches: statsResult.data.total_lots || 0,
            producers: statsResult.data.total_producers || 0,
            orders: statsResult.data.total_verifications || 0,
            regions: 4,
            totalKg: statsResult.data.total_kg || 0,
            avgPrice: Math.round((statsResult.data.avg_price || 0) * 100) / 100,
            evidenceCompleteness: statsResult.data.evidence_completeness || 0,
            custodyContinuity: statsResult.data.custody_continuity || 0,
          });
        }

        // PASO 2: Obtener lotes recientes
        const recentResult = await dashboardService.getRecentLots(6);
        if (recentResult.success && recentResult.data) {
          setBatches(recentResult.data);
        }

        // PASO 3: Obtener distribución de calidad
        const qualityResult = await dashboardService.getQualityDistribution();
        if (qualityResult.success && qualityResult.data) {
          setQualityDistribution(qualityResult.data);
        }

        // PASO 4: Obtener distribución de ubicación
        const locationResult = await dashboardService.getLocationDistribution();
        if (locationResult.success && locationResult.data) {
          setLocationDistribution(locationResult.data);
        }

        // PASO 5: Obtener stats de anclaje Hedera
        const anchorResult = await dashboardService.getAnchoringStats();
        if (anchorResult.success && anchorResult.data) {
          setAnchoringStats(anchorResult.data);
        }
      } catch (error) {
        console.error("Error cargando dashboard:", error);
        toast.error("Error al cargar datos del dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const qualityColors: Record<string, string> = {
    Premium: "bg-secondary",
    Exportación: "bg-primary",
    Primera: "bg-accent",
    Segunda: "bg-muted-foreground",
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    registered: { label: lang === "es" ? "Registrado" : "Registered", class: "bg-primary/10 text-primary border-primary/20" },
    in_transit: { label: lang === "es" ? "En tránsito" : "In Transit", class: "bg-accent/10 text-accent-foreground border-accent/20" },
    delivered: { label: lang === "es" ? "Entregado" : "Delivered", class: "bg-secondary/10 text-secondary border-secondary/20" },
  };

  const statsData = [
    { title: i.batches, value: stats.totalBatches, desc: i.batchesDesc, icon: Package, gradient: "bg-gradient-mango" },
    { title: i.producers, value: stats.producers, desc: i.producersDesc, icon: Users, gradient: "bg-gradient-earth" },
    { title: i.totalKg, value: `${stats.evidenceCompleteness}%`, desc: "target ≥ 80%", icon: Shield, gradient: "bg-gradient-mango" },
    { title: i.avgPrice, value: `${stats.custodyContinuity}%`, desc: "target ≥ 70%", icon: Activity, gradient: "bg-gradient-earth" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial="hidden" animate="visible" className="mb-10">
            <motion.div custom={0} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-mango rounded-2xl flex items-center justify-center shadow-elevated">
                  <BarChart3 className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-0.5">{i.label}</p>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground font-display">
                    {i.welcome}, <span className="text-gradient-mango">{profile?.full_name || user?.email?.split("@")[0] || "Usuario"}</span>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{i.subtitle}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/consignments")} size="sm" className="bg-gradient-mango text-primary-foreground font-semibold rounded-xl shadow-sm hover:shadow-elevated hover:scale-[1.02] transition-all text-xs h-9">
                  <Package className="mr-1.5 h-3.5 w-3.5" />{i.registerNew}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/consignments")} className="rounded-xl border-border font-semibold hover:bg-muted transition-all text-xs h-9">
                  <DollarSign className="mr-1.5 h-3.5 w-3.5" />{i.marketplace}
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
            {statsData.map((stat, idx) => (
              <motion.div key={stat.title} custom={idx} variants={fadeUp}
                className="bg-card rounded-2xl p-5 shadow-card border border-border hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.gradient} rounded-xl flex items-center justify-center shadow-sm`}>
                    <stat.icon className="h-4.5 w-4.5 text-primary-foreground" />
                  </div>
                  <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-display leading-none">{stat.value}</p>
                <p className="text-xs font-semibold text-foreground mt-1.5">{stat.title}</p>
                <p className="text-[11px] text-muted-foreground">{stat.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Batches */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="lg:col-span-2">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-card-foreground font-display">{i.recentTitle}</h2>
                      <p className="text-[11px] text-muted-foreground">{i.recentDesc}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/consignments")} className="text-primary font-semibold text-xs h-8">
                    {i.viewAll}<ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>

                {batches.length > 0 ? (
                  <div className="space-y-2">
                    {batches.slice(0, 5).map((batch, idx) => {
                      const status = statusLabels[batch.status] || statusLabels.registered;
                      return (
                        <motion.div key={batch.lot_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                          onClick={() => navigate(`/verify-pack?lote=${batch.lot_id}`)}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm bg-background cursor-pointer transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-mango rounded-lg flex items-center justify-center shadow-sm">
                              <Leaf className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{batch.lot_id}</p>
                              <p className="text-[11px] text-muted-foreground">{batch.producer_name} · {batch.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="hidden sm:block text-xs font-semibold text-muted-foreground">{batch.variety}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${status.class}`}>
                              {status.label}
                            </span>
                            {batch.price_per_kg && (
                              <span className="text-xs font-bold text-secondary">${batch.price_per_kg}</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 mx-auto bg-muted rounded-xl flex items-center justify-center mb-3">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-bold text-foreground text-sm mb-1">{i.noBatches}</p>
                    <p className="text-xs text-muted-foreground mb-4">{i.noBatchesDesc}</p>
                    <Button onClick={() => navigate("/consignments")} size="sm" className="bg-gradient-mango text-primary-foreground font-semibold rounded-xl text-xs">
                      {i.registerFirst}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right Column: Quality + Network */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border h-full flex flex-col">
                {/* Quality Distribution */}
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Award className="h-4.5 w-4.5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-card-foreground font-display">{i.qualityTitle}</h2>
                    <p className="text-[11px] text-muted-foreground">{i.qualityDesc}</p>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  {qualityDistribution.map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${qualityColors[item.label] || "bg-muted-foreground"}`} />
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-foreground">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-2 rounded-full ${qualityColors[item.label] || "bg-muted-foreground"}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Anchoring status — backend-managed, no wallet UX */}
              </div>
            </motion.div>
          </div>

          {/* Map */}
          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-card-foreground font-display">{i.mapTitle}</h2>
                  <p className="text-[11px] text-muted-foreground">{i.mapDesc}</p>
                </div>
                <div className="hidden sm:flex gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-secondary rounded-full" />{i.highProd}</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-accent rounded-full" />{i.medProd}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
                <img src={peruMap} alt="Peru Map" className="max-h-[200px] object-contain rounded-xl border border-border shadow-sm" />
                <div className="grid grid-cols-2 gap-2.5 flex-1 w-full">
                  {locationDistribution.length > 0 ? (
                    locationDistribution.map((loc: any) => {
                      const colorMap: Record<string, string> = {
                        "Piura": "bg-secondary/10 border-secondary/20 text-secondary",
                        "Lambayeque": "bg-accent/10 border-accent/20 text-accent-foreground",
                        "Ica": "bg-primary/10 border-primary/20 text-primary",
                        "La Libertad": "bg-muted border-border text-muted-foreground",
                      };
                      return (
                        <div key={loc.location} className={`p-3.5 rounded-xl border ${colorMap[loc.location] || "bg-muted border-border text-muted-foreground"}`}>
                          <p className="font-bold text-xs">{loc.location}</p>
                          <p className="text-xl font-extrabold font-display">{loc.percentage}%</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 p-4 text-center text-xs text-muted-foreground">
                      {isLoading ? "Cargando..." : "Sin datos de ubicación"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hedera Network Health */}
          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-card-foreground font-display">{i.networkTitle}</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {lang === "es" ? "Integridad criptográfica via Hedera Hashgraph" : "Cryptographic integrity via Hedera Hashgraph"}
                    </p>
                  </div>
                </div>
                {isHederaConfigured() && (
                  <a
                    href={getTopicHashScanUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    HashScan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {anchoringStats ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                      {lang === "es" ? "Anclados" : "Anchored"}
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-700 font-display">{anchoringStats.anchored_count}</p>
                    <p className="text-[10px] text-emerald-500 mt-0.5">
                      {lang === "es" ? "packs inmutables" : "immutable packs"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
                      {lang === "es" ? "Verificados" : "Verified"}
                    </p>
                    <p className="text-2xl font-extrabold text-blue-700 font-display">{anchoringStats.verified_count}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">
                      {lang === "es" ? "via Mirror Node" : "via Mirror Node"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">
                      {lang === "es" ? "Pendientes" : "Pending"}
                    </p>
                    <p className="text-2xl font-extrabold text-amber-700 font-display">{anchoringStats.pending_count}</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">
                      {lang === "es" ? "en cola" : "in queue"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {lang === "es" ? "Último anclaje" : "Last Anchor"}
                    </p>
                    <p className="text-sm font-bold text-foreground font-display">
                      {anchoringStats.last_anchored_at
                        ? new Date(anchoringStats.last_anchored_at).toLocaleDateString()
                        : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {anchoringStats.last_anchored_at
                        ? new Date(anchoringStats.last_anchored_at).toLocaleTimeString()
                        : lang === "es" ? "sin anclajes" : "no anchors yet"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                  ) : (
                    <>
                      <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {isHederaConfigured()
                          ? (lang === "es" ? "Sin anclajes registrados aún" : "No anchors registered yet")
                          : (lang === "es" ? "Configurar Hedera para habilitar anclaje" : "Configure Hedera to enable anchoring")}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
