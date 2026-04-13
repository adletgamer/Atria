/**
 * anchorService.ts
 * Primitive 8: Anchor — cryptographic commitment of evidence bundles on-chain.
 *
 * PATTERN:
 *   1. evidenceService gathers hashes off-chain and builds Merkle root.
 *   2. anchorService records the anchor in Supabase (off-chain record).
 *   3. anchorService submits root hash to MangoChainRegistry (on-chain).
 *   4. anchorService updates the Supabase record with chain_tx.
 *   5. Third party verifies: hash from evidence pack → verifyHash() on contract.
 *
 * On-chain = ONLY root hashes, attestation hashes, state snapshot hashes.
 * Off-chain = everything else (Supabase Postgres + Storage).
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { evidenceService } from "./evidenceService";
import type {
  ServiceResult,
  Anchor,
  CreateAnchorPayload,
  AnchorType,
  EvidencePack,
} from "@/types/consignment.types";

// MangoChainRegistry ABI (only the functions we need)
const REGISTRY_ABI = [
  {
    name: "commitAnchor",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_rootHash", type: "bytes32" },
      { name: "_anchorType", type: "uint8" },
      { name: "_scope", type: "bytes32" },
      { name: "_version", type: "uint32" },
    ],
    outputs: [{ name: "anchorIndex", type: "uint256" }],
  },
  {
    name: "verifyHash",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_rootHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getLatestAnchor",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_scope", type: "bytes32" }],
    outputs: [
      { name: "rootHash", type: "bytes32" },
      { name: "anchorType", type: "uint8" },
      { name: "version", type: "uint32" },
      { name: "submitter", type: "address" },
      { name: "anchoredAt", type: "uint64" },
    ],
  },
  {
    name: "verifyAndGet",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_rootHash", type: "bytes32" },
      { name: "_scope", type: "bytes32" },
      { name: "_version", type: "uint32" },
    ],
    outputs: [
      { name: "valid", type: "bool" },
      { name: "anchorType", type: "uint8" },
      { name: "submitter", type: "address" },
      { name: "anchoredAt", type: "uint64" },
    ],
  },
] as const;

// Anchor type enum mapping (matches Solidity enum order)
const ANCHOR_TYPE_TO_UINT8: Record<string, number> = {
  evidence_pack: 0,
  attestation: 1,
  state_snapshot: 2,
  custody_chain: 3,
  full_consignment: 4,
};

export const anchorService = {

  // ============================================
  // OFF-CHAIN ANCHOR RECORD (Supabase)
  // ============================================

  /**
   * Creates an anchor record in Supabase.
   * This is the off-chain record that references the on-chain commitment.
   * chain_tx is null until the on-chain transaction is confirmed.
   */
  async createAnchor(payload: CreateAnchorPayload): Promise<ServiceResult<Anchor>> {
    try {
      if (!payload.consignment_id || !payload.root_hash || !payload.anchor_type) {
        return { success: false, error: "consignment_id, root_hash, and anchor_type are required" };
      }

      const { data, error } = await supabase
        .from("anchors")
        .insert({
          consignment_id: payload.consignment_id,
          anchor_type: payload.anchor_type,
          root_hash: payload.root_hash,
          chain_tx: payload.chain_tx || null,
          chain_id: payload.chain_id || null,
          contract_address: payload.contract_address || null,
          anchor_scope: payload.anchor_scope || {},
          input_hashes: payload.input_hashes || [],
          version: payload.version,
        })
        .select()
        .single();

      if (error) {
        logger.error("anchor.create_failed", {}, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as unknown as Anchor };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Updates an anchor with the on-chain transaction hash after confirmation.
   */
  async updateChainTx(anchorId: string, chainTx: string, chainId: number): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("anchors")
        .update({
          chain_tx: chainTx,
          chain_id: chainId,
        })
        .eq("id", anchorId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Gets all anchors for a consignment.
   */
  async getConsignmentAnchors(consignmentId: string): Promise<ServiceResult<Anchor[]>> {
    try {
      const { data, error } = await supabase
        .from("anchors")
        .select("*")
        .eq("consignment_id", consignmentId)
        .order("version", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as unknown as Anchor[] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Gets the latest anchor of a specific type for a consignment.
   */
  async getLatestAnchor(consignmentId: string, anchorType: AnchorType): Promise<ServiceResult<Anchor | null>> {
    try {
      const { data, error } = await supabase
        .from("anchors")
        .select("*")
        .eq("consignment_id", consignmentId)
        .eq("anchor_type", anchorType)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as unknown as Anchor | null };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // ON-CHAIN OPERATIONS (via ethers / MetaMask)
  // ============================================

  /**
   * Full anchor flow:
   * 1. Generate evidence pack (Merkle root)
   * 2. Create off-chain anchor record
   * 3. Submit to smart contract on-chain
   * 4. Update off-chain record with chain_tx
   *
   * Requires MetaMask or wallet connection.
   */
  async anchorEvidencePack(
    consignmentId: string,
    contractAddress: string,
    chainId: number
  ): Promise<ServiceResult<{ anchor: Anchor; pack: EvidencePack; chainTx: string }>> {
    try {
      // 1. Generate evidence pack
      const packResult = await evidenceService.generateEvidencePack(consignmentId);
      if (!packResult.success || !packResult.data) {
        return { success: false, error: packResult.error || "Failed to generate evidence pack" };
      }
      const pack = packResult.data;

      // 2. Compute scope (keccak256 of consignment_id — no PII on-chain)
      const scope = await this.computeScope(consignmentId);

      // 3. Create off-chain anchor record (chain_tx = null initially)
      const anchorResult = await this.createAnchor({
        consignment_id: consignmentId,
        anchor_type: "evidence_pack",
        root_hash: pack.root_hash,
        chain_id: chainId,
        contract_address: contractAddress,
        anchor_scope: { consignment_id: consignmentId, case_number: pack.case_number },
        input_hashes: pack.input_hashes,
        version: pack.version,
      });

      if (!anchorResult.success || !anchorResult.data) {
        return { success: false, error: anchorResult.error || "Failed to create anchor record" };
      }

      // 4. Submit to on-chain contract
      const chainTx = await this.submitToChain(
        contractAddress,
        pack.root_hash,
        "evidence_pack",
        scope,
        pack.version
      );

      // 5. Update off-chain record with chain_tx
      if (chainTx) {
        await this.updateChainTx(anchorResult.data.id, chainTx, chainId);
        anchorResult.data.chain_tx = chainTx;
      }

      return {
        success: true,
        data: {
          anchor: anchorResult.data,
          pack,
          chainTx: chainTx || "",
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Submits a root hash to the MangoChainRegistry smart contract.
   * Returns the transaction hash, or null if wallet is not connected.
   */
  async submitToChain(
    contractAddress: string,
    rootHash: string,
    anchorType: string,
    scope: string,
    version: number
  ): Promise<string | null> {
    try {
      // Check for ethereum provider (MetaMask)
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        logger.warn("anchor.no_ethereum_provider", {});
        return null;
      }

      // Dynamic import of ethers to avoid bundling if not needed
      const { ethers } = await import("ethers");

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(contractAddress, REGISTRY_ABI, signer);

      // Convert rootHash (hex string) to bytes32
      const rootHashBytes = ethers.zeroPadValue(
        ethers.toBeHex("0x" + rootHash.replace(/^0x/, "").slice(0, 64)),
        32
      );

      // scope is already a bytes32
      const scopeBytes = ethers.zeroPadValue(
        ethers.toBeHex("0x" + scope.replace(/^0x/, "").slice(0, 64)),
        32
      );

      const anchorTypeUint8 = ANCHOR_TYPE_TO_UINT8[anchorType] ?? 0;

      const tx = await contract.commitAnchor(
        rootHashBytes,
        anchorTypeUint8,
        scopeBytes,
        version
      );

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      logger.error("anchor.onchain_failed", {}, error);
      return null;
    }
  },

  /**
   * Verifies a root hash exists on-chain.
   * Can be called by anyone (view function, no gas).
   */
  async verifyOnChain(
    contractAddress: string,
    rootHash: string
  ): Promise<ServiceResult<boolean>> {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        return { success: false, error: "No ethereum provider" };
      }

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(ethereum);
      const contract = new ethers.Contract(contractAddress, REGISTRY_ABI, provider);

      const rootHashBytes = ethers.zeroPadValue(
        ethers.toBeHex("0x" + rootHash.replace(/^0x/, "").slice(0, 64)),
        32
      );

      const exists = await contract.verifyHash(rootHashBytes);
      return { success: true, data: exists };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Computes a scope identifier from a consignment_id.
   * Uses keccak256 to avoid putting the raw UUID on-chain.
   */
  async computeScope(consignmentId: string): Promise<string> {
    // Use SHA-256 (available everywhere) as a deterministic scope hash
    return await evidenceService.sha256(`scope:${consignmentId}`);
  },
};
