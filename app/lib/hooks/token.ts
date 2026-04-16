'use client';

import { useState, useEffect } from 'react';
import { getAccessToken } from '../api/client';

/**
 * Returns the stored access token, but only after the component has mounted
 * on the client. Returns null on the server AND on the first client render so
 * that React hydration sees identical output on both sides.
 *
 * Token becomes available after the first useEffect fires (i.e., after the
 * component has mounted), which triggers a re-render with the real value and
 * enables any queries that depend on it.
 */
export function useToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAccessToken());
  }, []);

  return token;
}
