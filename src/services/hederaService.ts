/**
 * hederaService.ts
 * 
 * Hedera Hashgraph Consensus Service (HCS) integration.
 * Submits evidence pack hashes to a Hedera Topic for immutable timestamping.
 * 
 * PATTERN:
 *   1. Hash engine computes SHA-256 of serialized Evidence Pack
 *   2. Message payload (hash + metadata) is submitted to HCS Topic
 *   3. Hedera returns consensus timestamp + sequence number
 *   4. trust_proofs table stores the proof
 *   5. Mirror Node API verifies externally
 * 
 * NEVER sends raw data to Hedera — only hashes and metadata.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { hederaConfig, isHederaConfigured, getHashScanUrl, getMirrorNodeMessageUrl } from "@/config/hedera";
import { evidenceService } from "./evidenceService";
import type { ServiceResult } from "@/types/consignment.types";
import type {
  TrustProof,
  HederaMessagePayload,
  HederaSubmitResult,
  MirrorNodeMessage,
  MirrorNodeVerification,
  AnchorRequest,
  AnchorStatusType,
} from "@/types/hedera.types";

// Max retries for failed submissions
const MAX_RETRIES = 3;

export const hederaService = {

  // ============================================
  // 1. HASH ENGINE
  // ============================================

  /**
   * Compute SHA-256 of a serialized Evidence Pack.
   * Deterministic: same inputs → same hash.
   */
  async computePackHash(consignmentId: string): Promise<ServiceResult<{
    packHash: string;
    inputHashes: string[];
    evidenceCount: number;
    attestationCount: number;
  }>> {
    try {
      // Generate evidence pack (off-chain computed artifact)
      const packResult = await evidenceService.generateEvidencePack(consignmentId);
      if (!packResult.success || !packResult.data) {
        return { success: false, error: packResult.error || "Failed to generate evidence pack" };
      }

      const pack = packResult.data;

      // Serialize deterministically (sorted keys)
      const serialized = JSON.stringify(pack, Object.keys(pack).sort());

      // SHA-256 of the serialized pack
      const packHash = await evidenceService.sha256(serialized);

      return {
        success: true,
        data: {
          packHash,
          inputHashes: pack.input_hashes,
          evidenceCount: pack.evidence_count,
          attestationCount: pack.attestation_count,
        },
      };
    } catch (error: any) {
      logger.error("hedera.computePackHash_failed", { consignment_id: consignmentId }, error);
      return { success: false, error: error.message || "Hash computation failed" };
    }
  },

  // ============================================
  // 2. HEDERA HCS SUBMISSION
  // ============================================

  /**
   * Submit a message to the Hedera Consensus Service topic.
   * Uses the Hedera SDK with operator credentials (backend-first, no wallet UX).
   */
  async submitToHCS(payload: HederaMessagePayload): Promise<HederaSubmitResult> {
    if (!isHederaConfigured()) {
      return { success: false, error: "Hedera is not configured. Set VITE_HEDERA_TOPIC_ID, VITE_HEDERA_OPERATOR_ID, and VITE_HEDERA_OPERATOR_KEY." };
    }

    try {
      // Dynamic import to avoid bundling the entire SDK when not needed
      const { Client, TopicMessageSubmitTransaction, TopicId, AccountId, PrivateKey } = await import("@hashgraph/sdk");

      // Create client for the configured network
      const client = hederaConfig.network === 'mainnet'
        ? Client.forMainnet()
        : Client.forTestnet();

      // Set operator (the account that pays for and signs the transaction)
      client.setOperator(
        AccountId.fromString(hederaConfig.operatorId),
        PrivateKey.fromStringED25519(hederaConfig.operatorKey)
      );

      // Serialize the message payload
      const messageBytes = new TextEncoder().encode(JSON.stringify(payload));

      // Submit to the topic
      const submitTx = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(hederaConfig.topicId))
        .setMessage(messageBytes);

      const txResponse = await submitTx.execute(client);
      const receipt = await txResponse.getReceipt(client);

      // Get the topic sequence number from the receipt
      const sequenceNumber = receipt.topicSequenceNumber?.toNumber() ?? null;

      // Get transaction ID
      const transactionId = txResponse.transactionId?.toString() ?? null;

      logger.info("hedera.hcs_submitted", {
        topic_id: hederaConfig.topicId,
        sequence_number: sequenceNumber,
        transaction_id: transactionId,
        pack_hash: payload.pack_hash,
      });

      client.close();

      return {
        success: true,
        transactionId: transactionId || undefined,
        sequenceNumber: sequenceNumber || undefined,
        topicId: hederaConfig.topicId,
      };
    } catch (error: any) {
      logger.error("hedera.hcs_submit_failed", { topic_id: hederaConfig.topicId }, error);
      return {
        success: false,
        error: error.message || "Hedera HCS submission failed",
      };
    }
  },

  // ============================================
  // 3. FULL ANCHOR FLOW
  // ============================================

  /**
   * Complete anchoring flow:
   * 1. Compute pack hash
   * 2. Create trust_proof record (status: pending)
   * 3. Submit to Hedera HCS
   * 4. Update trust_proof with Hedera metadata (status: anchored)
   * 5. Update consignment_cases anchor status
   * 
   * If Hedera fails, proof stays as PENDING_ANCHOR for retry.
   */
  async anchorEvidencePack(request: AnchorRequest): Promise<ServiceResult<TrustProof>> {
    try {
      // Guard: check for duplicate anchor (same consignment + version)
      const { data: existing } = await supabase
        .from("trust_proofs")
        .select("id, status")
        .eq("consignment_id", request.consignment_id)
        .eq("pack_version", request.pack_version)
        .in("status", ["anchored", "verified"])
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: `Consignment version ${request.pack_version} is already anchored. Cannot anchor the same version twice.`,
        };
      }

      // Build the message payload (what goes to Hedera)
      const messagePayload: HederaMessagePayload = {
        type: "evidence_pack_anchor",
        consignment_id: request.consignment_id,
        case_number: request.case_number,
        pack_hash: request.pack_hash,
        pack_version: request.pack_version,
        evidence_count: request.evidence_count,
        attestation_count: request.attestation_count,
        input_hash_count: request.input_hashes.length,
        merkle_root: request.pack_hash,
        decision_context: request.decision_context,
        anchored_by: request.anchored_by,
        timestamp: new Date().toISOString(),
      };

      // Create trust_proof record (status: pending)
      const { data: proof, error: insertError } = await supabase
        .from("trust_proofs")
        .insert({
          consignment_id: request.consignment_id,
          pack_hash: request.pack_hash,
          pack_version: request.pack_version,
          input_hashes: request.input_hashes,
          evidence_count: request.evidence_count,
          attestation_count: request.attestation_count,
          status: "pending" as AnchorStatusType,
          message_payload: messagePayload,
          hash_computed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !proof) {
        logger.error("hedera.trust_proof_insert_failed", { consignment_id: request.consignment_id }, insertError);
        return { success: false, error: insertError?.message || "Failed to create trust proof record" };
      }

      const proofId = (proof as any).id;

      // Submit to Hedera HCS
      const hederaResult = await this.submitToHCS(messagePayload);

      if (hederaResult.success) {
        // Update trust_proof with Hedera metadata
        const { data: updated, error: updateError } = await supabase
          .from("trust_proofs")
          .update({
            status: "anchored" as AnchorStatusType,
            topic_id: hederaResult.topicId,
            sequence_number: hederaResult.sequenceNumber,
            transaction_id: hederaResult.transactionId,
            submitted_at: new Date().toISOString(),
            anchored_at: new Date().toISOString(),
          })
          .eq("id", proofId)
          .select()
          .single();

        if (updateError) {
          logger.error("hedera.trust_proof_update_failed", { proof_id: proofId }, updateError);
        }

        logger.info("hedera.anchor_complete", {
          consignment_id: request.consignment_id,
          pack_hash: request.pack_hash,
          sequence_number: hederaResult.sequenceNumber,
          transaction_id: hederaResult.transactionId,
        });

        return { success: true, data: (updated || proof) as unknown as TrustProof };
      } else {
        // Hedera failed — mark as pending_anchor for retry
        await supabase
          .from("trust_proofs")
          .update({
            status: "pending_anchor" as AnchorStatusType,
            last_error: hederaResult.error,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", proofId);

        logger.warn("hedera.anchor_pending", {
          consignment_id: request.consignment_id,
          error: hederaResult.error,
        });

        // Return success with pending status (don't block the operation)
        return {
          success: true,
          data: {
            ...proof,
            status: "pending_anchor",
            last_error: hederaResult.error,
          } as unknown as TrustProof,
        };
      }
    } catch (error: any) {
      logger.error("hedera.anchor_exception", { consignment_id: request.consignment_id }, error);
      return { success: false, error: error.message || "Anchoring failed" };
    }
  },

  // ============================================
  // 4. RETRY FAILED ANCHORS
  // ============================================

  /**
   * Retry all pending/failed trust proofs.
   * Called periodically or on-demand.
   */
  async retryPendingAnchors(): Promise<ServiceResult<{ retried: number; succeeded: number; failed: number }>> {
    try {
      const { data: pendingProofs, error } = await supabase
        .from("trust_proofs")
        .select("*")
        .in("status", ["pending_anchor", "failed"])
        .lt("retry_count", MAX_RETRIES)
        .order("created_at", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      const proofs = (pendingProofs || []) as unknown as TrustProof[];
      let succeeded = 0;
      let failed = 0;

      for (const proof of proofs) {
        const hederaResult = await this.submitToHCS(proof.message_payload);

        if (hederaResult.success) {
          await supabase
            .from("trust_proofs")
            .update({
              status: "anchored" as AnchorStatusType,
              topic_id: hederaResult.topicId,
              sequence_number: hederaResult.sequenceNumber,
              transaction_id: hederaResult.transactionId,
              anchored_at: new Date().toISOString(),
              retry_count: proof.retry_count + 1,
              last_error: null,
            })
            .eq("id", proof.id);
          succeeded++;
        } else {
          const newStatus: AnchorStatusType = proof.retry_count + 1 >= MAX_RETRIES ? "failed" : "pending_anchor";
          await supabase
            .from("trust_proofs")
            .update({
              status: newStatus,
              retry_count: proof.retry_count + 1,
              last_error: hederaResult.error,
            })
            .eq("id", proof.id);
          failed++;
        }
      }

      logger.info("hedera.retry_complete", { retried: proofs.length, succeeded, failed });
      return { success: true, data: { retried: proofs.length, succeeded, failed } };
    } catch (error: any) {
      logger.error("hedera.retry_exception", {}, error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // 5. VERIFICATION VIA MIRROR NODE
  // ============================================

  /**
   * Verify a trust proof by querying the Hedera Mirror Node.
   * No wallet needed — anyone can verify.
   * 
   * Steps:
   * 1. Fetch message from Mirror Node by topic+sequence
   * 2. Decode the base64 message
   * 3. Compare the pack_hash in the message with the expected hash
   * 4. Return verification result with HashScan link
   */
  async verifyProof(proofId: string): Promise<ServiceResult<MirrorNodeVerification>> {
    try {
      // Get the trust proof from DB
      const { data: proof, error: proofError } = await supabase
        .from("trust_proofs")
        .select("*")
        .eq("id", proofId)
        .single();

      if (proofError || !proof) {
        return { success: false, error: proofError?.message || "Trust proof not found" };
      }

      const tp = proof as unknown as TrustProof;

      if (!tp.sequence_number || !tp.topic_id) {
        return {
          success: true,
          data: {
            verified: false,
            message: null,
            decodedPayload: null,
            hashMatch: false,
            hashScanUrl: "",
            error: "Proof has not been anchored to Hedera yet",
          },
        };
      }

      // Fetch from Mirror Node
      const mirrorUrl = getMirrorNodeMessageUrl(tp.sequence_number);
      const response = await fetch(mirrorUrl);

      if (!response.ok) {
        return {
          success: true,
          data: {
            verified: false,
            message: null,
            decodedPayload: null,
            hashMatch: false,
            hashScanUrl: getHashScanUrl(tp.transaction_id || ""),
            error: `Mirror Node returned ${response.status}: ${response.statusText}`,
          },
        };
      }

      const mirrorMessage: MirrorNodeMessage = await response.json();

      // Decode base64 message
      let decodedPayload: HederaMessagePayload | null = null;
      let hashMatch = false;

      try {
        const decodedString = atob(mirrorMessage.message);
        decodedPayload = JSON.parse(decodedString);
        hashMatch = decodedPayload?.pack_hash === tp.pack_hash;
      } catch {
        logger.warn("hedera.verify_decode_failed", { proof_id: proofId });
      }

      // Update verification status if verified
      if (hashMatch) {
        await supabase
          .from("trust_proofs")
          .update({
            status: "verified" as AnchorStatusType,
            consensus_timestamp: mirrorMessage.consensus_timestamp,
            running_hash: mirrorMessage.running_hash,
            verified_at: new Date().toISOString(),
          })
          .eq("id", proofId);
      }

      const verification: MirrorNodeVerification = {
        verified: hashMatch,
        message: mirrorMessage,
        decodedPayload,
        hashMatch,
        hashScanUrl: getHashScanUrl(tp.transaction_id || ""),
      };

      logger.info("hedera.verify_complete", {
        proof_id: proofId,
        verified: hashMatch,
        sequence_number: tp.sequence_number,
      });

      return { success: true, data: verification };
    } catch (error: any) {
      logger.error("hedera.verify_exception", { proof_id: proofId }, error);
      return { success: false, error: error.message || "Verification failed" };
    }
  },

  /**
   * Verify by pack hash (for external verifiers who only have the hash).
   */
  async verifyByHash(packHash: string): Promise<ServiceResult<MirrorNodeVerification>> {
    try {
      const { data: proof, error } = await supabase
        .from("trust_proofs")
        .select("*")
        .eq("pack_hash", packHash)
        .in("status", ["anchored", "verified"])
        .order("pack_version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !proof) {
        return {
          success: true,
          data: {
            verified: false,
            message: null,
            decodedPayload: null,
            hashMatch: false,
            hashScanUrl: "",
            error: "No anchored proof found for this hash",
          },
        };
      }

      return this.verifyProof((proof as any).id);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // 6. TRUST PROOF QUERIES
  // ============================================

  /**
   * Get all trust proofs for a consignment.
   */
  async getConsignmentProofs(consignmentId: string): Promise<ServiceResult<TrustProof[]>> {
    try {
      const { data, error } = await supabase
        .from("trust_proofs")
        .select("*")
        .eq("consignment_id", consignmentId)
        .order("pack_version", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as TrustProof[] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get the latest trust proof for a consignment.
   */
  async getLatestProof(consignmentId: string): Promise<ServiceResult<TrustProof | null>> {
    try {
      const { data, error } = await supabase
        .from("trust_proofs")
        .select("*")
        .eq("consignment_id", consignmentId)
        .order("pack_version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as unknown as TrustProof | null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
