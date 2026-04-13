import { useState } from "react";
import {
  Package, Loader2, CheckCircle2, ShieldCheck,
  ExternalLink, Copy, AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { logger } from "@/utils/logger";
import { evidenceService } from "@/services/evidenceService";
import { hederaService } from "@/services/hederaService";
import { isHederaConfigured, getHashScanUrl } from "@/config/hedera";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { DecisionContext } from "@/types/consignment.types";

interface GeneratePackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consignmentId: string;
  caseNumber: string;
  importReady: boolean;
  financingReady: boolean;
  onSuccess?: () => void;
}

type GenerationStep =
  | "idle"
  | "generating_pack"
  | "anchoring"
  | "updating_status"
  | "done";

interface PackResult {
  packHash: string;
  version: number;
  evidenceCount: number;
  attestationCount: number;
  anchored: boolean;
  transactionId?: string;
  sequenceNumber?: number;
  hashScanUrl?: string;
}

const GeneratePackDialog = ({
  open,
  onOpenChange,
  consignmentId,
  caseNumber,
  importReady,
  financingReady,
  onSuccess,
}: GeneratePackDialogProps) => {
  const { user } = useAuth();
  const [decisionContext, setDecisionContext] = useState<DecisionContext>("import_readiness");
  const [step, setStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PackResult | null>(null);

  const isImportContext = decisionContext === "import_readiness";
  const contextReady = isImportContext ? importReady : financingReady;
  const generating = step !== "idle" && step !== "done";

  const stepLabel: Record<GenerationStep, string> = {
    idle: "",
    generating_pack: "Computing evidence pack…",
    anchoring: "Anchoring to Hedera HCS…",
    updating_status: "Finalizing…",
    done: "Done",
  };

  // ── COPY HASH ──────────────────────────────────────────────────────────
  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success("Hash copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  // ── SAVE PACK HASH TO DB (when Hedera is not configured) ───────────────
  const savePackHashToDB = async (
    packHash: string,
    packVersion: number
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("consignment_cases")
      .update({
        pack_status: "fresh",
        pack_requested_at: new Date().toISOString(),
      })
      .eq("id", consignmentId);
    if (error) {
      logger.error("pack.db_update_failed", { consignment_id: consignmentId }, error);
      return false;
    }
    return true;
  };

  // ── MAIN GENERATION FLOW ───────────────────────────────────────────────
  const handleGenerate = async () => {
    setStep("generating_pack");
    setError(null);
    setResult(null);

    try {
      // ── STEP 1: Generate evidence pack (compute Merkle root off-chain) ──
      logger.info("pack.generation_started", {
        consignment_id: consignmentId,
        decision_context: decisionContext,
      });

      const packResult = await evidenceService.generateEvidencePack(consignmentId);

      if (!packResult.success || !packResult.data) {
        throw new Error(packResult.error || "Failed to generate evidence pack");
      }

      const pack = packResult.data;

      // Validate pack has at least some evidence
      if (pack.evidence_count === 0) {
        throw new Error(
          "No evidence objects found for this consignment. Upload at least one document before generating a pack."
        );
      }

      logger.info("pack.computed", {
        consignment_id: consignmentId,
        root_hash: pack.root_hash,
        evidence_count: pack.evidence_count,
        version: pack.version,
      });

      let packResult2: PackResult = {
        packHash: pack.root_hash,
        version: pack.version,
        evidenceCount: pack.evidence_count,
        attestationCount: pack.attestation_count,
        anchored: false,
      };

      // ── STEP 2: Anchor to Hedera (if configured) ──────────────────────
      if (isHederaConfigured()) {
        setStep("anchoring");

        const anchorResult = await hederaService.anchorEvidencePack({
          consignment_id: consignmentId,
          case_number: caseNumber,
          pack_hash: pack.root_hash,
          pack_version: pack.version,
          input_hashes: pack.input_hashes,
          evidence_count: pack.evidence_count,
          attestation_count: pack.attestation_count,
          decision_context: decisionContext,
          anchored_by: user?.id || "system",
        });

        if (anchorResult.success && anchorResult.data) {
          const proof = anchorResult.data;
          packResult2 = {
            ...packResult2,
            anchored: proof.status === "anchored" || proof.status === "verified",
            transactionId: proof.transaction_id || undefined,
            sequenceNumber: proof.sequence_number || undefined,
            hashScanUrl: proof.transaction_id
              ? getHashScanUrl(proof.transaction_id)
              : undefined,
          };

          logger.info("pack.anchored", {
            consignment_id: consignmentId,
            transaction_id: proof.transaction_id,
            sequence_number: proof.sequence_number,
          });
        } else {
          // Non-fatal: pack is generated, anchoring pending
          logger.warn("pack.anchor_pending", {
            consignment_id: consignmentId,
            error: anchorResult.error,
          });
          packResult2.anchored = false;
        }
      } else {
        // Hedera not configured — save as fresh pack to DB
        setStep("updating_status");
        await savePackHashToDB(pack.root_hash, pack.version);
      }

      // ── STEP 3: Finalize ──────────────────────────────────────────────
      setStep("updating_status");

      if (!isHederaConfigured()) {
        await supabase
          .from("consignment_cases")
          .update({ pack_status: "fresh", pack_requested_at: new Date().toISOString() })
          .eq("id", consignmentId);
      }

      setResult(packResult2);
      setStep("done");

      const anchorLabel = packResult2.anchored
        ? "anchored on Hedera HCS"
        : "generated (pending anchor)";

      toast.success(`Evidence pack ${anchorLabel} — v${pack.version}`);

      logger.info("pack.generation_complete", {
        consignment_id: consignmentId,
        pack_hash: packResult2.packHash,
        anchored: packResult2.anchored,
        version: pack.version,
      });
    } catch (err: any) {
      logger.error("pack.generation_failed", { consignment_id: consignmentId }, err);
      setError(err.message || "Generation failed. Please try again.");
      setStep("idle");
    }
  };

  const handleClose = () => {
    if (generating) return;
    if (step === "done") {
      onSuccess?.();
    }
    setStep("idle");
    setError(null);
    setResult(null);
    setDecisionContext("import_readiness");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Generate Evidence Pack
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a cryptographically verifiable evidence pack for{" "}
            <span className="font-semibold text-foreground">{caseNumber}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* ── SUCCESS STATE ─────────────────────────────────────────────── */}
        {step === "done" && result && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-secondary font-semibold text-sm">
                <CheckCircle2 className="h-4.5 w-4.5" />
                Pack generated successfully
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1 font-medium">Pack Hash (SHA-256 Merkle root)</p>
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <p className="font-mono text-foreground break-all flex-1">{result.packHash}</p>
                    <button
                      onClick={() => copyHash(result.packHash)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted rounded-lg px-3 py-2 text-center">
                    <p className="text-muted-foreground">Version</p>
                    <p className="font-bold text-foreground">v{result.version}</p>
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-center">
                    <p className="text-muted-foreground">Evidence</p>
                    <p className="font-bold text-foreground">{result.evidenceCount}</p>
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-center">
                    <p className="text-muted-foreground">Attestations</p>
                    <p className="font-bold text-foreground">{result.attestationCount}</p>
                  </div>
                </div>

                {result.anchored && result.transactionId && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Anchored on Hedera Hashgraph
                    </div>
                    <p className="text-muted-foreground">Sequence: #{result.sequenceNumber}</p>
                    <p className="font-mono text-[10px] text-muted-foreground break-all">{result.transactionId}</p>
                    {result.hashScanUrl && (
                      <a
                        href={result.hashScanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium hover:underline"
                      >
                        View on HashScan
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {!result.anchored && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 text-xs">
                    <p className="font-semibold">Pending anchor</p>
                    <p className="text-amber-600 mt-0.5">
                      {isHederaConfigured()
                        ? "HCS submission will be retried automatically."
                        : "Configure VITE_HEDERA_* env vars to enable Hedera anchoring."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Third parties can verify this pack at <span className="font-semibold">/verify-pack</span>
            </p>
          </div>
        )}

        {/* ── GENERATING STATE ─────────────────────────────────────────── */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">{stepLabel[step]}</p>
            <div className="flex gap-1">
              {(["generating_pack", "anchoring", "updating_status"] as GenerationStep[]).map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === s ? "w-6 bg-primary" :
                    ["anchoring", "updating_status"].includes(step) && s === "generating_pack" ? "w-3 bg-primary/40" :
                    "w-3 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── FORM STATE ───────────────────────────────────────────────── */}
        {step === "idle" && (
          <div className="space-y-4 py-4">
            {/* Decision Context */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Decision Context</Label>
              <RadioGroup
                value={decisionContext}
                onValueChange={(v) => setDecisionContext(v as DecisionContext)}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="import_readiness" id="import" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="import" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      Import Readiness
                      {importReady && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      For customs clearance, regulatory compliance
                    </p>
                    {!importReady && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Consignment has not met import readiness criteria
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="financing_readiness" id="financing" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="financing" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      Underwriting Readiness
                      {financingReady && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      For financing and underwriting evaluation
                    </p>
                    {!financingReady && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Consignment has not met underwriting criteria
                      </p>
                    )}
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Warning if context not ready */}
            {!contextReady && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-700 font-medium">
                  Warning: not all {isImportContext ? "import" : "underwriting"} criteria are met.
                  The generated pack may be rejected by third-party verifiers.
                  Resolve exceptions and increase completeness before generating.
                </p>
              </div>
            )}

            {/* Pack contents preview */}
            <div className="rounded-lg bg-muted p-3 space-y-1.5">
              <p className="text-xs font-medium text-foreground">Pack will include:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 ml-4 list-disc">
                <li>All attached evidence objects (SHA-256 hashed)</li>
                <li>Attestations and attributions</li>
                <li>Custody chain records</li>
                <li>Current state snapshot</li>
                <li>Decision readiness assessment</li>
                <li>Merkle root hash (deterministic)</li>
                {isHederaConfigured() && (
                  <li className="text-emerald-700 font-medium">
                    Anchored to Hedera HCS (immutable timestamp)
                  </li>
                )}
              </ul>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-xs text-destructive font-medium">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "done" ? (
            <Button onClick={handleClose} className="text-sm w-full sm:w-auto">
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={generating} className="text-sm">
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generating} className="text-sm">
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    {stepLabel[step]}
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-3.5 w-3.5" />
                    Generate Pack
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratePackDialog;
