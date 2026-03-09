/**
 * Solución para conflicto de window.ethereum
 */

interface EthereumProvider {
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  request: (args: any) => Promise<any>;
  on?: (event: string, callback: any) => void;
  removeListener?: (event: string, callback: any) => void;
}

// Use module augmentation instead of re-declaring
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace globalThis {
    // eslint-disable-next-line no-var
    var __ethereumProvider: EthereumProvider | undefined;
  }
}

export const initializeEthereumProvider = () => {
  const checkProviders = () => {
    const eth = (window as any).ethereum as EthereumProvider | undefined;
    if (eth) {
      if (eth.isMetaMask) {
        console.log('✅ MetaMask detectado como proveedor principal');
      } else if (eth.isRabby) {
        console.warn('⚠️ Rabby Wallet detectado.');
      } else if (eth.isCoinbaseWallet) {
        console.warn('⚠️ Coinbase Wallet detectado.');
      }
      return true;
    }
    console.info('ℹ️ window.ethereum no disponible.');
    return false;
  };

  checkProviders();
  setTimeout(checkProviders, 500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkProviders);
  }
};

export const getMetaMaskProvider = (): EthereumProvider | undefined => {
  const eth = (window as any).ethereum as EthereumProvider | undefined;
  if (eth?.isMetaMask) return eth;
  return undefined;
};

export const isMetaMaskAvailable = (): boolean => {
  return !!getMetaMaskProvider();
};
