import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Package, TrendingUp, Users, MapPin, ArrowUpRight, Eye,
  Shield, BarChart3, Calendar, Leaf, DollarSign, Award,
} from "lucide-react";
import peruMap from "@/assets/peru-map.png";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

const txt = {
  es: {
    label: "Panel de Control",
    title: "Dashboard",
    subtitle: "Monitoreo en tiempo real de tu cadena de suministro",
    batches: "Lotes Registrados",
    batchesDesc: "Total en blockchain",
    producers: "Productores Activos",
    producersDesc: "Agricultores verificados",
    orders: "Órdenes",
    ordersDesc: "En el marketplace",
    regions: "Regiones",
    regionsDesc: "Zonas activas",
    registerNew: "Registrar Nuevo Lote",
    trackBatches: "Rastrear Lotes",
    marketplace: "Ir al Marketplace",
    recentTitle: "Lotes Recientes",
    recentDesc: "Últimos registros en la plataforma",
    mapTitle: "Mapa de Producción",
    mapDesc: "Principales regiones productoras de mango en Perú",
    qualityTitle: "Distribución de Calidad",
    qualityDesc: "Porcentaje de lotes por grado",
    networkTitle: "Estado de Red",
    networkDesc: "Información de Polygon Amoy Testnet",
    noBatches: "Sin lotes registrados",
    noBatchesDesc: "Comienza registrando tu primer lote",
    registerFirst: "Registrar Primer Lote",
    viewAll: "Ver Todos",
    highProd: "Alta Producción",
    medProd: "Media Producción",
    premium: "Premium",
    export: "Exportación",
    first: "Primera",
    second: "Segunda",
    welcome: "Bienvenido",
  },
  en: {
    label: "Control Panel",
    title: "Dashboard",
    subtitle: "Real-time monitoring of your supply chain",
    batches: "Registered Batches",
    batchesDesc: "Total on blockchain",
    producers: "Active Producers",
    producersDesc: "Verified farmers",
    orders: "Orders",
    ordersDesc: "In the marketplace",
    regions: "Regions",
    regionsDesc: "Active zones",
    registerNew: "Register New Batch",
    trackBatches: "Track Batches",
    marketplace: "Go to Marketplace",
    recentTitle: "Recent Batches",
    recentDesc: "Latest platform registrations",
    mapTitle: "Production Map",
    mapDesc: "Main mango producing regions in Peru",
    qualityTitle: "Quality Distribution",
    qualityDesc: "Batch percentage by quality grade",
    networkTitle: "Network Status",
    networkDesc: "Polygon Amoy Testnet Information",
    noBatches: "No batches registered",
    noBatchesDesc: "Start by registering your first batch",
    registerFirst: "Register First Batch",
    viewAll: "View All",
    highProd: "High Production",
    medProd: "Medium Production",
    premium: "Premium",
    export: "Export",
    first: "First Grade",
    second: "Second Grade",
    welcome: "Welcome",
  },
};

