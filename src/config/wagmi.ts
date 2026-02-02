import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygonAmoy } from 'wagmi/chains';
import { http } from 'viem';

/**
 * Configuración centralizada de Wagmi + RainbowKit
 * 
 * Para agregar RPC providers adicionales:
 * 1. Configura URLs en .env.local con VITE_RPC_URL_PRIMARY, VITE_RPC_URL_SECONDARY
 * 2. Mantén un fallback público para desarrollo
 * 
 * Seguridad:
 * - Las RPC privadas NUNCA deben estar expuestas en variables públicas
 * - Usa .env.local para llaves sensibles (incluido en .gitignore)
 */

// RPC URLs con fallback
const rpcUrl = import.meta.env.VITE_POLYGON_AMOY_RPC 
  || 'https://rpc-amoy.polygon.technology'; // Fallback oficial

// Crear configuración
let wagmiConfig;

try {
  wagmiConfig = getDefaultConfig({
    appName: 'MangoChain - Supply Chain Tracking',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'default-project-id',
    chains: [polygonAmoy],
    transports: {
      [polygonAmoy.id]: http(rpcUrl),
    },
    ssr: false, // Desabilitar SSR para aplicaciones del lado del cliente
  });
} catch (error) {
  console.warn('Error initializing Wagmi config, using fallback:', error);
  // Usar configuración fallback en caso de error
  wagmiConfig = getDefaultConfig({
    appName: 'MangoChain - Supply Chain Tracking',
    projectId: 'default-project-id',
    chains: [polygonAmoy],
    transports: {
      [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
    },
    ssr: false,
  });
}

export default wagmiConfig;

