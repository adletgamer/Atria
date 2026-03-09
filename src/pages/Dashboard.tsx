import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Package, TrendingUp, Users, MapPin, ArrowUpRight,
  Shield, Calendar, Leaf, DollarSign, Award, Truck, BarChart3,
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
    registerNew: "Registrar Lote",
    marketplace: "Marketplace",
    recentTitle: "Lotes Recientes",
    recentDesc: "Últimos registros en la plataforma",
    mapTitle: "Mapa de Producción",
    mapDesc: "Principales regiones productoras de mango en Perú",
    qualityTitle: "Distribución de Calidad",
    qualityDesc: "Porcentaje de lotes por grado",
    networkTitle: "Estado de Red",
    noBatches: "Sin lotes registrados",
    noBatchesDesc: "Comienza registrando tu primer lote",
    registerFirst: "Registrar Primer Lote",
    viewAll: "Ver Todos",
    highProd: "Alta Producción",
    medProd: "Media Producción",
    welcome: "Bienvenido",
    totalKg: "Kg totales",
    avgPrice: "Precio promedio",
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
    registerNew: "Register Batch",
    marketplace: "Marketplace",
    recentTitle: "Recent Batches",
    recentDesc: "Latest platform registrations",
    mapTitle: "Production Map",
    mapDesc: "Main mango producing regions in Peru",
    qualityTitle: "Quality Distribution",
    qualityDesc: "Batch percentage by quality grade",
    networkTitle: "Network Status",
    noBatches: "No batches registered",
    noBatchesDesc: "Start by registering your first batch",
    registerFirst: "Register First Batch",
    viewAll: "View All",
    highProd: "High Production",
    medProd: "Medium Production",
    welcome: "Welcome",
    totalKg: "Total Kg",
    avgPrice: "Avg. Price",
  },
};

const DEMO_BATCHES = [
  { batch_id: "MG-2025-001", producer_name: "Juan García", location: "Piura", variety: "Kent", quality: "Premium", status: "registered", total_kg: 500, price_per_kg: 2.80, created_at: "2025-12-01T10:00:00Z" },
  { batch_id: "MG-2025-002", producer_name: "María López", location: "Lambayeque", variety: "Tommy Atkins", quality: "Exportación", status: "in_transit", total_kg: 300, price_per_kg: 2.50, created_at: "2025-12-05T14:00:00Z" },
  { batch_id: "MG-2025-003", producer_name: "Carlos Ruiz", location: "Piura", variety: "Haden", quality: "Premium", status: "delivered", total_kg: 750, price_per_kg: 3.20, created_at: "2025-12-08T09:00:00Z" },
  { batch_id: "MG-2025-004", producer_name: "Ana Torres", location: "Ica", variety: "Edward", quality: "Primera", status: "registered", total_kg: 200, price_per_kg: 2.00, created_at: "2025-12-10T16:00:00Z" },
  { batch_id: "MG-2025-005", producer_name: "Pedro Flores", location: "Piura", variety: "Kent", quality: "Exportación", status: "in_transit", total_kg: 450, price_per_kg: 2.60, created_at: "2025-12-12T11:00:00Z" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const i = txt[lang];

  const [batches, setBatches] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBatches: 0, producers: 0, orders: 0, regions: 0, totalKg: 0, avgPrice: 0 });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("batches").select("*").order("created_at", { ascending: false }).limit(6);
      const realBatches = data && data.length > 0 ? data : DEMO_BATCHES;
      setBatches(realBatches);

      const producers = new Set(realBatches.map((b: any) => b.producer_name));
      const regions = new Set(realBatches.map((b: any) => b.location));
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true });
      const totalKg = realBatches.reduce((acc: number, b: any) => acc + (b.total_kg || 0), 0);
      const prices = realBatches.filter((b: any) => b.price_per_kg).map((b: any) => b.price_per_kg);
      const avgPrice = prices.length ? (prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0;

      setStats({
        totalBatches: realBatches.length,
        producers: producers.size,
        orders: count || 0,
        regions: regions.size,
        totalKg,
        avgPrice: Math.round(avgPrice * 100) / 100,
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

  const statusLabels: Record<string, { label: string; class: string }> = {
    registered: { label: lang === "es" ? "Registrado" : "Registered", class: "bg-primary/10 text-primary border-primary/20" },
    in_transit: { label: lang === "es" ? "En tránsito" : "In Transit", class: "bg-accent/10 text-accent-foreground border-accent/20" },
    delivered: { label: lang === "es" ? "Entregado" : "Delivered", class: "bg-secondary/10 text-secondary border-secondary/20" },
  };

  const statsData = [
    { title: i.batches, value: stats.totalBatches, desc: i.batchesDesc, icon: Package, gradient: "bg-gradient-mango" },
    { title: i.producers, value: stats.producers, desc: i.producersDesc, icon: Users, gradient: "bg-gradient-earth" },
    { title: i.totalKg, value: `${(stats.totalKg / 1000).toFixed(1)}t`, desc: i.ordersDesc, icon: Truck, gradient: "bg-gradient-mango" },
    { title: i.avgPrice, value: `$${stats.avgPrice}`, desc: "/kg", icon: DollarSign, gradient: "bg-gradient-earth" },
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
                <Button onClick={() => navigate("/registrar")} size="sm" className="bg-gradient-mango text-primary-foreground font-semibold rounded-xl shadow-sm hover:shadow-elevated hover:scale-[1.02] transition-all text-xs h-9">
                  <Package className="mr-1.5 h-3.5 w-3.5" />{i.registerNew}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/marketplace")} className="rounded-xl border-border font-semibold hover:bg-muted transition-all text-xs h-9">
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
                  <Button variant="ghost" size="sm" onClick={() => navigate("/rastrear")} className="text-primary font-semibold text-xs h-8">
                    {i.viewAll}<ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>

                {batches.length > 0 ? (
                  <div className="space-y-2">
                    {batches.slice(0, 5).map((batch, idx) => {
                      const status = statusLabels[batch.status] || statusLabels.registered;
                      return (
                        <motion.div key={batch.batch_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                          onClick={() => navigate(`/rastrear?lote=${batch.batch_id}`)}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm bg-background cursor-pointer transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-mango rounded-lg flex items-center justify-center shadow-sm">
                              <Leaf className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{batch.batch_id}</p>
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
                    <Button onClick={() => navigate("/registrar")} size="sm" className="bg-gradient-mango text-primary-foreground font-semibold rounded-xl text-xs">
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

                {/* Network Info */}
                <div className="mt-6 pt-5 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-xs font-bold text-foreground">{i.networkTitle}</h3>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Network", value: "Polygon Amoy" },
                      { label: "Chain ID", value: "80002" },
                      { label: "Status", value: "🟢 Active" },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                        <span className="text-[11px] font-semibold text-muted-foreground">{row.label}</span>
                        <span className="text-[11px] font-bold text-foreground font-mono">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                  {[
                    { name: "Piura", pct: "68%", color: "bg-secondary/10 border-secondary/20 text-secondary" },
                    { name: "Lambayeque", pct: "25%", color: "bg-accent/10 border-accent/20 text-accent-foreground" },
                    { name: "Ica", pct: "4%", color: "bg-primary/10 border-primary/20 text-primary" },
                    { name: "La Libertad", pct: "3%", color: "bg-muted border-border text-muted-foreground" },
                  ].map((r) => (
                    <div key={r.name} className={`p-3.5 rounded-xl border ${r.color}`}>
                      <p className="font-bold text-xs">{r.name}</p>
                      <p className="text-xl font-extrabold font-display">{r.pct}</p>
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
