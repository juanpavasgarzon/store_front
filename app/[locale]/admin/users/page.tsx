import { redirect } from 'next/navigation';

export default function UsersAdminPage() {
  redirect('/dashboard?tab=admin-users');
}
