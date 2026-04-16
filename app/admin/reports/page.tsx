import { redirect } from 'next/navigation';

export default function ReportsAdminPage() {
  redirect('/dashboard?tab=admin-reports');
}
