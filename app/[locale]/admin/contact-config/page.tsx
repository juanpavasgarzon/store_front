import { redirect } from 'next/navigation';

export default function ContactConfigAdminPage() {
  redirect('/dashboard?tab=admin-contact');
}
