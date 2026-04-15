/**
 * FinancingReadinessPanel.tsx
 *
 * Financing / Underwriting Readiness — second Decision Sentinel lens.
 *
 * Answers: "Is this consignment sufficiently verifiable for pre-shipment
 * financing, trade credit, or underwriting?"
 *
 * Distinct from Import Readiness:
 *  - Higher evidence sufficiency bar (70% vs 80%)
 *  - Critical document recency check (< 90 days)
 *  - Focuses on financial institution use-case, not customs clearance
 */

import { useState, useEffect } from "react";
import {
  DollarSign, ShieldCheck, ShieldAlert, AlertTriangle,
  FileText, Clock, CheckCircle2, XCircle,
  TrendingUp, Download, BarChart3, Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financingService } from "@/services/financingService";
import type { FinancingReadiness } from "@/types/consignment.types";

interface FinancingReadinessPanelProps {
  consignmentId: string;
  caseNumber: string;
  onExportPack?: () => void;
}

const THRESHOLDS = {
  evidence: 70,
  custody: 60,
  docAgeMaxDays: 90,
};

const DOC_LABELS: Record<string, string> = {
  phytosanitary_cert: "Phytosanitary Certificate",
  certificate_of_origin: "Certificate of Origin",
  bill_of_lading: "Bill of Lading",
  commercial_invoice: "Commercial Invoice",
  insurance_cert: "Insurance Certificate",
};

// ── Helper ────────────────────────────────────────────────────────────────────
function docAgeDays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function ScoreBar({
  label,
  value,
  threshold,
  unit = "%",
}: {
  label: string;
  value: number;
  threshold: number;
  unit?: string;
}) {
  const pass = value >= threshold;
  const pct = Math.min(100, value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-bold tabular-nums ${pass ? "text-emerald-600" : "text-red-600"}`}>
            {value}{unit}
          </span>
          <span className="text-muted-foreground">/ {threshold}{unit} threshold</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pass ? "bg-emerald-500" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Threshold marker */}
      <div className="relative h-0">
        <div
          className="absolute -top-2 w-0.5 h-3 bg-gray-400 rounded"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  );
}

function DocRow({
  docType,
  dateStr,
}: {
  docType: string;
  dateStr: string | null;
}) {
  const age = docAgeDays(dateStr);
  const hasDoc = dateStr !== null;
  const expired = age !== null && age > THRESHOLDS.docAgeMaxDays;
  const label = DOC_LABELS[docType] ?? docType.replace(/_/g, " ");

  let statusBadge;
  if (!hasDoc) {
    statusBadge = (
      <Badge variant="destructive" className="text-[10px] font-semibold">MISSING</Badge>
    );
  } else if (expired) {
    statusBadge = (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-semibold">
        EXPIRED ({age}d)
      </Badge>
    );
  } else {
    statusBadge = (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
        VALID
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-3 py-2.5 px-4 border-b border-gray-50 last:border-0
      ${!hasDoc ? "bg-red-50/40" : expired ? "bg-amber-50/30" : ""}`}>
      {!hasDoc || expired
        ? <XCircle className={`h-3.5 w-3.5 shrink-0 ${!hasDoc ? "text-red-500" : "text-amber-500"}`} />
        : <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
      }
      <span className="flex-1 text-xs font-medium text-foreground truncate">{label}</span>
      {hasDoc && (
        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
          {new Date(dateStr!).toISOString().split("T")[0]}
          {age !== null && <span className="ml-1 text-gray-400">({age}d ago)</span>}
        </span>
      )}
      {statusBadge}
    </div>
  );
}


