import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Hash,
  Anchor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hederaService } from "@/services/hederaService";
import { getHashScanUrl, getTopicHashScanUrl, isHederaConfigured } from "@/config/hedera";
import { logger } from "@/utils/logger";
import type { TrustProof, MirrorNodeVerification } from "@/types/hedera.types";

interface TrustProofCardProps {
  consignmentId: string;
  caseNumber: string;
  onAnchorComplete?: () => void;
}

const STATUS_CONFIG: Record<string, { icon: any; label: string; className: string }> = {
  pending: { icon: Clock, label: "Pending", className: "text-amber-600 border-amber-300 bg-amber-50" },
  pending_anchor: { icon: Loader2, label: "Submitting", className: "text-blue-600 border-blue-300 bg-blue-50" },
  anchored: { icon: ShieldCheck, label: "Anchored", className: "text-emerald-700 border-emerald-300 bg-emerald-50" },
  failed: { icon: ShieldAlert, label: "Failed", className: "text-red-600 border-red-300 bg-red-50" },
  verified: { icon: ShieldCheck, label: "Verified", className: "text-emerald-700 border-emerald-400 bg-emerald-50" },
};

const TrustProofCard = ({ consignmentId, caseNumber, onAnchorComplete }: TrustProofCardProps) => {
  const [proofs, setProofs] = useState<TrustProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchoring, setAnchoring] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<MirrorNodeVerification | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    loadProofs();
  }, [consignmentId]);

  const loadProofs = async () => {
    setLoading(true);
    const result = await hederaService.getConsignmentProofs(consignmentId);
    if (result.success && result.data) {
      setProofs(result.data);
    }
    setLoading(false);
  };

  const handleAnchor = async () => {
    setAnchoring(true);
    try {
      // Compute pack hash first
      const hashResult = await hederaService.computePackHash(consignmentId);
      if (!hashResult.success || !hashResult.data) {
        logger.error("trustProof.hash_failed", { consignment_id: consignmentId });
        return;
      }

      const latestVersion = proofs.length > 0 ? Math.max(...proofs.map(p => p.pack_version)) : 0;

      const result = await hederaService.anchorEvidencePack({
        consignment_id: consignmentId,
        case_number: caseNumber,
        pack_hash: hashResult.data.packHash,
        pack_version: latestVersion + 1,
        input_hashes: hashResult.data.inputHashes,
        evidence_count: hashResult.data.evidenceCount,
        attestation_count: hashResult.data.attestationCount,
        anchored_by: "system",
      });

      if (result.success) {
        await loadProofs();
        onAnchorComplete?.();
      }
    } catch (err: any) {
      logger.error("trustProof.anchor_failed", { consignment_id: consignmentId }, err);
    }
    setAnchoring(false);
  };

  const handleVerify = async (proofId: string) => {
    setVerifying(true);
    const result = await hederaService.verifyProof(proofId);
    if (result.success && result.data) {
      setVerification(result.data);
      await loadProofs();
    }
    setVerifying(false);
  };

  const copyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const latestProof = proofs.length > 0 ? proofs[0] : null;
  const isAnchored = latestProof?.status === "anchored" || latestProof?.status === "verified";
  const hederaReady = isHederaConfigured();

  if (loading) {
    return (
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Cryptographic Integrity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading trust proofs...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Cryptographic Integrity
          </CardTitle>
          {latestProof && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${STATUS_CONFIG[latestProof.status]?.className || ""}`}
            >
              {STATUS_CONFIG[latestProof.status]?.label || latestProof.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* No proofs yet */}
        {proofs.length === 0 && (
          <div className="text-center py-6">
            <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-3">
              No evidence pack has been anchored yet.
              {!hederaReady && (
                <span className="block mt-1 text-amber-600">
                  Hedera is not configured. Set environment variables to enable anchoring.
                </span>
              )}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnchor}
              disabled={anchoring}
              className="text-xs"
            >
              {anchoring ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Anchoring...
                </>
              ) : (
                <>
                  <Anchor className="mr-1.5 h-3 w-3" />
                  Anchor Evidence Pack
                </>
              )}
            </Button>
          </div>
        )}

        {/* Latest proof details */}
        {latestProof && (
          <div className="space-y-3">
            {/* Hash display */}
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Evidence Pack Hash
                </span>
                <button
                  onClick={() => copyHash(latestProof.pack_hash)}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  {copiedHash ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                  {copiedHash ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[10px] font-mono text-foreground break-all leading-relaxed">
                {latestProof.pack_hash}
              </p>
            </div>

            {/* Hedera metadata */}
            {isAnchored && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Topic</span>
                  <a
                    href={getTopicHashScanUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-mono"
                  >
                    {latestProof.topic_id}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                {latestProof.sequence_number && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Sequence #</span>
                    <span className="font-mono text-foreground">{latestProof.sequence_number}</span>
                  </div>
                )}
                {latestProof.transaction_id && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Transaction</span>
                    <a
                      href={getHashScanUrl(latestProof.transaction_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-mono text-[10px]"
                    >
                      {latestProof.transaction_id.slice(0, 20)}...
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}
                {latestProof.anchored_at && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Consensus Time</span>
                    <span className="font-mono text-foreground text-[10px]">
                      {new Date(latestProof.anchored_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Verification badge */}
            {latestProof.status === "verified" && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-700">
                    Cryptographically Verified on Hedera
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    Hash confirmed via Mirror Node. This evidence pack has not been modified since anchoring.
                  </p>
                </div>
              </div>
            )}

            {/* Pending/failed states */}
            {latestProof.status === "pending_anchor" && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-700 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Submission in progress. The consignment remains operational.
                </p>
              </div>
            )}

            {latestProof.status === "failed" && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-600 mb-2">
                  Anchoring failed: {latestProof.last_error || "Unknown error"}
                </p>
                <p className="text-[10px] text-red-500">
                  Retries: {latestProof.retry_count}/3
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {isAnchored && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerify(latestProof.id)}
                  disabled={verifying}
                  className="text-xs flex-1"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-1.5 h-3 w-3" />
                      Verify on Hedera
                    </>
                  )}
                </Button>
              )}
              {!isAnchored && latestProof.status !== "pending_anchor" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnchor}
                  disabled={anchoring}
                  className="text-xs flex-1"
                >
                  {anchoring ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Anchoring...
                    </>
                  ) : (
                    <>
                      <Anchor className="mr-1.5 h-3 w-3" />
                      Anchor New Version
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Proof history */}
        {proofs.length > 1 && (
          <div className="border-t pt-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Anchor History
            </p>
            <div className="space-y-1.5">
              {proofs.map((proof) => {
                const config = STATUS_CONFIG[proof.status] || STATUS_CONFIG.pending;
                const Icon = config.icon;
                return (
                  <div key={proof.id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3 w-3 ${config.className.split(" ")[0]}`} />
                      <span className="text-muted-foreground">v{proof.pack_version}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {proof.pack_hash.slice(0, 12)}...
                      </span>
                      {proof.anchored_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(proof.anchored_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Verification result */}
        {verification && (
          <div className="border-t pt-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Verification Result
            </p>
            <div className={`rounded-lg p-3 ${verification.verified ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex items-center gap-2 mb-1.5">
                {verification.verified ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                )}
                <p className={`text-xs font-medium ${verification.verified ? "text-emerald-700" : "text-red-700"}`}>
                  {verification.verified ? "Hash Match Confirmed" : "Verification Failed"}
                </p>
              </div>
              {verification.hashScanUrl && (
                <a
                  href={verification.hashScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  View on HashScan
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {verification.error && (
                <p className="text-[10px] text-red-500 mt-1">{verification.error}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrustProofCard;
