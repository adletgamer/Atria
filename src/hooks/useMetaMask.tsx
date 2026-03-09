import { useEffect, useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

/**
 * Hook personalizado para gestionar la conexión de wallet con Wagmi
 * Proporciona una interfaz simplificada sobre los hooks de Wagmi
 */
export const useMetaMask = () => {
  const { address, isConnected, chain, isConnecting } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isNetworkValid, setIsNetworkValid] = useState(false);

  // Verificar si estamos en la red correcta
  useEffect(() => {
    if (isConnected && chain) {
      const isCorrectChain = chain.id === polygonAmoy.id;
      setIsNetworkValid(isCorrectChain);

      if (!isCorrectChain) {
        setError(`Red incorrecta. Por favor cambia a Polygon Amoy (${polygonAmoy.name})`);
      } else {
        setError(null);
      }
      return;
    }

    setIsNetworkValid(false);
  }, [isConnected, chain]);

  // Conectar wallet (con reintentos seguros)
  const connectWallet = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);

      // Reset connector state to avoid "connector already connected" error
      try { disconnect(); } catch {}

      const metamaskConnector =
        connectors.find((c) => c.id?.toLowerCase().includes('meta') || c.name?.toLowerCase().includes('metamask')) ||
        connectors.find((c) => c.id?.toLowerCase().includes('injected')) ||
        connectors[0];

      if (!metamaskConnector) {
        const errorMsg = 'MetaMask no se encontró. Por favor instálalo para continuar.';
        setError(errorMsg);
        toast({
          title: 'MetaMask no detectado',
          description: errorMsg,
          variant: 'destructive',
        });
        return null;
      }

      // Small delay to let disconnect settle
      await new Promise((r) => setTimeout(r, 200));

      const result = await connectAsync({ connector: metamaskConnector });
      const connectedAddress = result.accounts?.[0] || address || null;

      // Intentar cambiar red automáticamente si es necesario
      if (result.chainId !== polygonAmoy.id) {
        try {
          await switchChainAsync({ chainId: polygonAmoy.id });
        } catch {
          const errorMsg = 'Wallet conectada, pero en red incorrecta. Cambia a Polygon Amoy.';
          setError(errorMsg);
          toast({
            title: 'Red incorrecta',
            description: errorMsg,
            variant: 'destructive',
          });
        }
      }

      return connectedAddress;
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Error desconocido al conectar';
      const errorMsg = /rejected|denied|4001|already connect/i.test(raw)
        ? 'Conexión cancelada. Puedes intentar conectar de nuevo.'
        : raw;

      setError(errorMsg);
      toast({
        title: 'Error de conexión',
        description: errorMsg,
        variant: 'destructive',
        duration: 20000,
        action: (
          <ToastAction altText="Reintentar conexión" onClick={() => connectWallet()}
            className="inline-flex items-center gap-1.5 rounded-xl border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors whitespace-nowrap">
            🔄 Reintentar
          </ToastAction>
        ),
      });
      return null;
    }
  }, [connectors, connectAsync, disconnect, switchChainAsync, address, toast]);

  // Cambiar a la red correcta si es necesario
  const ensureCorrectNetwork = async (): Promise<boolean> => {
    if (!isConnected) return false;

    if (chain?.id !== polygonAmoy.id) {
      try {
        await switchChainAsync({ chainId: polygonAmoy.id });
        return true;
      } catch {
        const errorMsg = 'No se pudo cambiar a Polygon Amoy. Intenta manualmente.';
        setError(errorMsg);
        toast({
          title: 'Error de red',
          description: errorMsg,
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  // Desconectar wallet
  const disconnectWallet = (): void => {
    try {
      disconnect();
      setError(null);
      setIsNetworkValid(false);
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      toast({
        title: 'Desconectado',
        description: 'Has cerrado sesión exitosamente',
      });
    } catch {
      const errorMsg = 'Error al desconectar';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  // Formatear dirección para mostrar
  const formatAddress = (addr: string | undefined): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Persistir sesión activa
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
    }
  }, [isConnected, address]);

  return {
    account: address || null,
    isConnected: isConnected && isNetworkValid,
    error,
    isLoading: isPending || isConnecting,
    connectWallet,
    disconnectWallet,
    ensureCorrectNetwork,
    formatAddress,
    chain: chain?.name || null,
    isNetworkValid,
  };
};
