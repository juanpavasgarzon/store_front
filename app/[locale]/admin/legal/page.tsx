import { redirect } from 'next/navigation';

export default function LegalAdminPage() {
  redirect('/dashboard?tab=admin-legal');
}
