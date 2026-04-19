import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  Link2,
  Gauge,
  Package,
  Database,
  Hash,
  Server,
  ChevronRight,
  Hexagon,
  Lock,
  Zap,
  Globe,
  Triangle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ── State machine ── */
const states = [
  { id: "draft", label: "Draft", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
  { id: "evidence_collecting", label: "Collecting", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  { id: "docs_complete", label: "Docs Complete", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  { id: "treatment_attested", label: "Attested", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  { id: "custody_continuous", label: "Custody OK", color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  { id: "import_ready", label: "Import Ready", color: "text-emerald-400 bg-emerald-400/8 border-emerald-400/25" },
  { id: "released", label: "Released", color: "text-teal-300 bg-teal-300/10 border-teal-300/20" },
];

/* ── Evidence dimensions ── */
const evidenceDimensions = {
  es: [
    { label: "Evidence Completeness", value: 94, desc: "Documentos y certificados presentes vs. requeridos", icon: FileCheck2 },
    { label: "Attribution Strength", value: 88, desc: "Firmas y attestations vinculadas a actores verificados", icon: ShieldCheck },
    { label: "Custody Continuity", value: 100, desc: "Cadena de custodia sin gaps temporales ni firmas faltantes", icon: Link2 },
    { label: "Decision Readiness", value: 91, desc: "Score compuesto para decisión de importación", icon: Gauge },
  ],
  en: [
    { label: "Evidence Completeness", value: 94, desc: "Documents and certificates present vs. required", icon: FileCheck2 },
    { label: "Attribution Strength", value: 88, desc: "Signatures and attestations linked to verified actors", icon: ShieldCheck },
    { label: "Custody Continuity", value: 100, desc: "Chain of custody with zero time gaps or missing signatures", icon: Link2 },
    { label: "Decision Readiness", value: 91, desc: "Composite score for import decision", icon: Gauge },
  ],
};

const content = {
  es: {
    badge: "Protocolo de cumplimiento verificable",
    headline: "Estado verificable\npara consignaciones\nde exportación",
    subheadline:
      "Transforma evidencia comercial fragmentada en evidence packs portables, verificables y listos para decisión — anclados en Hedera Consensus Service.",
    ctaPrimary: "Solicitar piloto",
    ctaSecondary: "Ver verificación en vivo",
    proofs: [
      { label: "Evidence-first", desc: "Documentos antes de opiniones" },
      { label: "Hash-anchored", desc: "SHA-256 Merkle root en Hedera" },
      { label: "Trustless verification", desc: "Cualquiera verifica, sin cuenta" },
    ],
    problemLabel: "El problema",
    problemTitle: "Los sistemas comerciales ya producen trazas.\nFallan al producir evidencia bajo presión.",
    problems: [
      {
        title: "Evidencia fragmentada",
        desc: "Certificados fitosanitarios en un portal, reportes de lab por email, inspecciones en paper. Sin reconciliación entre 12+ actores.",
        metric: "$2.6B",
        metricLabel: "rechazados/año",
      },
      {
        title: "Reconstrucción manual",
        desc: "Cada auditoría, disputa o consulta requiere re-armar el caso desde cero. Sin fuente canónica compartida.",
        metric: "72h",
        metricLabel: "tiempo de decisión",
      },
      {
        title: "Costo de la incertidumbre",
        desc: "Retenciones, rechazos y ventanas perdidas por evidencia insuficiente. Los agricultores absorben el costo completo.",
        metric: "320K",
        metricLabel: "familias afectadas",
      },
    ],
    howLabel: "Cómo funciona",
    howTitle: "De evidencia fragmentada a verificación instantánea",
    howSteps: [
      { num: "01", title: "Capturar evidencia", desc: "Documentos, certificados y fotos ingestados desde origen con hash SHA-256 client-side." },
      { num: "02", title: "Vincular attestations", desc: "Actores firman y vinculan evidencia a la consignación. 5 métodos de firma soportados." },
      { num: "03", title: "Computar readiness", desc: "Score de completeness, continuidad de custodia, excepciones bloqueantes. Determinístico." },
      { num: "04", title: "Generar evidence pack", desc: "Merkle root de toda la evidencia anclado en Hedera HCS. Verificable por terceros sin login." },
    ],
    stateLabel: "Máquina de estados",
    stateTitle: "Cada consignación transita estados computables",
    stateSubtitle: "No opiniones. No aprobaciones subjetivas. La máquina de estados impone reglas determinísticas.",
    stateConditions: "import_ready requiere: completeness > 90% · zero blocking exceptions · custody_continuity = true",
    evidenceLabel: "Modelo de evidencia",
    evidenceTitle: "Cuatro dimensiones independientes",
    evidenceSubtitle: "Reducirlas a un score único destruye el valor. Cada dimensión es verificable por separado.",
    archLabel: "Arquitectura",
    archTitle: "Híbrida por diseño",
    archSubtitle: "Blockchain = integridad verificable. No = base de datos operativa.",
    archOffchain: "Off-chain",
    archOffchainDesc: "Datos operativos, documentos, PII. PostgreSQL + Row Level Security para 17 actores.",
    archOnchain: "On-chain",
    archOnchainDesc: "Solo hashes. Evidence Pack Merkle root en Hedera HCS. Verificable por cualquiera.",
    archRule: "Nada sensible va on-chain. Solo SHA-256 hashes de evidence packs son publicados para integridad verificable.",
    archItems: {
      offchain: ["Supabase PostgreSQL + RLS", "Evidence objects & storage", "Attestations & custody records", "17-actor access control"],
      onchain: ["Hedera HCS Topic 0.0.8535355", "SHA-256 Merkle root anchoring", "MangoChainRegistry.sol (Polygon)", "Public Mirror Node verification"],
    },
    outputsLabel: "Salidas",
    outputsTitle: "Lo que produce ATRIA",
    outputs: [
      {
        title: "Verifiable State",
        desc: "Snapshot operativo: completeness, custody continuity, excepciones activas, estado de decisión. Reproducible y determinístico.",
        icon: ShieldCheck,
        color: "teal",
      },
      {
        title: "Evidence Pack",
        desc: "Artefacto portable con evidencia reconciliada, attestations y Merkle root verificable por terceros vía Hedera Mirror Node.",
        icon: FileCheck2,
        color: "blue",
      },
    ],
    corridorLabel: "Primer corredor",
    corridorTitle: "Por qué Perú → US primero",
    corridorItems: [
      { label: "Corredor regulado", desc: "SENASA + APHIS + SUNAT compliance obligatorio" },
      { label: "Tratamiento auditable", desc: "Hot water treatment con ventana de 4h verificable" },
      { label: "Alta perecibilidad", desc: "Kent mango: 14 días shelf life máximo" },
      { label: "Presión temporal", desc: "Ventanas de exportación de 3 meses (Nov-Mar)" },
      { label: "Anchors verificables", desc: "Cada documento ya tiene hash digital asignable" },
    ],
    finalTitle: "Listo para evaluación de piloto",
    finalDesc:
      "Si operas en cumplimiento de exportación, importación regulada o underwriting de trade finance — podemos revisar tu flujo actual y configurar una prueba controlada con datos reales.",
    finalPrimary: "Solicitar piloto",
    finalSecondary: "pilot@atria.protocol",
    footer: "ATRIA Protocol · Consignments · Evidence · Readiness · Verification",
    mockup: {
      title: "Operations Overview",
      kpis: [
        { label: "Consignments", value: "24", change: "+3" },
        { label: "Readiness", value: "87%", change: "+2.4%" },
        { label: "Exceptions", value: "2", change: "-1" },
      ],
      pipeline: [
        { label: "Draft", count: 3, color: "bg-zinc-400/15 text-zinc-400" },
        { label: "Collecting", count: 8, color: "bg-amber-400/15 text-amber-400" },
        { label: "Import Ready", count: 11, color: "bg-emerald-400/15 text-emerald-400" },
        { label: "Blocked", count: 2, color: "bg-red-400/15 text-red-400" },
      ],
      exceptions: [
        { id: "EX-041", text: "Missing phyto cert — SENASA", severity: "blocking" },
        { id: "EX-039", text: "Custody gap 14h — cold chain", severity: "warning" },
      ],
      packHash: "0x9f2a4b...c8e1",
    },
  },
  en: {
    badge: "Verifiable compliance protocol",
    headline: "Verifiable state\nfor export\nconsignments",
    subheadline:
      "Transform fragmented trade evidence into portable, decision-ready evidence packs — anchored on Hedera Consensus Service.",
    ctaPrimary: "Request pilot",
    ctaSecondary: "See live verification",
    proofs: [
      { label: "Evidence-first", desc: "Documents before opinions" },
      { label: "Hash-anchored", desc: "SHA-256 Merkle root on Hedera" },
      { label: "Trustless verification", desc: "Anyone verifies, no account" },
    ],
    problemLabel: "The problem",
    problemTitle: "Trade systems already produce traces.\nThey fail at producing evidence under pressure.",
    problems: [
      {
        title: "Fragmented evidence",
        desc: "Phyto certs in one portal, lab reports by email, inspections on paper. No reconciliation across 12+ actors.",
        metric: "$2.6B",
        metricLabel: "rejected/year",
      },
      {
        title: "Manual reconstruction",
        desc: "Every audit, dispute or query requires re-assembling the case from scratch. No shared canonical source.",
        metric: "72h",
        metricLabel: "decision time",
      },
      {
        title: "Cost of uncertainty",
        desc: "Holds, rejections and missed windows due to insufficient evidence. Farmers absorb the full cost.",
        metric: "320K",
        metricLabel: "families affected",
      },
    ],
    howLabel: "How it works",
    howTitle: "From fragmented evidence to instant verification",
    howSteps: [
      { num: "01", title: "Capture evidence", desc: "Documents, certificates and photos ingested from origin with SHA-256 hash client-side." },
      { num: "02", title: "Link attestations", desc: "Actors sign and link evidence to the consignment. 5 signature methods supported." },
      { num: "03", title: "Compute readiness", desc: "Completeness score, custody continuity, blocking exceptions. Deterministic." },
      { num: "04", title: "Generate evidence pack", desc: "Merkle root of all evidence anchored on Hedera HCS. Third-party verifiable, no login." },
    ],
    stateLabel: "State machine",
    stateTitle: "Each consignment transits computable states",
    stateSubtitle: "Not opinions. Not subjective approvals. The state machine enforces deterministic rules.",
    stateConditions: "import_ready requires: completeness > 90% · zero blocking exceptions · custody_continuity = true",
    evidenceLabel: "Evidence model",
    evidenceTitle: "Four independent dimensions",
    evidenceSubtitle: "Reducing them to a single score destroys the value. Each dimension is independently verifiable.",
    archLabel: "Architecture",
    archTitle: "Hybrid by design",
    archSubtitle: "Blockchain = verifiable integrity. Not = operational database.",
    archOffchain: "Off-chain",
    archOffchainDesc: "Operational data, documents, PII. PostgreSQL + Row Level Security for 17 actors.",
    archOnchain: "On-chain",
    archOnchainDesc: "Hashes only. Evidence Pack Merkle root on Hedera HCS. Verifiable by anyone.",
    archRule: "Nothing sensitive goes on-chain. Only SHA-256 hashes of evidence packs are published for verifiable integrity.",
    archItems: {
      offchain: ["Supabase PostgreSQL + RLS", "Evidence objects & storage", "Attestations & custody records", "17-actor access control"],
      onchain: ["Hedera HCS Topic 0.0.8535355", "SHA-256 Merkle root anchoring", "MangoChainRegistry.sol (Polygon)", "Public Mirror Node verification"],
    },
    outputsLabel: "Outputs",
    outputsTitle: "What ATRIA produces",
    outputs: [
      {
        title: "Verifiable State",
        desc: "Operational snapshot: completeness, custody continuity, active exceptions, decision state. Reproducible and deterministic.",
        icon: ShieldCheck,
        color: "teal",
      },
      {
        title: "Evidence Pack",
        desc: "Portable artifact with reconciled evidence, attestations and Merkle root verifiable by third parties via Hedera Mirror Node.",
        icon: FileCheck2,
        color: "blue",
      },
    ],
    corridorLabel: "First corridor",
    corridorTitle: "Why Peru → US first",
    corridorItems: [
      { label: "Regulated corridor", desc: "SENASA + APHIS + SUNAT compliance required" },
      { label: "Auditable treatment", desc: "Hot water treatment with verifiable 4h window" },
      { label: "High perishability", desc: "Kent mango: 14-day maximum shelf life" },
      { label: "Timing pressure", desc: "3-month export windows (Nov–Mar)" },
      { label: "Digital anchors", desc: "Every document already has assignable digital hash" },
    ],
    finalTitle: "Ready for pilot evaluation",
    finalDesc:
      "If you operate in export compliance, regulated import review or trade finance underwriting — we can assess your current process and configure a controlled pilot with real data.",
    finalPrimary: "Request pilot",
    finalSecondary: "pilot@atria.protocol",
    footer: "ATRIA Protocol · Consignments · Evidence · Readiness · Verification",
    mockup: {
      title: "Operations Overview",
      kpis: [
        { label: "Consignments", value: "24", change: "+3" },
        { label: "Readiness", value: "87%", change: "+2.4%" },
        { label: "Exceptions", value: "2", change: "-1" },
      ],
      pipeline: [
        { label: "Draft", count: 3, color: "bg-zinc-400/15 text-zinc-400" },
        { label: "Collecting", count: 8, color: "bg-amber-400/15 text-amber-400" },
        { label: "Import Ready", count: 11, color: "bg-emerald-400/15 text-emerald-400" },
        { label: "Blocked", count: 2, color: "bg-red-400/15 text-red-400" },
      ],
      exceptions: [
        { id: "EX-041", text: "Missing phyto cert — SENASA", severity: "blocking" },
        { id: "EX-039", text: "Custody gap 14h — cold chain", severity: "warning" },
      ],
      packHash: "0x9f2a4b...c8e1",
    },
  },
};

const problemIcons = [FileSearch, AlertTriangle, Package];
const stepIcons = [FileSearch, Link2, Gauge, Package];

const Index = () => {
  const { lang } = useLanguage();
  const t = content[lang];
  const dims = evidenceDimensions[lang];

  return (
    <div className="min-h-screen dark-landing bg-background text-foreground">
      <Navbar />

      <main>
        {/* ── HERO ── */}
        <section id="hero" className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-mesh-dark" />
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/8 via-transparent to-transparent rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-20 sm:pt-28 sm:pb-28">
            <motion.div
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center"
            >
              {/* Left column */}
              <div>
                <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {t.badge}
                  </span>
                </motion.div>

                <motion.h1
                  custom={1}
                  variants={fadeUp}
                  className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-foreground font-display leading-[1.08] tracking-tight whitespace-pre-line"
                >
                  {t.headline}
                </motion.h1>

                <motion.p
                  custom={2}
                  variants={fadeUp}
                  className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl"
                >
                  {t.subheadline}
                </motion.p>

                <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a href="mailto:pilot@atria.protocol?subject=Pilot%20Request">
                    <Button className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-10 px-6 font-semibold shadow-glow-teal transition-all duration-300 hover:shadow-glow-teal/50">
                      {t.ctaPrimary}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  <Link to="/verify-pack">
                    <Button variant="outline" className="rounded-lg border-border/60 text-sm h-10 px-6 font-medium hover:bg-muted/30 hover:border-border transition-all duration-300">
                      {t.ctaSecondary}
                      <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </motion.div>

                <motion.div custom={4} variants={fadeUp} className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {t.proofs.map((p) => (
                    <div key={p.label} className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {p.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground pl-5">{p.desc}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right column — Product Mockup */}
              <motion.div custom={2} variants={fadeUp} className="hidden lg:block">
                <div className="rounded-xl border border-border/60 bg-card/80 shadow-elevated overflow-hidden backdrop-blur-sm">
                  {/* Title bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                      </div>
                      <span className="text-xs font-semibold text-foreground ml-2">{t.mockup.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
                      <span className="text-[10px] font-mono font-semibold text-emerald-400">{t.mockup.packHash}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* KPI strip */}
                    <div className="grid grid-cols-3 gap-2">
                      {t.mockup.kpis.map((kpi) => (
                        <div key={kpi.label} className="rounded-lg border border-border/40 bg-muted/20 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                            <span className={`text-[9px] font-mono font-semibold ${kpi.change.startsWith('+') ? 'text-emerald-400' : kpi.change.startsWith('-') ? 'text-amber-400' : 'text-muted-foreground'}`}>
                              {kpi.change}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-foreground font-display leading-none">{kpi.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* State machine mini */}
                    <div>
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">State Pipeline</p>
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {states.slice(0, 6).map((s, idx) => (
                          <div key={s.id} className="flex items-center shrink-0">
                            <span className={`text-[8px] font-mono font-semibold rounded-md border px-2 py-1 ${s.color}`}>
                              {s.label}
                            </span>
                            {idx < 5 && (
                              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 mx-0.5 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pipeline distribution */}
                    <div>
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Distribution</p>
                      <div className="space-y-1.5">
                        {t.mockup.pipeline.map((s) => (
                          <div key={s.label} className="flex items-center gap-3">
                            <span className={`text-[10px] font-semibold rounded-md px-2 py-0.5 w-24 text-center ${s.color}`}>{s.label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                              <div className={`h-full rounded-full ${s.color.split(' ')[0].replace('/15', '/40')}`} style={{ width: `${(s.count / 24) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-foreground font-mono w-6 text-right">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exceptions */}
                    <div>
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Active Exceptions</p>
                      <div className="space-y-1.5">
                        {t.mockup.exceptions.map((ex) => (
                          <div key={ex.id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[11px] ${
                            ex.severity === "blocking"
                              ? "border-red-400/20 bg-red-400/5 text-red-400"
                              : "border-amber-400/20 bg-amber-400/5 text-amber-400"
                          }`}>
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span className="font-mono font-bold text-[10px]">{ex.id}</span>
                            <span className="text-[11px] opacity-80">{ex.text}</span>
                            <span className={`ml-auto text-[8px] font-bold uppercase tracking-wider ${
                              ex.severity === "blocking" ? "text-red-400" : "text-amber-400"
                            }`}>{ex.severity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="relative border-t border-border/40">
          <div className="absolute inset-0 bg-gradient-section" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
              <motion.p custom={0} variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                {t.problemLabel}
              </motion.p>
              <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-display leading-snug max-w-3xl whitespace-pre-line">
                {t.problemTitle}
              </motion.h2>

              <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {t.problems.map((p, idx) => {
                  const Icon = problemIcons[idx];
                  return (
                    <motion.div
                      key={p.title}
                      custom={idx + 2}
                      variants={fadeUp}
                      className="group relative rounded-xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:border-border hover:bg-card/80 hover:shadow-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors duration-300">
                          <Icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-foreground font-display leading-none">{p.metric}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{p.metricLabel}</p>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-2">{p.title}</h3>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{p.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="relative border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="space-y-10">
              <div>
                <motion.p custom={0} variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                  {t.howLabel}
                </motion.p>
                <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-display">
                  {t.howTitle}
                </motion.h2>
              </div>

              <div className="relative">
                {/* Connector line — desktop */}
                <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px">
                  <div className="w-full h-full bg-gradient-to-r from-primary/40 via-secondary/30 to-primary/40" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {t.howSteps.map((step, idx) => {
                    const Icon = stepIcons[idx];
                    return (
                      <motion.div key={step.num} custom={idx + 2} variants={fadeUp} className="relative group">
                        <div className="rounded-xl border border-border/50 bg-card/50 p-5 transition-all duration-300 hover:border-primary/20 hover:bg-card/80 hover:shadow-card h-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="relative w-10 h-10 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-primary" />
                              <span className="absolute -top-1.5 -right-1.5 text-[9px] font-mono font-bold text-primary bg-background border border-primary/20 rounded px-1">{step.num}</span>
                            </div>
                          </div>
                          <h3 className="text-sm font-bold text-foreground mb-1.5">{step.title}</h3>
                          <p className="text-[12px] text-muted-foreground leading-relaxed">{step.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── STATE MACHINE ── */}
        <section id="state-machine" className="relative border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="space-y-8">
              <div>
                <motion.p custom={0} variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                  {t.stateLabel}
                </motion.p>
                <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-display">
                  {t.stateTitle}
                </motion.h2>
                <motion.p custom={2} variants={fadeUp} className="mt-2 text-sm text-muted-foreground max-w-2xl">
                  {t.stateSubtitle}
                </motion.p>
              </div>

              <motion.div custom={3} variants={fadeUp} className="rounded-xl border border-border/50 bg-card/50 p-6 sm:p-8 overflow-x-auto">
                {/* State flow */}
                <div className="flex items-center gap-2 min-w-max pb-3">
                  {states.map((s, idx) => (
                    <div key={s.id} className="flex items-center">
                      <div className={`rounded-lg border px-3.5 py-2.5 ${s.color} transition-all duration-200`}>
                        <span className="text-[11px] font-mono font-bold whitespace-nowrap">{s.id}</span>
                      </div>
                      {idx < states.length - 1 && (
                        <div className="flex items-center mx-1.5">
                          <div className="w-5 h-px bg-border/60" />
                          <ChevronRight className="h-3 w-3 text-muted-foreground/40 -ml-0.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Blocking rule callout */}
                <div className="mt-5 flex items-start gap-3 rounded-lg bg-red-400/5 border border-red-400/15 px-4 py-3">
                  <Lock className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-red-400">Blocking Rule</p>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{t.stateConditions}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── EVIDENCE MODEL ── */}
        <section id="evidence-model" className="relative border-t border-border/40">
          <div className="absolute inset-0 bg-gradient-section" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="space-y-8">
              <div>
                <motion.p custom={0} variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                  {t.evidenceLabel}
                </motion.p>
                <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-display">
                  {t.evidenceTitle}
                </motion.h2>
                <motion.p custom={2} variants={fadeUp} className="mt-2 text-sm text-muted-foreground max-w-2xl">
                  {t.evidenceSubtitle}
                </motion.p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dims.map((dim, idx) => {
                  const Icon = dim.icon;
                  const isComplete = dim.value === 100;
                  const isHigh = dim.value >= 90;
                  return (
                    <motion.div key={dim.label} custom={idx + 3} variants={fadeUp}
                      className="group rounded-xl border border-border/50 bg-card/50 p-5 transition-all duration-300 hover:border-border hover:bg-card/80 hover:shadow-card"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isComplete ? "bg-emerald-400/10 border border-emerald-400/20" :
                          isHigh ? "bg-blue-400/10 border border-blue-400/20" :
                          "bg-amber-400/10 border border-amber-400/20"
                        }`}>
                          <Icon className={`h-3.5 w-3.5 ${
                            isComplete ? "text-emerald-400" : isHigh ? "text-blue-400" : "text-amber-400"
                          }`} />
                        </div>
                        <span className={`text-2xl font-extrabold font-display leading-none ${
                          isComplete ? "text-emerald-400" : isHigh ? "text-blue-400" : "text-amber-400"
                        }`}>{dim.value}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1 rounded-full bg-muted/30 mb-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isComplete ? "bg-emerald-400" : isHigh ? "bg-blue-400" : "bg-amber-400"
                          }`}
                          style={{ width: `${dim.value}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{dim.label}</span>
                      <p className="mt-1.5 text-[11px] text-muted-foreground/80 leading-relaxed">{dim.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── HYBRID ARCHITECTURE ── */}
        <section id="architecture" className="relative border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="space-y-8">
              <div>
                <motion.p custom={0} variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                  {t.archLabel}
                </motion.p>
                <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-display">
                  {t.archTitle}
                </motion.h2>
                <motion.p custom={2} variants={fadeUp} className="mt-2 text-sm text-muted-foreground max-w-xl">
                  {t.archSubtitle}
                </motion.p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Off-chain */}
                <motion.div custom={3} variants={fadeUp} className="rounded-xl border border-blue-400/15 bg-blue-400/[0.03] p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                      <Database className="h-4.5 w-4.5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{t.archOffchain}</h3>
                      <p className="text-[11px] text-muted-foreground">{t.archOffchainDesc}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {t.archItems.offchain.map((item) => (
                      <div key={item} className="flex items-center gap-2.5 rounded-lg bg-muted/15 border border-border/30 px-3 py-2">
                        <Server className="h-3 w-3 text-blue-400/60 shrink-0" />
                        <span className="text-[11px] font-medium text-foreground/80">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* On-chain */}
                <motion.div custom={4} variants={fadeUp} className="rounded-xl border border-primary/15 bg-primary/[0.03] p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Hexagon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{t.archOnchain}</h3>
                      <p className="text-[11px] text-muted-foreground">{t.archOnchainDesc}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {t.archItems.onchain.map((item) => (
                      <div key={item} className="flex items-center gap-2.5 rounded-lg bg-muted/15 border border-border/30 px-3 py-2">
                        <Hash className="h-3 w-3 text-primary/60 shrink-0" />
                        <span className="text-[11px] font-medium text-foreground/80">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Rule callout */}
              <motion.div custom={5} variants={fadeUp} className="flex items-start gap-3 rounded-xl bg-muted/10 border border-border/40 px-5 py-4">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[12px] text-muted-foreground leading-relaxed">{t.archRule}</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── OUTPUTS ── */}
        <section id="product" className="relative border-t border-border/40">
          <div className="absolute inset-0 bg-gradient-section" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="space-y-8">
              <div>
                <motion.p custom={0} variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                  {t.outputsLabel}
                </motion.p>
                <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-display">
                  {t.outputsTitle}
                </motion.h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {t.outputs.map((output, idx) => {
                  const Icon = output.icon;
                  const isTeal = output.color === "teal";
                  return (
                    <motion.div key={output.title} custom={idx + 2} variants={fadeUp}
                      className={`rounded-xl border p-6 transition-all duration-300 hover:shadow-card ${
                        isTeal
                          ? "border-primary/15 bg-primary/[0.03] hover:border-primary/25"
                          : "border-blue-400/15 bg-blue-400/[0.03] hover:border-blue-400/25"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isTeal ? "bg-primary/10 border border-primary/20" : "bg-blue-400/10 border border-blue-400/20"
                        }`}>
                          <Icon className={`h-4.5 w-4.5 ${isTeal ? "text-primary" : "text-blue-400"}`} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground font-display">{output.title}</h3>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{output.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── WHY PERU → US ── */}
        <section className="relative border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="space-y-8">
              <div>
                <motion.p custom={0} variants={fadeUp} className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                  {t.corridorLabel}
                </motion.p>
                <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-display">
                  {t.corridorTitle}
                </motion.h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {t.corridorItems.map((item, idx) => (
                  <motion.div key={item.label} custom={idx + 2} variants={fadeUp}
                    className="rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-300 hover:border-primary/20 hover:bg-card/80"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary mb-3" />
                    <p className="text-xs font-bold text-foreground leading-snug mb-1">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="relative rounded-2xl border border-primary/15 bg-gradient-cta overflow-hidden"
            >
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

              <div className="relative p-8 sm:p-12 lg:p-16">
                <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 mb-4">
                  <Triangle className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">ATRIA Protocol</span>
                </motion.div>
                <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-display max-w-2xl">
                  {t.finalTitle}
                </motion.h2>
                <motion.p custom={2} variants={fadeUp} className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                  {t.finalDesc}
                </motion.p>
                <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a href={`mailto:${t.finalSecondary}?subject=Pilot%20Request`}>
                    <Button className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-10 px-6 font-semibold shadow-glow-teal transition-all duration-300">
                      {t.finalPrimary}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                  <a href={`mailto:${t.finalSecondary}`}>
                    <Button variant="outline" className="rounded-lg border-border/60 text-sm h-10 px-6 font-medium hover:bg-muted/30 transition-all duration-300">
                      {t.finalSecondary}
                    </Button>
                  </a>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Triangle className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground font-display">ATRIA</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{t.footer}</p>
          <p className="text-[10px] text-muted-foreground/60">Built at TKS & Velocity · 2026</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
