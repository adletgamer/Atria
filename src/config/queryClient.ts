import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient singleton para toda la aplicación
 * Evita múltiples instancias y conflictos de caché
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antes era cacheTime)
    },
  },
});
