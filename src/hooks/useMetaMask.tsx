import { useState, useEffect } from 'react';

export const useMetaMask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si MetaMask está instalado
  const checkMetaMask = (): boolean => {
    if (!window.ethereum) {
      setError('MetaMask no está instalado. Por favor instálalo para usar esta aplicación.');
      return false;
    }
    return true;
  };

  // Función para asegurar que estamos en Polygon Amoy
  const ensureCorrectNetwork = async (): Promise<boolean> => {
    try {
      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // Polygon Amoy chain ID
      const polygonAmoyChainId = '0x13882'; // 80002 en decimal
      
      if (currentChainId !== polygonAmoyChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: polygonAmoyChainId }],
          });
          return true;
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Red no agregada, la agregamos
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: polygonAmoyChainId,
                    chainName: 'Polygon Amoy Testnet',
                    rpcUrls: ['https://rpc-amoy.polygon.technology'],
                    blockExplorerUrls: ['https://amoy.polygonscan.com/'],
                    nativeCurrency: {
                      name: 'MATIC',
                      symbol: 'MATIC', 
                      decimals: 18,
                    },
                  },
                ],
              });
              return true;
            } catch (addError) {
              console.error('Error agregando Polygon Amoy:', addError);
              setError('Error configurando Polygon Amoy. Por favor agrégalo manualmente a MetaMask.');
              return false;
            }
          }
          console.error('Error cambiando a Polygon Amoy:', switchError);
          setError('Por favor cambia manualmente a Polygon Amoy Testnet en MetaMask.');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error verificando red:', error);
      return false;
    }
  };

  // Conectar wallet
  const connectWallet = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!checkMetaMask()) {
        setIsLoading(false);
        return null;
      }

      // Asegurar que estamos en Polygon Amoy
      const networkOk = await ensureCorrectNetwork();
      if (!networkOk) {
        setIsLoading(false);
        return null;
      }

      // Solicitar conexión de cuentas
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Guardar en localStorage
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', accounts[0]);
        
        setIsLoading(false);
        return accounts[0];
      }
      
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Error conectando wallet:', error);
      setError('Error al conectar la wallet: ' + (error as any).message);
      setIsLoading(false);
      return null;
    }
  };

  // Desconectar wallet
  const disconnectWallet = (): void => {
    setAccount(null);
    setIsConnected(false);
    setError(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
  };

  // Formatear dirección para mostrar
  const formatAddress = (address: string | null): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Verificar conexión existente al cargar
  useEffect(() => {
    const checkConnection = async () => {
      if (checkMetaMask() && localStorage.getItem('walletConnected')) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error verificando conexión:', error);
        }
      }
    };

    checkConnection();

    // Escuchar cambios de cuenta
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    account,
    isConnected,
    error,
    isLoading,
    connectWallet,
    disconnectWallet,
    formatAddress,
    checkMetaMask
  };
};

// Extender Window interface para TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}