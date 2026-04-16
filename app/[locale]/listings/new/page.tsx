import { getTranslations } from 'next-intl/server';
import Navbar from '../../../components/Navbar';
import { Link } from '../../../../i18n/navigation';
import NewListingForm from './NewListingForm';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('newListing');
  return { title: t('title') };
}

export default async function NewListingPage() {
  const t = await getTranslations('newListing');
  return (
    <>
      <Navbar />
      <div className="container-narrow" style={{ padding: '48px 24px 80px', flex: 1 }}>
        <Link
          href="/dashboard"
          style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}
        >
          {t('backToDashboard')}
        </Link>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 300 }}>
            {t('title')}
          </h1>
        </div>
        <NewListingForm />
      </div>
    </>
  );
}
