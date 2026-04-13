/**
 * Hedera-specific types for the anchoring layer
 */

export type AnchorStatusType = 
  | 'pending'
  | 'pending_anchor'
  | 'anchored'
  | 'failed'
  | 'verified';

export interface TrustProof {
  id: string;
  consignment_id: string;
  pack_hash: string;
  pack_version: number;
  input_hashes: string[];
  evidence_count: number;
  attestation_count: number;
  topic_id: string | null;
  sequence_number: number | null;
  consensus_timestamp: string | null;
  transaction_id: string | null;
  running_hash: string | null;
  status: AnchorStatusType;
  retry_count: number;
  last_error: string | null;
  message_payload: HederaMessagePayload;
  hash_computed_at: string;
  submitted_at: string | null;
  anchored_at: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface HederaMessagePayload {
  type: 'evidence_pack_anchor';
  consignment_id: string;
  case_number: string;
  pack_hash: string;
  pack_version: number;
  evidence_count: number;
  attestation_count: number;
  input_hash_count: number;
  merkle_root: string;
  decision_context?: string;
  anchored_by: string;
  timestamp: string;
}

export interface HederaSubmitResult {
  success: boolean;
  transactionId?: string;
  sequenceNumber?: number;
  consensusTimestamp?: string;
  runningHash?: string;
  topicId?: string;
  error?: string;
}

export interface MirrorNodeMessage {
  consensus_timestamp: string;
  topic_id: string;
  message: string;  // base64 encoded
  running_hash: string;
  running_hash_version: number;
  sequence_number: number;
  payer_account_id: string;
}

export interface MirrorNodeVerification {
  verified: boolean;
  message: MirrorNodeMessage | null;
  decodedPayload: HederaMessagePayload | null;
  hashMatch: boolean;
  hashScanUrl: string;
  error?: string;
}

export interface AnchorRequest {
  consignment_id: string;
  case_number: string;
  pack_hash: string;
  pack_version: number;
  input_hashes: string[];
  evidence_count: number;
  attestation_count: number;
  decision_context?: string;
  anchored_by: string;
}