const DEMO_BATCHES = [
  { batch_id: "MG-2025-001", producer_name: "Juan García", location: "Piura", variety: "Kent", quality: "Premium", status: "registered", total_kg: 500, price_per_kg: 2.80, created_at: "2025-12-01T10:00:00Z" },
  { batch_id: "MG-2025-002", producer_name: "María López", location: "Lambayeque", variety: "Tommy Atkins", quality: "Exportación", status: "in_transit", total_kg: 300, price_per_kg: 2.50, created_at: "2025-12-05T14:00:00Z" },
  { batch_id: "MG-2025-003", producer_name: "Carlos Ruiz", location: "Piura", variety: "Haden", quality: "Premium", status: "delivered", total_kg: 750, price_per_kg: 3.20, created_at: "2025-12-08T09:00:00Z" },
  { batch_id: "MG-2025-004", producer_name: "Ana Torres", location: "Ica", variety: "Edward", quality: "Primera", status: "registered", total_kg: 200, price_per_kg: 2.00, created_at: "2025-12-10T16:00:00Z" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const i = txt[lang];

  const [batches, setBatches] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBatches: 0, producers: 0, orders: 0, regions: 0 });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("batches").select("*").order("created_at", { ascending: false }).limit(6);
      const realBatches = data && data.length > 0 ? data : DEMO_BATCHES;
      setBatches(realBatches);

      const producers = new Set(realBatches.map((b: any) => b.producer_name));
      const regions = new Set(realBatches.map((b: any) => b.location));
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true });

      setStats({
        totalBatches: realBatches.length,
        producers: producers.size,
        orders: count || 0,
        regions: regions.size,
      });
    };
    load();
  }, []);

  const qualityDistribution = (() => {
    const counts: Record<string, number> = {};
    batches.forEach((b) => { counts[b.quality] = (counts[b.quality] || 0) + 1; });
    const total = batches.length || 1;
    return Object.entries(counts).map(([label, count]) => ({
      label,
      percentage: Math.round((count / total) * 100),
    }));
  })();

  const qualityColors: Record<string, string> = {
    Premium: "bg-secondary",
    Exportación: "bg-primary",
    Primera: "bg-accent",
    Segunda: "bg-muted-foreground",
  };

  const statusColors: Record<string, string> = {
    registered: "bg-primary/15 text-primary",
    in_transit: "bg-accent/15 text-accent-foreground",
    delivered: "bg-secondary/15 text-secondary",
  };

  const statsData = [
    { title: i.batches, value: stats.totalBatches, desc: i.batchesDesc, icon: Package, gradient: "bg-gradient-mango" },
    { title: i.producers, value: stats.producers, desc: i.producersDesc, icon: Users, gradient: "bg-gradient-earth" },
    { title: i.orders, value: stats.orders, desc: i.ordersDesc, icon: DollarSign, gradient: "bg-gradient-mango" },
    { title: i.regions, value: stats.regions, desc: i.regionsDesc, icon: MapPin, gradient: "bg-gradient-earth" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial="hidden" animate="visible" className="mb-12">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">{i.label}</motion.p>
            <motion.div custom={1} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground font-display mb-2">{i.title}</h1>
                <p className="text-lg text-muted-foreground">
                  {i.welcome}, <span className="font-semibold text-foreground">{profile?.full_name || user?.email || "Usuario"}</span> — {i.subtitle}
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/registrar")} className="bg-gradient-mango text-primary-foreground font-semibold rounded-2xl shadow-sm hover:shadow-elevated hover:scale-[1.01] transition-all">
                  <Package className="mr-2 h-4 w-4" />{i.registerNew}
                </Button>
                <Button variant="outline" onClick={() => navigate("/marketplace")} className="rounded-2xl border-border font-semibold hover:bg-muted transition-all">
                  <DollarSign className="mr-2 h-4 w-4" />{i.marketplace}
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            {statsData.map((stat, idx) => (
              <motion.div key={stat.title} custom={idx} variants={fadeUp}
                className="bg-card rounded-3xl p-6 shadow-card border border-border hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 ${stat.gradient} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <stat.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </div>
                <p className="text-3xl font-extrabold text-foreground font-display">{stat.value}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{stat.title}</p>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Recent Batches */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="lg:col-span-2">
              <div className="bg-card rounded-3xl p-8 shadow-card border border-border">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-card-foreground font-display">{i.recentTitle}</h2>
                      <p className="text-xs text-muted-foreground">{i.recentDesc}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/rastrear")} className="text-primary font-semibold">
                    {i.viewAll}<ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>

                {batches.length > 0 ? (
                  <div className="space-y-3">
                    {batches.slice(0, 5).map((batch, idx) => (
                      <motion.div key={batch.batch_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                        onClick={() => navigate(`/rastrear?lote=${batch.batch_id}`)}
                        className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm bg-background cursor-pointer transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-mango rounded-xl flex items-center justify-center shadow-sm">
                            <Leaf className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{batch.batch_id}</p>
                            <p className="text-xs text-muted-foreground">{batch.producer_name} · {batch.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="hidden sm:block text-sm font-semibold text-foreground">{batch.variety}</span>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${statusColors[batch.status] || "bg-muted text-muted-foreground"}`}>
                            {batch.quality}
                          </span>
                          {batch.price_per_kg && (
                            <span className="text-sm font-bold text-secondary">${batch.price_per_kg}/kg</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-4">
                      <Package className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="font-bold text-foreground mb-1">{i.noBatches}</p>
                    <p className="text-sm text-muted-foreground mb-4">{i.noBatchesDesc}</p>
                    <Button onClick={() => navigate("/registrar")} className="bg-gradient-mango text-primary-foreground font-semibold rounded-2xl">
                      {i.registerFirst}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quality Distribution */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
              <div className="bg-card rounded-3xl p-8 shadow-card border border-border h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <Award className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground font-display">{i.qualityTitle}</h2>
                    <p className="text-xs text-muted-foreground">{i.qualityDesc}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {qualityDistribution.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-foreground flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${qualityColors[item.label] || "bg-muted-foreground"}`} />
                          {item.label}
                        </span>
                        <span className="text-sm font-bold text-foreground">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-2.5 rounded-full ${qualityColors[item.label] || "bg-muted-foreground"}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Network Info */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">{i.networkTitle}</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Network", value: "Polygon Amoy" },
                      { label: "Chain ID", value: "80002" },
                      { label: "Status", value: "🟢 Active" },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center p-2.5 bg-muted rounded-xl">
                        <span className="text-xs font-semibold text-muted-foreground">{row.label}</span>
                        <span className="text-xs font-bold text-foreground font-mono">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Map */}
          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
            <div className="bg-card rounded-3xl p-8 shadow-card border border-border">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-card-foreground font-display">{i.mapTitle}</h2>
                  <p className="text-xs text-muted-foreground">{i.mapDesc}</p>
                </div>
                <div className="ml-auto flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-secondary rounded-full" />{i.highProd}</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-accent rounded-full" />{i.medProd}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <img src={peruMap} alt="Peru Map" className="max-h-[240px] object-contain rounded-2xl border border-border shadow-sm" />
                <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                  {[
                    { name: "Piura", pct: "68%", color: "bg-secondary/10 border-secondary/20 text-secondary" },
                    { name: "Lambayeque", pct: "25%", color: "bg-accent/10 border-accent/20 text-accent-foreground" },
                    { name: "Ica", pct: "4%", color: "bg-primary/10 border-primary/20 text-primary" },
                    { name: "La Libertad", pct: "3%", color: "bg-muted border-border text-muted-foreground" },
                  ].map((r) => (
                    <div key={r.name} className={`p-4 rounded-2xl border ${r.color}`}>
                      <p className="font-bold text-sm">{r.name}</p>
                      <p className="text-2xl font-extrabold font-display">{r.pct}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