// ── Main Component ─────────────────────────────────────────────────────────────
const FinancingReadinessPanel = ({
  consignmentId,
  caseNumber,
  onExportPack,
}: FinancingReadinessPanelProps) => {
  const [data, setData] = useState<FinancingReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    financingService.getFinancingReadiness(consignmentId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error ?? "Failed to load financing readiness");
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [consignmentId]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-28 rounded-lg bg-gray-100" />
        <div className="h-20 rounded-lg bg-gray-100" />
        <div className="h-40 rounded-lg bg-gray-100" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-medium text-foreground">Financing assessment unavailable</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {error ?? "Could not compute financing readiness. Check that evidence objects and handoffs are recorded."}
        </p>
      </div>
    );
  }

  const eligible = data.financing_eligible;
  const evidenceScore = data.evidence_sufficiency_score;
  const custodyScore = data.custody_continuity_score;
  const docRecency = data.critical_doc_recency ?? {};

  // ── Composite score (simple average of the two metrics) ──────────────────
  const compositeScore = Math.round((evidenceScore + custodyScore) / 2);

  return (
    <div className="space-y-4">

      {/* ── 1. Eligibility verdict ─────────────────────────────────────── */}
      <div className={`rounded-lg border-l-4 p-5 ${
        eligible
          ? "bg-emerald-50 border-emerald-500"
          : "bg-red-50 border-red-500"
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {eligible
              ? <ShieldCheck className="h-7 w-7 text-emerald-600" />
              : <ShieldAlert className="h-7 w-7 text-red-600" />
            }
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Financing / Underwriting Readiness
              </div>
              <div className={`text-2xl font-bold tracking-tight mt-0.5 ${
                eligible ? "text-emerald-800" : "text-red-800"
              }`}>
                {eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Case {caseNumber} · Composite score: {compositeScore}%
              </div>
            </div>
          </div>

          {/* Score dial */}
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
              eligible
                ? "border-emerald-400 bg-white text-emerald-700"
                : "border-red-300 bg-white text-red-700"
            }`}>
              <span className="text-xl font-bold tabular-nums">{compositeScore}</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 font-mono">/ 100</span>
          </div>
        </div>
      </div>

      {/* ── 2. Score bars ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Scoring Breakdown
          </h3>
        </div>
        <ScoreBar
          label="Evidence Sufficiency"
          value={evidenceScore}
          threshold={THRESHOLDS.evidence}
        />
        <ScoreBar
          label="Custody Continuity"
          value={custodyScore}
          threshold={THRESHOLDS.custody}
        />
        {data.unresolved_exception_count > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {data.unresolved_exception_count} unresolved blocking exception
            {data.unresolved_exception_count !== 1 ? "s" : ""} — automatic disqualifier
          </div>
        )}
      </div>

      {/* ── 3. Critical document recency table ─────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Critical Document Recency
          </h3>
          <span className="ml-auto text-[10px] text-muted-foreground">
            Max age: {THRESHOLDS.docAgeMaxDays} days
          </span>
        </div>
        {Object.entries(docRecency).map(([docType, dateStr]) => (
          <DocRow key={docType} docType={docType} dateStr={dateStr} />
        ))}
        {Object.keys(docRecency).length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No critical document records found for this consignment.
          </div>
        )}
      </div>

      {/* ── 4. Eligibility reasons / disqualifiers ─────────────────────── */}
      {(data.eligibility_reasons.length > 0 || data.disqualifiers.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Qualifying factors */}
          {data.eligibility_reasons.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  Qualifying Factors
                </span>
              </div>
              <ul className="space-y-1.5">
                {data.eligibility_reasons.map((r, i) => (
                  <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disqualifiers */}
          {data.disqualifiers.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                  Disqualifiers
                </span>
              </div>
              <ul className="space-y-1.5">
                {data.disqualifiers.map((d, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">✕</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Thresholds reference ─────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Underwriting Thresholds
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Evidence min", value: `${THRESHOLDS.evidence}%` },
            { label: "Custody min", value: `${THRESHOLDS.custody}%` },
            { label: "Doc max age", value: `${THRESHOLDS.docAgeMaxDays} days` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-sm font-bold text-foreground tabular-nums">{value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Export CTA ──────────────────────────────────────────────── */}
      <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${
        eligible
          ? "border-emerald-200 bg-emerald-50/20"
          : "border-gray-200 bg-gray-50"
      }`}>
        <div className="flex items-center gap-3">
          <TrendingUp className={`h-5 w-5 ${eligible ? "text-emerald-600" : "text-muted-foreground"}`} />
          <div>
            <div className="text-sm font-semibold text-foreground">
              {eligible ? "Ready to share with financier" : "Resolve issues before sharing"}
            </div>
            <div className="text-xs text-muted-foreground">
              {eligible
                ? "Generate an Evidence Pack and send the Merkle hash to your lender for verification."
                : "Fix the disqualifiers above to unlock financing eligibility."}
            </div>
          </div>
        </div>
        {onExportPack && (
          <Button
            size="sm"
            variant={eligible ? "default" : "outline"}
            disabled={!eligible}
            onClick={onExportPack}
            className={eligible ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Generate Pack
          </Button>
        )}
      </div>

    </div>
  );
};

export default FinancingReadinessPanel;
