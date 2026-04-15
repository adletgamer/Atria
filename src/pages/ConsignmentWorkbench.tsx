import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Layers } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import ConsignmentHeader from "@/components/consignment/ConsignmentHeader";
import DecisionSentinel from "@/components/consignment/DecisionSentinel";
import ReadinessChecklist from "@/components/consignment/ReadinessChecklist";
import FinancingReadinessPanel from "@/components/consignment/FinancingReadinessPanel";
import ExceptionsPanel from "@/components/consignment/ExceptionsPanel";
import EvidenceCoverageMatrix from "@/components/consignment/EvidenceCoverageMatrix";
import type { EvidenceRow } from "@/components/consignment/EvidenceCoverageMatrix";
import AttestationList from "@/components/consignment/AttestationList";
import CustodyTimeline from "@/components/consignment/CustodyTimeline";
import EvidencePackCard from "@/components/consignment/EvidencePackCard";
import TrustProofCard from "@/components/consignment/TrustProofCard";
import AnchorTimeline from "@/components/consignment/AnchorTimeline";
import QuickActions from "@/components/consignment/QuickActions";
import AddEvidenceDialog from "@/components/consignment/AddEvidenceDialog";
import RequestAttestationDialog from "@/components/consignment/RequestAttestationDialog";
import GeneratePackDialog from "@/components/consignment/GeneratePackDialog";
import { complianceService } from "@/services/complianceService";
import { exceptionService } from "@/services/exceptionService";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";
import { ConsignmentReadinessProvider, useConsignmentReadiness } from "@/hooks/useConsignmentReadiness";
import type {
  ComplianceReadiness,
  ConsignmentCase,
  ConsignmentAttestation,
  ConsignmentHandoff,
  ConsignmentException,
  EvidenceObject,
  Anchor,
  ReadinessAssessment,
  ReadinessReason,
} from "@/types/consignment.types";

interface PageState {
  loading: boolean;
  error: string | null;
  caseData: ConsignmentCase | null;
  readiness: ComplianceReadiness | null;
  allExceptions: ConsignmentException[];
  attestations: ConsignmentAttestation[];
  handoffs: ConsignmentHandoff[];
  evidenceObjects: EvidenceObject[];
  lastAnchor: Anchor | null;
  recomputing: boolean;
  generating: boolean;
}

interface DialogState {
  addEvidence: boolean;
  requestAttestation: boolean;
  generatePack: boolean;
}

