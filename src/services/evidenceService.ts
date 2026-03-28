/**
 * evidenceService.ts
 * Primitive 5: Evidence Object — hashing, storage, retrieval
 * Primitive 3: State Transition — formal state changes
 * Primitive 9: Evidence Pack — generated artifact (bundle + hash)
 *
 * Off-chain: all evidence lives in Supabase (Postgres + Storage).
 * On-chain: only root hashes via anchorService.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  ServiceResult,
  EvidenceObject,
  StateTransition,
  EvidencePack,
  CreateEvidencePayload,
  TransitionStatePayload,
  CaseState,
  ReadinessState,
} from "@/types/consignment.types";

export const evidenceService = {

  // ============================================
  // EVIDENCE OBJECTS
  // ============================================

  /**
   * Creates an immutable evidence object.
   * content_hash must be computed client-side before upload.
   */
  async createEvidence(payload: CreateEvidencePayload): Promise<ServiceResult<EvidenceObject>> {
    try {
      if (!payload.content_hash) {
        return { success: false, error: "content_hash is required" };
      }
      if (!payload.evidence_type) {
        return { success: false, error: "evidence_type is required" };
      }
      if (!payload.created_by) {
        return { success: false, error: "created_by is required" };
      }

      const { data, error } = await supabase
        .from("evidence_objects")
        .insert({
          consignment_id: payload.consignment_id || null,
          lot_id: payload.lot_id || null,
          evidence_type: payload.evidence_type,
          source_system: payload.source_system || "platform",
          storage_uri: payload.storage_uri || null,
          content_hash: payload.content_hash,
          file_size_bytes: payload.file_size_bytes || null,
          mime_type: payload.mime_type || null,
          created_by: payload.created_by,
          visibility: payload.visibility || "participants",
          title: payload.title || null,
          description: payload.description || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating evidence:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as unknown as EvidenceObject };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Gets all evidence objects for a consignment.
   */
  async getConsignmentEvidence(consignmentId: string): Promise<ServiceResult<EvidenceObject[]>> {
    try {
      const { data, error } = await supabase
        .from("evidence_objects")
        .select("*")
        .eq("consignment_id", consignmentId)
        .order("created_at", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as EvidenceObject[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Gets all content hashes for a consignment (for Merkle root computation).
   */
  async getEvidenceHashes(consignmentId: string): Promise<ServiceResult<string[]>> {
    try {
      const { data, error } = await supabase
        .rpc("get_evidence_hashes_for_consignment", {
          p_consignment_id: consignmentId,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const hashes = (data || []).map((row: any) => row.content_hash);
      return { success: true, data: hashes };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // STATE TRANSITIONS
  // ============================================

  /**
   * Performs a formal state transition on a consignment.
   * Uses the RPC function which validates and applies atomically.
   */
  async transitionState(payload: TransitionStatePayload): Promise<ServiceResult<StateTransition>> {
    try {
      if (!payload.consignment_id || !payload.to_state || !payload.actor_id) {
        return { success: false, error: "consignment_id, to_state, and actor_id are required" };
      }

      const { data, error } = await supabase
        .rpc("transition_consignment_state", {
          p_consignment_id: payload.consignment_id,
          p_to_state: payload.to_state,
          p_actor_id: payload.actor_id,
          p_reason: payload.reason || null,
          p_evidence_refs: payload.evidence_refs || [],
        });

      if (error) {
        console.error("Error transitioning state:", error);
        return { success: false, error: error.message };
      }

      const row = Array.isArray(data) ? data[0] : data;
      return {
        success: true,
        data: {
          id: row.transition_id,
          consignment_id: payload.consignment_id,
          from_state: row.from_state,
          to_state: row.to_state,
          actor_id: payload.actor_id,
          reason: payload.reason || null,
          evidence_refs: payload.evidence_refs || [],
          metadata: {},
          transitioned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        } as StateTransition,
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Gets the full state transition history for a consignment.
   */
  async getStateHistory(consignmentId: string): Promise<ServiceResult<StateTransition[]>> {
    try {
      const { data, error } = await supabase
        .from("state_transitions")
        .select(`
          *,
          actor:actor_id (full_name)
        `)
        .eq("consignment_id", consignmentId)
        .order("transitioned_at", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as StateTransition[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // EVIDENCE PACK (Primitive 9 — generated artifact)
  // ============================================

  /**
   * Generates an evidence pack for a consignment.
   * This is NOT a table row — it's a computed artifact.
   *
   * Steps:
   * 1. Gather all evidence hashes
   * 2. Compute Merkle root (simplified: sorted hash of hashes)
   * 3. Snapshot current state
   * 4. Bundle into EvidencePack
   */
  async generateEvidencePack(consignmentId: string): Promise<ServiceResult<EvidencePack>> {
    try {
      // 1. Get consignment details
      const { data: caseData, error: caseError } = await supabase
        .from("consignment_cases")
        .select("case_number, current_state, readiness, risk_status")
        .eq("id", consignmentId)
        .single();

      if (caseError || !caseData) {
        return { success: false, error: caseError?.message || "Consignment not found" };
      }

      // 2. Get all evidence hashes
      const hashResult = await this.getEvidenceHashes(consignmentId);
      if (!hashResult.success || !hashResult.data) {
        return { success: false, error: hashResult.error || "Failed to get evidence hashes" };
      }

      const inputHashes = hashResult.data;

      // 3. Compute root hash (sorted concatenation → SHA-256)
      const rootHash = await this.computeMerkleRoot(inputHashes);

      // 4. Get counts
      const [attCount, handoffCount, excSummary] = await Promise.all([
        supabase
          .from("consignment_attestations")
          .select("*", { count: "exact", head: true })
          .eq("consignment_id", consignmentId)
          .eq("revoked", false),
        supabase
          .from("consignment_handoffs")
          .select("*", { count: "exact", head: true })
          .eq("consignment_id", consignmentId),
        supabase
          .from("consignment_exceptions")
          .select("resolved, blocks_readiness")
          .eq("consignment_id", consignmentId),
      ]);

      const exceptions = excSummary.data || [];
      const openExc = exceptions.filter((e: any) => !e.resolved).length;
      const blockingExc = exceptions.filter((e: any) => e.blocks_readiness && !e.resolved).length;

      // 5. Check latest anchor version
      const { data: latestAnchor } = await supabase
        .from("anchors")
        .select("*")
        .eq("consignment_id", consignmentId)
        .eq("anchor_type", "evidence_pack")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = latestAnchor ? (latestAnchor as any).version + 1 : 1;

      const pack: EvidencePack = {
        consignment_id: consignmentId,
        case_number: (caseData as any).case_number,
        version: nextVersion,
        generated_at: new Date().toISOString(),
        root_hash: rootHash,
        input_hashes: inputHashes,
        anchor: null,
        state_snapshot: {
          current_state: (caseData as any).current_state as CaseState,
          readiness: (caseData as any).readiness as ReadinessState,
          risk_status: (caseData as any).risk_status,
        },
        evidence_count: inputHashes.length,
        attestation_count: attCount.count || 0,
        handoff_count: handoffCount.count || 0,
        exception_summary: {
          total: exceptions.length,
          open: openExc,
          blocking: blockingExc,
        },
      };

      return { success: true, data: pack };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // HASHING UTILITIES
  // ============================================

  /**
   * Computes SHA-256 hash of a string.
   * Uses Web Crypto API (available in browsers and Edge Functions).
   */
  async sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  /**
   * Computes SHA-256 of a File/Blob (for evidence object creation).
   */
  async hashFile(file: File | Blob): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  /**
   * Computes a Merkle root from a list of hashes.
   * Simplified implementation: sort hashes, concatenate, hash the result.
   * For a full Merkle tree, use a proper library.
   */
  async computeMerkleRoot(hashes: string[]): Promise<string> {
    if (hashes.length === 0) {
      return await this.sha256("empty");
    }
    if (hashes.length === 1) {
      return hashes[0];
    }

    // Sort for deterministic ordering
    const sorted = [...hashes].sort();
    const concatenated = sorted.join("");
    return await this.sha256(concatenated);
  },

  /**
   * Uploads a file to Supabase Storage and returns an evidence object.
   * Computes content_hash before upload for integrity.
   */
  async uploadAndCreateEvidence(
    file: File,
    payload: Omit<CreateEvidencePayload, "content_hash" | "storage_uri" | "file_size_bytes" | "mime_type">,
    storageBucket: string = "evidence"
  ): Promise<ServiceResult<EvidenceObject>> {
    try {
      // 1. Compute content hash
      const contentHash = await this.hashFile(file);

      // 2. Upload to Supabase Storage
      const filePath = `${payload.consignment_id || "unlinked"}/${contentHash}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return { success: false, error: `Upload failed: ${uploadError.message}` };
      }

      // 3. Get public/signed URL
      const { data: urlData } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(filePath);

      // 4. Create evidence object
      return await this.createEvidence({
        ...payload,
        content_hash: contentHash,
        storage_uri: urlData.publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
      });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
