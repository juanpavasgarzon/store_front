import { apiFetch } from './client';

interface ContactConfigResponse {
  id: string;
  recipientEmail: string;
  subjectTemplate: string | null;
  messageTemplate: string | null;
}

export const contactConfig = {
  get: (token: string) =>
    apiFetch<ContactConfigResponse>('/contact/config', { token }),

  update: (token: string, data: {
    recipientEmail: string;
    subjectTemplate?: string;
    messageTemplate?: string;
  }) =>
    apiFetch<Omit<ContactConfigResponse, 'id'>>('/contact/config', {
      method: 'PUT', body: JSON.stringify(data), token,
    }),
};
