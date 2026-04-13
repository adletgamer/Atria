import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Shield, Clock, ArrowRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const Analytics = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stateDistribution, setStateDistribution] = useState<any[]>([]);
  const [evidenceTypes, setEvidenceTypes] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    avgCompleteness: 0,
    totalCases: 0,
    readyCases: 0,
    totalEvidence: 0,
    avgTimeToReady: "—",
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Fetch consignment states
        const { data: cases } = await supabase
          .from("consignment_cases")
          .select("current_state, evidence_completeness_pct, created_at, updated_at");

        // Fetch evidence type distribution
        const { data: evidence } = await supabase
          .from("evidence_objects")
          .select("evidence_type");

        if (cases) {
          // State distribution
          const stateCounts: Record<string, number> = {};
          let totalComp = 0;
          cases.forEach((c: any) => {
            const s = c.current_state || "draft";
            stateCounts[s] = (stateCounts[s] || 0) + 1;
            totalComp += c.evidence_completeness_pct || 0;
          });
          setStateDistribution(
            Object.entries(stateCounts).map(([state, count]) => ({
              state: state.replace(/_/g, " "),
              count,
            })).sort((a, b) => b.count - a.count)
          );

          const readyCases = cases.filter((c: any) =>
            c.current_state === "import_ready" || c.current_state === "released"
          ).length;

          setMetrics({
            avgCompleteness: cases.length > 0 ? Math.round(totalComp / cases.length) : 0,
            totalCases: cases.length,
            readyCases,
            totalEvidence: evidence?.length || 0,
            avgTimeToReady: "—",
          });
        }

        if (evidence) {
          const typeCounts: Record<string, number> = {};
          evidence.forEach((e: any) => {
            const t = e.evidence_type || "other";
            typeCounts[t] = (typeCounts[t] || 0) + 1;
          });
          setEvidenceTypes(
            Object.entries(typeCounts).map(([name, value]) => ({
              name: name.replace(/_/g, " "),
              value,
            })).sort((a, b) => b.value - a.value)
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const kpis = [
    {
      icon: BarChart3,
      label: lang === "es" ? "Total Consignaciones" : "Total Consignments",
      value: metrics.totalCases,
      sub: lang === "es" ? "casos activos" : "active cases",
      color: "text-primary bg-primary/10",
    },
    {
      icon: Shield,
      label: lang === "es" ? "% Completeness Prom." : "Avg. Completeness",
      value: `${metrics.avgCompleteness}%`,
      sub: lang === "es" ? "evidencia cubierta" : "evidence covered",
      color: "text-secondary bg-secondary/10",
    },
    {
      icon: TrendingUp,
      label: lang === "es" ? "Listas para Importar" : "Import Ready",
      value: metrics.readyCases,
      sub: lang === "es" ? "consignaciones listas" : "ready consignments",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: Clock,
      label: lang === "es" ? "Total Evidencias" : "Total Evidence",
      value: metrics.totalEvidence,
      sub: lang === "es" ? "objetos de evidencia" : "evidence objects",
      color: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial="hidden" animate="visible" className="space-y-6">
          {/* Header */}
          <motion.div custom={0} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-0.5">
                  {lang === "es" ? "Métricas operativas" : "Operational Metrics"}
                </p>
                <h1 className="text-2xl font-extrabold text-foreground font-display">
                  {lang === "es" ? "Analítica" : "Analytics"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {lang === "es" ? "Datos en tiempo real de tu pipeline de consignaciones" : "Real-time data from your consignment pipeline"}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/consignments")} className="rounded-xl text-xs h-9">
              {lang === "es" ? "Ver Consignaciones" : "View Consignments"}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </motion.div>

          {/* KPIs */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <motion.div custom={1} variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-extrabold text-foreground font-display">{kpi.value}</p>
                    <p className="text-xs font-semibold text-foreground mt-1">{kpi.label}</p>
                    <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div custom={2} variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* State Distribution Bar Chart */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-bold text-foreground mb-1">
                    {lang === "es" ? "Distribución por Estado" : "State Distribution"}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {lang === "es" ? "Consignaciones por estado actual" : "Consignments by current state"}
                  </p>
                  {stateDistribution.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                      {lang === "es" ? "Sin datos" : "No data yet"}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stateDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="state"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          angle={-30}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Evidence Type Pie Chart */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-bold text-foreground mb-1">
                    {lang === "es" ? "Tipos de Evidencia" : "Evidence Types"}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {lang === "es" ? "Distribución del repositorio de evidencia" : "Evidence repository breakdown"}
                  </p>
                  {evidenceTypes.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                      {lang === "es" ? "Sin evidencia registrada" : "No evidence registered"}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="55%" height={200}>
                        <PieChart>
                          <Pie data={evidenceTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {evidenceTypes.map((_, idx) => (
                              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1.5">
                        {evidenceTypes.slice(0, 6).map((t, idx) => (
                          <div key={t.name} className="flex items-center gap-2 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                            <span className="text-muted-foreground capitalize truncate flex-1">{t.name}</span>
                            <span className="font-bold text-foreground">{t.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Analytics;
