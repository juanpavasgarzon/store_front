'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { sileo } from 'sileo';
import { ApiError } from '../lib/api';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          // Don't retry on auth errors or not-found
          if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
            return false;
          }
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        onError: (error) => {
          if (error instanceof ApiError) {
            if (error.status === 401 || error.status === 403) {
              sileo.error({ title: 'Sin permisos', description: 'Debes iniciar sesión para continuar.' });
            } else if (error.status >= 500) {
              sileo.error({ title: 'Error del servidor', description: 'Algo salió mal. Intenta de nuevo.' });
            }
            // 400/409 errors are handled at the mutation call site
          }
        },
      },
    },
  });
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