const WorkbenchContent = ({ id }: { id: string }) => {
  const { toast } = useToast();
  const { activeLens, setActiveLens } = useConsignmentReadiness();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isNew = searchParams.get("new") === "true";

  const [state, setState] = useState<PageState>({
    loading: true,
    error: null,
    caseData: null,
    readiness: null,
    allExceptions: [],
    attestations: [],
    handoffs: [],
    evidenceObjects: [],
    lastAnchor: null,
    recomputing: false,
    generating: false,
  });

  const [dialogs, setDialogs] = useState<DialogState>({
    addEvidence: false,
    requestAttestation: false,
    generatePack: false,
  });

  const loadData = useCallback(async () => {
    if (!id) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const [
        caseResult,
        readinessResult,
        exceptionsResult,
        attestationsResult,
        handoffsResult,
        evidenceResult,
      ] = await Promise.all([
        supabase.from("consignment_cases").select("*").eq("id", id).single(),
        complianceService.getComplianceReadiness(id),
        supabase.from("consignment_exceptions").select("*").eq("consignment_id", id).order("raised_at", { ascending: false }),
        supabase.from("consignment_attestations").select("*").eq("consignment_id", id).order("attested_at", { ascending: false }),
        supabase.from("consignment_handoffs").select("*").eq("consignment_id", id).order("occurred_at", { ascending: true }),
        supabase.from("evidence_objects").select("*").eq("consignment_id", id).order("created_at", { ascending: false }),
      ]);

      if (caseResult.error) {
        setState((s) => ({ ...s, loading: false, error: caseResult.error.message }));
        return;
      }

      setState((s) => ({
        ...s,
        loading: false,
        caseData: caseResult.data as unknown as ConsignmentCase,
        readiness: readinessResult.success ? readinessResult.data! : null,
        allExceptions: (exceptionsResult.data || []) as unknown as ConsignmentException[],
        attestations: (attestationsResult.data || []) as unknown as ConsignmentAttestation[],
        handoffs: (handoffsResult.data || []) as unknown as ConsignmentHandoff[],
        evidenceObjects: (evidenceResult.data || []) as unknown as EvidenceObject[],
        lastAnchor: readinessResult.success ? readinessResult.data!.last_anchor : null,
      }));

      logger.info("consignment.loaded", { consignment_id: id });
    } catch (err: any) {
      logger.error("consignment.load_failed", { consignment_id: id }, err);
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecompute = async () => {
    if (!id) return;
    setState((s) => ({ ...s, recomputing: true }));
    try {
      const { data: userData } = await supabase.auth.getUser();
      const actorId = userData?.user?.id || "system";
      await exceptionService.evaluateConsignment(id, actorId);
      await loadData();
    } catch (err: any) {
      logger.error("consignment.recompute_failed", { consignment_id: id }, err);
    }
    setState((s) => ({ ...s, recomputing: false }));
  };

  const handleResolveException = async (exceptionId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const result = await exceptionService.resolveException({
      exception_id: exceptionId,
      resolved_by: userData?.user?.id || "system",
      resolution: "Manually resolved from workbench",
    });
    if (result.success) {
      await loadData();
    }
  };

  const handleGeneratePack = async () => {
    if (!id) return;
    setState((s) => ({ ...s, generating: true }));
    try {
      const { data: userData } = await supabase.auth.getUser();
      await complianceService.generateCompliancePack(id, userData?.user?.id || "system");
      toast({
        title: "Official dossier generated",
        description: "The evidence pack has been created and is ready to share.",
      });
      await loadData();
    } catch (err: any) {
      toast({
        title: "Pack generation failed",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    }
    setState((s) => ({ ...s, generating: false }));
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.error || !state.caseData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-sm text-red-600">{state.error || "Consignment not found."}</p>
      </div>
    );
  }

  const { caseData, readiness, allExceptions, attestations, handoffs, evidenceObjects, lastAnchor } = state;

  const completeness = readiness?.evidence_completeness;
  const continuity = readiness?.custody_continuity;
  const blockingExcs = allExceptions.filter((e) => e.blocks_readiness && !e.resolved);
  const blockingCount = blockingExcs.length;
  const snapshot = readiness?.last_snapshot;
  const missingCritical = completeness?.missing_critical || [];

  const importReady = snapshot ? snapshot.decision_readiness_import : completeness && continuity ? completeness.completeness_pct >= 80 && continuity.custody_gaps === 0 && blockingCount === 0 : false;
  const financingReady = snapshot ? snapshot.decision_readiness_financing : completeness && continuity ? completeness.completeness_pct >= 70 && continuity.continuity_score >= 70 && blockingCount === 0 : false;

  // Assessments
  function buildImportAssessment(): ReadinessAssessment {
    const reasons_for: ReadinessReason[] = [];
    const reasons_against: ReadinessReason[] = [];
    if (completeness && completeness.completeness_pct >= 80) reasons_for.push({ label: "Evidence completeness ≥ 80%", satisfied: true });
    else reasons_against.push({ label: "Evidence completeness < 80%", satisfied: false, detail: `${completeness?.completeness_pct || 0}%` });
    if (continuity && continuity.custody_gaps === 0) reasons_for.push({ label: "No custody gaps", satisfied: true });
    else reasons_against.push({ label: "Custody gaps detected", satisfied: false, detail: `${continuity?.custody_gaps || 0} gap(s)` });
    if (blockingCount === 0) reasons_for.push({ label: "No blocking exceptions", satisfied: true });
    else reasons_against.push({ label: "Blocking exceptions", satisfied: false, detail: `${blockingCount} blocker(s)` });

    return { context: "import_readiness", ready: importReady, reasons_for, reasons_against, blocking_exceptions: blockingExcs, missing_evidence: missingCritical };
  }

  function buildFinancingAssessment(): ReadinessAssessment {
    const reasons_for: ReadinessReason[] = [];
    const reasons_against: ReadinessReason[] = [];
    if (completeness && completeness.completeness_pct >= 70) reasons_for.push({ label: "Evidence sufficiency ≥ 70%", satisfied: true });
    else reasons_against.push({ label: "Evidence sufficiency < 70%", satisfied: false, detail: `${completeness?.completeness_pct || 0}%` });
    if (continuity && continuity.continuity_score >= 70) reasons_for.push({ label: "Custody continuity ≥ 70", satisfied: true });
    else reasons_against.push({ label: "Custody continuity < 70", satisfied: false, detail: `Score: ${continuity?.continuity_score || 0}` });
    if (blockingCount === 0) reasons_for.push({ label: "No blocking exceptions", satisfied: true });
    else reasons_against.push({ label: "Blocking exceptions", satisfied: false, detail: `${blockingCount} blocker(s)` });

    return { context: "financing_readiness", ready: financingReady, reasons_for, reasons_against, blocking_exceptions: blockingExcs, missing_evidence: missingCritical };
  }

  const evidenceRows: EvidenceRow[] = evidenceObjects.map((eo) => ({
    id: eo.id, type: eo.evidence_type, title: eo.title || eo.evidence_type.replace(/_/g, " "),
    status: "active" as const, source: eo.source_system, capturedAt: eo.created_at,
    hasAttestation: attestations.some((a) => a.evidence_refs.includes(eo.id)), isGap: false,
  }));
  const gapRows: EvidenceRow[] = missingCritical.map((type, idx) => ({
    id: `gap-${idx}`, type, title: type.replace(/_/g, " "), status: "missing" as const,
    source: "—", capturedAt: null, hasAttestation: false, isGap: true,
  }));
  const allEvidenceRows = [...evidenceRows, ...gapRows];

  const packGenerated = !!lastAnchor || !!snapshot;
  const packHash = lastAnchor?.root_hash || snapshot?.snapshot_hash || null;
  const anchorStatus = lastAnchor?.chain_tx ? "anchored" : lastAnchor ? "pending" : "none";

  return (
    <>
      <ConsignmentHeader
        caseNumber={caseData.case_number}
        exporterName={null}
        destinationCountry={caseData.destination_country}
        destinationPort={caseData.destination_port}
        status={caseData.status}
        packStatus={caseData.pack_status || "not_generated"}
        blockingCount={blockingCount}
        estimatedDeparture={caseData.estimated_departure}
        shipmentWindowStart={caseData.shipment_window_start}
        shipmentWindowEnd={caseData.shipment_window_end}
        importReady={importReady}
        financingReady={financingReady}
        lastComputedAt={snapshot?.created_at || null}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {isNew && evidenceObjects.length === 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md p-5 text-white flex items-center justify-between border border-indigo-700/50">
            <div>
               <h3 className="text-lg font-bold">Dossier Base Intialized Successfully</h3>
               <p className="text-sm text-blue-100 mt-1">
                 To pass compliance readiness, you must begin building your evidence pack. Start by connecting a product lot or uploading documents.
               </p>
            </div>
            <Button 
               onClick={() => setDialogs(d => ({ ...d, addEvidence: true }))}
               className="bg-white text-indigo-700 hover:bg-gray-50 flex-shrink-0"
            >
               Upload Initial Evidence
            </Button>
          </div>
        )}

        {/* Toggle / Decision Lens Area */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-sm mr-4 text-gray-800">Operational Lens:</span>
            <div className="flex bg-gray-100 p-1 rounded-sm gap-1">
               <button 
                 onClick={() => setActiveLens('import')} 
                 className={`px-4 py-1.5 text-xs font-semibold rounded-sm transition-all ${activeLens === 'import' ? 'bg-white shadow text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                 Import Readiness
               </button>
               <button 
                 onClick={() => setActiveLens('financing')} 
                 className={`px-4 py-1.5 text-xs font-semibold rounded-sm transition-all ${activeLens === 'financing' ? 'bg-white shadow text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                 Underwriting
               </button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
             Case: <span className="font-mono text-gray-800 ml-1">{id}</span>
          </div>
        </div>

        {/* Dossier Layout: Sidebar (left) + Main Content (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          
          {/* Left Sidebar: Dossier Navigation & Actions */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-[20px] space-y-6">
              <EvidencePackCard
                packGenerated={packGenerated}
                lastGeneratedAt={snapshot?.created_at || null}
                packHash={packHash}
                anchorStatus={anchorStatus}
                anchorTxHash={lastAnchor?.chain_tx || null}
                onGenerate={handleGeneratePack}
                generating={state.generating}
              />
              
              <QuickActions
                onAddEvidence={() => setDialogs((d) => ({ ...d, addEvidence: true }))}
                onRequestAttestation={() => setDialogs((d) => ({ ...d, requestAttestation: true }))}
                onRecomputeState={handleRecompute}
                onExportPack={() => setDialogs((d) => ({ ...d, generatePack: true }))}
                recomputing={state.recomputing}
              />
              
              <TrustProofCard
                consignmentId={id}
                caseNumber={caseData.case_number}
                onAnchorComplete={() => loadData()}
              />

              <AnchorTimeline consignmentId={id} />
            </div>
          </div>

          {/* Right Main Content */}
          <div className="space-y-8">
            <DecisionSentinel
              caseNumber={caseData.case_number}
              currentState={caseData.current_state || "draft"}
              blockingCount={blockingCount}
              lastComputedAt={snapshot?.created_at || null}
              importAssessment={buildImportAssessment()}
              financingAssessment={buildFinancingAssessment()}
            />

            <ExceptionsPanel
              exceptions={allExceptions}
              onResolve={handleResolveException}
            />

            {activeLens === "financing" ? (
              <FinancingReadinessPanel
                consignmentId={id}
                caseNumber={caseData.case_number}
                onExportPack={() => setDialogs((d) => ({ ...d, generatePack: true }))}
              />
            ) : (
              <ReadinessChecklist
                evidencePresent={completeness?.total_present || 0}
                evidenceRequired={completeness?.total_required || 6}
                missingCritical={missingCritical}
                attestationsPresent={readiness?.attestations_present.length || 0}
                attestationsRequired={(readiness?.attestations_present.length || 0) + (readiness?.attestations_missing.length || 6)}
                custodyGaps={continuity?.custody_gaps || 0}
                totalHandoffs={handoffs.length}
                blockingExceptions={blockingCount}
              />
            )}

            <EvidenceCoverageMatrix evidence={allEvidenceRows} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AttestationList attestations={attestations} />
              <CustodyTimeline handoffs={handoffs} gapCount={continuity?.custody_gaps || 0} />
            </div>
          </div>
        </div>
      </div>

      <AddEvidenceDialog open={dialogs.addEvidence} onOpenChange={(open) => setDialogs((d) => ({ ...d, addEvidence: open }))} consignmentId={id!} onSuccess={() => loadData()} />
      <RequestAttestationDialog open={dialogs.requestAttestation} onOpenChange={(open) => setDialogs((d) => ({ ...d, requestAttestation: open }))} consignmentId={id!} onSuccess={() => loadData()} />
      <GeneratePackDialog open={dialogs.generatePack} onOpenChange={(open) => setDialogs((d) => ({ ...d, generatePack: open }))} consignmentId={id!} caseNumber={caseData.case_number} importReady={importReady} financingReady={financingReady} onSuccess={() => loadData()} />
    </>
  );
};

const ConsignmentWorkbench = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return (
    <div className="min-h-screen bg-gray-50/20 pb-12">
      <Navbar />
      <ConsignmentReadinessProvider>
        <WorkbenchContent id={id} />
      </ConsignmentReadinessProvider>
    </div>
  );
};

export default ConsignmentWorkbench;
