'use client';

import { useMutation } from '@tanstack/react-query';
import { auth } from '../api/auth';

export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: (email: string) => auth.requestPasswordReset(email),
  });
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: ({ email, token, newPassword }: { email: string; token: string; newPassword: string }) =>
      auth.confirmPasswordReset(email, token, newPassword),
  });
}
