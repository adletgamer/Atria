import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileSearch, CheckCircle2, Clock, AlertCircle, File, Image,
  FlaskConical, Award, Truck, ArrowRight, Loader2,
} from "lucide-react";
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

const EVIDENCE_ICONS: Record<string, any> = {
  document: File,
  photo: Image,
  lab_result: FlaskConical,
  certificate: Award,
  transport_log: Truck,
};

const Evidence = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error, count } = await supabase
          .from("evidence_objects")
          .select("id, evidence_type, content_hash, created_at, visibility, expires_at, consignment_id", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(30);

        if (!error && data) {
          // Fetch case numbers for consignment IDs
          const consignmentIds = [...new Set(data.map((d: any) => d.consignment_id).filter(Boolean))];
          let caseMap: Record<string, string> = {};
          if (consignmentIds.length > 0) {
            const { data: cases } = await supabase
              .from("consignment_cases")
              .select("id, case_number")
              .in("id", consignmentIds);
            (cases || []).forEach((c: any) => { caseMap[c.id] = c.case_number; });
          }
          setItems(data.map((d: any) => ({ ...d, case_number: caseMap[d.consignment_id] || null })));
          setTotal(count || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const isExpired = (exp?: string) => !!exp && new Date(exp) < new Date();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial="hidden" animate="visible" className="space-y-6">
          {/* Header */}
          <motion.div custom={0} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <FileSearch className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-0.5">
                  {lang === "es" ? "Repositorio" : "Repository"}
                </p>
                <h1 className="text-2xl font-extrabold text-foreground font-display">
                  {lang === "es" ? "Objetos de Evidencia" : "Evidence Objects"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {total} {lang === "es" ? "objetos registrados" : "registered objects"}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/consignments")} className="rounded-xl text-xs h-9">
              {lang === "es" ? "Ver Consignaciones" : "View Consignments"}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </motion.div>

          {/* Table */}
          <motion.div custom={1} variants={fadeUp} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileSearch className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-foreground">
                  {lang === "es" ? "Sin evidencia registrada aún" : "No evidence objects yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {lang === "es"
                    ? "Sube documentos desde el Workbench de una consignación."
                    : "Upload documents from a consignment workbench."}
                </p>
                <Button size="sm" className="mt-4 rounded-xl text-xs" onClick={() => navigate("/consignments")}>
                  {lang === "es" ? "Ir a Consignaciones" : "Go to Consignments"}
                </Button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">{lang === "es" ? "Tipo" : "Type"}</th>
                      <th className="px-5 py-3 font-semibold">Hash (SHA-256)</th>
                      <th className="px-5 py-3 font-semibold">{lang === "es" ? "Consignación" : "Consignment"}</th>
                      <th className="px-5 py-3 font-semibold">{lang === "es" ? "Subido" : "Uploaded"}</th>
                      <th className="px-5 py-3 font-semibold">{lang === "es" ? "Estado" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((ev) => {
                      const Icon = EVIDENCE_ICONS[ev.evidence_type] || FileSearch;
                      const expired = isExpired(ev.expires_at);
                      return (
                        <tr key={ev.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="capitalize">{ev.evidence_type?.replace(/_/g, " ")}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                            {ev.content_hash || "—"}
                          </td>
                          <td className="px-5 py-3">
                            {ev.case_number
                              ? <span className="text-primary font-semibold">{ev.case_number}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {ev.created_at ? new Date(ev.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-3">
                            {expired ? (
                              <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {lang === "es" ? "Expirado" : "Expired"}
                              </span>
                            ) : ev.visibility === "public" ? (
                              <span className="inline-flex items-center gap-1 text-secondary text-xs font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {lang === "es" ? "Verificado" : "Verified"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                {lang === "es" ? "Interno" : "Internal"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Evidence;
