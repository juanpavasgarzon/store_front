// Middleware (next-intl) redirects / → /en or /es automatically.
// This file exists only as a safety fallback.
import { redirect } from 'next/navigation';
export default function RootPage() {
  redirect('/es');
}
