import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
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
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

/* ── State machine definition ── */
const states = [
  { id: "draft", color: "bg-muted-foreground/20 text-muted-foreground" },
  { id: "evidence_collecting", color: "bg-blue-500/15 text-blue-600" },
  { id: "docs_complete", color: "bg-amber-500/15 text-amber-700" },
  { id: "custody_continuous", color: "bg-violet-500/15 text-violet-600" },
  { id: "import_ready", color: "bg-secondary/15 text-secondary" },
  { id: "released", color: "bg-emerald-500/15 text-emerald-700" },
];

/* ── Evidence model dimensions ── */
const evidenceDimensions = {
  es: [
    { label: "Evidence Completeness", value: 94, desc: "Documentos y certificados presentes vs. requeridos" },
    { label: "Attribution Strength", value: 88, desc: "Firmas y attestations vinculadas a actores" },
    { label: "Custody Continuity", value: 100, desc: "Cadena de custodia sin gaps temporales" },
    { label: "Decision Readiness", value: 91, desc: "Score compuesto para decisión de importación" },
  ],
  en: [
    { label: "Evidence Completeness", value: 94, desc: "Documents and certificates present vs. required" },
    { label: "Attribution Strength", value: 88, desc: "Signatures and attestations linked to actors" },
    { label: "Custody Continuity", value: 100, desc: "Chain of custody with zero time gaps" },
    { label: "Decision Readiness", value: 91, desc: "Composite score for import decision" },
  ],
};

