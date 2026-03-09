import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { Search, MapPin, Award, Leaf, ShoppingCart, Package, Filter, ArrowRight, User } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

const txt = {
  es: {
    label: "Marketplace",
    title: "Mercado de Mangos",
    subtitle: "Conecta directamente con agricultores y exportadores peruanos",
    search: "Buscar por variedad, productor o ubicación...",
    all: "Todos",
    premium: "Premium",
    export: "Exportación",
    available: "Disponibles",
    producer: "Productor",
    location: "Ubicación",
    quality: "Calidad",
    perKg: "/kg",
    kg: "kg disponibles",
    contact: "Contactar",
    viewDetails: "Ver detalles",
    noListings: "No hay lotes listados aún",
    noListingsDesc: "Los agricultores pueden listar sus lotes desde la página de Registrar",
    loginToOrder: "Inicia sesión para ordenar",
    myListings: "Mis Lotes",
  },
  en: {
    label: "Marketplace",
    title: "Mango Market",
    subtitle: "Connect directly with Peruvian farmers and exporters",
    search: "Search by variety, producer or location...",
    all: "All",
    premium: "Premium",
    export: "Export",
    available: "Available",
    producer: "Producer",
    location: "Location",
    quality: "Quality",
    perKg: "/kg",
    kg: "kg available",
    contact: "Contact",
    viewDetails: "View details",
    noListings: "No batches listed yet",
    noListingsDesc: "Farmers can list their batches from the Register page",
    loginToOrder: "Log in to order",
    myListings: "My Batches",
  },
};

const Marketplace = () => {
  const { lang } = useLanguage();
  const i = txt[lang];
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuality, setFilterQuality] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await (supabase as any)
      .from("batches")
      .select("*, profiles:producer_id(full_name, company_name, avatar_url, location)")
      .eq("is_listed", true)
      .order("created_at", { ascending: false });

    if (!error && data) setBatches(data);
    setLoading(false);
  };

  const filtered = batches.filter((b) => {
    const matchesSearch = !searchTerm ||
      b.variety?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.producer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuality = filterQuality === "all" || b.quality === filterQuality;
    return matchesSearch && matchesQuality;
  });

  const handleContact = async (batch: any) => {
    if (!user) { toast.error(i.loginToOrder); return; }
    toast.success(lang === "es" ? `Solicitud enviada para lote ${batch.batch_id}` : `Request sent for batch ${batch.batch_id}`);
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
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground">{i.subtitle}</motion.p>

            {!user && (
              <motion.div custom={3} variants={fadeUp} className="mt-6 flex gap-3 justify-center">
                <Link to="/login"><Button variant="outline" className="rounded-2xl border-border px-6">{lang === "es" ? "Iniciar sesión" : "Log in"}</Button></Link>
                <Link to="/signup"><Button className="bg-gradient-mango text-primary-foreground rounded-2xl px-6">{lang === "es" ? "Crear cuenta" : "Sign up"}</Button></Link>
              </motion.div>
            )}
          </motion.div>

          {/* Search + Filters */}
          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="mb-10 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder={i.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 rounded-2xl border-border bg-card h-12 text-base shadow-card" />
            </div>
            <div className="flex gap-2">
              {["all", "Premium", "Export", "First Grade"].map((q) => (
                <Button key={q} variant={filterQuality === q ? "default" : "outline"} size="sm"
                  onClick={() => setFilterQuality(q)}
                  className={`rounded-xl ${filterQuality === q ? "bg-gradient-mango text-primary-foreground" : "border-border"}`}>
                  {q === "all" ? i.all : q}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Listings Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-card rounded-3xl p-6 shadow-card border border-border animate-pulse h-72" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((batch, index) => (
                <motion.div key={batch.id} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  custom={index % 6} variants={fadeUp}
                  className="bg-card rounded-3xl p-6 shadow-card border border-border hover:shadow-elevated hover:-translate-y-1 transition-all duration-500 group">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-lg">{batch.batch_id}</span>
                      <h3 className="text-lg font-bold text-card-foreground mt-2 font-display">{batch.variety}</h3>
                    </div>
                    {batch.price_per_kg && (
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-gradient-mango font-display">${batch.price_per_kg}</span>
                        <span className="text-xs text-muted-foreground">{i.perKg}</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>{batch.producer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{batch.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-3.5 w-3.5" />
                      <span>{batch.quality}</span>
                    </div>
                    {batch.total_kg && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        <span>{batch.total_kg} {i.kg}</span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <Button onClick={() => handleContact(batch)}
                    className="w-full bg-gradient-mango text-primary-foreground font-semibold rounded-2xl py-5 shadow-sm hover:shadow-elevated hover:scale-[1.01] transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <ShoppingCart className="mr-2 h-4 w-4" />{i.contact}
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card rounded-3xl p-16 shadow-card border border-border text-center">
              <div className="w-14 h-14 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-6">
                <Leaf className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground font-display mb-2">{i.noListings}</h3>
              <p className="text-muted-foreground mb-6">{i.noListingsDesc}</p>
              <Link to="/registrar">
                <Button className="bg-gradient-mango text-primary-foreground font-semibold rounded-2xl px-8">
                  {lang === "es" ? "Registrar Lote" : "Register Batch"}<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
