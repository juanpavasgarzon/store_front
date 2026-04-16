import { notFound } from 'next/navigation';
import { Link } from '../../../../i18n/navigation';
import { legal } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const doc = await legal.get(slug);
    return { title: doc.title };
  } catch {
    return { title: 'Documento legal' };
  }
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;

  let doc;
  try {
    doc = await legal.get(slug);
  } catch {
    notFound();
  }

  return (
    <>
      <Navbar />
      <div className="container-narrow" style={{ padding: '48px 24px 80px', flex: 1 }}>
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Inicio</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-secondary)' }}>{doc.title}</span>
        </nav>

        <article>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            LEGAL
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300, marginBottom: 8 }}>
            {doc.title}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 40 }}>
            Actualizado el {new Date(doc.updatedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '32px 36px',
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.9,
              whiteSpace: 'pre-wrap',
            }}
          >
            {doc.content}
          </div>
        </article>
      </div>
    </>
  );
}
