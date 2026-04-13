/**
 * hedera.ts — Hedera network configuration
 *
 * Uses environment variables for Topic ID and operator credentials.
 * Operator account signs all HCS messages.
 *
 * ⚠️  SECURITY WARNING — READ BEFORE DEPLOYING TO PRODUCTION
 * ─────────────────────────────────────────────────────────────
 * VITE_HEDERA_OPERATOR_KEY is a private key.
 * Any variable prefixed VITE_ is bundled into the browser's JavaScript at
 * build time and is readable by anyone who inspects the source.
 *
 * SAFE FOR:  Local development, demo environments, testnet exploration.
 * NOT SAFE FOR: Production deployments with real funds/mainnet credentials.
 *
 * PRODUCTION MIGRATION PATH:
 *   Move HCS submission to a Supabase Edge Function:
 *     supabase/functions/anchor-pack/index.ts
 *   Store HEDERA_OPERATOR_KEY (no VITE_ prefix) as a Supabase secret:
 *     supabase secrets set HEDERA_OPERATOR_KEY=<key>
 *   The Edge Function is called server-side; the private key never reaches
 *   the browser.  Set VITE_HEDERA_OPERATOR_KEY="" in production .env.
 *
 * This guard (`isClientSideHederaEnabled`) prevents accidental production use:
 *   - Returns false in production builds unless explicitly opted-in via
 *     VITE_HEDERA_ALLOW_CLIENT_SIDE=true (demo/hackathon override only).
 *   - Returns false if the operator key is absent.
 * ─────────────────────────────────────────────────────────────
 */

export interface HederaConfig {
  network: 'testnet' | 'mainnet';
  topicId: string;
  operatorId: string;
  /** ⚠️  Only populated in dev/demo. Empty in production by default. */
  operatorKey: string;
  mirrorNodeUrl: string;
}

const HEDERA_NETWORK = (import.meta.env.VITE_HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet';

/**
 * True only when it is safe to use client-side HCS submission:
 *  - Not a production build, OR
 *  - Explicitly opted-in via VITE_HEDERA_ALLOW_CLIENT_SIDE=true (hackathon mode)
 */
const clientSideSubmitAllowed: boolean =
  !import.meta.env.PROD ||
  import.meta.env.VITE_HEDERA_ALLOW_CLIENT_SIDE === 'true';

// In production without explicit opt-in, strip the key so it can never leak.
const operatorKey: string = clientSideSubmitAllowed
  ? (import.meta.env.VITE_HEDERA_OPERATOR_KEY || '')
  : '';

if (import.meta.env.PROD && !clientSideSubmitAllowed && import.meta.env.VITE_HEDERA_OPERATOR_KEY) {
  // Belt-and-suspenders: warn in console if someone tries to set the key in prod.
  console.warn(
    '[HarvestLink] VITE_HEDERA_OPERATOR_KEY is set but client-side Hedera submission ' +
    'is disabled in production. Migrate to Supabase Edge Function. ' +
    'See src/config/hedera.ts for migration instructions.'
  );
}

export const hederaConfig: HederaConfig = {
  network: HEDERA_NETWORK,
  topicId: import.meta.env.VITE_HEDERA_TOPIC_ID || '',
  operatorId: import.meta.env.VITE_HEDERA_OPERATOR_ID || '',
  operatorKey,
  mirrorNodeUrl: HEDERA_NETWORK === 'mainnet'
    ? 'https://mainnet.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com',
};

/**
 * Returns true when Hedera HCS submission is fully configured AND safe to use
 * from the browser context.
 *
 * Production deployments should migrate to an Edge Function and will see
 * this return false (intentionally), routing through the Edge Function path.
 */
export const isHederaConfigured = (): boolean => {
  return !!(
    clientSideSubmitAllowed &&
    hederaConfig.topicId &&
    hederaConfig.operatorId &&
    hederaConfig.operatorKey
  );
};

/**
 * Get HashScan explorer URL for a transaction
 */
export const getHashScanUrl = (transactionId: string): string => {
  const network = hederaConfig.network === 'mainnet' ? 'mainnet' : 'testnet';
  return `https://hashscan.io/${network}/transaction/${transactionId}`;
};

/**
 * Get HashScan explorer URL for a topic
 */
export const getTopicHashScanUrl = (): string => {
  const network = hederaConfig.network === 'mainnet' ? 'mainnet' : 'testnet';
  return `https://hashscan.io/${network}/topic/${hederaConfig.topicId}`;
};

/**
 * Get mirror node URL for a topic message by sequence number
 */
export const getMirrorNodeMessageUrl = (sequenceNumber: number): string => {
  return `${hederaConfig.mirrorNodeUrl}/api/v1/topics/${hederaConfig.topicId}/messages/${sequenceNumber}`;
};
