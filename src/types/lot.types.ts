/**
 * Tipos TypeScript para el Core Schema V2
 * Entidades: Lot, LotAttribute, LotEvent, TrustState, QRVerification
 */

export interface Lot {
  id: string;
  lot_id: string;
  producer_id: string | null;
  origin_location: string;
  harvest_date: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LotAttribute {
  id: string;
  lot_id: string;
  attribute_key: string;
  attribute_value: string;
  value_type: 'string' | 'numeric' | 'boolean';
  source: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LotEvent {
  id: string;
  lot_id: string;
  event_type: string;
  event_category: 'lifecycle' | 'attribute_change' | 'verification' | 'custody';
  actor_id: string | null;
  location: string | null;
  description: string | null;
  metadata: Record<string, any>;
  occurred_at: string;
  created_at: string;
}

export interface TrustState {
  id: string;
  lot_id: string;
  trust_score: number;
  verification_count: number;
  evidence_count: number;
  last_verified_at: string | null;
  flags: any[];
  computed_at: string;
}

export interface QRVerification {
  id: string;
  lot_id: string;
  verified_at: string;
  device_fingerprint: string | null;
  location_data: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  metadata: Record<string, any>;
}

export interface LotWithDetails {
  lot_uuid: string;
  lot_id: string;
  producer_id: string | null;
  producer_name: string | null;
  origin_location: string;
  harvest_date: string | null;
  created_at: string;
  attributes: Record<string, string>;
  trust_score: number;
  verification_count: number;
  last_verified_at: string | null;
}

export interface TimelineEvent {
  event_id: string;
  event_type: string;
  event_category: string;
  description: string | null;
  location: string | null;
  actor_name: string | null;
  occurred_at: string;
}

export interface CreateLotPayload {
  lot_id: string;
  producer_id: string;
  origin_location: string;
  harvest_date?: string | null;
  attributes: Record<string, any>;
}

export interface CreateLotResult {
  success: boolean;
  data?: {
    lot_uuid: string;
    lot_id: string;
  };
  error?: string;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const STANDARD_ATTRIBUTES = {
  VARIETY: 'variety',
  QUALITY: 'quality',
  TOTAL_KG: 'total_kg',
  PRICE_PER_KG: 'price_per_kg',
  IS_LISTED: 'is_listed',
  WALLET_ADDRESS: 'wallet_address',
} as const;

export const EVENT_TYPES = {
  LOT_CREATED: 'lot.created',
  LOT_UPDATED: 'lot.updated',
  LOT_LISTED: 'lot.listed',
  LOT_UNLISTED: 'lot.unlisted',
  ATTRIBUTE_SET: 'lot.attribute_set',
  ATTRIBUTE_UPDATED: 'lot.attribute_updated',
  QR_SCANNED: 'lot.qr_scanned',
  CUSTODY_TRANSFERRED: 'lot.custody_transferred',
} as const;

export const EVENT_CATEGORIES = {
  LIFECYCLE: 'lifecycle',
  ATTRIBUTE_CHANGE: 'attribute_change',
  VERIFICATION: 'verification',
  CUSTODY: 'custody',
} as const;
