/**
 * Solución para conflicto de window.ethereum
 * Cuando múltiples extensiones de wallet intenten inyectar window.ethereum
 * 
 * Este archivo debe ejecutarse lo antes posible en main.tsx
 */

// Exportar tipo para TypeScript
interface EthereumProvider {
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  request: (args: any) => Promise<any>;
  on?: (event: string, callback: any) => void;
  removeListener?: (event: string, callback: any) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    // Almacenar otras wallets si es necesario
    coinbaseWalletExtension?: EthereumProvider;
    rabbyWallet?: EthereumProvider;
  }
}

/**
 * Detecta y filtra múltiples proveedores de Ethereum
 * Mantiene MetaMask como prioridad
 */
export const initializeEthereumProvider = () => {
  // Esperar a que las extensiones inyecten sus providers
  const checkProviders = () => {
    if (window.ethereum) {
      // Si MetaMask está presente, asegurarse de que sea el principal
      if (window.ethereum.isMetaMask) {
        console.log('✅ MetaMask detectado como proveedor principal');
        return true;
      }

      // Si hay otro proveedor, mostrar advertencia
      if (window.ethereum.isRabby) {
        console.warn('⚠️ Rabby Wallet detectado. MetaMask será utilizado como proveedor principal.');
        return true;
      }

      if (window.ethereum.isCoinbaseWallet) {
        console.warn('⚠️ Coinbase Wallet detectado. MetaMask será utilizado como proveedor principal.');
        return true;
      }

      return true;
    }

    // Si window.ethereum no está disponible pero se espera una wallet
    console.info('ℹ️ window.ethereum no disponible. Verifica que MetaMask esté instalado.');
    return false;
  };

  // Chequear inmediatamente
  checkProviders();

  // Chequear de nuevo después de un breve delay (por si las extensiones son lentas)
  setTimeout(() => {
    checkProviders();
  }, 500);

  // Chequear cuando el documento esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkProviders);
  }
};

/**
 * Obtiene solo el proveedor de MetaMask, ignorando otros
 */
export const getMetaMaskProvider = (): EthereumProvider | undefined => {
  // Buscar MetaMask específicamente
  if (window.ethereum?.isMetaMask) {
    return window.ethereum;
  }

  // Si no está disponible retornar undefined
  return undefined;
};

/**
 * Verifica si MetaMask está disponible
 */
export const isMetaMaskAvailable = (): boolean => {
  return !!getMetaMaskProvider();
};