const content = {
  es: {
    badge: "Infraestructura de cumplimiento para exportación perecible",
    headline: "Estado verificable para consignaciones de exportación",
    subheadline:
      "Transforma evidencia comercial fragmentada en evidence packs portables, verificables y listos para decisión para envíos perecibles regulados.",
    ctaPrimary: "Solicitar piloto",
    ctaSecondary: "Ver demo",
    proofs: ["Evidence-first", "Readiness-based", "Portable verification"],
    problemTitle:
      "Los sistemas comerciales ya producen trazas. Fallan al producir evidencia bajo presión.",
    problems: [
      {
        title: "Evidencia fragmentada",
        desc: "Documentos dispersos entre productores, exportadores y agentes sin reconciliación.",
      },
      {
        title: "Reconstrucción manual",
        desc: "Auditorías y disputas requieren re-armar el caso desde cero cada vez.",
      },
      {
        title: "Costo de demoras",
        desc: "Retenciones, rechazos y ventanas perdidas por evidencia insuficiente o tardía.",
      },
    ],
    howLabel: "Cómo funciona",
    howTitle: "Flujo operativo en 4 pasos",
    howSteps: [
      { num: "01", title: "Capture evidence", desc: "Documentos, fotos y certificados ingestados desde origen." },
      { num: "02", title: "Link attestations", desc: "Actores firman y vinculan evidencia a la consignación." },
      { num: "03", title: "Compute readiness", desc: "Score de completeness, continuidad de custodia y excepciones." },
      { num: "04", title: "Generate pack", desc: "Evidence pack portable con hashes verificables por terceros." },
    ],
    stateTitle: "State Machine",
    stateSubtitle: "Cada consignación transita estados computables — nunca opiniones",
    stateConditions: "import_ready requiere: completeness > 90%, zero blocking exceptions, custody_continuity = true",
    evidenceTitle: "Modelo de evidencia",
    evidenceSubtitle: "No es un score. Son 4 dimensiones independientes — reducirlas a un número destruye el valor.",
    archTitle: "Arquitectura híbrida",
    archSubtitle: "Blockchain = integridad. No = sistema operativo.",
    archOffchain: "Off-chain",
    archOffchainDesc: "Supabase DB · Storage · Logs · Evidencia operativa",
    archOnchain: "On-chain",
    archOnchainDesc: "Hashes · Snapshots · Anchors · Verificación por terceros",
    archRule: "Los datos viven off-chain. Solo los hashes y anchors se publican on-chain para integridad verificable.",
    outputsTitle: "Salidas del sistema",
    outputs: [
      {
        title: "Verifiable State",
        desc: "Snapshot operativo con completeness, custody continuity, excepciones y estado de decisión.",
      },
      {
        title: "Evidence Pack",
        desc: "Artefacto portable con evidencia reconciliada, attestations y hashes verificables por terceros.",
      },
    ],
    corridorTitle: "Por qué Perú → US primero",
    corridorItems: [
      "Corredor regulado",
      "Tratamiento auditable",
      "Alta perecibilidad",
      "Presión en ventanas de exportación",
      "Anchors digitales verificables",
    ],
    finalTitle: "Listo para evaluación de piloto",
    finalDesc:
      "Si operas en cumplimiento, importación o underwriting, podemos revisar tu flujo actual y configurar una prueba controlada.",
    finalPrimary: "Solicitar piloto",
    finalSecondary: "Escribir a pilot@mangochain.io",
    footer: "MangoChain · Consignments · Evidence · Readiness · Verification",
    mockup: {
      title: "Operations Overview",
      kpis: [
        { label: "Consignments", value: "24" },
        { label: "Readiness", value: "87%" },
        { label: "Exceptions", value: "2" },
      ],
      pipeline: [
        { label: "Draft", count: 3, color: "bg-muted-foreground/20" },
        { label: "In review", count: 8, color: "bg-amber-500/20 text-amber-700" },
        { label: "Import-ready", count: 11, color: "bg-secondary/20 text-secondary" },
        { label: "Blocked", count: 2, color: "bg-destructive/20 text-destructive" },
      ],
      exceptions: [
        { id: "EX-041", text: "Missing phyto cert", severity: "blocking" },
        { id: "EX-039", text: "Custody gap 14h", severity: "warning" },
      ],
      packBadge: "Pack verified",
    },
  },
  en: {
    badge: "Compliance infrastructure for perishable export",
    headline: "Verifiable state for export consignments",
    subheadline:
      "Transform fragmented trade evidence into portable, decision-ready evidence packs for regulated perishable shipments.",
    ctaPrimary: "Request pilot",
    ctaSecondary: "View demo",
    proofs: ["Evidence-first", "Readiness-based", "Portable verification"],
    problemTitle:
      "Trade systems already produce traces. They fail at producing evidence under pressure.",
    problems: [
      {
        title: "Fragmented evidence",
        desc: "Documents scattered across producers, exporters and agents with no reconciliation.",
      },
      {
        title: "Manual reconstruction",
        desc: "Audits and disputes require re-assembling the case from scratch every time.",
      },
      {
        title: "Cost of delays",
        desc: "Holds, rejections and missed windows due to insufficient or late evidence.",
      },
    ],
    howLabel: "How it works",
    howTitle: "4-step operational flow",
    howSteps: [
      { num: "01", title: "Capture evidence", desc: "Documents, photos and certs ingested from origin." },
      { num: "02", title: "Link attestations", desc: "Actors sign and link evidence to the consignment." },
      { num: "03", title: "Compute readiness", desc: "Completeness score, custody continuity and exceptions." },
      { num: "04", title: "Generate pack", desc: "Portable evidence pack with third-party verifiable hashes." },
    ],
    stateTitle: "State Machine",
    stateSubtitle: "Each consignment transits computable states — never opinions",
    stateConditions: "import_ready requires: completeness > 90%, zero blocking exceptions, custody_continuity = true",
    evidenceTitle: "Evidence Model",
    evidenceSubtitle: "Not a score. Four independent dimensions — reducing them to a single number destroys the value.",
    archTitle: "Hybrid Architecture",
    archSubtitle: "Blockchain = integrity. Not = operating system.",
    archOffchain: "Off-chain",
    archOffchainDesc: "Supabase DB · Storage · Logs · Operational evidence",
    archOnchain: "On-chain",
    archOnchainDesc: "Hashes · Snapshots · Anchors · Third-party verification",
    archRule: "Data lives off-chain. Only hashes and anchors are published on-chain for verifiable integrity.",
    outputsTitle: "System outputs",
    outputs: [
      {
        title: "Verifiable State",
        desc: "Operational snapshot with completeness, custody continuity, exceptions and decision state.",
      },
      {
        title: "Evidence Pack",
        desc: "Portable artifact with reconciled evidence, attestations and third-party verifiable hashes.",
      },
    ],
    corridorTitle: "Why Peru → US first",
    corridorItems: [
      "Regulated corridor",
      "Auditable treatment",
      "Perishability",
      "Export timing pressure",
      "Real digital anchors",
    ],
    finalTitle: "Ready for pilot evaluation",
    finalDesc:
      "If you operate in compliance, import review or underwriting, we can assess your current process and launch a controlled pilot.",
    finalPrimary: "Request pilot",
    finalSecondary: "Contact pilot@mangochain.io",
    footer: "MangoChain · Consignments · Evidence · Readiness · Verification",
    mockup: {
      title: "Operations Overview",
      kpis: [
        { label: "Consignments", value: "24" },
        { label: "Readiness", value: "87%" },
        { label: "Exceptions", value: "2" },
      ],
      pipeline: [
        { label: "Draft", count: 3, color: "bg-muted-foreground/20" },
        { label: "In review", count: 8, color: "bg-amber-500/20 text-amber-700" },
        { label: "Import-ready", count: 11, color: "bg-secondary/20 text-secondary" },
        { label: "Blocked", count: 2, color: "bg-destructive/20 text-destructive" },
      ],
      exceptions: [
        { id: "EX-041", text: "Missing phyto cert", severity: "blocking" },
        { id: "EX-039", text: "Custody gap 14h", severity: "warning" },
      ],
      packBadge: "Pack verified",
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── HERO ── */}
        <section id="hero" className="pt-14 pb-16 sm:pt-20 sm:pb-24">
          <motion.div
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          >
            {/* Left column */}
            <div>
              <motion.span
                custom={0}
                variants={fadeUp}
                className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t.badge}
              </motion.span>

              <motion.h1
                custom={1}
                variants={fadeUp}
                className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-foreground font-display leading-[1.1] tracking-tight"
              >
                {t.headline}
              </motion.h1>

              <motion.p
                custom={2}
                variants={fadeUp}
                className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg"
              >
                {t.subheadline}
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="mt-7 flex flex-col sm:flex-row gap-2.5">
                <a href="mailto:pilot@mangochain.io?subject=Pilot%20Request">
                  <Button className="rounded-lg bg-foreground text-background hover:bg-foreground/90 text-sm h-9 px-5">
                    {t.ctaPrimary}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </a>
                <Link to="/verify-pack">
                  <Button variant="outline" className="rounded-lg border-border text-sm h-9 px-5">
                    {t.ctaSecondary}
                  </Button>
                </Link>
              </motion.div>

              <motion.div custom={4} variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
                {t.proofs.map((p) => (
                  <span key={p} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-secondary" />
                    {p}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right column — Product Mockup */}
            <motion.div custom={2} variants={fadeUp} className="hidden lg:block">
              <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                  <span className="text-xs font-semibold text-foreground">{t.mockup.title}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {t.mockup.packBadge}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* KPI strip */}
                  <div className="grid grid-cols-3 gap-2">
                    {t.mockup.kpis.map((kpi) => (
                      <div key={kpi.label} className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                        <p className="text-lg font-bold text-foreground font-display leading-none">{kpi.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{kpi.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* State machine mini */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">State Machine</p>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {states.map((s, idx) => (
                        <div key={s.id} className="flex items-center shrink-0">
                          <span className={`text-[9px] font-mono font-semibold rounded px-1.5 py-0.5 ${s.color}`}>
                            {s.id}
                          </span>
                          {idx < states.length - 1 && (
                            <ChevronRight className="h-2.5 w-2.5 text-border mx-0.5 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline mini */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pipeline</p>
                    <div className="space-y-1">
                      {t.mockup.pipeline.map((s) => (
                        <div key={s.label} className="flex items-center justify-between">
                          <span className={`text-[11px] font-medium rounded px-1.5 py-0.5 ${s.color}`}>{s.label}</span>
                          <span className="text-xs font-bold text-foreground">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exception list mini */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Exceptions</p>
                    <div className="space-y-1">
                      {t.mockup.exceptions.map((ex) => (
                        <div key={ex.id} className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] ${
                          ex.severity === "blocking"
                            ? "border-destructive/30 bg-destructive/5 text-destructive"
                            : "border-amber-500/30 bg-amber-500/5 text-amber-700"
                        }`}>
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span className="font-mono font-semibold">{ex.id}</span>
                          <span className="truncate">{ex.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="pb-16 sm:pb-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-start">
              <motion.h2 custom={0} variants={fadeUp} className="text-xl sm:text-2xl font-bold text-foreground font-display leading-snug">
                {t.problemTitle}
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {t.problems.map((p, idx) => {
                  const Icon = problemIcons[idx];
                  return (
                    <motion.div key={p.title} custom={idx + 1} variants={fadeUp} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                      <Icon className="h-5 w-5 text-muted-foreground mb-3" />
                      <h3 className="text-sm font-bold text-foreground mb-1">{p.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="pb-16 sm:pb-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
            <div>
              <motion.p custom={0} variants={fadeUp} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.howLabel}
              </motion.p>
              <motion.h2 custom={1} variants={fadeUp} className="mt-1 text-2xl sm:text-3xl font-bold text-foreground font-display">
                {t.howTitle}
              </motion.h2>
            </div>

            <div className="relative">
              {/* Connector line — desktop */}
              <div className="hidden lg:block absolute top-6 left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] h-px bg-border" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {t.howSteps.map((step, idx) => {
                  const Icon = stepIcons[idx];
                  return (
                    <motion.div key={step.num} custom={idx + 2} variants={fadeUp} className="relative rounded-xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-foreground" />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{step.num}</span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── STATE MACHINE ── */}
        <section id="state-machine" className="pb-16 sm:pb-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5">
            <div>
              <motion.p custom={0} variants={fadeUp} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.stateTitle}
              </motion.p>
              <motion.h2 custom={1} variants={fadeUp} className="mt-1 text-2xl sm:text-3xl font-bold text-foreground font-display">
                {t.stateSubtitle}
              </motion.h2>
            </div>

            <motion.div custom={2} variants={fadeUp} className="rounded-xl border border-border bg-card p-6 shadow-sm overflow-x-auto">
              {/* State flow visual */}
              <div className="flex items-center gap-2 min-w-max pb-2">
                {states.map((s, idx) => (
                  <div key={s.id} className="flex items-center">
                    <div className={`rounded-lg border border-border px-3 py-2 ${s.color}`}>
                      <span className="text-xs font-mono font-bold whitespace-nowrap">{s.id}</span>
                    </div>
                    {idx < states.length - 1 && (
                      <div className="flex items-center mx-1">
                        <div className="w-6 h-px bg-border" />
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground -ml-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md bg-muted/40 border border-border px-3 py-2">
                <p className="text-[11px] font-mono text-muted-foreground">{t.stateConditions}</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── EVIDENCE MODEL ── */}
        <section id="evidence-model" className="pb-16 sm:pb-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5">
            <div>
              <motion.h2 custom={0} variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-foreground font-display">
                {t.evidenceTitle}
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="mt-1 text-sm text-muted-foreground max-w-2xl">
                {t.evidenceSubtitle}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dims.map((dim, idx) => (
                <motion.div key={dim.label} custom={idx + 2} variants={fadeUp} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{dim.label}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted mb-2">
                    <div
                      className={`h-full rounded-full ${dim.value === 100 ? "bg-secondary" : dim.value >= 90 ? "bg-blue-500" : "bg-amber-500"}`}
                      style={{ width: `${dim.value}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground font-display">{dim.value}%</span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{dim.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── HYBRID ARCHITECTURE ── */}
        <section id="architecture" className="pb-16 sm:pb-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5">
            <div>
              <motion.h2 custom={0} variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-foreground font-display">
                {t.archTitle}
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="mt-1 text-sm text-muted-foreground">
                {t.archSubtitle}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Off-chain */}
              <motion.div custom={2} variants={fadeUp} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Database className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{t.archOffchain}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.archOffchainDesc}</p>
                <div className="mt-4 space-y-1.5">
                  {["Supabase PostgreSQL", "Storage (docs, photos)", "Event logs", "Evidence objects"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Server className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-medium text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* On-chain */}
              <motion.div custom={3} variants={fadeUp} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{t.archOnchain}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.archOnchainDesc}</p>
                <div className="mt-4 space-y-1.5">
                  {["Evidence pack hashes", "State snapshots", "Anchors (IPFS CID / tx hash)", "Third-party verify"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-medium text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div custom={4} variants={fadeUp} className="rounded-md bg-muted/40 border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{t.archRule}</p>
            </motion.div>
          </motion.div>
        </section>

        {/* ── OUTPUTS ── */}
        <section id="product" className="pb-16 sm:pb-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5">
            <motion.h2 custom={0} variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {t.outputsTitle}
            </motion.h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {t.outputs.map((output, idx) => (
                <motion.div key={output.title} custom={idx + 1} variants={fadeUp} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    {idx === 0 ? <ShieldCheck className="h-5 w-5 text-secondary" /> : <FileCheck2 className="h-5 w-5 text-primary" />}
                    <h3 className="text-lg font-bold text-foreground font-display">{output.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{output.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── WHY PERU → US ── */}
        <section className="pb-16 sm:pb-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5">
            <motion.h2 custom={0} variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {t.corridorTitle}
            </motion.h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {t.corridorItems.map((item, idx) => (
                <motion.div key={item} custom={idx + 1} variants={fadeUp} className="rounded-lg border border-border bg-muted/30 p-3.5">
                  <CheckCircle2 className="h-4 w-4 text-secondary mb-2" />
                  <p className="text-xs font-semibold text-foreground leading-snug">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="pb-16 sm:pb-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-foreground/[0.03] p-7 sm:p-10"
          >
            <motion.h2 custom={0} variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {t.finalTitle}
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {t.finalDesc}
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <a href="mailto:pilot@mangochain.io?subject=Pilot%20Request">
                <Button className="rounded-lg bg-foreground text-background hover:bg-foreground/90 text-sm h-9 px-5">
                  {t.finalPrimary}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </a>
              <a href="mailto:pilot@mangochain.io">
                <Button variant="outline" className="rounded-lg border-border text-sm h-9 px-5">
                  {t.finalSecondary}
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border py-5 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] text-muted-foreground text-center">{t.footer}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
