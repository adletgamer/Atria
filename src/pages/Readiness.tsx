import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, CheckCircle2, XCircle, Clock, AlertTriangle,
  ArrowRight, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { TableSkeleton, KpiGridSkeleton } from "@/components/ui/PageSkeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

type CaseState =
  | "draft" | "evidence_collecting" | "docs_complete" | "treatment_attested"
  | "custody_continuous" | "import_ready" | "exception_flagged"
  | "under_review" | "released" | "rejected";

const STATE_CONFIG: Record<CaseState, { label: string; labelEs: string; icon: any; color: string }> = {
  import_ready:       { label: "Import Ready",        labelEs: "Listo para importar",    icon: CheckCircle2,    color: "text-secondary bg-secondary/10 border-secondary/30" },
  released:           { label: "Released",             labelEs: "Liberado",               icon: CheckCircle2,    color: "text-secondary bg-secondary/10 border-secondary/30" },
  custody_continuous: { label: "Custody Continuous",  labelEs: "Custodia continua",      icon: Activity,        color: "text-blue-600 bg-blue-50 border-blue-200" },
  docs_complete:      { label: "Docs Complete",        labelEs: "Documentos completos",   icon: Clock,           color: "text-amber-600 bg-amber-50 border-amber-200" },
  treatment_attested: { label: "Treatment Attested",   labelEs: "Tratamiento atestado",   icon: Clock,           color: "text-amber-600 bg-amber-50 border-amber-200" },
  evidence_collecting:{ label: "Collecting Evidence",  labelEs: "Recopilando evidencia",  icon: Clock,           color: "text-muted-foreground bg-muted border-border" },
  draft:              { label: "Draft",                labelEs: "Borrador",               icon: Clock,           color: "text-muted-foreground bg-muted border-border" },
  under_review:       { label: "Under Review",         labelEs: "En revisión",            icon: AlertTriangle,   color: "text-amber-600 bg-amber-50 border-amber-200" },
  exception_flagged:  { label: "Exception Flagged",    labelEs: "Excepción activa",       icon: AlertTriangle,   color: "text-destructive bg-destructive/10 border-destructive/30" },
  rejected:           { label: "Rejected",             labelEs: "Rechazado",              icon: XCircle,         color: "text-destructive bg-destructive/10 border-destructive/30" },
};

const Readiness = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ ready: 0, inProgress: 0, blocked: 0, total: 0 });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("consignment_cases")
          .select(`
            id, case_number, destination_country, current_state, status,
            evidence_completeness_pct, blocking_exception_count,
            pack_status, created_at, updated_at
          `)
          .order("updated_at", { ascending: false })
          .limit(20);

        if (!error && data) {
          setCases(data);
          const ready = data.filter((c: any) =>
            c.current_state === "import_ready" || c.current_state === "released"
          ).length;
          const blocked = data.filter((c: any) =>
            c.current_state === "exception_flagged" || c.current_state === "rejected"
          ).length;
          setSummary({ ready, blocked, inProgress: data.length - ready - blocked, total: data.length });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial="hidden" animate="visible" className="space-y-6">
          {/* Header */}
          <motion.div custom={0} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-0.5">
                  {lang === "es" ? "Estado operativo" : "Operational State"}
                </p>
                <h1 className="text-2xl font-extrabold text-foreground font-display">
                  {lang === "es" ? "Readiness Pipeline" : "Readiness Pipeline"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {lang === "es" ? "Readiness de importación para todas las consignaciones activas" : "Import readiness for all active consignments"}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/consignments")} className="rounded-xl text-xs h-9">
              {lang === "es" ? "Ir a Consignaciones" : "Go to Consignments"}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </motion.div>

          {/* Summary KPIs */}
          {isLoading && <KpiGridSkeleton cols={4} />}
          {!isLoading && (
            <motion.div custom={1} variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: lang === "es" ? "Total" : "Total", value: summary.total, color: "bg-muted border-border text-foreground" },
                { label: lang === "es" ? "Listos" : "Ready", value: summary.ready, color: "bg-secondary/10 border-secondary/30 text-secondary" },
                { label: lang === "es" ? "En proceso" : "In Progress", value: summary.inProgress, color: "bg-amber-50 border-amber-200 text-amber-700" },
                { label: lang === "es" ? "Bloqueados" : "Blocked", value: summary.blocked, color: "bg-destructive/10 border-destructive/30 text-destructive" },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{s.label}</p>
                  <p className="text-3xl font-extrabold font-display mt-1">{s.value}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Cases list */}
          <motion.div custom={2} variants={fadeUp} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-foreground">
                  {lang === "es" ? "Sin consignaciones activas" : "No active consignments"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {lang === "es" ? "Crea tu primera consignación para ver el pipeline." : "Create your first consignment to see the pipeline."}
                </p>
                <Button size="sm" className="mt-4 rounded-xl text-xs" onClick={() => navigate("/consignments")}>
                  {lang === "es" ? "Nueva Consignación" : "New Consignment"}
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cases.map((c) => {
                  const stateKey = (c.current_state || "draft") as CaseState;
                  const cfg = STATE_CONFIG[stateKey] || STATE_CONFIG.draft;
                  const Icon = cfg.icon;
                  const completeness = c.evidence_completeness_pct ?? 0;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/consignments/${c.id}`)}
                    >
                      {/* State badge */}
                      <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {lang === "es" ? cfg.labelEs : cfg.label}
                      </span>

                      {/* Case info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm">{c.case_number}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.destination_country || "—"}
                          {c.blocking_exception_count > 0 && (
                            <span className="ml-2 text-destructive font-semibold">
                              {c.blocking_exception_count} blocking
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Completeness bar */}
                      <div className="hidden md:flex flex-col items-end w-24">
                        <p className="text-xs text-muted-foreground mb-1">{completeness}%</p>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${completeness >= 80 ? "bg-secondary" : completeness >= 50 ? "bg-amber-400" : "bg-destructive/60"}`}
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Readiness;
