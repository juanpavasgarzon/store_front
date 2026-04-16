import { redirect } from 'next/navigation';

export default function AdminCategoriesPage() {
  redirect('/dashboard?tab=admin-categories');
}
