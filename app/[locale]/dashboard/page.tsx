import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navbar from '../../components/Navbar';
import DashboardClient from './DashboardClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('tabOverview') };
}

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <DashboardClient />
    </>
  );
}
