import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NewListingForm from './NewListingForm';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Nuevo anuncio' };
}

export default function NewListingPage() {
  return (
    <>
      <Navbar />
      <div className="container-narrow" style={{ padding: '48px 24px 80px', flex: 1 }}>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground no-underline hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={13} />
          Volver al panel
        </Link>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            Crear anuncio
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 300 }}>
            Nuevo anuncio
          </h1>
        </div>
        <NewListingForm />
      </div>
    </>
  );
}
