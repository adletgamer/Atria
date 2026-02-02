import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook personalizado para gestionar la conexión de wallet con Wagmi
 * Proporciona una interfaz simplificada sobre los hooks de Wagmi
 * 
 * Características:
 * - Manejo automático de cambios de red (Polygon Amoy)
 * - Persistencia de sesión con localStorage
 * - Mensajes de error claros y localizados
 * - Sincronización automática con cambios de cuenta
 */
export const useMetaMask = () => {
  const { address, isConnected, chain, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isNetworkValid, setIsNetworkValid] = useState(false);

  // Verificar si estamos en la red correcta
  useEffect(() => {
    if (isConnected && chain) {
      const isCorrectChain = chain.id === polygonAmoy.id;
      setIsNetworkValid(isCorrectChain);

      if (!isCorrectChain) {
        setError(
          `Red incorrecta. Por favor cambia a Polygon Amoy (${polygonAmoy.name})`
        );
      } else {
        setError(null);
      }
    }
  }, [isConnected, chain]);

  // Conectar wallet
  const connectWallet = async (): Promise<string | null> => {
    try {
      setError(null);

      // Encontrar MetaMask connector
      const metamaskConnector = connectors.find(
        (c) => c.name === 'MetaMask'
      );

      if (!metamaskConnector) {
        const errorMsg =
          'MetaMask no se encontró. Por favor instálalo para continuar.';
        setError(errorMsg);
        toast({
          title: 'MetaMask no detectado',
          description: errorMsg,
          variant: 'destructive',
        });
        return null;
      }

      // Conectar
      connect({ connector: metamaskConnector });

      return address || null;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error desconocido al conectar';
      setError(errorMsg);
      toast({
        title: 'Error de conexión',
        description: errorMsg,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Cambiar a la red correcta si es necesario
  const ensureCorrectNetwork = async (): Promise<boolean> => {
    if (!isConnected) return false;

    if (chain?.id !== polygonAmoy.id) {
      try {
        switchChain({ chainId: polygonAmoy.id });
        return true;
      } catch (err) {
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
    } catch (err) {
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
