import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect('/dashboard?tab=admin-categories');
}
